import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Pricing Plans Configuration
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: '개인 사용자를 위한 무료 플랜',
    price: 0,
    credits: 3,
    features: [
      '월 3회 무료 생성',
      '기본 템플릿 사용',
      'Draft 품질 이미지',
      '이메일 지원',
    ],
    limits: {
      projectsPerMonth: 3,
      imageQuality: 'draft',
      videoGeneration: false,
      teamMembers: 1,
      brandProfiles: 1,
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: '소규모 비즈니스를 위한 기본 플랜',
    priceMonthly: 29000,
    priceYearly: 290000,
    stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    credits: 50,
    features: [
      '월 50 크레딧',
      '모든 템플릿 사용',
      'HD 품질 이미지',
      '기본 Motion/GIF',
      '우선 지원',
    ],
    limits: {
      projectsPerMonth: 50,
      imageQuality: 'hd',
      videoGeneration: false,
      teamMembers: 1,
      brandProfiles: 3,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: '전문가 및 에이전시를 위한 프로 플랜',
    priceMonthly: 79000,
    priceYearly: 790000,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
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
    limits: {
      projectsPerMonth: 200,
      imageQuality: 'hd',
      videoGeneration: true,
      videoDurationMax: 8,
      teamMembers: 5,
      brandProfiles: 10,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: '대기업을 위한 맞춤형 플랜',
    priceMonthly: 299000,
    priceYearly: 2990000,
    stripePriceIdMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
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
    limits: {
      projectsPerMonth: -1, // unlimited
      imageQuality: 'hd',
      videoGeneration: true,
      videoDurationMax: 16,
      teamMembers: -1, // unlimited
      brandProfiles: -1, // unlimited
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Credit costs for different operations
export const CREDIT_COSTS = {
  GENERATE_DETAIL_PAGE: 1,
  GENERATE_IMAGE_DRAFT: 1,
  GENERATE_IMAGE_HD: 2,
  GENERATE_MOTION_GIF: 3,
  GENERATE_VIDEO_4S: 10,
  GENERATE_VIDEO_8S: 20,
  GENERATE_VIDEO_16S: 40,
  RAG_INDEXING: 1,
} as const;

// Helper function to get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (
      'stripePriceIdMonthly' in plan &&
      (plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId)
    ) {
      return key as PlanId;
    }
  }
  return null;
}

// Helper function to format price
export function formatPrice(price: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}
