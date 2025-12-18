import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// 개발 환경에서 사용자 ID 동기화 헬퍼 함수
async function syncDevUserId(user: { id: string; email: string }): Promise<void> {
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

// EditableElement 스키마
const editableElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'heading']),
  content: z.string(),
  styles: z.record(z.string()).optional(),
  level: z.number().optional(),
  alt: z.string().optional(),
});

const updateContentSchema = z.object({
  elements: z.array(editableElementSchema),
  versionId: z.string().optional(),
});

// GET /api/projects/[id]/content - Get current content
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;

    // Verify project ownership or membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        detailPageVersions: {
          where: { status: 'DRAFT' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Check access
    let hasAccess = project.ownerId === session.user.id;
    if (!hasAccess && project.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: session.user.id,
          },
        },
      });
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No access to this project' },
        { status: 403 }
      );
    }

    // Get latest draft content
    const latestVersion = project.detailPageVersions[0];

    if (!latestVersion) {
      return NextResponse.json({
        success: true,
        data: {
          elements: [],
          versionId: null,
        },
      });
    }

    // Parse contentJson to elements format
    const contentJson = latestVersion.contentJson as {
      elements?: Array<{
        id: string;
        type: string;
        content: string;
        styles?: Record<string, string>;
        level?: number;
        alt?: string;
      }>;
    };

    return NextResponse.json({
      success: true,
      data: {
        elements: contentJson?.elements || [],
        versionId: latestVersion.id,
        versionNumber: latestVersion.versionNumber,
        updatedAt: latestVersion.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get content' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/content - Update content
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateContentSchema.parse(body);
    const { elements, versionId } = validatedData;

    // Verify project ownership or edit permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Check access
    let canEdit = project.ownerId === session.user.id;
    if (!canEdit && project.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: session.user.id,
          },
        },
      });
      canEdit = membership?.role !== 'VIEWER';
    }

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'No permission to edit this project' },
        { status: 403 }
      );
    }

    // Content to save
    const contentJson = { elements };

    if (versionId) {
      // Update existing version
      const existingVersion = await prisma.detailPageVersion.findFirst({
        where: {
          id: versionId,
          projectId,
        },
      });

      if (!existingVersion) {
        return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
      }

      const updatedVersion = await prisma.detailPageVersion.update({
        where: { id: versionId },
        data: {
          contentJson,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          versionId: updatedVersion.id,
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
          contentJson,
          status: 'DRAFT',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          versionId: newVersion.id,
          versionNumber: newVersion.versionNumber,
          createdAt: newVersion.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Update content error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to save content' }, { status: 500 });
  }
}

// POST /api/projects/[id]/content - Create new version from content
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;
    const body = await request.json();

    const { elements, publish = false } = body;

    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json(
        { success: false, error: 'Elements array is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Get version count
    const versionCount = await prisma.detailPageVersion.count({
      where: { projectId },
    });

    // Create new version
    const newVersion = await prisma.detailPageVersion.create({
      data: {
        projectId,
        versionNumber: versionCount + 1,
        contentJson: { elements },
        status: publish ? 'PUBLISHED' : 'DRAFT',
      },
    });

    // If publishing, update project status
    if (publish) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        versionId: newVersion.id,
        versionNumber: newVersion.versionNumber,
        status: newVersion.status,
        createdAt: newVersion.createdAt,
      },
    });
  } catch (error) {
    console.error('Create content version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
