'use client';

import { useState } from 'react';
import { Check, Sparkles, Building2, Rocket, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    description: '개인 사용자를 위한 무료 플랜',
    priceMonthly: 0,
    priceYearly: 0,
    credits: 3,
    features: [
      '월 3회 무료 생성',
      '기본 템플릿 사용',
      'Draft 품질 이미지',
      '이메일 지원',
    ],
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    description: '소규모 비즈니스를 위한 기본 플랜',
    priceMonthly: 29000,
    priceYearly: 290000,
    credits: 50,
    features: [
      '월 50 크레딧',
      '모든 템플릿 사용',
      'HD 품질 이미지',
      '기본 Motion/GIF',
      '우선 지원',
    ],
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: '전문가 및 에이전시를 위한 프로 플랜',
    priceMonthly: 79000,
    priceYearly: 790000,
    credits: 200,
    features: [
      '월 200 크레딧',
      '모든 템플릿 + 프리미엄',
      'HD 품질 이미지',
      '영상 생성 (8초)',
      'Motion/GIF 무제한',
      '브랜드 프로필 10개',
      '전담 지원',
    ],
    popular: true,
    icon: <Crown className="h-5 w-5" />,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: '대기업을 위한 맞춤형 플랜',
    priceMonthly: 299000,
    priceYearly: 2990000,
    credits: 1000,
    features: [
      '월 1000 크레딧',
      '모든 기능 무제한',
      '영상 생성 (16초)',
      '팀 협업 무제한',
      '커스텀 브랜딩',
      'API 액세스',
      'SLA 보장',
      '전담 계정 매니저',
    ],
    icon: <Building2 className="h-5 w-5" />,
  },
];

interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

export function PricingPlans({
  currentPlan = 'FREE',
  onSelectPlan,
  isLoading,
}: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getYearlyDiscount = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    const discount = ((monthlyTotal - yearly) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={cn(
            'text-sm transition-colors',
            billingCycle === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}
        >
          월간 결제
        </span>
        <button
          onClick={() =>
            setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
          }
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
        <span
          className={cn(
            'text-sm transition-colors',
            billingCycle === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}
        >
          연간 결제
          <span className="ml-1 text-xs text-green-600">(최대 17% 할인)</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const price =
            billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const monthlyEquivalent =
            billingCycle === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-xl border p-6 transition-all',
                plan.popular
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'border-border hover:border-primary/50',
                isCurrentPlan && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    가장 인기
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4 flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ₩{formatPrice(Math.round(monthlyEquivalent))}
                  </span>
                  <span className="text-sm text-muted-foreground">/월</span>
                </div>
                {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    연 ₩{formatPrice(price)} (
                    {getYearlyDiscount(plan.priceMonthly, plan.priceYearly)}% 할인)
                  </div>
                )}
              </div>

              {/* Credits */}
              <div className="mb-4 rounded-lg bg-muted/50 p-3">
                <div className="text-sm font-medium">
                  월 {plan.credits} 크레딧
                </div>
              </div>

              {/* Features */}
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? 'default' : 'outline'}
                className="w-full"
                disabled={isCurrentPlan || isLoading || plan.id === 'FREE'}
                onClick={() => onSelectPlan?.(plan.id, billingCycle)}
              >
                {isCurrentPlan
                  ? '현재 플랜'
                  : plan.id === 'FREE'
                  ? '무료'
                  : isLoading
                  ? '처리 중...'
                  : '시작하기'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
