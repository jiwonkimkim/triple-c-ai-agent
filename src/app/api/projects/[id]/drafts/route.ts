import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 개발 환경에서 사용자 ID 동기화 헬퍼 함수
async function syncDevUserId(user: { id: string; email: string }) {
  if (process.env.NODE_ENV === 'development') {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (userByEmail) {
        user.id = userByEmail.id;
      }
    }
  }
}

const draftSchema = z.object({
  versionId: z.string().optional(),
  content: z.any(), // JSON content for editor sections
  isManualSave: z.boolean().optional(), // true for manual save button
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

    // 개발 환경에서 사용자 ID 동기화
    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { versionId, content, isManualSave } = draftSchema.parse(body);

    // Check if we should create a new ProjectVersion
    // - Manual save: always create
    // - Auto save: throttle to 5 minutes
    const lastProjectVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const shouldCreateVersion = isManualSave || !lastProjectVersion || lastProjectVersion.createdAt < fiveMinutesAgo;

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

      // Create ProjectVersion for history
      if (shouldCreateVersion) {
        const newVersionNumber = (lastProjectVersion?.versionNumber || 0) + 1;
        await prisma.projectVersion.create({
          data: {
            projectId,
            versionNumber: newVersionNumber,
            action: isManualSave ? 'UPDATE' : 'AUTO_SAVE',
            description: isManualSave ? '수동 저장' : '자동 저장',
            content: { sections: content },
            createdById: session.user.id,
          },
        });
      }

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

      // Create ProjectVersion for history
      if (shouldCreateVersion) {
        const newVersionNumber = (lastProjectVersion?.versionNumber || 0) + 1;
        await prisma.projectVersion.create({
          data: {
            projectId,
            versionNumber: newVersionNumber,
            action: isManualSave ? 'UPDATE' : 'AUTO_SAVE',
            description: isManualSave ? '수동 저장' : '자동 저장',
            content: { sections: content },
            createdById: session.user.id,
          },
        });
      }

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
  _request: NextRequest,
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

    // 개발 환경에서 사용자 ID 동기화
    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
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
