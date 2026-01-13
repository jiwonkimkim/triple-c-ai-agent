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

    // 제품 이미지 확인
    if (!project.productImages || project.productImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '제품 이미지가 없습니다. 프로젝트에 제품 이미지를 먼저 등록해주세요.' },
        { status: 400 }
      );
    }

    const productImageUrl = project.productImages[0];
    const imageModel = (validatedData.imageModel || project.imageModel || DEFAULT_IMAGE_MODEL) as GeminiImageModel;

    console.log(`[Section Regenerate] Starting regeneration for ${validatedData.sectionType}`);
    console.log(`[Section Regenerate] Project: ${project.id}, Product: ${project.productName}`);
    console.log(`[Section Regenerate] Product image: ${productImageUrl}`);

    // 제품 이미지 전처리 (배경 제거)
    let cleanProductImage: string;
    try {
      console.log('[Section Regenerate] Preprocessing product image (background removal)...');
      cleanProductImage = await preprocessProductImage(productImageUrl, imageModel);
      console.log('[Section Regenerate] Product image preprocessed successfully');
    } catch (preprocessError) {
      console.error('[Section Regenerate] Failed to preprocess image:', preprocessError);
      // 전처리 실패 시 원본 이미지 사용
      cleanProductImage = productImageUrl;
    }

    // 브랜드 스타일에서 이미지 키워드 추출
    const brandStyle = project.brandProfile?.styleGuide as { imageKeywords?: string[] } | null;
    const additionalPrompt = brandStyle?.imageKeywords?.join(', ');

    // ★★★ 섹션 이미지 + 오버레이 텍스트 통합 재생성 (NEW!)
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
        scenarioPrompt: undefined, // 섹션 재생성 시에는 새로운 시나리오 생성
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

    return NextResponse.json({
      success: true,
      data: {
        sectionType: validatedData.sectionType,
        sectionIndex: validatedData.sectionIndex,
        imageUrl: uploadResult.url,
        promptComponents: result.image.promptComponents,
        // ★★★ 오버레이 텍스트도 반환 (NEW!)
        overlayText: result.overlayText,
        overlayPrompt: result.overlayPrompt,
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
