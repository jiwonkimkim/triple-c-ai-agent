import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/analytics/usage - Get usage analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const workspaceId = searchParams.get('workspaceId');

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build project filter
    const projectFilter: any = {
      ownerId: session.user.id,
      createdAt: { gte: startDate },
    };
    if (workspaceId) {
      projectFilter.workspaceId = workspaceId;
    }

    // Fetch analytics data in parallel
    const [
      projects,
      creditTransactions,
      motionJobs,
      videoJobs,
      recentProjects,
    ] = await Promise.all([
      // Total projects
      prisma.project.findMany({
        where: projectFilter,
        select: {
          id: true,
          createdAt: true,
          status: true,
        },
      }),

      // Credit transactions
      prisma.creditTransaction.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Motion jobs
      prisma.motionJob.findMany({
        where: {
          project: { ownerId: session.user.id },
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          effect: true,
          createdAt: true,
        },
      }),

      // Video jobs
      prisma.videoJob.findMany({
        where: {
          project: { ownerId: session.user.id },
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          costCredits: true,
          createdAt: true,
        },
      }),

      // Recent projects for activity
      prisma.project.findMany({
        where: { ownerId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Calculate statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;

    const totalCreditsUsed = creditTransactions
      .filter((t) => t.type === 'USAGE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCreditsReceived = creditTransactions
      .filter((t) => t.type !== 'USAGE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalMotionJobs = motionJobs.length;
    const completedMotionJobs = motionJobs.filter(
      (j) => j.status === 'COMPLETED'
    ).length;

    const totalVideoJobs = videoJobs.length;
    const completedVideoJobs = videoJobs.filter(
      (j) => j.status === 'COMPLETED'
    ).length;

    // Group data by day for charts
    const dailyStats = getDailyStats(projects, creditTransactions, startDate, now);

    // Operation breakdown
    const operationBreakdown = getOperationBreakdown(creditTransactions);

    // Motion effect distribution
    const effectDistribution = getEffectDistribution(motionJobs);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProjects,
          activeProjects,
          totalCreditsUsed,
          totalCreditsReceived,
          totalMotionJobs,
          completedMotionJobs,
          totalVideoJobs,
          completedVideoJobs,
        },
        dailyStats,
        operationBreakdown,
        effectDistribution,
        recentProjects,
        period,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getDailyStats(
  projects: any[],
  transactions: any[],
  startDate: Date,
  endDate: Date
) {
  const stats: Record<
    string,
    { date: string; projects: number; creditsUsed: number }
  > = {};

  // Initialize all days
  let current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    stats[dateKey] = { date: dateKey, projects: 0, creditsUsed: 0 };
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  // Count projects
  projects.forEach((project) => {
    const dateKey = project.createdAt.toISOString().split('T')[0];
    if (stats[dateKey]) {
      stats[dateKey].projects++;
    }
  });

  // Sum credit usage
  transactions
    .filter((t) => t.type === 'USAGE')
    .forEach((transaction) => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      if (stats[dateKey]) {
        stats[dateKey].creditsUsed += Math.abs(transaction.amount);
      }
    });

  return Object.values(stats).sort((a, b) => a.date.localeCompare(b.date));
}

function getOperationBreakdown(transactions: any[]) {
  const breakdown: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'USAGE')
    .forEach((transaction) => {
      const operation =
        (transaction.metadata as any)?.operation || 'UNKNOWN';
      breakdown[operation] = (breakdown[operation] || 0) + 1;
    });

  return Object.entries(breakdown).map(([operation, count]) => ({
    operation,
    count,
    label: getOperationLabel(operation),
  }));
}

function getOperationLabel(operation: string): string {
  const labels: Record<string, string> = {
    GENERATE_DETAIL_PAGE: '상세페이지 생성',
    GENERATE_IMAGE_DRAFT: '이미지 (Draft)',
    GENERATE_IMAGE_HD: '이미지 (HD)',
    GENERATE_MOTION_GIF: 'Motion/GIF',
    GENERATE_VIDEO_4S: '영상 (4초)',
    GENERATE_VIDEO_8S: '영상 (8초)',
    GENERATE_VIDEO_16S: '영상 (16초)',
    RAG_INDEXING: 'RAG 인덱싱',
    UNKNOWN: '기타',
  };
  return labels[operation] || operation;
}

function getEffectDistribution(jobs: any[]) {
  const distribution: Record<string, number> = {};

  jobs.forEach((job) => {
    distribution[job.effect] = (distribution[job.effect] || 0) + 1;
  });

  return Object.entries(distribution).map(([effect, count]) => ({
    effect,
    count,
    label: getEffectLabel(effect),
  }));
}

function getEffectLabel(effect: string): string {
  const labels: Record<string, string> = {
    ZOOM: '줌',
    PAN: '패닝',
    ROTATE: '회전',
    BOUNCE: '바운스',
    FADE: '페이드',
    PARALLAX: '패럴랙스',
  };
  return labels[effect] || effect;
}
