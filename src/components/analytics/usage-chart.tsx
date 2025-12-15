'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DailyStat {
  date: string;
  projects: number;
  creditsUsed: number;
}

interface UsageChartProps {
  data: DailyStat[];
  type: 'projects' | 'credits';
  height?: number;
}

export function UsageChart({ data, type, height = 200 }: UsageChartProps) {
  const chartData = useMemo(() => {
    const values = data.map((d) =>
      type === 'projects' ? d.projects : d.creditsUsed
    );
    const max = Math.max(...values, 1);

    return data.map((d, i) => ({
      ...d,
      value: type === 'projects' ? d.projects : d.creditsUsed,
      percentage: (values[i] / max) * 100,
    }));
  }, [data, type]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Show fewer bars on smaller datasets or when there are many data points
  const showEveryN = chartData.length > 30 ? Math.ceil(chartData.length / 30) : 1;
  const displayData = chartData.filter((_, i) => i % showEveryN === 0);

  return (
    <div className="space-y-2">
      <div
        className="flex items-end justify-between gap-1"
        style={{ height }}
      >
        {displayData.map((item, index) => (
          <div
            key={item.date}
            className="group relative flex-1"
            style={{ height: '100%' }}
          >
            {/* Bar */}
            <div
              className={cn(
                'absolute bottom-0 w-full rounded-t transition-all duration-200',
                type === 'projects'
                  ? 'bg-blue-500 group-hover:bg-blue-600'
                  : 'bg-amber-500 group-hover:bg-amber-600'
              )}
              style={{
                height: `${item.percentage}%`,
                minHeight: item.value > 0 ? '4px' : '0',
              }}
            />

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow-lg">
                <div className="font-medium">
                  {new Date(item.date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-muted-foreground">
                  {type === 'projects'
                    ? `${item.value}개 프로젝트`
                    : `${item.value} 크레딧`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(data[0]?.date).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span>
          {new Date(data[data.length - 1]?.date).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Y-axis info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>
          {type === 'projects' ? `최대 ${maxValue}개` : `최대 ${maxValue}`}
        </span>
      </div>
    </div>
  );
}
