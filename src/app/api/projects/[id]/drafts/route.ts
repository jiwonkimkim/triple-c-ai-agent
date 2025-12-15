import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const draftSchema = z.object({
  versionId: z.string().optional(),
  content: z.any(), // JSON content for editor sections
});

// POST /api/projects/[id]/drafts - Create or update draft
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { versionId, content } = draftSchema.parse(body);

    if (versionId) {
      // Update existing draft/version
      const existingVersion = await prisma.detailPageVersion.findFirst({
        where: {
          id: versionId,
          projectId,
        },
      });

      if (!existingVersion) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      const updatedVersion = await prisma.detailPageVersion.update({
        where: { id: versionId },
        data: {
          contentJson: content,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedVersion.id,
          updatedAt: updatedVersion.updatedAt,
        },
      });
    } else {
      // Create new draft version
      const versionCount = await prisma.detailPageVersion.count({
        where: { projectId },
      });

      const newVersion = await prisma.detailPageVersion.create({
        data: {
          projectId,
          versionNumber: versionCount + 1,
          contentJson: content,
          status: 'DRAFT',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newVersion.id,
          versionNumber: newVersion.versionNumber,
          createdAt: newVersion.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Draft save error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/drafts - Update draft (alias for POST with versionId)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(request, { params });
}

// GET /api/projects/[id]/drafts - Get latest draft
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get latest draft
    const latestDraft = await prisma.detailPageVersion.findFirst({
      where: {
        projectId,
        status: 'DRAFT',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!latestDraft) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: latestDraft.id,
        versionNumber: latestDraft.versionNumber,
        content: latestDraft.contentJson,
        createdAt: latestDraft.createdAt,
        updatedAt: latestDraft.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get draft error:', error);
    return NextResponse.json(
      { error: 'Failed to get draft' },
      { status: 500 }
    );
  }
}
