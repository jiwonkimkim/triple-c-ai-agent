/**
 * 이미지 구도 프리셋
 * 상세페이지 특화 레이아웃, 텍스트 안전 영역, 네거티브 프롬프트 정의
 */

import type {
  SectionType,
  LayoutStyle,
  DetailPageLayoutPreset,
  SafeZonePosition,
  TextSafeZone,
  NegativePromptCategory,
  NegativePromptConfig,
} from './types';

// ============================================
// 레이아웃 프리셋
// 상세페이지에 특화된 구도 설정
// ============================================

export const LAYOUT_PRESETS: Record<LayoutStyle, DetailPageLayoutPreset> = {
  'hero-centered': {
    style: 'hero-centered',
    description: '제품 중앙 배치, 상하단 텍스트 영역 확보',
    productPlacement: 'single product centered in the middle of frame, vertically centered with equal spacing above and below',
    composition: 'symmetrical centered composition, product occupies 40-50% of frame height, generous negative space at top and bottom for text overlay, clean uncluttered background',
    aspectRatio: '3:4',
    suitableFor: ['HERO', 'FAQ'],
  },

  'hero-bottom': {
    style: 'hero-bottom',
    description: '제품 하단 배치, 상단에 넓은 텍스트 영역',
    productPlacement: 'product positioned in the lower third of frame, anchored at bottom',
    composition: 'bottom-weighted composition, upper 60% of frame is clean background suitable for headline text, product creates visual anchor at bottom',
    aspectRatio: '3:4',
    suitableFor: ['HERO', 'FEATURES'],
  },

  'split-left': {
    style: 'split-left',
    description: '제품 좌측, 우측에 텍스트 영역',
    productPlacement: 'product positioned on the left side of frame, occupying left 40-45% of width',
    composition: 'asymmetrical split composition, left side features product with subtle shadow, right side is clean negative space for text placement, balanced visual weight',
    aspectRatio: '4:3',
    suitableFor: ['FEATURES', 'SOCIAL_PROOF'],
  },

  'split-right': {
    style: 'split-right',
    description: '제품 우측, 좌측에 텍스트 영역',
    productPlacement: 'product positioned on the right side of frame, occupying right 40-45% of width',
    composition: 'asymmetrical split composition, right side features product, left side is clean negative space for text placement, natural reading flow from left text to right product',
    aspectRatio: '4:3',
    suitableFor: ['FEATURES', 'HOW_TO_USE'],
  },

  'floating': {
    style: 'floating',
    description: '제품 부유 효과, 드라마틱한 연출',
    productPlacement: 'product floating in center with subtle shadow below suggesting levitation, dynamic angle',
    composition: 'dramatic floating composition, product appears weightless, soft gradient background, ethereal lighting from above, creates premium aspirational feel',
    aspectRatio: '1:1',
    suitableFor: ['HERO', 'FEATURES'],
  },

  'grid': {
    style: 'grid',
    description: '그리드 배치, 성분 또는 제품 라인업',
    productPlacement: 'multiple elements arranged in organized grid pattern, main product prominent with supporting elements',
    composition: 'structured grid layout, 2x2 or 3x3 arrangement, consistent spacing between elements, clean alignment, professional catalog style',
    aspectRatio: '1:1',
    suitableFor: ['FEATURES', 'FAQ'],
  },

  'comparison': {
    style: 'comparison',
    description: 'Before/After 비교 레이아웃',
    productPlacement: 'product shown in context of comparison, positioned to show transformation or difference',
    composition: 'split-screen comparison layout, clear visual division between before and after states, consistent lighting across both sides, clinical documentation style',
    aspectRatio: '16:9',
    suitableFor: ['SOCIAL_PROOF'],
  },

  'step-sequence': {
    style: 'step-sequence',
    description: '단계별 시퀀스 레이아웃',
    productPlacement: 'product shown in usage context, hands or application visible, instructional positioning',
    composition: 'sequential flow composition suggesting steps, clear visual hierarchy, numbered or ordered arrangement implied, tutorial-friendly layout',
    aspectRatio: '3:4',
    suitableFor: ['HOW_TO_USE'],
  },

  'lifestyle': {
    style: 'lifestyle',
    description: '라이프스타일 컨텍스트, 사용 환경',
    productPlacement: 'product naturally integrated into lifestyle setting, contextual placement on vanity, bathroom shelf, or beauty space',
    composition: 'environmental lifestyle composition, product in natural setting, soft depth of field, aspirational atmosphere, real-world context',
    aspectRatio: '4:3',
    suitableFor: ['HERO', 'HOW_TO_USE', 'FAQ'],
  },
};

// ============================================
// 섹션별 권장 레이아웃 매핑
// ============================================

export const SECTION_LAYOUT_RECOMMENDATIONS: Partial<Record<SectionType, LayoutStyle[]>> = {
  MAIN: ['hero-centered', 'hero-bottom', 'floating', 'lifestyle'],
  HERO: ['hero-centered', 'hero-bottom', 'floating', 'lifestyle'],
  FEATURES: ['split-left', 'split-right', 'grid', 'floating'],
  SOCIAL_PROOF: ['comparison', 'split-left', 'hero-centered'],
  HOW_TO_USE: ['step-sequence', 'split-right', 'lifestyle'],
  FAQ: ['hero-centered', 'grid', 'lifestyle'],
  CUSTOM: ['hero-centered', 'split-left', 'split-right'],
};

// ============================================
// 텍스트 안전 영역 (Text Safe Zones)
// 텍스트 오버레이가 들어갈 영역 정의
// ============================================

export const TEXT_SAFE_ZONES: Record<SafeZonePosition, TextSafeZone> = {
  'top-full': {
    position: 'top-full',
    description: '상단 전체 영역 (헤드라인용)',
    clearanceInstruction: 'keep the top 30% of the image completely clear with solid or gradient background, no product elements in upper area, space reserved for large headline text',
    recommendedContent: ['headline', 'subheadline'],
    textAlign: 'center',
  },

  'top-left': {
    position: 'top-left',
    description: '좌상단 영역',
    clearanceInstruction: 'keep the upper-left quadrant clear with minimal visual elements, soft background suitable for left-aligned text overlay',
    recommendedContent: ['headline', 'subheadline', 'body'],
    textAlign: 'left',
  },

  'top-right': {
    position: 'top-right',
    description: '우상단 영역',
    clearanceInstruction: 'keep the upper-right quadrant clear with minimal visual elements, soft background suitable for right-aligned text overlay',
    recommendedContent: ['headline', 'statistics'],
    textAlign: 'right',
  },

  'center-left': {
    position: 'center-left',
    description: '좌측 중앙 영역',
    clearanceInstruction: 'keep the left 40% of frame clear from center, product positioned on right side, left area has clean background for body text',
    recommendedContent: ['headline', 'subheadline', 'body', 'statistics'],
    textAlign: 'left',
  },

  'center-right': {
    position: 'center-right',
    description: '우측 중앙 영역',
    clearanceInstruction: 'keep the right 40% of frame clear from center, product positioned on left side, right area has clean background for body text',
    recommendedContent: ['headline', 'subheadline', 'body', 'statistics'],
    textAlign: 'right',
  },

  'bottom-full': {
    position: 'bottom-full',
    description: '하단 전체 영역 (CTA용)',
    clearanceInstruction: 'keep the bottom 25% of image clear with solid or gradient background fading from product area, space reserved for call-to-action text and buttons',
    recommendedContent: ['cta', 'subheadline'],
    textAlign: 'center',
  },

  'bottom-left': {
    position: 'bottom-left',
    description: '좌하단 영역',
    clearanceInstruction: 'keep the lower-left area clear, suitable for product details or small text blocks',
    recommendedContent: ['body', 'statistics', 'cta'],
    textAlign: 'left',
  },

  'bottom-right': {
    position: 'bottom-right',
    description: '우하단 영역',
    clearanceInstruction: 'keep the lower-right area clear, suitable for brand elements or call-to-action',
    recommendedContent: ['cta', 'statistics'],
    textAlign: 'right',
  },

  'overlay-center': {
    position: 'overlay-center',
    description: '중앙 오버레이 (제품 위 또는 배경에)',
    clearanceInstruction: 'ensure center of image has sufficient contrast for overlaid text, product can be present but background should support text readability',
    recommendedContent: ['headline', 'statistics'],
    textAlign: 'center',
  },
};

// ============================================
// 레이아웃별 권장 텍스트 영역 매핑
// ============================================

export const LAYOUT_SAFE_ZONE_MAPPING: Record<LayoutStyle, SafeZonePosition[]> = {
  'hero-centered': ['top-full', 'bottom-full'],
  'hero-bottom': ['top-full', 'top-left', 'top-right'],
  'split-left': ['center-right', 'top-right', 'bottom-right'],
  'split-right': ['center-left', 'top-left', 'bottom-left'],
  'floating': ['top-full', 'bottom-full', 'overlay-center'],
  'grid': ['top-full', 'bottom-full'],
  'comparison': ['top-full', 'bottom-full'],
  'step-sequence': ['top-full', 'center-left', 'bottom-full'],
  'lifestyle': ['top-left', 'bottom-right', 'overlay-center'],
};

// ============================================
// 네거티브 프롬프트
// 이미지 생성 시 제외할 요소들
// ============================================

export const NEGATIVE_PROMPTS: Record<NegativePromptCategory, NegativePromptConfig> = {
  quality: {
    category: 'quality',
    description: '저품질 요소 제외',
    excludeTerms: [
      'low quality',
      'blurry',
      'pixelated',
      'grainy',
      'noisy',
      'artifacts',
      'jpeg artifacts',
      'compression artifacts',
      'low resolution',
      'out of focus',
      'motion blur',
      'overexposed',
      'underexposed',
      'oversaturated',
      'washed out',
    ],
  },

  style: {
    category: 'style',
    description: '부적절한 스타일 요소 제외',
    excludeTerms: [
      'cartoon',
      'anime',
      'illustration',
      'sketch',
      'drawing',
      'painting',
      'watercolor',
      '3d render',
      'cgi',
      'unrealistic',
      'surreal',
      'abstract',
      'vintage filter',
      'heavy filter',
      'instagram filter',
    ],
  },

  content: {
    category: 'content',
    description: '부적절한 콘텐츠 요소 제외',
    excludeTerms: [
      'text',
      'typography',
      'letters',
      'words',
      'watermark',
      'logo',
      'signature',
      'label',
      'stamp',
      'badge',
      'sticker',
      'price tag',
      'barcode',
      'qr code',
    ],
  },

  composition: {
    category: 'composition',
    description: '부적절한 구도 요소 제외',
    excludeTerms: [
      'cluttered',
      'busy background',
      'distracting elements',
      'multiple products fighting for attention',
      'awkward cropping',
      'cut off product',
      'partial product',
      'tilted horizon',
      'dutch angle',
      'extreme close-up',
      'fish eye',
      'distorted',
    ],
  },

  brand: {
    category: 'brand',
    description: '브랜드 일관성 저해 요소 제외',
    excludeTerms: [
      'generic packaging',
      'plain packaging',
      'different product',
      'competitor product',
      'inconsistent branding',
      'wrong color scheme',
      'mismatched style',
      'cheap looking',
      'low-end aesthetic',
    ],
  },
};

// ============================================
// 상세페이지 특화 네거티브 프롬프트 (카테고리별 추가)
// ============================================

export const CATEGORY_NEGATIVE_PROMPTS: Record<string, string[]> = {
  '스킨케어': [
    'oily skin',
    'skin problems',
    'acne',
    'blemishes',
    'redness',
    'irritation',
    'dry patches',
  ],
  '메이크업': [
    'smudged makeup',
    'cakey foundation',
    'uneven application',
    'makeup mishaps',
  ],
  '헤어케어': [
    'damaged hair',
    'frizzy hair',
    'split ends',
    'greasy hair',
    'tangled hair',
  ],
  '바디케어': [
    'body imperfections',
    'uneven skin tone',
    'rough texture',
  ],
  'default': [],
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 섹션에 맞는 레이아웃 프리셋 가져오기
 */
export function getLayoutPreset(layoutStyle: LayoutStyle): DetailPageLayoutPreset {
  return LAYOUT_PRESETS[layoutStyle];
}

/**
 * 섹션 타입에 맞는 권장 레이아웃 목록 가져오기
 */
export function getRecommendedLayouts(sectionType: SectionType): LayoutStyle[] {
  return SECTION_LAYOUT_RECOMMENDATIONS[sectionType] || SECTION_LAYOUT_RECOMMENDATIONS.CUSTOM || ['hero-centered', 'split-left', 'split-right'];
}

/**
 * 레이아웃에 맞는 텍스트 안전 영역 목록 가져오기
 */
export function getSafeZonesForLayout(layoutStyle: LayoutStyle): TextSafeZone[] {
  const positions = LAYOUT_SAFE_ZONE_MAPPING[layoutStyle] || ['top-full', 'bottom-full'];
  return positions.map(pos => TEXT_SAFE_ZONES[pos]);
}

/**
 * 특정 위치의 텍스트 안전 영역 가져오기
 */
export function getTextSafeZone(position: SafeZonePosition): TextSafeZone {
  return TEXT_SAFE_ZONES[position];
}

/**
 * 전체 네거티브 프롬프트 문자열 생성
 */
export function buildNegativePrompt(
  categories: NegativePromptCategory[] = ['quality', 'style', 'content', 'composition'],
  productCategory?: string
): string {
  const terms: string[] = [];

  // 선택된 카테고리의 네거티브 프롬프트 수집
  for (const category of categories) {
    if (NEGATIVE_PROMPTS[category]) {
      terms.push(...NEGATIVE_PROMPTS[category].excludeTerms);
    }
  }

  // 제품 카테고리별 추가 네거티브 프롬프트
  if (productCategory) {
    const categoryTerms = CATEGORY_NEGATIVE_PROMPTS[productCategory]
      || CATEGORY_NEGATIVE_PROMPTS['default'];
    terms.push(...categoryTerms);
  }

  // 중복 제거 및 문자열 생성
  const uniqueTerms = Array.from(new Set(terms));
  return uniqueTerms.join(', ');
}

/**
 * 레이아웃 구도 프롬프트 문자열 생성
 */
export function buildLayoutPrompt(layoutStyle: LayoutStyle): string {
  const preset = LAYOUT_PRESETS[layoutStyle];
  return `${preset.composition}, ${preset.productPlacement}`;
}

/**
 * 텍스트 안전 영역 프롬프트 문자열 생성
 */
export function buildTextSafeZonePrompt(positions: SafeZonePosition[]): string {
  const instructions = positions
    .map(pos => TEXT_SAFE_ZONES[pos]?.clearanceInstruction)
    .filter(Boolean);
  return instructions.join('. ');
}

/**
 * 섹션에 최적화된 이미지 구도 설정 가져오기
 */
export function getOptimalCompositionForSection(
  sectionType: SectionType,
  preferredLayout?: LayoutStyle
): {
  layout: DetailPageLayoutPreset;
  safeZones: TextSafeZone[];
  layoutPrompt: string;
  safeZonePrompt: string;
  negativePrompt: string;
} {
  // 선호 레이아웃이 있고 해당 섹션에 적합하면 사용, 아니면 첫 번째 권장 레이아웃
  const recommendedLayouts = getRecommendedLayouts(sectionType);
  const layoutStyle = preferredLayout && recommendedLayouts.includes(preferredLayout)
    ? preferredLayout
    : recommendedLayouts[0];

  const layout = getLayoutPreset(layoutStyle);
  const safeZones = getSafeZonesForLayout(layoutStyle);
  const safeZonePositions = LAYOUT_SAFE_ZONE_MAPPING[layoutStyle];

  return {
    layout,
    safeZones,
    layoutPrompt: buildLayoutPrompt(layoutStyle),
    safeZonePrompt: buildTextSafeZonePrompt(safeZonePositions),
    negativePrompt: buildNegativePrompt(['quality', 'style', 'content', 'composition']),
  };
}
