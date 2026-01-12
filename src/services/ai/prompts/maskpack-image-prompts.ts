/**
 * 마스크팩 카테고리 전용 이미지 프롬프트
 * 올리브영 실제 상세페이지 분석 기반 (티트리/시카 마스크 등 참고)
 *
 * 섹션 구조: 17개 표준 섹션 + 블록별 변형
 * 특징: 성분별 배리에이션, 에센스 텍스처, 모델 착용샷, 사용 전후
 */

import type { ProductVisualReference } from './types';

// ============================================
// 마스크팩 섹션 타입 정의
// ============================================

export type MaskPackDetailSectionType =
  | 'BRAND_HEADER'           // 섹션 1: 브랜드 헤더
  | 'HERO_MASKPACK'          // 섹션 2: 히어로 배너 (메인 제품샷)
  | 'TEXT_BANNER_1'          // 섹션 3: 텍스트 배너 (카피/슬로건)
  | 'KEY_INGREDIENTS'        // 섹션 4: 핵심 성분 비주얼
  | 'ESSENCE_TEXTURE'        // 섹션 5: 에센스/세럼 텍스처
  | 'KEY_MESSAGE_1'          // 섹션 6: 핵심 메시지 배경
  | 'SHEET_MATERIAL'         // 섹션 7: 마스크 시트 소재 클로즈업
  | 'VARIANT_LINEUP'         // 섹션 8: 성분별 배리에이션 라인업
  | 'BENEFIT_HIGHLIGHT_1'    // 섹션 9: 성분/효능 하이라이트 배경
  | 'INGREDIENT_TEATREE'     // 섹션 10: 티트리 성분 상세
  | 'INGREDIENT_CICA'        // 섹션 11: 시카(센텔라) 성분 상세
  | 'DIVIDER_VISUAL_1'       // 섹션 12: 섹션 구분 비주얼
  | 'MODEL_WEARING'          // 섹션 13: 모델 착용샷
  | 'BEFORE_AFTER'           // 섹션 14: 사용 전후 비교
  | 'KEY_MESSAGE_2'          // 섹션 15: 핵심 메시지 배경 2
  | 'INGREDIENT_HONEY'       // 섹션 16: 꿀/프로폴리스 성분 상세
  | 'INGREDIENT_HYALURONIC'  // 섹션 17: 히알루론산 성분 상세
  | 'HOW_TO_USE'             // 섹션 18: 사용 방법
  | 'TEXT_BANNER_2'          // 섹션 19: 텍스트 배너 2 (클로징 카피)
  | 'MASK_FIT_CLOSEUP'       // 섹션 20: 마스크 핏 클로즈업
  | 'BULK_PACK'              // 섹션 21: 대용량/멀티팩 구성
  | 'SAFETY_CERTIFICATION'   // 섹션 22: 성분 안전성/인증
  | 'CTA_CLOSING';           // 섹션 23: 클로징 배너

// ============================================
// 마스크팩 타입 정의
// ============================================

export type MaskPackType =
  | 'sheet_mask'             // 시트 마스크
  | 'wash_off'               // 워시오프 팩
  | 'peel_off'               // 필오프 팩
  | 'sleeping_pack'          // 수면 팩
  | 'modeling_pack'          // 모델링 팩
  | 'cream_pack'             // 크림 팩
  | 'gel_pack'               // 젤 팩
  | 'mud_pack'               // 머드/클레이 팩
  | 'bubble_pack'            // 버블 팩
  | 'rubber_pack';           // 러버 팩

// ============================================
// 마스크팩 주요 성분 정의
// ============================================

export type MaskIngredient =
  | 'tea_tree'               // 티트리
  | 'cica'                   // 시카/센텔라
  | 'honey'                  // 꿀/프로폴리스
  | 'hyaluronic'             // 히알루론산
  | 'vitamin_c'              // 비타민C
  | 'niacinamide'            // 나이아신아마이드
  | 'collagen'               // 콜라겐
  | 'aloe'                   // 알로에
  | 'green_tea'              // 녹차
  | 'rice'                   // 쌀
  | 'charcoal'               // 숯/차콜
  | 'snail'                  // 달팽이
  | 'peptide';               // 펩타이드

// ============================================
// 성분별 특화 키워드 및 색상
// ============================================

export const MASK_INGREDIENT_DATA = {
  tea_tree: {
    ko: ['티트리', '항균', '진정', '트러블 케어'],
    en: ['tea tree', 'antibacterial', 'soothing', 'acne care'],
    visual: ['fresh tea tree leaves', 'essential oil droplets', 'green botanical', 'purifying clean'],
    color: { primary: '#228B22', secondary: '#90EE90', accent: '#F0FFF0' },
    mood: 'purifying, clarifying, fresh, clean',
  },
  cica: {
    ko: ['시카', '센텔라', '병풀', '진정', '장벽 강화'],
    en: ['cica', 'centella asiatica', 'calming', 'barrier repair'],
    visual: ['centella leaves with water drops', 'healing green botanicals', 'gentle soothing', 'skin barrier'],
    color: { primary: '#98D8AA', secondary: '#C6EBC5', accent: '#F0FFF0' },
    mood: 'calming, healing, gentle, sensitive-care',
  },
  honey: {
    ko: ['꿀', '프로폴리스', '영양', '윤기', '보습'],
    en: ['honey', 'propolis', 'nourishing', 'glowing', 'moisturizing'],
    visual: ['golden honey dripping', 'honeycomb texture', 'warm amber glow', 'rich nourishment'],
    color: { primary: '#FFD700', secondary: '#FFA500', accent: '#FFF8DC' },
    mood: 'nourishing, luxurious, golden, radiant',
  },
  hyaluronic: {
    ko: ['히알루론산', '수분', '보습', '촉촉'],
    en: ['hyaluronic acid', 'hydrating', 'moisturizing', 'plumping'],
    visual: ['blue water molecules', 'hydration droplets', 'moisture reservoir', 'dewy freshness'],
    color: { primary: '#4A90D9', secondary: '#87CEEB', accent: '#E0F4FF' },
    mood: 'hydrating, refreshing, dewy, water-full',
  },
  vitamin_c: {
    ko: ['비타민C', '브라이트닝', '톤업', '광채'],
    en: ['vitamin C', 'brightening', 'tone-up', 'radiance'],
    visual: ['citrus orange slices', 'bright yellow glow', 'luminous radiance', 'fresh citrus'],
    color: { primary: '#FFA500', secondary: '#FFD700', accent: '#FFFACD' },
    mood: 'brightening, energizing, fresh, luminous',
  },
  niacinamide: {
    ko: ['나이아신아마이드', '모공', '피지', '맑은'],
    en: ['niacinamide', 'pore care', 'sebum control', 'clear'],
    visual: ['clear scientific molecules', 'refined skin texture', 'minimized pores', 'clear complexion'],
    color: { primary: '#E6E6FA', secondary: '#D8BFD8', accent: '#FFF0F5' },
    mood: 'clarifying, refining, scientific, pure',
  },
  collagen: {
    ko: ['콜라겐', '탄력', '탱탱', '안티에이징'],
    en: ['collagen', 'firming', 'elasticity', 'anti-aging'],
    visual: ['pink elastic fibers', 'bouncy skin concept', 'youth and firmness', 'lifting effect'],
    color: { primary: '#FFB6C1', secondary: '#FFC0CB', accent: '#FFF0F5' },
    mood: 'firming, youthful, bouncy, rejuvenating',
  },
  aloe: {
    ko: ['알로에', '수분', '진정', '쿨링'],
    en: ['aloe vera', 'hydrating', 'soothing', 'cooling'],
    visual: ['fresh aloe vera gel', 'green succulent plant', 'cooling freshness', 'gel texture'],
    color: { primary: '#7FFF00', secondary: '#ADFF2F', accent: '#F0FFF0' },
    mood: 'cooling, soothing, fresh, natural',
  },
  green_tea: {
    ko: ['녹차', '항산화', '진정', '그린'],
    en: ['green tea', 'antioxidant', 'calming', 'green'],
    visual: ['fresh green tea leaves', 'matcha powder', 'antioxidant protection', 'zen garden'],
    color: { primary: '#228B22', secondary: '#32CD32', accent: '#F0FFF0' },
    mood: 'antioxidant, calming, zen, natural',
  },
  rice: {
    ko: ['쌀', '미백', '맑은', '투명'],
    en: ['rice', 'brightening', 'clear', 'translucent'],
    visual: ['white rice grains', 'rice water milky texture', 'traditional Korean', 'pure white'],
    color: { primary: '#FFFAF0', secondary: '#FFF5EE', accent: '#FFFFFF' },
    mood: 'traditional, pure, brightening, gentle',
  },
  charcoal: {
    ko: ['숯', '차콜', '모공', '딥클렌징'],
    en: ['charcoal', 'pore cleansing', 'deep purifying', 'detox'],
    visual: ['black charcoal powder', 'deep cleansing bubbles', 'pore extraction', 'detox purification'],
    color: { primary: '#2F4F4F', secondary: '#696969', accent: '#D3D3D3' },
    mood: 'detoxifying, deep cleansing, purifying, powerful',
  },
  snail: {
    ko: ['달팽이', '뮤신', '재생', '탄력'],
    en: ['snail mucin', 'regenerating', 'elasticity', 'repair'],
    visual: ['snail mucin trail', 'golden viscous texture', 'skin regeneration', 'luxury essence'],
    color: { primary: '#DAA520', secondary: '#FFD700', accent: '#FFF8DC' },
    mood: 'regenerating, luxurious, repairing, premium',
  },
  peptide: {
    ko: ['펩타이드', '안티에이징', '탄력', '주름'],
    en: ['peptide', 'anti-aging', 'firming', 'wrinkle care'],
    visual: ['molecular chain structure', 'scientific peptide bonds', 'youth restoration', 'advanced formula'],
    color: { primary: '#9370DB', secondary: '#BA55D3', accent: '#E6E6FA' },
    mood: 'scientific, advanced, anti-aging, premium',
  },
} as const;

// ============================================
// 마스크팩 특화 키워드
// ============================================

export const MASKPACK_FEATURE_KEYWORDS = {
  hydrating: {
    ko: ['수분', '촉촉', '보습', '수분충전'],
    en: ['hydrating', 'moisturizing', 'dewy', 'moisture-locking'],
    visual: ['water droplets', 'dewy skin', 'essence dripping', 'moisture absorption'],
  },
  soothing: {
    ko: ['진정', '쿨링', '민감', '트러블'],
    en: ['soothing', 'calming', 'cooling', 'sensitive care'],
    visual: ['calm serene mood', 'gentle touch', 'relief sensation', 'comfortable skin'],
  },
  brightening: {
    ko: ['브라이트닝', '톤업', '광채', '맑은'],
    en: ['brightening', 'radiance', 'glow', 'luminous'],
    visual: ['glowing skin', 'light reflection', 'radiant complexion', 'bright transformation'],
  },
  nourishing: {
    ko: ['영양', '탄력', '안티에이징', '케어'],
    en: ['nourishing', 'firming', 'anti-aging', 'intensive care'],
    visual: ['rich essence', 'plump skin', 'youth restoration', 'luxurious care'],
  },
  purifying: {
    ko: ['정화', '클렌징', '모공', '딥클렌징'],
    en: ['purifying', 'cleansing', 'pore care', 'deep cleansing'],
    visual: ['clean pores', 'extraction bubbles', 'clear skin', 'detox effect'],
  },
} as const;

// ============================================
// 섹션별 블록 변형 정의
// ============================================

export interface MaskPackSectionBlockVariation {
  blockIndex: number;
  conceptType: string;
  promptModifier: string;
  aspectRatio: string;
}

export const MASKPACK_SECTION_BLOCKS: Record<MaskPackDetailSectionType, MaskPackSectionBlockVariation[]> = {
  BRAND_HEADER: [
    { blockIndex: 0, conceptType: 'logo-banner', promptModifier: 'clean brand banner with soft green natural aesthetic', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'nature-header', promptModifier: 'botanical elements header with brand space', aspectRatio: '4:1' },
  ],
  HERO_MASKPACK: [
    { blockIndex: 0, conceptType: 'packet-arrangement', promptModifier: 'mask packets elegantly arranged with botanical elements', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'single-hero', promptModifier: 'single mask packet hero with ingredient backdrop', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'lifestyle-hero', promptModifier: 'mask packets in spa-like setting', aspectRatio: '4:3' },
  ],
  TEXT_BANNER_1: [
    { blockIndex: 0, conceptType: 'gradient-banner', promptModifier: 'soft green to white gradient with ample text space', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'abstract-flow', promptModifier: 'abstract flowing botanical shapes with soft blur', aspectRatio: '2:1' },
  ],
  KEY_INGREDIENTS: [
    { blockIndex: 0, conceptType: 'botanical-flatlay', promptModifier: 'fresh botanical ingredients flat lay arrangement', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'ingredient-splash', promptModifier: 'ingredients with water splash freshness', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'macro-detail', promptModifier: 'macro shot of key ingredient with water drops', aspectRatio: '3:2' },
  ],
  ESSENCE_TEXTURE: [
    { blockIndex: 0, conceptType: 'droplet-pour', promptModifier: 'essence droplet pouring onto surface', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'gel-spread', promptModifier: 'gel serum spreading on clear surface', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'light-refraction', promptModifier: 'light refracting through translucent essence', aspectRatio: '1:1' },
  ],
  KEY_MESSAGE_1: [
    { blockIndex: 0, conceptType: 'center-focus', promptModifier: 'radial soft green gradient with bright center for text focus', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'soft-blur', promptModifier: 'soft blurred botanical leaves as background', aspectRatio: '4:3' },
  ],
  SHEET_MATERIAL: [
    { blockIndex: 0, conceptType: 'fabric-macro', promptModifier: 'sheet fabric texture extreme close-up', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'soaked-sheet', promptModifier: 'essence-soaked translucent sheet material', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'unfolding', promptModifier: 'sheet mask unfolding from packet', aspectRatio: '3:2' },
  ],
  VARIANT_LINEUP: [
    { blockIndex: 0, conceptType: 'color-coded-grid', promptModifier: 'color-coded variants in organized grid', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'fan-arrangement', promptModifier: 'packets arranged in fan display', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'ingredient-pairing', promptModifier: 'each packet paired with its key ingredient', aspectRatio: '16:9' },
  ],
  BENEFIT_HIGHLIGHT_1: [
    { blockIndex: 0, conceptType: 'split-layout', promptModifier: 'split green and white background for icon and text placement', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'card-style', promptModifier: 'card-style background with subtle botanical shadow', aspectRatio: '3:2' },
  ],
  INGREDIENT_TEATREE: [
    { blockIndex: 0, conceptType: 'teatree-branch', promptModifier: 'fresh tea tree branch with leaves and oil drops', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'essential-oil', promptModifier: 'tea tree essential oil extraction concept', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'purifying-visual', promptModifier: 'purifying antibacterial benefit visualization', aspectRatio: '3:2' },
  ],
  INGREDIENT_CICA: [
    { blockIndex: 0, conceptType: 'centella-leaves', promptModifier: 'fresh centella asiatica leaves with water drops', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'healing-concept', promptModifier: 'skin healing and barrier repair visualization', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'gentle-soothing', promptModifier: 'gentle soothing calming effect visual', aspectRatio: '3:2' },
  ],
  DIVIDER_VISUAL_1: [
    { blockIndex: 0, conceptType: 'wave-divider', promptModifier: 'elegant soft green wave pattern divider', aspectRatio: '6:1' },
    { blockIndex: 1, conceptType: 'line-accent', promptModifier: 'thin botanical green decorative line with leaf ornament', aspectRatio: '8:1' },
  ],
  MODEL_WEARING: [
    { blockIndex: 0, conceptType: 'spa-moment', promptModifier: 'model wearing mask in relaxing spa setting', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'selfcare-lifestyle', promptModifier: 'self-care routine lifestyle photography', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'application-action', promptModifier: 'model applying sheet mask to face', aspectRatio: '4:3' },
  ],
  BEFORE_AFTER: [
    { blockIndex: 0, conceptType: 'split-comparison', promptModifier: 'split frame before/after skin transformation', aspectRatio: '2:1' },
    { blockIndex: 1, conceptType: 'side-by-side', promptModifier: 'side by side dull vs glowing skin', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'transformation-sequence', promptModifier: 'skin transformation sequence frames', aspectRatio: '3:1' },
  ],
  KEY_MESSAGE_2: [
    { blockIndex: 0, conceptType: 'center-focus', promptModifier: 'soft mint gradient with ethereal glow center', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'geometric-minimal', promptModifier: 'minimal geometric shapes in soft green framing center', aspectRatio: '3:2' },
  ],
  INGREDIENT_HONEY: [
    { blockIndex: 0, conceptType: 'honey-drip', promptModifier: 'golden honey dripping from dipper', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'honeycomb-texture', promptModifier: 'honeycomb texture background with honey', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'golden-glow', promptModifier: 'warm golden nourishing glow concept', aspectRatio: '4:3' },
  ],
  INGREDIENT_HYALURONIC: [
    { blockIndex: 0, conceptType: 'water-molecule', promptModifier: 'blue hyaluronic acid molecule 3D visualization', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'hydration-concept', promptModifier: 'water reservoir skin hydration diagram', aspectRatio: '16:9' },
    { blockIndex: 2, conceptType: 'moisture-droplets', promptModifier: 'moisture droplets and dewy freshness', aspectRatio: '4:3' },
  ],
  HOW_TO_USE: [
    { blockIndex: 0, conceptType: 'step-sequence', promptModifier: '4-step application guide with numbered circles', aspectRatio: '4:1' },
    { blockIndex: 1, conceptType: 'application-demo', promptModifier: 'hands applying mask demonstration', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'timing-visual', promptModifier: '15-20 minute timer visualization', aspectRatio: '1:1' },
  ],
  TEXT_BANNER_2: [
    { blockIndex: 0, conceptType: 'closing-gradient', promptModifier: 'elegant green to white fade with sparkle elements', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'abstract-minimal', promptModifier: 'minimal abstract botanical accent at corners', aspectRatio: '2:1' },
  ],
  MASK_FIT_CLOSEUP: [
    { blockIndex: 0, conceptType: 'face-contour-fit', promptModifier: 'mask adhering perfectly to facial contours', aspectRatio: '3:4' },
    { blockIndex: 1, conceptType: 'eye-nose-detail', promptModifier: 'close-up of eye and nose area fit', aspectRatio: '4:3' },
    { blockIndex: 2, conceptType: 'essence-absorption', promptModifier: 'essence being absorbed into skin visual', aspectRatio: '1:1' },
  ],
  BULK_PACK: [
    { blockIndex: 0, conceptType: 'box-display', promptModifier: 'bulk box with multiple masks visible', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'quantity-showcase', promptModifier: 'quantity display showing value pack', aspectRatio: '3:2' },
    { blockIndex: 2, conceptType: 'stack-arrangement', promptModifier: 'masks stacked or fanned arrangement', aspectRatio: '1:1' },
  ],
  SAFETY_CERTIFICATION: [
    { blockIndex: 0, conceptType: 'badge-collection', promptModifier: 'safety certification badges collection', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'derma-tested', promptModifier: 'dermatologist tested icon with checkmarks', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'ingredient-safety', promptModifier: 'EWG grade safe ingredient visualization', aspectRatio: '4:3' },
  ],
  CTA_CLOSING: [
    { blockIndex: 0, conceptType: 'product-botanical', promptModifier: 'products with fresh botanical elements closing', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'nature-gradient', promptModifier: 'soft green to white gradient with product', aspectRatio: '2:1' },
  ],
};

// ============================================
// 마스크팩 이미지 프롬프트 빌더 옵션
// ============================================

export interface MaskPackImagePromptOptions {
  /** 제품명 */
  productName: string;
  /** 마스크팩 타입 */
  maskType: MaskPackType;
  /** 주요 성분 */
  primaryIngredient: MaskIngredient;
  /** 추가 성분 목록 */
  additionalIngredients?: MaskIngredient[];
  /** 주요 특징 */
  primaryFeature: keyof typeof MASKPACK_FEATURE_KEYWORDS;
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

const MASKPACK_SECTION_BASE_PROMPTS: Record<MaskPackDetailSectionType, string> = {
  BRAND_HEADER: `
Minimal clean header banner design,
soft natural green and white color scheme,
Korean skincare brand aesthetic,
fresh clean botanical beauty identity,
gentle organic feel typography space reserved,
dermatologist-tested trustworthy mood,
horizontal banner composition,
CRITICAL: NO TEXT NO LETTERS - gradient and nature elements only
`.trim(),

  HERO_MASKPACK: `
Sheet mask product hero shot photography,
individual foil packets arranged elegantly,
fresh botanical elements scattered around product,
water droplets on surface suggesting hydration,
clean white to soft mint green gradient background,
natural botanical skincare aesthetic,
Korean sheet mask advertising style,
professional product photography with natural elements,
spa-like freshness mood,
CRITICAL: NO TEXT NO PRODUCT NAMES - visual only
`.trim(),

  TEXT_BANNER_1: `
Clean elegant banner background for text overlay,
soft green to white gradient background,
ample negative space in center for large typography,
subtle botanical leaf shapes at edges only,
professional Korean sheet mask brand aesthetic,
fresh natural spa-like mood,
soft lighting with gentle green glow,
visually balanced horizontal composition for text placement,
premium K-beauty skincare marketing style,
CRITICAL: NO TEXT NO LETTERS - pure gradient background only, text will be added later
`.trim(),

  KEY_INGREDIENTS: `
Natural ingredient hero shot flat lay arrangement,
fresh botanical leaves and plants with water droplets,
clean white marble or light wood background,
soft natural daylight lighting,
botanical skincare ingredient mood board,
organic fresh plant-based aesthetic,
Korean natural cosmetic ingredient showcase,
dewy fresh morning garden feel,
ingredients looking freshly picked,
CRITICAL: NO TEXT NO LABELS - botanical visual only
`.trim(),

  ESSENCE_TEXTURE: `
Sheet mask essence texture close-up macro photography,
clear gel serum droplet on white or glass surface,
thick hydrating essence dripping or pooling,
light beautifully refracting through translucent liquid,
clean minimal background,
satisfying skincare texture ASMR aesthetic,
abundant essence visualization,
Korean skincare serum texture photography,
fresh watery lightweight feel,
CRITICAL: NO TEXT - texture focus only
`.trim(),

  KEY_MESSAGE_1: `
Focused background design for key message highlight,
soft radial green gradient drawing attention to center,
ethereal fresh atmosphere with subtle botanical glow,
blurred abstract shapes or leaf silhouette in background,
clean space for impactful single message,
Korean beauty sheet mask editorial style,
natural spa-like campaign aesthetic,
fresh and soothing sophisticated mood,
CRITICAL: NO TEXT NO LETTERS - visual background only
`.trim(),

  SHEET_MATERIAL: `
Sheet mask fabric material macro close-up photography,
soft white cotton or tencel fiber texture clearly visible,
delicate thin sheet material detail,
essence-soaked translucent appearance,
gentle fabric weave pattern visible,
clean white background,
second skin lightweight material visualization,
Korean sheet mask quality material showcase,
soft comfortable fabric aesthetic,
CRITICAL: NO TEXT - material texture only
`.trim(),

  VARIANT_LINEUP: `
Sheet mask variety pack flat lay arrangement photography,
multiple mask types organized by ingredient,
color-coded packaging design clearly visible,
clean organized grid or fan arrangement,
white background with ingredient accents around each packet,
Korean skincare multipack product display,
professional catalog photography style,
each variant distinguishable by color,
CRITICAL: NO TEXT NO INGREDIENT NAMES - color coding only
`.trim(),

  BENEFIT_HIGHLIGHT_1: `
Clean infographic-style background layout for sheet mask product benefits,
organized sections for benefit icons and descriptions,
soft green and white color blocks or gradient sections,
space for 3-4 benefit points with icon placeholders,
professional sheet mask ingredient benefit layout,
Korean natural skincare brand explanation style,
botanical yet clean approachable design,
clean organized visual hierarchy with leaf accents,
CRITICAL: NO TEXT NO ICONS - background layout only
`.trim(),

  INGREDIENT_TEATREE: `
Tea tree ingredient showcase photography,
fresh tea tree branch with vibrant green leaves,
essential oil droplet extraction concept visualization,
antibacterial soothing benefit concept,
clean white background with green accents,
Australian tea tree botanical illustration style,
scientific yet natural ingredient explanation,
Korean skincare ingredient benefit layout,
purifying clarifying acne-care mood,
CRITICAL: NO TEXT NO LABELS - botanical visual only
`.trim(),

  INGREDIENT_CICA: `
Centella Asiatica ingredient showcase photography,
fresh green 병풀 leaves close-up with crystal water drops,
healing soothing skin repair concept visualization,
soft green gradient background,
botanical illustration meets photography style,
skin calming barrier strengthening benefit visual,
Korean cica skincare trend aesthetic,
gentle sensitive skin care mood,
CRITICAL: NO TEXT - centella visual only
`.trim(),

  DIVIDER_VISUAL_1: `
Elegant section divider visual element,
decorative transition between sheet mask content sections,
subtle wave pattern or flowing botanical line design in green tones,
gradient color transition strip from white to soft mint,
minimal leaf ornamental accent,
Korean natural skincare beauty page design aesthetic,
smooth visual flow element with botanical touch,
thin horizontal decorative band,
CRITICAL: NO TEXT - decorative visual only
`.trim(),

  MODEL_WEARING: `
Korean female model wearing white sheet mask on face,
relaxing self-care spa moment atmosphere,
sheet mask with eye nose mouth cutouts clearly visible,
soft bathroom or bedroom setting,
natural window lighting creating serene mood,
calm peaceful skincare routine atmosphere,
model in comfortable loungewear or white robe,
K-beauty self-care lifestyle photography,
serene relaxation aesthetic,
CRITICAL: NO TEXT overlays on image
`.trim(),

  BEFORE_AFTER: `
Before and after sheet mask skincare result comparison,
split frame showing same Korean female model,
Before: dull tired dehydrated skin appearance,
After: glowing hydrated radiant skin transformation,
same professional lighting and angle for clear comparison,
visible hydration and glow transformation,
Korean skincare before/after demonstration style,
convincing product efficacy proof,
CRITICAL: NO TEXT NO LABELS - visual comparison only
`.trim(),

  KEY_MESSAGE_2: `
Elegant background for secondary key message,
soft mint to white gradient with ethereal center glow,
dreamy fresh atmosphere with subtle sparkle,
minimal geometric frames in soft green,
clean open space for impactful typography,
natural K-beauty sheet mask campaign style,
sophisticated fresh mood,
CRITICAL: NO TEXT NO LETTERS - visual background only
`.trim(),

  INGREDIENT_HONEY: `
Honey and propolis ingredient visual photography,
golden honey dipper with honey slowly dripping,
honeycomb texture as background element,
warm amber golden color palette throughout,
nourishing glowing benefit concept,
natural sweetness meets skincare aesthetic,
luxurious golden glow mood,
Korean honey mask ingredient showcase,
rich moisturizing care visualization,
CRITICAL: NO TEXT - honey visual only
`.trim(),

  INGREDIENT_HYALURONIC: `
Hyaluronic acid ingredient infographic visualization,
blue water molecule 3D structure visualization,
hydration droplets and moisture concept,
moisture-locking benefit visual representation,
clean blue and white color scheme,
scientific skincare molecule illustration,
water reservoir skin hydration diagram concept,
Korean hyaluronic acid product explanation,
refreshing hydrating dewy aesthetic,
CRITICAL: NO TEXT NO CHEMICAL FORMULAS - visual only
`.trim(),

  HOW_TO_USE: `
Step-by-step sheet mask application guide visualization,
4-step process with numbered circular badges,
Step 1 visual: Cleanse face thoroughly,
Step 2 visual: Open packet and unfold mask,
Step 3 visual: Apply mask aligning with facial features,
Step 4 visual: Remove after 15-20 minutes and pat essence,
clean instructional diagram layout,
soft mint green background,
simple iconographic illustration style,
Korean skincare routine tutorial aesthetic,
CRITICAL: NO TEXT - numbered circles and visuals only
`.trim(),

  TEXT_BANNER_2: `
Closing banner background for final text message,
elegant green to white fade gradient,
subtle botanical sparkle or light bokeh overlay effect,
minimal abstract leaf accent elements at corners,
professional Korean sheet mask brand closing aesthetic,
fresh natural spa-like mood for call-to-action,
clean composition with ample text space,
premium natural skincare marketing closing style,
CRITICAL: NO TEXT NO LETTERS - pure background only
`.trim(),

  MASK_FIT_CLOSEUP: `
Sheet mask fit on face close-up detail photography,
perfect adherence to facial contours visible,
eye area nose bridge chin fit clearly shown,
essence-soaked mask clinging seamlessly to skin,
soft lighting highlighting mask texture,
comfortable seamless fit visualization,
perfect adhesion concept demonstration,
Korean sheet mask quality showcase,
CRITICAL: NO TEXT - fit detail only
`.trim(),

  BULK_PACK: `
Sheet mask bulk pack product shot photography,
box containing multiple individual masks visible,
quantity visible showing value pack concept,
value pack economic benefit visualization,
clean professional product packaging photography,
organized stack or fan display arrangement,
Korean skincare multipack bundle deal aesthetic,
everyday affordable skincare visualization,
CRITICAL: NO TEXT NO QUANTITY NUMBERS - visual only
`.trim(),

  SAFETY_CERTIFICATION: `
Safety certification badge infographic visualization,
dermatologist tested icon placeholder,
hypoallergenic symbol visual,
mild gentle formula visualization,
EWG green grade ingredient icon shapes,
sensitive skin friendly checkmark symbols,
clean trustworthy certification layout,
Korean cosmetic safety standard display,
reliable skincare brand trust badge aesthetic,
CRITICAL: NO TEXT - badge shapes and checkmarks only
`.trim(),

  CTA_CLOSING: `
Closing banner with product and fresh ingredients,
main sheet mask packets prominently displayed,
natural botanical elements around product,
soft green to white gradient background,
CTA button space placeholder (rounded rectangle),
brand logo placement area,
fresh clean natural skincare closing design,
Korean beauty e-commerce final banner style,
compelling spa-like purchase motivation,
CRITICAL: NO TEXT - placeholder shapes only
`.trim(),
};

// ============================================
// 마스크팩 타입별 비주얼 수식어
// ============================================

const MASKPACK_TYPE_MODIFIERS: Record<MaskPackType, string> = {
  sheet_mask: 'individual foil packet, white cotton or tencel sheet, essence-soaked, facial cutouts visible',
  wash_off: 'jar or tube packaging, creamy paste texture, rinse-off application, spa treatment feel',
  peel_off: 'tube packaging, gel-to-film formula, satisfying peel removal, clear or colored gel',
  sleeping_pack: 'jar packaging, overnight treatment, gel or cream texture, pillow-friendly formula',
  modeling_pack: 'powder and activator, rubber-like setting texture, professional spa treatment',
  cream_pack: 'rich cream texture, jar packaging, intensive nourishment, leave-on or wash-off',
  gel_pack: 'transparent gel texture, cooling refreshing feel, lightweight hydration',
  mud_pack: 'earthy clay texture, deep cleansing pores, detoxifying mineral-rich',
  bubble_pack: 'foam-generating formula, playful bubbles on skin, oxygenating cleanse',
  rubber_pack: 'modeling mask that sets firm, professional spa-grade, peel-off in one piece',
};

// ============================================
// 메인 프롬프트 빌더 함수
// ============================================

/**
 * 마스크팩 섹션별 이미지 프롬프트 생성
 */
export function buildMaskPackImagePrompt(
  section: MaskPackDetailSectionType,
  options: MaskPackImagePromptOptions,
  blockIndex: number = 0
): string {
  const {
    productName,
    maskType,
    primaryIngredient,
    additionalIngredients = [],
    primaryFeature,
    brandStyle,
    visualReference,
    additionalKeywords = [],
    includeNegative = true,
  } = options;

  // 기본 섹션 프롬프트
  const basePrompt = MASKPACK_SECTION_BASE_PROMPTS[section];

  // 마스크팩 타입 수식어
  const typeModifier = MASKPACK_TYPE_MODIFIERS[maskType];

  // 주요 성분 데이터
  const ingredientData = MASK_INGREDIENT_DATA[primaryIngredient];
  const ingredientVisual = ingredientData.visual.join(', ');
  const ingredientMood = ingredientData.mood;

  // 특징 키워드
  const featureData = MASKPACK_FEATURE_KEYWORDS[primaryFeature];
  const featureVisual = featureData.visual.join(', ');

  // 추가 성분 정보
  const additionalIngredientsInfo = additionalIngredients.length > 0
    ? `additional ingredients: ${additionalIngredients.map(i => MASK_INGREDIENT_DATA[i].ko[0]).join(', ')}`
    : '';

  // 블록 변형 적용 (섹션이 없으면 기본값 사용)
  const blockVariations = MASKPACK_SECTION_BLOCKS[section];
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
    : 'Korean K-beauty sheet mask brand, natural botanical fresh';

  // 추가 키워드
  const additionalModifiers = additionalKeywords.length > 0
    ? additionalKeywords.join(', ')
    : '';

  // 프롬프트 조합 - ★ 이미지 내 텍스트 생성 금지 명시
  let prompt = `
[CRITICAL: NO TEXT IN IMAGE - Generate pure visual imagery only. Do not include any text, letters, words, numbers, labels, or typography in the image.]
[PRODUCT REFERENCE: ${productReference}]
[MASK TYPE: ${typeModifier}]
[PRIMARY INGREDIENT: ${ingredientVisual}]
[INGREDIENT MOOD: ${ingredientMood}]
[FEATURE VISUAL: ${featureVisual}]
${additionalIngredientsInfo ? `[ADDITIONAL: ${additionalIngredientsInfo}]` : ''}
[BLOCK VARIATION: ${blockModifier}]
${basePrompt}
${brandModifier}
${additionalModifiers}
professional e-commerce detail page photography, high-end sheet mask advertising, 8K resolution, fresh natural spa mood, soft green and white color scheme, clean visual without any text overlay
`.trim().replace(/\n+/g, ', ').replace(/,\s*,/g, ',');

  // 네거티브 프롬프트 - 텍스트 금지 강화
  if (includeNegative) {
    prompt += ` --negative text, letters, words, numbers, typography, Korean text, English text, Chinese text, Japanese text, any characters, logo text, brand name text, labels, captions, titles, subtitles, ingredient names, watermark, signatures, hand-written text, printed text, floating text, overlay text, embedded text, low quality, blurry, noisy, amateur, cartoon, anime, illustration, distorted product, wrong proportions, wilted plants, dried herbs, unnatural colors`;
  }

  return prompt;
}

/**
 * 전체 섹션 프롬프트 세트 생성
 */
export function buildMaskPackFullPromptSet(
  options: MaskPackImagePromptOptions
): Record<MaskPackDetailSectionType, string[]> {
  const sections: MaskPackDetailSectionType[] = [
    'BRAND_HEADER',
    'HERO_MASKPACK',
    'TEXT_BANNER_1',
    'KEY_INGREDIENTS',
    'ESSENCE_TEXTURE',
    'KEY_MESSAGE_1',
    'SHEET_MATERIAL',
    'VARIANT_LINEUP',
    'BENEFIT_HIGHLIGHT_1',
    'INGREDIENT_TEATREE',
    'INGREDIENT_CICA',
    'DIVIDER_VISUAL_1',
    'MODEL_WEARING',
    'BEFORE_AFTER',
    'KEY_MESSAGE_2',
    'INGREDIENT_HONEY',
    'INGREDIENT_HYALURONIC',
    'HOW_TO_USE',
    'TEXT_BANNER_2',
    'MASK_FIT_CLOSEUP',
    'BULK_PACK',
    'SAFETY_CERTIFICATION',
    'CTA_CLOSING',
  ];

  const result: Record<MaskPackDetailSectionType, string[]> = {} as Record<MaskPackDetailSectionType, string[]>;

  for (const section of sections) {
    const blockCount = MASKPACK_SECTION_BLOCKS[section].length;
    result[section] = [];

    for (let i = 0; i < blockCount; i++) {
      result[section].push(buildMaskPackImagePrompt(section, options, i));
    }
  }

  return result;
}

/**
 * 특정 섹션의 모든 블록 프롬프트 생성
 */
export function buildMaskPackSectionPrompts(
  section: MaskPackDetailSectionType,
  options: MaskPackImagePromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] {
  const blockVariations = MASKPACK_SECTION_BLOCKS[section];

  return blockVariations.map((block) => ({
    blockIndex: block.blockIndex,
    conceptType: block.conceptType,
    aspectRatio: block.aspectRatio,
    prompt: buildMaskPackImagePrompt(section, options, block.blockIndex),
  }));
}

// ============================================
// 마스크팩 특화 헬퍼 함수
// ============================================

/**
 * 성분별 컬러 팔레트 반환
 */
export function getIngredientColorPalette(ingredient: MaskIngredient): {
  primary: string;
  secondary: string;
  accent: string;
} {
  return MASK_INGREDIENT_DATA[ingredient].color;
}

/**
 * 성분별 비주얼 키워드 반환
 */
export function getIngredientVisualKeywords(ingredient: MaskIngredient): string[] {
  return [...MASK_INGREDIENT_DATA[ingredient].visual];
}

/**
 * 성분별 무드 반환
 */
export function getIngredientMood(ingredient: MaskIngredient): string {
  return MASK_INGREDIENT_DATA[ingredient].mood;
}

/**
 * 특정 성분 섹션 프롬프트 생성 (동적)
 */
export function buildIngredientSectionPrompt(
  ingredient: MaskIngredient,
  options: MaskPackImagePromptOptions,
  blockIndex: number = 0
): string {
  const ingredientData = MASK_INGREDIENT_DATA[ingredient];

  const basePrompt = `
${ingredientData.ko[0]} ingredient showcase photography,
${ingredientData.visual.join(', ')},
${ingredientData.mood} aesthetic mood,
${ingredientData.en.slice(1).join(', ')} benefit concept,
color palette: ${ingredientData.color.primary} primary with ${ingredientData.color.secondary} accents,
clean white or gradient background with ingredient color hints,
Korean skincare ingredient benefit visualization,
botanical meets scientific aesthetic,
CRITICAL: NO TEXT NO LABELS - visual only
`.trim();

  return buildMaskPackImagePrompt(
    'KEY_INGREDIENTS' as MaskPackDetailSectionType,
    { ...options, primaryIngredient: ingredient },
    blockIndex
  );
}

// ============================================
// Export
// ============================================

export {
  MASKPACK_SECTION_BASE_PROMPTS,
  MASKPACK_TYPE_MODIFIERS,
};
