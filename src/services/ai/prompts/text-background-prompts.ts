/**
 * 텍스트 오버레이용 배경 이미지 프롬프트
 * 섹션 사이에 배치되는 카피/슬로건/설명 텍스트를 위한 배경
 *
 * 4가지 타입:
 * - TEXT_BANNER: 카피/슬로건 배경 (큰 텍스트용)
 * - KEY_MESSAGE: 핵심 메시지 강조 배경
 * - BENEFIT_HIGHLIGHT: 성분/효능 설명 배경
 * - DIVIDER_VISUAL: 섹션 구분용 장식 배경
 */

// ============================================
// 텍스트 배경 섹션 타입 정의
// ============================================

export type TextBackgroundSectionType =
  | 'TEXT_BANNER'        // 카피/슬로건 배경
  | 'KEY_MESSAGE'        // 핵심 메시지 강조
  | 'BENEFIT_HIGHLIGHT'  // 성분/효능 설명
  | 'DIVIDER_VISUAL';    // 섹션 구분용

// ============================================
// 카테고리별 컬러 테마
// ============================================

export interface CategoryColorTheme {
  primary: string;
  secondary: string;
  gradient: string;
  mood: string;
}

export const CATEGORY_COLOR_THEMES: Record<string, CategoryColorTheme> = {
  lip: {
    primary: 'soft pink',
    secondary: 'rose gold',
    gradient: 'pink to coral gradient',
    mood: 'feminine romantic elegant',
  },
  skincare: {
    primary: 'clean white',
    secondary: 'soft mint or lavender',
    gradient: 'white to soft pastel gradient',
    mood: 'pure clean fresh',
  },
  mascara: {
    primary: 'deep black',
    secondary: 'silver or gold accent',
    gradient: 'dark to light dramatic gradient',
    mood: 'dramatic bold glamorous',
  },
  maskpack: {
    primary: 'aqua blue',
    secondary: 'fresh mint',
    gradient: 'water blue to white gradient',
    mood: 'hydrating fresh spa-like',
  },
  suncare: {
    primary: 'sunny yellow',
    secondary: 'sky blue',
    gradient: 'warm yellow to soft orange gradient',
    mood: 'bright protective summer',
  },
  default: {
    primary: 'neutral white',
    secondary: 'soft gray',
    gradient: 'white to light gray gradient',
    mood: 'clean minimal professional',
  },
};

// ============================================
// 블록 변형 정의
// ============================================

export interface TextBackgroundBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const TEXT_BACKGROUND_BLOCKS: Record<TextBackgroundSectionType, TextBackgroundBlockVariation[]> = {
  TEXT_BANNER: [
    { blockIndex: 0, conceptType: 'gradient-banner', promptModifier: 'smooth gradient background with ample text space', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'abstract-flow', promptModifier: 'abstract flowing shapes with soft blur', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'minimal-accent', promptModifier: 'minimal background with subtle corner accent', aspectRatio: '16:9' },
  ],
  KEY_MESSAGE: [
    { blockIndex: 0, conceptType: 'center-focus', promptModifier: 'radial gradient with bright center for text focus', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'soft-blur', promptModifier: 'soft blurred product silhouette as background', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'geometric-minimal', promptModifier: 'minimal geometric shapes framing center', aspectRatio: '3:2' },
  ],
  BENEFIT_HIGHLIGHT: [
    { blockIndex: 0, conceptType: 'split-layout', promptModifier: 'split background for icon and text placement', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'card-style', promptModifier: 'card-style background with subtle shadow', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'icon-ready', promptModifier: 'clean background with circular icon placeholder areas', aspectRatio: '16:9' },
  ],
  DIVIDER_VISUAL: [
    { blockIndex: 0, conceptType: 'wave-divider', promptModifier: 'elegant wave pattern divider', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'line-accent', promptModifier: 'thin decorative line with subtle ornament', aspectRatio: '8:1' },
    { blockIndex: 2, conceptType: 'fade-transition', promptModifier: 'color fade transition strip', aspectRatio: '4:1' },
  ],
};

// ============================================
// 기본 프롬프트 템플릿
// ============================================

export const TEXT_BACKGROUND_BASE_PROMPTS: Record<TextBackgroundSectionType, string> = {
  TEXT_BANNER: `
Clean elegant banner background for text overlay,
smooth gradient or solid color background,
ample negative space in center for large typography,
subtle texture or abstract element at edges only,
professional Korean cosmetic brand aesthetic,
soft lighting with no harsh shadows,
visually balanced composition for horizontal text placement,
premium beauty brand marketing style,
CRITICAL: NO TEXT NO LETTERS - pure background only, text will be added later
`.trim(),

  KEY_MESSAGE: `
Focused background design for key message highlight,
soft radial gradient drawing attention to center,
ethereal dreamy atmosphere with subtle glow,
blurred abstract shapes or product silhouette in background,
clean space for impactful single message,
Korean beauty editorial style,
luxury cosmetic campaign aesthetic,
elegant and sophisticated mood,
CRITICAL: NO TEXT NO LETTERS - visual background only
`.trim(),

  BENEFIT_HIGHLIGHT: `
Clean infographic-style background layout,
organized sections for benefit icons and descriptions,
soft color blocks or gradient sections,
space for 3-4 benefit points with icon placeholders,
professional cosmetic ingredient benefit layout,
Korean skincare brand explanation style,
scientific yet approachable design,
clean organized visual hierarchy,
CRITICAL: NO TEXT NO ICONS - background layout only
`.trim(),

  DIVIDER_VISUAL: `
Elegant section divider visual element,
decorative transition between content sections,
subtle wave pattern or flowing line design,
gradient color transition strip,
minimal ornamental accent,
Korean beauty page design aesthetic,
smooth visual flow element,
thin horizontal decorative band,
CRITICAL: NO TEXT - decorative visual only
`.trim(),
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

export interface TextBackgroundPromptOptions {
  /** 카테고리 (lip, skincare, mascara, maskpack, suncare) */
  category: string;
  /** 제품명 */
  productName?: string;
  /** 브랜드 스타일 */
  brandStyle?: string;
  /** 추가 키워드 */
  additionalKeywords?: string[];
  /** 커스텀 컬러 테마 */
  customColorTheme?: Partial<CategoryColorTheme>;
}

/**
 * 텍스트 배경 섹션 이미지 프롬프트 생성
 */
export function buildTextBackgroundPrompt(
  section: TextBackgroundSectionType,
  options: TextBackgroundPromptOptions,
  blockIndex: number = 0
): string {
  const {
    category,
    productName,
    brandStyle,
    additionalKeywords = [],
    customColorTheme,
  } = options;

  // 카테고리별 컬러 테마
  const colorTheme = {
    ...CATEGORY_COLOR_THEMES[category] || CATEGORY_COLOR_THEMES.default,
    ...customColorTheme,
  };

  // 기본 프롬프트
  const basePrompt = TEXT_BACKGROUND_BASE_PROMPTS[section];

  // 블록 변형
  const blockVariations = TEXT_BACKGROUND_BLOCKS[section];
  const blockVariation = blockVariations
    ? blockVariations[Math.min(blockIndex, blockVariations.length - 1)]
    : null;
  const blockModifier = blockVariation?.promptModifier || '';

  // 컬러 정보
  const colorInfo = `
[COLOR THEME]
Primary: ${colorTheme.primary}
Secondary: ${colorTheme.secondary}
Gradient: ${colorTheme.gradient}
Mood: ${colorTheme.mood}
`.trim();

  // 브랜드 스타일
  const brandModifier = brandStyle
    ? `Brand style: ${brandStyle}`
    : 'Korean K-beauty cosmetic brand aesthetic';

  // 제품 참조
  const productReference = productName
    ? `[PRODUCT CONTEXT: ${productName} - use brand colors and mood from product]`
    : '';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합
  const prompt = `
[CRITICAL: NO TEXT IN IMAGE - Generate pure visual background only. Do not include any text, letters, words, numbers, labels, or typography. This is a background for text overlay.]
${productReference}
${colorInfo}
[BLOCK VARIATION: ${blockModifier}]
${basePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page background, high-end cosmetic marketing, clean minimal design, ample space for text overlay
--negative text, letters, words, numbers, typography, Korean text, English text, any characters, logos, labels, watermark, busy background, cluttered design, low quality, blurry
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  return prompt;
}

/**
 * 섹션의 모든 블록 프롬프트 생성
 */
export function buildTextBackgroundSectionPrompts(
  section: TextBackgroundSectionType,
  options: TextBackgroundPromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = TEXT_BACKGROUND_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildTextBackgroundPrompt(section, options, block.blockIndex),
  }));
}

/**
 * 전체 텍스트 배경 섹션 프롬프트 세트 생성
 */
export function buildAllTextBackgroundPrompts(
  options: TextBackgroundPromptOptions
): Record<TextBackgroundSectionType, string[]> {
  const sections: TextBackgroundSectionType[] = [
    'TEXT_BANNER',
    'KEY_MESSAGE',
    'BENEFIT_HIGHLIGHT',
    'DIVIDER_VISUAL',
  ];

  const result: Record<TextBackgroundSectionType, string[]> = {} as Record<TextBackgroundSectionType, string[]>;

  for (const section of sections) {
    const blockCount = TEXT_BACKGROUND_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildTextBackgroundPrompt(section, options, i));
    }
  }

  return result;
}

// ============================================
// 섹션 배치 헬퍼
// ============================================

/**
 * 기존 섹션 목록 사이에 텍스트 배경 섹션을 배치하는 순서 생성
 * @param existingSections 기존 섹션 타입 배열
 * @param insertPattern 삽입 패턴 (예: 매 2개 섹션마다)
 */
export function getInterleavedSectionOrder<T extends string>(
  existingSections: T[],
  insertPattern: number = 3
): (T | TextBackgroundSectionType)[] {
  const textBackgroundSections: TextBackgroundSectionType[] = [
    'TEXT_BANNER',
    'KEY_MESSAGE',
    'BENEFIT_HIGHLIGHT',
    'DIVIDER_VISUAL',
  ];

  const result: (T | TextBackgroundSectionType)[] = [];
  let textBgIndex = 0;

  for (let i = 0; i < existingSections.length; i++) {
    result.push(existingSections[i]);

    // 매 insertPattern개 섹션마다 텍스트 배경 섹션 삽입
    if ((i + 1) % insertPattern === 0 && i < existingSections.length - 1) {
      result.push(textBackgroundSections[textBgIndex % textBackgroundSections.length]);
      textBgIndex++;
    }
  }

  return result;
}

// ============================================
// Export
// ============================================

export {
  TEXT_BACKGROUND_BASE_PROMPTS as TEXT_BG_BASE_PROMPTS,
  TEXT_BACKGROUND_BLOCKS as TEXT_BG_BLOCKS,
};
