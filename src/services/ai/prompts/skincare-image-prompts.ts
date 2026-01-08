/**
 * 스킨케어 카테고리 전용 이미지 프롬프트
 * 올리브영 실제 상세페이지 분석 기반 (바이오더마 등 참고)
 *
 * 섹션 구조: 11개 표준 섹션 + 블록별 변형
 */

import type { ProductVisualReference } from './types';

// ============================================
// 스킨케어 섹션 타입 정의
// ============================================

export type SkincareDetailSectionType =
  | 'BRAND_TRUST'        // 섹션 1: 브랜드 신뢰 배너 (공식 판매처)
  | 'AWARD_RANKING'      // 섹션 2: 수상/랭킹 배너
  | 'HERO_SPLASH'        // 섹션 3: 히어로 제품샷 (물/텍스처 스플래시)
  | 'REVIEW_SHOWCASE'    // 섹션 4: 소비자 리뷰 섹션
  | 'EFFICACY_VISUAL'    // 섹션 5: 핵심 효능 비주얼 (피부층 흡수)
  | 'INGREDIENT_TECH'    // 섹션 6: 성분/기술 설명
  | 'MODEL_RESULT'       // 섹션 7: 모델 사용샷/효과
  | 'STEP_GUIDE'         // 섹션 8: 사용 방법 (How-to)
  | 'PRODUCT_LINEUP'     // 섹션 9: 제품 라인업 (시리즈 소개)
  | 'SIZE_OPTIONS'       // 섹션 10: 용량/가격 옵션
  | 'CTA_CLOSING';       // 섹션 11: 클로징 CTA 배너

// ============================================
// 스킨케어 서브카테고리 정의
// ============================================

export type SkincareSubCategory =
  | 'toner'              // 토너/스킨
  | 'essence'            // 에센스
  | 'serum'              // 세럼/앰플
  | 'emulsion'           // 로션/에멀전
  | 'cream'              // 크림
  | 'eye_cream'          // 아이크림
  | 'mask_pack'          // 마스크팩
  | 'mist'               // 미스트
  | 'oil'                // 페이스오일
  | 'sleeping_pack';     // 수면팩

// ============================================
// 스킨케어 효능 키워드
// ============================================

export const SKINCARE_EFFICACY_KEYWORDS = {
  hydrating: {
    ko: ['수분', '보습', '촉촉', '수분충전', '하이드레이팅'],
    en: ['hydrating', 'moisturizing', 'water-based', 'aqua', 'moisture barrier'],
    visual: ['water droplets', 'dewy', 'glass skin', 'moisture layer', 'aqua blue'],
  },
  anti_aging: {
    ko: ['안티에이징', '탄력', '주름개선', '리프팅', '탱탱'],
    en: ['anti-aging', 'firming', 'lifting', 'wrinkle care', 'elasticity'],
    visual: ['golden', 'luxurious', 'scientific', 'molecular', 'before-after'],
  },
  brightening: {
    ko: ['미백', '브라이트닝', '톤업', '맑은', '광채'],
    en: ['brightening', 'whitening', 'radiance', 'glow', 'luminous'],
    visual: ['light rays', 'pearl', 'white glow', 'clear skin', 'luminescent'],
  },
  soothing: {
    ko: ['진정', '민감', '저자극', '캄', '센시티브'],
    en: ['soothing', 'calming', 'sensitive', 'gentle', 'relief'],
    visual: ['green', 'botanical', 'soft', 'gentle texture', 'natural'],
  },
  pore_care: {
    ko: ['모공', '피지', '블랙헤드', '각질', '정화'],
    en: ['pore care', 'sebum control', 'purifying', 'exfoliating', 'clarifying'],
    visual: ['clean', 'minimalist', 'fresh', 'clear', 'refined texture'],
  },
  barrier: {
    ko: ['장벽', '세라마이드', '보호', '방어', '강화', '피부장벽'],
    en: ['barrier', 'ceramide', 'protective', 'strengthening', 'repair', 'skin barrier'],
    visual: [
      'translucent purple biological cell',
      'liquid bubble with smaller bubbles inside',
      'uniform reflective purple spheres layer',
      'thin smooth wavy translucent membrane',
      'scientific illustration microscopic photography',
      'monochromatic purple palette',
      'skin barrier cell structure',
    ],
    // 피부장벽 전용 상세 프롬프트
    detailedPrompt: `A large, translucent purple biological cell or liquid bubble, with smaller bubbles inside, floating above a layer of uniform, slightly reflective purple spheres, which are partially covered by a thin, smooth, wavy translucent purple membrane at the top, against a pristine white background. Style: Scientific Illustration, Microscopic Photography, Abstract. Lighting: Bright, soft, even lighting, creating subtle reflections on the spheres and cell, subtle volumetric light. Composition: Eye-level shot, centered, shallow depth of field focusing on the main cell. Details: Clear liquid texture inside the large cell, fine details of tiny bubbles, harmonious monochromatic purple palette, clean and smooth surfaces. Quality: High Detail, 4K, Studio Quality Render, Photorealistic, Masterpiece.`,
  },
} as const;

// ============================================
// 섹션별 블록 변형 정의
// ============================================

export interface SectionBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const SKINCARE_SECTION_BLOCKS: Record<SkincareDetailSectionType, SectionBlockVariation[]> = {
  BRAND_TRUST: [
    { blockIndex: 0, conceptType: 'logo-banner', promptModifier: 'horizontal brand banner with logo centered', aspectRatio: '4:1' },
    { blockIndex: 1, conceptType: 'certification', promptModifier: 'certification badges and trust symbols', aspectRatio: '3:1' },
  ],
  AWARD_RANKING: [
    { blockIndex: 0, conceptType: 'main-award', promptModifier: 'main award trophy and ranking display', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'rating-display', promptModifier: 'star ratings and review count visualization', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'badge-collection', promptModifier: 'multiple award badges arranged', aspectRatio: '2:1' },
  ],
  HERO_SPLASH: [
    { blockIndex: 0, conceptType: 'water-splash', promptModifier: 'dynamic water splash explosion around product', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'bubble-float', promptModifier: 'product floating with rising bubbles', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'droplet-macro', promptModifier: 'macro shot with water droplets on surface', aspectRatio: '4:3' },
  ],
  REVIEW_SHOWCASE: [
    { blockIndex: 0, conceptType: 'review-cards', promptModifier: 'review cards with speech bubbles layout', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'sns-style', promptModifier: 'SNS post style review mockup', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'rating-summary', promptModifier: 'rating summary infographic', aspectRatio: '2:1' },
  ],
  EFFICACY_VISUAL: [
    { blockIndex: 0, conceptType: 'skin-layer', promptModifier: 'cross-section skin layer absorption diagram', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'before-after', promptModifier: 'before-after skin texture comparison', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'moisture-meter', promptModifier: 'hydration level meter visualization', aspectRatio: '1:1' },
  ],
  INGREDIENT_TECH: [
    { blockIndex: 0, conceptType: 'molecule-3d', promptModifier: '3D molecular structure floating', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'ingredient-source', promptModifier: 'natural ingredient source imagery', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'tech-diagram', promptModifier: 'technology process flowchart', aspectRatio: '4:3' },
  ],
  MODEL_RESULT: [
    { blockIndex: 0, conceptType: 'application', promptModifier: 'model applying product on face', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'result-glow', promptModifier: 'model showing glowing skin result', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'close-up-skin', promptModifier: 'extreme close-up dewy skin texture', aspectRatio: '4:3' },
  ],
  STEP_GUIDE: [
    { blockIndex: 0, conceptType: 'step-1', promptModifier: 'step 1 dispense product', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'step-2', promptModifier: 'step 2 spread on skin', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'step-3', promptModifier: 'step 3 pat gently', aspectRatio: '1:1' },
  ],
  PRODUCT_LINEUP: [
    { blockIndex: 0, conceptType: 'full-lineup', promptModifier: 'complete product line arranged', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'hero-product', promptModifier: 'hero product highlighted in lineup', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'routine-order', promptModifier: 'products in routine order sequence', aspectRatio: '4:1' },
  ],
  SIZE_OPTIONS: [
    { blockIndex: 0, conceptType: 'size-comparison', promptModifier: 'multiple sizes side by side comparison', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'value-highlight', promptModifier: 'value size highlighted with badge', aspectRatio: '1:1' },
  ],
  CTA_CLOSING: [
    { blockIndex: 0, conceptType: 'final-hero', promptModifier: 'final hero shot with purchase motivation', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'benefit-summary', promptModifier: 'key benefits summary visual', aspectRatio: '2:1' },
  ],
};

// ============================================
// 스킨케어 이미지 프롬프트 빌더 옵션
// ============================================

export interface SkincareImagePromptOptions {
  /** 제품명 */
  productName: string;
  /** 서브카테고리 (토너, 세럼 등) */
  subCategory: SkincareSubCategory;
  /** 주요 효능 */
  primaryEfficacy: keyof typeof SKINCARE_EFFICACY_KEYWORDS;
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

const SKINCARE_SECTION_BASE_PROMPTS: Record<SkincareDetailSectionType, string> = {
  BRAND_TRUST: `
Clean minimal banner design, official brand logo on white background,
authentic product certification badge, pharmacy cross symbol (if applicable),
dermatological brand aesthetic, trustworthy medical skincare feel,
soft blue and white color scheme, professional e-commerce header style,
clean typography space reserved, horizontal banner composition,
CRITICAL: NO TEXT NO LETTERS - visual elements only
`.trim(),

  AWARD_RANKING: `
Award celebration banner design, golden trophy icon or laurel wreath,
"No.1" ranking visual badge element, star ratings 5-star display,
water droplet motifs for skincare context,
light blue gradient background suggesting hydration,
Korean beauty award style layout, Olive Young ranking aesthetic,
achievement badges floating, subtle confetti or sparkle elements,
clean modern infographic style, premium skincare award announcement,
CRITICAL: NO TEXT NO NUMBERS - decorative badge shapes only
`.trim(),

  HERO_SPLASH: `
Cosmetic product photography, clear skincare bottle/tube submerged in crystal clear water,
dynamic water splash explosion around the product,
high-speed photography freeze motion effect,
pure aqua blue color palette, underwater bubbles rising,
light rays penetrating through water surface,
ultra-hydrating skincare concept, refreshing clean aesthetic,
studio lighting with caustic light effects, 4K product visualization,
luxury pharmacy skincare mood, professional commercial photography,
CRITICAL: ABSOLUTELY NO TEXT NO LETTERS on product or background
`.trim(),

  REVIEW_SHOWCASE: `
Customer review showcase design, speech bubble elements,
heart icons and thumbs up symbols floating,
soft pastel pink and blue gradient background,
Korean SNS review style cards, 5-star rating displays,
satisfied customer emoji elements,
clean white review cards with rounded corners,
social proof layout design, testimonial section aesthetic,
friendly approachable feel, user-generated content style mockup,
CRITICAL: NO TEXT - only UI mockup shapes and icons
`.trim(),

  EFFICACY_VISUAL: `
Skin hydration concept visualization,
cross-section diagram of skin layers absorbing moisture,
water molecules penetrating into dermis illustration,
dewy glass skin texture close-up, moisture barrier visualization,
blue water droplets forming protective layer on skin surface,
scientific skincare infographic style,
clean medical illustration aesthetic,
hydration technology demonstration, Korean beauty skin science visual,
CRITICAL: NO TEXT NO LABELS - pure visual diagram only
`.trim(),

  INGREDIENT_TECH: `
Scientific ingredient infographic, molecular structure floating,
proprietary technology diagram, blue water molecule 3D render,
clean white laboratory background, hexagonal chemical bond patterns,
hyaluronic acid or key ingredient molecule visualization,
mineral water source imagery or natural ingredient origin,
clinical dermatology aesthetic, research and development feel,
ingredient breakdown visual flowchart, modern pharmaceutical design style,
CRITICAL: NO TEXT NO CHEMICAL FORMULAS displayed
`.trim(),

  MODEL_RESULT: `
Korean female model in her 20-30s, applying skincare product with cotton pad or fingertips,
dewy glowing skin result, healthy radiant complexion,
natural soft lighting, bathroom vanity or clean studio setting,
fresh clean morning skincare routine mood,
close-up on hydrated luminous skin texture,
water droplet highlight effect on cheek,
minimalist clean background, editorial K-beauty photography style,
healthy skin glow, natural no-makeup makeup look,
CRITICAL: NO TEXT overlays on image
`.trim(),

  STEP_GUIDE: `
Step-by-step skincare application guide visual,
3-step process infographic layout,
hand holding cotton pad with toner or product on fingertips,
numbered circular badges (visual circles for 1, 2, 3),
arrow flow indicating application direction,
gentle patting motion illustration on face,
clean instructional diagram style,
soft pastel blue background, minimal iconography,
Korean skincare routine tutorial aesthetic,
CRITICAL: NO TEXT - numbered circles and arrows only
`.trim(),

  PRODUCT_LINEUP: `
Product family flat lay arrangement,
complete skincare line products displayed,
toner, serum, cream, cleansing water bottles aligned,
gradient size arrangement from small to large,
clean white infinity background, soft shadow underneath,
cohesive packaging color scheme,
professional catalog product photography,
top-down or 45-degree angle view, consistent lighting,
pharmacy skincare collection display,
CRITICAL: NO TEXT NO LABELS on products
`.trim(),

  SIZE_OPTIONS: `
Product size comparison visualization,
multiple bottle sizes side by side (e.g., 100ml, 250ml, 500ml),
measurement scale indicator visual, value size highlight,
clean product silhouette lineup,
minimal white background, subtle size visual indicators,
e-commerce product option display style,
clear volume comparison infographic,
CRITICAL: NO TEXT NO NUMBERS - visual size difference only
`.trim(),

  CTA_CLOSING: `
Call-to-action banner design,
button element space (empty rounded rectangle),
water ripple effect background,
product final hero shot,
urgency visual elements (badge shapes optional),
clean modern e-commerce closing banner,
blue gradient with white space for text overlay,
trust badge icon shapes (shipping truck, checkmark icons),
compelling purchase motivation layout,
CRITICAL: NO TEXT - placeholder shapes for text overlay only
`.trim(),
};

// ============================================
// 서브카테고리별 비주얼 수식어
// ============================================

const SUBCATEGORY_VISUAL_MODIFIERS: Record<SkincareSubCategory, string> = {
  toner: 'clear liquid texture, watery consistency, transparent bottle, splashing water effect',
  essence: 'viscous golden or clear liquid, luxurious dropper bottle, silky texture pour',
  serum: 'concentrated formula visualization, amber or clear vial, precision dropper, potent active ingredients',
  emulsion: 'milky white lotion texture, lightweight fluid, soft pour effect',
  cream: 'rich creamy texture swirl, jar packaging, luxurious thick consistency',
  eye_cream: 'delicate small tube or pot, gentle formulation, precision applicator tip',
  mask_pack: 'sheet mask fabric texture, essence dripping, relaxation spa mood',
  mist: 'fine spray particles, refreshing vapor cloud, portable spray bottle',
  oil: 'golden luxurious oil droplets, glass dropper bottle, rich glossy texture',
  sleeping_pack: 'overnight gel texture, moonlight ambiance, pillow soft background',
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

/**
 * 스킨케어 섹션별 이미지 프롬프트 생성
 */
export function buildSkincareImagePrompt(
  section: SkincareDetailSectionType,
  options: SkincareImagePromptOptions,
  blockIndex: number = 0
): string {
  const {
    productName,
    subCategory,
    primaryEfficacy,
    brandStyle,
    visualReference,
    additionalKeywords = [],
    includeNegative = true,
  } = options;

  // 기본 섹션 프롬프트
  const basePrompt = SKINCARE_SECTION_BASE_PROMPTS[section];

  // 서브카테고리 비주얼 수식어
  const subCategoryModifier = SUBCATEGORY_VISUAL_MODIFIERS[subCategory];

  // 효능 키워드
  const efficacyData = SKINCARE_EFFICACY_KEYWORDS[primaryEfficacy];
  const efficacyVisual = efficacyData.visual.join(', ');

  // ★ 피부장벽 효능일 경우 상세 프롬프트 사용 (EFFICACY_VISUAL, INGREDIENT_TECH 섹션)
  const useBarrierDetailedPrompt =
    primaryEfficacy === 'barrier' &&
    (section === 'EFFICACY_VISUAL' || section === 'INGREDIENT_TECH') &&
    'detailedPrompt' in efficacyData;
  const barrierDetailedPrompt = useBarrierDetailedPrompt
    ? (efficacyData as any).detailedPrompt
    : '';

  // 블록 변형 적용 (섹션이 없으면 기본값 사용)
  const blockVariations = SKINCARE_SECTION_BLOCKS[section];
  const blockVariation = blockVariations
    ? blockVariations[Math.min(blockIndex, blockVariations.length - 1)]
    : null;
  const blockModifier = blockVariation?.promptModifier || '';

  // 제품 참조 정보
  const productReference = visualReference
    ? `Product: ${productName} (${visualReference.appearance || ''} ${visualReference.colorScheme || ''} ${visualReference.packageShape || ''})`
    : `Product: ${productName}`;

  // 브랜드 스타일
  const brandModifier = brandStyle
    ? `Brand style: ${brandStyle}`
    : 'Korean pharmacy skincare aesthetic';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합 - ★ 이미지 내 텍스트 생성 금지 명시
  // ★ 피부장벽 상세 프롬프트가 있으면 기본 프롬프트 대신 사용
  const effectiveBasePrompt = barrierDetailedPrompt || basePrompt;

  let prompt = `
[CRITICAL: NO TEXT IN IMAGE - Generate pure visual imagery only. Do not include any text, letters, words, numbers, labels, or typography in the image.]
[PRODUCT REFERENCE: ${productReference}]
[SUBCATEGORY STYLE: ${subCategoryModifier}]
[EFFICACY VISUAL: ${efficacyVisual}]
[BLOCK VARIATION: ${blockModifier}]
${effectiveBasePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page photography, high-end skincare advertising, 8K resolution, clean visual without any text overlay
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  // 네거티브 프롬프트 - 텍스트 금지 강화
  if (includeNegative) {
    prompt += ` --negative text, letters, words, numbers, typography, Korean text, English text, Chinese text, Japanese text, any characters, logo text, brand name text, labels, captions, titles, subtitles, watermark, signatures, hand-written text, printed text, floating text, overlay text, embedded text, low quality, blurry, noisy, amateur, cartoon, anime, illustration, distorted product, wrong proportions, unrealistic`;
  }

  return prompt;
}

/**
 * 전체 섹션 프롬프트 세트 생성
 */
export function buildSkincareFullPromptSet(
  options: SkincareImagePromptOptions
): Record<SkincareDetailSectionType, string[]> {
  const sections: SkincareDetailSectionType[] = [
    'BRAND_TRUST',
    'AWARD_RANKING',
    'HERO_SPLASH',
    'REVIEW_SHOWCASE',
    'EFFICACY_VISUAL',
    'INGREDIENT_TECH',
    'MODEL_RESULT',
    'STEP_GUIDE',
    'PRODUCT_LINEUP',
    'SIZE_OPTIONS',
    'CTA_CLOSING',
  ];

  const result: Record<SkincareDetailSectionType, string[]> = {} as Record<SkincareDetailSectionType, string[]>;

  for (const section of sections) {
    const blockCount = SKINCARE_SECTION_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildSkincareImagePrompt(section, options, i));
    }
  }

  return result;
}

/**
 * 특정 섹션의 모든 블록 프롬프트 생성
 */
export function buildSkincareSectionPrompts(
  section: SkincareDetailSectionType,
  options: SkincareImagePromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = SKINCARE_SECTION_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildSkincareImagePrompt(section, options, block.blockIndex),
  }));
}

// ============================================
// 효능별 프롬프트 수식어 헬퍼
// ============================================

/**
 * 효능별 추가 비주얼 수식어 반환
 */
export function getEfficacyVisualModifiers(efficacy: keyof typeof SKINCARE_EFFICACY_KEYWORDS): string {
  const data = SKINCARE_EFFICACY_KEYWORDS[efficacy];
  return data.visual.join(', ');
}

/**
 * 효능별 색상 팔레트 추천
 */
export function getEfficacyColorPalette(efficacy: keyof typeof SKINCARE_EFFICACY_KEYWORDS): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const palettes: Record<keyof typeof SKINCARE_EFFICACY_KEYWORDS, { primary: string; secondary: string; accent: string }> = {
    hydrating: { primary: '#4A90D9', secondary: '#87CEEB', accent: '#E0F4FF' },
    anti_aging: { primary: '#C9A961', secondary: '#8B6914', accent: '#FFF8E7' },
    brightening: { primary: '#FFD700', secondary: '#FFFACD', accent: '#FFFFFF' },
    soothing: { primary: '#90EE90', secondary: '#98D8AA', accent: '#F0FFF0' },
    pore_care: { primary: '#87CEEB', secondary: '#B0E0E6', accent: '#F5FFFA' },
    barrier: { primary: '#DDA0DD', secondary: '#E6E6FA', accent: '#FFF0F5' },
  };

  return palettes[efficacy];
}

// ============================================
// Export
// ============================================

export {
  SKINCARE_SECTION_BASE_PROMPTS,
  SUBCATEGORY_VISUAL_MODIFIERS,
};
