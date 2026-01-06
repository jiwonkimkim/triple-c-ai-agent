import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import {
  generateSectionImageWithGemini,
  isSDModel,
  DEFAULT_IMAGE_MODEL,
  type GeminiImageModel,
} from '@/services/image/gemini-image-generator';
import { uploadGeneratedImage } from '@/services/image/image-upload-service';

export const dynamic = 'force-dynamic';

// 요청 스키마
const regenerateSectionImageSchema = z.object({
  projectId: z.string(),
  versionId: z.string(),
  sectionId: z.string(),
  sectionType: z.enum(['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ']),
  productName: z.string(),
  category: z.string(),
  keyFeatures: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  imageModel: z.string().optional(),
});

// POST /api/generate/section-image - 섹션별 이미지 재생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, trialCredits: true, credits: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = regenerateSectionImageSchema.parse(body);

    // 프로젝트 접근 권한 확인
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { id: true, ownerId: true, workspaceId: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No access to this project' },
        { status: 403 }
      );
    }

    // 이미지 모델 결정
    const imageModel = (validatedData.imageModel || DEFAULT_IMAGE_MODEL) as GeminiImageModel;

    console.log(`[Section Regen] Starting regeneration for ${validatedData.sectionType}`);
    console.log(`[Section Regen] Model: ${imageModel}, Product: ${validatedData.productName}`);

    // 이미지 생성
    const generatedImage = await generateSectionImageWithGemini(
      validatedData.sectionType,
      `${validatedData.productName} ${validatedData.sectionType} promotional image`,
      validatedData.productName,
      validatedData.category,
      imageModel,
      validatedData.keyFeatures,
      validatedData.targetAudience
    );

    if (!generatedImage) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Cloudinary 업로드
    const uploadResult = await uploadGeneratedImage(generatedImage, {
      folder: 'triple-c/sections',
      sectionType: validatedData.sectionType,
    });

    console.log(`[Section Regen] Image generated and uploaded: ${uploadResult.url.substring(0, 50)}...`);

    // DB에서 해당 버전 조회 및 섹션 업데이트
    const detailPageVersion = await prisma.detailPageVersion.findUnique({
      where: { id: validatedData.versionId },
    });

    if (!detailPageVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // sections 배열에서 해당 섹션 찾아서 imageUrl 업데이트
    const sections = detailPageVersion.sections as any[];
    const updatedSections = sections.map((section: any) => {
      if (section.id === validatedData.sectionId) {
        return {
          ...section,
          imageUrl: uploadResult.url,
          imageUrls: [uploadResult.url],
        };
      }
      return section;
    });

    // DB 업데이트
    await prisma.detailPageVersion.update({
      where: { id: validatedData.versionId },
      data: {
        sections: updatedSections,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        sectionId: validatedData.sectionId,
        sectionType: validatedData.sectionType,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Section Regen] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to regenerate section image',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
