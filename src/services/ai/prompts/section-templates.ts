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
  | 'HERO'              // 메인 히어로 (제품 + 브랜드명 + 슬로건)
  | 'FEATURES'          // 특징 아이콘 그리드
  | 'SPECS'             // 사양/스펙 다이어그램
  | 'MATERIAL'          // 재질/성분 하이라이트
  | 'SOCIAL_PROOF'      // 수치/신뢰 데이터
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
  HERO: {
    type: 'HERO',
    name: '히어로 섹션',
    purpose: '첫인상 - 제품의 전체 구성품과 브랜드 아이덴티티를 한눈에 보여주는 메인 이미지',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `Ultra-premium hero product photography for e-commerce detail page.

[COMPOSITION]
- Product "{product}" as the absolute focal point, occupying 60-70% of frame
- If product is a SET or KIT: Display ALL components elegantly arranged together - main product in center, accessories/components around it in harmonious layout
- If product is SINGLE item: Show packaging alongside the actual product (box + product)
- 45-degree elevated angle for dimension and premium feel
- Generous white space at top (20%) for brand name overlay
- Clean space at bottom (15%) for product name and tagline text overlay

[LIGHTING & ATMOSPHERE]
- {background} gradient background that matches brand identity
- Soft diffused studio lighting with subtle rim light for product separation
- Gentle shadows beneath product for grounding, not harsh
- Overall mood: Premium, trustworthy, desirable

[STYLE]
- Korean beauty/lifestyle e-commerce aesthetic (Olive Young, Coupang style)
- Clean, minimal, sophisticated
- Product surface textures clearly visible (matte, glossy, metallic finishes)
- No text, no watermarks, no logos burned into image

[QUALITY]
- 8K photorealistic, commercial product photography
- Sharp focus on product, subtle depth of field on background`,
    requiredVisuals: ['product-centered', 'full-package-display', 'brand-background', 'text-space-top', 'text-space-bottom'],
    optionalVisuals: ['component-arrangement', 'packaging-box', 'subtle-shadow', 'reflection'],
    textOverlay: {
      headline: true,      // 브랜드명
      subheadline: true,   // 제품명
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
        imagePrompt: `Premium cushion/foundation hero shot. Show compact case OPEN revealing cushion puff and product inside, plus CLOSED case alongside. If refill included, display refill pack elegantly. Background: soft beige or pink gradient matching skin tone concept. Korean beauty aesthetic, clean composition. Luxurious texture emphasis on case material (matte, glossy, or metallic finish). 8K quality, no text.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 중앙하단: 제품명 + 호수 표기 (예: #21 라이트베이지)',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Luxurious lip product hero shot. Display the lip product tube/case standing upright as main focus. Show the product tip/applicator visible (cap off or semi-open). If SET: arrange multiple shades in elegant fan or line formation. Background: soft rose-pink or nude gradient. Emphasis on glossy/matte texture of the product case. Korean beauty lip product aesthetic. 8K quality, no text.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + 컬러명 (예: #01 Fig Mood)',
      },
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너'],
        imagePrompt: `Premium skincare hero shot. Main product bottle/jar as center focus, showing full product with cap. If SET: arrange serum, toner, cream in size-graduated layout. Show product texture hint (dropper with serum drop, cream swirl near jar). Background: clean white to soft blue gradient for freshness. Emphasize glass/premium packaging material. Korean skincare aesthetic. 8K quality, no text.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + 용량 (예: 히알루론 세럼 30ml)',
      },
      {
        categoryKeywords: ['선케어', '선크림', '자외선'],
        imagePrompt: `Fresh suncare hero shot. Sunscreen tube/bottle as main focus with cap visible. Show product squeeze or texture swatch nearby to indicate consistency. Background: bright, sunny yellow-to-white gradient conveying UV protection. If SET: SPF products arranged by protection level. Clean, fresh, outdoor-ready feeling. 8K quality, no text.`,
        suggestedImageCount: 1,
        overlayTextGuide: '상단: 브랜드명, 하단: 제품명 + SPF/PA 표기 (예: 톤업 선크림 SPF50+ PA++++)',
      },
    ],
  },

  FEATURES: {
    type: 'FEATURES',
    name: '특징/발색 섹션',
    purpose: '제품의 핵심 특징, 색상 바리에이션, 발색 테스트 등을 여러 이미지로 상세히 보여주기',
    recommendedLayout: 'grid',
    imagePromptTemplate: `Product feature showcase photography for e-commerce detail page.

[COMPOSITION]
- Feature-focused product shot highlighting specific characteristic
- Product "{product}" shown from angle that best demonstrates the feature
- Clean {background} background
- Space reserved for feature text overlay (icon + label area)

[STYLE]
- Korean beauty e-commerce aesthetic
- Clean, informative, professional
- Each image focuses on ONE specific feature

[QUALITY]
- 8K photorealistic, sharp detail
- No text, no watermarks`,
    requiredVisuals: ['feature-focus', 'product-detail', 'text-overlay-space'],
    optionalVisuals: ['comparison-elements', 'texture-showcase', 'swatch-display'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 1,
    multiImage: true,
    maxImageCount: 6,
    categorySpecificPrompts: [
      {
        categoryKeywords: ['쿠션', '파운데이션', '베이스메이크업'],
        imagePrompt: `Cushion/Foundation SHADE SWATCH photography series for Korean beauty detail page.

[IMAGE SET - Generate multiple images for each shade]
Create separate images for each foundation shade showing:
1. ARM SWATCH TEST: Beautiful Korean female model's inner forearm with foundation swatch stroke. Clean, well-lit skin. Show the shade number clearly through texture/tone. Natural daylight simulation.

2. FACE APPLICATION (optional): Half-face comparison showing bare skin vs. applied foundation - demonstrating coverage and finish.

[SHADE REPRESENTATION]
- #13 Ivory: Very fair, pink undertone swatch
- #17 Light Beige: Fair with neutral undertone
- #21 Natural Beige: Light-medium, yellow undertone (most popular)
- #23 Medium Beige: Medium, warm undertone
- #25 Warm Beige: Medium-tan, golden undertone

[STYLE]
- Clean white or soft beige background
- Professional beauty photography lighting (soft, even, flattering)
- Korean beauty aesthetic - natural, healthy skin look
- Model: Korean female, 20s-30s, healthy clear skin
- Focus on texture: dewy, semi-matte, or natural finish visible

[QUALITY]
- 8K, photorealistic skin texture
- No text overlay in image
- Commercial beauty photography standard`,
        suggestedImageCount: 5,
        overlayTextGuide: '각 이미지에 호수 표기: #13 아이보리, #17 라이트베이지, #21 내추럴베이지, #23 미디엄베이지 등',
      },
      {
        categoryKeywords: ['립', '틴트', '립스틱', '립글로스'],
        imagePrompt: `Lip product COLOR SWATCH photography series for Korean beauty detail page.

[IMAGE SET - Generate multiple images for each shade]
Create separate images for each lip color showing:
1. LIP SWATCH: Korean female model's lips with product applied. Close-up lip shot showing color payoff and texture (glossy/matte/velvet).

2. ARM SWATCH (optional): Inner forearm swatch showing true color on skin.

[COLOR REPRESENTATION - Match to product shade names]
For each shade, create authentic color representation:
- MLBB shades: Natural rosy pink, dusty rose, soft mauve
- Red shades: True red, cherry red, brick red
- Coral/Orange: Coral pink, peach, apricot
- Berry/Plum: Fig, mulberry, wine, burgundy
- Nude: Nude beige, nude pink, caramel

[STYLE]
- Clean background (white or soft pink gradient)
- Beauty photography lighting - lips look plump and healthy
- Korean beauty lip aesthetic - gradient lip, full lip, or precise application
- Model: Korean female, beautiful lip shape, healthy lip condition
- Texture clearly visible: glossy shine, matte velvet, or dewy finish

[QUALITY]
- 8K macro photography quality
- Skin texture and lip texture photorealistic
- No text in image`,
        suggestedImageCount: 6,
        overlayTextGuide: '각 이미지에 컬러명 표기: #01 피그무드, #02 로지코랄, #03 체리레드 등',
      },
      {
        categoryKeywords: ['아이섀도우', '아이메이크업', '팔레트'],
        imagePrompt: `Eyeshadow SWATCH photography series for Korean beauty detail page.

[IMAGE SET]
1. PALETTE OVERVIEW: Full palette open, showing all shade pans with their textures visible
2. ARM SWATCHES: Each shade swatched on Korean model's inner forearm, arranged in a row or gradient
3. EYE APPLICATION (optional): Eye close-up showing shades applied in a look

[STYLE]
- Clean white or neutral background
- Even, professional lighting showing true color payoff
- Matte, shimmer, glitter finishes clearly differentiated
- Korean beauty eye makeup aesthetic

[QUALITY]
- 8K, showing pigment and texture detail
- No text in image`,
        suggestedImageCount: 3,
        overlayTextGuide: '팔레트 구성 컬러명 또는 번호 표기',
      },
      {
        categoryKeywords: ['스킨케어', '세럼', '에센스', '크림', '토너'],
        imagePrompt: `Skincare TEXTURE & BENEFIT photography series for e-commerce detail page.

[IMAGE SET]
1. TEXTURE SHOT: Product texture on glass/clear surface or skin - showing consistency (watery, gel, cream, oil)
2. ABSORPTION TEST: Before/after texture absorption on skin
3. KEY INGREDIENT VISUAL: Ingredient visualization (e.g., hyaluronic acid droplets, vitamin C citrus, centella leaves)

[STYLE]
- Clean, clinical yet inviting aesthetic
- Soft blue or white gradient background for freshness
- Korean skincare detail page style
- Scientific yet approachable

[QUALITY]
- 8K, texture clearly visible
- No text in image`,
        suggestedImageCount: 3,
        overlayTextGuide: '각 특징별 텍스트: 48시간 보습, 즉각 흡수, 저자극 테스트 완료 등',
      },
      {
        categoryKeywords: ['마스카라', '아이라이너'],
        imagePrompt: `Mascara/Eyeliner BEFORE-AFTER photography for Korean beauty detail page.

[IMAGE SET]
1. BEFORE-AFTER: Split image or side-by-side showing bare lashes vs. mascara applied (volume, length, curl)
2. BRUSH/TIP CLOSE-UP: Detailed shot of brush bristles or liner tip
3. SMUDGE TEST (optional): Product applied, then shown after wear time

[STYLE]
- Clean background
- Close-up eye photography
- Korean model, natural eye shape
- Dramatic yet natural enhancement visible

[QUALITY]
- 8K macro quality
- Individual lash detail visible
- No text in image`,
        suggestedImageCount: 3,
        overlayTextGuide: '볼륨업 효과, 컬링 지속력, 번짐 없는 등 특징 표기',
      },
    ],
  },

  SPECS: {
    type: 'SPECS',
    name: '사양 다이어그램',
    purpose: '제품 크기, 치수, 상세 사양 시각화',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `technical product diagram of {product}, product shown from optimal angle to display dimensions, clean {background} background, dimension indicator lines and arrows pointing to key measurements, technical drawing style with clean aesthetics, space for size labels and measurements, professional product specification diagram, detail page specs section`,
    requiredVisuals: ['product-angle', 'dimension-lines', 'measurement-labels'],
    optionalVisuals: ['scale-reference', 'cutaway-view'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 2,
    multiImage: false,
    maxImageCount: 1,
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
    purpose: '제품이 있는 일상의 모습, 감성적 연결',
    recommendedLayout: 'lifestyle',
    imagePromptTemplate: `lifestyle mood shot featuring {product}, product naturally placed in {context} environment, warm inviting atmosphere, {background} color tones, aspirational lifestyle photography, soft natural lighting, product integrated into beautiful living space, editorial style composition, detail page lifestyle section`,
    requiredVisuals: ['environmental-context', 'lifestyle-props', 'mood-lighting'],
    optionalVisuals: ['human-element', 'complementary-items'],
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
  },

  FAQ: {
    type: 'FAQ',
    name: '자주 묻는 질문',
    purpose: '구매 전 의문 해소, 추가 정보 제공',
    recommendedLayout: 'split-right',
    imagePromptTemplate: `product Q&A context shot of {product}, product displayed elegantly on side, clean {background} background, large text-friendly area for questions and answers, professional customer service aesthetic, organized information layout style, detail page FAQ section`,
    requiredVisuals: ['product-side', 'text-dominant-area'],
    optionalVisuals: ['question-icons', 'info-graphics'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: true,
      bullets: true,
      numbers: false,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 7,
    multiImage: false,
    maxImageCount: 1,
  },

  INFO_TABLE: {
    type: 'INFO_TABLE',
    name: '제품 정보표',
    purpose: '상세 제품 정보, 규격, 제조사 정보 등',
    recommendedLayout: 'split-left',
    imagePromptTemplate: `product information display of {product}, small product image on side, clean {background} background, large space for product specification table, organized information layout, professional product detail aesthetic, e-commerce info table section style`,
    requiredVisuals: ['product-small', 'table-area', 'organized-layout'],
    optionalVisuals: ['brand-logo', 'qr-code-area'],
    textOverlay: {
      headline: true,
      subheadline: false,
      body: false,
      bullets: false,
      numbers: true,
      icons: false,
    },
    generateImage: true,
    defaultOrder: 8,
    multiImage: false,
    maxImageCount: 1,
  },

  CTA: {
    type: 'CTA',
    name: 'CTA/고객센터',
    purpose: '구매 유도, 고객센터 연락처, 마무리',
    recommendedLayout: 'hero-centered',
    imagePromptTemplate: `call-to-action product shot of {product}, product elegantly displayed, clean {background} background, warm inviting atmosphere, space for customer service information and contact details, purchase motivation composition, final impression aesthetic, detail page closing section`,
    requiredVisuals: ['product-final', 'cta-space', 'contact-area'],
    optionalVisuals: ['brand-elements', 'trust-badges'],
    textOverlay: {
      headline: true,
      subheadline: true,
      body: false,
      bullets: false,
      numbers: true,
      icons: true,
    },
    generateImage: true,
    defaultOrder: 9,
    multiImage: false,
    maxImageCount: 1,
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
    recommendedSections: ['HERO', 'FEATURES', 'SPECS', 'MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'SPECS', 'INFO_TABLE'],
    optionalSections: ['MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'CTA'],
  },
  '스킨케어': {
    category: '스킨케어',
    recommendedSections: ['HERO', 'FEATURES', 'MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'INFO_TABLE'],
    requiredSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF'],
    optionalSections: ['MATERIAL', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
  },
  '메이크업': {
    category: '메이크업',
    recommendedSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ'],
    requiredSections: ['HERO', 'FEATURES', 'HOW_TO_USE'],
    optionalSections: ['SOCIAL_PROOF', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
  },
  '식품': {
    category: '식품',
    recommendedSections: ['HERO', 'FEATURES', 'MATERIAL', 'HOW_TO_USE', 'INFO_TABLE', 'CTA'],
    requiredSections: ['HERO', 'FEATURES', 'INFO_TABLE'],
    optionalSections: ['MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'CTA'],
  },
  'default': {
    category: 'default',
    recommendedSections: ['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'],
    requiredSections: ['HERO', 'FEATURES'],
    optionalSections: ['SPECS', 'MATERIAL', 'SOCIAL_PROOF', 'HOW_TO_USE', 'LIFESTYLE', 'FAQ', 'INFO_TABLE', 'CTA'],
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
