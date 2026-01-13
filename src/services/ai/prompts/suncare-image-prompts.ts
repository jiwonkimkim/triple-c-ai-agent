/**
 * 선케어 카테고리 전용 이미지 프롬프트
 * 올리브영 실제 상세페이지 분석 기반 (케어존 등 참고)
 *
 * 섹션 구조: 11개 표준 섹션 + 블록별 변형
 * 특징: SPF/PA 시각화, UV 차단 원리, 7無 시스템, 가족/아웃도어 컨셉
 */

import type { ProductVisualReference } from './types';

// ============================================
// 선케어 섹션 타입 정의
// ============================================

export type SuncareDetailSectionType =
  | 'BRAND_HEADER'       // 섹션 1: 브랜드 헤더
  | 'HERO_SUNCARE'       // 섹션 2: 히어로 배너 (메인 제품샷 + 햇살)
  | 'TEXT_BANNER_1'      // 섹션 3: 텍스트 배너 (카피/슬로건)
  | 'KEY_BENEFITS'       // 섹션 4: 3대 핵심 포인트 아이콘
  | 'KEY_MESSAGE_1'      // 섹션 5: 핵심 메시지 배경
  | 'ACTIVE_INGREDIENTS' // 섹션 6: 주요 성분 설명 (펩타이드 등)
  | 'BENEFIT_HIGHLIGHT_1'// 섹션 7: 성분/효능 하이라이트 배경
  | 'FREE_SYSTEM'        // 섹션 8: 7無첨가/클린뷰티 시스템
  | 'NATURAL_INGREDIENTS'// 섹션 9: 자연유래 성분 (허브/보타니컬)
  | 'DIVIDER_VISUAL_1'   // 섹션 10: 섹션 구분 비주얼
  | 'UV_PROTECTION_TECH' // 섹션 11: 자외선 차단 원리 (유무기 혼합)
  | 'KEY_MESSAGE_2'      // 섹션 12: 핵심 메시지 배경 2
  | 'TEXTURE_CLOSEUP'    // 섹션 13: 텍스처 클로즈업
  | 'HOW_TO_USE'         // 섹션 14: 사용 방법
  | 'TEXT_BANNER_2'      // 섹션 15: 텍스트 배너 2 (클로징 카피)
  | 'BRAND_CLOSING'      // 섹션 16: 브랜드 클로징
  | 'PRODUCT_LINEUP';    // 섹션 17: 제품 라인업

// ============================================
// 선케어 서브카테고리 정의
// ============================================

export type SuncareSubCategory =
  | 'sun_cream'          // 선크림
  | 'sun_stick'          // 선스틱
  | 'sun_spray'          // 선스프레이
  | 'sun_cushion'        // 선쿠션
  | 'sun_gel'            // 선젤
  | 'sun_milk'           // 선밀크
  | 'sun_essence'        // 선에센스
  | 'sun_primer'         // 선프라이머
  | 'tone_up_sun'        // 톤업선
  | 'kids_sun';          // 키즈/베이비 선케어

// ============================================
// 선케어 SPF/PA 등급
// ============================================

export type SPFLevel = 'SPF15' | 'SPF30' | 'SPF50' | 'SPF50+';
export type PALevel = 'PA+' | 'PA++' | 'PA+++' | 'PA++++';

export interface SunProtectionLevel {
  spf: SPFLevel;
  pa: PALevel;
}

// ============================================
// 선케어 특화 키워드
// ============================================

export const SUNCARE_FEATURE_KEYWORDS = {
  uv_protection: {
    ko: ['자외선 차단', 'UV 프로텍션', '강력 차단', '광차단'],
    en: ['UV protection', 'sun blocking', 'SPF shield', 'broad spectrum'],
    visual: ['sun rays', 'shield effect', 'protective barrier', 'light reflection'],
  },
  lightweight: {
    ko: ['가벼운', '산뜻한', '끈적임 없는', '수분감'],
    en: ['lightweight', 'non-greasy', 'fresh', 'watery'],
    visual: ['water texture', 'light spread', 'thin layer', 'breathable feel'],
  },
  no_whitecast: {
    ko: ['무백탁', '투명한', '자연스러운', '피부톤'],
    en: ['no white cast', 'transparent', 'invisible', 'natural finish'],
    visual: ['clear application', 'skin-blending', 'seamless finish', 'transparent layer'],
  },
  long_lasting: {
    ko: ['지속력', '워터프루프', '땀에 강한', '12시간'],
    en: ['long-lasting', 'waterproof', 'sweat-proof', '12-hour protection'],
    visual: ['water beading', 'sweat droplets', 'beach scene', 'outdoor activity'],
  },
  sensitive_safe: {
    ko: ['순한', '저자극', '민감성', '아기도 사용'],
    en: ['gentle', 'sensitive-safe', 'hypoallergenic', 'baby-safe'],
    visual: ['soft touch', 'baby skin', 'gentle hands', 'family-friendly'],
  },
  tone_up: {
    ko: ['톤업', '브라이트닝', '피부보정', '화사한'],
    en: ['tone-up', 'brightening', 'skin-correcting', 'radiant'],
    visual: ['glowing effect', 'bright skin', 'luminous finish', 'light reflection'],
  },
} as const;

// ============================================
// 선케어 클린뷰티 시스템
// ============================================

export const SUNCARE_FREE_SYSTEMS = {
  '7free': ['파라벤', '미네랄오일', '인공향료', '인공색소', '트리에탄올아민', '실리콘오일', '폴리아크릴아마이드'],
  '10free': ['파라벤', '미네랄오일', '인공향료', '인공색소', '트리에탄올아민', '실리콘오일', '폴리아크릴아마이드', 'PEG', '황산염', '포름알데히드'],
  'vegan': ['동물성 원료', '동물실험'],
  'reef_safe': ['옥시벤존', '옥티녹세이트'],
} as const;

// ============================================
// 섹션별 블록 변형 정의
// ============================================

export interface SuncareSectionBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const SUNCARE_SECTION_BLOCKS: Record<SuncareDetailSectionType, SuncareSectionBlockVariation[]> = {
  BRAND_HEADER: [
    { blockIndex: 0, conceptType: 'logo-banner', promptModifier: 'horizontal brand banner with logo centered on warm beige', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'tagline-banner', promptModifier: 'brand tagline with family/daily concept', aspectRatio: '4:1' },
  ],
  HERO_SUNCARE: [
    { blockIndex: 0, conceptType: 'sunray-hero', promptModifier: 'product with dynamic sunlight rays and warm gradient', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'floating-benefits', promptModifier: 'product with floating benefit icons around', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'summer-mood', promptModifier: 'product in bright summer beach/outdoor context', aspectRatio: '4:3' },
  ],
  TEXT_BANNER_1: [
    { blockIndex: 0, conceptType: 'solid-yellow', promptModifier: 'pure solid warm yellow (#FFD700) color fill only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'yellow-white-gradient', promptModifier: 'simple horizontal gradient from warm yellow to white only', aspectRatio: '3:1' },
  ],
  KEY_BENEFITS: [
    { blockIndex: 0, conceptType: 'triple-icons', promptModifier: 'three circular benefit icons in a row', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'single-benefit-1', promptModifier: 'first benefit icon enlarged with description space', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'single-benefit-2', promptModifier: 'second benefit icon enlarged with description space', aspectRatio: '1:1' },
    { blockIndex: 3, conceptType: 'single-benefit-3', promptModifier: 'third benefit icon enlarged with description space', aspectRatio: '1:1' },
  ],
  KEY_MESSAGE_1: [
    { blockIndex: 0, conceptType: 'radial-yellow', promptModifier: 'soft radial gradient - white center fading to warm yellow edges only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-orange', promptModifier: 'pure solid soft orange (#FFB347) color fill only', aspectRatio: '3:1' },
  ],
  ACTIVE_INGREDIENTS: [
    { blockIndex: 0, conceptType: 'molecule-showcase', promptModifier: 'scientific molecular structure floating on white', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'ingredient-cards', promptModifier: 'ingredient cards with icons arranged', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'lab-aesthetic', promptModifier: 'clinical laboratory research aesthetic', aspectRatio: '16:9' },
  ],
  BENEFIT_HIGHLIGHT_1: [
    { blockIndex: 0, conceptType: 'split-yellow-white', promptModifier: 'simple two-color split - left warm yellow right white only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-cream', promptModifier: 'pure solid cream (#FFFDD0) color fill only', aspectRatio: '3:1' },
  ],
  FREE_SYSTEM: [
    { blockIndex: 0, conceptType: 'checklist-layout', promptModifier: '7-free system checklist with crossed-out icons', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'certification-badge', promptModifier: 'dermatologist tested certification badge design', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'safe-ingredients', promptModifier: 'clean beauty safe ingredient visualization', aspectRatio: '2:1' },
  ],
  NATURAL_INGREDIENTS: [
    { blockIndex: 0, conceptType: 'botanical-flatlay', promptModifier: 'botanical ingredients flat lay arrangement', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'herb-circle', promptModifier: 'herbs arranged in circle around product', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'ingredient-detail', promptModifier: 'single hero ingredient macro shot', aspectRatio: '4:3' },
  ],
  DIVIDER_VISUAL_1: [
    { blockIndex: 0, conceptType: 'solid-orange-strip', promptModifier: 'pure solid warm orange horizontal strip only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'yellow-orange-gradient-strip', promptModifier: 'simple yellow to orange gradient strip only', aspectRatio: '3:1' },
  ],
  UV_PROTECTION_TECH: [
    { blockIndex: 0, conceptType: 'uv-diagram', promptModifier: 'UVA/UVB blocking mechanism diagram', aspectRatio: '16:9' },
    { blockIndex: 1, conceptType: 'skin-cross-section', promptModifier: 'skin layer cross-section with protection shield', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'filter-comparison', promptModifier: 'organic vs inorganic filter comparison visual', aspectRatio: '2:1' },
  ],
  KEY_MESSAGE_2: [
    { blockIndex: 0, conceptType: 'radial-orange', promptModifier: 'soft radial gradient - white center fading to soft orange edges only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-peach', promptModifier: 'pure solid peach (#FFDAB9) color fill only', aspectRatio: '3:1' },
  ],
  TEXTURE_CLOSEUP: [
    { blockIndex: 0, conceptType: 'cream-swatch', promptModifier: 'cream texture swatch spreading on surface', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'skin-application', promptModifier: 'texture applied on skin showing finish', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'absorption-demo', promptModifier: 'fast absorption demonstration sequence', aspectRatio: '3:1' },
  ],
  HOW_TO_USE: [
    { blockIndex: 0, conceptType: 'step-sequence', promptModifier: 'numbered step-by-step application guide', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'family-outdoor', promptModifier: 'family applying sunscreen outdoors', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'amount-guide', promptModifier: 'proper amount demonstration on fingers', aspectRatio: '1:1' },
  ],
  TEXT_BANNER_2: [
    { blockIndex: 0, conceptType: 'yellow-white-gradient', promptModifier: 'simple horizontal gradient from yellow to white only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-light-yellow', promptModifier: 'pure solid light yellow (#FFFACD) color fill only', aspectRatio: '3:1' },
  ],
  BRAND_CLOSING: [
    { blockIndex: 0, conceptType: 'brand-story', promptModifier: 'brand logo with warm gradient closing banner', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'trust-message', promptModifier: 'professional derma brand endorsement feel', aspectRatio: '2:1' },
  ],
  PRODUCT_LINEUP: [
    { blockIndex: 0, conceptType: 'full-lineup', promptModifier: 'complete suncare product line arranged', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'format-variety', promptModifier: 'different formats (tube, stick, spray) comparison', aspectRatio: '3:1' },
    { blockIndex: 2, conceptType: 'size-options', promptModifier: 'size variations side by side', aspectRatio: '2:1' },
  ],
};

// ============================================
// 선케어 이미지 프롬프트 빌더 옵션
// ============================================

export interface SuncareImagePromptOptions {
  /** 제품명 */
  productName: string;
  /** 서브카테고리 (선크림, 선스틱 등) */
  subCategory: SuncareSubCategory;
  /** 자외선 차단 등급 */
  protectionLevel: SunProtectionLevel;
  /** 주요 특징 */
  primaryFeature: keyof typeof SUNCARE_FEATURE_KEYWORDS;
  /** 클린뷰티 시스템 (7free 등) */
  freeSystem?: keyof typeof SUNCARE_FREE_SYSTEMS;
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

const SUNCARE_SECTION_BASE_PROMPTS: Record<SuncareDetailSectionType, string> = {
  BRAND_HEADER: `
Minimal clean header banner design, brand logo centered,
soft warm beige or cream background,
friendly family skincare brand aesthetic,
Korean pharmaceutical cosmetic feel,
simple clean typography space reserved,
trusted derma brand mood, professional e-commerce header,
horizontal banner composition,
CRITICAL: NO TEXT NO LETTERS - logo shape placeholder only
`.trim(),

  HERO_SUNCARE: `
Sunscreen product hero shot, vibrant packaging prominently displayed,
dynamic golden sunlight rays streaming from behind product,
warm yellow to orange gradient background suggesting sun protection,
SPF protection concept visualization with light effects,
floating benefit icon placeholder shapes around product,
family-friendly suncare aesthetic, summer protection mood,
professional cosmetic product photography,
bright cheerful Korean skincare advertising style,
lens flare and warm glow effects,
CRITICAL: NO TEXT NO NUMBERS on product or background - visual only
`.trim(),

  TEXT_BANNER_1: `
Pure solid color or simple gradient background ONLY,
solid warm yellow (#FFD700) fill OR simple horizontal gradient from warm yellow to white,
completely flat empty background - absolutely NO sunray shapes NO light effects NO decorations,
just clean color fill for text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO PATTERNS NO SUN RAYS NO SPARKLES
`.trim(),

  KEY_BENEFITS: `
Three circular benefit icons arranged in horizontal row,
clean minimal flat design iconography,
Icon 1: leaf or clean symbol for free-from concept,
Icon 2: shield or gentle hand for skin-safe concept,
Icon 3: sun with block rays for UV protection concept,
soft orange and white color scheme,
Korean cosmetic infographic style,
clean spacing between icons, modern benefit highlight layout,
subtle drop shadows, professional icon design,
CRITICAL: NO TEXT - icon symbols only
`.trim(),

  KEY_MESSAGE_1: `
Pure solid color or simple radial gradient background ONLY,
soft radial gradient with white center fading to warm yellow edges OR solid soft orange fill,
completely flat empty background - absolutely NO golden glow NO sun silhouette NO abstract shapes,
just color for key message overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO PATTERNS NO GLOW EFFECTS NO DECORATIONS
`.trim(),

  ACTIVE_INGREDIENTS: `
Scientific ingredient showcase infographic,
multiple active ingredient molecular structures floating,
peptide or vitamin molecule 3D visualization,
clean white laboratory background with subtle warm accents,
hexagonal molecular diagrams and chemical bond patterns,
premium skincare science aesthetic,
ingredient efficacy visual flowchart layout,
clinical dermatology research feel,
Korean cosmeceutical ingredient explanation style,
professional pharmaceutical design,
CRITICAL: NO TEXT NO CHEMICAL FORMULAS - visual structures only
`.trim(),

  BENEFIT_HIGHLIGHT_1: `
Pure solid color or simple split-tone background ONLY,
simple two-color split (warm yellow and white) OR solid cream fill,
completely flat empty background - absolutely NO icons NO sun accents NO visual hierarchy,
just color zones for benefit text overlay,
CRITICAL: ONLY SOLID COLORS OR SIMPLE GRADIENTS - NO ICONS NO SHAPES NO DECORATIONS NO SUN ELEMENTS
`.trim(),

  FREE_SYSTEM: `
Clean beauty "Free-from" system infographic design,
seven or more harmful ingredient icons with X marks or crossed out,
(paraben, mineral oil, artificial fragrance symbols etc.),
clean checklist layout with checkmark icons,
soft mint green and white safe/clean aesthetic,
dermatologist-tested badge element placeholder,
sensitive skin friendly visualization,
Korean clean beauty certification style layout,
trustworthy ingredient transparency design,
safe and gentle mood,
CRITICAL: NO TEXT - crossed-out symbols and checkmarks only
`.trim(),

  NATURAL_INGREDIENTS: `
Fresh natural ingredients flat lay arrangement,
botanical elements: green tea leaves, chamomile flowers,
centella asiatica, lavender sprigs, aloe vera,
soft natural beige linen fabric background,
organic skincare ingredient mood board style,
watercolor botanical illustration aesthetic,
circular or scattered arrangement around product,
Korean natural cosmetic ingredient showcase,
fresh clean herbal skincare concept,
natural lighting with soft shadows,
CRITICAL: NO TEXT NO LABELS - pure botanical visual
`.trim(),

  DIVIDER_VISUAL_1: `
Pure solid color or simple gradient horizontal strip ONLY,
solid warm orange strip OR simple yellow to orange gradient strip,
completely flat empty strip - absolutely NO wave patterns NO sunray designs NO ornamental accents,
just clean color strip for section divider,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO DECORATIONS NO PATTERNS NO SUN ELEMENTS NO ORNAMENTS
`.trim(),

  UV_PROTECTION_TECH: `
UV protection technology scientific diagram,
split visualization: UVA long rays vs UVB short rays,
organic filter + inorganic filter combination illustration,
skin cross-section showing protective barrier layer,
sun rays being reflected and absorbed visualization,
scientific infographic with orange/gold and blue contrast,
SPF protection mechanism explanation diagram,
clean medical illustration style,
Korean suncare technology education visual,
professional dermatological diagram aesthetic,
CRITICAL: NO TEXT NO LABELS - visual diagram only
`.trim(),

  KEY_MESSAGE_2: `
Pure solid color or simple radial gradient background ONLY,
soft radial gradient with white center fading to soft orange edges OR solid peach fill,
completely flat empty background - absolutely NO golden glow NO sparkles NO geometric frames,
just color for secondary message overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO GLOW EFFECTS NO DECORATIONS NO GEOMETRIC SHAPES
`.trim(),

  TEXTURE_CLOSEUP: `
Sunscreen texture macro photography,
creamy white or slightly tinted lotion swatch on clean surface,
smooth lightweight texture spreading motion captured,
soft natural lighting creating gentle shadows,
non-greasy fresh finish visualization,
skincare texture test aesthetic,
Korean beauty product swatch photography style,
clean minimal white or neutral background,
cream swirl showing consistency,
absorption into skin demonstration,
CRITICAL: NO TEXT - pure texture visual
`.trim(),

  HOW_TO_USE: `
Step-by-step sunscreen application guide visualization,
Korean family (parent and child) or individual applying sunscreen,
bright outdoor sunny day setting, park or beach background,
numbered step circular badges (1, 2, 3) as visual elements,
generous product amount on fingertips demonstration,
gentle application motion on face and body,
family-friendly lifestyle photography,
warm golden hour natural lighting,
Korean family skincare routine advertisement style,
cheerful summer protection mood,
CRITICAL: NO TEXT - numbered circles and demonstration only
`.trim(),

  TEXT_BANNER_2: `
Pure solid color or simple gradient background ONLY,
simple horizontal gradient from yellow to white OR solid light yellow fill,
completely flat empty background - absolutely NO sparkles NO bokeh NO warm accent elements,
just clean color for closing text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO DECORATIONS NO LIGHT EFFECTS NO SUN ELEMENTS
`.trim(),

  BRAND_CLOSING: `
Brand story closing banner design,
brand logo placeholder prominently displayed center,
soft warm gradient background (beige to cream to orange tint),
professional dermatological endorsement feel,
product lineup silhouettes at bottom as decorative element,
trusted Korean derma cosmetic brand aesthetic,
clean minimal closing design with warmth,
family skincare brand identity visual,
call-to-action button placeholder space,
CRITICAL: NO TEXT - logo placeholder and gradient only
`.trim(),

  PRODUCT_LINEUP: `
Suncare product family arrangement photography,
multiple sun protection products lined up elegantly,
various formats: tube, stick, spray, cushion variations,
consistent warm orange or brand packaging color scheme,
clean white infinity background with soft natural shadows,
professional product catalog photography style,
size comparison layout showing different ml options,
Korean cosmetic e-commerce product display style,
cohesive brand family aesthetic,
45-degree angle or flat lay arrangement,
CRITICAL: NO TEXT NO LABELS on products
`.trim(),
};

// ============================================
// 서브카테고리별 비주얼 수식어
// ============================================

const SUNCARE_SUBCATEGORY_MODIFIERS: Record<SuncareSubCategory, string> = {
  sun_cream: 'tube or bottle packaging, creamy rich texture, generous coverage feel',
  sun_stick: 'stick format packaging, convenient portable design, solid texture visualization',
  sun_spray: 'spray bottle with mist effect, fine particle visualization, quick application feel',
  sun_cushion: 'compact cushion case, puff applicator, dewy finish aesthetic',
  sun_gel: 'transparent gel texture, cooling refreshing feel, lightweight watery consistency',
  sun_milk: 'milky fluid texture, light lotion consistency, smooth spreading visualization',
  sun_essence: 'serum-like fluid texture, concentrated formula feel, dropper or pump bottle',
  sun_primer: 'makeup base aesthetic, smooth canvas preparation, pore-blurring effect',
  tone_up_sun: 'brightening pink or lavender tint, luminous glow effect, skin-perfecting finish',
  kids_sun: 'gentle baby-safe aesthetic, soft pastel packaging, cute family-friendly design',
};

// ============================================
// SPF 레벨별 비주얼 강도
// ============================================

const SPF_VISUAL_INTENSITY: Record<SPFLevel, string> = {
  'SPF15': 'light everyday protection, subtle sun rays, gentle outdoor mood',
  'SPF30': 'moderate sun protection, balanced sunlight visualization, daily outdoor activity',
  'SPF50': 'strong sun protection, intense sunlight rays, beach and sports context',
  'SPF50+': 'maximum sun protection, powerful UV blocking visualization, extreme outdoor conditions, intense golden sun rays',
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

/**
 * 선케어 섹션별 이미지 프롬프트 생성
 */
export function buildSuncareImagePrompt(
  section: SuncareDetailSectionType,
  options: SuncareImagePromptOptions,
  blockIndex: number = 0
): string {
  const {
    productName,
    subCategory,
    protectionLevel,
    primaryFeature,
    freeSystem,
    brandStyle,
    visualReference,
    additionalKeywords = [],
    includeNegative = true,
  } = options;

  // 기본 섹션 프롬프트
  const basePrompt = SUNCARE_SECTION_BASE_PROMPTS[section];

  // 서브카테고리 비주얼 수식어
  const subCategoryModifier = SUNCARE_SUBCATEGORY_MODIFIERS[subCategory];

  // SPF 레벨 비주얼
  const spfVisual = SPF_VISUAL_INTENSITY[protectionLevel.spf];

  // 특징 키워드
  const featureData = SUNCARE_FEATURE_KEYWORDS[primaryFeature];
  const featureVisual = featureData.visual.join(', ');

  // 블록 변형 적용 (섹션이 없으면 기본값 사용)
  const blockVariations = SUNCARE_SECTION_BLOCKS[section];
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
    : 'Korean derma suncare brand aesthetic, family-friendly';

  // 클린뷰티 시스템
  const freeSystemModifier = freeSystem
    ? `Clean beauty: ${freeSystem} system, safe ingredients`
    : '';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합 - ★ 이미지 내 텍스트 생성 금지 명시
  let prompt = `
[CRITICAL: NO TEXT IN IMAGE - Generate pure visual imagery only. Do not include any text, letters, words, numbers, labels, or typography in the image.]
[PRODUCT REFERENCE: ${productReference}]
[SUBCATEGORY STYLE: ${subCategoryModifier}]
[SPF VISUAL: ${spfVisual}]
[FEATURE VISUAL: ${featureVisual}]
[BLOCK VARIATION: ${blockModifier}]
${freeSystemModifier ? `[CLEAN BEAUTY: ${freeSystemModifier}]` : ''}
${basePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page photography, high-end suncare advertising, 8K resolution, warm summer mood, clean visual without any text overlay
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  // 네거티브 프롬프트 - 텍스트 금지 강화
  if (includeNegative) {
    prompt += ` --negative text, letters, words, numbers, typography, Korean text, English text, Chinese text, Japanese text, any characters, logo text, brand name text, labels, captions, titles, subtitles, SPF numbers visible, PA rating text, watermark, signatures, hand-written text, printed text, floating text, overlay text, embedded text, low quality, blurry, noisy, amateur, cartoon, anime, illustration, distorted product, wrong proportions, unrealistic, cold blue tones, winter mood`;
  }

  return prompt;
}

/**
 * 전체 섹션 프롬프트 세트 생성
 */
export function buildSuncareFullPromptSet(
  options: SuncareImagePromptOptions
): Record<SuncareDetailSectionType, string[]> {
  const sections: SuncareDetailSectionType[] = [
    'BRAND_HEADER',
    'HERO_SUNCARE',
    'TEXT_BANNER_1',
    'KEY_BENEFITS',
    'KEY_MESSAGE_1',
    'ACTIVE_INGREDIENTS',
    'BENEFIT_HIGHLIGHT_1',
    'FREE_SYSTEM',
    'NATURAL_INGREDIENTS',
    'DIVIDER_VISUAL_1',
    'UV_PROTECTION_TECH',
    'KEY_MESSAGE_2',
    'TEXTURE_CLOSEUP',
    'HOW_TO_USE',
    'TEXT_BANNER_2',
    'BRAND_CLOSING',
    'PRODUCT_LINEUP',
  ];

  const result: Record<SuncareDetailSectionType, string[]> = {} as Record<SuncareDetailSectionType, string[]>;

  for (const section of sections) {
    const blockCount = SUNCARE_SECTION_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildSuncareImagePrompt(section, options, i));
    }
  }

  return result;
}

/**
 * 특정 섹션의 모든 블록 프롬프트 생성
 */
export function buildSuncareSectionPrompts(
  section: SuncareDetailSectionType,
  options: SuncareImagePromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = SUNCARE_SECTION_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildSuncareImagePrompt(section, options, block.blockIndex),
  }));
}

// ============================================
// 선케어 특화 헬퍼 함수
// ============================================

/**
 * SPF/PA 조합에 따른 비주얼 강도 반환
 */
export function getProtectionVisualIntensity(level: SunProtectionLevel): string {
  const spfIntensity = SPF_VISUAL_INTENSITY[level.spf];
  const paBoost = level.pa === 'PA++++' ? ', maximum UVA protection, strongest shield effect' : '';
  return spfIntensity + paBoost;
}

/**
 * 특징별 색상 팔레트 추천
 */
export function getSuncareColorPalette(feature: keyof typeof SUNCARE_FEATURE_KEYWORDS): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const palettes: Record<keyof typeof SUNCARE_FEATURE_KEYWORDS, { primary: string; secondary: string; accent: string }> = {
    uv_protection: { primary: '#FF8C00', secondary: '#FFD700', accent: '#FFF8DC' },
    lightweight: { primary: '#87CEEB', secondary: '#E0FFFF', accent: '#F0FFFF' },
    no_whitecast: { primary: '#FFEFD5', secondary: '#FFF5EE', accent: '#FFFAF0' },
    long_lasting: { primary: '#4169E1', secondary: '#6495ED', accent: '#E6E6FA' },
    sensitive_safe: { primary: '#98FB98', secondary: '#F0FFF0', accent: '#FFFAFA' },
    tone_up: { primary: '#FFB6C1', secondary: '#FFC0CB', accent: '#FFF0F5' },
  };

  return palettes[feature];
}

/**
 * 계절/상황별 추가 비주얼 수식어
 */
export function getSeasonalModifier(season: 'summer' | 'spring' | 'all_season' | 'outdoor' | 'daily'): string {
  const modifiers: Record<string, string> = {
    summer: 'bright intense summer sun, beach and pool context, vibrant tropical mood',
    spring: 'gentle spring sunlight, cherry blossom hints, soft outdoor mood',
    all_season: 'year-round protection, everyday context, versatile usage scenes',
    outdoor: 'active outdoor sports, hiking and camping, adventure protection mood',
    daily: 'everyday urban life, commute and casual outing, subtle sun protection',
  };

  return modifiers[season] || modifiers.daily;
}

// ============================================
// Export
// ============================================

export {
  SUNCARE_SECTION_BASE_PROMPTS,
  SUNCARE_SUBCATEGORY_MODIFIERS,
  SPF_VISUAL_INTENSITY,
};
