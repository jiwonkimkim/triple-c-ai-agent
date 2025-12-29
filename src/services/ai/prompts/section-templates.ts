/**
 * 섹션 템플릿 시스템
 * 첨부 이미지와 같은 전문적인 상세페이지 섹션 구조 정의
 */

import type { SectionType, LayoutStyle } from './types';

// ============================================
// 확장된 섹션 타입 (첨부 이미지 기반)
// ============================================

export type ExtendedSectionType =
  | 'HERO'              // 메인 히어로 (제품 + 브랜드명 + 슬로건)
  | 'FEATURES'          // 특징 아이콘 그리드
  | 'SPECS'             // 사양/스펙 다이어그램
  | 'MATERIAL'          // 재질/성분 하이라이트
  | 'SOCIAL_PROOF'      // 수치/신뢰 데이터
  | 'HOW_TO_USE'        // 사용법 단계별
  | 'LIFESTYLE'         // 라이프스타일 무드샷
  | 'FAQ'               // 자주 묻는 질문
  | 'INFO_TABLE'        // 제품 정보표
  | 'CTA';              // 구매 유도/고객센터

// ============================================
// 섹션 템플릿 정의
// ============================================

export interface SectionTemplate {
  /** 섹션 타입 */
  type: ExtendedSectionType;
  /** 섹션 이름 (한글) */
  name: string;
  /** 섹션 목적 */
  purpose: string;
  /** 권장 레이아웃 */
  recommendedLayout: LayoutStyle;
  /** 이미지 프롬프트 템플릿 */
  imagePromptTemplate: string;
  /** 필수 시각 요소 */
  requiredVisuals: string[];
  /** 선택 시각 요소 */
  optionalVisuals: string[];
  /** 텍스트 오버레이 가이드 */
  textOverlay: {
    headline: boolean;
    subheadline: boolean;
    body: boolean;
    bullets: boolean;
    numbers: boolean;
    icons: boolean;
  };
  /** 이미지 생성 여부 */
  generateImage: boolean;
  /** 섹션 순서 (기본) */
  defaultOrder: number;
}

// ============================================
// 섹션 템플릿 프리셋
// 첨부 이미지 분석 기반 구조
// ============================================

export const SECTION_TEMPLATES: Record<ExtendedSectionType, SectionTemplate> = {
  HERO: {
    type: 'HERO',
    name: '히어로 섹션',
    purpose: '첫인상, 브랜드와 제품의 핵심 가치 전달',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `professional product photography of {product} as hero shot, elegant centered composition, product occupying 50-60% of frame height, clean {background} background with subtle gradient, soft studio lighting with gentle highlights, premium product advertisement style, space reserved at top for brand name and headline text, space at bottom for tagline, high-end e-commerce detail page aesthetic, 8k quality`,
    requiredVisuals: ['product-centered', 'clean-background', 'text-space-top', 'text-space-bottom'],
    optionalVisuals: ['brand-logo-area', 'subtle-shadow', 'reflection'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 0,
  },

  FEATURES: {
    type: 'FEATURES',
    name: '특징 아이콘 그리드',
    purpose: '주요 특징/스펙을 아이콘과 함께 한눈에 보여주기',
    recommendedLayout: 'grid',
    imagePromptTemplate: `product feature showcase of {product}, product image on upper portion, clean {background} background, lower portion reserved for feature icon grid layout, 4 feature highlight areas arranged in row, minimalist infographic style, space for icons and short text labels, professional product specification display, clean lines and organized layout, detail page feature section aesthetic`,
    requiredVisuals: ['product-upper', 'icon-grid-area', 'clean-dividers'],
    optionalVisuals: ['measurement-lines', 'spec-numbers'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 1,
  },

  SPECS: {
    type: 'SPECS',
    name: '사양 다이어그램',
    purpose: '제품 크기, 치수, 상세 사양 시각화',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `technical product diagram of {product}, product shown from optimal angle to display dimensions, clean {background} background, dimension indicator lines and arrows pointing to key measurements, technical drawing style with clean aesthetics, space for size labels and measurements, professional product specification diagram, detail page specs section`,
    requiredVisuals: ['product-angle', 'dimension-lines', 'measurement-labels'],
    optionalVisuals: ['scale-reference', 'cutaway-view'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 2,
  },

  MATERIAL: {
    type: 'MATERIAL',
    name: '재질/성분 하이라이트',
    purpose: '핵심 재질이나 성분을 강조 (예: 304 스테인리스)',
    recommendedLayout: 'hero-bottom',
    imagePromptTemplate: `material highlight shot of {product}, close-up angle emphasizing material quality and texture, {material} material showcase, clean {background} background, dramatic lighting to highlight material finish, upper portion clear for large headline text about material, product surface detail visible, premium material advertisement style, detail page material section`,
    requiredVisuals: ['material-texture', 'close-up-detail', 'headline-space'],
    optionalVisuals: ['material-comparison', 'quality-indicators'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 3,
  },

  SOCIAL_PROOF: {
    type: 'SOCIAL_PROOF',
    name: '신뢰 데이터 섹션',
    purpose: '수치, 테스트 결과, 인증 등 신뢰 구축',
    recommendedLayout: 'comparison',
    imagePromptTemplate: `trust-building product visualization of {product}, product shown in clinical/test context, clean {background} background, space for percentage numbers and statistics badges, before-after comparison layout style, professional certification display aesthetic, data visualization friendly composition, detail page social proof section`,
    requiredVisuals: ['product-context', 'stats-space', 'trust-indicators'],
    optionalVisuals: ['certification-badges', 'test-results-area'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 4,
  },

  HOW_TO_USE: {
    type: 'HOW_TO_USE',
    name: '사용법 섹션',
    purpose: '단계별 사용 방법 안내',
    recommendedLayout: 'step-sequence',
    imagePromptTemplate: `product usage demonstration of {product}, product being used in realistic context, {context} setting, clean {background} tones, instructional composition showing product in action, space for step numbers and guide text, bright clear lighting, how-to tutorial aesthetic, detail page usage guide section`,
    requiredVisuals: ['product-in-use', 'step-indicators', 'instructional-layout'],
    optionalVisuals: ['hands-demonstration', 'result-preview'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: true,
      bullets: false,
      numbers: true,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 5,
  },

  LIFESTYLE: {
    type: 'LIFESTYLE',
    name: '라이프스타일 무드샷',
    purpose: '제품이 있는 일상의 모습, 감성적 연결',
    recommendedLayout: 'lifestyle',
    imagePromptTemplate: `lifestyle mood shot featuring {product}, product naturally placed in {context} environment, warm inviting atmosphere, {background} color tones, aspirational lifestyle photography, soft natural lighting, product integrated into beautiful living space, editorial style composition, detail page lifestyle section`,
    requiredVisuals: ['environmental-context', 'lifestyle-props', 'mood-lighting'],
    optionalVisuals: ['human-element', 'complementary-items'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 6,
  },

  FAQ: {
    type: 'FAQ',
    name: '자주 묻는 질문',
    purpose: '구매 전 의문 해소, 추가 정보 제공',
    recommendedLayout: 'split-right',
    imagePromptTemplate: `product Q&A context shot of {product}, product displayed elegantly on side, clean {background} background, large text-friendly area for questions and answers, professional customer service aesthetic, organized information layout style, detail page FAQ section`,
    requiredVisuals: ['product-side', 'text-dominant-area'],
    optionalVisuals: ['question-icons', 'info-graphics'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: true,
      bullets: true,
      numbers: false,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 7,
  },

  INFO_TABLE: {
    type: 'INFO_TABLE',
    name: '제품 정보표',
    purpose: '상세 제품 정보, 규격, 제조사 정보 등',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `product information display of {product}, small product image on side, clean {background} background, large space for product specification table, organized information layout, professional product detail aesthetic, e-commerce info table section style`,
    requiredVisuals: ['product-small', 'table-area', 'organized-layout'],
    optionalVisuals: ['brand-logo', 'qr-code-area'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 8,
  },

  CTA: {
    type: 'CTA',
    name: 'CTA/고객센터',
    purpose: '구매 유도, 고객센터 연락처, 마무리',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `call-to-action product shot of {product}, product elegantly displayed, clean {background} background, warm inviting atmosphere, space for customer service information and contact details, purchase motivation composition, final impression aesthetic, detail page closing section`,
    requiredVisuals: ['product-final', 'cta-space', 'contact-area'],
    optionalVisuals: ['brand-elements', 'trust-badges'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 9,
  },
};

// ============================================
// 카테고리별 권장 섹션 구성
// ============================================

export interface CategorySectionConfig {
  /** 카테고리명 */
  category: string;
  /** 권장 섹션 순서 */
  recommendedSections: ExtendedSectionType[];
  /** 필수 섹션 */
  requiredSections: ExtendedSectionType[];
  /** 선택 섹션 */
  optionalSections: ExtendedSectionType[];
}

export const CATEGORY_SECTION_CONFIGS: Record<string, CategorySectionConfig> = {
  '가전': {
    category: '가전',
    recommendedSections: ['HERO', 'FEATURES', 'SPECS', 'MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'SPECS', 'INFO_TABLE'],
    optionalSections: ['MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'CTA'],
  },
  '스킨케어': {
    category: '스킨케어',
    recommendedSections: ['HERO', 'FEATURES', 'MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'INFO_TABLE'],
    requiredSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF'],
    optionalSections: ['MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
  },
  '메이크업': {
    category: '메이크업',
    recommendedSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ'],
    requiredSections: ['HERO', 'FEATURES', 'HOW_TO_USE'],
    optionalSections: ['SOCIAL_PROOF', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
  },
  '식품': {
    category: '식품',
    recommendedSections: ['HERO', 'FEATURES', 'MATERIAL', 'HOW_TO_USE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'INFO_TABLE'],
    optionalSections: ['MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'CTA'],
  },
  'default': {
    category: 'default',
    recommendedSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'],
    requiredSections: ['HERO', 'FEATURES'],
    optionalSections: ['SPECS', 'MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 섹션 템플릿 가져오기
 */
export function getSectionTemplate(sectionType: ExtendedSectionType): SectionTemplate {
  return SECTION_TEMPLATES[sectionType];
}

/**
 * 기존 SectionType을 ExtendedSectionType으로 매핑
 */
export function mapToExtendedSectionType(sectionType: SectionType): ExtendedSectionType {
  const mapping: Record<SectionType, ExtendedSectionType> = {
    'HERO': 'HERO',
    'FEATURES': 'FEATURES',
    'SOCIAL_PROOF': 'SOCIAL_PROOF',
    'HOW_TO_USE': 'HOW_TO_USE',
    'FAQ': 'FAQ',
    'CUSTOM': 'FEATURES', // 기본값
  };
  return mapping[sectionType];
}

/**
 * 카테고리별 섹션 구성 가져오기
 */
export function getCategorySectionConfig(category: string): CategorySectionConfig {
  const lowerCategory = category.toLowerCase();

  for (const [key, config] of Object.entries(CATEGORY_SECTION_CONFIGS)) {
    if (key !== 'default' && lowerCategory.includes(key.toLowerCase())) {
      return config;
    }
  }

  return CATEGORY_SECTION_CONFIGS['default'];
}

/**
 * 섹션 템플릿 이미지 프롬프트 빌드
 */
export function buildSectionTemplatePrompt(
  template: SectionTemplate,
  productName: string,
  backgroundStyle: string,
  contextOrMaterial?: string
): string {
  let prompt = template.imagePromptTemplate;

  // 플레이스홀더 치환
  prompt = prompt.replace(/{product}/g, productName);
  prompt = prompt.replace(/{background}/g, backgroundStyle);

  if (contextOrMaterial) {
    prompt = prompt.replace(/{material}/g, contextOrMaterial);
    prompt = prompt.replace(/{context}/g, contextOrMaterial);
  } else {
    prompt = prompt.replace(/{material}/g, 'premium quality');
    prompt = prompt.replace(/{context}/g, 'modern living');
  }

  return prompt;
}

/**
 * 전체 상세페이지 섹션 구성 생성
 */
export function generateDetailPageStructure(
  category: string,
  includeAllSections: boolean = false
): ExtendedSectionType[] {
  const config = getCategorySectionConfig(category);

  if (includeAllSections) {
    return config.recommendedSections;
  }

  return config.requiredSections;
}

/**
 * 이미지 생성이 필요한 섹션인지 확인
 */
export function shouldGenerateImageForSection(sectionType: SectionType | ExtendedSectionType): boolean {
  const extendedType = typeof sectionType === 'string' && sectionType in SECTION_TEMPLATES
    ? sectionType as ExtendedSectionType
    : mapToExtendedSectionType(sectionType as SectionType);

  const template = SECTION_TEMPLATES[extendedType];
  return template?.generateImage ?? true;
}
