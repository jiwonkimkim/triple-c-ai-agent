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

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // email 기반으로 사용자 조회하여 세션 ID 불일치 문제 해결
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      session.user.id = user.id;
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') as 'ACTIVE' | 'ARCHIVED' | 'DELETED' | null;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 기본: DELETED 제외, includeDeleted=true면 전체 조회
    const where = {
      ownerId: session.user.id,
      ...(workspaceId && { workspaceId }),
      ...(status
        ? { status }
        : !includeDeleted
        ? { status: { not: 'DELETED' as const } }
        : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          productImages: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          brandProfile: {
            select: {
              id: true,
              name: true,
            },
          },
          detailPageVersions: {
            select: {
              id: true,
              sections: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
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

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // email 기반으로 사용자 조회하여 세션 ID 불일치 문제 해결
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
      });
      console.log('Auto-created dev user in API:', user.id);
    }

    // 세션 ID를 DB의 실제 ID로 동기화
    if (user) {
      session.user.id = user.id;
    } else {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
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

      // Check access based on workspace or user ownership
      const projectWorkspaceId = validatedData.workspaceId || null;
      const brandWorkspaceId = brandProfile.workspaceId || null;

      if (projectWorkspaceId) {
        // B2B: Project has workspace - brand must belong to same workspace
        if (brandWorkspaceId !== projectWorkspaceId) {
          return NextResponse.json(
            { success: false, error: 'Brand profile does not belong to workspace' },
            { status: 403 }
          );
        }
      } else {
        // B2C: Personal project - brand must be personal and belong to current user
        if (brandWorkspaceId) {
          // Brand belongs to a workspace but project is personal
          return NextResponse.json(
            { success: false, error: 'Cannot use workspace brand for personal project' },
            { status: 403 }
          );
        }

        // Check if brand belongs to current user
        // Also check by email for dev environment compatibility
        let hasAccess = false;

        if (brandProfile.userId === session.user.id) {
          hasAccess = true;
        } else if (process.env.NODE_ENV === 'development' && brandProfile.userId) {
          // In dev, check if brand owner has same email as current user
          const brandOwner = await prisma.user.findUnique({
            where: { id: brandProfile.userId },
            select: { email: true },
          });
          if (brandOwner?.email === session.user.email) {
            hasAccess = true;
          }
        } else if (!brandProfile.userId) {
          // Brand has no userId set - allow for backwards compatibility
          hasAccess = true;
        }

        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Brand profile does not belong to you' },
            { status: 403 }
          );
        }
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
        // 제품 정보 저장 (재생성 시 사용)
        productName: validatedData.productName,
        category: validatedData.category,
        keyFeatures: validatedData.keyFeatures || [],
        targetAudience: validatedData.targetAudience,
        copyLength: validatedData.copyLength || 'medium',
        productUrl: validatedData.productUrl || null,
        productImages: validatedData.productImages || [],
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

    // Prisma 에러 상세 처리
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPrismaError = errorMessage.includes('Foreign key constraint') ||
                          errorMessage.includes('P2003') ||
                          errorMessage.includes('P2025');

    if (isPrismaError) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
