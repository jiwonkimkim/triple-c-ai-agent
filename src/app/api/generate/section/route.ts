import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import {
  preprocessProductImage,
  GeminiImageModel,
  DEFAULT_IMAGE_MODEL,
} from '@/services/image/gemini-image-generator';
// ★★★ 공유 섹션 이미지 서비스 (초기 생성/전체 재생성/섹션 재생성 모두 동일한 프로세스)
import { generateSectionImage } from '@/services/image/section-image-service';
// ★★★ 공통 프롬프트 빌드 모듈 (초기 생성과 동일한 프로세스 보장)
import { buildSectionPrompt } from '@/services/ai/section-prompt-builder';
import type { BrandContext } from '@/services/ai/prompts';
import type { BeautySubCategory } from '@/services/ai/prompts/beauty-subcategory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60초 타임아웃

// 요청 스키마
const regenerateSectionSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sectionType: z.string().min(1, 'Section type is required'),
  sectionIndex: z.number().min(0, 'Section index must be >= 0'),
  imageModel: z.enum(['gemini-2.5-flash-image', 'gemini-3-pro-image-preview']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = regenerateSectionSchema.parse(body);

    // 프로젝트 정보 조회
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: {
        id: true,
        productName: true,
        category: true,
        subCategory: true,  // ★ 뷰티 서브카테고리 (skincare, lip 등)
        keyFeatures: true,
        targetAudience: true,
        productImages: true,
        imageModel: true,
        brandProfile: {
          select: {
            name: true,           // ★ 브랜드명
            identity: true,       // ★ 브랜드 아이덴티티
            toneAndManner: true,  // ★ 톤앤매너
            imageKeywords: true,  // ★ 이미지 키워드
            styleGuide: true,     // ★ 스타일 가이드 (색상 등)
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // ★★★ 텍스트 배경 섹션 감지 (제품 이미지 불필요)
    const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(
      validatedData.sectionType
    );

    // ★★★ T2I 모드 감지: 제품 이미지가 없으면 T2I 모드로 재생성
    // (제품 이미지 없이 생성된 프로젝트는 T2I 모드로 재생성 가능)
    const hasProductImages = project.productImages && project.productImages.length > 0;
    const isT2IMode = !hasProductImages;

    if (isT2IMode) {
      console.log('[Section Regenerate] ★★★ T2I MODE: No product images - using text-to-image regeneration');
    }

    const productImageUrl = project.productImages?.[0] || '';
    // ★★★ 모델 우선순위: 요청 > 프로젝트 저장값 > 기본값
    // 프로젝트에서 프로 모델을 사용했으면 재생성에서도 프로 모델 사용!
    const imageModel = (validatedData.imageModel || project.imageModel || DEFAULT_IMAGE_MODEL) as GeminiImageModel;

    console.log(`[Section Regenerate] Starting regeneration for ${validatedData.sectionType}`);
    console.log(`[Section Regenerate] ★★★ Image Model: ${imageModel} (project: ${project.imageModel || 'not set'}, request: ${validatedData.imageModel || 'not set'})`);
    console.log(`[Section Regenerate] Project: ${project.id}, Product: ${project.productName}`);
    console.log(`[Section Regenerate] Is text background section: ${isTextBackgroundSection}`);
    if (productImageUrl) {
      console.log(`[Section Regenerate] Product image: ${productImageUrl}`);
    }

    // 제품 이미지 전처리 (배경 제거) - 텍스트 배경 섹션은 건너뜀
    let cleanProductImage: string = '';
    if (!isTextBackgroundSection && productImageUrl) {
      try {
        console.log('[Section Regenerate] Preprocessing product image (background removal)...');
        cleanProductImage = await preprocessProductImage(productImageUrl, imageModel);
        console.log('[Section Regenerate] Product image preprocessed successfully');
      } catch (preprocessError) {
        console.error('[Section Regenerate] Failed to preprocess image:', preprocessError);
        // 전처리 실패 시 원본 이미지 사용
        cleanProductImage = productImageUrl;
      }
    } else if (isTextBackgroundSection) {
      console.log('[Section Regenerate] ★ Text background section - skipping product image preprocessing');
    }

    // ★★★ 브랜드 컨텍스트 구성 (초기 생성과 동일한 구조!)
    const brandContext: BrandContext | null = project.brandProfile ? {
      name: project.brandProfile.name,
      identity: project.brandProfile.identity,
      toneAndManner: project.brandProfile.toneAndManner,
      imageKeywords: project.brandProfile.imageKeywords || [],
      styleGuide: project.brandProfile.styleGuide as BrandContext['styleGuide'],
    } : null;

    // ★★★ 프로젝트의 최신 버전에서 섹션 텍스트 데이터 가져오기
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
      select: { content: true },
    });
    type SectionData = { type: string; title?: string; body?: string };
    const sections = (latestVersion?.content as { sections?: SectionData[] } | null)?.sections || [];
    const existingSection = sections.find((s: SectionData) =>
      s.type?.toUpperCase() === validatedData.sectionType.toUpperCase()
    );

    // ★★★ 공통 프롬프트 빌드 모듈 사용 (초기 생성과 동일한 프로세스!)
    // section-prompt-builder.ts를 수정하면 초기 생성/재생성 모두에 자동 적용됨
    console.log(`[Section Regenerate] ★ Using shared buildSectionPrompt module...`);
    const promptResult = await buildSectionPrompt({
      sectionType: validatedData.sectionType,
      sectionIndex: validatedData.sectionIndex,
      productName: project.productName || 'Product',
      category: project.category || 'General',
      subCategory: project.subCategory as BeautySubCategory | undefined,
      keyFeatures: project.keyFeatures || [],
      targetAudience: project.targetAudience || '일반 소비자',
      brandContext,
      sectionText: {
        title: existingSection?.title,
        body: existingSection?.body,
      },
    });

    console.log(`[Section Regenerate] ★ Prompt built with palette: ${promptResult.colorPalette.name}, background: ${promptResult.backgroundHex}`);
    // ★★★ 브랜드 정보 디버깅 로그
    console.log(`[Section Regenerate] ★★★ Brand Context: ${brandContext ? brandContext.name : 'NULL'}`);
    console.log(`[Section Regenerate] ★★★ Brand Style Prompt: ${promptResult.brandStylePrompt ? promptResult.brandStylePrompt.substring(0, 150) + '...' : 'EMPTY'}`);
    console.log(`[Section Regenerate] ★★★ Enhanced Scenario Prompt (first 200): ${promptResult.enhancedScenarioPrompt.substring(0, 200)}...`);

    // ★★★ 공유 섹션 이미지 서비스 사용 (초기 생성/전체 재생성/섹션 재생성 동일 프로세스)
    // T2I/I2I 모드 감지, 재시도 로직, 이미지 업로드가 모두 서비스 내부에서 처리됨
    console.log(`[Section Regenerate] Using shared section image service (mode: ${isT2IMode ? 'T2I' : 'I2I'})`);

    const result = await generateSectionImage({
      productImage: cleanProductImage,
      sectionType: validatedData.sectionType,
      productName: project.productName || 'Product',
      category: project.category || 'General',
      keyFeatures: project.keyFeatures || [],
      targetAudience: project.targetAudience || '일반 소비자',
      imageModel,
      brandImageKeywords: promptResult.additionalPrompt,
      imagePrompt: promptResult.enhancedScenarioPrompt,
      blockIndex: validatedData.sectionIndex,
      totalBlocks: 1,
    });

    if (!result.success || !result.imageUrl) {
      return NextResponse.json(
        { success: false, error: result.error || '이미지 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log(`[Section Regenerate] Image generated and uploaded: ${result.imageUrl}`);
    console.log(`[Section Regenerate] Overlay text generated:`, JSON.stringify(result.overlayText).substring(0, 200));

    // ★★★ 오버레이 텍스트에 브랜드 폰트/로고 정보 추가 (공통 모듈에서 가져온 값 사용)
    const enhancedOverlayText = result.overlayText ? {
      ...result.overlayText,
      brandFont: promptResult.brandFont,
      brandLogoUrl: promptResult.brandLogoUrl,
    } : undefined;

    if (enhancedOverlayText?.brandFont) {
      console.log(`[Section Regenerate] ★ Brand font added: ${enhancedOverlayText.brandFont}`);
    }

    // ★★★ DB에 devPrompts 업데이트 (섹션 재생성 후에도 프롬프트 유지)
    let updatedDevPrompts = null;
    try {
      // ★★★ projectVersion 테이블에서 조회 (devPrompts가 저장된 곳)
      const latestVersion = await prisma.projectVersion.findFirst({
        where: { projectId: project.id },
        orderBy: { versionNumber: 'desc' },
        select: { id: true, content: true },
      });

      if (latestVersion) {
        const existingContent = latestVersion.content as {
          sections?: unknown[];
          hookMessage?: string;
          devPrompts?: {
            textGeneration?: { systemPrompt: string; userPrompt: string };
            sectionImagePrompts?: Array<{
              sectionType: string;
              imagePrompt: string;
              [key: string]: unknown;
            }>;
            overlayTextPrompts?: Array<{
              sectionType: string;
              blockIndex: number;
              overlayPrompt: string;
              generatedOverlay?: unknown;
            }>;
          };
        } | null;

        // 새 섹션 프롬프트 데이터 (★★★ 모든 프롬프트 구성요소 저장!)
        const promptComponents = result.imageResult?.promptComponents;
        const newSectionPrompt = {
          sectionType: validatedData.sectionType,
          // ★★★ [1] 섹션별 프롬프트 ★★★
          sectionBasePrompt: promptComponents?.sectionBasePrompt,
          orchestrationPrompt: promptComponents?.orchestrationPrompt,
          i2iSystemPrompt: promptComponents?.i2iSystemPrompt,
          // ★★★ [2] 카테고리별 프롬프트 (뷰티 서브카테고리) ★★★
          categoryPrompt: promptComponents?.categoryPrompt,
          subCategory: project.subCategory,
          // ★★★ [3] 오버레이 텍스트 관련 프롬프트 ★★★
          overlayTextPrompt: promptComponents?.overlayTextPrompt,
          overlayGuidePrompt: promptComponents?.overlayGuidePrompt,
          // ★★★ [4] 공통 프롬프트 (Flash 모델 전용) ★★★
          noTextReinforcement: promptComponents?.noTextReinforcement,
          // ★★★ 최종 결합 프롬프트 ★★★
          imagePrompt: [
            promptComponents?.sectionBasePrompt,
            promptComponents?.orchestrationPrompt,
            promptComponents?.i2iSystemPrompt,
          ].filter(Boolean).join('\n\n---\n\n') || `${validatedData.sectionType} section image`,
          generatedImageUrl: result.imageUrl,
          overlayText: enhancedOverlayText,  // ★ 브랜드 폰트/로고 포함
          overlayPrompt: result.overlayPrompt,
        };

        // 기존 devPrompts 가져오거나 새로 생성
        const existingDevPrompts = existingContent?.devPrompts || {
          textGeneration: {
            systemPrompt: '(이전 생성 시 저장되지 않음)',
            userPrompt: '(이전 생성 시 저장되지 않음)',
          },
          sectionImagePrompts: [],
          overlayTextPrompts: [],
        };

        // 해당 섹션이 이미 있는지 확인
        const existingSectionIndex = existingDevPrompts.sectionImagePrompts?.findIndex(
          (p) => p.sectionType === validatedData.sectionType
        ) ?? -1;

        let updatedSectionImagePrompts;
        if (existingSectionIndex >= 0 && existingDevPrompts.sectionImagePrompts) {
          // 기존 섹션 업데이트
          updatedSectionImagePrompts = existingDevPrompts.sectionImagePrompts.map((p, idx) =>
            idx === existingSectionIndex ? { ...p, ...newSectionPrompt } : p
          );
        } else {
          // 새 섹션 추가
          updatedSectionImagePrompts = [
            ...(existingDevPrompts.sectionImagePrompts || []),
            newSectionPrompt,
          ];
        }

        // ★★★ overlayTextPrompts 배열도 업데이트 (오버레이 텍스트 탭용)
        const newOverlayTextPrompt = {
          sectionType: validatedData.sectionType,
          blockIndex: validatedData.sectionIndex,
          overlayPrompt: result.overlayPrompt || '',
          generatedOverlay: enhancedOverlayText,
        };

        const existingOverlayIndex = (existingDevPrompts.overlayTextPrompts || []).findIndex(
          (p: { sectionType: string }) => p.sectionType === validatedData.sectionType
        );

        let updatedOverlayTextPrompts;
        if (existingOverlayIndex >= 0) {
          updatedOverlayTextPrompts = (existingDevPrompts.overlayTextPrompts || []).map(
            (p: { sectionType: string }, idx: number) =>
              idx === existingOverlayIndex ? newOverlayTextPrompt : p
          );
        } else {
          updatedOverlayTextPrompts = [
            ...(existingDevPrompts.overlayTextPrompts || []),
            newOverlayTextPrompt,
          ];
        }

        // ★ 전체 업데이트된 devPrompts 저장
        updatedDevPrompts = {
          ...existingDevPrompts,
          sectionImagePrompts: updatedSectionImagePrompts,
          overlayTextPrompts: updatedOverlayTextPrompts,
        };

        // DB 업데이트 (JSON 타입 호환을 위해 깊은 복사)
        const updatedContent = JSON.parse(JSON.stringify({
          ...existingContent,
          devPrompts: updatedDevPrompts,
        }));

        // ★★★ projectVersion 테이블 업데이트
        await prisma.projectVersion.update({
          where: { id: latestVersion.id },
          data: {
            content: updatedContent,
          },
        });

        console.log(`[Section Regenerate] DevPrompts saved to DB for section ${validatedData.sectionType}`);
        console.log(`[Section Regenerate] Total sections in devPrompts: ${updatedSectionImagePrompts.length}`);
      }
    } catch (dbError) {
      console.error('[Section Regenerate] Failed to update devPrompts in DB:', dbError);
      // DB 업데이트 실패해도 이미지 생성은 성공했으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      data: {
        sectionType: validatedData.sectionType,
        sectionIndex: validatedData.sectionIndex,
        imageUrl: result.imageUrl,
        promptComponents: result.imageResult?.promptComponents,
        // ★★★ 오버레이 텍스트도 반환 (브랜드 폰트/로고 포함)
        overlayText: enhancedOverlayText,
        overlayPrompt: result.overlayPrompt,
        // ★★★ 전체 업데이트된 devPrompts 반환 (기존 섹션 + 새 섹션)
        updatedDevPrompts,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Section Regenerate] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
