'use client';

import { useState } from 'react';
import {
  CreditCard,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SubscriptionData {
  plan: {
    id: string;
    name: string;
    description: string;
    features: string[];
    limits: {
      projectsPerMonth: number;
      imageQuality: string;
      videoGeneration: boolean;
      teamMembers: number;
      brandProfiles: number;
    };
  };
  credits: number;
  subscription: {
    id: string;
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface BillingDashboardProps {
  subscriptionData: SubscriptionData;
  transactions: CreditTransaction[];
  maxCredits: number;
  onManageBilling: () => void;
  onUpgrade: () => void;
  isLoading?: boolean;
}

export function BillingDashboard({
  subscriptionData,
  transactions,
  maxCredits,
  onManageBilling,
  onUpgrade,
  isLoading,
}: BillingDashboardProps) {
  const { plan, credits, subscription } = subscriptionData;
  const creditPercentage = Math.min((credits / maxCredits) * 100, 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">활성</Badge>;
      case 'TRIALING':
        return <Badge variant="secondary">체험판</Badge>;
      case 'PAST_DUE':
        return <Badge variant="destructive">결제 지연</Badge>;
      case 'CANCELED':
        return <Badge variant="outline">취소됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION_RENEWAL':
        return (
          <Badge variant="default" className="bg-green-600">
            충전
          </Badge>
        );
      case 'USAGE':
        return <Badge variant="secondary">사용</Badge>;
      case 'PURCHASE':
        return (
          <Badge variant="default" className="bg-blue-600">
            구매
          </Badge>
        );
      case 'REFUND':
        return <Badge variant="outline">환불</Badge>;
      case 'BONUS':
        return (
          <Badge variant="default" className="bg-purple-600">
            보너스
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Plan Card */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          {subscription && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  다음 결제일:{' '}
                  {format(new Date(subscription.currentPeriodEnd), 'PPP', {
                    locale: ko,
                  })}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>기간 종료 시 구독이 취소됩니다</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {plan.id !== 'ENTERPRISE' && (
              <Button variant="default" size="sm" onClick={onUpgrade}>
                업그레이드
              </Button>
            )}
            {subscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManageBilling}
                disabled={isLoading}
              >
                결제 관리
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Credits Card */}
        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">크레딧 잔액</h3>
            </div>
            <span className="text-2xl font-bold">{credits}</span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>사용량</span>
              <span>
                {credits} / {maxCredits}
              </span>
            </div>
            <Progress value={creditPercentage} className="h-2" />
          </div>

          {credits < maxCredits * 0.2 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>크레딧이 부족합니다</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">이번 달 사용량</h3>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">
                {Math.max(0, maxCredits - credits)}
              </div>
              <div className="text-xs text-muted-foreground">사용된 크레딧</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {transactions.filter((t) => t.type === 'USAGE').length}
              </div>
              <div className="text-xs text-muted-foreground">생성 횟수</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border">
        <div className="border-b p-4">
          <h3 className="font-semibold">크레딧 사용 내역</h3>
        </div>
        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              사용 내역이 없습니다
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  {getTransactionTypeBadge(transaction.type)}
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(transaction.createdAt), 'PPP HH:mm', {
                        locale: ko,
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'font-semibold',
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    잔액: {transaction.balance}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="rounded-xl border p-6">
        <h3 className="mb-4 font-semibold">현재 플랜 기능</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureItem
            label="월간 프로젝트"
            value={
              plan.limits.projectsPerMonth === -1
                ? '무제한'
                : `${plan.limits.projectsPerMonth}개`
            }
          />
          <FeatureItem label="이미지 품질" value={plan.limits.imageQuality} />
          <FeatureItem
            label="영상 생성"
            value={plan.limits.videoGeneration ? '가능' : '불가'}
          />
          <FeatureItem
            label="팀 멤버"
            value={
              plan.limits.teamMembers === -1
                ? '무제한'
                : `${plan.limits.teamMembers}명`
            }
          />
          <FeatureItem
            label="브랜드 프로필"
            value={
              plan.limits.brandProfiles === -1
                ? '무제한'
                : `${plan.limits.brandProfiles}개`
            }
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
