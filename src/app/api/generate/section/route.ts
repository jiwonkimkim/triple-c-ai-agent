import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import {
  generateSectionImageWithOverlay,
  preprocessProductImage,
  GeminiImageModel,
  DEFAULT_IMAGE_MODEL,
} from '@/services/image/gemini-image-generator';
import { uploadGeneratedImage } from '@/services/image/image-upload-service';
import { generateSectionImagePromptFromText } from '@/services/ai/orchestration-service';
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
            styleGuide: true,
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

    // 제품 이미지 확인 (텍스트 배경 섹션은 제외)
    if (!isTextBackgroundSection && (!project.productImages || project.productImages.length === 0)) {
      return NextResponse.json(
        { success: false, error: '제품 이미지가 없습니다. 프로젝트에 제품 이미지를 먼저 등록해주세요.' },
        { status: 400 }
      );
    }

    const productImageUrl = project.productImages?.[0] || '';
    const imageModel = (validatedData.imageModel || project.imageModel || DEFAULT_IMAGE_MODEL) as GeminiImageModel;

    console.log(`[Section Regenerate] Starting regeneration for ${validatedData.sectionType}`);
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

    // 브랜드 스타일에서 이미지 키워드 추출
    const brandStyle = project.brandProfile?.styleGuide as { imageKeywords?: string[] } | null;
    const additionalPrompt = brandStyle?.imageKeywords?.join(', ');

    // ★★★ 섹션 오케스트레이션 프롬프트 생성 (초기 생성과 동일한 프로세스!)
    // 1. 프로젝트의 최신 버전에서 섹션 데이터 가져오기
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
      select: { content: true },
    });

    // 섹션 타입에 해당하는 섹션 찾기
    type SectionData = { type: string; title?: string; body?: string };
    const sections = (latestVersion?.content as { sections?: SectionData[] } | null)?.sections || [];
    const existingSection = sections.find((s: SectionData) =>
      s.type?.toUpperCase() === validatedData.sectionType.toUpperCase()
    );

    // 2. 오케스트레이션 프롬프트 생성 (초기 생성과 동일한 함수 사용!)
    console.log(`[Section Regenerate] ★ Generating orchestration prompt for ${validatedData.sectionType}...`);
    console.log(`[Section Regenerate] ★ SubCategory: ${project.subCategory || 'none'}`);
    const sectionPrompt = await generateSectionImagePromptFromText(
      {
        type: validatedData.sectionType,
        title: existingSection?.title || validatedData.sectionType,
        body: existingSection?.body || '',
      },
      project.productName || 'Product',
      project.category || 'General',
      project.keyFeatures || [],
      project.targetAudience || '일반 소비자',
      additionalPrompt,  // brandStyle
      undefined,         // visualReference
      undefined,         // visualTheme
      undefined,         // indexBasedPrompt
      project.subCategory as BeautySubCategory | undefined,  // ★ 뷰티 서브카테고리 전달!
      validatedData.sectionIndex  // blockIndex
    );

    console.log(`[Section Regenerate] ★ Orchestration prompt: ${sectionPrompt.imagePrompt.substring(0, 150)}...`);

    // ★★★ 섹션 이미지 + 오버레이 텍스트 통합 재생성
    console.log(`[Section Regenerate] Generating ${validatedData.sectionType} image with overlay text...`);
    const result = await generateSectionImageWithOverlay(
      cleanProductImage,
      validatedData.sectionType,
      project.productName || 'Product',
      project.category || 'General',
      project.keyFeatures || [],
      project.targetAudience || '일반 소비자',
      {
        additionalPrompt,
        model: imageModel,
        scenarioPrompt: sectionPrompt.imagePrompt,  // ★ 오케스트레이션 프롬프트 전달!
        blockIndex: validatedData.sectionIndex,
        totalBlocks: 1,
      }
    );

    if (!result || !result.image) {
      return NextResponse.json(
        { success: false, error: '이미지 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 생성된 이미지 업로드
    console.log('[Section Regenerate] Uploading generated image...');
    const uploadResult = await uploadGeneratedImage(result.image, {
      folder: 'sections',
      projectId: project.id,
    });

    if (!uploadResult.url) {
      return NextResponse.json(
        { success: false, error: '이미지 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log(`[Section Regenerate] Image uploaded successfully: ${uploadResult.url}`);
    console.log(`[Section Regenerate] Overlay text generated:`, JSON.stringify(result.overlayText).substring(0, 200));

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
          };
        } | null;

        // 새 섹션 프롬프트 데이터
        const newSectionPrompt = {
          sectionType: validatedData.sectionType,
          fixedPrompt: result.image.promptComponents?.fixedPrompt,
          dynamicPrompt: result.image.promptComponents?.dynamicPrompt,
          imagePrompt: [
            result.image.promptComponents?.fixedPrompt,
            result.image.promptComponents?.dynamicPrompt,
          ].filter(Boolean).join('\n\n---\n\n') || `${validatedData.sectionType} section image`,
          generatedImageUrl: uploadResult.url,
          overlayText: result.overlayText,
          overlayPrompt: result.overlayPrompt,
        };

        // 기존 devPrompts 가져오거나 새로 생성
        const existingDevPrompts = existingContent?.devPrompts || {
          textGeneration: {
            systemPrompt: '(이전 생성 시 저장되지 않음)',
            userPrompt: '(이전 생성 시 저장되지 않음)',
          },
          sectionImagePrompts: [],
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

        // ★ 전체 업데이트된 devPrompts 저장
        updatedDevPrompts = {
          ...existingDevPrompts,
          sectionImagePrompts: updatedSectionImagePrompts,
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
        imageUrl: uploadResult.url,
        promptComponents: result.image.promptComponents,
        // ★★★ 오버레이 텍스트도 반환
        overlayText: result.overlayText,
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
