/**
 * 섹션 템플릿 시스템
 * 올리브영 상세페이지 분석 기반 전문적인 섹션 구조 정의
 * 카테고리별 특화 프롬프트 및 다중 이미지 지원
 */

import type { SectionType, LayoutStyle } from './types';

// ============================================
// 확장된 섹션 타입 (첨부 이미지 기반)
// ============================================

export type ExtendedSectionType =
  | 'MAIN'              // 메인 썸네일 (올리브영 스타일 - 상세페이지 진입 전 제품 슬로건 이미지)
  | 'HERO'              // 메인 히어로 (제품 + 브랜드명 + 슬로건)
  | 'BRAND_CONCEPT'     // 브랜드 철학/컨셉 (감성적 메시지)
  | 'FEATURES'          // 특징 아이콘 그리드
  | 'TEXTURE'           // 제형/텍스처 클로즈업
  | 'INGREDIENT'        // 원료/성분 비주얼화
  | 'PRODUCT_LINEUP'    // 전체 구성품/라인업
  | 'SKIN_RESULT'       // 피부 결과/Before-After
  | 'MODEL_SHOT'        // 한국 여성 모델 이미지 (트렌디한 뷰티 룩)
  | 'SPECS'             // 사양/스펙 다이어그램
  | 'MATERIAL'          // 재질/성분 하이라이트 (레거시, TEXTURE+INGREDIENT로 대체)
  | 'SOCIAL_PROOF'      // 수치/신뢰 데이터 (임상 테스트)
  | 'HOW_TO_USE'        // 사용법 단계별
  | 'LIFESTYLE'         // 라이프스타일 무드샷
  | 'FAQ'               // 자주 묻는 질문
  | 'INFO_TABLE'        // 제품 정보표
  | 'CTA';              // 구매 유도/고객센터

// ============================================
// 카테고리별 특화 프롬프트 타입
// ============================================

export interface CategorySpecificPrompt {
  /** 카테고리 키워드 (매칭용) */
  categoryKeywords: string[];
  /** 특화된 이미지 프롬프트 */
  imagePrompt: string;
  /** 이미지 수 (해당 카테고리에서 권장되는 이미지 개수) */
  suggestedImageCount: number;
  /** 텍스트 오버레이 가이드 */
  overlayTextGuide: string;
}

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
  /** 기본 이미지 프롬프트 템플릿 */
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
  /** 다중 이미지 지원 여부 */
  multiImage: boolean;
  /** 최대 이미지 개수 */
  maxImageCount: number;
  /** 카테고리별 특화 프롬프트 */
  categorySpecificPrompts?: CategorySpecificPrompt[];
}

// ============================================
// 섹션 템플릿 프리셋
// 첨부 이미지 분석 기반 구조
// ============================================

export const SECTION_TEMPLATES: Record<ExtendedSectionType, SectionTemplate> = {
  // ============================================
  // MAIN: 럭셔리 에디토리얼 썸네일 스타일
  // 고급스러운 오브제와 함께 배치된 프리미엄 제품 이미지
  // ============================================
  MAIN: {
    type: 'MAIN',
    name: '메인 썸네일',
    purpose: '상세페이지 진입 전 첫인상 - 럭셔리 매거진 스타일 프리미엄 제품 썸네일',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `LUXURIOUS editorial product photography for premium e-commerce thumbnail.

[CRITICAL - PRODUCT DOMINANCE 제품이 반드시 주인공]
- Product "{product}" MUST BE THE DOMINANT HERO - largest element, 50-60% of frame
- Product centered or slightly off-center with crystal clear sharp focus
- Product details, texture, and design must be prominently visible
- HIERARCHY: Product = 100% visual focus, decorative objects = subtle 20-30% supporting role

[COMPOSITION - 럭셔리 스틸라이프 구도]
- Product elevated on marble pedestal, glass platform, or natural stone
- Clean negative space for text overlay (top 20%, left side 30%)
- Sophisticated still life arrangement where product commands attention

[SUPPORTING DECORATIVE OBJECTS - 보조 오브제 (작은 스케일로 배경/측면에)]
- Silk fabric subtle draping in soft complementary colors (background)
- Scattered flower petals (rose, peony) at base, NOT covering product
- Gold leaf accents as tiny highlights in corners
- Crystal prism creating rainbow light effects at edge of frame
- Natural marble or stone slab as elegant base
- Delicate dried botanicals (eucalyptus, lavender) framing the scene
- Objects must COMPLEMENT not COMPETE with product

[BACKGROUND - 텍스처드 럭셔리]
- Rich textured background with subtle gradient
- Deep jewel tones OR soft neutral palette ({background})
- Artistic shadow play from natural window light
- High-end fashion magazine studio backdrop

[LIGHTING - 드라마틱 스튜디오]
- Dramatic studio lighting EMPHASIZING PRODUCT with brightest light on product
- Soft shadows on decorative props (secondary)
- Rim lighting creating elegant product silhouette
- Professional beauty campaign lighting setup
- Subtle reflections and highlights on product surface

[STYLE]
- Vogue / Harper's Bazaar beauty editorial aesthetic
- High-end fashion magazine quality
- Luxe lifestyle photography that makes viewers want to purchase
- Sophisticated, aspirational, desirable mood
- Premium cosmetic brand campaign style

[TECHNICAL]
- 8K resolution, photorealistic
- Professional commercial photography
- Absolutely NO text, NO typography, NO letters
- Text-free image only`,
    requiredVisuals: ['product-hero', 'luxury-backdrop', 'decorative-objects', 'elevated-platform'],
    optionalVisuals: ['silk-fabric', 'flower-petals', 'gold-accents', 'crystal-prism', 'marble-stone', 'dried-botanicals', 'water-droplets'],
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
    multiImage: false,
    maxImageCount: 1,
  },

  HERO: {
    type: 'HERO',
    name: '히어로 섹션',
    purpose: '첫인상 - 제품과 브랜드 아이덴티티를 미니멀하게 보여주는 메인 이미지',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Minimal hero product photography for Korean e-commerce detail page.

[COMPOSITION]
- Product "{product}" centered, clean and simple
- Single product focus (no cluttered arrangement)
- Ample white space for text overlay (top 25%, bottom 20%)
- Straight-on or slight angle, not dramatic

[BACKGROUND]
- Solid color or subtle gradient: beige, cream, white, soft gray
- {background} tones matching brand identity
- NO busy patterns, NO dramatic gradients

[STYLE]
- Korean beauty detail page aesthetic (Olive Young, hince, Innisfree style)
- Minimal, clean, sophisticated
- Soft natural lighting, gentle shadows
- Product as hero, nothing else competing

[IMPORTANT]
- NO text burned into image
- NO watermarks or logos in image
- Leave clean space for Korean text overlay`,
    requiredVisuals: ['product-centered', 'clean-background', 'text-space-top', 'text-space-bottom'],
    optionalVisuals: ['subtle-shadow', 'minimal-props'],
    textOverlay: {
      headline: true,      // 브랜드명
      subheadline: true,   // 제품명 + 슬로건
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 0,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Minimal cushion/foundation hero. Single compact case, clean beige or cream background. Simple, elegant, Korean beauty aesthetic. Soft lighting. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + 호수',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Minimal lip product hero. Single lip product standing upright, soft pink or nude background. Clean, feminine Korean beauty aesthetic. Soft lighting. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + 컬러명',
      },
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Minimal skincare hero. Single bottle/jar centered, white or soft beige background. Clean Korean skincare aesthetic. Natural soft lighting. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + 용량',
      },
      {
        categoryKeywords: ['선케어', '선크림', '자외선'],
        imagePrompt: `Minimal suncare hero. Single sunscreen product, bright clean white or soft yellow background. Fresh, clean aesthetic. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + SPF/PA',
      },
    ],
  },

  BRAND_CONCEPT: {
    type: 'BRAND_CONCEPT',
    name: '브랜드 컨셉',
    purpose: '브랜드의 핵심 철학과 제품 컨셉을 감성적으로 전달하는 무드 이미지',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Brand concept mood image for Korean beauty detail page.

[COMPOSITION]
- Abstract or atmospheric background image
- NO product or minimal product hint (edge, shadow only)
- Large empty space for brand philosophy text (60-70% of image)
- Centered or left-aligned text area

[BACKGROUND OPTIONS]
- Soft texture: fabric, paper, natural material
- Nature element: water ripple, sand, leaves (subtle)
- Solid gradient: cream to beige, white to gray
- {background} tones

[STYLE]
- Editorial magazine aesthetic
- Minimal, poetic, emotional
- Korean beauty brand lookbook style
- Calming, aspirational mood

[IMPORTANT]
- This is for TEXT OVERLAY - leave ample clean space
- NO product focus (that's HERO section's job)
- NO text burned into image`,
    requiredVisuals: ['mood-background', 'large-text-space', 'minimal-elements'],
    optionalVisuals: ['texture-detail', 'nature-hint', 'abstract-shape'],
    textOverlay: {
      headline: true,      // 브랜드 철학 (예: "The Ordinary Skin")
      subheadline: true,   // 부가 설명
      body: true,          // 브랜드 스토리 (선택)
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 1,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Skincare brand concept mood. Soft water texture or dewy surface, cream/white gradient. Minimal, clean, Korean skincare philosophy aesthetic. Large text space. No product, no text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '브랜드 철학 문구 (예: "피부 본연의 아름다움", "The Ordinary Skin")',
      },
      {
        categoryKeywords: ['립', '틴트', '메이크업', '쿠션'],
        imagePrompt: `Makeup brand concept mood. Soft fabric texture or abstract color gradient (rose, nude, beige). Feminine, elegant Korean beauty aesthetic. Large text space. No product, no text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '브랜드 철학 문구 (예: "자연스러운 아름다움", "Your True Color")',
      },
    ],
  },

  FEATURES: {
    type: 'FEATURES',
    name: '특징/발색 섹션',
    purpose: '제품의 핵심 특징, 색상 바리에이션, 발색 테스트 등을 개별 블록 이미지로 상세히 보여주기',
    recommendedLayout: 'grid',
    imagePromptTemplate: `Korean beauty detail page - Feature block image.

[BLOCK IMAGE RULE]
- ONE image = ONE feature/shade
- Each block is SEPARATE image in detail page grid
- Clean composition for single feature focus

[COMPOSITION]
- Feature "{product}" as single focus
- Clean solid {background} background (beige, cream, white)
- Text overlay space: bottom 20% OR right side 30%
- Simple, not cluttered

[STYLE]
- Korean e-commerce detail page aesthetic
- Olive Young / hince style
- Soft natural lighting
- Trendy, clean, minimal

[MUST INCLUDE]
- NO text in image
- NO watermarks
- Space for Korean text overlay`,
    requiredVisuals: ['single-feature-focus', 'clean-background', 'text-overlay-space'],
    optionalVisuals: ['swatch-display', 'comparison-elements'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 2,
    multiImage: true,
    maxImageCount: 8,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation SHADE SWATCH block image for Korean beauty detail page.

[ONE BLOCK = ONE SHADE NUMBER]
Generate SEPARATE image for each shade:
- #13 Ivory (밝은 피부)
- #17 Light Beige (밝은 피부~보통 피부)
- #21 Natural Beige (보통 피부) - 가장 인기
- #23 Medium Beige (보통~어두운 피부)
- #25 Warm Beige (어두운 피부)

[THIS IMAGE SHOWS]
Korean female model's inner forearm with ONE shade swatch.
Horizontal stripe swatch showing:
- True color on skin
- Texture (dewy/semi-matte/natural)
- Coverage level

[COMPOSITION]
- Forearm from wrist to elbow, angled
- Single swatch stripe in center
- Clean cream/beige background
- Bottom 25% empty for shade number text

[STYLE]
- Korean beauty swatch test aesthetic
- Soft daylight lighting
- Natural healthy skin
- Professional beauty photography

[KEYWORDS: 커버력, 지속력, 자연스러움, 피부 표현]

NO text in image.`,
        suggestedImageCount: 5,
        overlayTextGuide: '각 블록: #21 내추럴베이지 / 보통 피부톤에 추천 / 자연스러운 피부 표현',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip COLOR SWATCH block image for Korean beauty detail page.

[ONE BLOCK = ONE COLOR]
Generate SEPARATE image for each shade:
- Each lip color = individual block image
- Show on actual Korean model lips

[THIS IMAGE SHOWS]
Close-up of Korean female model's lips with product applied.
- Full lip or gradient lip application
- Color payoff clearly visible
- Texture visible (glossy/velvet/matte)

[COMPOSITION]
- Lip close-up, chin to nose bottom
- Lips centered
- Clean soft pink or nude background
- Side 30% empty for color name text

[STYLE]
- Korean beauty lip swatch aesthetic
- Soft ring light effect
- Plump, healthy looking lips
- Trendy K-beauty gradient lip or full lip

[KEYWORDS: 선명한 발색, 착색력, 생기, 지속력, 촉촉함]

NO text in image.`,
        suggestedImageCount: 6,
        overlayTextGuide: '각 블록: #01 피그무드 / 웜톤 MLBB 컬러 / 데일리 추천',
      },
      {
        categoryKeywords: ['아이섀도우', '아이메이크업', '팔레트'],
        imagePrompt: `Eyeshadow SWATCH block images for Korean beauty detail page.

[BLOCK IMAGES TO GENERATE]
1. PALETTE OPEN: Full palette showing all shade pans
2. ARM SWATCHES: All shades swatched in row on forearm
3. EYE LOOK: Korean model eye with shades applied

[COMPOSITION]
- Each image clean and focused
- Cream/white background
- Text space at bottom 20%

[STYLE]
- Korean beauty eye makeup aesthetic
- Soft lighting showing true pigment
- Matte/shimmer/glitter textures clear

[KEYWORDS: 발색, 지속력, 블렌딩, 다양한 연출]

NO text in image.`,
        suggestedImageCount: 4,
        overlayTextGuide: '팔레트 구성 / 각 컬러명 / 연출 가능한 룩',
      },
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Skincare BENEFIT block images for Korean beauty detail page.

[BLOCK IMAGES - One benefit per block]
Generate separate images for each benefit:

1. 보습/수분 BLOCK:
- Water droplets or dewy skin close-up
- Hydration visual metaphor
- Fresh, moisturized skin texture

2. 흡수력 BLOCK:
- Before/after absorption on skin
- Light texture sinking into skin
- Quick absorption demonstration

3. 진정 BLOCK:
- Calm, soothed skin visual
- Green/cool tones
- Sensitive skin friendly concept

4. 광채/탄력 BLOCK:
- Glowing, radiant skin close-up
- Light reflecting off healthy skin
- Bouncy, firm skin visual

[COMPOSITION]
- Single benefit focus per image
- Clean white/cream/soft blue background
- Right side 30% empty for benefit text

[STYLE]
- Korean skincare detail page aesthetic
- Soft, clinical yet beautiful lighting
- Scientific but approachable

[KEYWORDS: 보습, 수분, 진정, 탄력, 광채, 흡수력]

NO text in image.`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 블록: 48시간 깊은 보습 / 피부 수분량 92% 증가 / 임상 테스트 완료',
      },
      {
        categoryKeywords: ['마스카라', '아이라이너'],
        imagePrompt: `Eye makeup BEFORE-AFTER block images for Korean beauty detail page.

[BLOCK IMAGES]
1. BEFORE-AFTER BLOCK:
- Split or side-by-side comparison
- Bare lashes vs. product applied
- Volume/length/curl difference clear

2. BRUSH DETAIL BLOCK:
- Brush or tip close-up
- Show bristle/tip design

3. WEAR TEST BLOCK:
- After 8-12 hours wear
- No smudge, no flaking proof

[COMPOSITION]
- Korean female model eye close-up
- Clean background
- Bottom 20% for text

[STYLE]
- Dramatic yet natural enhancement
- Korean beauty aesthetic

[KEYWORDS: 볼륨, 길이, 컬링, 번짐 없는, 지속력]

NO text in image.`,
        suggestedImageCount: 3,
        overlayTextGuide: 'BEFORE → AFTER / 3배 볼륨업 / 12시간 컬링 지속',
      },
      {
        categoryKeywords: ['선케어', '선크림', '자외선'],
        imagePrompt: `Suncare BENEFIT block images for Korean beauty detail page.

[BLOCK IMAGES]
1. UV PROTECTION BLOCK:
- UV shield/protection visual concept
- Sun rays being blocked metaphor

2. NO WHITE CAST BLOCK:
- Before/after showing no white residue
- Natural skin tone maintained

3. TONE UP BLOCK:
- Skin brightening effect
- Natural glow, not artificial

4. TEXTURE BLOCK:
- Light, non-greasy texture on skin
- Quick absorption demonstration

[COMPOSITION]
- Clean bright background (white/soft yellow)
- Text space at bottom 25%

[STYLE]
- Fresh, sunny, protective feeling
- Korean suncare aesthetic

[KEYWORDS: 자외선 차단, 백탁 없는, 촉촉한, 톤업, 가벼운]

NO text in image.`,
        suggestedImageCount: 4,
        overlayTextGuide: 'SPF50+ PA++++ / 무백탁 포뮬러 / 자연스러운 톤업',
      },
    ],
  },

  TEXTURE: {
    type: 'TEXTURE',
    name: '텍스처/제형 섹션',
    purpose: '제품의 제형과 발림성을 직관적으로 보여주는 클로즈업 이미지',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Product texture close-up photography for Korean beauty detail page.

[COMPOSITION]
- Macro/close-up shot of product texture
- Texture on surface: glass, skin, or neutral material
- Clean, simple composition focusing on texture only
- Space for descriptive text overlay

[TEXTURE TYPES]
- Cream: swirl, dollop, or spread
- Serum/Essence: drops, drip, or puddle
- Gel: clear, jiggly texture
- Oil: golden drops, glossy surface
- Lotion: light, fluid spread

[BACKGROUND]
- {background} tones (cream, white, soft beige)
- Neutral surface (glass, marble, skin)
- Soft, even lighting

[STYLE]
- Korean beauty texture shot aesthetic
- Clean, minimal, tactile appeal
- Focus on consistency and feel
- No text in image`,
    requiredVisuals: ['texture-closeup', 'clean-surface', 'text-space'],
    optionalVisuals: ['skin-application', 'glass-surface', 'product-hint'],
    textOverlay: {
      headline: true,      // 텍스처 특징 (예: "부드러운 크림 제형")
      subheadline: true,   // 부가 설명
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 3,
    multiImage: true,
    maxImageCount: 2,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '앰플'],
        imagePrompt: `Serum/essence texture close-up. Clear or slightly tinted liquid drops on glass surface or skin. Show viscosity and consistency. Soft lighting, white/cream background. Korean skincare aesthetic. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '제형 특징 (예: "가벼운 워터 텍스처", "빠른 흡수력")',
      },
      {
        categoryKeywords: ['크림', '로션', '모이스처라이저'],
        imagePrompt: `Cream/lotion texture close-up. Smooth cream swirl or dollop on neutral surface. Show rich, moisturizing texture. Soft lighting, beige/cream background. Korean skincare aesthetic. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '제형 특징 (예: "촉촉한 크림 제형", "산뜻한 마무리감")',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip product texture close-up. Product swatch showing color and finish (glossy, matte, velvet). On glass or lip-like surface. Korean beauty lip aesthetic. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '제형 특징 (예: "벨벳 마무리", "글로시 텍스처")',
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스'],
        imagePrompt: `Foundation/cushion texture close-up. Product spread showing coverage and finish. On skin or neutral surface. Show blendability. Korean beauty base makeup aesthetic. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '제형 특징 (예: "자연스러운 피부 표현", "가벼운 밀착력")',
      },
    ],
  },

  INGREDIENT: {
    type: 'INGREDIENT',
    name: '성분 비주얼 섹션',
    purpose: '핵심 성분의 원료를 자연스럽고 신선하게 시각화',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `Natural ingredient visualization for Korean beauty detail page.

[COMPOSITION]
- Fresh, natural ingredient as hero element
- Real ingredient visual: plants, fruits, flowers, herbs
- Product bottle/jar as secondary element (optional)
- Clean arrangement, not cluttered
- Space for ingredient name and benefit text

[INGREDIENT STYLING]
- Fresh, vibrant, appetizing appearance
- Natural lighting with soft shadows
- Dewy, just-picked freshness
- Artistic but realistic presentation

[BACKGROUND]
- {background} tones (white, cream, light natural)
- Simple surface (marble, wood, fabric)
- Nature-inspired but clean

[STYLE]
- Korean beauty ingredient shot aesthetic
- Natural, clean, trustworthy
- Editorial food/beauty photography style
- No text in image`,
    requiredVisuals: ['ingredient-hero', 'fresh-appearance', 'text-space'],
    optionalVisuals: ['product-placement', 'multiple-ingredients', 'nature-setting'],
    textOverlay: {
      headline: true,      // 성분명 (예: "히알루론산")
      subheadline: true,   // 효능 설명
      body: false,
      bullets: true,       // 성분 효능 리스트
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 4,
    multiImage: true,
    maxImageCount: 3,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Skincare ingredient visualization. Fresh natural ingredients (centella leaves, citrus for vitamin C, water drops for hyaluronic acid, aloe). Clean white/cream background. Korean skincare natural aesthetic. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '성분명 + 효능 (예: "병풀 추출물 - 진정 효과", "히알루론산 - 깊은 보습")',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `Lip product ingredient visualization. Fresh fruits or flowers matching shade name (fig, cherry, rose, peach). Artistic arrangement with lip product hint. Soft pink/nude background. No text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '성분명 + 효능 (예: "무화과 추출물", "시어버터 보습")',
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Suncare ingredient visualization. Clean, scientific aesthetic. Water drops, protective shield concept, or natural UV-blocking ingredients. Bright, fresh background. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '성분명 + 효능 (예: "자외선 차단 필터", "진정 성분")',
      },
    ],
  },

  PRODUCT_LINEUP: {
    type: 'PRODUCT_LINEUP',
    name: '제품 라인업 섹션',
    purpose: '전체 구성품이나 시리즈 제품을 한눈에 보여주는 배열 이미지',
    recommendedLayout: 'grid',
    imagePromptTemplate: `Product lineup/collection photography for Korean beauty detail page.

[COMPOSITION]
- All products in the set/collection arranged together
- Organized layout: row, grid, or size-graduated arrangement
- Each product clearly visible and identifiable
- Even spacing between products
- Space for product name labels

[ARRANGEMENT OPTIONS]
- Size order: smallest to largest
- Usage order: step 1, 2, 3...
- Color gradient: light to dark
- Symmetrical or balanced asymmetry

[BACKGROUND]
- {background} tones (white, cream, soft gray)
- Clean, flat surface
- Consistent with brand aesthetic

[STYLE]
- Korean beauty product flat-lay aesthetic
- Organized, clean, professional
- Catalog/editorial style
- No text in image`,
    requiredVisuals: ['all-products', 'organized-layout', 'consistent-spacing'],
    optionalVisuals: ['product-labels-space', 'usage-order-hint', 'size-comparison'],
    textOverlay: {
      headline: true,      // 라인업 타이틀 (예: "풀 라인업 구성")
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,       // 제품 번호/순서
      icons: false,
    },
    generateImage: true,
    defaultOrder: 5,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Skincare routine lineup. Multiple products arranged by usage order (toner, essence, serum, cream). Clean row or step arrangement. White/cream background. Korean skincare set aesthetic. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '각 제품명 + 용량 또는 STEP 번호',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `Lip product color lineup. Multiple shades arranged in color gradient or fan formation. Clean, elegant arrangement. Soft pink/nude background. Korean beauty lip collection aesthetic. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '각 컬러명 또는 번호',
      },
      {
        categoryKeywords: ['메이크업', '쿠션', '파운데이션'],
        imagePrompt: `Makeup product lineup. Base products or collection items arranged neatly. Clean, professional arrangement. Beige/cream background. Korean beauty makeup set aesthetic. No text in image.`,
        suggestedImageCount: 1,
        overlayTextGuide: '각 제품명 또는 호수',
      },
    ],
  },

  SKIN_RESULT: {
    type: 'SKIN_RESULT',
    name: '피부 결과 섹션',
    purpose: '제품 사용 전후 피부 변화를 직접적으로 보여주는 Before/After 이미지',
    recommendedLayout: 'comparison',
    imagePromptTemplate: `BEFORE/AFTER skin result for Korean beauty detail page.

[BEFORE-AFTER FORMAT]
- Split image OR side-by-side comparison
- SAME lighting, angle, and distance for both
- Clear, visible difference between before and after
- Natural, believable improvement (not over-edited)

[COMPOSITION]
- Skin close-up (cheek, forehead, or full face)
- Clean neutral background
- Text space: bottom 25% for result statistics
- Equal space for BEFORE and AFTER

[STYLE]
- Korean beauty before-after aesthetic
- Clinical yet beautiful
- Believable, aspirational results
- Professional skin photography

[MUST INCLUDE]
- NO text in image
- Space for "BEFORE / AFTER" label overlay
- Space for percentage/statistics overlay`,
    requiredVisuals: ['before-after-comparison', 'skin-closeup', 'consistent-lighting'],
    optionalVisuals: ['statistics-space', 'timeline-indicator'],
    textOverlay: {
      headline: true,      // "BEFORE → AFTER" 또는 "4주 사용 결과"
      subheadline: true,   // 구체적 수치
      body: false,
      bullets: true,       // 개선 항목 리스트
      numbers: true,       // 퍼센트 수치
      icons: false,
    },
    generateImage: true,
    defaultOrder: 6,
    multiImage: true,
    maxImageCount: 3,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Skincare BEFORE-AFTER result for Korean beauty detail page.

[BEFORE-AFTER IMAGES]
Generate comparison images showing:

1. 보습/수분 BEFORE-AFTER:
BEFORE: Dry, dull skin with visible flakiness
AFTER: Hydrated, dewy, plump skin
- Same Korean model cheek close-up
- Consistent lighting and angle
- Clear moisture improvement visible

2. 피부결 BEFORE-AFTER:
BEFORE: Rough texture, visible pores, uneven
AFTER: Smooth, refined texture, minimized pores
- Skin texture clearly visible in both
- Natural improvement, not plastic

3. 광채/톤 BEFORE-AFTER:
BEFORE: Dull, tired-looking skin
AFTER: Radiant, glowing, bright skin
- Light reflecting off healthy skin
- Natural brightness, not filtered

[COMPOSITION]
- Split screen or side-by-side
- Korean model skin
- Cream/white background
- Bottom 25% for statistics text

[STYLE]
- Korean skincare result aesthetic
- Clinical lighting (even, consistent)
- Natural, believable improvement
- Professional dermatology style

[KEYWORDS: 보습, 수분, 광채, 탄력, 피부결 개선]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 4주 사용 결과 / 수분량 92% 증가 / 피부결 개선 89%',
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation BEFORE-AFTER coverage result for Korean beauty detail page.

[BEFORE-AFTER IMAGES]
1. 커버력 BEFORE-AFTER:
BEFORE: Bare skin with redness, blemishes, dark spots visible
AFTER: Natural coverage, skin looks even and healthy
- Same face/cheek area
- Product creating natural "your skin but better" look

2. 지속력 BEFORE-AFTER:
BEFORE: Fresh application at 0 hour
AFTER: After 8-12 hours wear
- Still looks fresh, not cakey or separated
- Natural finish maintained

[COMPOSITION]
- Korean model face
- Split or side-by-side comparison
- Soft beige background
- Space for time/coverage statistics

[STYLE]
- Korean base makeup result aesthetic
- Natural coverage visible
- Skin texture still visible through makeup
- Professional beauty photography

[KEYWORDS: 커버력, 지속력, 자연스러움, 피부 표현, 무너짐 없는]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 자연스러운 커버력 / 12시간 지속력 테스트',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `Lip product BEFORE-AFTER result for Korean beauty detail page.

[BEFORE-AFTER IMAGES]
1. 발색 BEFORE-AFTER:
BEFORE: Bare lips
AFTER: Product applied with full color payoff
- Close-up lip shot
- Color and texture clearly visible

2. 지속력 BEFORE-AFTER:
BEFORE: Fresh application
AFTER: After eating/drinking/hours of wear
- Color retention visible
- No feathering or fading

[COMPOSITION]
- Korean model lips close-up
- Pink/nude background
- Space for wear time statistics

[STYLE]
- Korean lip product result aesthetic
- Natural, healthy lip texture
- Trendy K-beauty lip look

[KEYWORDS: 발색, 지속력, 착색력, 촉촉함]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 선명한 발색 / 8시간 지속력',
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Suncare BEFORE-AFTER result for Korean beauty detail page.

[BEFORE-AFTER IMAGES]
1. 백탁 테스트 BEFORE-AFTER:
BEFORE: Product application moment
AFTER: Fully absorbed, no white cast
- Same skin area
- Natural skin tone visible after

2. 톤업 효과 BEFORE-AFTER:
BEFORE: Bare skin tone
AFTER: Brightened, even skin tone
- Natural glow, not chalky

[COMPOSITION]
- Korean model skin
- Bright clean background
- Space for SPF/PA rating

[STYLE]
- Korean suncare result aesthetic
- Fresh, natural finish
- No white residue visible

[KEYWORDS: 무백탁, 톤업, 자연스러운, 가벼운]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 무백탁 포뮬러 / 자연스러운 톤업',
      },
    ],
  },

  MODEL_SHOT: {
    type: 'MODEL_SHOT',
    name: '모델 이미지 섹션',
    purpose: '한국 여성 모델의 트렌디한 뷰티 룩으로 제품 사용감과 분위기를 전달',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Korean female model beauty shot for detail page.

[MODEL SPECIFICATION]
- Korean female model, 20s-30s
- Clear, healthy skin
- Natural beauty, not over-edited
- Trendy K-beauty makeup look

[COMPOSITION]
- Portrait or half-body shot
- Product usage visible (if applicable)
- Clean {background} background
- Text space: side 25% OR bottom 20%

[STYLE]
- Korean beauty editorial aesthetic
- hince, Romand, Innisfree style
- Soft, flattering lighting
- Aspirational yet relatable

[MUST INCLUDE]
- NO text in image
- NO watermarks
- Natural, healthy appearance
- Trendy Korean beauty aesthetic`,
    requiredVisuals: ['korean-model', 'beauty-look', 'clean-background', 'text-space'],
    optionalVisuals: ['product-in-shot', 'close-up-detail', 'lifestyle-context'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: false,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 7,
    multiImage: true,
    maxImageCount: 3,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '로션'],
        imagePrompt: `Korean female model SKINCARE beauty shot for detail page.

[MODEL]
- Korean female, 20s-30s
- Glowing, dewy skin (촉촉한 광채 피부)
- Natural no-makeup or minimal makeup look
- Healthy, hydrated skin appearance

[SHOTS TO GENERATE]
1. FACE CLOSE-UP:
   - Cheek/face showing dewy, glowing skin
   - Natural light highlighting skin quality
   - Soft focus on skin texture

2. HALF PORTRAIT:
   - Model touching face gently
   - Serene, relaxed expression
   - Skincare routine feeling

3. PRODUCT USAGE (optional):
   - Model applying product
   - Dropper/pump dispensing scene

[COMPOSITION]
- Soft cream/white/light blue background
- Side or bottom space for text (25-30%)
- Editorial beauty photography style

[STYLE]
- Korean skincare brand aesthetic (hince, Innisfree)
- Dewy, healthy, natural skin
- Soft, flattering lighting
- "Glass skin" or "honey skin" concept

[KEYWORDS: 보습, 광채, 촉촉, 건강한 피부]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '피부 컨셉 문구 (예: "매일 아침 빛나는 피부", "촉촉함이 오래가는")',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Korean female model LIP beauty shot for detail page.

[MODEL]
- Korean female, 20s-30s
- Beautiful lip shape
- Trendy K-beauty lip makeup
- Natural, healthy appearance

[SHOTS TO GENERATE]
1. LIP FOCUS PORTRAIT:
   - Lower face focus (nose to chin)
   - Lips with product applied
   - Color payoff clearly visible

2. FULL FACE BEAUTY:
   - Full face with lip product as focus
   - Coordinated eye makeup
   - Trendy K-beauty look

3. PROFILE/ANGLE SHOT:
   - Side or 3/4 angle
   - Lip shape and color visible
   - Editorial beauty vibe

[COMPOSITION]
- Soft pink/nude/cream background
- Text space on side (30%)
- Beauty photography lighting

[STYLE]
- Korean lip brand aesthetic (Romand, Peripera)
- Gradient lip or full lip application
- Plump, healthy lips
- Trendy, youthful vibe

[KEYWORDS: 발색, 생기, 촉촉함, 지속력]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '립 컨셉 문구 (예: "생기 가득한 입술", "트렌디한 데일리 립")',
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Korean female model BASE MAKEUP beauty shot for detail page.

[MODEL]
- Korean female, 20s-30s
- Flawless base makeup appearance
- Natural, skin-like finish
- Not cakey or heavy looking

[SHOTS TO GENERATE]
1. SKIN CLOSE-UP:
   - Cheek/face showing base makeup finish
   - Dewy or semi-matte finish visible
   - Pores minimized but natural

2. FULL FACE BEAUTY:
   - Complete makeup look
   - Base as star, other makeup minimal
   - "Your skin but better" concept

3. BEFORE-AFTER FEEL:
   - Natural, perfected skin appearance
   - Coverage visible but natural

[COMPOSITION]
- Soft beige/cream background
- Editorial beauty lighting
- Text space at bottom 25%

[STYLE]
- Korean base makeup aesthetic
- Natural, skin-like coverage
- "Glass skin" or "Chok-chok" finish
- Professional beauty photography

[KEYWORDS: 커버력, 지속력, 자연스러움, 피부 표현]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '베이스 컨셉 문구 (예: "마치 피부처럼", "하루 종일 무너짐 없이")',
      },
      {
        categoryKeywords: ['아이메이크업', '아이섀도우', '마스카라'],
        imagePrompt: `Korean female model EYE MAKEUP beauty shot for detail page.

[MODEL]
- Korean female, 20s-30s
- Beautiful eye shape
- Trendy K-beauty eye makeup
- Various eye looks

[SHOTS TO GENERATE]
1. EYE CLOSE-UP:
   - Eye area focus
   - Eyeshadow/mascara visible
   - Color payoff and blending clear

2. HALF FACE:
   - Eyes as focus, lips minimal
   - Showing complete eye look
   - Different angles

[COMPOSITION]
- Neutral/cream background
- Close-up beauty photography
- Text space at side 30%

[STYLE]
- Korean eye makeup aesthetic
- Natural to glam looks
- Soft, flattering lighting
- Trendy eye makeup trends

[KEYWORDS: 발색, 블렌딩, 지속력, 다양한 연출]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '아이 컨셉 문구 (예: "다양한 무드 연출", "선명한 발색")',
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Korean female model SUNCARE beauty shot for detail page.

[MODEL]
- Korean female, 20s-30s
- Fresh, healthy appearance
- Outdoor-ready or sun-protected feeling
- Natural glow

[SHOTS TO GENERATE]
1. FRESH FACE:
   - Bright, protected skin look
   - No white cast visible
   - Tone-up effect if applicable

2. OUTDOOR VIBE:
   - Sunny, fresh feeling
   - Model in bright setting
   - Confident, protected appearance

[COMPOSITION]
- Bright white/yellow-tinted background
- Fresh, sunny atmosphere
- Text space at bottom 25%

[STYLE]
- Korean suncare aesthetic
- Fresh, healthy, protected
- Bright, energetic mood

[KEYWORDS: 자외선 차단, 톤업, 촉촉한, 가벼운]

NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: '선케어 컨셉 문구 (예: "자외선 걱정 없이", "매일의 피부 보호")',
      },
    ],
  },

  SPECS: {
    type: 'SPECS',
    name: '사양 다이어그램',
    purpose: '제품 크기, 치수, 상세 사양을 시각적으로 명확하게 전달 - 구매 결정에 필요한 정보 제공',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `Premium PRODUCT SPECIFICATIONS photography for Korean e-commerce detail page.

[COMPOSITION - Technical Yet Beautiful]
- "{product}" displayed at optimal angle showing full dimensions
- Clean {background} gradient background (light gray to white)
- Product positioned with breathing room for measurement annotations
- Clear visual hierarchy: Product as hero, specs as supporting info

[LAYOUT FOR SPECS OVERLAY - Korean Detail Page Style]
- LEFT 40%: Product image, slightly angled to show depth
- RIGHT 60%: Large clean space for specification table
- Clean horizontal divider line between product and specs area
- Grid-ready layout for measurement data

[VISUAL SPEC ELEMENTS - Space for Overlay]
- Subtle dotted/dashed indicator lines pointing to key dimensions
- Small arrow heads at measurement points
- Clean measurement label areas (height, width, depth, weight)
- Comparison size reference area (vs. hand, vs. common object)

[PRODUCT ANGLES]
- Main angle: 3/4 view showing length, width, depth
- Optional inset: Top-down view for footprint size
- Optional inset: Side profile for height

[STYLE]
- Technical drawing meets premium product photography
- Clean, professional, trustworthy aesthetic
- Korean beauty/tech detail page specification style
- Minimalist with purposeful measurement indicators

[QUALITY]
- 8K resolution, sharp product details visible
- Even studio lighting, no harsh shadows
- Clean edges for dimension line overlay
- No text in image - measurements added as overlay`,
    requiredVisuals: ['product-multi-angle', 'dimension-indicator-space', 'measurement-areas', 'clean-background'],
    optionalVisuals: ['scale-reference', 'cutaway-view', 'comparison-object', 'top-view-inset'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: true,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 2,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플'],
        imagePrompt: `Skincare SPECS photography for Korean beauty detail page.

[PRODUCT DISPLAY]
- "{product}" bottle/jar/tube displayed elegantly
- Show product volume indicator (ml/g)
- Clean minimal background with soft gradient

[SPEC VISUALIZATION AREAS]
- Height: Product standing upright, vertical measurement space
- Width: Horizontal measurement at widest point
- Net Content: ml/g indicator area near product
- Comparison: Small hand silhouette for size reference

[SKINCARE-SPECIFIC INFO AREAS]
- Usage period indication (개월 분량)
- Daily usage amount visualization
- Dropper/pump dispense amount area

[STYLE]
- Clean, clinical yet luxurious
- Trustworthy specification aesthetic
- Korean skincare detail page style

[QUALITY]
- 8K, product details crisp and clear
- No text - all specs as overlay`,
        suggestedImageCount: 1,
        overlayTextGuide: `제품 사양:
- 용량: 50ml / 30ml
- 크기: 높이 OOcm x 가로 OOcm
- 사용 기간: 약 2개월 분량
- 1회 사용량: 스포이드 1회 (약 0.5ml)`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip product SPECS photography for Korean beauty detail page.

[PRODUCT DISPLAY]
- "{product}" displayed both closed and open
- Show applicator tip detail
- Clean minimal background

[SPEC VISUALIZATION]
- Closed product dimensions
- Open product showing applicator length
- Applicator tip close-up for texture reference

[LIP-SPECIFIC INFO AREAS]
- Total product weight
- Net content (g/ml)
- Applicator type indicator

[STYLE]
- Feminine yet informative
- Korean lip product detail page aesthetic

[QUALITY]
- 8K, applicator details visible
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `제품 사양:
- 용량: 3.5g
- 크기: 높이 OOcm
- 어플리케이터: 퍼지팁/도우풋
- 발림성: 부드러움`,
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업', '팩트'],
        imagePrompt: `Cushion/Foundation SPECS photography for Korean beauty detail page.

[PRODUCT DISPLAY]
- "{product}" compact shown closed and open
- Puff/applicator displayed alongside
- Refill compatibility indicator area

[SPEC VISUALIZATION]
- Compact dimensions (closed)
- Mirror size when open
- Puff dimensions

[CUSHION-SPECIFIC INFO AREAS]
- Net content (g)
- SPF/PA indicator area
- Shade range indicator
- Refill availability

[STYLE]
- Premium compact product aesthetic
- Korean cushion detail page style

[QUALITY]
- 8K, compact details crisp
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `제품 사양:
- 용량: 본품 15g + 리필 15g
- 크기: 직경 OOcm x 높이 OOcm
- SPF50+ PA++++
- 리필 구매 가능`,
      },
    ],
  },

  MATERIAL: {
    type: 'MATERIAL',
    name: '성분/재질 하이라이트',
    purpose: '핵심 성분이나 제형의 특징을 여러 이미지로 강조 - 커버력, 지속력, 피부표현, 주요 성분 시각화',
    recommendedLayout: 'hero-bottom',
    imagePromptTemplate: `Ingredient/Material highlight photography for e-commerce detail page.

[COMPOSITION]
- Close-up focus on product's key material or ingredient
- {material} visualization with artistic representation
- Clean {background} background with gradient
- Space for headline text about the ingredient/material benefit

[STYLE]
- Premium, scientific yet beautiful aesthetic
- Korean beauty detail page style
- Material/ingredient as hero element

[QUALITY]
- 8K, texture and detail clearly visible
- No text in image`,
    requiredVisuals: ['ingredient-visual', 'close-up-detail', 'headline-space'],
    optionalVisuals: ['ingredient-source', 'texture-comparison', 'scientific-element'],
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
    multiImage: true,
    maxImageCount: 4,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation/Cushion BENEFIT photography series for Korean beauty detail page.

[IMAGE SET - Multiple images showcasing each key benefit]

1. COVERAGE (커버력):
- Split-face or before/after showing coverage on skin imperfections
- Korean female model face showing redness, dark spots COVERED by foundation
- Natural lighting, realistic skin texture
- Professional beauty retouching but believable

2. LONG-LASTING (지속력):
- Time-lapse concept: "Morning vs. Evening" comparison
- Or: Product on skin surface showing wear-test durability
- Fresh, non-cakey finish after hours of wear
- Clock/time visual element subtly included

3. SKIN FINISH (피부표현):
- Close-up of skin with foundation showing the finish type:
  - Dewy/Glow finish: Light reflecting off cheekbones, healthy sheen
  - Semi-matte: Natural, skin-like finish without shine
  - Full matte: Poreless, smooth, oil-controlled look
- Macro skin texture photography, pores visible but refined

4. LIGHTWEIGHT FEEL (가벼운 착용감):
- Feather or air visual metaphor near skin
- Thin, breathable layer concept
- Side-profile showing natural, comfortable wear

[STYLE]
- Clean white or soft pink/beige gradient background
- Korean beauty aesthetic - "your skin but better"
- Professional beauty photography

[QUALITY]
- 8K photorealistic
- Skin texture visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 특징 표기: 완벽 커버력, 24시간 지속력, 촉촉 광채 피부표현, 무결점 피부 등',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip product INGREDIENT & TEXTURE photography series for Korean beauty detail page.

[IMAGE SET - Multiple images for key ingredients and benefits]

1. COLOR INGREDIENT VISUAL (컬러 성분):
- If shade name references a fruit/flower (e.g., "Fig", "Rose", "Cherry"):
  - Display the actual fruit/flower alongside lip swatch
  - Artistic arrangement: sliced fig + lip product swatch showing matching color
  - Fresh, appetizing, natural ingredient feeling
- Fruit/flower should look fresh, vibrant, premium quality

2. MOISTURIZING INGREDIENT (보습 성분):
- Key moisturizing ingredients visualized:
  - Hyaluronic acid: water droplets, hydration visual
  - Shea butter: butter texture swirl
  - Vitamin E: golden oil drops
- Ingredient near lip product or lip swatch

3. TEXTURE CLOSE-UP (텍스처):
- Macro shot of lip product texture:
  - Glossy: mirror-like shine, light reflection
  - Velvet: soft-focus, plush texture
  - Matte: smooth, powdery finish
- Lip product smear or bullet close-up

4. LIP CARE BENEFIT (립케어 효과):
- Before/after showing lip improvement
- Dry lips vs. nourished lips comparison
- Plumping effect visualization

[STYLE]
- Clean background matching product mood (pink, nude, or color-coordinated)
- Editorial beauty photography style
- Fresh, desirable, premium

[QUALITY]
- 8K macro photography
- Ingredient and texture detail sharp
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 성분/효과 표기: 무화과 추출물 함유, 히알루론산 보습, 벨벳 텍스처, 립케어 효과 등',
      },
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플'],
        imagePrompt: `Skincare INGREDIENT photography series for Korean beauty detail page.

[IMAGE SET - Key ingredients visualization]

1. HERO INGREDIENT:
- Main active ingredient beautifully visualized:
  - Hyaluronic acid: water molecule, hydration splash
  - Vitamin C: fresh citrus slice, bright yellow/orange
  - Centella Asiatica (CICA): green cica leaves, calming green
  - Niacinamide: clean, bright, scientific vial
  - Retinol: golden serum drop, anti-aging luxury
- Ingredient arranged with product or serum drops

2. TEXTURE SHOWCASE:
- Product texture on glass petri dish or skin
- Consistency clearly visible (gel, cream, water, oil)
- Scientific yet beautiful presentation

3. CONCENTRATION/POTENCY:
- Percentage visual (e.g., "10% Vitamin C" concept)
- Dropper with concentrated serum
- Potent, effective, clinical feel

4. SKIN BENEFIT RESULT:
- Before/after skin improvement visualization
- Glowing, hydrated, clear skin result
- Model skin or abstract skin texture

[STYLE]
- Clean white/soft blue gradient background
- Scientific + luxurious Korean skincare aesthetic
- Ingredient as premium, effective hero

[QUALITY]
- 8K, ingredient and texture detail
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 성분명 + 효능: 히알루론산 5중 복합체, 비타민C 10% 고농축, 병풀 추출물 진정 효과 등',
      },
      {
        categoryKeywords: ['선케어', '선크림', '자외선'],
        imagePrompt: `Sunscreen BENEFIT photography series for Korean beauty detail page.

[IMAGE SET]

1. UV PROTECTION VISUAL:
- UV ray concept with protective barrier/shield
- Sun and protection visual metaphor
- Scientific yet approachable

2. TEXTURE & FINISH:
- Product texture swatch showing no white cast
- Tone-up effect demonstration
- Lightweight, non-greasy finish on skin

3. WATER/SWEAT RESISTANCE:
- Water droplets on skin with product
- Active/outdoor lifestyle concept
- Fresh, protective feeling

[STYLE]
- Bright, sunny, fresh aesthetic
- Clean background with warm yellow tones
- Korean suncare detail page style

[QUALITY]
- 8K, clear detail
- No text in image`,
        suggestedImageCount: 3,
        overlayTextGuide: '각 이미지에 특징: SPF50+ PA++++ 자외선 차단, 무백탁 톤업, 워터프루프 등',
      },
    ],
  },

  SOCIAL_PROOF: {
    type: 'SOCIAL_PROOF',
    name: '신뢰 데이터 섹션',
    purpose: '피부 임상 테스트 인증서, 수치 데이터, 테스트 결과 등 전문적인 신뢰 구축 이미지',
    recommendedLayout: 'comparison',
    imagePromptTemplate: `Professional CLINICAL TEST CERTIFICATION image for Korean beauty e-commerce detail page.

[COMPOSITION - Clinical Test Certificate Style]
- Clean, official document-style layout
- Soft pink or beige gradient background (Korean beauty aesthetic)
- Certificate/stamp visual in corner (circular certification mark)
- Large space for test results text overlay
- Professional, trustworthy, scientific aesthetic

[VISUAL ELEMENTS]
- Certification stamp/seal (circular, official-looking)
- Clean document paper texture or gradient
- Subtle decorative border or frame
- Space for:
  - Test institution name
  - Test date/period
  - Key results (percentages, improvements)
  - Test subject information

[STYLE]
- Korean cosmetic clinical test result aesthetic
- Clean, minimal, professional
- Trustworthy and scientific feel
- Similar to dermatological test certificates

[QUALITY]
- High resolution, clean graphics
- No actual text burned in (space for overlay)
- Professional certification document style`,
    requiredVisuals: ['certification-seal', 'clean-background', 'text-overlay-space', 'official-aesthetic'],
    optionalVisuals: ['decorative-border', 'institution-logo-space', 'data-chart-area'],
    textOverlay: {
      headline: true,      // 테스트 제목 (예: 피부 임상 테스트 완료)
      subheadline: false,
      body: true,          // 테스트 상세 내용
      bullets: true,       // 테스트 결과 항목
      numbers: true,       // 퍼센트 수치
      icons: true,         // 체크마크, 인증 아이콘
    },
    generateImage: true,
    defaultOrder: 4,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플', '마스크팩'],
        imagePrompt: `Korean skincare CLINICAL TEST CERTIFICATE image.

[LAYOUT - Official Test Result Document]
- Soft pink-beige gradient background (Korean beauty aesthetic)
- Official certification stamp/seal in top-right corner:
  - Circular design with "피부 임상 테스트 완료" text area
  - Professional red/burgundy or rose gold color
  - Year mark (e.g., 2024)
- Main document area with clean white/cream paper texture overlay
- Subtle decorative corners or minimal border

[CONTENT SPACE FOR TEXT OVERLAY]
- Header area: Test institution name, certification title
- Body area: Test details
  - Test period (예: 2024.01.01 ~ 2024.01.28, 4주간)
  - Test subjects (예: 20-50대 여성 32명)
  - Test results:
    1) Primary result with percentage
    2) Secondary result with percentage
    3) Safety/irritation test result
- Footer: Additional notes, institution info

[STYLE]
- Korean dermatological test certificate aesthetic
- Clean, trustworthy, scientific
- Soft feminine color palette (pink, beige, cream)
- Professional document layout

[QUALITY]
- Clean vector-style graphics
- No actual text (leave space for Korean text overlay)
- Certificate/official document aesthetic`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 피부 임상 테스트 완료 + 테스트 기관명
본문:
- 테스트 기간: 4주간 사용 테스트
- 테스트 대상: 20-50대 여성 32명
- 테스트 결과:
  1) 피부 수분량 92% 증가
  2) 피부 탄력 87% 개선
  3) 피부 자극 테스트 통과
하단: *비임상 자극성 시험 완료`,
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation/Cushion WEAR TEST CERTIFICATE image.

[LAYOUT]
- Clean beige-pink gradient background
- Certification stamp with "지속력 테스트 완료" concept
- Document-style layout for test results

[CONTENT SPACE]
- Wear test duration (8시간, 12시간, 24시간)
- Coverage maintenance percentage
- Oil control / sebum test results
- No-transfer test results
- Skin irritation test (passed)

[STYLE]
- Korean beauty clinical aesthetic
- Professional, trustworthy
- Soft color palette

[QUALITY]
- Clean graphics, no text burned in`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 지속력 임상 테스트 완료
본문:
- 12시간 지속력 테스트 결과
- 커버력 유지율 94%
- 피지 컨트롤 효과 89%
- 묻어남 없음 테스트 통과
- 피부 자극 테스트 완료`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `Lip product SAFETY/WEAR TEST CERTIFICATE image.

[LAYOUT]
- Soft rose-pink gradient background
- Certification stamp design
- Clean document layout

[CONTENT SPACE]
- Wear test (착색 지속력)
- Transfer-proof test
- Moisturizing effect test
- Lip irritation test (for sensitive lips)

[STYLE]
- Korean beauty certificate aesthetic
- Feminine, professional
- Rose/pink color theme

[QUALITY]
- Clean graphics, space for text overlay`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 립 안전성 테스트 완료
본문:
- 발색 지속력 8시간
- 묻어남 방지 테스트 통과
- 입술 보습 효과 인정
- 민감 입술 자극 테스트 완료`,
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Sunscreen UV PROTECTION TEST CERTIFICATE image.

[LAYOUT]
- Bright yellow-white gradient background (sunny, protective feel)
- Official SPF/PA certification stamp
- Document layout for UV test results

[CONTENT SPACE]
- SPF rating verification
- PA rating verification
- Water resistance test
- Skin safety test

[STYLE]
- Professional, scientific
- Sunny, fresh aesthetic
- Korean suncare certificate style

[QUALITY]
- Clean graphics, text overlay space`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 자외선 차단 테스트 완료
본문:
- SPF50+ 인체적용시험 완료
- PA++++ 자외선A 차단 검증
- 내수성 테스트 80분 통과
- 피부 안전성 테스트 완료`,
      },
    ],
  },

  HOW_TO_USE: {
    type: 'HOW_TO_USE',
    name: '사용법 섹션',
    purpose: '단계별 사용 방법을 여러 이미지로 시각적으로 안내 - 각 단계별 개별 이미지 생성',
    recommendedLayout: 'step-sequence',
    imagePromptTemplate: `Step-by-step USAGE GUIDE photography for Korean beauty e-commerce detail page.

[COMPOSITION]
- Single step demonstration per image
- Product "{product}" being used in realistic context
- Clean {background} tones
- Space for step number and instruction text overlay
- Bright, clear, instructional lighting

[STYLE]
- Korean beauty tutorial aesthetic
- Clean, easy-to-follow visual guide
- Professional yet approachable

[QUALITY]
- 8K, clear demonstration visible
- No text burned in image`,
    requiredVisuals: ['product-in-use', 'step-demonstration', 'text-overlay-space'],
    optionalVisuals: ['hands-demonstration', 'application-tool', 'result-preview'],
    textOverlay: {
      headline: true,      // STEP 1, STEP 2 등
      subheadline: false,
      body: true,          // 단계별 설명
      bullets: false,
      numbers: true,       // 단계 번호
      icons: false,
    },
    generateImage: true,
    defaultOrder: 5,
    multiImage: true,
    maxImageCount: 5,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플'],
        imagePrompt: `Skincare STEP-BY-STEP APPLICATION series for Korean beauty detail page.

[IMAGE SET - Generate one image per step]

STEP 1: DISPENSE (적정량 덜기)
- Hand holding product, dispensing appropriate amount
- Dropper releasing serum drops, pump dispensing cream, etc.
- Show recommended amount (coin-size, 2-3 drops, pea-size)
- Clean, bright background

STEP 2: WARM/PREPARE (손에서 데우기)
- Product on fingertips or palms
- Warming gesture - rubbing palms together gently
- Product texture visible

STEP 3: APPLY (얼굴에 도포)
- Korean female model applying product to face
- Specific application area shown (cheeks, forehead, chin)
- Gentle patting or smoothing motion
- Natural, healthy skin

STEP 4: ABSORPTION (흡수시키기)
- Patting motion on face for absorption
- Or: Gentle massage in circular motions
- Product absorbing into skin

STEP 5: FINISH (마무리)
- Final result - glowing, hydrated skin
- Model's face showing product benefits
- Fresh, healthy complexion

[STYLE]
- Korean skincare routine tutorial aesthetic
- Soft, flattering lighting on skin
- Clean white/neutral background
- Professional beauty photography

[QUALITY]
- 8K, skin texture and product visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 스포이드로 2-3방울 덜어주세요
STEP 2: 손바닥에서 체온으로 데워주세요
STEP 3: 얼굴 중앙에서 바깥쪽으로 펴 발라주세요
STEP 4: 손바닥으로 가볍게 눌러 흡수시켜주세요`,
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation/Cushion APPLICATION STEPS series for Korean beauty detail page.

[IMAGE SET]

STEP 1: PREPARE (스킨케어 마무리)
- Clean, prepped skin ready for makeup
- Or: Primer application final step

STEP 2: PRODUCT PICKUP (제품 묻히기)
- Puff/sponge pressing into cushion or picking up foundation
- Show appropriate amount on applicator
- Product texture on puff visible

STEP 3: STAMP APPLICATION (스탬핑)
- Puff stamping/pressing onto face (not dragging)
- Start from center of face, stamp outward
- Korean "stamp" technique demonstration

STEP 4: BLEND (블렌딩)
- Blending edges, hairline, jawline
- Seamless finish demonstration
- Natural-looking coverage

STEP 5: BUILD COVERAGE (커버 추가 - optional)
- Additional layer on areas needing more coverage
- Under-eye, around nose, blemish spots
- Buildable coverage concept

STEP 6: SET (세팅)
- Setting with powder or setting spray
- Or: Final dewy/natural finish result

[STYLE]
- Korean makeup tutorial aesthetic
- Good lighting showing skin and coverage
- Professional yet relatable

[QUALITY]
- 8K, makeup application clearly visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 스킨케어로 피부를 정돈해주세요
STEP 2: 퍼프에 적당량을 묻혀주세요
STEP 3: 얼굴 중앙부터 바깥쪽으로 톡톡 스탬핑해주세요
STEP 4: 헤어라인과 턱선을 자연스럽게 블렌딩해주세요`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip product APPLICATION STEPS series for Korean beauty detail page.

[IMAGE SET]

STEP 1: LIP PREP (입술 준비)
- Clean, exfoliated lips
- Or: Lip balm application for hydration

STEP 2: APPLY INNER LIP (안쪽 발색)
- Applying product to inner lip area first
- Korean gradient lip technique start
- Precise application with applicator

STEP 3: BLEND OUTWARD (바깥으로 블렌딩)
- Blending/pressing lips together
- Or: Finger tapping for gradient effect
- Seamless gradient from center

STEP 4: BUILD COLOR (발색 강도 조절)
- Additional application for bolder look
- Or: Keeping gradient for natural look
- Final color payoff visible

STEP 5: FINAL LOOK (완성)
- Beautiful finished lip look
- Natural or bold depending on style
- Model's lips looking healthy and vibrant

[STYLE]
- Korean lip makeup tutorial aesthetic
- Close-up lip shots
- Clean, feminine background (pink, neutral)

[QUALITY]
- 8K macro photography
- Lip texture and color clearly visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 입술 각질을 정리하고 보습해주세요
STEP 2: 입술 안쪽 중앙에 제품을 발라주세요
STEP 3: 손가락으로 바깥쪽으로 톡톡 두드려 그라데이션해주세요
STEP 4: 원하는 발색까지 레이어링해주세요`,
      },
      {
        categoryKeywords: ['마스크팩', '시트마스크'],
        imagePrompt: `Sheet Mask APPLICATION STEPS series for Korean beauty detail page.

[IMAGE SET]

STEP 1: CLEANSE (세안)
- Clean, freshly washed face
- Skin ready for mask

STEP 2: UNFOLD & ALIGN (마스크 펼치기)
- Unfolding sheet mask
- Aligning with facial features (eyes, nose, mouth holes)

STEP 3: APPLY & SMOOTH (밀착시키기)
- Pressing mask onto face
- Smoothing out air bubbles
- Ensuring good contact with skin

STEP 4: WAIT (시간 두기)
- Relaxing with mask on
- Timer concept (15-20 minutes)
- Enjoying self-care moment

STEP 5: REMOVE & PAT (제거 및 흡수)
- Removing mask gently
- Patting remaining essence into skin
- Glowing result

[STYLE]
- Korean skincare routine aesthetic
- Relaxing, self-care mood
- Clean, spa-like setting

[QUALITY]
- 8K, clear demonstration
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 세안 후 토너로 피부결을 정돈해주세요
STEP 2: 마스크를 펼쳐 눈, 코, 입에 맞춰 올려주세요
STEP 3: 공기가 들어가지 않게 얼굴에 밀착시켜주세요
STEP 4: 15-20분 후 마스크를 벗기고 남은 에센스를 흡수시켜주세요`,
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Sunscreen APPLICATION STEPS series for Korean beauty detail page.

[IMAGE SET]

STEP 1: AMOUNT (적정량)
- Dispensing sunscreen - two-finger rule or coin-sized amount
- Showing generous, adequate amount

STEP 2: DOT APPLICATION (점 찍기)
- Dotting sunscreen on forehead, cheeks, nose, chin
- Distribution points on face

STEP 3: SPREAD (펴바르기)
- Spreading evenly across face
- Outward spreading motions
- Full coverage

STEP 4: NECK & EARS (목과 귀)
- Extending to neck, behind ears
- Often-missed areas coverage

STEP 5: REAPPLICATION REMINDER (덧바르기 - optional)
- Reapplying after 2-3 hours concept
- Outdoor/activity context

[STYLE]
- Fresh, outdoor-ready feeling
- Bright, sunny aesthetic
- Korean suncare routine

[QUALITY]
- 8K, texture and application visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 검지, 중지 두 마디 정도의 양을 덜어주세요
STEP 2: 이마, 양볼, 코, 턱에 점을 찍어주세요
STEP 3: 안쪽에서 바깥쪽으로 고르게 펴 발라주세요
STEP 4: 목과 귀 뒤도 잊지 말고 발라주세요`,
      },
    ],
  },

  LIFESTYLE: {
    type: 'LIFESTYLE',
    name: '라이프스타일 무드샷',
    purpose: '제품이 일상에서 자연스럽게 사용되는 모습, 감성적 연결과 사용 상황 시각화',
    recommendedLayout: 'lifestyle',
    imagePromptTemplate: `Premium LIFESTYLE photography for Korean beauty e-commerce detail page.

[COMPOSITION]
- Product "{product}" naturally integrated into realistic daily life setting
- {context} environment with complementary props and accessories
- Warm, inviting atmosphere with {background} color tones
- Editorial/magazine style composition
- Soft natural lighting creating cozy mood

[STYLE]
- Korean beauty lifestyle aesthetic (Olive Young style)
- Aspirational yet relatable daily life scene
- Product as natural part of routine, not forced placement
- Clean, aesthetic, Instagram-worthy composition

[QUALITY]
- 8K photorealistic
- Soft, flattering lighting
- No text in image`,
    requiredVisuals: ['environmental-context', 'lifestyle-props', 'mood-lighting', 'natural-placement'],
    optionalVisuals: ['human-element', 'complementary-items', 'routine-context'],
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
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너'],
        imagePrompt: `Skincare LIFESTYLE photography for Korean beauty detail page.

[SCENE]
- Morning or evening skincare routine setting
- Bathroom vanity or bedroom dresser with mirror
- Product placed among other skincare items (cotton pads, tray, candle)
- Soft morning light through window or warm evening lamp light
- Clean, minimal, aesthetic Korean interior style

[PROPS]
- White marble or wood tray
- Fresh flowers or plant
- Soft towel
- Mirror reflection
- Other skincare bottles (blurred background)

[MOOD]
- Self-care moment, relaxing routine
- Clean, fresh, peaceful atmosphere
- Aspirational Korean skincare ritual

[QUALITY]
- 8K, editorial photography style
- Warm, soft lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: '나만의 스킨케어 루틴, 매일 밤 꾸준히, 피부가 달라지는 시간 등 감성 카피',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '메이크업', '쿠션'],
        imagePrompt: `Makeup LIFESTYLE photography for Korean beauty detail page.

[SCENE]
- Getting ready / makeup routine setting
- Vanity table with mirror and makeup items
- Or: Cafe table with compact mirror (touch-up moment)
- Or: Bright bathroom with good lighting
- Stylish, feminine interior setting

[PROPS]
- Makeup pouch or organizer
- Other makeup items (blurred)
- Mirror (vanity or compact)
- Coffee cup or accessories (if cafe setting)
- Fresh flowers

[MOOD]
- Confident, feminine, ready-to-go feeling
- Daily beauty routine moment
- Stylish Korean woman's lifestyle

[QUALITY]
- 8K, lifestyle photography
- Bright, flattering lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: '매일 아침 설레는 메이크업, 어디서든 완벽하게, 나를 빛나게 하는 순간 등',
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Suncare LIFESTYLE photography for Korean beauty detail page.

[SCENE]
- Outdoor or travel setting suggesting sun protection need
- Beach bag with suncare essentials
- Or: Morning routine before going out
- Or: Outdoor cafe/park setting
- Bright, sunny, fresh atmosphere

[PROPS]
- Sunglasses
- Hat or cap
- Beach/travel bag
- Bright outdoor background
- Summer accessories

[MOOD]
- Active, outdoor lifestyle
- Sun-protected confidence
- Fresh, energetic feeling

[QUALITY]
- 8K, bright lifestyle photography
- Sunny, vibrant lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: '어디서든 자외선으로부터, 매일의 필수 루틴, 건강한 피부를 위한 첫 걸음 등',
      },
    ],
  },

  FAQ: {
    type: 'FAQ',
    name: 'Q&A 섹션',
    purpose: '자주 묻는 질문을 Q&A 카드/말풍선 형식으로 시각화, 제품과 함께 배치하여 구매 의문 해소',
    recommendedLayout: 'split-right',
    imagePromptTemplate: `Q&A visual layout photography for Korean beauty e-commerce detail page.

[COMPOSITION - Q&A Card Style]
- Product "{product}" elegantly placed in scene
- Clean {background} background (beige, cream, or soft neutral)
- Large empty spaces for Q&A text card overlays
- Speech bubble / card layout friendly composition
- Product occupies 30-40% of frame, rest for text areas

[LAYOUT STYLE]
- Magazine editorial Q&A layout aesthetic
- Space for 3-4 Q&A cards around product
- Question cards with "Q" icon styling
- Clean, organized information design

[PROPS - Related to product use]
- Props that relate to common questions
- Usage context items
- Complementary products

[STYLE]
- Korean beauty detail page Q&A aesthetic
- Clean, trustworthy, informative
- Soft, warm color palette

[QUALITY]
- 8K, clean product photography
- Even, soft lighting
- No text burned in - space for overlay`,
    requiredVisuals: ['product-placement', 'qa-card-space', 'clean-background', 'organized-layout'],
    optionalVisuals: ['speech-bubble-areas', 'related-props', 'info-card-zones'],
    textOverlay: {
      headline: true,      // "Q&A" 또는 "자주 묻는 질문" 타이틀
      subheadline: false,
      body: true,          // Q&A 내용
      bullets: true,       // 질문 리스트
      numbers: false,
      icons: true,         // Q 아이콘
    },
    generateImage: true,
    defaultOrder: 7,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플'],
        imagePrompt: `Skincare Q&A layout photography for Korean beauty detail page.

[SCENE]
- Product bottle/jar elegantly placed
- Soft beige or cream gradient background
- Clean, minimal setting with skincare context
- Large empty areas for Q&A text cards (left and right of product)

[LAYOUT FOR Q&A OVERLAY]
- Top area: "Q&A" title space
- Left side: 2 question card spaces
- Right side: 2 question card spaces
- Product in center-bottom area

[COMMON SKINCARE Q&A TOPICS TO VISUALIZE]
- Skin type suitability (dry/oily/sensitive)
- Usage order in routine
- Usage amount and frequency
- Ingredient safety concerns
- Expected results timeline

[PROPS]
- Cotton pads nearby
- Other skincare items (subtle, background)
- Clean tray or surface

[STYLE]
- Clean, trustworthy, scientific feel
- Korean skincare Q&A aesthetic
- Soft, approachable color palette

[QUALITY]
- 8K, clean composition
- Soft, even lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `Q&A 타이틀 + 질문-답변 카드:
Q. 어떤 피부 타입에 적합한가요?
A. 모든 피부 타입에 사용 가능하며, 특히 건성/민감성 피부에 추천드립니다.

Q. 사용 순서가 어떻게 되나요?
A. 토너 → 에센스 → 본 제품 → 크림 순서로 사용해주세요.

Q. 하루에 몇 번 사용하나요?
A. 아침, 저녁 세안 후 2회 사용을 권장합니다.`,
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Foundation/Cushion Q&A layout photography for Korean beauty detail page.

[SCENE]
- Cushion compact or foundation displayed elegantly
- Soft pink-beige gradient background
- Puff or sponge nearby as related prop
- Large empty areas for Q&A cards

[LAYOUT FOR Q&A OVERLAY]
- Space for shade selection questions
- Space for skin type questions
- Space for usage/longevity questions

[COMMON BASE MAKEUP Q&A TOPICS]
- How to choose the right shade
- Coverage level (light/medium/full)
- Finish type (dewy/matte/natural)
- Longevity and touch-up needs
- Suitable for oily/dry skin

[STYLE]
- Feminine, clean beauty aesthetic
- Korean makeup Q&A style
- Soft, flattering colors

[QUALITY]
- 8K, beauty photography
- Soft lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `Q. 제 피부톤에 맞는 호수는 어떻게 선택하나요?
A. 턱 라인에 발라보시고 자연스럽게 스며드는 호수를 선택해주세요. 21호가 가장 인기있는 호수입니다.

Q. 지성 피부도 사용 가능한가요?
A. 네, 피지 컨트롤 기능이 있어 지성 피부에도 적합합니다.

Q. 리필은 따로 구매 가능한가요?
A. 네, 리필 제품을 별도로 구매하실 수 있습니다.`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `Lip product Q&A layout photography for Korean beauty detail page.

[SCENE]
- Lip product standing or laid elegantly
- Soft rose-pink or nude gradient background
- Lip-related props (mirror, blotting paper)
- Space for Q&A cards around product

[COMMON LIP Q&A TOPICS]
- Color payoff and lasting power
- Transfer-proof properties
- Moisturizing vs drying
- How to achieve gradient lip
- Suitable for dry/chapped lips

[STYLE]
- Feminine, romantic aesthetic
- Korean lip product Q&A style

[QUALITY]
- 8K, beauty photography
- Soft, flattering lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `Q. 착색이 심한가요?
A. 자연스러운 착색으로 클렌징 후 깔끔하게 지워집니다.

Q. 입술이 건조해지지 않나요?
A. 보습 성분이 함유되어 촉촉하게 유지됩니다.

Q. 마스크에 묻어나지 않나요?
A. 밀착력이 좋아 묻어남이 적습니다.`,
      },
    ],
  },

  INFO_TABLE: {
    type: 'INFO_TABLE',
    name: '제품 정보표',
    purpose: '법적 필수 정보, 제조사, 성분, 사용 주의사항 등 - 구매 신뢰도 향상 및 법적 요건 충족',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `Premium PRODUCT INFORMATION TABLE photography for Korean e-commerce detail page.

[COMPOSITION - Clean Information Layout]
- Small "{product}" image on LEFT side (20-25% of width)
- Large clean {background} area on RIGHT (75-80%) for information table overlay
- Subtle horizontal line dividers for table row areas
- Professional, trustworthy document-style aesthetic

[LAYOUT FOR INFO TABLE - Korean Regulatory Style]
- Product thumbnail: Small, elegant, angled slightly
- Table area: Clean grid-ready space
- Table rows should accommodate:
  * 제품명 (Product Name)
  * 용량/중량 (Volume/Weight)
  * 제조사/판매사 (Manufacturer/Seller)
  * 제조국 (Country of Origin)
  * 사용기한/제조일자 (Expiry/Manufacturing Date)
  * 전성분 (Full Ingredients)
  * 사용방법 (How to Use)
  * 사용시 주의사항 (Precautions)
  * 품질보증기준 (Quality Assurance)
  * 고객상담실 (Customer Service)

[VISUAL STYLE]
- Clean, official document aesthetic
- Light gray or white background
- Subtle border/frame for table area
- Korean beauty/cosmetic info table style (올리브영, 쿠팡 스타일)

[TRUST ELEMENTS - Space for Overlay]
- Certification badge areas (small, subtle)
- QR code space for product verification
- Customer service contact area

[QUALITY]
- 8K, clean and professional
- Product clearly identifiable
- No text in image - all info as overlay
- Grid-aligned layout for text overlay`,
    requiredVisuals: ['product-thumbnail', 'large-table-area', 'grid-layout', 'clean-dividers'],
    optionalVisuals: ['brand-logo-small', 'qr-code-area', 'certification-badge-space'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: true,
      bullets: true,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 8,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너', '앰플', '화장품', '뷰티'],
        imagePrompt: `Cosmetic PRODUCT INFO TABLE photography for Korean beauty detail page.

[COMPOSITION]
- Small "{product}" on left (20%)
- Large clean table area on right (80%)
- Soft gradient background (light gray to white)

[COSMETIC INFO TABLE AREAS]
- 화장품법 필수 기재 사항 공간
- 전성분 목록 영역 (scrollable area style)
- 피부 타입별 주의사항 영역
- 알러지 유발 성분 표시 영역

[STYLE]
- Clean, clinical, trustworthy
- Korean cosmetic regulation compliant style
- Professional product information aesthetic

[QUALITY]
- 8K, product clear and identifiable
- No text - overlay ready`,
        suggestedImageCount: 1,
        overlayTextGuide: `[제품 정보]
- 제품명: OO 에센스
- 용량: 50ml
- 제조사: (주)OO코스메틱
- 제조국: 대한민국
- 사용기한: 제조일로부터 36개월

[전성분]
정제수, 글리세린, 나이아신아마이드...

[사용시 주의사항]
- 사용 중 붉은 반점 등 이상 시 사용 중지
- 눈에 들어갔을 때 즉시 씻어낼 것

[품질보증]
본 제품은 공정거래위원회 고시...

[고객상담실] 1588-XXXX`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '메이크업', '쿠션', '파운데이션'],
        imagePrompt: `Makeup PRODUCT INFO TABLE photography for Korean beauty detail page.

[COMPOSITION]
- "{product}" displayed small on left
- Clean table area dominating right side
- Feminine yet professional background

[MAKEUP INFO TABLE AREAS]
- 화장품법 기재 사항
- 색상/호수 정보
- 성분 및 알러지 정보
- 개봉 후 사용 기간

[STYLE]
- Clean, professional info table style
- Korean makeup product detail page

[QUALITY]
- 8K, professional
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `[제품 정보]
- 제품명: OO 틴트 #01 로즈코랄
- 용량: 3.5g
- 제조사: (주)OO뷰티
- 사용기한: 개봉 후 12개월

[전성분]
...

[사용시 주의사항]
- 입술에 상처가 있는 경우 사용 금지
- 직사광선을 피해 보관`,
      },
    ],
  },

  CTA: {
    type: 'CTA',
    name: 'CTA/브랜드 마무리',
    purpose: '구매 유도, 브랜드 신뢰 강조, 고객센터 정보, 상세페이지 마무리',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Premium CLOSING/CTA photography for Korean beauty e-commerce detail page.

[COMPOSITION - Final Impression]
- Product "{product}" as hero, elegant final shot
- Clean {background} gradient background
- Premium, trustworthy, purchase-ready aesthetic
- Space for brand message and CTA text
- Warm, inviting atmosphere encouraging purchase

[LAYOUT FOR CTA OVERLAY]
- Top: Brand slogan or final message space
- Center: Product hero shot
- Bottom: CTA button space, customer service info area

[VISUAL ELEMENTS]
- Product in best angle, most appealing presentation
- Subtle brand color accents
- Trust-building elements (subtle badge areas)
- Clean, confident, final impression

[STYLE]
- Korean beauty detail page closing aesthetic
- Premium, trustworthy, desirable
- Warm yet professional atmosphere

[QUALITY]
- 8K, hero product photography
- Beautiful, flattering lighting
- No text in image - space for overlay`,
    requiredVisuals: ['product-hero', 'cta-space', 'brand-message-area', 'trust-elements'],
    optionalVisuals: ['brand-color-accent', 'badge-areas', 'contact-info-space'],
    textOverlay: {
      headline: true,      // 브랜드 메시지, CTA 문구
      subheadline: true,   // 부가 설명
      body: false,
      bullets: false,
      numbers: true,       // 고객센터 번호 등
      icons: true,         // 전화, 카카오톡 아이콘 등
    },
    generateImage: true,
    defaultOrder: 9,
    multiImage: false,
    maxImageCount: 1,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너'],
        imagePrompt: `Skincare CLOSING/CTA photography for Korean beauty detail page.

[SCENE]
- Product as final hero shot, most beautiful presentation
- Soft, luxurious gradient background (cream to soft pink or blue)
- Product with subtle glow/highlight effect
- Premium skincare final impression

[COMPOSITION]
- Product centered, 50-60% of frame
- Top space for headline: "지금 시작하세요" type message
- Bottom space for CTA: "구매하기" button area
- Side space for trust badges or customer service info

[MOOD]
- Trustworthy, premium, ready to purchase
- "Your skin transformation starts here" feeling
- Confident, inviting final impression

[QUALITY]
- 8K, premium product photography
- Soft, luxurious lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 지금, 당신의 피부를 위한 선택
중앙: 제품 이미지
하단:
- 구매하기 버튼
- 고객센터 1588-XXXX
- 카카오톡 상담 가능
- 평일 09:00-18:00`,
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '메이크업', '쿠션'],
        imagePrompt: `Makeup CLOSING/CTA photography for Korean beauty detail page.

[SCENE]
- Product in most glamorous presentation
- Soft pink or rose gradient background
- Feminine, confident final impression
- Premium makeup closing aesthetic

[COMPOSITION]
- Product hero shot with beautiful angle
- Space for empowering message
- CTA and contact area at bottom

[MOOD]
- Confident, beautiful, ready to shine
- "Be your most beautiful self" feeling
- Feminine empowerment

[QUALITY]
- 8K, glamour product photography
- Flattering, soft lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 오늘부터 더 빛나는 나
중앙: 제품 이미지
하단:
- 지금 만나보기
- 고객센터 정보
- SNS 링크`,
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `Suncare CLOSING/CTA photography for Korean beauty detail page.

[SCENE]
- Product with fresh, protective final impression
- Bright, sunny gradient background (yellow to white)
- Healthy, protected skin feeling
- Ready for outdoor confidence

[COMPOSITION]
- Product hero with sun-protection confidence
- Space for protection message
- CTA area at bottom

[MOOD]
- Protected, confident, ready for sun
- "Step out with confidence" feeling
- Fresh, healthy energy

[QUALITY]
- 8K, fresh product photography
- Bright, clean lighting
- No text in image`,
        suggestedImageCount: 1,
        overlayTextGuide: `상단: 자외선 걱정 없는 하루
중앙: 제품 이미지
하단:
- 구매하기
- 고객센터 정보`,
      },
    ],
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
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'FEATURES', 'SPECS', 'HOW_TO_USE', 'LIFESTYLE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'SPECS', 'INFO_TABLE'],
    optionalSections: ['BRAND_CONCEPT', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'CTA'],
  },
  '스킨케어': {
    category: '스킨케어',
    // hince 스타일 상세페이지 순서 반영 + MODEL_SHOT 추가
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'MODEL_SHOT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'INGREDIENT', 'LIFESTYLE', 'HOW_TO_USE', 'SOCIAL_PROOF', 'FAQ', 'CTA'],
    requiredSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'INGREDIENT', 'HOW_TO_USE'],
    optionalSections: ['MODEL_SHOT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'INFO_TABLE', 'CTA', 'FEATURES', 'MATERIAL'],
  },
  '로션': {
    category: '로션',
    // 로션 특화 섹션 구성 + MODEL_SHOT 추가
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'MODEL_SHOT', 'SKIN_RESULT', 'INGREDIENT', 'LIFESTYLE', 'HOW_TO_USE', 'CTA'],
    requiredSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'INGREDIENT'],
    optionalSections: ['MODEL_SHOT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '세럼': {
    category: '세럼',
    // 세럼 특화 + MODEL_SHOT 추가
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'MODEL_SHOT', 'INGREDIENT', 'SKIN_RESULT', 'SOCIAL_PROOF', 'HOW_TO_USE', 'CTA'],
    requiredSections: ['HERO', 'TEXTURE', 'INGREDIENT', 'SKIN_RESULT'],
    optionalSections: ['BRAND_CONCEPT', 'MODEL_SHOT', 'PRODUCT_LINEUP', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '크림': {
    category: '크림',
    // 크림 특화 + MODEL_SHOT 추가
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'TEXTURE', 'MODEL_SHOT', 'INGREDIENT', 'SKIN_RESULT', 'HOW_TO_USE', 'LIFESTYLE', 'CTA'],
    requiredSections: ['HERO', 'TEXTURE', 'INGREDIENT'],
    optionalSections: ['BRAND_CONCEPT', 'MODEL_SHOT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '메이크업': {
    category: '메이크업',
    // 메이크업 + MODEL_SHOT 필수 (메이크업은 모델 이미지가 핵심)
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'FEATURES', 'MODEL_SHOT', 'TEXTURE', 'SKIN_RESULT', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'TEXTURE', 'MODEL_SHOT', 'HOW_TO_USE'],
    optionalSections: ['BRAND_CONCEPT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'INGREDIENT', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'CTA'],
  },
  '립': {
    category: '립',
    // 립 + MODEL_SHOT 필수 (입술 발색 모델 필수)
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'FEATURES', 'MODEL_SHOT', 'TEXTURE', 'INGREDIENT', 'SKIN_RESULT', 'HOW_TO_USE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'TEXTURE', 'MODEL_SHOT'],
    optionalSections: ['BRAND_CONCEPT', 'PRODUCT_LINEUP', 'INGREDIENT', 'SKIN_RESULT', 'LIFESTYLE', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '쿠션': {
    category: '쿠션',
    // 쿠션 + MODEL_SHOT 필수 (피부 표현 모델 필수)
    recommendedSections: ['HERO', 'FEATURES', 'MODEL_SHOT', 'TEXTURE', 'SKIN_RESULT', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'TEXTURE', 'MODEL_SHOT', 'SKIN_RESULT'],
    optionalSections: ['BRAND_CONCEPT', 'PRODUCT_LINEUP', 'INGREDIENT', 'LIFESTYLE', 'SOCIAL_PROOF', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '선케어': {
    category: '선케어',
    // 선케어 + MODEL_SHOT 추가 (자외선 차단 효과 시각화)
    recommendedSections: ['HERO', 'TEXTURE', 'MODEL_SHOT', 'INGREDIENT', 'SKIN_RESULT', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'CTA'],
    requiredSections: ['HERO', 'TEXTURE', 'SOCIAL_PROOF'],
    optionalSections: ['BRAND_CONCEPT', 'MODEL_SHOT', 'PRODUCT_LINEUP', 'INGREDIENT', 'SKIN_RESULT', 'LIFESTYLE', 'FAQ', 'HOW_TO_USE', 'CTA'],
  },
  '식품': {
    category: '식품',
    recommendedSections: ['HERO', 'FEATURES', 'INGREDIENT', 'HOW_TO_USE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'INFO_TABLE'],
    optionalSections: ['BRAND_CONCEPT', 'PRODUCT_LINEUP', 'INGREDIENT', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'CTA'],
  },
  'default': {
    category: 'default',
    // 기본값도 새로운 섹션 타입 포함 + MODEL_SHOT
    recommendedSections: ['HERO', 'BRAND_CONCEPT', 'FEATURES', 'MODEL_SHOT', 'TEXTURE', 'INGREDIENT', 'SKIN_RESULT', 'HOW_TO_USE', 'FAQ', 'CTA'],
    requiredSections: ['HERO', 'FEATURES'],
    optionalSections: ['BRAND_CONCEPT', 'MODEL_SHOT', 'TEXTURE', 'INGREDIENT', 'PRODUCT_LINEUP', 'SKIN_RESULT', 'SPECS', 'MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
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
    'MAIN': 'MAIN',       // MAIN은 독립적인 썸네일 섹션
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

/**
 * 카테고리에 맞는 특화 프롬프트 가져오기
 * @param sectionType 섹션 타입
 * @param category 제품 카테고리 (예: '립틴트', '쿠션', '세럼')
 * @returns 카테고리 특화 프롬프트 또는 undefined (기본 프롬프트 사용)
 */
export function getCategorySpecificPrompt(
  sectionType: ExtendedSectionType,
  category: string
): CategorySpecificPrompt | undefined {
  const template = SECTION_TEMPLATES[sectionType];
  if (!template?.categorySpecificPrompts) {
    return undefined;
  }

  const lowerCategory = category.toLowerCase();

  // 카테고리 키워드 매칭
  for (const specificPrompt of template.categorySpecificPrompts) {
    const matched = specificPrompt.categoryKeywords.some(keyword =>
      lowerCategory.includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(lowerCategory)
    );
    if (matched) {
      return specificPrompt;
    }
  }

  return undefined;
}

/**
 * 섹션의 이미지 프롬프트 가져오기 (카테고리 특화 우선)
 * @param sectionType 섹션 타입
 * @param category 제품 카테고리
 * @param productName 제품명
 * @param backgroundStyle 배경 스타일
 * @returns 이미지 프롬프트와 추천 이미지 개수
 */
export function getSectionImagePrompt(
  sectionType: ExtendedSectionType,
  category: string,
  productName: string,
  backgroundStyle: string = 'soft gradient'
): { prompt: string; suggestedImageCount: number; overlayTextGuide?: string } {
  const template = SECTION_TEMPLATES[sectionType];
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);

  if (categorySpecific) {
    // 카테고리 특화 프롬프트 사용
    let prompt = categorySpecific.imagePrompt;
    prompt = prompt.replace(/{product}/g, productName);
    prompt = prompt.replace(/{background}/g, backgroundStyle);

    return {
      prompt,
      suggestedImageCount: categorySpecific.suggestedImageCount,
      overlayTextGuide: categorySpecific.overlayTextGuide,
    };
  }

  // 기본 프롬프트 사용
  const prompt = buildSectionTemplatePrompt(template, productName, backgroundStyle);
  return {
    prompt,
    suggestedImageCount: template.multiImage ? template.maxImageCount : 1,
    overlayTextGuide: undefined,
  };
}

/**
 * 섹션이 다중 이미지를 지원하는지 확인
 */
export function isMultiImageSection(sectionType: ExtendedSectionType): boolean {
  const template = SECTION_TEMPLATES[sectionType];
  return template?.multiImage ?? false;
}

/**
 * 섹션의 최대 이미지 개수 가져오기
 */
export function getMaxImageCount(sectionType: ExtendedSectionType): number {
  const template = SECTION_TEMPLATES[sectionType];
  return template?.maxImageCount ?? 1;
}
