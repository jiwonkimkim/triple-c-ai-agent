/**
 * 마스카라 카테고리 전용 이미지 프롬프트
 * 올리브영 실제 상세페이지 분석 기반 (클리오 킬래쉬 등 참고)
 *
 * 섹션 구조: 15개 표준 섹션 + 블록별 변형
 * 특징: 래쉬 볼륨/컬링, 워터프루프, 브러시 기술, Before/After
 */

import type { ProductVisualReference } from './types';

// ============================================
// 마스카라 섹션 타입 정의
// ============================================

export type MascaraDetailSectionType =
  | 'BRAND_HEADER'         // 섹션 1: 브랜드 헤더
  | 'HERO_MASCARA'         // 섹션 2: 히어로 배너 (메인 제품샷)
  | 'TEXT_BANNER_1'        // 섹션 3: 텍스트 배너 (카피/슬로건)
  | 'VARIANT_LINEUP'       // 섹션 4: 제품 타입 배리에이션
  | 'EYE_BEFORE_AFTER'     // 섹션 5: 모델 아이 클로즈업 (Before/After)
  | 'KEY_MESSAGE_1'        // 섹션 6: 핵심 메시지 배경
  | 'WAND_CLOSEUP'         // 섹션 7: 브러시/완드 클로즈업
  | 'MODEL_BEAUTY_SHOT'    // 섹션 8: 모델 뷰티샷 (정면/측면)
  | 'BENEFIT_HIGHLIGHT_1'  // 섹션 9: 성분/효능 하이라이트 배경
  | 'CURL_EFFECT_VISUAL'   // 섹션 10: 래쉬 컬링 효과 비주얼
  | 'TEXTURE_FORMULA'      // 섹션 11: 텍스처/포뮬러 클로즈업
  | 'DIVIDER_VISUAL_1'     // 섹션 12: 섹션 구분 비주얼
  | 'LASH_DETAIL_MACRO'    // 섹션 13: 래쉬 디테일 극대화 클로즈업
  | 'WATERPROOF_TEST'      // 섹션 14: 지속력/워터프루프 테스트
  | 'KEY_MESSAGE_2'        // 섹션 15: 핵심 메시지 배경 2
  | 'HOW_TO_USE'           // 섹션 16: 사용법
  | 'MODEL_ANGLE_GRID'     // 섹션 17: 모델 다양한 앵글 쇼케이스
  | 'TEXT_BANNER_2'        // 섹션 18: 텍스트 배너 2 (클로징 카피)
  | 'COMPETITOR_COMPARE'   // 섹션 19: 타 제품 비교 (경쟁 우위)
  | 'FULL_LINEUP'          // 섹션 20: 전체 제품 라인업
  | 'CTA_CLOSING';         // 섹션 21: 클로징 배너

// ============================================
// 마스카라 서브카테고리/타입 정의
// ============================================

export type MascaraType =
  | 'volume'               // 볼륨
  | 'curl'                 // 컬링
  | 'lengthening'          // 롱래쉬
  | 'waterproof'           // 워터프루프
  | 'fiber'                // 화이버
  | 'natural'              // 내추럴
  | 'dramatic'             // 드라마틱
  | 'clear'                // 투명/탑코트
  | 'colored'              // 컬러 마스카라
  | 'primer';              // 마스카라 프라이머

// ============================================
// 마스카라 브러시/완드 타입
// ============================================

export type WandType =
  | 'curved'               // 커브드 브러시
  | 'straight'             // 스트레이트 브러시
  | 'hourglass'            // 아워글라스 형태
  | 'comb'                 // 빗살형
  | 'ball'                 // 볼 타입
  | 'micro'                // 마이크로 브러시
  | 'thick'                // 두꺼운 브러시
  | 'tapered';             // 테이퍼드(끝이 가는)

// ============================================
// 마스카라 특화 키워드
// ============================================

export const MASCARA_FEATURE_KEYWORDS = {
  volume: {
    ko: ['볼륨', '풍성한', '도톰한', '빅래쉬'],
    en: ['volumizing', 'thick lashes', 'bold volume', 'dramatic fullness'],
    visual: ['thick dense lashes', 'dramatic volume', 'full lash effect', 'bold eye impact'],
  },
  curl: {
    ko: ['컬링', '곡선', '올라간', '고정력'],
    en: ['curling', 'lifted', 'curved upward', 'curl-fixing'],
    visual: ['dramatically curled lashes', 'upward lift', '80-degree curl', 'eye-opening effect'],
  },
  lengthening: {
    ko: ['롱래쉬', '길어진', '연장', '늘어난'],
    en: ['lengthening', 'extended', 'elongated', 'stretched'],
    visual: ['long extended lashes', 'fiber extension', 'reaching lash tips', 'elegant length'],
  },
  separation: {
    ko: ['세퍼레이션', '가닥가닥', '결분리', '깔끔한'],
    en: ['separated', 'defined', 'clump-free', 'individual lashes'],
    visual: ['individually defined lashes', 'no clumping', 'clean separation', 'precise definition'],
  },
  waterproof: {
    ko: ['워터프루프', '번짐없는', '지속력', '땀에강한'],
    en: ['waterproof', 'smudge-proof', 'long-lasting', 'sweat-resistant'],
    visual: ['water droplets on lashes', 'no smudging', 'intact after water', 'durability proof'],
  },
  natural: {
    ko: ['내추럴', '자연스러운', '데일리', '가벼운'],
    en: ['natural', 'everyday', 'lightweight', 'subtle'],
    visual: ['natural-looking lashes', 'effortless beauty', 'subtle enhancement', 'soft definition'],
  },
} as const;

// ============================================
// 마스카라 무드/스타일 키워드
// ============================================

export const MASCARA_MOOD_KEYWORDS = {
  edgy: 'edgy bold confident dramatic fierce high-fashion editorial',
  elegant: 'elegant sophisticated chic refined timeless graceful',
  natural: 'natural everyday effortless fresh clean soft',
  glamorous: 'glamorous luxurious stunning dramatic evening party',
  cute: 'cute youthful innocent playful adorable sweet',
} as const;

// ============================================
// 컬러 팔레트 (마스카라 특화)
// ============================================

export const MASCARA_COLOR_PALETTE = {
  black: { hex: '#000000', name: '블랙', mood: 'classic dramatic bold' },
  brown: { hex: '#4A3728', name: '브라운', mood: 'soft natural warm' },
  burgundy: { hex: '#800020', name: '버건디', mood: 'sophisticated elegant' },
  navy: { hex: '#000080', name: '네이비', mood: 'unique subtle cool' },
  clear: { hex: '#FFFFFF', name: '클리어', mood: 'natural glossy transparent' },
} as const;

// ============================================
// 섹션별 블록 변형 정의
// ============================================

export interface MascaraSectionBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const MASCARA_SECTION_BLOCKS: Record<MascaraDetailSectionType, MascaraSectionBlockVariation[]> = {
  BRAND_HEADER: [
    { blockIndex: 0, conceptType: 'logo-banner', promptModifier: 'sleek brand banner with black and pink accent', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'edgy-header', promptModifier: 'bold edgy header with dramatic typography space', aspectRatio: '4:1' },
  ],
  HERO_MASCARA: [
    { blockIndex: 0, conceptType: 'ink-splash', promptModifier: 'product with dramatic black ink splash background', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'neon-accent', promptModifier: 'product with hot pink neon lighting accent', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'wand-reveal', promptModifier: 'tube with wand pulled out showing formula', aspectRatio: '4:3' },
  ],
  TEXT_BANNER_1: [
    { blockIndex: 0, conceptType: 'solid-black', promptModifier: 'pure solid black (#1a1a1a) color fill only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'black-pink-gradient', promptModifier: 'simple horizontal gradient from black to hot pink only', aspectRatio: '3:1' },
  ],
  VARIANT_LINEUP: [
    { blockIndex: 0, conceptType: 'side-by-side', promptModifier: '3-4 variants arranged side by side', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'feature-highlight', promptModifier: 'each variant with feature icon overlay space', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'gradient-display', promptModifier: 'products in gradient background arrangement', aspectRatio: '16:9' },
  ],
  EYE_BEFORE_AFTER: [
    { blockIndex: 0, conceptType: 'split-comparison', promptModifier: 'split frame before/after lash comparison', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'side-by-side', promptModifier: 'side by side bare vs mascara lashes', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'transformation', promptModifier: 'dramatic lash transformation sequence', aspectRatio: '3:1' },
  ],
  KEY_MESSAGE_1: [
    { blockIndex: 0, conceptType: 'radial-black-pink', promptModifier: 'soft radial gradient - hot pink center fading to black edges only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-dark-gray', promptModifier: 'pure solid dark gray (#2d2d2d) color fill only', aspectRatio: '3:1' },
  ],
  WAND_CLOSEUP: [
    { blockIndex: 0, conceptType: 'macro-bristles', promptModifier: 'extreme macro shot of wand bristles', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'curved-profile', promptModifier: 'wand profile showing curved shape', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'formula-coating', promptModifier: 'wand with formula coating visible', aspectRatio: '1:1' },
  ],
  MODEL_BEAUTY_SHOT: [
    { blockIndex: 0, conceptType: 'front-fierce', promptModifier: 'model front view with fierce confident expression', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'three-quarter', promptModifier: 'three-quarter angle showing lash profile', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'side-profile', promptModifier: 'side profile emphasizing lash curl', aspectRatio: '4:3' },
  ],
  BENEFIT_HIGHLIGHT_1: [
    { blockIndex: 0, conceptType: 'split-black-pink', promptModifier: 'simple two-color split - left black right hot pink only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-charcoal', promptModifier: 'pure solid charcoal (#333333) color fill only', aspectRatio: '3:1' },
  ],
  CURL_EFFECT_VISUAL: [
    { blockIndex: 0, conceptType: 'curl-diagram', promptModifier: 'lash curl angle diagram with measurement', aspectRatio: '16:9' },
    { blockIndex: 1, conceptType: 'before-after-curl', promptModifier: 'straight vs curled lashes comparison', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'lift-arrow', promptModifier: 'upward lift direction arrow visualization', aspectRatio: '4:3' },
  ],
  TEXTURE_FORMULA: [
    { blockIndex: 0, conceptType: 'swatch-surface', promptModifier: 'formula swatch on clear surface', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'wand-drag', promptModifier: 'wand dragging through formula', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'consistency-shot', promptModifier: 'smooth non-clumpy consistency close-up', aspectRatio: '1:1' },
  ],
  DIVIDER_VISUAL_1: [
    { blockIndex: 0, conceptType: 'solid-black-strip', promptModifier: 'pure solid black horizontal strip only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'pink-gradient-strip', promptModifier: 'simple black to hot pink gradient strip only', aspectRatio: '3:1' },
  ],
  LASH_DETAIL_MACRO: [
    { blockIndex: 0, conceptType: 'individual-lashes', promptModifier: 'ultra macro individual lash separation', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'ring-light-eye', promptModifier: 'eye with ring light catchlight and lash detail', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'fiber-detail', promptModifier: 'fiber extension visible on lash tips', aspectRatio: '16:9' },
  ],
  WATERPROOF_TEST: [
    { blockIndex: 0, conceptType: 'water-droplets', promptModifier: 'water droplets on lashes showing no smudge', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'splash-intact', promptModifier: 'water splash with lashes intact', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'durability-icons', promptModifier: 'sweat humidity clock icons infographic', aspectRatio: '3:1' },
  ],
  KEY_MESSAGE_2: [
    { blockIndex: 0, conceptType: 'radial-gray-pink', promptModifier: 'soft radial gradient - pink center fading to dark gray edges only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-black', promptModifier: 'pure solid black color fill only', aspectRatio: '3:1' },
  ],
  HOW_TO_USE: [
    { blockIndex: 0, conceptType: 'step-sequence', promptModifier: '4-step application guide with numbered circles', aspectRatio: '4:1' },
    { blockIndex: 1, conceptType: 'zigzag-motion', promptModifier: 'zigzag application motion on lashes', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'layering-guide', promptModifier: 'layering technique for buildable volume', aspectRatio: '3:2' },
  ],
  MODEL_ANGLE_GRID: [
    { blockIndex: 0, conceptType: 'grid-4', promptModifier: '4-panel grid front side profile angles', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'grid-6', promptModifier: '6-panel grid showing all perspectives', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'strip-angles', promptModifier: 'horizontal strip of different angles', aspectRatio: '4:1' },
  ],
  TEXT_BANNER_2: [
    { blockIndex: 0, conceptType: 'black-pink-gradient', promptModifier: 'simple horizontal gradient from black to hot pink only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-hot-pink', promptModifier: 'pure solid hot pink (#FF1493) color fill only', aspectRatio: '3:1' },
  ],
  COMPETITOR_COMPARE: [
    { blockIndex: 0, conceptType: 'vs-comparison', promptModifier: 'side by side competitor vs product comparison', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'check-x-marks', promptModifier: 'comparison with checkmarks and x marks', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'lash-result-compare', promptModifier: 'clumpy vs separated lash result', aspectRatio: '16:9' },
  ],
  FULL_LINEUP: [
    { blockIndex: 0, conceptType: 'collection-flatlay', promptModifier: 'complete collection flat lay arrangement', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'standing-row', promptModifier: 'products standing in row display', aspectRatio: '4:1' },
    { blockIndex: 2, conceptType: 'aesthetic-arrangement', promptModifier: 'artistic arrangement with brand colors', aspectRatio: '1:1' },
  ],
  CTA_CLOSING: [
    { blockIndex: 0, conceptType: 'hero-eye-combo', promptModifier: 'product hero with model eye in background', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'dramatic-gradient', promptModifier: 'hot pink black gradient with product', aspectRatio: '2:1' },
  ],
};

// ============================================
// 마스카라 이미지 프롬프트 빌더 옵션
// ============================================

export interface MascaraImagePromptOptions {
  /** 제품명 */
  productName: string;
  /** 마스카라 타입 (볼륨, 컬링 등) */
  mascaraType: MascaraType;
  /** 브러시/완드 타입 */
  wandType: WandType;
  /** 주요 특징 */
  primaryFeature: keyof typeof MASCARA_FEATURE_KEYWORDS;
  /** 무드/스타일 */
  mood?: keyof typeof MASCARA_MOOD_KEYWORDS;
  /** 제품 컬러 */
  productColor?: keyof typeof MASCARA_COLOR_PALETTE;
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

const MASCARA_SECTION_BASE_PROMPTS: Record<MascaraDetailSectionType, string> = {
  BRAND_HEADER: `
Minimal sleek header banner design,
modern edgy Korean cosmetic brand aesthetic,
black and hot pink accent color scheme,
clean bold typography space reserved,
professional makeup brand identity,
horizontal banner composition,
dramatic confident mood,
CRITICAL: NO TEXT NO LETTERS - gradient and accent only
`.trim(),

  HERO_MASCARA: `
Mascara product hero shot photography,
sleek black tube packaging with accent color details,
dynamic mascara wand pulled out showing product texture,
dramatic black ink splash or brush stroke effect background,
hot pink or neon accent lighting creating edge,
edgy high-fashion makeup campaign aesthetic,
fierce confident beauty mood,
Korean professional makeup brand style,
4K product photography with dramatic lighting,
CRITICAL: NO TEXT NO PRODUCT NAMES - visual only
`.trim(),

  TEXT_BANNER_1: `
Pure solid color or simple gradient background ONLY,
solid black (#1a1a1a) fill OR simple black to hot pink horizontal gradient,
completely flat empty background - absolutely NO objects NO brush strokes NO shapes,
just color fill for text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO PATTERNS NO NEON EFFECTS
`.trim(),

  VARIANT_LINEUP: `
Mascara product lineup arrangement photography,
3-4 different mascara variants displayed side by side,
(Volume, Curl, Lengthening, Waterproof versions),
consistent tube packaging with different accent colors per variant,
clean white or gradient gray background,
professional cosmetic catalog photography,
clear label space below each product,
sleek modern K-beauty product display,
CRITICAL: NO TEXT NO VARIANT NAMES - products only
`.trim(),

  EYE_BEFORE_AFTER: `
Extreme close-up Korean female model eye photography,
split comparison before and after mascara application,
bare natural short lashes versus dramatic volumized curled lashes,
same professional lighting same angle for clear comparison,
stunning lash transformation clearly visible,
individual lash separation and definition detail,
professional beauty photography lighting setup,
K-beauty mascara advertisement style,
clean minimal background focus on eye area only,
CRITICAL: NO TEXT NO LABELS - visual comparison only
`.trim(),

  KEY_MESSAGE_1: `
Pure solid color or simple radial gradient background ONLY,
soft radial gradient with hot pink center fading to black edges OR solid dark gray fill,
completely flat empty background - absolutely NO silhouettes NO neon effects NO blur,
just color for message overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO GLOW EFFECTS NO DECORATIONS
`.trim(),

  WAND_CLOSEUP: `
Mascara wand extreme macro photography close-up,
detailed bristle structure clearly visible,
curved ergonomic brush shape design,
black mascara formula coating the bristles evenly,
clean white or soft gray gradient background,
professional product detail photography,
brush technology explanation visual,
fiber brush or curved wand design feature highlight,
precise cosmetic tool photography style,
CRITICAL: NO TEXT NO FEATURE NAMES - wand detail only
`.trim(),

  MODEL_BEAUTY_SHOT: `
Korean female model in her 20s editorial beauty portrait,
dramatic eye makeup with volumized long lashes as focal point,
fierce confident expression with slight smize,
soft diffused professional studio lighting,
clean minimal background (white or soft pink or gray),
individual lash definition clearly visible at high resolution,
high-fashion K-beauty campaign photography style,
professional retouching maintaining natural skin texture,
bold yet elegant makeup look,
CRITICAL: NO TEXT overlays on image
`.trim(),

  BENEFIT_HIGHLIGHT_1: `
Pure solid color or simple split-tone background ONLY,
solid charcoal fill OR simple two-color split (black and hot pink),
completely flat empty background - absolutely NO icons NO shapes NO textures,
just color zones for benefit text overlay,
CRITICAL: ONLY SOLID COLORS OR SIMPLE GRADIENTS - NO ICONS NO SHAPES NO DECORATIONS NO ACCENTS
`.trim(),

  CURL_EFFECT_VISUAL: `
Lash curling effect demonstration diagram visualization,
side profile of eye showing lash curl angle clearly,
before straight droopy lashes illustration,
after dramatically curled upward lashes illustration,
curved arrow indicating lift direction,
80-degree curl angle measurement visual indicator,
clean instructional infographic style,
soft pink and black color scheme,
Korean mascara benefit explanation layout,
CRITICAL: NO TEXT NO NUMBERS - visual arrows and diagram only
`.trim(),

  TEXTURE_FORMULA: `
Mascara formula texture macro shot photography,
black creamy product swatch on clear glass or white surface,
smooth non-clumpy consistency clearly visible,
glossy wet texture appearance,
mascara wand dragging through product creating trail,
clean minimal background,
satisfying cosmetic texture photography,
smudge-proof clump-free formula visualization,
professional product detail aesthetic,
CRITICAL: NO TEXT - texture focus only
`.trim(),

  DIVIDER_VISUAL_1: `
Pure solid color horizontal strip ONLY,
solid black strip OR simple black to hot pink gradient strip,
completely flat thin color band - absolutely NO patterns NO waves NO brush strokes,
just a color strip,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT STRIP - NO PATTERNS NO WAVES NO DECORATIONS
`.trim(),

  LASH_DETAIL_MACRO: `
Ultra close-up macro photography of mascara-coated lashes,
individual lash fiber separation clearly visible,
dramatic lengthening and volumizing effect,
no clumping clean lash definition,
soft focus blur on surrounding eye area,
professional macro beauty photography,
satisfying lash detail ASMR aesthetic,
K-beauty mascara result showcase,
studio ring light reflection catchlight in eye,
CRITICAL: NO TEXT - pure lash detail only
`.trim(),

  WATERPROOF_TEST: `
Waterproof mascara durability test visualization,
water droplets beading on lashes without smudging,
split frame concept: water splash versus intact lashes,
sweat and humidity resistance icon shapes,
24-hour longevity clock symbol visual,
clean infographic layout design,
before/after workout or swimming concept,
Korean cosmetic product performance test style,
trust-building product proof aesthetic,
CRITICAL: NO TEXT NO NUMBERS - icons and visuals only
`.trim(),

  KEY_MESSAGE_2: `
Pure solid color or simple radial gradient background ONLY,
soft radial gradient with pink center fading to dark gray edges OR solid black fill,
completely flat empty background - absolutely NO sparkles NO geometric frames NO glow,
just color for message overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO SPARKLES NO DECORATIONS
`.trim(),

  HOW_TO_USE: `
Step-by-step mascara application guide visualization,
3-4 step process with numbered circular badges,
Step 1 visual: Curl lashes with curler,
Step 2 visual: Apply from root to tip in zigzag motion,
Step 3 visual: Build layers for more volume,
Step 4 visual: Comb through for separation,
elegant hand holding mascara wand demonstration,
eye diagram with application direction arrows,
clean instructional layout design,
soft pink background with black accents,
Korean beauty tutorial infographic style,
CRITICAL: NO TEXT - numbered circles and arrows only
`.trim(),

  MODEL_ANGLE_GRID: `
Grid layout of same Korean model from different angles,
front view, three-quarter view, side profile, looking down poses,
consistent dramatic lash makeup across all frames,
showing mascara effect from multiple perspectives,
clean white borders between grid frames,
professional beauty portfolio style,
editorial K-beauty lookbook aesthetic,
4-6 frame grid arrangement,
uniform lighting across all shots,
CRITICAL: NO TEXT NO LABELS - grid visuals only
`.trim(),

  TEXT_BANNER_2: `
Pure solid color or simple gradient background ONLY,
simple horizontal gradient from black to hot pink OR solid hot pink fill,
completely flat empty background - absolutely NO sparkles NO bokeh NO corner accents,
just color fill for closing text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO SPARKLES NO DECORATIONS
`.trim(),

  COMPETITOR_COMPARE: `
Product comparison infographic layout visualization,
side by side lash result comparison frames,
competitor result: clumpy sparse uneven lashes,
featured product result: separated volumized defined lashes,
check marks and X marks indicator shapes,
clean professional comparison chart layout,
VS visual divider element,
Korean cosmetic product superiority demonstration,
trustworthy before/after comparison style,
CRITICAL: NO TEXT NO BRAND NAMES - visual comparison only
`.trim(),

  FULL_LINEUP: `
Complete mascara collection display photography,
all variants arranged in aesthetic formation,
Volume Curl Fix Lengthening Waterproof versions displayed,
black and pink cohesive packaging design visible,
clean white background with soft professional shadows,
professional catalog flat lay photography,
product name label space below each item,
premium K-beauty mascara collection showcase,
CRITICAL: NO TEXT NO PRODUCT NAMES - arrangement only
`.trim(),

  CTA_CLOSING: `
Closing banner with dramatic model eye and product combination,
mascara tube prominently displayed center or left,
model's stunning lash close-up in background as accent,
CTA button area placeholder (rounded rectangle shape),
hot pink and black gradient background,
bold confident feminine energy,
brand logo placeholder area,
edgy modern K-beauty closing banner,
compelling purchase motivation layout,
CRITICAL: NO TEXT - placeholder shapes only
`.trim(),
};

// ============================================
// 마스카라 타입별 비주얼 수식어
// ============================================

const MASCARA_TYPE_MODIFIERS: Record<MascaraType, string> = {
  volume: 'dramatic thick bold lashes, maximum volume effect, full dense coverage, big lash impact',
  curl: 'dramatically curled upward lashes, eye-opening lift effect, C-curl definition, long-lasting curl',
  lengthening: 'extended elongated lashes, fiber-enhanced length, reaching lash tips, elegant extension',
  waterproof: 'water-resistant formula, smudge-proof finish, all-day wear, swim-proof durability',
  fiber: 'fiber-infused formula, lash extension effect, buildable fibers, dramatic length addition',
  natural: 'natural-looking enhancement, everyday subtle definition, lightweight formula, effortless beauty',
  dramatic: 'high-impact dramatic lashes, bold statement look, maximum definition, runway-ready',
  clear: 'transparent glossy finish, natural lash enhancement, grooming effect, subtle shine',
  colored: 'unique colored lashes, fashion-forward look, vibrant pigment, creative expression',
  primer: 'lash priming base, enhanced mascara application, conditioning formula, lash care',
};

// ============================================
// 완드 타입별 비주얼 수식어
// ============================================

const WAND_TYPE_MODIFIERS: Record<WandType, string> = {
  curved: 'curved ergonomic brush design, follows lash line naturally, easy-grip application',
  straight: 'straight classic brush design, precise control, traditional application style',
  hourglass: 'hourglass-shaped brush, volume at center, precision at tips, versatile application',
  comb: 'comb-like bristle design, maximum separation, clump-free definition, precise styling',
  ball: 'ball-tip applicator, reaches inner corner lashes, detailed application, compact precision',
  micro: 'micro-sized brush, reaches every lash, lower lash application, detailed work',
  thick: 'thick dense brush, maximum product pickup, bold volume application, full coverage',
  tapered: 'tapered tip design, bulk at base precision at tip, versatile length and detail work',
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

/**
 * 마스카라 섹션별 이미지 프롬프트 생성
 */
export function buildMascaraImagePrompt(
  section: MascaraDetailSectionType,
  options: MascaraImagePromptOptions,
  blockIndex: number = 0
): string {
  const {
    productName,
    mascaraType,
    wandType,
    primaryFeature,
    mood = 'edgy',
    productColor = 'black',
    brandStyle,
    visualReference,
    additionalKeywords = [],
    includeNegative = true,
  } = options;

  // 기본 섹션 프롬프트
  const basePrompt = MASCARA_SECTION_BASE_PROMPTS[section];

  // 마스카라 타입 수식어
  const typeModifier = MASCARA_TYPE_MODIFIERS[mascaraType];

  // 완드 타입 수식어
  const wandModifier = WAND_TYPE_MODIFIERS[wandType];

  // 특징 키워드
  const featureData = MASCARA_FEATURE_KEYWORDS[primaryFeature];
  const featureVisual = featureData.visual.join(', ');

  // 무드 키워드
  const moodModifier = MASCARA_MOOD_KEYWORDS[mood];

  // 컬러 정보
  const colorInfo = MASCARA_COLOR_PALETTE[productColor];

  // 블록 변형 적용 (섹션이 없으면 기본값 사용)
  const blockVariations = MASCARA_SECTION_BLOCKS[section];
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
    : 'Korean K-beauty mascara brand, edgy modern professional';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합 - ★ 이미지 내 텍스트 생성 금지 명시
  let prompt = `
[CRITICAL: NO TEXT IN IMAGE - Generate pure visual imagery only. Do not include any text, letters, words, numbers, labels, or typography in the image.]
[PRODUCT REFERENCE: ${productReference}]
[MASCARA TYPE: ${typeModifier}]
[WAND TYPE: ${wandModifier}]
[FEATURE VISUAL: ${featureVisual}]
[MOOD: ${moodModifier}]
[COLOR: ${colorInfo.name} - ${colorInfo.mood}]
[BLOCK VARIATION: ${blockModifier}]
${basePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page photography, high-end mascara advertising, 8K resolution, dramatic confident mood, black and pink accent lighting, clean visual without any text overlay
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  // 네거티브 프롬프트 - 텍스트 금지 강화
  if (includeNegative) {
    prompt += ` --negative text, letters, words, numbers, typography, Korean text, English text, Chinese text, Japanese text, any characters, logo text, brand name text, labels, captions, titles, subtitles, watermark, signatures, hand-written text, printed text, floating text, overlay text, embedded text, low quality, blurry, noisy, amateur, cartoon, anime, illustration, distorted product, wrong proportions, clumpy lashes, spider lashes, smudged makeup, raccoon eyes, unnatural lash texture`;
  }

  return prompt;
}

/**
 * 전체 섹션 프롬프트 세트 생성
 */
export function buildMascaraFullPromptSet(
  options: MascaraImagePromptOptions
): Record<MascaraDetailSectionType, string[]> {
  const sections: MascaraDetailSectionType[] = [
    'BRAND_HEADER',
    'HERO_MASCARA',
    'TEXT_BANNER_1',
    'VARIANT_LINEUP',
    'EYE_BEFORE_AFTER',
    'KEY_MESSAGE_1',
    'WAND_CLOSEUP',
    'MODEL_BEAUTY_SHOT',
    'BENEFIT_HIGHLIGHT_1',
    'CURL_EFFECT_VISUAL',
    'TEXTURE_FORMULA',
    'DIVIDER_VISUAL_1',
    'LASH_DETAIL_MACRO',
    'WATERPROOF_TEST',
    'KEY_MESSAGE_2',
    'HOW_TO_USE',
    'MODEL_ANGLE_GRID',
    'TEXT_BANNER_2',
    'COMPETITOR_COMPARE',
    'FULL_LINEUP',
    'CTA_CLOSING',
  ];

  const result: Record<MascaraDetailSectionType, string[]> = {} as Record<MascaraDetailSectionType, string[]>;

  for (const section of sections) {
    const blockCount = MASCARA_SECTION_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildMascaraImagePrompt(section, options, i));
    }
  }

  return result;
}

/**
 * 특정 섹션의 모든 블록 프롬프트 생성
 */
export function buildMascaraSectionPrompts(
  section: MascaraDetailSectionType,
  options: MascaraImagePromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = MASCARA_SECTION_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildMascaraImagePrompt(section, options, block.blockIndex),
  }));
}

// ============================================
// 마스카라 특화 헬퍼 함수
// ============================================

/**
 * 마스카라 타입별 추천 무드 반환
 */
export function getRecommendedMoodForType(type: MascaraType): keyof typeof MASCARA_MOOD_KEYWORDS {
  const recommendations: Record<MascaraType, keyof typeof MASCARA_MOOD_KEYWORDS> = {
    volume: 'dramatic' as unknown as keyof typeof MASCARA_MOOD_KEYWORDS,
    curl: 'elegant',
    lengthening: 'elegant',
    waterproof: 'edgy',
    fiber: 'dramatic' as unknown as keyof typeof MASCARA_MOOD_KEYWORDS,
    natural: 'natural',
    dramatic: 'glamorous',
    clear: 'natural',
    colored: 'edgy',
    primer: 'natural',
  };

  // dramatic은 MASCARA_MOOD_KEYWORDS에 없으므로 기본값 처리
  const mood = recommendations[type];
  if (mood === 'dramatic' as unknown as keyof typeof MASCARA_MOOD_KEYWORDS) {
    return 'glamorous';
  }
  return mood;
}

/**
 * 마스카라 컬러 팔레트 정보 반환
 */
export function getMascaraColorInfo(color: keyof typeof MASCARA_COLOR_PALETTE): {
  hex: string;
  name: string;
  mood: string;
} {
  return MASCARA_COLOR_PALETTE[color];
}

/**
 * 완드 타입별 추천 마스카라 타입
 */
export function getRecommendedWandForType(type: MascaraType): WandType {
  const recommendations: Record<MascaraType, WandType> = {
    volume: 'thick',
    curl: 'curved',
    lengthening: 'tapered',
    waterproof: 'curved',
    fiber: 'comb',
    natural: 'micro',
    dramatic: 'hourglass',
    clear: 'comb',
    colored: 'straight',
    primer: 'straight',
  };

  return recommendations[type];
}

// ============================================
// Export
// ============================================

export {
  MASCARA_SECTION_BASE_PROMPTS,
  MASCARA_TYPE_MODIFIERS,
  WAND_TYPE_MODIFIERS,
};
