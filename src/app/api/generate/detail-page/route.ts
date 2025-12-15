import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDetailPageSchema } from '@/lib/validations';
import { generateDetailPage } from '@/services/ai/detail-page-generator';
import { z } from 'zod';

// POST /api/generate/detail-page - Generate detail page versions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trialCredits: true },
    });

    if (!user || user.trialCredits <= 0) {
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

    // Generate detail page versions
    const versions = await generateDetailPage({
      productImages: validatedData.productImages,
      productName: validatedData.productName,
      category: validatedData.category,
      keyFeatures: validatedData.keyFeatures,
      targetAudience: validatedData.targetAudience,
      copyLength: validatedData.copyLength,
      brandContext,
    });

    // Save versions to database
    const savedVersions = await Promise.all(
      versions.map((version) =>
        prisma.detailPageVersion.create({
          data: {
            projectId: validatedData.projectId,
            hookMessage: version.hookMessage,
            sections: version.sections,
          },
        })
      )
    );

    // Deduct credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { trialCredits: { decrement: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        versions: savedVersions,
        remainingCredits: user.trialCredits - 1,
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

    console.error('Generate detail page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
