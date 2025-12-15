import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createProjectSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/projects - List all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') as 'ACTIVE' | 'ARCHIVED' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where = {
      ownerId: session.user.id,
      ...(workspaceId && { workspaceId }),
      ...(status && { status }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          brandProfile: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              detailPageVersions: true,
              histories: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: projects,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
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
    const validatedData = createProjectSchema.parse(body);

    // Verify workspace access if workspaceId provided
    if (validatedData.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: validatedData.workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'No access to this workspace' },
          { status: 403 }
        );
      }

      // Only OWNER, ADMIN, EDITOR can create projects
      if (membership.role === 'VIEWER') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Verify brand profile access if brandProfileId provided
    if (validatedData.brandProfileId) {
      const brandProfile = await prisma.brandProfile.findUnique({
        where: { id: validatedData.brandProfileId },
      });

      if (!brandProfile) {
        return NextResponse.json(
          { success: false, error: 'Brand profile not found' },
          { status: 404 }
        );
      }

      // Check access
      if (brandProfile.workspaceId !== validatedData.workspaceId) {
        return NextResponse.json(
          { success: false, error: 'Brand profile does not belong to workspace' },
          { status: 403 }
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        ownerId: session.user.id,
        workspaceId: validatedData.workspaceId,
        brandProfileId: validatedData.brandProfileId,
        status: 'ACTIVE',
      },
      include: {
        brandProfile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
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

    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
