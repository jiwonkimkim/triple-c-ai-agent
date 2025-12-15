'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
}

const COLORS = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

export function PieChart({
  data,
  size = 200,
  showLegend = true,
}: PieChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = 0;
    return data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle: currentAngle,
        color: item.color || COLORS[index % COLORS.length],
      };
    });
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ width: size, height: size }}
      >
        데이터 없음
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* Pie Chart */}
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {chartData.map((item, index) => {
            if (item.percentage === 0) return null;

            const startAngle = (item.startAngle / 360) * 2 * Math.PI;
            const endAngle = (item.endAngle / 360) * 2 * Math.PI;

            const x1 = 50 + 40 * Math.cos(startAngle);
            const y1 = 50 + 40 * Math.sin(startAngle);
            const x2 = 50 + 40 * Math.cos(endAngle);
            const y2 = 50 + 40 * Math.sin(endAngle);

            const largeArcFlag = item.percentage > 50 ? 1 : 0;

            const pathData =
              item.percentage === 100
                ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
                : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            // Get the fill color from the class
            const colorMap: Record<string, string> = {
              'bg-blue-500': '#3b82f6',
              'bg-amber-500': '#f59e0b',
              'bg-green-500': '#22c55e',
              'bg-purple-500': '#a855f7',
              'bg-rose-500': '#f43f5e',
              'bg-cyan-500': '#06b6d4',
              'bg-orange-500': '#f97316',
              'bg-indigo-500': '#6366f1',
            };

            return (
              <path
                key={index}
                d={pathData}
                fill={colorMap[item.color] || '#9ca3af'}
                className="transition-opacity hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">총 사용량</span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={cn('h-3 w-3 rounded-sm', item.color)}
              />
              <span className="text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">
                ({item.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
