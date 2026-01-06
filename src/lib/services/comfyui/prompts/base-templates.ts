/**
 * ComfyUI 프롬프트 시스템 - 공통 베이스 템플릿
 * 모든 모델이 이 템플릿을 기반으로 프롬프트 생성
 */

import type { SectionType, BaseSectionTemplate, CategoryType } from './types';

// ============================================
// 섹션별 베이스 템플릿
// ============================================

export const BASE_SECTION_TEMPLATES: Record<SectionType, BaseSectionTemplate> = {
  /**
   * MAIN: 메인 썸네일
   * 상세페이지 진입 전 첫인상, 1:1 비율
   */
  MAIN: {
    purpose: '메인 썸네일 - 첫인상 결정',
    composition: 'product centered in frame, 50-60% of image, sharp focus, clean empty space for text overlay',
    textSpace: { top: '25%', bottom: '20%' },
    lighting: 'soft studio lighting, gentle highlights, subtle shadows',
    mood: ['premium', 'commercial', 'aspirational', 'clean'],
  },

  /**
   * HERO: 히어로 섹션
   * 브랜드명 + 슬로건 영역
   */
  HERO: {
    purpose: '히어로 - 브랜드 임팩트',
    composition: 'product as hero element, off-center placement, rule of thirds, elegant negative space',
    textSpace: { left: '40%' },
    lighting: 'dramatic rim lighting, soft key light, professional beauty lighting',
    mood: ['luxury', 'editorial', 'sophisticated', 'high-end'],
  },

  /**
   * FEATURES: 특징 섹션
   * 제품 기능/특징 강조
   */
  FEATURES: {
    purpose: '특징 - 기능 강조',
    composition: 'close-up angle showing product details, macro-style clarity, feature highlight',
    textSpace: { right: '35%' },
    lighting: 'even studio lighting, detail-revealing light, soft shadows for depth',
    mood: ['technical', 'detailed', 'quality', 'professional'],
  },

  /**
   * SOCIAL_PROOF: 신뢰/인증 섹션
   * 임상 테스트, 수상 내역 등
   */
  SOCIAL_PROOF: {
    purpose: '신뢰 - 인증/테스트 결과',
    composition: 'product with ample space for certification badges, organized layout, credibility-focused',
    textSpace: { bottom: '40%' },
    lighting: 'bright even lighting, no harsh shadows, clean professional illumination',
    mood: ['clinical', 'trustworthy', 'scientific', 'credible'],
  },

  /**
   * HOW_TO_USE: 사용법 섹션
   * 단계별 사용 가이드
   */
  HOW_TO_USE: {
    purpose: '사용법 - 단계별 가이드',
    composition: 'product in usage context, demonstrative angle, instructional composition',
    textSpace: { top: '30%' },
    lighting: 'natural soft lighting, inviting warm tones, friendly approachable light',
    mood: ['instructional', 'approachable', 'clear', 'user-friendly'],
  },

  /**
   * FAQ: 자주 묻는 질문 섹션
   */
  FAQ: {
    purpose: 'FAQ - 친근한 안내',
    composition: 'relaxed product placement, conversational feel, friendly composition',
    textSpace: { top: '25%', bottom: '25%' },
    lighting: 'soft natural lighting, warm ambient light, friendly inviting glow',
    mood: ['lifestyle', 'relatable', 'casual', 'approachable'],
  },
};

// ============================================
// 공통 품질 태그
// ============================================

export const QUALITY_TAGS = {
  /** 최고 품질 태그 */
  premium: ['masterpiece', 'best quality', 'ultra detailed', '8K UHD', 'sharp focus'],
  /** 상업용 품질 태그 */
  commercial: ['professional photography', 'commercial quality', 'advertising quality'],
  /** 제품 사진 태그 */
  product: ['product photography', 'product shot', 'e-commerce style'],
};

// ============================================
// 카테고리별 스타일 태그
// ============================================

export const CATEGORY_STYLE_TAGS: Record<CategoryType, string[]> = {
  beauty: ['beauty product', 'cosmetic photography', 'Korean beauty', 'K-beauty aesthetic'],
  skincare: ['skincare product', 'clean beauty', 'fresh dewy', 'hydrating glow'],
  makeup: ['makeup product', 'color cosmetic', 'pigment rich', 'beauty editorial'],
  lip: ['lip product', 'lip cosmetic', 'vibrant color', 'glossy finish'],
  haircare: ['haircare product', 'hair treatment', 'silky smooth', 'healthy shine'],
  food: ['food product', 'gourmet photography', 'appetizing', 'fresh ingredients'],
  fashion: ['fashion product', 'apparel photography', 'stylish', 'trendy'],
  electronics: ['tech product', 'gadget photography', 'sleek design', 'modern'],
  default: ['product photography', 'commercial shot', 'professional quality'],
};

// ============================================
// 배경 스타일
// ============================================

export const BACKGROUND_STYLES: Record<string, string> = {
  neutral: 'soft neutral beige',
  white: 'clean pure white',
  cream: 'warm cream ivory',
  pink: 'soft blush pink',
  gray: 'elegant light gray',
  gradient: 'soft gradient',
};

// ============================================
// 재료 키워드 매핑 (제품명 분석용)
// ============================================

export const INGREDIENT_KEYWORDS: Record<string, string> = {
  // 꽃/식물
  '로즈': 'rose petals',
  'rose': 'rose petals',
  '장미': 'rose petals',
  '라벤더': 'lavender sprigs',
  'lavender': 'lavender sprigs',
  '카모마일': 'chamomile flowers',
  '자스민': 'jasmine flowers',

  // 과일
  '베리': 'fresh berries',
  'berry': 'fresh berries',
  '딸기': 'strawberries',
  '체리': 'cherries',
  '피치': 'peach slices',
  '복숭아': 'peach slices',
  '시트러스': 'citrus slices',
  '레몬': 'lemon slices',
  '오렌지': 'orange slices',

  // 기타 재료
  '허니': 'honey drip',
  '꿀': 'golden honey',
  '녹차': 'green tea leaves',
  '그린티': 'green tea leaves',
  '알로에': 'aloe vera',
  '민트': 'fresh mint leaves',

  // 성분
  '히알루론': 'water droplets',
  '비타민': 'citrus elements',
  '콜라겐': 'dewy fresh elements',
  '세라마이드': 'cream swirl',
  '진주': 'pearl beads',
  '골드': 'gold leaf accents',
};

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 섹션 템플릿 가져오기
 */
export function getBaseTemplate(sectionType: SectionType): BaseSectionTemplate {
  return BASE_SECTION_TEMPLATES[sectionType];
}

/**
 * 카테고리 감지
 */
export function detectCategory(category: string): CategoryType {
  const lower = category.toLowerCase();

  if (lower.includes('립') || lower.includes('lip')) return 'lip';
  if (lower.includes('스킨') || lower.includes('skin') || lower.includes('세럼') || lower.includes('크림')) return 'skincare';
  if (lower.includes('메이크업') || lower.includes('makeup') || lower.includes('파운데이션') || lower.includes('쿠션')) return 'makeup';
  if (lower.includes('헤어') || lower.includes('hair')) return 'haircare';
  if (lower.includes('뷰티') || lower.includes('beauty') || lower.includes('화장품')) return 'beauty';
  if (lower.includes('음식') || lower.includes('food') || lower.includes('식품')) return 'food';
  if (lower.includes('패션') || lower.includes('fashion') || lower.includes('의류')) return 'fashion';
  if (lower.includes('전자') || lower.includes('tech') || lower.includes('기기')) return 'electronics';

  return 'default';
}

/**
 * 카테고리 스타일 태그 가져오기
 */
export function getCategoryTags(category: string): string[] {
  const categoryType = detectCategory(category);
  return CATEGORY_STYLE_TAGS[categoryType];
}

/**
 * 제품명에서 재료 키워드 추출
 */
export function extractIngredients(productName: string): string[] {
  const found: string[] = [];
  const lowerName = productName.toLowerCase();

  for (const [keyword, ingredient] of Object.entries(INGREDIENT_KEYWORDS)) {
    if (lowerName.includes(keyword.toLowerCase())) {
      found.push(ingredient);
    }
  }

  // 최대 2개까지만 반환
  return found.slice(0, 2);
}

/**
 * 배경 스타일 가져오기
 */
export function getBackgroundStyle(style?: string): string {
  if (!style) return BACKGROUND_STYLES.neutral;
  return BACKGROUND_STYLES[style] || style;
}
