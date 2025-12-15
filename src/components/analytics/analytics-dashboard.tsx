'use client';

import { useState } from 'react';
import {
  FolderKanban,
  Zap,
  Film,
  PlayCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UsageChart } from './usage-chart';
import { PieChart } from './pie-chart';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
}

const periods = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: '1y', label: '1년' },
];

export function AnalyticsDashboard({
  data,
  onPeriodChange,
  isLoading,
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(data.period || '30d');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange(period);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">사용량 분석</h2>
        <div className="flex gap-1 rounded-lg border p-1">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange(period.value)}
              disabled={isLoading}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FolderKanban className="h-5 w-5 text-blue-500" />}
          label="총 프로젝트"
          value={data.summary.totalProjects}
          subValue={`활성: ${data.summary.activeProjects}`}
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-amber-500" />}
          label="사용된 크레딧"
          value={data.summary.totalCreditsUsed}
          subValue={`충전: ${data.summary.totalCreditsReceived}`}
        />
        <StatCard
          icon={<Film className="h-5 w-5 text-purple-500" />}
          label="Motion/GIF"
          value={data.summary.totalMotionJobs}
          subValue={`완료: ${data.summary.completedMotionJobs}`}
        />
        <StatCard
          icon={<PlayCircle className="h-5 w-5 text-green-500" />}
          label="영상 생성"
          value={data.summary.totalVideoJobs}
          subValue={`완료: ${data.summary.completedVideoJobs}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects Chart */}
        <div className="rounded-xl border p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">프로젝트 생성 추이</h3>
          </div>
          <UsageChart data={data.dailyStats} type="projects" height={180} />
        </div>

        {/* Credits Chart */}
        <div className="rounded-xl border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">크레딧 사용 추이</h3>
          </div>
          <UsageChart data={data.dailyStats} type="credits" height={180} />
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Operation Breakdown */}
        <div className="rounded-xl border p-6">
          <h3 className="mb-4 font-semibold">기능별 사용량</h3>
          <PieChart
            data={data.operationBreakdown.map((item) => ({
              label: item.label,
              value: item.count,
            }))}
            size={180}
          />
        </div>

        {/* Effect Distribution */}
        <div className="rounded-xl border p-6">
          <h3 className="mb-4 font-semibold">Motion 효과 분포</h3>
          {data.effectDistribution.length > 0 ? (
            <PieChart
              data={data.effectDistribution.map((item) => ({
                label: item.label,
                value: item.count,
              }))}
              size={180}
            />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-muted-foreground">
              Motion 사용 내역이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border">
        <div className="border-b p-4">
          <h3 className="font-semibold">최근 프로젝트</h3>
        </div>
        <div className="divide-y">
          {data.recentProjects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              프로젝트가 없습니다
            </div>
          ) : (
            data.recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="font-medium">{project.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      생성:{' '}
                      {format(new Date(project.createdAt), 'PPP', {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-full px-2 py-1 text-xs',
                    project.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  )}
                >
                  {project.status === 'ACTIVE' ? '활성' : '보관'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          {subValue && (
            <div className="text-xs text-muted-foreground">{subValue}</div>
          )}
        </div>
      </div>
    </div>
  );
}
