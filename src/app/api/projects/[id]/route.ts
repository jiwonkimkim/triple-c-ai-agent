import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateProjectSchema } from '@/lib/validations';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// GET /api/projects/[id] - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 환경에서 사용자 ID 확인 및 동기화
    if (process.env.NODE_ENV === 'development') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!existingUser) {
        // 이메일로 사용자 찾기
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (userByEmail) {
          session.user.id = userByEmail.id;
        }
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        brandProfile: true,
        detailPageVersions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        editorDraft: true,
        _count: {
          select: {
            histories: true,
            motionJobs: true,
            videoJobs: true,
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

    // Check access
    if (project.ownerId !== session.user.id) {
      // Check workspace membership
      if (project.workspaceId) {
        const membership = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: project.workspaceId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { success: false, error: 'No access to this project' },
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

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 환경에서 사용자 ID 확인 및 동기화
    if (process.env.NODE_ENV === 'development') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!existingUser) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (userByEmail) {
          session.user.id = userByEmail.id;
        }
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
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

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        brandProfile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProject,
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

    console.error('Update project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 환경에서 사용자 ID 확인 및 동기화
    if (process.env.NODE_ENV === 'development') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!existingUser) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (userByEmail) {
          session.user.id = userByEmail.id;
        }
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check access - only owner or workspace OWNER/ADMIN can delete
    let canDelete = project.ownerId === session.user.id;

    if (!canDelete && project.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: session.user.id,
          },
        },
      });

      canDelete = membership?.role === 'OWNER' || membership?.role === 'ADMIN';
    }

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'No permission to delete this project' },
        { status: 403 }
      );
    }

    // Soft delete - status를 DELETED로 변경
    await prisma.$executeRaw`UPDATE projects SET status = 'DELETED' WHERE id = ${params.id}`;

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
