import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDetailPageSchema } from '@/lib/validations';
import { generateDetailPage } from '@/services/ai/detail-page-generator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/generate/detail-page - Generate detail page versions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 사용자 조회 - email 기반으로 조회하여 세션 ID 불일치 문제 해결
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, trialCredits: true, credits: true },
    });

    // 개발 환경에서 사용자가 DB에 없으면 자동 생성
    if (!user && process.env.NODE_ENV === 'development') {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Developer',
          userType: 'B2C',
          emailVerified: new Date(),
          trialCredits: 100,
        },
        select: { id: true, trialCredits: true, credits: true },
      });
      console.log('Auto-created dev user in generate API:', user.id);
    }

    // 세션 ID를 DB의 실제 ID로 동기화
    if (user) {
      session.user.id = user.id;
    }

    // Check user credits
    const totalCredits = (user?.trialCredits || 0) + (user?.credits || 0);
    if (!user || totalCredits <= 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = generateDetailPageSchema.parse(body);

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        brandProfile: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check access
    if (project.ownerId !== session.user.id) {
      if (project.workspaceId) {
        const membership = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: project.workspaceId,
              userId: session.user.id,
            },
          },
        });

        if (!membership || membership.role === 'VIEWER') {
          return NextResponse.json(
            { success: false, error: 'No permission to generate content' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'No access to this project' },
          { status: 403 }
        );
      }
    }

    // Get brand context if available
    let brandContext = null;
    if (project.brandProfile) {
      // Get RAG chunks for brand
      const chunks = await prisma.brandDocumentChunk.findMany({
        where: { brandProfileId: project.brandProfile.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      brandContext = {
        name: project.brandProfile.name,
        identity: project.brandProfile.identity,
        toneAndManner: project.brandProfile.toneAndManner,
        imageKeywords: project.brandProfile.imageKeywords,
        ragContext: chunks.map((c) => c.content).join('\n\n'),
      };
    }

    // 개발 모드에서 프롬프트 포함 여부
    const isDev = process.env.NODE_ENV === 'development';
    const includeDevPrompts = isDev && (body.includeDevPrompts ?? true);

    // Generate detail page versions with optional image generation
    // - generateImages: false (기본) = 사용자 업로드 제품 이미지 직접 사용
    // - generateImages: true = AI가 새로운 이미지 생성
    const generationResult = await generateDetailPage({
      productImages: validatedData.productImages,
      productName: validatedData.productName,
      category: validatedData.category,
      keyFeatures: validatedData.keyFeatures,
      targetAudience: validatedData.targetAudience || '일반 소비자',
      copyLength: validatedData.copyLength,
      brandContext,
      generateImages: validatedData.generateImages ?? false, // 기본: 사용자 이미지 직접 사용
      imageModel: validatedData.imageModel,
    }, { includeDevPrompts });

    const { versions, devPrompts } = generationResult;

    // Get the current max version number for this project
    const maxVersion = await prisma.detailPageVersion.findFirst({
      where: { projectId: validatedData.projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const startVersionNumber = (maxVersion?.versionNumber || 0) + 1;

    // Save versions to database with unique version numbers
    const savedVersions = await Promise.all(
      versions.map((version, index) =>
        prisma.detailPageVersion.create({
          data: {
            projectId: validatedData.projectId,
            versionNumber: startVersionNumber + index,
            hookMessage: version.hookMessage,
            sections: version.sections as unknown as Prisma.InputJsonValue,
          },
        })
      )
    );

    // Also create ProjectVersion for history tracking
    const latestProjectVersion = await prisma.projectVersion.findFirst({
      where: { projectId: validatedData.projectId },
      orderBy: { versionNumber: 'desc' },
    });
    const newProjectVersionNumber = (latestProjectVersion?.versionNumber || 0) + 1;

    await prisma.projectVersion.create({
      data: {
        projectId: validatedData.projectId,
        versionNumber: newProjectVersionNumber,
        action: 'GENERATE',
        description: `AI 생성 (${validatedData.copyLength || 'medium'})`,
        content: {
          sections: versions[0]?.sections || [],
          hookMessage: versions[0]?.hookMessage,
        } as unknown as Prisma.InputJsonValue,
        createdById: session.user.id,
      },
    });

    // Update project current version
    await prisma.project.update({
      where: { id: validatedData.projectId },
      data: {
        currentVersion: newProjectVersionNumber,
        updatedAt: new Date(),
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { trialCredits: { decrement: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        versions: savedVersions,
        remainingCredits: totalCredits - 1,
        // 개발 모드에서만 프롬프트 정보 포함
        ...(devPrompts && { devPrompts }),
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
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Generate detail page error:', errorMessage);
    console.error('Error stack:', errorStack);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
