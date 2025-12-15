'use client';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalCreditsUsed: number;
    totalCreditsReceived: number;
    totalMotionJobs: number;
    completedMotionJobs: number;
    totalVideoJobs: number;
    completedVideoJobs: number;
  };
  dailyStats: Array<{
    date: string;
    projects: number;
    creditsUsed: number;
  }>;
  operationBreakdown: Array<{
    operation: string;
    count: number;
    label: string;
  }>;
  effectDistribution: Array<{
    effect: string;
    count: number;
    label: string;
  }>;
  recentProjects: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  period: string;
}

async function fetchAnalytics(
  period: string,
  workspaceId?: string
): Promise<AnalyticsData> {
  const params = new URLSearchParams({ period });
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  const response = await fetch(`/api/analytics/usage?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  const result = await response.json();
  return result.data;
}

export function useAnalytics(period = '30d', workspaceId?: string) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', period, workspaceId],
    queryFn: () => fetchAnalytics(period, workspaceId),
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
