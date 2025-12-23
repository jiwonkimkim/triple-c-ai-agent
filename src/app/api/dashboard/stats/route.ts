import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // email 기반으로 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        trialCredits: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 통계 데이터 병렬 조회
    const [totalProjects, totalBrands, generatedPages, recentProjects] = await Promise.all([
      // 총 프로젝트 수 (DELETED 제외)
      prisma.project.count({
        where: {
          ownerId: user.id,
          status: { not: 'DELETED' },
        },
      }),
      // 총 브랜드 프로필 수
      prisma.brandProfile.count({
        where: {
          userId: user.id,
          workspaceId: null,
        },
      }),
      // 생성된 페이지 수 (이번 달)
      prisma.detailPageVersion.count({
        where: {
          project: {
            ownerId: user.id,
          },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // 최근 프로젝트 5개
      prisma.project.findMany({
        where: {
          ownerId: user.id,
          status: { not: 'DELETED' },
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          brandProfile: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              detailPageVersions: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        totalBrands,
        generatedPages,
        remainingCredits: user.trialCredits ?? 0,
        recentProjects,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
