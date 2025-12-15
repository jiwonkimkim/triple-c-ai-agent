'use client';

import {
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Crown,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VariantStats {
  views: number;
  clicks: number;
  conversions: number;
  clickRate: number;
  conversionRate: number;
}

interface VariantSignificance {
  isSignificant: boolean;
  improvement: number;
  minSampleSize: number;
  currentSampleSize: number;
}

interface Variant {
  id: string;
  name: string;
  description?: string;
  isControl: boolean;
  weight: number;
  stats: VariantStats;
  significance: VariantSignificance | null;
}

interface ABTestResultsProps {
  testName: string;
  status: string;
  variants: Variant[];
}

export function ABTestResults({
  testName,
  status,
  variants,
}: ABTestResultsProps) {
  const controlVariant = variants.find((v) => v.isControl);
  const treatmentVariants = variants.filter((v) => !v.isControl);

  // Find the winning variant
  const winningVariant = variants.reduce((best, current) => {
    if (!best) return current;
    return current.stats.conversionRate > best.stats.conversionRate
      ? current
      : best;
  }, null as Variant | null);

  const totalViews = variants.reduce((sum, v) => sum + v.stats.views, 0);
  const totalConversions = variants.reduce(
    (sum, v) => sum + v.stats.conversions,
    0
  );

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Eye className="h-5 w-5 text-blue-500" />}
          label="총 조회수"
          value={totalViews}
        />
        <StatCard
          icon={<MousePointer className="h-5 w-5 text-amber-500" />}
          label="총 클릭수"
          value={variants.reduce((sum, v) => sum + v.stats.clicks, 0)}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-green-500" />}
          label="총 전환수"
          value={totalConversions}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label="평균 전환율"
          value={`${
            totalViews > 0
              ? ((totalConversions / totalViews) * 100).toFixed(2)
              : 0
          }%`}
        />
      </div>

      {/* Variant Comparison */}
      <div className="rounded-xl border">
        <div className="border-b p-4">
          <h3 className="font-semibold">배리언트 비교</h3>
        </div>
        <div className="divide-y">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              isWinner={variant.id === winningVariant?.id}
              maxConversionRate={Math.max(
                ...variants.map((v) => v.stats.conversionRate)
              )}
            />
          ))}
        </div>
      </div>

      {/* Statistical Significance */}
      {treatmentVariants.some((v) => v.significance) && (
        <div className="rounded-xl border p-6">
          <h3 className="mb-4 font-semibold">통계적 유의성</h3>
          <div className="space-y-4">
            {treatmentVariants.map((variant) => {
              if (!variant.significance) return null;

              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    {variant.significance.isSignificant ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <div className="font-medium">{variant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {variant.significance.isSignificant
                          ? '통계적으로 유의함'
                          : `추가 샘플 필요 (${variant.significance.currentSampleSize}/${variant.significance.minSampleSize})`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        variant.significance.improvement > 0
                          ? 'text-green-600'
                          : variant.significance.improvement < 0
                          ? 'text-red-600'
                          : ''
                      )}
                    >
                      {variant.significance.improvement > 0 ? '+' : ''}
                      {variant.significance.improvement}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      vs 컨트롤
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {status === 'COMPLETED' && winningVariant && (
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">권장 배리언트</h3>
              <p className="text-sm text-muted-foreground">
                테스트 결과 <strong>{winningVariant.name}</strong>이(가) 가장
                높은 전환율을 보였습니다.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {winningVariant.stats.conversionRate}%
              </div>
              <div className="text-xs text-muted-foreground">전환율</div>
            </div>
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="text-2xl font-bold">
                {winningVariant.stats.views}
              </div>
              <div className="text-xs text-muted-foreground">조회수</div>
            </div>
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="text-2xl font-bold">
                {winningVariant.stats.conversions}
              </div>
              <div className="text-xs text-muted-foreground">전환수</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function VariantRow({
  variant,
  isWinner,
  maxConversionRate,
}: {
  variant: Variant;
  isWinner: boolean;
  maxConversionRate: number;
}) {
  const conversionPercentage =
    maxConversionRate > 0
      ? (variant.stats.conversionRate / maxConversionRate) * 100
      : 0;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isWinner && <Crown className="h-4 w-4 text-amber-500" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{variant.name}</span>
              {variant.isControl && (
                <Badge variant="outline" className="text-xs">
                  컨트롤
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              가중치: {variant.weight}%
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            {variant.stats.conversionRate}%
          </div>
          <div className="text-xs text-muted-foreground">전환율</div>
        </div>
      </div>

      {/* Conversion Rate Bar */}
      <div className="mt-3">
        <Progress value={conversionPercentage} className="h-2" />
      </div>

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">조회수:</span>{' '}
          <span className="font-medium">{variant.stats.views}</span>
        </div>
        <div>
          <span className="text-muted-foreground">클릭수:</span>{' '}
          <span className="font-medium">{variant.stats.clicks}</span>
        </div>
        <div>
          <span className="text-muted-foreground">전환수:</span>{' '}
          <span className="font-medium">{variant.stats.conversions}</span>
        </div>
      </div>
    </div>
  );
}
