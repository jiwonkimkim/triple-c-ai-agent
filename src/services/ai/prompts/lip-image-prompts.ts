/**
 * 립 메이크업 카테고리 전용 이미지 프롬프트
 * 올리브영 실제 상세페이지 분석 기반 (글라스틴 등 참고)
 *
 * 섹션 구조: 14개 표준 섹션 + 블록별 변형
 * 특징: 컬러 배리에이션, 모델 립샷, 텍스처 비주얼, 발색/지속력
 */

import type { ProductVisualReference } from './types';

// ============================================
// 립 섹션 타입 정의
// ============================================

export type LipDetailSectionType =
  | 'BRAND_HEADER'        // 섹션 1: 브랜드 헤더
  | 'HERO_LIP'            // 섹션 2: 히어로 제품샷 (메인 배너)
  | 'COLOR_SWATCHES'      // 섹션 3: 컬러 배리에이션 스와치
  | 'MODEL_LIP_CLOSEUP_1' // 섹션 4: 모델 립 클로즈업 (코랄/피치)
  | 'TEXTURE_VISUAL'      // 섹션 5: 제품 텍스처 비주얼
  | 'MODEL_WEARING_1'     // 섹션 6: 모델 착용샷 (핑크 톤)
  | 'COLOR_COMPARISON'    // 섹션 7: 발색 비교 (비포/애프터)
  | 'INGREDIENTS_EFFECT'  // 섹션 8: 성분/효능 설명
  | 'MODEL_WEARING_2'     // 섹션 9: 모델 착용샷 (레드/베리 톤)
  | 'MULTI_COLOR_GRID'    // 섹션 10: 멀티 컬러 립 클로즈업 그리드
  | 'LONGEVITY_INFO'      // 섹션 11: 사용감/지속력 설명
  | 'HOW_TO_USE'          // 섹션 12: 제품 사용법
  | 'FULL_LINEUP'         // 섹션 13: 전체 컬러 라인업
  | 'CTA_CLOSING';        // 섹션 14: 클로징 배너

// ============================================
// 립 서브카테고리 정의
// ============================================

export type LipSubCategory =
  | 'lip_gloss'           // 립글로스
  | 'lip_tint'            // 립틴트
  | 'lip_stick'           // 립스틱
  | 'lip_balm'            // 립밤
  | 'lip_lacquer'         // 립래커
  | 'lip_oil'             // 립오일
  | 'lip_stain'           // 립스테인
  | 'lip_pencil'          // 립펜슬/라이너
  | 'lip_plumper'         // 립플럼퍼
  | 'liquid_lipstick';    // 리퀴드 립스틱

// ============================================
// 립 텍스처/피니쉬 타입
// ============================================

export type LipFinish =
  | 'glossy'              // 글로시
  | 'matte'               // 매트
  | 'velvet'              // 벨벳
  | 'satin'               // 새틴
  | 'sheer'               // 쉬어
  | 'cream'               // 크림
  | 'metallic'            // 메탈릭
  | 'glitter';            // 글리터

// ============================================
// 립 컬러 팔레트
// ============================================

export const LIP_COLOR_PALETTE = {
  nude: {
    name: '누드',
    hex: '#DEB887',
    range: ['#D2B48C', '#DEB887', '#E8D4B8'],
    mood: 'natural, everyday, MLBB',
  },
  pink: {
    name: '핑크',
    hex: '#FFB6C1',
    range: ['#FFC0CB', '#FFB6C1', '#FF69B4'],
    mood: 'feminine, youthful, innocent',
  },
  coral: {
    name: '코랄',
    hex: '#FF7F7F',
    range: ['#FFA07A', '#FF7F7F', '#FF6B6B'],
    mood: 'fresh, vibrant, spring',
  },
  peach: {
    name: '피치',
    hex: '#FFDAB9',
    range: ['#FFE4C4', '#FFDAB9', '#FFCBA4'],
    mood: 'warm, soft, gentle',
  },
  red: {
    name: '레드',
    hex: '#E74C3C',
    range: ['#FF6B6B', '#E74C3C', '#C0392B'],
    mood: 'bold, classic, glamorous',
  },
  berry: {
    name: '베리',
    hex: '#9B59B6',
    range: ['#A569BD', '#9B59B6', '#8E44AD'],
    mood: 'sophisticated, chic, autumn',
  },
  mauve: {
    name: '모브',
    hex: '#E0B0FF',
    range: ['#DDA0DD', '#E0B0FF', '#DA70D6'],
    mood: 'elegant, romantic, vintage',
  },
  orange: {
    name: '오렌지',
    hex: '#FF8C00',
    range: ['#FFA500', '#FF8C00', '#FF7F00'],
    mood: 'energetic, summer, trendy',
  },
  brown: {
    name: '브라운',
    hex: '#A0522D',
    range: ['#CD853F', '#A0522D', '#8B4513'],
    mood: 'warm, autumn, sophisticated',
  },
  wine: {
    name: '와인',
    hex: '#722F37',
    range: ['#8B0000', '#722F37', '#5C1A1A'],
    mood: 'luxurious, dramatic, evening',
  },
} as const;

// ============================================
// 립 특화 키워드
// ============================================

export const LIP_FEATURE_KEYWORDS = {
  plumping: {
    ko: ['플럼핑', '볼륨', '도톰한', '입술보정'],
    en: ['plumping', 'volumizing', 'fuller lips', 'lip enhancement'],
    visual: ['plump lips', 'volumized effect', 'fuller appearance', 'lip injection effect'],
  },
  hydrating: {
    ko: ['촉촉', '보습', '수분', '케어'],
    en: ['hydrating', 'moisturizing', 'nourishing', 'lip care'],
    visual: ['dewy texture', 'moisture droplets', 'hydrated lips', 'glossy shine'],
  },
  long_lasting: {
    ko: ['지속력', '12시간', '워터프루프', '키스프루프'],
    en: ['long-lasting', 'transfer-proof', 'smudge-proof', 'all-day wear'],
    visual: ['clock icon', 'coffee cup test', 'kiss mark', 'no transfer'],
  },
  high_pigment: {
    ko: ['고발색', '선명한', '풀커버', '비비드'],
    en: ['high pigment', 'vivid color', 'full coverage', 'intense'],
    visual: ['bold color payoff', 'single swipe coverage', 'vibrant application'],
  },
  glossy: {
    ko: ['글로시', '윤기', '광택', '유리알'],
    en: ['glossy', 'shiny', 'glass-like', 'mirror finish'],
    visual: ['light reflection', 'glass skin lips', 'wet look', 'luminous shine'],
  },
  velvet: {
    ko: ['벨벳', '부드러운', '매트', '반광'],
    en: ['velvet', 'soft matte', 'velvety', 'semi-matte'],
    visual: ['soft blur effect', 'velvet texture', 'blurred edges', 'diffused finish'],
  },
} as const;

// ============================================
// 섹션별 블록 변형 정의
// ============================================

export interface LipSectionBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const LIP_SECTION_BLOCKS: Record<LipDetailSectionType, LipSectionBlockVariation[]> = {
  BRAND_HEADER: [
    { blockIndex: 0, conceptType: 'logo-banner', promptModifier: 'elegant brand banner with soft pink gradient', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'sparkle-header', promptModifier: 'brand header with subtle sparkle overlay', aspectRatio: '4:1' },
  ],
  HERO_LIP: [
    { blockIndex: 0, conceptType: 'multi-color-hero', promptModifier: 'multiple color variants arranged elegantly with light flares', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'single-hero', promptModifier: 'single hero product with dreamy background', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'applicator-detail', promptModifier: 'doe-foot applicator with product texture visible', aspectRatio: '4:3' },
  ],
  COLOR_SWATCHES: [
    { blockIndex: 0, conceptType: 'arm-swatches', promptModifier: 'color swatches on arm skin in gradient arrangement', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'surface-swatches', promptModifier: 'swatches on clear acrylic or white surface', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'lip-swatches', promptModifier: 'color swatches directly on lip close-ups grid', aspectRatio: '1:1' },
  ],
  MODEL_LIP_CLOSEUP_1: [
    { blockIndex: 0, conceptType: 'extreme-closeup', promptModifier: 'extreme close-up lips with coral peach color', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'slight-smile', promptModifier: 'slight smile showing glossy texture', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'light-reflection', promptModifier: 'lips with visible light reflection points', aspectRatio: '16:9' },
  ],
  TEXTURE_VISUAL: [
    { blockIndex: 0, conceptType: 'dripping-texture', promptModifier: 'glossy liquid dripping from applicator', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'honey-consistency', promptModifier: 'honey-like consistency pour shot', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'light-through', promptModifier: 'light passing through translucent gel texture', aspectRatio: '4:3' },
  ],
  MODEL_WEARING_1: [
    { blockIndex: 0, conceptType: 'three-quarter', promptModifier: 'three-quarter face angle with pink tone lips', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'profile', promptModifier: 'profile view showing lip shape', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'natural-light', promptModifier: 'natural window lighting portrait', aspectRatio: '1:1' },
  ],
  COLOR_COMPARISON: [
    { blockIndex: 0, conceptType: 'before-after-split', promptModifier: 'split frame before/after lip application', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'side-by-side', promptModifier: 'side-by-side bare vs colored lips', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'transformation', promptModifier: 'transformation sequence showing application', aspectRatio: '3:1' },
  ],
  INGREDIENTS_EFFECT: [
    { blockIndex: 0, conceptType: 'molecule-visual', promptModifier: 'hyaluronic acid and vitamin molecules floating', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'lip-cross-section', promptModifier: 'lip cross-section showing hydration absorption', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'benefit-icons', promptModifier: 'plumping and hydrating benefit icons', aspectRatio: '3:1' },
  ],
  MODEL_WEARING_2: [
    { blockIndex: 0, conceptType: 'bold-red', promptModifier: 'model wearing bold red berry lip color', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'dramatic-lighting', promptModifier: 'dramatic lighting with bold lip as focal point', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'confident-expression', promptModifier: 'confident expression with sophisticated makeup', aspectRatio: '4:3' },
  ],
  MULTI_COLOR_GRID: [
    { blockIndex: 0, conceptType: 'grid-4', promptModifier: '4-panel grid of different lip colors', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'grid-6', promptModifier: '6-panel grid showing full color range', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'gradient-strip', promptModifier: 'horizontal strip of lip colors in gradient', aspectRatio: '4:1' },
  ],
  LONGEVITY_INFO: [
    { blockIndex: 0, conceptType: 'time-icon', promptModifier: 'clock icon showing wear time with lip visual', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'transfer-test', promptModifier: 'coffee cup and kiss mark transfer test', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'before-after-meal', promptModifier: 'before/after meal comparison frames', aspectRatio: '16:9' },
  ],
  HOW_TO_USE: [
    { blockIndex: 0, conceptType: 'step-sequence', promptModifier: '3-step application guide with numbered circles', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'applicator-demo', promptModifier: 'hand holding applicator demonstration', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'layering-guide', promptModifier: 'layering technique for intensity control', aspectRatio: '2:1' },
  ],
  FULL_LINEUP: [
    { blockIndex: 0, conceptType: 'gradient-flatlay', promptModifier: 'all colors arranged in gradient spectrum flatlay', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'standing-lineup', promptModifier: 'products standing in row showing colors', aspectRatio: '4:1' },
    { blockIndex: 2, conceptType: 'circular-arrangement', promptModifier: 'circular arrangement around center element', aspectRatio: '1:1' },
  ],
  CTA_CLOSING: [
    { blockIndex: 0, conceptType: 'hero-model-combo', promptModifier: 'product hero with model lip closeup corner', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'sparkle-closing', promptModifier: 'dreamy pink gradient with sparkle overlay', aspectRatio: '2:1' },
  ],
};

// ============================================
// 립 이미지 프롬프트 빌더 옵션
// ============================================

export interface LipImagePromptOptions {
  /** 제품명 */
  productName: string;
  /** 서브카테고리 (립글로스, 립틴트 등) */
  subCategory: LipSubCategory;
  /** 피니쉬 타입 */
  finish: LipFinish;
  /** 주요 특징 */
  primaryFeature: keyof typeof LIP_FEATURE_KEYWORDS;
  /** 주요 컬러 (옵션) */
  primaryColor?: keyof typeof LIP_COLOR_PALETTE;
  /** 컬러 배리에이션 목록 */
  colorVariants?: (keyof typeof LIP_COLOR_PALETTE)[];
  /** 브랜드 스타일 (optional) */
  brandStyle?: string;
  /** 제품 시각 참조 */
  visualReference?: ProductVisualReference;
  /** 추가 키워드 */
  additionalKeywords?: string[];
  /** 네거티브 프롬프트 포함 여부 */
  includeNegative?: boolean;
}

// ============================================
// 섹션별 기본 프롬프트 템플릿
// ============================================

const LIP_SECTION_BASE_PROMPTS: Record<LipDetailSectionType, string> = {
  BRAND_HEADER: `
Minimal elegant header banner design,
soft pink gradient background fading to white,
luxury Korean lip cosmetic brand aesthetic,
delicate feminine typography space reserved,
clean modern beauty brand identity,
subtle sparkle or gloss texture hint in background,
horizontal banner composition,
CRITICAL: NO TEXT NO LETTERS - gradient and sparkle only
`.trim(),

  HERO_LIP: `
Lip product hero shot photography,
crystal clear tube or elegant packaging prominently displayed,
multiple color variants arranged elegantly in gradient order,
glossy liquid or creamy texture visible inside packaging,
soft dreamy pink and white gradient background,
floating water droplets or ethereal light flares,
doe-foot applicator or bullet tip slightly visible,
high-end K-beauty lip product photography,
luminous glossy aesthetic, editorial beauty campaign style,
CRITICAL: NO TEXT NO PRODUCT NAMES - visual only
`.trim(),

  COLOR_SWATCHES: `
Lip product color swatches arrangement photography,
4-6 lip colors displayed on clear acrylic surface or arm skin,
gradient arrangement from nude pink to coral to red to berry,
creamy glossy texture visible in each swatch stroke,
clean organized parallel layout,
professional cosmetic swatch photography,
soft natural lighting creating gentle shadows,
Korean lip tint color chart aesthetic,
space below each swatch for color name overlay,
CRITICAL: NO TEXT NO COLOR NAMES - swatches only
`.trim(),

  MODEL_LIP_CLOSEUP_1: `
Extreme close-up of Korean female model lips,
wearing glossy coral peach lip color,
plump hydrated lips with glass-like shine,
tiny light reflection points showing glossy finish,
soft focus blur on surrounding skin,
natural dewy glass skin texture visible,
editorial K-beauty lip photography,
ASMR-satisfying glossy lip aesthetic,
clean minimal out-of-focus background,
professional studio macro lighting,
CRITICAL: NO TEXT - pure lip visual only
`.trim(),

  TEXTURE_VISUAL: `
Lip product texture macro photography,
thick glossy liquid dripping from doe-foot applicator,
honey-like consistency visualization mid-drip,
light rays reflecting through translucent gel texture,
soft pink gradient background,
luxurious plumping gloss aesthetic,
satisfying cosmetic texture shot,
high-definition product detail photography,
visible viscosity and shine,
CRITICAL: NO TEXT - texture focus only
`.trim(),

  MODEL_WEARING_1: `
Korean female model in her 20s beauty portrait,
three-quarter face angle showing lip color,
wearing sheer pink glossy lip color,
natural fresh makeup look with dewy glass skin,
soft natural window lighting,
clean white or soft pink background,
gentle smile showing glossy lip texture,
K-beauty editorial photography style,
youthful innocent feminine mood,
high-fashion beauty portrait aesthetic,
CRITICAL: NO TEXT overlays
`.trim(),

  COLOR_COMPARISON: `
Before and after lip application comparison layout,
split frame or side-by-side composition,
bare natural lips versus glossy colored lips,
same Korean model same angle same lighting both frames,
clear visible difference in color saturation and shine,
Korean beauty transformation demonstration style,
clean instructional comparison layout,
color payoff demonstration aesthetic,
professional cosmetic before-after photography,
CRITICAL: NO TEXT NO LABELS - visual comparison only
`.trim(),

  INGREDIENTS_EFFECT: `
Skincare ingredient infographic for lip product,
hyaluronic acid molecule 3D visualization,
vitamin E icon and collagen symbol floating,
plumping effect visualization with lip cross-section diagram,
hydration droplets absorbing into lip surface illustration,
clean white background with soft pink accent elements,
scientific yet feminine design aesthetic,
Korean cosmetic ingredient benefit layout,
moisture and plumping effect visual explanation,
CRITICAL: NO TEXT NO LABELS - visual icons only
`.trim(),

  MODEL_WEARING_2: `
Korean female model elegant beauty portrait,
wearing bold glossy red berry lip color,
sophisticated chic makeup look,
soft dramatic lighting with subtle shadows,
clean neutral gray or beige background,
confident feminine expression,
high-fashion K-beauty editorial style,
glossy plump lips as main focal point,
luxury lip cosmetic campaign mood,
professional beauty photography,
CRITICAL: NO TEXT overlays
`.trim(),

  MULTI_COLOR_GRID: `
Grid layout of 4-6 different lip close-up shots,
each frame showing different color from collection,
consistent angle and lighting across all frames,
glossy or matte finish visible in each shot,
nude, pink, coral, red, berry, mauve color variations,
professional catalog style lip photography,
clean white borders between frames,
Korean lip product lookbook aesthetic,
uniform composition for easy comparison,
CRITICAL: NO TEXT NO COLOR CODES - lip visuals only
`.trim(),

  LONGEVITY_INFO: `
Lip product longevity demonstration infographic,
clock icon showing 8-12 hour wear time visualization,
coffee cup and food icons showing transfer-proof test,
kiss mark test visualization on napkin or glass,
before and after meal comparison frames,
clean iconographic layout design,
soft pink and white color scheme,
Korean cosmetic product benefit explanation style,
durability and lasting power visual proof,
CRITICAL: NO TEXT NO NUMBERS - icons and visuals only
`.trim(),

  HOW_TO_USE: `
Step-by-step lip product application guide visualization,
3-step process with numbered circular badges,
Step 1 visual: Apply from center of lips,
Step 2 visual: Spread to corners evenly,
Step 3 visual: Optional layering for intensity,
elegant hand holding applicator demonstration,
clean instructional diagram style,
soft pink background with minimal iconography,
Korean beauty tutorial aesthetic,
clear application motion visualization,
CRITICAL: NO TEXT - numbered circles and demonstration only
`.trim(),

  FULL_LINEUP: `
Complete lip product collection flat lay photography,
all color variants arranged in gradient spectrum,
nude to pink to coral to red to berry to mauve order,
clean white marble or acrylic background,
soft overhead lighting with minimal shadows,
professional cosmetic catalog photography,
space below each product for color name overlay,
luxury K-beauty lip collection display,
cohesive brand family aesthetic,
CRITICAL: NO TEXT NO LABELS - product arrangement only
`.trim(),

  CTA_CLOSING: `
Closing banner design with hero product and model combination,
main lip product prominently displayed center-left,
small model lip close-up in corner as accent,
soft dreamy pink gradient background,
subtle sparkle or light bokeh overlay effect,
brand logo placeholder space,
CTA button area placeholder (rounded rectangle),
elegant feminine closing design,
Korean beauty e-commerce final banner style,
purchase motivation aesthetic,
CRITICAL: NO TEXT - placeholder shapes only
`.trim(),
};

// ============================================
// 서브카테고리별 비주얼 수식어
// ============================================

const LIP_SUBCATEGORY_MODIFIERS: Record<LipSubCategory, string> = {
  lip_gloss: 'crystal clear tube, doe-foot applicator, glossy liquid texture, glass-like shine',
  lip_tint: 'water tint bottle, watery lightweight texture, gradient lip effect, natural stain finish',
  lip_stick: 'bullet lipstick, creamy solid texture, classic twist-up packaging, full coverage pigment',
  lip_balm: 'nourishing balm texture, stick or pot packaging, sheer tint, moisturizing care feel',
  lip_lacquer: 'high-shine lacquer finish, intense color payoff, liquid to lacquer transformation',
  lip_oil: 'oil-based glossy texture, dropper or doe-foot applicator, nourishing shine, juicy plump effect',
  lip_stain: 'long-lasting stain effect, marker or pen tip applicator, natural bitten lip look',
  lip_pencil: 'pencil format, precise application tip, liner or full lip coverage, matte or creamy',
  lip_plumper: 'plumping formula, slight tingling sensation visualization, volumizing effect, fuller lips',
  liquid_lipstick: 'liquid to matte formula, intense pigmentation, applicator wand, transfer-proof finish',
};

// ============================================
// 피니쉬별 비주얼 수식어
// ============================================

const LIP_FINISH_MODIFIERS: Record<LipFinish, string> = {
  glossy: 'high-shine glass-like finish, light reflecting surface, wet look aesthetic, mirror-like gloss',
  matte: 'no-shine matte finish, velvety smooth surface, blurred soft focus effect, powder-like texture',
  velvet: 'semi-matte velvet finish, soft blur effect, comfortable wear look, diffused edges',
  satin: 'subtle satin sheen, soft luminosity, comfortable creamy finish, natural radiance',
  sheer: 'sheer translucent coverage, natural lip color showing through, buildable intensity',
  cream: 'creamy rich texture, smooth application, medium coverage, comfortable wear',
  metallic: 'metallic shimmer finish, light-catching particles, dimensional shine, festive glamour',
  glitter: 'glitter particles visible, sparkle effect, festive look, light-reflecting specks',
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

/**
 * 립 섹션별 이미지 프롬프트 생성
 */
export function buildLipImagePrompt(
  section: LipDetailSectionType,
  options: LipImagePromptOptions,
  blockIndex: number = 0
): string {
  const {
    productName,
    subCategory,
    finish,
    primaryFeature,
    primaryColor,
    colorVariants = [],
    brandStyle,
    visualReference,
    additionalKeywords = [],
    includeNegative = true,
  } = options;

  // 기본 섹션 프롬프트
  const basePrompt = LIP_SECTION_BASE_PROMPTS[section];

  // 서브카테고리 비주얼 수식어
  const subCategoryModifier = LIP_SUBCATEGORY_MODIFIERS[subCategory];

  // 피니쉬 수식어
  const finishModifier = LIP_FINISH_MODIFIERS[finish];

  // 특징 키워드
  const featureData = LIP_FEATURE_KEYWORDS[primaryFeature];
  const featureVisual = featureData.visual.join(', ');

  // 컬러 정보
  const colorInfo = primaryColor
    ? `primary color: ${LIP_COLOR_PALETTE[primaryColor].name} (${LIP_COLOR_PALETTE[primaryColor].mood})`
    : '';
  const colorVariantsInfo = colorVariants.length > 0
    ? `color variants: ${colorVariants.map(c => LIP_COLOR_PALETTE[c].name).join(', ')}`
    : '';

  // 블록 변형 적용
  const blockVariations = LIP_SECTION_BLOCKS[section];
  const blockVariation = blockVariations[Math.min(blockIndex, blockVariations.length - 1)];
  const blockModifier = blockVariation?.promptModifier || '';

  // 제품 참조 정보
  const productReference = visualReference
    ? `Product: ${productName} (${visualReference.appearance || ''} ${visualReference.colorScheme || ''} ${visualReference.packageShape || ''})`
    : `Product: ${productName}`;

  // 브랜드 스타일
  const brandModifier = brandStyle
    ? `Brand style: ${brandStyle}`
    : 'Korean K-beauty lip cosmetic aesthetic, feminine elegant';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합
  let prompt = `
[PRODUCT REFERENCE: ${productReference}]
[SUBCATEGORY STYLE: ${subCategoryModifier}]
[FINISH: ${finishModifier}]
[FEATURE VISUAL: ${featureVisual}]
${colorInfo ? `[COLOR: ${colorInfo}]` : ''}
${colorVariantsInfo ? `[VARIANTS: ${colorVariantsInfo}]` : ''}
[BLOCK VARIATION: ${blockModifier}]
${basePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page photography, high-end lip cosmetic advertising, 8K resolution, feminine elegant mood, soft pink lighting
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  // 네거티브 프롬프트
  if (includeNegative) {
    prompt += ` --negative low quality, blurry, noisy, amateur, cartoon, anime, illustration, watermark, text, letters, numbers, words, Korean text, English text, any characters, logo text, brand name text, labels, captions, color codes, shade names, signatures, hand-written, distorted product, wrong proportions, unrealistic lips, chapped lips, dry texture, unflattering angle`;
  }

  return prompt;
}

/**
 * 전체 섹션 프롬프트 세트 생성
 */
export function buildLipFullPromptSet(
  options: LipImagePromptOptions
): Record<LipDetailSectionType, string[]> {
  const sections: LipDetailSectionType[] = [
    'BRAND_HEADER',
    'HERO_LIP',
    'COLOR_SWATCHES',
    'MODEL_LIP_CLOSEUP_1',
    'TEXTURE_VISUAL',
    'MODEL_WEARING_1',
    'COLOR_COMPARISON',
    'INGREDIENTS_EFFECT',
    'MODEL_WEARING_2',
    'MULTI_COLOR_GRID',
    'LONGEVITY_INFO',
    'HOW_TO_USE',
    'FULL_LINEUP',
    'CTA_CLOSING',
  ];

  const result: Record<LipDetailSectionType, string[]> = {} as Record<LipDetailSectionType, string[]>;

  for (const section of sections) {
    const blockCount = LIP_SECTION_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildLipImagePrompt(section, options, i));
    }
  }

  return result;
}

/**
 * 특정 섹션의 모든 블록 프롬프트 생성
 */
export function buildLipSectionPrompts(
  section: LipDetailSectionType,
  options: LipImagePromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = LIP_SECTION_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildLipImagePrompt(section, options, block.blockIndex),
  }));
}

// ============================================
// 립 특화 헬퍼 함수
// ============================================

/**
 * 컬러 팔레트 정보 반환
 */
export function getLipColorInfo(color: keyof typeof LIP_COLOR_PALETTE): {
  name: string;
  hex: string;
  range: readonly string[];
  mood: string;
} {
  return LIP_COLOR_PALETTE[color];
}

/**
 * 피니쉬별 색상 팔레트 추천
 */
export function getLipFinishColorPalette(finish: LipFinish): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
} {
  const palettes: Record<LipFinish, { primary: string; secondary: string; accent: string; background: string }> = {
    glossy: { primary: '#FFB6C1', secondary: '#FFC0CB', accent: '#FF69B4', background: '#FFF0F5' },
    matte: { primary: '#E74C3C', secondary: '#C0392B', accent: '#922B21', background: '#FADBD8' },
    velvet: { primary: '#9B59B6', secondary: '#8E44AD', accent: '#7D3C98', background: '#F5EEF8' },
    satin: { primary: '#F5CBA7', secondary: '#FDEBD0', accent: '#F0B27A', background: '#FEF9E7' },
    sheer: { primary: '#FADBD8', secondary: '#F5B7B1', accent: '#F1948A', background: '#FFFFFF' },
    cream: { primary: '#E59866', secondary: '#EB984E', accent: '#DC7633', background: '#FDF2E9' },
    metallic: { primary: '#D4AC0D', secondary: '#F1C40F', accent: '#B7950B', background: '#FCF3CF' },
    glitter: { primary: '#FF69B4', secondary: '#FF1493', accent: '#C71585', background: '#FFF0F5' },
  };

  return palettes[finish];
}

/**
 * 모델 섹션용 컬러 톤 수식어
 */
export function getModelColorToneModifier(color: keyof typeof LIP_COLOR_PALETTE): string {
  const toneModifiers: Record<keyof typeof LIP_COLOR_PALETTE, string> = {
    nude: 'natural MLBB (my lips but better) look, everyday wearable, subtle enhancement',
    pink: 'youthful feminine pink tone, innocent fresh look, soft romantic mood',
    coral: 'vibrant coral peach tone, fresh spring mood, warm undertone flattering',
    peach: 'soft warm peach tone, gentle natural look, sun-kissed warmth',
    red: 'bold classic red tone, glamorous confident look, timeless elegance',
    berry: 'sophisticated berry purple tone, chic autumn mood, cool undertone elegance',
    mauve: 'elegant dusty mauve tone, romantic vintage mood, muted sophistication',
    orange: 'energetic bright orange tone, summer trendy look, bold statement',
    brown: 'warm earthy brown tone, sophisticated autumn look, cozy warmth',
    wine: 'dramatic deep wine tone, evening glamour, luxurious depth',
  };

  return toneModifiers[color] || toneModifiers.pink;
}

// ============================================
// Export
// ============================================

export {
  LIP_SECTION_BASE_PROMPTS,
  LIP_SUBCATEGORY_MODIFIERS,
  LIP_FINISH_MODIFIERS,
};
