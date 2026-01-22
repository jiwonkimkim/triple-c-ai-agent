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

/**
 * 인덱스별 개별 이미지 프롬프트
 * 다중 이미지 섹션에서 각 이미지별로 다른 컨셉 적용
 */
export interface IndexedImagePrompt {
  /** 이미지 인덱스 (0부터 시작) */
  index: number;
  /** 이미지 컨셉/타입 (예: "face-closeup", "shade-#21", "step-1") */
  conceptType: string;
  /** 이미지 프롬프트 (해당 인덱스 전용) */
  prompt: string;
  /** 오버레이 텍스트 가이드 */
  overlayGuide: string;
}

export interface CategorySpecificPrompt {
  /** 카테고리 키워드 (매칭용) */
  categoryKeywords: string[];
  /** 특화된 이미지 프롬프트 (기본/폴백) */
  imagePrompt: string;
  /** 이미지 수 (해당 카테고리에서 권장되는 이미지 개수) */
  suggestedImageCount: number;
  /** 텍스트 오버레이 가이드 (기본) */
  overlayTextGuide: string;
  /**
   * ★ 인덱스별 개별 프롬프트 (NEW!)
   * 각 이미지마다 다른 컨셉의 프롬프트 제공
   * 예: 립 컬러 4개면 각 인덱스별로 다른 컬러 프롬프트
   */
  indexedPrompts?: IndexedImagePrompt[];
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
- Photorealistic
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
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'shade-13-ivory',
            prompt: `[ONE IMAGE = ONE SHADE: #13 아이보리]
Foundation/Cushion SHADE #13 IVORY swatch only.
Korean female model's inner forearm with #13 Ivory shade swatch.
LIGHTEST shade - for very fair, porcelain skin tones.
Single horizontal stripe swatch showing true ivory/pink undertone color.
Clean cream background. Korean beauty swatch aesthetic.
Soft daylight lighting. Natural healthy skin.
ONLY #13 shade. NO other shades. NO text in image.`,
            overlayGuide: '#13 아이보리 / 밝은 피부 / 핑크 언더톤',
          },
          {
            index: 1,
            conceptType: 'shade-17-light-beige',
            prompt: `[ONE IMAGE = ONE SHADE: #17 라이트베이지]
Foundation/Cushion SHADE #17 LIGHT BEIGE swatch only.
Korean female model's inner forearm with #17 Light Beige shade swatch.
LIGHT shade - for fair to light skin tones.
Single horizontal stripe swatch showing light beige with neutral undertone.
Clean cream background. Korean beauty swatch aesthetic.
Soft daylight lighting. Natural healthy skin.
ONLY #17 shade. NO other shades. NO text in image.`,
            overlayGuide: '#17 라이트베이지 / 밝은~보통 피부 / 뉴트럴 톤',
          },
          {
            index: 2,
            conceptType: 'shade-21-natural-beige',
            prompt: `[ONE IMAGE = ONE SHADE: #21 내추럴베이지 - 베스트셀러]
Foundation/Cushion SHADE #21 NATURAL BEIGE swatch only.
Korean female model's inner forearm with #21 Natural Beige shade swatch.
BESTSELLER shade - most popular for medium skin tones.
Single horizontal stripe swatch showing natural beige, "your skin but better".
Clean cream background. Korean beauty swatch aesthetic.
Soft daylight lighting. Natural healthy skin.
ONLY #21 shade. NO other shades. NO text in image.`,
            overlayGuide: '#21 내추럴베이지 / 보통 피부 / 베스트셀러',
          },
          {
            index: 3,
            conceptType: 'shade-23-medium-beige',
            prompt: `[ONE IMAGE = ONE SHADE: #23 미디엄베이지]
Foundation/Cushion SHADE #23 MEDIUM BEIGE swatch only.
Korean female model's inner forearm with #23 Medium Beige shade swatch.
MEDIUM shade - for medium to tan skin tones.
Single horizontal stripe swatch showing warm medium beige color.
Clean cream background. Korean beauty swatch aesthetic.
Soft daylight lighting. Natural healthy skin.
ONLY #23 shade. NO other shades. NO text in image.`,
            overlayGuide: '#23 미디엄베이지 / 보통~어두운 피부 / 웜톤',
          },
          {
            index: 4,
            conceptType: 'shade-25-warm-beige',
            prompt: `[ONE IMAGE = ONE SHADE: #25 웜베이지]
Foundation/Cushion SHADE #25 WARM BEIGE swatch only.
Korean female model's inner forearm with #25 Warm Beige shade swatch.
DEEP shade - for tan to deep skin tones.
Single horizontal stripe swatch showing warm, golden beige color.
Clean cream background. Korean beauty swatch aesthetic.
Soft daylight lighting. Natural healthy skin.
ONLY #25 shade. NO other shades. NO text in image.`,
            overlayGuide: '#25 웜베이지 / 어두운 피부 / 골든 언더톤',
          },
        ],
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COLOR - 이 이미지는 단 하나의 립 컬러만 보여줍니다]

Korean beauty lip product SINGLE COLOR swatch image.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE lip color
- Do NOT combine multiple colors in one image
- Each color gets its own separate image block

[THIS IMAGE SHOWS]
Close-up of Korean female model's lips with ONE shade applied.
- Full lip or gradient lip application
- Color payoff clearly visible
- Texture visible (glossy/velvet/matte)

[COMPOSITION]
- Lip close-up, chin to nose bottom
- Lips centered, one color only
- Clean soft pink or nude background
- Side 30% empty for color name text

[STYLE]
- Korean beauty lip swatch aesthetic
- Soft ring light effect
- Plump, healthy looking lips
- Trendy K-beauty gradient lip

[KEYWORDS: 선명한 발색, 착색력, 생기, 지속력, 촉촉함]

CRITICAL: NO text, NO multiple colors, ONE shade only.`,
        suggestedImageCount: 6,
        overlayTextGuide: '컬러명 + 톤 추천 (예: #01 피그무드 / 웜톤 MLBB)',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'color-coral',
            prompt: `[ONE IMAGE = ONE COLOR: 코랄/피치 계열]
Korean model lips close-up with CORAL/PEACH shade applied.
Warm, fresh, spring-like coral color. Gradient or full lip.
Soft pink background. Korean beauty aesthetic.
ONLY this one coral shade. NO other colors. NO text.`,
            overlayGuide: '#01 코랄피치 / 화사한 봄 컬러',
          },
          {
            index: 1,
            conceptType: 'color-rose',
            prompt: `[ONE IMAGE = ONE COLOR: 로즈/핑크 계열]
Korean model lips close-up with ROSE/PINK shade applied.
Romantic, feminine rose pink color. Gradient or full lip.
Soft pink background. Korean beauty aesthetic.
ONLY this one rose shade. NO other colors. NO text.`,
            overlayGuide: '#02 로즈핑크 / 로맨틱 데일리',
          },
          {
            index: 2,
            conceptType: 'color-mlbb',
            prompt: `[ONE IMAGE = ONE COLOR: MLBB 누드 계열]
Korean model lips close-up with MLBB (My Lips But Better) shade applied.
Natural, everyday nude-pink color. Your-lips-but-better look.
Soft nude background. Korean beauty aesthetic.
ONLY this one MLBB shade. NO other colors. NO text.`,
            overlayGuide: '#03 누드로즈 / 데일리 MLBB',
          },
          {
            index: 3,
            conceptType: 'color-red',
            prompt: `[ONE IMAGE = ONE COLOR: 레드/버건디 계열]
Korean model lips close-up with RED/BURGUNDY shade applied.
Bold, confident, classic red or deep burgundy color.
Soft background. Korean beauty aesthetic.
ONLY this one red shade. NO other colors. NO text.`,
            overlayGuide: '#04 레드벨벳 / 시크한 포인트',
          },
          {
            index: 4,
            conceptType: 'color-orange',
            prompt: `[ONE IMAGE = ONE COLOR: 오렌지/브릭 계열]
Korean model lips close-up with ORANGE/BRICK shade applied.
Trendy, warm-toned orange or terracotta brick color.
Soft background. Korean beauty aesthetic.
ONLY this one orange shade. NO other colors. NO text.`,
            overlayGuide: '#05 브릭오렌지 / 트렌디 웜톤',
          },
          {
            index: 5,
            conceptType: 'color-berry',
            prompt: `[ONE IMAGE = ONE COLOR: 베리/플럼 계열]
Korean model lips close-up with BERRY/PLUM shade applied.
Rich, luxurious berry or plum color with depth.
Soft background. Korean beauty aesthetic.
ONLY this one berry shade. NO other colors. NO text.`,
            overlayGuide: '#06 베리플럼 / 고급스러운 무드',
          },
        ],
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
      {
        categoryKeywords: ['마스크팩', '시트마스크', '마스크', '팩', '패치'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE BENEFIT - 이 이미지는 단 하나의 효능만 보여줍니다]

Mask Pack BENEFIT block images for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE benefit type
- Do NOT combine multiple benefits in one image
- Each benefit gets its own separate image block

[COMPOSITION]
- Clean white/cream/soft blue background
- Text space at side 30% OR bottom 25%
- Single benefit focus per image

[STYLE]
- Korean sheet mask detail page aesthetic
- Fresh, hydrating, spa-like feeling
- Clinical yet beautiful
- Professional beauty photography

[KEYWORDS: 보습, 진정, 탄력, 광채, 피부결 개선, 수분 폭탄]

CRITICAL: ONE benefit only. NO combining multiple benefits. NO text in image.`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 블록: 집중 보습 / 피부 진정 / 탄력 부스팅 / 환한 광채',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'hydration',
            prompt: `[ONE IMAGE = ONE BENEFIT: 보습]
Mask Pack HYDRATION benefit visualization only.
Water droplets, dewy moisture concept on skin.
Sheet mask essence dripping with hydration.
Fresh, water-filled, moisturizing feeling.
Clean white/blue background. Korean mask pack aesthetic.
ONLY hydration benefit. NO calming. NO brightening. NO text.`,
            overlayGuide: '집중 보습 / 수분 폭탄 마스크',
          },
          {
            index: 1,
            conceptType: 'calming',
            prompt: `[ONE IMAGE = ONE BENEFIT: 진정]
Mask Pack CALMING benefit visualization only.
Soothing, cooling sensation concept.
Green/mint tones, centella/aloe imagery.
Calm, relieved, sensitive skin-friendly feeling.
Soft green/white background. Korean mask pack aesthetic.
ONLY calming benefit. NO hydration. NO brightening. NO text.`,
            overlayGuide: '피부 진정 / 민감 피부도 OK',
          },
          {
            index: 2,
            conceptType: 'firming',
            prompt: `[ONE IMAGE = ONE BENEFIT: 탄력]
Mask Pack FIRMING benefit visualization only.
Lifted, firm, bouncy skin concept.
Elastic, youthful skin texture.
Anti-aging, collagen boost feeling.
Cream/gold background. Korean mask pack aesthetic.
ONLY firming benefit. NO hydration. NO calming. NO text.`,
            overlayGuide: '탄력 부스팅 / 탱탱한 피부',
          },
          {
            index: 3,
            conceptType: 'brightening',
            prompt: `[ONE IMAGE = ONE BENEFIT: 광채]
Mask Pack BRIGHTENING benefit visualization only.
Glowing, radiant, luminous skin concept.
Light reflecting off healthy bright skin.
Vitamin C or niacinamide glow feeling.
Bright white/yellow background. Korean mask pack aesthetic.
ONLY brightening benefit. NO hydration. NO firming. NO text.`,
            overlayGuide: '환한 광채 / 칙칙함 케어',
          },
        ],
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
      {
        categoryKeywords: ['마스크팩', '시트마스크', '마스크', '팩', '패치'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE TEXTURE TYPE - 이 이미지는 단 하나의 텍스처만 보여줍니다]

Mask Pack TEXTURE close-up for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE texture aspect
- Do NOT combine sheet and essence in same focus
- Each texture type gets its own separate image block

[STYLE]
- Korean sheet mask texture aesthetic
- Fresh, hydrating, luxurious feeling
- Close-up macro photography
- No text in image

CRITICAL: ONE texture type only. NO combining multiple aspects. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '시트 재질 / 에센스 점도',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'sheet-material',
            prompt: `[ONE IMAGE = ONE TEXTURE: 시트 재질]
Mask Pack SHEET MATERIAL texture only.
Close-up of sheet mask fabric texture:
- Microfiber: ultra-fine, soft, skin-like
- Hydrogel: transparent, jiggly, cooling
- Cotton: natural, breathable weave
- Tencel: smooth, biodegradable feel
Sheet material clearly visible, luxurious quality.
Clean white background. Korean mask pack aesthetic.
ONLY sheet texture. NO essence. NO face. NO text.`,
            overlayGuide: '마이크로파이버 시트 / 피부 밀착',
          },
          {
            index: 1,
            conceptType: 'essence-texture',
            prompt: `[ONE IMAGE = ONE TEXTURE: 에센스 점도]
Mask Pack ESSENCE texture only.
Essence dripping from sheet mask showing viscosity:
- Watery: light, quick absorption
- Gel: medium, bouncy texture
- Creamy: rich, nourishing consistency
- Milky: soft, gentle formula
Essence texture clearly visible, luxurious amount.
Clean white/blue background. Korean mask pack aesthetic.
ONLY essence texture. NO sheet material focus. NO text.`,
            overlayGuide: '고농축 에센스 / 촉촉한 보습',
          },
        ],
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
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COMPARISON TYPE - 이 이미지는 단 하나의 비교 타입만 보여줍니다]

Skincare BEFORE-AFTER result for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE before-after comparison
- Do NOT combine multiple comparison types in one image
- Each comparison concept gets its own separate image block

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

CRITICAL: ONE comparison type only. NO combining multiple types. NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 4주 사용 결과 / 수분량 92% 증가 / 피부결 개선 89%',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'moisture-hydration',
            prompt: `[ONE IMAGE = ONE COMPARISON: 보습/수분 비포애프터]
Skincare MOISTURE BEFORE-AFTER comparison only.
BEFORE (LEFT): Dry, dull skin with visible flakiness
AFTER (RIGHT): Hydrated, dewy, plump skin
Same Korean model cheek close-up. Consistent lighting and angle.
Clear moisture improvement visible. Cream/white background.
ONLY moisture comparison. NO other skin concerns. NO text.`,
            overlayGuide: '수분량 92% 증가 / 촉촉한 피부로',
          },
          {
            index: 1,
            conceptType: 'texture-pores',
            prompt: `[ONE IMAGE = ONE COMPARISON: 피부결 비포애프터]
Skincare TEXTURE BEFORE-AFTER comparison only.
BEFORE (LEFT): Rough texture, visible pores, uneven
AFTER (RIGHT): Smooth, refined texture, minimized pores
Same Korean model skin close-up. Skin texture clearly visible.
Natural improvement, not plastic. Cream/white background.
ONLY texture comparison. NO moisture/glow focus. NO text.`,
            overlayGuide: '피부결 개선 89% / 매끄러운 피부',
          },
        ],
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COMPARISON TYPE - 이 이미지는 단 하나의 비교 타입만 보여줍니다]

Foundation BEFORE-AFTER coverage result for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE before-after comparison
- Do NOT combine coverage and longevity in one image
- Each comparison concept gets its own separate image block

[COMPOSITION]
- Korean model face
- Split or side-by-side comparison
- Soft beige background
- Space for time/coverage statistics

[STYLE]
- Korean base makeup result aesthetic
- Natural coverage visible
- Professional beauty photography

[KEYWORDS: 커버력, 지속력, 자연스러움, 피부 표현, 무너짐 없는]

CRITICAL: ONE comparison type only. NO combining multiple tests. NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 자연스러운 커버력 / 12시간 지속력 테스트',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'coverage-test',
            prompt: `[ONE IMAGE = ONE COMPARISON: 커버력 비포애프터]
Foundation COVERAGE BEFORE-AFTER comparison only.
BEFORE (LEFT): Bare skin with redness, blemishes, dark spots
AFTER (RIGHT): Natural coverage, skin looks even and healthy
Same face/cheek area. "Your skin but better" concept.
Natural finish visible. Soft beige background.
ONLY coverage comparison. NO longevity test. NO text.`,
            overlayGuide: '자연스러운 커버력 / 결점 커버',
          },
          {
            index: 1,
            conceptType: 'longevity-test',
            prompt: `[ONE IMAGE = ONE COMPARISON: 지속력 비포애프터]
Foundation LONGEVITY BEFORE-AFTER comparison only.
BEFORE (LEFT): Fresh application at 0 hour
AFTER (RIGHT): After 8-12 hours wear still fresh
No cakey or separated appearance. Natural finish maintained.
Skin texture visible. Soft beige background.
ONLY longevity test. NO coverage comparison. NO text.`,
            overlayGuide: '12시간 지속력 / 무너짐 없이',
          },
        ],
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COMPARISON TYPE - 이 이미지는 단 하나의 비교 타입만 보여줍니다]

Lip product BEFORE-AFTER result for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE before-after comparison
- Do NOT combine color payoff and longevity in one image
- Each comparison concept gets its own separate image block

[COMPOSITION]
- Korean model lips close-up
- Pink/nude background
- Space for wear time statistics

[STYLE]
- Korean lip product result aesthetic
- Natural, healthy lip texture
- Trendy K-beauty lip look

[KEYWORDS: 발색, 지속력, 착색력, 촉촉함]

CRITICAL: ONE comparison type only. NO combining multiple tests. NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 선명한 발색 / 8시간 지속력',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'color-payoff',
            prompt: `[ONE IMAGE = ONE COMPARISON: 발색 비포애프터]
Lip product COLOR BEFORE-AFTER comparison only.
BEFORE (LEFT): Bare lips, natural lip color
AFTER (RIGHT): Product applied with full color payoff
Close-up lip shot. Color and texture clearly visible.
Pink/nude background. Korean lip product aesthetic.
ONLY color comparison. NO longevity test. NO text.`,
            overlayGuide: '선명한 발색 / 풀 컬러 페이오프',
          },
          {
            index: 1,
            conceptType: 'longevity-test',
            prompt: `[ONE IMAGE = ONE COMPARISON: 지속력 비포애프터]
Lip product LONGEVITY BEFORE-AFTER comparison only.
BEFORE (LEFT): Fresh application
AFTER (RIGHT): After eating/drinking/hours of wear
Color retention visible. No feathering or fading.
Pink/nude background. Korean lip product aesthetic.
ONLY longevity test. NO color comparison. NO text.`,
            overlayGuide: '8시간 지속력 / 먹고 마셔도 그대로',
          },
        ],
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COMPARISON TYPE - 이 이미지는 단 하나의 비교 타입만 보여줍니다]

Suncare BEFORE-AFTER result for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE before-after comparison
- Do NOT combine white cast test and tone-up in one image
- Each comparison concept gets its own separate image block

[COMPOSITION]
- Korean model skin
- Bright clean background
- Space for SPF/PA rating

[STYLE]
- Korean suncare result aesthetic
- Fresh, natural finish
- No white residue visible

[KEYWORDS: 무백탁, 톤업, 자연스러운, 가벼운]

CRITICAL: ONE comparison type only. NO combining multiple tests. NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 무백탁 포뮬러 / 자연스러운 톤업',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'no-white-cast',
            prompt: `[ONE IMAGE = ONE COMPARISON: 백탁 테스트 비포애프터]
Suncare WHITE CAST BEFORE-AFTER comparison only.
BEFORE (LEFT): Product application moment, white visible
AFTER (RIGHT): Fully absorbed, no white cast
Same skin area. Natural skin tone visible after.
Bright clean background. Korean suncare aesthetic.
ONLY white cast test. NO tone-up comparison. NO text.`,
            overlayGuide: '무백탁 포뮬러 / 자연스러운 흡수',
          },
          {
            index: 1,
            conceptType: 'tone-up-effect',
            prompt: `[ONE IMAGE = ONE COMPARISON: 톤업 효과 비포애프터]
Suncare TONE-UP BEFORE-AFTER comparison only.
BEFORE (LEFT): Bare skin tone
AFTER (RIGHT): Brightened, even skin tone
Natural glow, not chalky. Light reflecting healthily.
Bright clean background. Korean suncare aesthetic.
ONLY tone-up comparison. NO white cast test. NO text.`,
            overlayGuide: '자연스러운 톤업 / 환한 피부',
          },
        ],
      },
      {
        categoryKeywords: ['마스크팩', '시트마스크', '마스크', '팩', '패치'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE COMPARISON TYPE - 이 이미지는 단 하나의 비교 타입만 보여줍니다]

Mask Pack BEFORE-AFTER result for Korean beauty detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE before-after comparison
- Do NOT combine multiple skin benefits in one image
- Each comparison concept gets its own separate image block

[COMPOSITION]
- Korean model skin close-up
- Split screen or side-by-side
- Cream/white/soft blue background
- Bottom 25% for result statistics text

[STYLE]
- Korean mask pack result aesthetic
- Spa-like, fresh, hydrated
- Believable improvement
- Professional dermatology documentation style

[KEYWORDS: 수분, 진정, 탄력, 광채, 피부결 개선]

CRITICAL: ONE comparison type only. NO combining multiple results. NO text in image.`,
        suggestedImageCount: 2,
        overlayTextGuide: 'BEFORE → AFTER / 15분 사용 결과 / 수분량 150% 증가 / 피부 진정 효과',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'hydration-result',
            prompt: `[ONE IMAGE = ONE COMPARISON: 수분 비포애프터]
Mask Pack HYDRATION BEFORE-AFTER comparison only.
BEFORE (LEFT): Dry, dull, dehydrated skin
AFTER (RIGHT): Plump, dewy, hydrated skin
Same Korean model cheek close-up. Consistent lighting.
Clear moisture improvement visible. Cream/white background.
ONLY hydration result. NO firming. NO brightening. NO text.`,
            overlayGuide: '수분량 150% 증가 / 촉촉한 피부로',
          },
          {
            index: 1,
            conceptType: 'glow-result',
            prompt: `[ONE IMAGE = ONE COMPARISON: 광채 비포애프터]
Mask Pack GLOW BEFORE-AFTER comparison only.
BEFORE (LEFT): Dull, tired, lackluster skin
AFTER (RIGHT): Glowing, radiant, luminous skin
Same Korean model face. Light reflecting off healthy skin.
Clear brightening improvement. Cream/white background.
ONLY glow result. NO hydration. NO firming. NO text.`,
            overlayGuide: '환한 광채 피부 / 칙칙함 개선',
          },
        ],
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
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model SKINCARE beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine multiple shots in one image
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Glowing, dewy skin (촉촉한 광채 피부)
- Natural no-makeup or minimal makeup look
- Healthy, hydrated skin appearance

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

CRITICAL: ONE shot type only. NO combining multiple concepts.`,
        suggestedImageCount: 2,
        overlayTextGuide: '피부 컨셉 문구 (예: "매일 아침 빛나는 피부")',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'face-closeup',
            prompt: `[ONE IMAGE = ONE SHOT: 피부 클로즈업]
Korean female model FACE CLOSE-UP shot only.
Cheek/face showing dewy, glowing "glass skin".
Natural light highlighting skin quality and texture.
Soft cream background. Korean skincare aesthetic.
ONLY face close-up. NO full portrait. NO product in hand. NO text.`,
            overlayGuide: '촉촉한 광채 피부 / 수분 가득',
          },
          {
            index: 1,
            conceptType: 'half-portrait',
            prompt: `[ONE IMAGE = ONE SHOT: 하프 포트레이트]
Korean female model HALF PORTRAIT shot only.
Model gently touching face with serene expression.
Skincare routine feeling, relaxed morning mood.
Soft cream background. Korean skincare aesthetic.
ONLY half portrait. NO extreme close-up. NO product application. NO text.`,
            overlayGuide: '매일 아침 빛나는 피부',
          },
        ],
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model LIP beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine multiple shots in one image
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Beautiful lip shape
- Trendy K-beauty lip makeup
- Natural, healthy appearance

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

CRITICAL: ONE shot type only. NO combining multiple angles. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '립 컨셉 문구 (예: "생기 가득한 입술", "트렌디한 데일리 립")',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'lip-focus-closeup',
            prompt: `[ONE IMAGE = ONE SHOT: 입술 클로즈업]
Korean female model LIP CLOSE-UP shot only.
Lower face focus (nose to chin) showing lips with product applied.
Color payoff and texture clearly visible. Soft pink background.
Korean lip brand aesthetic (Romand, Peripera style).
ONLY lip close-up. NO full face. NO profile shot. NO text.`,
            overlayGuide: '선명한 발색 / 촉촉한 입술',
          },
          {
            index: 1,
            conceptType: 'full-face-beauty',
            prompt: `[ONE IMAGE = ONE SHOT: 풀페이스 뷰티]
Korean female model FULL FACE beauty shot only.
Complete K-beauty makeup look with lip product as focal point.
Coordinated eye makeup, natural skin. Trendy youthful vibe.
Soft pink/cream background. Korean lip brand aesthetic.
ONLY full face. NO extreme close-up. NO profile angle. NO text.`,
            overlayGuide: '트렌디한 데일리 립',
          },
        ],
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model BASE MAKEUP beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine multiple shots in one image
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Flawless base makeup appearance
- Natural, skin-like finish
- Not cakey or heavy looking

[COMPOSITION]
- Soft beige/cream background
- Editorial beauty lighting
- Text space at bottom 25%

[STYLE]
- Korean base makeup aesthetic
- Natural, skin-like coverage
- "Glass skin" or "Chok-chok" finish

[KEYWORDS: 커버력, 지속력, 자연스러움, 피부 표현]

CRITICAL: ONE shot type only. NO combining multiple concepts. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '베이스 컨셉 문구 (예: "마치 피부처럼", "하루 종일 무너짐 없이")',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'skin-closeup',
            prompt: `[ONE IMAGE = ONE SHOT: 피부 클로즈업]
Korean female model SKIN CLOSE-UP shot only.
Cheek/face showing base makeup finish. Dewy or semi-matte visible.
Pores minimized but natural. "Your skin but better" concept.
Soft beige background. Korean base makeup aesthetic.
ONLY skin close-up. NO full face portrait. NO text.`,
            overlayGuide: '마치 피부처럼 / 자연스러운 커버력',
          },
          {
            index: 1,
            conceptType: 'full-face-beauty',
            prompt: `[ONE IMAGE = ONE SHOT: 풀페이스 뷰티]
Korean female model FULL FACE beauty shot only.
Complete makeup look with base as star, other makeup minimal.
Natural, perfected skin appearance. Coverage visible but natural.
Soft cream background. Korean base makeup aesthetic.
ONLY full face. NO extreme close-up. NO text.`,
            overlayGuide: '하루 종일 무너짐 없이',
          },
        ],
      },
      {
        categoryKeywords: ['아이메이크업', '아이섀도우', '마스카라'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model EYE MAKEUP beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine multiple shots in one image
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Beautiful eye shape
- Trendy K-beauty eye makeup

[COMPOSITION]
- Neutral/cream background
- Close-up beauty photography
- Text space at side 30%

[STYLE]
- Korean eye makeup aesthetic
- Natural to glam looks
- Soft, flattering lighting

[KEYWORDS: 발색, 블렌딩, 지속력, 다양한 연출]

CRITICAL: ONE shot type only. NO combining multiple angles. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '아이 컨셉 문구 (예: "다양한 무드 연출", "선명한 발색")',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'eye-closeup',
            prompt: `[ONE IMAGE = ONE SHOT: 아이 클로즈업]
Korean female model EYE CLOSE-UP shot only.
Eye area focus showing eyeshadow/mascara clearly visible.
Color payoff and blending clear. Korean eye makeup aesthetic.
Neutral/cream background. Soft flattering lighting.
ONLY eye close-up. NO full face. NO text.`,
            overlayGuide: '선명한 발색 / 자연스러운 블렌딩',
          },
          {
            index: 1,
            conceptType: 'half-face',
            prompt: `[ONE IMAGE = ONE SHOT: 하프 페이스]
Korean female model HALF FACE shot only.
Eyes as focus, lips minimal. Showing complete eye look.
Trendy K-beauty eye makeup. Natural to glam vibe.
Neutral/cream background. Professional beauty photography.
ONLY half face. NO extreme close-up. NO text.`,
            overlayGuide: '다양한 무드 연출',
          },
        ],
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model SUNCARE beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine multiple shots in one image
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Fresh, healthy appearance
- Outdoor-ready or sun-protected feeling
- Natural glow

[COMPOSITION]
- Bright white/yellow-tinted background
- Fresh, sunny atmosphere
- Text space at bottom 25%

[STYLE]
- Korean suncare aesthetic
- Fresh, healthy, protected
- Bright, energetic mood

[KEYWORDS: 자외선 차단, 톤업, 촉촉한, 가벼운]

CRITICAL: ONE shot type only. NO combining multiple concepts. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '선케어 컨셉 문구 (예: "자외선 걱정 없이", "매일의 피부 보호")',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'fresh-face',
            prompt: `[ONE IMAGE = ONE SHOT: 프레시 페이스]
Korean female model FRESH FACE shot only.
Bright, protected skin look. No white cast visible.
Tone-up effect if applicable. Glowing healthy skin.
Bright white background. Korean suncare aesthetic.
ONLY fresh face. NO outdoor scene. NO text.`,
            overlayGuide: '자연스러운 톤업 / 무백탁',
          },
          {
            index: 1,
            conceptType: 'outdoor-vibe',
            prompt: `[ONE IMAGE = ONE SHOT: 아웃도어 바이브]
Korean female model OUTDOOR VIBE shot only.
Sunny, fresh feeling. Model in bright outdoor setting.
Confident, protected appearance. Sun-protected confidence.
Yellow-tinted bright background. Fresh energetic mood.
ONLY outdoor vibe. NO studio close-up. NO text.`,
            overlayGuide: '자외선 걱정 없이 / 매일의 피부 보호',
          },
        ],
      },
      {
        categoryKeywords: ['마스크팩', '시트마스크', '마스크', '팩', '패치'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE SHOT TYPE - 이 이미지는 단 하나의 샷 타입만 보여줍니다]

Korean female model MASK PACK beauty shot for detail page.

[SINGLE FOCUS RULE]
- This image shows ONLY ONE shot type
- Do NOT combine wearing and result shots
- Each shot concept gets its own separate image block

[MODEL]
- Korean female, 20s-30s
- Sheet mask on face (wearing shot) OR
- Glowing skin after removal (result shot)
- Relaxed, spa-like expression

[COMPOSITION]
- Soft white/blue/cream background
- Text space at side 25% OR bottom 20%
- Spa-like, relaxing atmosphere

[STYLE]
- Korean sheet mask brand aesthetic
- Self-care, pampering feeling
- Soft, calming lighting
- Fresh, hydrated appearance

[KEYWORDS: 셀프케어, 수분충전, 릴렉싱, 광채]

CRITICAL: ONE shot type only. NO combining multiple concepts. NO text.`,
        suggestedImageCount: 2,
        overlayTextGuide: '마스크 착용샷 / 사용 후 광채 피부',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'wearing-shot',
            prompt: `[ONE IMAGE = ONE SHOT: 마스크 착용]
Korean female model MASK WEARING shot only.
Model with sheet mask on face, relaxed expression.
Eyes closed or looking at camera through mask.
Self-care, spa moment, pampering feeling.
Clean soft blue/white background. Calming atmosphere.
Korean mask pack brand aesthetic.
ONLY wearing shot. NO bare face. NO result shot. NO text.`,
            overlayGuide: '셀프케어 타임 / 집에서 스파처럼',
          },
          {
            index: 1,
            conceptType: 'result-shot',
            prompt: `[ONE IMAGE = ONE SHOT: 사용 후 결과]
Korean female model AFTER MASK RESULT shot only.
Model with bare face after mask removal.
Glowing, dewy, hydrated skin visible.
Satisfied, refreshed expression. Glass skin appearance.
Soft cream background. Korean mask pack aesthetic.
ONLY result shot. NO mask wearing. NO application. NO text.`,
            overlayGuide: '사용 후 촉촉 광채 피부',
          },
        ],
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
- Sharp product details visible
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
- product details crisp and clear
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
- applicator details visible
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
- compact details crisp
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
- texture and detail clearly visible
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
- Photorealistic
- Skin texture visible
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 특징 표기: 완벽 커버력, 24시간 지속력, 촉촉 광채 피부표현, 무결점 피부 등',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'coverage',
            prompt: `[ONE IMAGE = ONE BENEFIT: 커버력]
Foundation/Cushion COVERAGE demonstration only.
Korean female model face showing BEFORE-AFTER coverage concept.
LEFT/BEFORE: Visible skin imperfections (redness, dark spots, blemishes)
RIGHT/AFTER: Same area with flawless coverage, skin looks even
Split-face or side-by-side comparison. Natural believable coverage.
Clean beige background. Korean base makeup aesthetic.
ONLY coverage demonstration. NO longevity test. NO finish showcase. NO text.`,
            overlayGuide: '완벽 커버력 / 결점 커버',
          },
          {
            index: 1,
            conceptType: 'longevity',
            prompt: `[ONE IMAGE = ONE BENEFIT: 지속력]
Foundation/Cushion LONGEVITY demonstration only.
Time-comparison concept: Morning application vs. Evening (8-12 hours later).
Korean female model face showing makeup still fresh after hours of wear.
No cakey texture, no separation, no creasing. Fresh finish maintained.
Subtle clock/time visual element in corner (optional).
Clean beige background. Korean base makeup aesthetic.
ONLY longevity demonstration. NO coverage test. NO finish showcase. NO text.`,
            overlayGuide: '24시간 지속력 / 무너짐 없이',
          },
          {
            index: 2,
            conceptType: 'skin-finish',
            prompt: `[ONE IMAGE = ONE BENEFIT: 피부 표현]
Foundation/Cushion SKIN FINISH showcase only.
Korean female model cheek close-up showing finish type clearly.
Choose ONE finish to demonstrate:
- DEWY: Light reflecting off cheekbones, healthy glowing sheen
- SEMI-MATTE: Natural skin-like finish, "your skin but better"
- MATTE: Poreless smooth appearance, oil-controlled
Macro skin photography showing texture quality.
Clean beige background. Korean base makeup aesthetic.
ONLY skin finish showcase. NO coverage test. NO longevity test. NO text.`,
            overlayGuide: '촉촉 광채 피부표현 / 자연스러운 마무리',
          },
          {
            index: 3,
            conceptType: 'lightweight',
            prompt: `[ONE IMAGE = ONE BENEFIT: 가벼운 착용감]
Foundation/Cushion LIGHTWEIGHT FEEL visualization only.
Korean female model face showing comfortable, breathable makeup wear.
Visual metaphor: feather near skin, or airy light feeling concept.
Thin, natural layer visible - not cakey or heavy looking.
Side-profile or 3/4 angle showing natural, comfortable appearance.
Clean beige background. Korean base makeup aesthetic.
ONLY lightweight feel concept. NO coverage. NO longevity. NO text.`,
            overlayGuide: '무결점 피부 / 가벼운 착용감',
          },
        ],
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
- Macro photography
- Ingredient and texture detail sharp
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 성분/효과 표기: 무화과 추출물 함유, 히알루론산 보습, 벨벳 텍스처, 립케어 효과 등',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'color-ingredient',
            prompt: `[ONE IMAGE = ONE CONCEPT: 컬러 성분]
Lip product COLOR INGREDIENT visualization only.
Fresh fruit or flower matching shade name (fig, cherry, rose, peach, berry).
Artistic arrangement: sliced fruit/flower petals + lip product swatch.
Matching colors between ingredient and product. Fresh, appetizing feeling.
Soft pink/coral background. Korean lip product aesthetic.
ONLY color ingredient visual. NO texture. NO lip care. NO text.`,
            overlayGuide: '무화과 추출물 함유 / 자연 유래 컬러',
          },
          {
            index: 1,
            conceptType: 'moisturizing-ingredient',
            prompt: `[ONE IMAGE = ONE CONCEPT: 보습 성분]
Lip product MOISTURIZING INGREDIENT visualization only.
Key moisturizing ingredient visual:
- Hyaluronic acid: water droplets, hydration splash concept
- Shea butter: creamy butter texture swirl
- Vitamin E: golden oil drops, nourishing
Ingredient near lip product or small lip swatch.
Soft pink background. Korean lip product aesthetic.
ONLY moisturizing ingredient. NO texture. NO color concept. NO text.`,
            overlayGuide: '히알루론산 보습 / 촉촉한 입술 케어',
          },
          {
            index: 2,
            conceptType: 'texture-closeup',
            prompt: `[ONE IMAGE = ONE CONCEPT: 텍스처]
Lip product TEXTURE close-up only.
Macro shot of lip product texture clearly showing finish type:
- GLOSSY: Mirror-like shine, light reflection, wet look
- VELVET: Soft-focus, plush, cushiony texture
- MATTE: Smooth, powdery, sophisticated finish
Product smear on glass or bullet close-up showing texture.
Soft pink background. Korean lip product aesthetic.
ONLY texture showcase. NO ingredients. NO lip care. NO text.`,
            overlayGuide: '벨벳 텍스처 / 부드러운 발림성',
          },
          {
            index: 3,
            conceptType: 'lip-care-benefit',
            prompt: `[ONE IMAGE = ONE CONCEPT: 립케어 효과]
Lip product LIP CARE BENEFIT visualization only.
Before-after showing lip improvement:
- BEFORE: Dry, chapped lips
- AFTER: Nourished, plump, healthy lips
Or: Plumping effect visualization with glossy, full lips.
Korean model lips close-up. Pink/nude background.
ONLY lip care benefit. NO color ingredient. NO texture. NO text.`,
            overlayGuide: '립케어 효과 / 건조함 케어',
          },
        ],
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
- ingredient and texture detail
- No text in image`,
        suggestedImageCount: 4,
        overlayTextGuide: '각 이미지에 성분명 + 효능: 히알루론산 5중 복합체, 비타민C 10% 고농축, 병풀 추출물 진정 효과 등',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'hero-ingredient',
            prompt: `[ONE IMAGE = ONE CONCEPT: 히어로 성분]
Skincare HERO INGREDIENT visualization only.
Main active ingredient beautifully visualized:
- Hyaluronic acid: water droplets, hydration splash
- Vitamin C: fresh citrus slices, bright yellow/orange
- CICA/Centella: green cica leaves, calming
- Niacinamide: clean, bright, scientific vial
- Retinol: golden serum drops, anti-aging luxury
Ingredient arranged with product bottle or serum drops.
Clean white/soft blue background. Korean skincare aesthetic.
ONLY hero ingredient. NO texture. NO concentration. NO text.`,
            overlayGuide: '히알루론산 5중 복합체 / 핵심 성분',
          },
          {
            index: 1,
            conceptType: 'texture-showcase',
            prompt: `[ONE IMAGE = ONE CONCEPT: 텍스처 쇼케이스]
Skincare TEXTURE showcase only.
Product texture on glass petri dish or skin surface.
Consistency clearly visible:
- GEL: Clear, jiggly, fresh
- CREAM: Rich, smooth swirl
- WATER: Light, flowing droplets
- OIL: Golden, glossy drops
Scientific yet beautiful presentation.
Clean white background. Korean skincare aesthetic.
ONLY texture showcase. NO ingredient visual. NO results. NO text.`,
            overlayGuide: '가벼운 워터 텍스처 / 빠른 흡수',
          },
          {
            index: 2,
            conceptType: 'concentration-potency',
            prompt: `[ONE IMAGE = ONE CONCEPT: 고농축 성분]
Skincare CONCENTRATION/POTENCY visualization only.
High concentration concept:
- Percentage visual metaphor (10%, 15%, 20% feeling)
- Dropper releasing concentrated serum drops
- Potent, effective, clinical yet premium feeling
- Dense, concentrated formula visualization
Scientific vial or dropper close-up.
Clean white/blue background. Korean skincare aesthetic.
ONLY concentration concept. NO ingredient. NO result. NO text.`,
            overlayGuide: '비타민C 10% 고농축 / 고함량 처방',
          },
          {
            index: 3,
            conceptType: 'skin-benefit-result',
            prompt: `[ONE IMAGE = ONE CONCEPT: 피부 결과]
Skincare SKIN BENEFIT RESULT visualization only.
Before-after skin improvement:
- BEFORE: Dull, tired, problematic skin
- AFTER: Glowing, hydrated, clear skin
Or abstract healthy skin texture close-up.
Korean model skin or artistic skin representation.
Cream/white background. Korean skincare aesthetic.
ONLY skin result. NO ingredients. NO texture. NO text.`,
            overlayGuide: '사용 후 환한 피부 / 눈에 보이는 효과',
          },
        ],
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
- clear detail
- No text in image`,
        suggestedImageCount: 3,
        overlayTextGuide: '각 이미지에 특징: SPF50+ PA++++ 자외선 차단, 무백탁 톤업, 워터프루프 등',
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'uv-protection',
            prompt: `[ONE IMAGE = ONE CONCEPT: 자외선 차단]
Suncare UV PROTECTION visualization only.
UV ray concept with protective barrier/shield visual.
Sun rays being blocked by invisible shield metaphor.
Scientific diagram feel but beautiful and approachable.
Clean skin protected from UV, healthy appearance.
Bright sunny yellow/white background. Korean suncare aesthetic.
ONLY UV protection concept. NO texture. NO water resistance. NO text.`,
            overlayGuide: 'SPF50+ PA++++ / 강력한 자외선 차단',
          },
          {
            index: 1,
            conceptType: 'texture-finish',
            prompt: `[ONE IMAGE = ONE CONCEPT: 텍스처 & 피니쉬]
Suncare TEXTURE and FINISH demonstration only.
Product swatch on Korean model arm or face showing:
- No white cast: natural skin tone visible
- Tone-up effect: subtle brightening
- Lightweight, non-greasy finish
Texture spreading smoothly on skin.
Bright white/cream background. Korean suncare aesthetic.
ONLY texture/finish. NO UV protection. NO water test. NO text.`,
            overlayGuide: '무백탁 포뮬러 / 자연스러운 톤업',
          },
          {
            index: 2,
            conceptType: 'water-resistance',
            prompt: `[ONE IMAGE = ONE CONCEPT: 내수성/지속력]
Suncare WATER/SWEAT RESISTANCE demonstration only.
Water droplets beading on skin with sunscreen applied.
Active outdoor feeling, product staying intact.
Fresh, protective, confident mood.
Or sweat-proof demonstration during activity.
Bright sunny background. Korean suncare aesthetic.
ONLY water resistance. NO UV concept. NO texture test. NO text.`,
            overlayGuide: '워터프루프 / 물과 땀에 강한',
          },
        ],
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
- clear demonstration visible
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
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE STEP - 이 이미지는 단 하나의 단계만 보여줍니다]

Skincare STEP-BY-STEP APPLICATION for Korean beauty detail page.

[SINGLE STEP RULE]
- This image shows ONLY ONE step
- Do NOT combine multiple steps in one image
- Each step gets its own separate image block

[STYLE]
- Korean skincare routine tutorial aesthetic
- Soft, flattering lighting on skin
- Clean white/neutral background
- Professional beauty photography

[QUALITY]
- skin texture and product visible
- No text in image

CRITICAL: ONE step only. NO combining multiple steps. NO text.`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 스포이드로 2-3방울 덜어주세요
STEP 2: 손바닥에서 체온으로 데워주세요
STEP 3: 얼굴 중앙에서 바깥쪽으로 펴 발라주세요
STEP 4: 손바닥으로 가볍게 눌러 흡수시켜주세요`,
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'step-1-dispense',
            prompt: `[ONE IMAGE = STEP 1: 적정량 덜기]
Skincare DISPENSE step only.
Hand holding product, dispensing appropriate amount.
Dropper releasing serum drops OR pump dispensing cream.
Show recommended amount (coin-size, 2-3 drops, pea-size).
Clean bright background. Korean skincare aesthetic.
ONLY dispense step. NO application. NO face. NO text.`,
            overlayGuide: 'STEP 1: 스포이드로 2-3방울 덜어주세요',
          },
          {
            index: 1,
            conceptType: 'step-2-warm',
            prompt: `[ONE IMAGE = STEP 2: 손에서 데우기]
Skincare WARMING step only.
Product on fingertips or palms.
Warming gesture - rubbing palms together gently.
Product texture visible on hands.
Clean bright background. Korean skincare aesthetic.
ONLY warming step. NO dispense. NO face application. NO text.`,
            overlayGuide: 'STEP 2: 손바닥에서 체온으로 데워주세요',
          },
          {
            index: 2,
            conceptType: 'step-3-apply',
            prompt: `[ONE IMAGE = STEP 3: 얼굴에 도포]
Skincare APPLICATION step only.
Korean female model applying product to face.
Specific application area (cheeks, forehead, chin).
Gentle patting or smoothing motion. Natural skin.
Clean white background. Korean skincare aesthetic.
ONLY application step. NO dispense. NO absorption. NO text.`,
            overlayGuide: 'STEP 3: 얼굴 중앙에서 바깥쪽으로 펴 발라주세요',
          },
          {
            index: 3,
            conceptType: 'step-4-absorb',
            prompt: `[ONE IMAGE = STEP 4: 흡수시키기]
Skincare ABSORPTION step only.
Patting motion on face for absorption.
Gentle massage in circular motions.
Product absorbing into skin. Glowing result.
Clean white background. Korean skincare aesthetic.
ONLY absorption step. NO dispense. NO application. NO text.`,
            overlayGuide: 'STEP 4: 손바닥으로 가볍게 눌러 흡수시켜주세요',
          },
        ],
      },
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE STEP - 이 이미지는 단 하나의 단계만 보여줍니다]

Foundation/Cushion APPLICATION for Korean beauty detail page.

[SINGLE STEP RULE]
- This image shows ONLY ONE step
- Do NOT combine multiple steps in one image
- Each step gets its own separate image block

[STYLE]
- Korean makeup tutorial aesthetic
- Good lighting showing skin and coverage
- Professional yet relatable

[QUALITY]
- makeup application clearly visible
- No text in image

CRITICAL: ONE step only. NO combining multiple steps. NO text.`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 스킨케어로 피부를 정돈해주세요
STEP 2: 퍼프에 적당량을 묻혀주세요
STEP 3: 얼굴 중앙부터 바깥쪽으로 톡톡 스탬핑해주세요
STEP 4: 헤어라인과 턱선을 자연스럽게 블렌딩해주세요`,
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'step-1-prep',
            prompt: `[ONE IMAGE = STEP 1: 피부 정돈]
Foundation SKIN PREP step only.
Clean, prepped skin ready for makeup.
Or primer application final step. Fresh face.
Beige/cream background. Korean makeup aesthetic.
ONLY prep step. NO product pickup. NO application. NO text.`,
            overlayGuide: 'STEP 1: 스킨케어로 피부를 정돈해주세요',
          },
          {
            index: 1,
            conceptType: 'step-2-pickup',
            prompt: `[ONE IMAGE = STEP 2: 제품 묻히기]
Foundation PRODUCT PICKUP step only.
Puff/sponge pressing into cushion or foundation.
Show appropriate amount on applicator.
Product texture on puff visible. Close-up shot.
ONLY pickup step. NO face application. NO text.`,
            overlayGuide: 'STEP 2: 퍼프에 적당량을 묻혀주세요',
          },
          {
            index: 2,
            conceptType: 'step-3-stamp',
            prompt: `[ONE IMAGE = STEP 3: 스탬핑]
Foundation STAMP APPLICATION step only.
Puff stamping/pressing onto face (not dragging).
Start from center of face. Korean "stamp" technique.
Model face with puff. Beige background.
ONLY stamping step. NO blending. NO finish. NO text.`,
            overlayGuide: 'STEP 3: 얼굴 중앙부터 바깥쪽으로 톡톡 스탬핑해주세요',
          },
          {
            index: 3,
            conceptType: 'step-4-blend',
            prompt: `[ONE IMAGE = STEP 4: 블렌딩]
Foundation BLENDING step only.
Blending edges, hairline, jawline.
Seamless finish demonstration. Natural coverage.
Model face showing natural finish. Beige background.
ONLY blending step. NO stamping. NO setting. NO text.`,
            overlayGuide: 'STEP 4: 헤어라인과 턱선을 자연스럽게 블렌딩해주세요',
          },
        ],
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE STEP - 이 이미지는 단 하나의 단계만 보여줍니다]

Lip product APPLICATION for Korean beauty detail page.

[SINGLE STEP RULE]
- This image shows ONLY ONE step
- Do NOT combine multiple steps in one image
- Each step gets its own separate image block

[STYLE]
- Korean lip makeup tutorial aesthetic
- Close-up lip shots
- Clean, feminine background (pink, neutral)

[QUALITY]
- Macro photography
- Lip texture and color clearly visible
- No text in image

CRITICAL: ONE step only. NO combining multiple steps. NO text.`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 입술 각질을 정리하고 보습해주세요
STEP 2: 입술 안쪽 중앙에 제품을 발라주세요
STEP 3: 손가락으로 바깥쪽으로 톡톡 두드려 그라데이션해주세요
STEP 4: 원하는 발색까지 레이어링해주세요`,
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'step-1-prep',
            prompt: `[ONE IMAGE = STEP 1: 입술 준비]
Lip PREP step only.
Clean, exfoliated lips. Or lip balm for hydration.
Natural, soft lip texture visible.
Pink/neutral background. Korean lip aesthetic.
ONLY prep step. NO product application. NO color. NO text.`,
            overlayGuide: 'STEP 1: 입술 각질을 정리하고 보습해주세요',
          },
          {
            index: 1,
            conceptType: 'step-2-inner-apply',
            prompt: `[ONE IMAGE = STEP 2: 안쪽 발색]
Lip INNER APPLICATION step only.
Applying product to inner lip area first.
Korean gradient lip technique start.
Precise application with applicator visible.
ONLY inner application. NO blending. NO final look. NO text.`,
            overlayGuide: 'STEP 2: 입술 안쪽 중앙에 제품을 발라주세요',
          },
          {
            index: 2,
            conceptType: 'step-3-blend',
            prompt: `[ONE IMAGE = STEP 3: 그라데이션]
Lip BLENDING step only.
Finger tapping for gradient effect.
Or blending/pressing lips together.
Seamless gradient from center visible.
ONLY blending step. NO inner apply. NO final. NO text.`,
            overlayGuide: 'STEP 3: 손가락으로 바깥쪽으로 톡톡 두드려 그라데이션해주세요',
          },
          {
            index: 3,
            conceptType: 'step-4-finish',
            prompt: `[ONE IMAGE = STEP 4: 완성]
Lip FINISHED LOOK only.
Beautiful completed lip look.
Full color payoff visible. Healthy vibrant lips.
Natural or bold depending on product.
ONLY final look. NO application in progress. NO text.`,
            overlayGuide: 'STEP 4: 원하는 발색까지 레이어링해주세요',
          },
        ],
      },
      {
        categoryKeywords: ['마스크팩', '시트마스크'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE STEP - 이 이미지는 단 하나의 단계만 보여줍니다]

Sheet Mask APPLICATION for Korean beauty detail page.

[SINGLE STEP RULE]
- This image shows ONLY ONE step
- Do NOT combine multiple steps in one image
- Each step gets its own separate image block

[STYLE]
- Korean skincare routine aesthetic
- Relaxing, self-care mood
- Clean, spa-like setting

[QUALITY]
- clear demonstration
- No text in image

CRITICAL: ONE step only. NO combining multiple steps. NO text.`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 세안 후 토너로 피부결을 정돈해주세요
STEP 2: 마스크를 펼쳐 눈, 코, 입에 맞춰 올려주세요
STEP 3: 공기가 들어가지 않게 얼굴에 밀착시켜주세요
STEP 4: 15-20분 후 마스크를 벗기고 남은 에센스를 흡수시켜주세요`,
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'step-1-prep',
            prompt: `[ONE IMAGE = STEP 1: 피부 준비]
Sheet Mask SKIN PREP step only.
Clean, freshly washed face. Skin ready for mask.
Or toner application for skin prep.
White/spa background. Korean skincare aesthetic.
ONLY prep step. NO mask application. NO text.`,
            overlayGuide: 'STEP 1: 세안 후 토너로 피부결을 정돈해주세요',
          },
          {
            index: 1,
            conceptType: 'step-2-unfold',
            prompt: `[ONE IMAGE = STEP 2: 마스크 펼치기]
Sheet Mask UNFOLD & ALIGN step only.
Unfolding sheet mask from package.
Aligning with facial features (eyes, nose, mouth holes).
Hands holding unfolded mask. White background.
ONLY unfold step. NO on-face. NO finish. NO text.`,
            overlayGuide: 'STEP 2: 마스크를 펼쳐 눈, 코, 입에 맞춰 올려주세요',
          },
          {
            index: 2,
            conceptType: 'step-3-apply',
            prompt: `[ONE IMAGE = STEP 3: 밀착시키기]
Sheet Mask APPLICATION step only.
Pressing mask onto face smoothly.
Smoothing out air bubbles with fingers.
Model with mask being applied. Spa setting.
ONLY application step. NO relaxing. NO removal. NO text.`,
            overlayGuide: 'STEP 3: 공기가 들어가지 않게 얼굴에 밀착시켜주세요',
          },
          {
            index: 3,
            conceptType: 'step-4-finish',
            prompt: `[ONE IMAGE = STEP 4: 제거 및 흡수]
Sheet Mask REMOVAL & ABSORPTION step only.
Removing mask gently OR patting essence.
Glowing, hydrated skin result visible.
Model's fresh face after mask. Spa setting.
ONLY removal/finish step. NO application. NO text.`,
            overlayGuide: 'STEP 4: 15-20분 후 마스크를 벗기고 남은 에센스를 흡수시켜주세요',
          },
        ],
      },
      {
        categoryKeywords: ['선케어', '선크림'],
        imagePrompt: `[★ CRITICAL: ONE IMAGE = ONE STEP - 이 이미지는 단 하나의 단계만 보여줍니다]

Sunscreen APPLICATION for Korean beauty detail page.

[SINGLE STEP RULE]
- This image shows ONLY ONE step
- Do NOT combine multiple steps in one image
- Each step gets its own separate image block

[STYLE]
- Fresh, outdoor-ready feeling
- Bright, sunny aesthetic
- Korean suncare routine

[QUALITY]
- texture and application visible
- No text in image

CRITICAL: ONE step only. NO combining multiple steps. NO text.`,
        suggestedImageCount: 4,
        overlayTextGuide: `STEP 1: 검지, 중지 두 마디 정도의 양을 덜어주세요
STEP 2: 이마, 양볼, 코, 턱에 점을 찍어주세요
STEP 3: 안쪽에서 바깥쪽으로 고르게 펴 발라주세요
STEP 4: 목과 귀 뒤도 잊지 말고 발라주세요`,
        indexedPrompts: [
          {
            index: 0,
            conceptType: 'step-1-amount',
            prompt: `[ONE IMAGE = STEP 1: 적정량]
Sunscreen DISPENSING step only.
Two-finger rule or coin-sized amount of product.
Showing generous, adequate amount on hand.
Clean bright background. Korean suncare aesthetic.
ONLY dispense step. NO face. NO application. NO text.`,
            overlayGuide: 'STEP 1: 검지, 중지 두 마디 정도의 양을 덜어주세요',
          },
          {
            index: 1,
            conceptType: 'step-2-dot',
            prompt: `[ONE IMAGE = STEP 2: 점 찍기]
Sunscreen DOT APPLICATION step only.
Dotting sunscreen on forehead, cheeks, nose, chin.
Distribution points visible on face.
Korean female model. Bright background.
ONLY dot step. NO spreading. NO blending. NO text.`,
            overlayGuide: 'STEP 2: 이마, 양볼, 코, 턱에 점을 찍어주세요',
          },
          {
            index: 2,
            conceptType: 'step-3-spread',
            prompt: `[ONE IMAGE = STEP 3: 펴바르기]
Sunscreen SPREADING step only.
Spreading evenly across face.
Outward spreading motions. Full coverage.
Korean female model. Bright sunny background.
ONLY spreading step. NO dot. NO neck. NO text.`,
            overlayGuide: 'STEP 3: 안쪽에서 바깥쪽으로 고르게 펴 발라주세요',
          },
          {
            index: 3,
            conceptType: 'step-4-neck',
            prompt: `[ONE IMAGE = STEP 4: 목과 귀]
Sunscreen NECK & EARS step only.
Extending sunscreen to neck and behind ears.
Often-missed areas getting coverage.
Korean female model. Bright background.
ONLY neck/ears step. NO face application. NO text.`,
            overlayGuide: 'STEP 4: 목과 귀 뒤도 잊지 말고 발라주세요',
          },
        ],
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
- Photorealistic
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
- editorial photography style
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
- lifestyle photography
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
- bright lifestyle photography
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
- clean product photography
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
- clean composition
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
- beauty photography
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
- beauty photography
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
- clean and professional
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
- product clear and identifiable
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
- professional
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
- hero product photography
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
- premium product photography
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
- glamour product photography
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
- fresh product photography
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
  const mapping: Partial<Record<SectionType, ExtendedSectionType>> = {
    'MAIN': 'MAIN',       // MAIN은 독립적인 썸네일 섹션
    'HERO': 'HERO',
    'FEATURES': 'FEATURES',
    'SOCIAL_PROOF': 'SOCIAL_PROOF',
    'HOW_TO_USE': 'HOW_TO_USE',
    'FAQ': 'FAQ',
    'CUSTOM': 'FEATURES', // 기본값
    // 2차 고도화: 추가된 섹션 타입 매핑
    'PRODUCT_LINEUP': 'PRODUCT_LINEUP',
    'INGREDIENT': 'INGREDIENT',
    'TEXTURE': 'TEXTURE',
    'CTA': 'FEATURES',       // CTA는 FEATURES로 매핑
    'MODEL_SHOT': 'MODEL_SHOT',
    'SKIN_RESULT': 'SKIN_RESULT',
    'MATERIAL': 'MATERIAL',
    'LIFESTYLE': 'LIFESTYLE',
    'SPECS': 'SPECS',
    'INFO_TABLE': 'INFO_TABLE',
  };
  return mapping[sectionType] || 'FEATURES';
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

// ============================================
// 섹션별 다양한 배경색 시스템 연동
// ============================================

import {
  type PaletteTheme,
  type ColorPalette,
  COLOR_PALETTES,
  SECTION_BACKGROUND_ROLES,
  ROLE_TO_PALETTE_INDEX,
  autoSelectPalette,
  buildPaletteHarmonyPrompt,
} from './section-color-palette';

/**
 * 섹션별 다양한 배경색을 포함한 향상된 이미지 프롬프트 빌드
 *
 * @param template 섹션 템플릿
 * @param productName 제품명
 * @param palette 색상 팔레트
 * @param sectionIndex 전체 상세페이지에서 해당 섹션의 순서 (다양성 확보용)
 * @param contextOrMaterial 추가 컨텍스트 (성분, 사용 상황 등)
 */
export function buildSectionPromptWithPalette(
  template: SectionTemplate,
  productName: string,
  palette: ColorPalette,
  sectionIndex: number = 0,
  contextOrMaterial?: string
): string {
  // 섹션 역할에 맞는 배경색 선택
  const role = SECTION_BACKGROUND_ROLES[template.type];
  const colorIndices = ROLE_TO_PALETTE_INDEX[role];
  const selectedIndex = colorIndices[sectionIndex % colorIndices.length];
  const selectedColor = palette.colors[selectedIndex];

  // 기본 템플릿 프롬프트 가져오기
  let prompt = template.imagePromptTemplate;

  // 플레이스홀더 치환
  prompt = prompt.replace(/{product}/g, productName);
  prompt = prompt.replace(/{background}/g, selectedColor.promptDescription);

  if (contextOrMaterial) {
    prompt = prompt.replace(/{material}/g, contextOrMaterial);
    prompt = prompt.replace(/{context}/g, contextOrMaterial);
  } else {
    prompt = prompt.replace(/{material}/g, 'premium quality');
    prompt = prompt.replace(/{context}/g, 'modern living');
  }

  // 팔레트 조화 정보 추가
  const harmonyNote = `

[SECTION BACKGROUND: ${selectedColor.promptDescription}]
[PALETTE HARMONY: ${palette.name}]
This image is part of a cohesive ${palette.name} detail page.
Use background: ${selectedColor.promptDescription} (${selectedColor.hex})
Mood keywords: ${palette.moodKeywords.join(', ')}

IMPORTANT: This section uses a DIFFERENT background than other sections, but all backgrounds belong to the same harmonious ${palette.name} palette for visual cohesion.
`;

  return prompt + harmonyNote;
}

/**
 * 카테고리 특화 프롬프트에 팔레트 적용
 */
export function buildCategoryPromptWithPalette(
  sectionType: ExtendedSectionType,
  category: string,
  productName: string,
  palette: ColorPalette,
  sectionIndex: number = 0
): { prompt: string; suggestedImageCount: number; overlayTextGuide?: string; backgroundColor: string } {
  const template = SECTION_TEMPLATES[sectionType];
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);

  // 섹션 역할에 맞는 배경색 선택
  const role = SECTION_BACKGROUND_ROLES[sectionType];
  const colorIndices = ROLE_TO_PALETTE_INDEX[role];
  const selectedIndex = colorIndices[sectionIndex % colorIndices.length];
  const selectedColor = palette.colors[selectedIndex];

  if (categorySpecific) {
    // 카테고리 특화 프롬프트 사용
    let prompt = categorySpecific.imagePrompt;
    prompt = prompt.replace(/{product}/g, productName);
    prompt = prompt.replace(/{background}/g, selectedColor.promptDescription);

    // 팔레트 조화 정보 추가
    prompt += `

[SECTION BACKGROUND: ${selectedColor.promptDescription}]
[PALETTE: ${palette.name}]
Background color for this section: ${selectedColor.hex}
Maintain visual harmony with the overall ${palette.name} palette.
`;

    return {
      prompt,
      suggestedImageCount: categorySpecific.suggestedImageCount,
      overlayTextGuide: categorySpecific.overlayTextGuide,
      backgroundColor: selectedColor.hex,
    };
  }

  // 기본 프롬프트 사용
  const prompt = buildSectionPromptWithPalette(template, productName, palette, sectionIndex);
  return {
    prompt,
    suggestedImageCount: template.multiImage ? template.maxImageCount : 1,
    overlayTextGuide: undefined,
    backgroundColor: selectedColor.hex,
  };
}

/**
 * 전체 상세페이지용 섹션별 배경색 맵 생성
 * 각 섹션에 다른 배경색을 할당하되 팔레트 내에서 조화롭게
 */
export function generatePageBackgroundMap(
  sections: ExtendedSectionType[],
  paletteTheme: PaletteTheme
): Map<ExtendedSectionType, { hex: string; prompt: string; role: string }> {
  const palette = COLOR_PALETTES[paletteTheme];
  const result = new Map<ExtendedSectionType, { hex: string; prompt: string; role: string }>();

  // 역할별 사용 카운터 (같은 역할이라도 다른 색상 사용)
  const roleUsageCount: Record<string, number> = {};

  for (const section of sections) {
    const role = SECTION_BACKGROUND_ROLES[section];
    if (!roleUsageCount[role]) roleUsageCount[role] = 0;

    const colorIndices = ROLE_TO_PALETTE_INDEX[role];
    const usageIndex = roleUsageCount[role];
    const selectedIndex = colorIndices[usageIndex % colorIndices.length];
    const selectedColor = palette.colors[selectedIndex];

    result.set(section, {
      hex: selectedColor.hex,
      prompt: selectedColor.promptDescription,
      role,
    });

    roleUsageCount[role]++;
  }

  return result;
}

/**
 * 전체 상세페이지 생성용 마스터 프롬프트 빌드
 * 모든 섹션에 대해 조화로운 배경색 배분
 */
export function buildDetailPageMasterPrompt(
  category: string,
  productName: string,
  sections: ExtendedSectionType[],
  paletteTheme?: PaletteTheme
): {
  paletteTheme: PaletteTheme;
  palette: ColorPalette;
  harmonyPrompt: string;
  sectionPrompts: Map<ExtendedSectionType, {
    prompt: string;
    backgroundColor: string;
    suggestedImageCount: number;
  }>;
} {
  // 팔레트 자동 선택 또는 지정된 팔레트 사용
  const selectedPaletteTheme = paletteTheme || autoSelectPalette(category, productName);
  const palette = COLOR_PALETTES[selectedPaletteTheme];

  // 전체 페이지 조화 프롬프트
  const harmonyPrompt = buildPaletteHarmonyPrompt(palette);

  // 섹션별 프롬프트 생성
  const sectionPrompts = new Map<ExtendedSectionType, {
    prompt: string;
    backgroundColor: string;
    suggestedImageCount: number;
  }>();

  sections.forEach((sectionType, index) => {
    const result = buildCategoryPromptWithPalette(
      sectionType,
      category,
      productName,
      palette,
      index
    );

    sectionPrompts.set(sectionType, {
      prompt: result.prompt,
      backgroundColor: result.backgroundColor,
      suggestedImageCount: result.suggestedImageCount,
    });
  });

  return {
    paletteTheme: selectedPaletteTheme,
    palette,
    harmonyPrompt,
    sectionPrompts,
  };
}

/**
 * 팔레트 가져오기 헬퍼
 */
export function getPalette(paletteTheme: PaletteTheme): ColorPalette {
  return COLOR_PALETTES[paletteTheme];
}

/**
 * 카테고리에서 추천 팔레트 가져오기
 */
export function getRecommendedPalette(category: string, productName?: string): PaletteTheme {
  return autoSelectPalette(category, productName);
}

// ============================================
// 인덱스 기반 이미지 프롬프트 시스템
// ============================================

/**
 * 섹션 타입, 카테고리, 이미지 인덱스에 맞는 특정 프롬프트 가져오기
 *
 * 다중 이미지 섹션에서 각 이미지별로 다른 컨셉의 프롬프트를 반환
 * indexedPrompts가 없으면 기본 imagePrompt 반환
 *
 * @param sectionType 섹션 타입
 * @param category 카테고리 (예: '스킨케어', '립')
 * @param imageIndex 이미지 인덱스 (0부터 시작)
 * @param productName 제품명 (플레이스홀더 치환용)
 * @returns 해당 인덱스에 맞는 프롬프트 및 오버레이 가이드
 */
export function getSectionImagePromptByIndex(
  sectionType: ExtendedSectionType,
  category: string,
  imageIndex: number,
  productName?: string
): {
  prompt: string;
  overlayGuide: string;
  conceptType: string;
  hasIndexedPrompt: boolean;
} {
  const template = SECTION_TEMPLATES[sectionType];
  if (!template) {
    return {
      prompt: '',
      overlayGuide: '',
      conceptType: 'default',
      hasIndexedPrompt: false,
    };
  }

  // 카테고리 특화 프롬프트 찾기
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);

  if (categorySpecific) {
    // indexedPrompts가 있는지 확인
    if (categorySpecific.indexedPrompts && categorySpecific.indexedPrompts.length > 0) {
      // 해당 인덱스에 맞는 프롬프트 찾기
      const indexedPrompt = categorySpecific.indexedPrompts.find(p => p.index === imageIndex);

      if (indexedPrompt) {
        let prompt = indexedPrompt.prompt;
        if (productName) {
          prompt = prompt.replace(/{product}/g, productName);
        }

        return {
          prompt,
          overlayGuide: indexedPrompt.overlayGuide,
          conceptType: indexedPrompt.conceptType,
          hasIndexedPrompt: true,
        };
      }

      // 인덱스가 범위를 벗어나면 순환 (모듈로 연산)
      const wrappedIndex = imageIndex % categorySpecific.indexedPrompts.length;
      const wrappedPrompt = categorySpecific.indexedPrompts[wrappedIndex];

      let prompt = wrappedPrompt.prompt;
      if (productName) {
        prompt = prompt.replace(/{product}/g, productName);
      }

      return {
        prompt,
        overlayGuide: wrappedPrompt.overlayGuide,
        conceptType: wrappedPrompt.conceptType,
        hasIndexedPrompt: true,
      };
    }

    // indexedPrompts가 없으면 기본 imagePrompt 사용
    let prompt = categorySpecific.imagePrompt;
    if (productName) {
      prompt = prompt.replace(/{product}/g, productName);
    }

    return {
      prompt,
      overlayGuide: categorySpecific.overlayTextGuide,
      conceptType: 'default',
      hasIndexedPrompt: false,
    };
  }

  // 카테고리 특화 프롬프트가 없으면 기본 템플릿 사용
  let prompt = template.imagePromptTemplate;
  if (productName) {
    prompt = prompt.replace(/{product}/g, productName);
  }

  return {
    prompt,
    overlayGuide: '',
    conceptType: 'default',
    hasIndexedPrompt: false,
  };
}

/**
 * 섹션의 모든 인덱스별 프롬프트 목록 가져오기
 *
 * @param sectionType 섹션 타입
 * @param category 카테고리
 * @param productName 제품명
 * @returns 모든 인덱스별 프롬프트 배열
 */
export function getAllIndexedPromptsForSection(
  sectionType: ExtendedSectionType,
  category: string,
  productName?: string
): Array<{
  index: number;
  prompt: string;
  overlayGuide: string;
  conceptType: string;
}> {
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);

  if (!categorySpecific || !categorySpecific.indexedPrompts) {
    // indexedPrompts가 없으면 빈 배열 반환
    return [];
  }

  return categorySpecific.indexedPrompts.map(ip => {
    let prompt = ip.prompt;
    if (productName) {
      prompt = prompt.replace(/{product}/g, productName);
    }

    return {
      index: ip.index,
      prompt,
      overlayGuide: ip.overlayGuide,
      conceptType: ip.conceptType,
    };
  });
}

/**
 * 섹션에 indexedPrompts가 있는지 확인
 */
export function hasIndexedPrompts(
  sectionType: ExtendedSectionType,
  category: string
): boolean {
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);
  return !!(categorySpecific?.indexedPrompts && categorySpecific.indexedPrompts.length > 0);
}

/**
 * 인덱스별 프롬프트 개수 가져오기
 */
export function getIndexedPromptCount(
  sectionType: ExtendedSectionType,
  category: string
): number {
  const categorySpecific = getCategorySpecificPrompt(sectionType, category);
  return categorySpecific?.indexedPrompts?.length ?? 0;
}
