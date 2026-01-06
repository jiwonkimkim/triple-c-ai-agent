/**
 * 통일된 비주얼 테마 시스템
 * 상세페이지 전체에 걸쳐 일관된 시각적 스타일을 보장
 */

import type { SectionType, BrandToneType } from './types';

// ============================================
// 비주얼 테마 타입 정의
// ============================================

export type ThemeStyle =
  | 'minimal-warm'      // 따뜻한 미니멀 (베이지, 크림)
  | 'minimal-cool'      // 차가운 미니멀 (화이트, 그레이)
  | 'natural-organic'   // 내추럴 오가닉 (그린, 브라운)
  | 'luxury-dark'       // 럭셔리 다크 (블랙, 골드)
  | 'luxury-light'      // 럭셔리 라이트 (화이트, 골드)
  | 'clinical-clean'    // 클리니컬 클린 (화이트, 블루)
  | 'vibrant-pop'       // 바이브런트 팝 (컬러풀)
  | 'soft-pastel';      // 소프트 파스텔 (파스텔톤)

export interface VisualTheme {
  /** 테마 ID */
  id: ThemeStyle;
  /** 테마 이름 (한글) */
  name: string;
  /** 테마 설명 */
  description: string;
  /** 배경색 팔레트 */
  backgroundColors: {
    primary: string;      // 주 배경색 (HEX)
    secondary: string;    // 보조 배경색
    accent: string;       // 강조 배경색
    gradient?: string;    // 그라데이션 지시
  };
  /** 조명 스타일 */
  lighting: {
    style: string;        // 조명 스타일 영문 프롬프트
    temperature: 'warm' | 'neutral' | 'cool';
    intensity: 'soft' | 'medium' | 'dramatic';
  };
  /** 전체 분위기 키워드 (영문) */
  moodKeywords: string[];
  /** 일관성 프롬프트 (모든 섹션에 적용) */
  consistencyPrompt: string;
  /** 적합한 카테고리 */
  suitableCategories: string[];
  /** 적합한 브랜드 톤 */
  suitableBrandTones: BrandToneType[];
}

// ============================================
// 비주얼 테마 프리셋
// ============================================

export const VISUAL_THEMES: Record<ThemeStyle, VisualTheme> = {
  'minimal-warm': {
    id: 'minimal-warm',
    name: '따뜻한 미니멀',
    description: '베이지, 크림톤의 따뜻하고 편안한 미니멀리즘',
    backgroundColors: {
      primary: '#F5F0E8',     // 웜 베이지
      secondary: '#EDE6DB',   // 크림
      accent: '#D4C4A8',      // 샌드
      gradient: 'soft warm beige to cream gradient',
    },
    lighting: {
      style: 'soft natural daylight, warm tone lighting, gentle shadows',
      temperature: 'warm',
      intensity: 'soft',
    },
    moodKeywords: [
      'cozy', 'inviting', 'natural warmth', 'soft beige tones',
      'cream background', 'minimalist warm', 'comfortable aesthetic',
    ],
    consistencyPrompt: 'Maintain consistent warm beige and cream color palette throughout all images. Use soft natural daylight with warm undertones. Keep backgrounds clean with subtle warm gradients. All images should feel cohesive and connected as part of a single product detail page.',
    suitableCategories: ['가전', '주방', '생활용품', '인테리어', '식품'],
    suitableBrandTones: ['clean', 'natural'],
  },

  'minimal-cool': {
    id: 'minimal-cool',
    name: '차가운 미니멀',
    description: '깔끔한 화이트, 그레이톤의 모던한 미니멀리즘',
    backgroundColors: {
      primary: '#FFFFFF',     // 퓨어 화이트
      secondary: '#F8F9FA',   // 라이트 그레이
      accent: '#E9ECEF',      // 쿨 그레이
      gradient: 'clean white to light gray gradient',
    },
    lighting: {
      style: 'crisp studio lighting, neutral white light, clean shadows',
      temperature: 'neutral',
      intensity: 'medium',
    },
    moodKeywords: [
      'modern', 'clean', 'sophisticated', 'pure white',
      'minimalist', 'professional', 'sleek aesthetic',
    ],
    consistencyPrompt: 'Maintain consistent clean white and light gray color palette throughout all images. Use crisp neutral studio lighting. Keep backgrounds pure and minimal with subtle gray gradients. All images should feel cohesive and modern as part of a single product detail page.',
    suitableCategories: ['디지털', '테크', '가전', '스킨케어'],
    suitableBrandTones: ['clean', 'derma'],
  },

  'natural-organic': {
    id: 'natural-organic',
    name: '내추럴 오가닉',
    description: '자연스러운 그린, 브라운톤의 오가닉 무드',
    backgroundColors: {
      primary: '#F4F1EA',     // 오트밀
      secondary: '#E8E4D9',   // 내추럴 베이지
      accent: '#D4DCCD',      // 세이지 그린
      gradient: 'organic oatmeal to sage green subtle gradient',
    },
    lighting: {
      style: 'soft natural sunlight, organic feel, dappled light effect',
      temperature: 'warm',
      intensity: 'soft',
    },
    moodKeywords: [
      'organic', 'natural', 'eco-friendly', 'botanical',
      'earthy tones', 'sustainable', 'green lifestyle',
    ],
    consistencyPrompt: 'Maintain consistent natural oatmeal, beige and sage green color palette throughout all images. Use soft natural sunlight with organic feel. Include subtle botanical elements when appropriate. All images should feel cohesive and eco-friendly as part of a single product detail page.',
    suitableCategories: ['스킨케어', '클렌징', '바디케어', '헤어케어', '식품', '건강'],
    suitableBrandTones: ['natural', 'clean'],
  },

  'luxury-dark': {
    id: 'luxury-dark',
    name: '럭셔리 다크',
    description: '고급스러운 블랙, 골드의 프리미엄 무드',
    backgroundColors: {
      primary: '#1A1A1A',     // 딥 블랙
      secondary: '#2D2D2D',   // 차콜
      accent: '#D4AF37',      // 골드
      gradient: 'dramatic dark black to charcoal gradient with gold accents',
    },
    lighting: {
      style: 'dramatic studio lighting, rim light, high contrast, golden highlights',
      temperature: 'neutral',
      intensity: 'dramatic',
    },
    moodKeywords: [
      'luxury', 'premium', 'sophisticated', 'elegant',
      'high-end', 'exclusive', 'opulent', 'gold accents',
    ],
    consistencyPrompt: 'Maintain consistent deep black and charcoal color palette with subtle gold accents throughout all images. Use dramatic studio lighting with rim lights and golden highlights. Keep backgrounds dark and luxurious. All images should feel cohesive and premium as part of a single high-end product detail page.',
    suitableCategories: ['럭셔리', '프리미엄 스킨케어', '향수', '메이크업'],
    suitableBrandTones: ['luxury'],
  },

  'luxury-light': {
    id: 'luxury-light',
    name: '럭셔리 라이트',
    description: '우아한 화이트, 골드의 밝은 프리미엄 무드',
    backgroundColors: {
      primary: '#FAFAFA',     // 소프트 화이트
      secondary: '#F5F5F5',   // 펄 그레이
      accent: '#D4AF37',      // 골드
      gradient: 'elegant soft white to pearl gray gradient with golden shimmer',
    },
    lighting: {
      style: 'elegant soft lighting, subtle golden reflections, gentle highlights',
      temperature: 'warm',
      intensity: 'soft',
    },
    moodKeywords: [
      'elegant', 'refined', 'sophisticated', 'luxurious',
      'premium white', 'golden shimmer', 'high-end beauty',
    ],
    consistencyPrompt: 'Maintain consistent soft white and pearl gray color palette with subtle gold accents throughout all images. Use elegant soft lighting with golden reflections. Keep backgrounds clean and luxurious. All images should feel cohesive and premium as part of a single elegant product detail page.',
    suitableCategories: ['프리미엄 스킨케어', '에센스', '크림', '메이크업'],
    suitableBrandTones: ['luxury', 'clean'],
  },

  'clinical-clean': {
    id: 'clinical-clean',
    name: '클리니컬 클린',
    description: '신뢰감 있는 화이트, 블루의 클리니컬 무드',
    backgroundColors: {
      primary: '#FFFFFF',     // 퓨어 화이트
      secondary: '#F0F4F8',   // 아이시 블루
      accent: '#4A90D9',      // 메디컬 블루
      gradient: 'clinical pure white to icy blue gradient',
    },
    lighting: {
      style: 'even clinical lighting, neutral white, no harsh shadows, medical-grade clarity',
      temperature: 'cool',
      intensity: 'medium',
    },
    moodKeywords: [
      'clinical', 'medical', 'trustworthy', 'scientific',
      'dermatologist-recommended', 'professional', 'clean',
    ],
    consistencyPrompt: 'Maintain consistent clinical white and soft blue color palette throughout all images. Use even neutral lighting with medical-grade clarity. Keep backgrounds pure and scientific. All images should feel cohesive and trustworthy as part of a single dermatological product detail page.',
    suitableCategories: ['더마', '기능성', '트러블케어', '선케어', '민감성'],
    suitableBrandTones: ['derma', 'clean'],
  },

  'vibrant-pop': {
    id: 'vibrant-pop',
    name: '바이브런트 팝',
    description: '생동감 있는 컬러풀한 영앤트렌디 무드',
    backgroundColors: {
      primary: '#FFF5F5',     // 소프트 핑크
      secondary: '#F0FFF4',   // 민트
      accent: '#FF6B6B',      // 코랄 팝
      gradient: 'playful gradient shifting between soft pastels and vibrant accents',
    },
    lighting: {
      style: 'bright energetic lighting, colorful reflections, youthful glow',
      temperature: 'neutral',
      intensity: 'medium',
    },
    moodKeywords: [
      'vibrant', 'youthful', 'trendy', 'energetic',
      'playful', 'colorful', 'gen-z aesthetic', 'instagram-worthy',
    ],
    consistencyPrompt: 'Maintain consistent vibrant and playful color palette throughout all images. Use bright energetic lighting with colorful accents. Keep backgrounds fresh and youthful. All images should feel cohesive and trendy as part of a single Gen-Z friendly product detail page.',
    suitableCategories: ['메이크업', '립', '네일', '헤어컬러', '바디미스트'],
    suitableBrandTones: ['trendy'],
  },

  'soft-pastel': {
    id: 'soft-pastel',
    name: '소프트 파스텔',
    description: '부드러운 파스텔톤의 로맨틱 무드',
    backgroundColors: {
      primary: '#FDF2F8',     // 블러쉬 핑크
      secondary: '#F3E8FF',   // 라벤더
      accent: '#FBCFE8',      // 로즈
      gradient: 'dreamy soft pastel pink to lavender gradient',
    },
    lighting: {
      style: 'soft diffused lighting, dreamy glow, gentle pastel reflections',
      temperature: 'warm',
      intensity: 'soft',
    },
    moodKeywords: [
      'soft', 'romantic', 'dreamy', 'feminine',
      'pastel', 'gentle', 'delicate', 'ethereal',
    ],
    consistencyPrompt: 'Maintain consistent soft pastel pink and lavender color palette throughout all images. Use soft diffused lighting with dreamy glow. Keep backgrounds gentle and romantic. All images should feel cohesive and feminine as part of a single delicate product detail page.',
    suitableCategories: ['립메이크업', '블러쉬', '아이섀도우', '바디케어', '향수'],
    suitableBrandTones: ['trendy', 'clean'],
  },
};

// ============================================
// 섹션별 테마 적용 가이드
// ============================================

export interface SectionThemeGuide {
  /** 섹션 타입 */
  sectionType: SectionType;
  /** 배경 활용 방식 */
  backgroundUsage: string;
  /** 제품 배치 */
  productPlacement: string;
  /** 추가 요소 */
  additionalElements: string;
  /** 텍스트 영역 */
  textArea: string;
}

export const SECTION_THEME_GUIDES: Partial<Record<SectionType, SectionThemeGuide>> = {
  MAIN: {
    sectionType: 'MAIN',
    backgroundUsage: 'Use primary background color with subtle gradient, product as focal point',
    productPlacement: 'Product centered or slightly off-center, occupying 50-60% of frame',
    additionalElements: 'Minimal props, subtle shadow, brand-consistent styling',
    textArea: 'Upper 30% for headline, lower 20% for subheadline',
  },
  HERO: {
    sectionType: 'HERO',
    backgroundUsage: 'Use primary background color with subtle gradient, product as focal point',
    productPlacement: 'Product centered or slightly off-center, occupying 50-60% of frame',
    additionalElements: 'Minimal props, subtle shadow, brand-consistent styling',
    textArea: 'Upper 30% for headline, lower 20% for subheadline',
  },
  FEATURES: {
    sectionType: 'FEATURES',
    backgroundUsage: 'Use secondary background color, can include subtle pattern or texture',
    productPlacement: 'Product on one side (40%), feature visualization on other side',
    additionalElements: 'Icons, ingredient visuals, infographic elements',
    textArea: 'Text area on opposite side of product, 40-50% of width',
  },
  SOCIAL_PROOF: {
    sectionType: 'SOCIAL_PROOF',
    backgroundUsage: 'Use primary or accent background, clinical/trustworthy feel',
    productPlacement: 'Product smaller, emphasis on results/statistics',
    additionalElements: 'Percentage badges, before-after indicators, trust symbols',
    textArea: 'Statistics prominent, testimonial text areas',
  },
  HOW_TO_USE: {
    sectionType: 'HOW_TO_USE',
    backgroundUsage: 'Use secondary background, clean and instructional',
    productPlacement: 'Product in use context, hands/application visible',
    additionalElements: 'Step numbers, arrows, instructional icons',
    textArea: 'Step-by-step text areas, numbered guides',
  },
  FAQ: {
    sectionType: 'FAQ',
    backgroundUsage: 'Use primary background, product lineup or lifestyle context',
    productPlacement: 'Product collection display or lifestyle setting',
    additionalElements: 'Brand logo area, contact info space, CTA button area',
    textArea: 'Q&A format text areas, info table space',
  },
  CUSTOM: {
    sectionType: 'CUSTOM',
    backgroundUsage: 'Flexible, match overall theme',
    productPlacement: 'Context-dependent',
    additionalElements: 'As needed',
    textArea: 'Flexible layout',
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 카테고리에 맞는 테마 추천
 */
export function recommendThemeForCategory(category: string): ThemeStyle[] {
  const recommendations: ThemeStyle[] = [];

  const lowerCategory = category.toLowerCase();

  for (const [themeId, theme] of Object.entries(VISUAL_THEMES)) {
    const matches = theme.suitableCategories.some(cat =>
      lowerCategory.includes(cat.toLowerCase()) || cat.toLowerCase().includes(lowerCategory)
    );
    if (matches) {
      recommendations.push(themeId as ThemeStyle);
    }
  }

  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push('minimal-warm', 'minimal-cool');
  }

  return recommendations;
}

/**
 * 브랜드 톤에 맞는 테마 추천
 */
export function recommendThemeForBrandTone(brandTone: BrandToneType): ThemeStyle[] {
  const recommendations: ThemeStyle[] = [];

  for (const [themeId, theme] of Object.entries(VISUAL_THEMES)) {
    if (theme.suitableBrandTones.includes(brandTone)) {
      recommendations.push(themeId as ThemeStyle);
    }
  }

  return recommendations.length > 0 ? recommendations : ['minimal-warm'];
}

/**
 * 테마 가져오기
 */
export function getVisualTheme(themeStyle: ThemeStyle): VisualTheme {
  return VISUAL_THEMES[themeStyle];
}

/**
 * 테마 기반 이미지 프롬프트 확장 생성
 */
export function buildThemePromptExtension(theme: VisualTheme, sectionType: SectionType): string {
  const sectionGuide = SECTION_THEME_GUIDES[sectionType] || SECTION_THEME_GUIDES.FEATURES;

  const backgroundPrompt = `Background: ${theme.backgroundColors.gradient || `solid ${theme.backgroundColors.primary}`}`;
  const lightingPrompt = `Lighting: ${theme.lighting.style}`;
  const moodPrompt = `Mood: ${theme.moodKeywords.slice(0, 4).join(', ')}`;
  const placementPrompt = `Layout: ${sectionGuide?.productPlacement || 'Product centered in frame'}`;
  const consistencyPrompt = `[VISUAL CONSISTENCY: ${theme.consistencyPrompt}]`;

  return `${consistencyPrompt} ${backgroundPrompt}. ${lightingPrompt}. ${moodPrompt}. ${placementPrompt}.`;
}

/**
 * 전체 상세페이지 테마 프롬프트 생성
 */
export function buildFullPageThemePrompt(theme: VisualTheme): string {
  return `
[DETAIL PAGE VISUAL THEME: ${theme.name}]
${theme.consistencyPrompt}

Color Palette:
- Primary Background: ${theme.backgroundColors.primary}
- Secondary Background: ${theme.backgroundColors.secondary}
- Accent Color: ${theme.backgroundColors.accent}
- Gradient Style: ${theme.backgroundColors.gradient || 'none'}

Lighting Style: ${theme.lighting.style}
Light Temperature: ${theme.lighting.temperature}
Light Intensity: ${theme.lighting.intensity}

Overall Mood: ${theme.moodKeywords.join(', ')}

CRITICAL: All section images must maintain this consistent visual theme to create a cohesive detail page experience.
`;
}

/**
 * 카테고리와 브랜드 톤을 기반으로 최적 테마 자동 선택
 */
export function autoSelectTheme(category: string, brandTone?: string): ThemeStyle {
  // 브랜드 톤 우선
  if (brandTone) {
    const brandToneType = brandTone.toLowerCase() as BrandToneType;
    const brandRecommendations = recommendThemeForBrandTone(brandToneType);
    if (brandRecommendations.length > 0) {
      return brandRecommendations[0];
    }
  }

  // 카테고리 기반
  const categoryRecommendations = recommendThemeForCategory(category);
  return categoryRecommendations[0];
}
