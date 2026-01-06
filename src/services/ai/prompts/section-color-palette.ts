/**
 * 섹션별 다양한 배경색 시스템
 *
 * 핵심 개념: 섹션마다 다른 배경색을 사용하되,
 * 전체적으로 조화로운 팔레트를 유지하여 통일감 있는 상세페이지 생성
 *
 * 올리브영/hince 상세페이지 분석 기반 설계
 */

import type { ExtendedSectionType } from './section-templates';

// ============================================
// 색상 팔레트 타입 정의
// ============================================

export type PaletteTheme =
  | 'pink-feminine'      // 핑크-베이지-화이트 (립, 블러쉬, 여성향 뷰티)
  | 'beige-natural'      // 베이지-크림-브라운 (스킨케어, 내추럴)
  | 'blue-clinical'      // 블루-화이트-그레이 (더마, 클리니컬)
  | 'green-organic'      // 그린-베이지-크림 (비건, 오가닉)
  | 'coral-vibrant'      // 코랄-피치-화이트 (트렌디, 영앤트렌디)
  | 'nude-minimal'       // 누드-그레이-화이트 (미니멀, 클린)
  | 'purple-luxury'      // 퍼플-핑크-화이트 (럭셔리, 프리미엄)
  | 'warm-glow';         // 웜톤-골드-크림 (안티에이징, 광채)

/**
 * 조화로운 색상 팔레트 정의
 * 각 팔레트는 5개의 조화로운 배경색으로 구성
 */
export interface ColorPalette {
  /** 팔레트 ID */
  id: PaletteTheme;
  /** 팔레트 이름 (한글) */
  name: string;
  /** 팔레트 설명 */
  description: string;
  /** 적합한 카테고리 */
  suitableFor: string[];
  /**
   * 조화로운 배경색 배열 (5개)
   * 각 색상은 HEX 코드와 영문 프롬프트용 설명 포함
   */
  colors: {
    hex: string;
    promptDescription: string;
  }[];
  /** 전체 팔레트 무드 키워드 */
  moodKeywords: string[];
  /** 팔레트 조화 설명 (이미지 프롬프트용) */
  harmonyDescription: string;
}

// ============================================
// 섹션별 배경 역할 정의
// ============================================

export type BackgroundRole =
  | 'hero'          // 메인 히어로 - 가장 브랜드 컬러 강조
  | 'highlight'     // 하이라이트 - 강조 포인트
  | 'soft'          // 소프트 - 부드러운 전환
  | 'clean'         // 클린 - 정보 전달용 깔끔한 배경
  | 'accent';       // 악센트 - 차별화된 포인트

/**
 * 섹션별 배경 역할 매핑
 */
export const SECTION_BACKGROUND_ROLES: Record<ExtendedSectionType, BackgroundRole> = {
  'MAIN': 'hero',
  'HERO': 'hero',
  'BRAND_CONCEPT': 'soft',
  'FEATURES': 'highlight',
  'TEXTURE': 'soft',
  'INGREDIENT': 'accent',
  'PRODUCT_LINEUP': 'clean',
  'SKIN_RESULT': 'clean',
  'MODEL_SHOT': 'soft',
  'SPECS': 'clean',
  'MATERIAL': 'highlight',
  'SOCIAL_PROOF': 'accent',
  'HOW_TO_USE': 'clean',
  'LIFESTYLE': 'soft',
  'FAQ': 'clean',
  'INFO_TABLE': 'clean',
  'CTA': 'hero',
};

/**
 * 배경 역할별 팔레트 색상 인덱스 매핑
 * 각 역할이 팔레트의 몇 번째 색상을 사용할지 결정
 */
export const ROLE_TO_PALETTE_INDEX: Record<BackgroundRole, number[]> = {
  'hero': [0, 1],      // 첫 번째 또는 두 번째 (브랜드 주요 컬러)
  'highlight': [1, 2], // 두 번째 또는 세 번째 (강조)
  'soft': [2, 3],      // 세 번째 또는 네 번째 (소프트 전환)
  'clean': [3, 4],     // 네 번째 또는 다섯 번째 (깔끔한 배경)
  'accent': [1, 4],    // 두 번째 또는 다섯 번째 (차별화)
};

// ============================================
// 색상 팔레트 프리셋
// ============================================

export const COLOR_PALETTES: Record<PaletteTheme, ColorPalette> = {
  'pink-feminine': {
    id: 'pink-feminine',
    name: '핑크 페미닌',
    description: '로맨틱하고 여성스러운 핑크-베이지 팔레트',
    suitableFor: ['립', '틴트', '립스틱', '블러쉬', '쿠션', '메이크업'],
    colors: [
      { hex: '#FFE4EC', promptDescription: 'soft blush pink gradient background' },
      { hex: '#FFF0F5', promptDescription: 'delicate lavender blush background' },
      { hex: '#FDF2F8', promptDescription: 'pale rose cream background' },
      { hex: '#FFFBFC', promptDescription: 'clean soft white with warm pink undertone' },
      { hex: '#FFF5EE', promptDescription: 'warm seashell cream background' },
    ],
    moodKeywords: ['romantic', 'feminine', 'soft', 'delicate', 'pretty', 'lovely'],
    harmonyDescription: 'Cohesive pink-to-cream color palette creating a romantic, feminine aesthetic. Each section background varies within the pink-blush-cream spectrum while maintaining visual harmony.',
  },

  'beige-natural': {
    id: 'beige-natural',
    name: '베이지 내추럴',
    description: '자연스럽고 편안한 베이지-크림 팔레트',
    suitableFor: ['스킨케어', '세럼', '크림', '토너', '에센스', '클렌징'],
    colors: [
      { hex: '#F5F0E8', promptDescription: 'warm oatmeal beige background' },
      { hex: '#EDE6DB', promptDescription: 'soft cream linen background' },
      { hex: '#FAF7F2', promptDescription: 'clean ivory white background' },
      { hex: '#FFFFFF', promptDescription: 'pure clean white background' },
      { hex: '#F8F4EF', promptDescription: 'subtle sand beige background' },
    ],
    moodKeywords: ['natural', 'calm', 'soothing', 'organic', 'clean', 'minimal'],
    harmonyDescription: 'Harmonious beige-to-white color palette creating a natural, calming aesthetic. Backgrounds flow smoothly between warm beige and clean white tones.',
  },

  'blue-clinical': {
    id: 'blue-clinical',
    name: '블루 클리니컬',
    description: '신뢰감 있는 더마/클리니컬 블루 팔레트',
    suitableFor: ['더마', '기능성', '트러블', '선케어', '민감성'],
    colors: [
      { hex: '#F0F4F8', promptDescription: 'soft clinical blue-gray background' },
      { hex: '#E8F4F8', promptDescription: 'gentle icy blue background' },
      { hex: '#FFFFFF', promptDescription: 'pure medical white background' },
      { hex: '#F5F9FC', promptDescription: 'clean sky blue tint background' },
      { hex: '#EDF2F7', promptDescription: 'subtle steel blue background' },
    ],
    moodKeywords: ['clinical', 'trustworthy', 'scientific', 'clean', 'professional', 'medical'],
    harmonyDescription: 'Clinical blue-white color palette creating a trustworthy, scientific aesthetic. Clean backgrounds with subtle blue undertones convey professionalism.',
  },

  'green-organic': {
    id: 'green-organic',
    name: '그린 오가닉',
    description: '친환경적이고 자연스러운 그린-베이지 팔레트',
    suitableFor: ['비건', '오가닉', '친환경', '바디케어', '헤어케어'],
    colors: [
      { hex: '#F4F7F4', promptDescription: 'fresh sage green tint background' },
      { hex: '#E8F0E8', promptDescription: 'soft mint green background' },
      { hex: '#F5F3EE', promptDescription: 'natural oatmeal cream background' },
      { hex: '#FAFAF8', promptDescription: 'clean off-white with green undertone' },
      { hex: '#F0EDE8', promptDescription: 'warm earth tone background' },
    ],
    moodKeywords: ['organic', 'eco-friendly', 'natural', 'sustainable', 'fresh', 'botanical'],
    harmonyDescription: 'Organic green-beige color palette creating an eco-friendly, natural aesthetic. Fresh green tones blend with warm earth tones for botanical feel.',
  },

  'coral-vibrant': {
    id: 'coral-vibrant',
    name: '코랄 바이브런트',
    description: '활기차고 트렌디한 코랄-피치 팔레트',
    suitableFor: ['트렌디', '영앤트렌디', '립글로스', '블러쉬', '섀도우'],
    colors: [
      { hex: '#FFF0ED', promptDescription: 'soft coral peach background' },
      { hex: '#FFE8E0', promptDescription: 'warm apricot glow background' },
      { hex: '#FFF5F0', promptDescription: 'delicate peach cream background' },
      { hex: '#FFFBFA', promptDescription: 'clean white with peachy warmth' },
      { hex: '#FFF8F5', promptDescription: 'subtle tangerine tint background' },
    ],
    moodKeywords: ['vibrant', 'youthful', 'fresh', 'energetic', 'trendy', 'playful'],
    harmonyDescription: 'Vibrant coral-peach color palette creating a youthful, energetic aesthetic. Warm peachy tones create fresh, Instagram-worthy visuals.',
  },

  'nude-minimal': {
    id: 'nude-minimal',
    name: '누드 미니멀',
    description: '세련되고 미니멀한 누드-그레이 팔레트',
    suitableFor: ['미니멀', '클린뷰티', '프리미엄', '베이스'],
    colors: [
      { hex: '#F5F3F0', promptDescription: 'sophisticated greige background' },
      { hex: '#EBE8E4', promptDescription: 'elegant warm gray background' },
      { hex: '#FAFAFA', promptDescription: 'minimal pure white background' },
      { hex: '#FFFFFF', promptDescription: 'clean stark white background' },
      { hex: '#F0EDEA', promptDescription: 'subtle taupe nude background' },
    ],
    moodKeywords: ['minimal', 'sophisticated', 'clean', 'modern', 'elegant', 'refined'],
    harmonyDescription: 'Minimal nude-gray color palette creating a sophisticated, refined aesthetic. Subtle warm grays and clean whites convey premium minimalism.',
  },

  'purple-luxury': {
    id: 'purple-luxury',
    name: '퍼플 럭셔리',
    description: '고급스럽고 우아한 퍼플-핑크 팔레트',
    suitableFor: ['럭셔리', '프리미엄', '안티에이징', '에센스', '향수'],
    colors: [
      { hex: '#F8F0F8', promptDescription: 'elegant soft lavender background' },
      { hex: '#F5E8F5', promptDescription: 'luxurious mauve pink background' },
      { hex: '#FDF5FC', promptDescription: 'delicate orchid cream background' },
      { hex: '#FDFBFD', promptDescription: 'pristine white with violet undertone' },
      { hex: '#F0E8F0', promptDescription: 'subtle dusty purple background' },
    ],
    moodKeywords: ['luxury', 'elegant', 'premium', 'sophisticated', 'regal', 'opulent'],
    harmonyDescription: 'Luxurious purple-pink color palette creating an elegant, premium aesthetic. Soft lavender and mauve tones convey sophistication and exclusivity.',
  },

  'warm-glow': {
    id: 'warm-glow',
    name: '웜 글로우',
    description: '따뜻하고 광채나는 웜톤-골드 팔레트',
    suitableFor: ['안티에이징', '광채', '탄력', '영양크림', '오일'],
    colors: [
      { hex: '#FFF8F0', promptDescription: 'warm golden glow background' },
      { hex: '#FFF5E8', promptDescription: 'soft champagne cream background' },
      { hex: '#FFFBF5', promptDescription: 'delicate honey cream background' },
      { hex: '#FFFEFA', promptDescription: 'clean ivory with golden warmth' },
      { hex: '#F8F0E0', promptDescription: 'rich warm sand background' },
    ],
    moodKeywords: ['warm', 'glowing', 'radiant', 'luxurious', 'golden', 'nourishing'],
    harmonyDescription: 'Warm golden color palette creating a radiant, luxurious aesthetic. Honey and champagne tones convey warmth and premium skincare benefits.',
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 카테고리에 맞는 색상 팔레트 추천
 */
export function recommendPaletteForCategory(category: string): PaletteTheme[] {
  const recommendations: PaletteTheme[] = [];
  const lowerCategory = category.toLowerCase();

  for (const [paletteId, palette] of Object.entries(COLOR_PALETTES)) {
    const matches = palette.suitableFor.some(cat =>
      lowerCategory.includes(cat.toLowerCase()) || cat.toLowerCase().includes(lowerCategory)
    );
    if (matches) {
      recommendations.push(paletteId as PaletteTheme);
    }
  }

  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push('beige-natural', 'nude-minimal');
  }

  return recommendations;
}

/**
 * 제품 컬러 키워드에서 팔레트 추천
 */
export function recommendPaletteFromProductColor(colorKeyword: string): PaletteTheme {
  const colorMap: Record<string, PaletteTheme> = {
    // 핑크 계열
    '핑크': 'pink-feminine',
    'pink': 'pink-feminine',
    '로즈': 'pink-feminine',
    'rose': 'pink-feminine',
    '체리': 'pink-feminine',
    '블러쉬': 'pink-feminine',

    // 코랄/피치 계열
    '코랄': 'coral-vibrant',
    'coral': 'coral-vibrant',
    '피치': 'coral-vibrant',
    'peach': 'coral-vibrant',
    '오렌지': 'coral-vibrant',
    '살구': 'coral-vibrant',

    // 베이지/누드 계열
    '베이지': 'beige-natural',
    'beige': 'beige-natural',
    '누드': 'nude-minimal',
    'nude': 'nude-minimal',
    '브라운': 'beige-natural',

    // 퍼플/라벤더 계열
    '퍼플': 'purple-luxury',
    'purple': 'purple-luxury',
    '라벤더': 'purple-luxury',
    '바이올렛': 'purple-luxury',

    // 그린 계열
    '그린': 'green-organic',
    'green': 'green-organic',
    '민트': 'green-organic',

    // 블루 계열
    '블루': 'blue-clinical',
    'blue': 'blue-clinical',
  };

  const lowerKeyword = colorKeyword.toLowerCase();
  for (const [key, palette] of Object.entries(colorMap)) {
    if (lowerKeyword.includes(key)) {
      return palette;
    }
  }

  return 'beige-natural'; // 기본값
}

/**
 * 섹션에 맞는 배경색 프롬프트 생성
 * @param palette 색상 팔레트
 * @param sectionType 섹션 타입
 * @param sectionIndex 해당 섹션의 순서 (다양성을 위해)
 */
export function getSectionBackgroundPrompt(
  palette: ColorPalette,
  sectionType: ExtendedSectionType,
  sectionIndex: number = 0
): string {
  const role = SECTION_BACKGROUND_ROLES[sectionType];
  const colorIndices = ROLE_TO_PALETTE_INDEX[role];

  // 섹션 인덱스를 활용해 같은 역할이라도 다른 색상 선택 가능
  const selectedIndex = colorIndices[sectionIndex % colorIndices.length];
  const selectedColor = palette.colors[selectedIndex];

  return selectedColor.promptDescription;
}

/**
 * 전체 상세페이지용 팔레트 조화 프롬프트 생성
 */
export function buildPaletteHarmonyPrompt(palette: ColorPalette): string {
  return `
[COHESIVE COLOR PALETTE: ${palette.name}]
${palette.harmonyDescription}

Available background colors in this palette:
${palette.colors.map((c, i) => `${i + 1}. ${c.promptDescription} (${c.hex})`).join('\n')}

Overall mood: ${palette.moodKeywords.join(', ')}

CRITICAL: Use DIFFERENT background colors from this palette for each section to create visual variety while maintaining cohesive harmony. Do NOT use the same background for all sections.
`;
}

/**
 * 섹션별 배경색 맵 생성 (전체 상세페이지용)
 */
export function generateSectionBackgroundMap(
  palette: ColorPalette,
  sections: ExtendedSectionType[]
): Map<ExtendedSectionType, { hex: string; prompt: string }> {
  const result = new Map<ExtendedSectionType, { hex: string; prompt: string }>();

  // 역할별 사용 카운터 (다양성 보장)
  const roleUsageCount: Record<BackgroundRole, number> = {
    'hero': 0,
    'highlight': 0,
    'soft': 0,
    'clean': 0,
    'accent': 0,
  };

  for (const section of sections) {
    const role = SECTION_BACKGROUND_ROLES[section];
    const colorIndices = ROLE_TO_PALETTE_INDEX[role];

    // 해당 역할의 사용 횟수에 따라 다른 색상 선택
    const usageIndex = roleUsageCount[role];
    const selectedIndex = colorIndices[usageIndex % colorIndices.length];
    const selectedColor = palette.colors[selectedIndex];

    result.set(section, {
      hex: selectedColor.hex,
      prompt: selectedColor.promptDescription,
    });

    roleUsageCount[role]++;
  }

  return result;
}

/**
 * 섹션 이미지 프롬프트에 배경색 정보 주입
 */
export function injectBackgroundToPrompt(
  originalPrompt: string,
  backgroundPrompt: string,
  palette: ColorPalette
): string {
  // {background} 플레이스홀더를 구체적인 배경색으로 치환
  let enhancedPrompt = originalPrompt.replace(/{background}/g, backgroundPrompt);

  // 팔레트 조화 정보 추가
  const harmonyNote = `
[PALETTE HARMONY NOTE]
This image is part of a cohesive ${palette.name} palette detail page.
Background should be: ${backgroundPrompt}
Maintain visual harmony with other sections while using this specific background variation.
`;

  return enhancedPrompt + '\n' + harmonyNote;
}

/**
 * 자동 팔레트 선택 (카테고리 + 제품명/색상 키워드 기반)
 */
export function autoSelectPalette(
  category: string,
  productName?: string,
  brandTone?: string
): PaletteTheme {
  // 1. 제품명에서 색상 키워드 추출 시도
  if (productName) {
    const colorKeywords = ['핑크', '로즈', '코랄', '피치', '베이지', '누드', '퍼플', '그린', '블루'];
    for (const keyword of colorKeywords) {
      if (productName.toLowerCase().includes(keyword.toLowerCase())) {
        return recommendPaletteFromProductColor(keyword);
      }
    }
  }

  // 2. 브랜드 톤 기반 추천
  if (brandTone) {
    const toneMap: Record<string, PaletteTheme> = {
      'luxury': 'purple-luxury',
      '럭셔리': 'purple-luxury',
      'clean': 'nude-minimal',
      '클린': 'nude-minimal',
      'natural': 'beige-natural',
      '내추럴': 'beige-natural',
      'trendy': 'coral-vibrant',
      '트렌디': 'coral-vibrant',
      'derma': 'blue-clinical',
      '더마': 'blue-clinical',
    };
    const mappedPalette = toneMap[brandTone.toLowerCase()];
    if (mappedPalette) return mappedPalette;
  }

  // 3. 카테고리 기반 추천
  const categoryRecommendations = recommendPaletteForCategory(category);
  return categoryRecommendations[0];
}

/**
 * 팔레트 가져오기
 */
export function getColorPalette(paletteTheme: PaletteTheme): ColorPalette {
  return COLOR_PALETTES[paletteTheme];
}

/**
 * 모든 팔레트 목록
 */
export function getAllPalettes(): ColorPalette[] {
  return Object.values(COLOR_PALETTES);
}
