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
  | 'TEXT_BANNER_1'      // 섹션 4: 텍스트 배너 (카피/슬로건)
  | 'REVIEW_SHOWCASE'    // 섹션 5: 소비자 리뷰 섹션
  | 'KEY_MESSAGE_1'      // 섹션 6: 핵심 메시지 배경
  | 'EFFICACY_VISUAL'    // 섹션 7: 핵심 효능 비주얼 (피부층 흡수)
  | 'BENEFIT_HIGHLIGHT_1'// 섹션 8: 성분/효능 하이라이트 배경
  | 'INGREDIENT_TECH'    // 섹션 9: 성분/기술 설명
  | 'MODEL_RESULT'       // 섹션 10: 모델 사용샷/효과
  | 'DIVIDER_VISUAL_1'   // 섹션 11: 섹션 구분 비주얼
  | 'STEP_GUIDE'         // 섹션 12: 사용 방법 (How-to)
  | 'KEY_MESSAGE_2'      // 섹션 13: 핵심 메시지 배경 2
  | 'PRODUCT_LINEUP'     // 섹션 14: 제품 라인업 (시리즈 소개)
  | 'TEXT_BANNER_2'      // 섹션 15: 텍스트 배너 2 (클로징 카피)
  | 'SIZE_OPTIONS'       // 섹션 16: 용량/가격 옵션
  | 'CTA_CLOSING';       // 섹션 17: 클로징 CTA 배너

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
  TEXT_BANNER_1: [
    { blockIndex: 0, conceptType: 'solid-mint', promptModifier: 'pure solid soft mint (#98D8AA) color fill only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'white-mint-gradient', promptModifier: 'simple horizontal gradient from white to soft mint only', aspectRatio: '3:1' },
  ],
  REVIEW_SHOWCASE: [
    { blockIndex: 0, conceptType: 'review-cards', promptModifier: 'review cards with speech bubbles layout', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'sns-style', promptModifier: 'SNS post style review mockup', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'rating-summary', promptModifier: 'rating summary infographic', aspectRatio: '2:1' },
  ],
  KEY_MESSAGE_1: [
    { blockIndex: 0, conceptType: 'radial-aqua', promptModifier: 'soft radial gradient - white center fading to aqua blue edges only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-light-blue', promptModifier: 'pure solid light blue (#E0F4FF) color fill only', aspectRatio: '3:1' },
  ],
  EFFICACY_VISUAL: [
    { blockIndex: 0, conceptType: 'skin-layer', promptModifier: 'cross-section skin layer absorption diagram', aspectRatio: '4:3' },
    { blockIndex: 1, conceptType: 'before-after', promptModifier: 'before-after skin texture comparison', aspectRatio: '2:1' },
    { blockIndex: 2, conceptType: 'moisture-meter', promptModifier: 'hydration level meter visualization', aspectRatio: '1:1' },
  ],
  BENEFIT_HIGHLIGHT_1: [
    { blockIndex: 0, conceptType: 'split-aqua-white', promptModifier: 'simple two-color split - left aqua blue right white only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-sky-blue', promptModifier: 'pure solid sky blue (#87CEEB) color fill only', aspectRatio: '3:1' },
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
  DIVIDER_VISUAL_1: [
    { blockIndex: 0, conceptType: 'solid-aqua-strip', promptModifier: 'pure solid aqua blue horizontal strip only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'mint-gradient-strip', promptModifier: 'simple white to mint gradient strip only', aspectRatio: '3:1' },
  ],
  STEP_GUIDE: [
    { blockIndex: 0, conceptType: 'step-1', promptModifier: 'step 1 dispense product', aspectRatio: '1:1' },
    { blockIndex: 1, conceptType: 'step-2', promptModifier: 'step 2 spread on skin', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'step-3', promptModifier: 'step 3 pat gently', aspectRatio: '1:1' },
  ],
  KEY_MESSAGE_2: [
    { blockIndex: 0, conceptType: 'luxury-frame', promptModifier: 'elegant gold thin frame border with soft mint gradient background, large empty center for text overlay, luxury presentation slide design', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'premium-accent', promptModifier: 'sophisticated silver line accents on corners with aqua blue gradient, clean center text area, high-end cosmetic brand presentation style', aspectRatio: '3:1' },
  ],
  PRODUCT_LINEUP: [
    { blockIndex: 0, conceptType: 'full-lineup', promptModifier: 'complete product line arranged', aspectRatio: '3:2' },
    { blockIndex: 1, conceptType: 'hero-product', promptModifier: 'hero product highlighted in lineup', aspectRatio: '1:1' },
    { blockIndex: 2, conceptType: 'routine-order', promptModifier: 'products in routine order sequence', aspectRatio: '4:1' },
  ],
  TEXT_BANNER_2: [
    { blockIndex: 0, conceptType: 'white-blue-gradient', promptModifier: 'simple horizontal gradient from white to soft blue only', aspectRatio: '3:1' },
    { blockIndex: 1, conceptType: 'solid-light-mint', promptModifier: 'pure solid light mint color fill only', aspectRatio: '3:1' },
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
// Section Base Prompt Templates (섹션별 기본 프롬프트 템플릿)
// English first, Korean translation below
// 영문 우선, 아래에 한글 번역
// ============================================

const SKINCARE_SECTION_BASE_PROMPTS: Record<SkincareDetailSectionType, string> = {
  BRAND_TRUST: `
Clean minimal banner design, official brand logo on white background,
authentic product certification badge, pharmacy cross symbol (if applicable),
dermatological brand aesthetic, trustworthy medical skincare feel,
soft blue and white color scheme, professional e-commerce header style,
clean typography space reserved, horizontal banner composition,
CRITICAL: NO TEXT NO LETTERS - visual elements only
---
깨끗하고 미니멀한 배너 디자인, 흰색 배경에 공식 브랜드 로고,
정품 인증 배지, 약국 십자 기호 (해당되는 경우),
피부과 브랜드 미학, 신뢰감 있는 의료 스킨케어 느낌,
소프트 블루와 화이트 색상 조합, 전문 이커머스 헤더 스타일,
타이포그래피 공간 확보, 가로형 배너 구성,
중요: 텍스트/글자 없음 - 시각적 요소만
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
---
수상 축하 배너 디자인, 골든 트로피 아이콘 또는 월계관,
"No.1" 랭킹 시각적 배지 요소, 5성 별점 표시,
스킨케어 맥락의 물방울 모티프,
수분감을 암시하는 라이트 블루 그라데이션 배경,
K-뷰티 어워드 스타일 레이아웃, 올리브영 랭킹 미학,
떠다니는 수상 배지, 은은한 색종이/반짝임 요소,
깔끔하고 모던한 인포그래픽 스타일, 프리미엄 스킨케어 수상 공지,
중요: 텍스트/숫자 없음 - 장식용 배지 형태만
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
---
화장품 제품 사진, 맑은 물에 잠긴 투명한 스킨케어 보틀/튜브,
제품 주변의 역동적인 물 스플래시 폭발,
고속 촬영 동작 정지 효과,
순수한 아쿠아 블루 색상 팔레트, 떠오르는 수중 기포,
수면을 뚫고 들어오는 광선,
초보습 스킨케어 컨셉, 상쾌하고 깨끗한 미학,
코스틱 조명 효과가 있는 스튜디오 조명, 4K 제품 시각화,
럭셔리 약국 스킨케어 무드, 전문 상업 사진,
중요: 제품이나 배경에 절대 텍스트/글자 없음
`.trim(),

  TEXT_BANNER_1: `
Pure solid color or simple gradient background ONLY,
soft mint (#98D8AA) solid fill OR simple white to mint horizontal gradient,
completely flat empty background - absolutely NO objects NO water droplets NO shapes,
just color fill for text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO PATTERNS NO DECORATIONS
---
순수 단색 또는 심플한 그라데이션 배경만,
소프트 민트 (#98D8AA) 단색 채움 또는 화이트에서 민트로 심플한 가로 그라데이션,
완전히 평평하고 빈 배경 - 오브젝트/물방울/도형 절대 없음,
텍스트 오버레이용 색상 채움만,
중요: 단색 또는 심플 그라데이션만 - 제품/도형/패턴/장식 없음
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
---
고객 리뷰 쇼케이스 디자인, 말풍선 요소,
떠다니는 하트 아이콘과 엄지척 기호,
소프트 파스텔 핑크와 블루 그라데이션 배경,
한국 SNS 리뷰 스타일 카드, 5성 별점 표시,
만족한 고객 이모지 요소,
둥근 모서리의 깨끗한 화이트 리뷰 카드,
사회적 증명 레이아웃 디자인, 후기 섹션 미학,
친근하고 접근하기 쉬운 느낌, 사용자 생성 콘텐츠 스타일 목업,
중요: 텍스트 없음 - UI 목업 형태와 아이콘만
`.trim(),

  KEY_MESSAGE_1: `
Pure solid color or simple radial gradient background ONLY,
soft radial gradient with white center fading to aqua blue edges OR solid light blue fill,
completely flat empty background - absolutely NO objects NO silhouettes NO water glow,
just color for message overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO GLOW EFFECTS NO DECORATIONS
---
순수 단색 또는 심플한 방사형 그라데이션 배경만,
중앙 화이트에서 가장자리 아쿠아 블루로 페이딩되는 소프트 방사형 그라데이션 또는 단색 라이트 블루 채움,
완전히 평평하고 빈 배경 - 오브젝트/실루엣/물빛 효과 절대 없음,
메시지 오버레이용 색상만,
중요: 단색 또는 심플 그라데이션만 - 제품/도형/글로우 효과/장식 없음
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
---
피부 수분 컨셉 시각화,
수분을 흡수하는 피부층 단면도,
진피층으로 침투하는 수분자 일러스트레이션,
촉촉한 글래스 스킨 텍스처 클로즈업, 수분 장벽 시각화,
피부 표면에 보호층을 형성하는 블루 물방울,
과학적 스킨케어 인포그래픽 스타일,
깔끔한 의학 일러스트레이션 미학,
수분 기술 시연, K-뷰티 피부 과학 비주얼,
중요: 텍스트/라벨 없음 - 순수 시각적 다이어그램만
`.trim(),

  BENEFIT_HIGHLIGHT_1: `
Pure solid color or simple split-tone background ONLY,
solid sky blue fill OR simple two-color split (aqua blue and white),
completely flat empty background - absolutely NO icons NO shapes NO water droplets,
just color zones for benefit text overlay,
CRITICAL: ONLY SOLID COLORS OR SIMPLE GRADIENTS - NO ICONS NO SHAPES NO DECORATIONS NO ACCENTS
---
순수 단색 또는 심플한 투톤 배경만,
단색 스카이 블루 채움 또는 심플한 투컬러 분할 (아쿠아 블루와 화이트),
완전히 평평하고 빈 배경 - 아이콘/도형/물방울 절대 없음,
혜택 텍스트 오버레이용 색상 영역만,
중요: 단색 또는 심플 그라데이션만 - 아이콘/도형/장식/악센트 없음
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
---
과학적 성분 인포그래픽, 떠다니는 분자 구조,
독자 기술 다이어그램, 블루 수분자 3D 렌더,
깨끗한 화이트 연구실 배경, 육각형 화학 결합 패턴,
히알루론산 또는 핵심 성분 분자 시각화,
미네랄 워터 원천 이미지 또는 천연 성분 기원,
임상 피부과학 미학, 연구 개발 느낌,
성분 분석 시각적 플로우차트, 모던 제약 디자인 스타일,
중요: 텍스트/화학식 표시 없음
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
---
20-30대 한국 여성 모델, 화장솜이나 손끝으로 스킨케어 제품 바르는 모습,
촉촉하고 빛나는 피부 결과, 건강하고 화사한 안색,
자연스러운 소프트 조명, 욕실 화장대 또는 깨끗한 스튜디오 세팅,
상쾌하고 깨끗한 아침 스킨케어 루틴 무드,
수분감 있는 광채 피부 텍스처 클로즈업,
볼 위의 물방울 하이라이트 효과,
미니멀리스트 깔끔한 배경, 에디토리얼 K-뷰티 포토그래피 스타일,
건강한 피부 광채, 내추럴 노메이크업 메이크업 룩,
중요: 이미지에 텍스트 오버레이 없음
`.trim(),

  DIVIDER_VISUAL_1: `
Pure solid color horizontal strip ONLY,
solid aqua blue strip OR simple white to mint gradient strip,
completely flat thin color band - absolutely NO patterns NO waves NO water droplets,
just a color strip,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT STRIP - NO PATTERNS NO WAVES NO DECORATIONS
---
순수 단색 가로 스트립만,
단색 아쿠아 블루 스트립 또는 화이트에서 민트로 심플한 그라데이션 스트립,
완전히 평평하고 얇은 컬러 밴드 - 패턴/웨이브/물방울 절대 없음,
컬러 스트립만,
중요: 단색 또는 심플 그라데이션 스트립만 - 패턴/웨이브/장식 없음
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
---
단계별 스킨케어 도포 가이드 비주얼,
3단계 프로세스 인포그래픽 레이아웃,
토너가 묻은 화장솜을 들고 있는 손 또는 손끝에 제품,
번호가 매겨진 원형 배지 (1, 2, 3 시각적 원형),
도포 방향을 나타내는 화살표 플로우,
얼굴에 가볍게 두드리는 모션 일러스트레이션,
깔끔한 설명용 다이어그램 스타일,
소프트 파스텔 블루 배경, 미니멀 아이코노그래피,
한국 스킨케어 루틴 튜토리얼 미학,
중요: 텍스트 없음 - 번호 원형과 화살표만
`.trim(),

  KEY_MESSAGE_2: `
Luxury presentation slide design for premium skincare brand,
elegant thin gold or silver frame border on soft mint/aqua gradient background,
sophisticated geometric line accents on corners,
large clean empty center area reserved for text overlay,
high-end cosmetic brand keynote presentation aesthetic,
minimalist luxury style with subtle metallic accents,
NO product images, NO text in image, just elegant frame layout for text overlay,
CRITICAL: Empty center for text - elegant border frame only
---
프리미엄 스킨케어 브랜드를 위한 럭셔리 프레젠테이션 슬라이드 디자인,
소프트 민트/아쿠아 그라데이션 배경에 우아하고 얇은 골드 또는 실버 프레임 테두리,
코너에 세련된 기하학적 라인 악센트,
텍스트 오버레이를 위해 예약된 크고 깨끗한 빈 중앙 영역,
하이엔드 화장품 브랜드 키노트 프레젠테이션 미학,
은은한 메탈릭 악센트가 있는 미니멀리스트 럭셔리 스타일,
제품 이미지 없음, 이미지에 텍스트 없음, 텍스트 오버레이용 우아한 프레임 레이아웃만,
중요: 텍스트용 빈 중앙 - 우아한 테두리 프레임만
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
---
제품 패밀리 플랫 레이 배치,
완전한 스킨케어 라인 제품 진열,
토너, 세럼, 크림, 클렌징 워터 보틀 정렬,
작은 것에서 큰 것으로 그라데이션 사이즈 배치,
깨끗한 화이트 인피니티 배경, 아래 소프트 그림자,
일관된 패키징 색상 구성,
전문 카탈로그 제품 사진,
탑다운 또는 45도 앵글 뷰, 일관된 조명,
약국 스킨케어 컬렉션 디스플레이,
중요: 제품에 텍스트/라벨 없음
`.trim(),

  TEXT_BANNER_2: `
Pure solid color or simple gradient background ONLY,
simple horizontal gradient from white to soft blue OR solid light mint fill,
completely flat empty background - absolutely NO sparkles NO bokeh NO water droplets,
just color fill for closing text overlay,
CRITICAL: ONLY SOLID COLOR OR SIMPLE GRADIENT - NO PRODUCTS NO SHAPES NO SPARKLES NO DECORATIONS
---
순수 단색 또는 심플한 그라데이션 배경만,
화이트에서 소프트 블루로 심플한 가로 그라데이션 또는 단색 라이트 민트 채움,
완전히 평평하고 빈 배경 - 스파클/보케/물방울 절대 없음,
클로징 텍스트 오버레이용 색상 채움만,
중요: 단색 또는 심플 그라데이션만 - 제품/도형/스파클/장식 없음
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
---
제품 사이즈 비교 시각화,
나란히 놓인 다양한 보틀 사이즈 (예: 100ml, 250ml, 500ml),
측정 스케일 인디케이터 비주얼, 밸류 사이즈 하이라이트,
깔끔한 제품 실루엣 라인업,
미니멀 화이트 배경, 은은한 사이즈 시각적 인디케이터,
이커머스 제품 옵션 디스플레이 스타일,
명확한 용량 비교 인포그래픽,
중요: 텍스트/숫자 없음 - 시각적 사이즈 차이만
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
---
콜투액션 배너 디자인,
버튼 요소 공간 (빈 둥근 사각형),
물결 효과 배경,
제품 파이널 히어로 샷,
긴급성 시각적 요소 (배지 형태 선택적),
깔끔하고 모던한 이커머스 클로징 배너,
텍스트 오버레이용 화이트 공간이 있는 블루 그라데이션,
신뢰 배지 아이콘 형태 (배송 트럭, 체크마크 아이콘),
설득력 있는 구매 동기 부여 레이아웃,
중요: 텍스트 없음 - 텍스트 오버레이용 플레이스홀더 형태만
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
professional e-commerce detail page photography, high-end skincare advertising, clean visual without any text overlay
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
    'TEXT_BANNER_1',
    'REVIEW_SHOWCASE',
    'KEY_MESSAGE_1',
    'EFFICACY_VISUAL',
    'BENEFIT_HIGHLIGHT_1',
    'INGREDIENT_TECH',
    'MODEL_RESULT',
    'DIVIDER_VISUAL_1',
    'STEP_GUIDE',
    'KEY_MESSAGE_2',
    'PRODUCT_LINEUP',
    'TEXT_BANNER_2',
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
// 효능 자동 감지 및 매칭 함수
// ============================================

/**
 * 피부장벽 관련 키워드 목록
 */
const BARRIER_KEYWORDS = [
  // 한글 키워드
  '피부장벽', '장벽', '세라마이드', '세라마이드', '배리어', '방어막',
  '피부보호', '장벽강화', '장벽케어', '스킨배리어', '보호막',
  '세라미드', '피부방어', '리페어', '복구', '장벽복구',
  // 영문 키워드
  'barrier', 'ceramide', 'skin barrier', 'protective', 'repair',
  'strengthening', 'defense', 'shield', 'fortifying',
] as const;

/**
 * 효능별 키워드 매칭 패턴
 */
const EFFICACY_KEYWORD_PATTERNS: Record<keyof typeof SKINCARE_EFFICACY_KEYWORDS, string[]> = {
  hydrating: ['수분', '보습', '촉촉', '하이드', 'hydrat', 'moisture', 'aqua', '워터'],
  anti_aging: ['안티에이징', '탄력', '주름', '리프팅', 'anti-aging', 'firming', 'wrinkle', '에이징'],
  brightening: ['미백', '브라이트', '톤업', '광채', 'bright', 'whiten', 'radiance', 'glow'],
  soothing: ['진정', '민감', '저자극', '캄', 'sooth', 'calm', 'sensitive', 'gentle'],
  pore_care: ['모공', '피지', '블랙헤드', '각질', 'pore', 'sebum', 'purif', 'exfoliat'],
  barrier: BARRIER_KEYWORDS as unknown as string[],
};

/**
 * 제품명/설명에서 피부장벽 관련 키워드 감지
 * @param text 제품명 또는 설명 텍스트
 * @returns 피부장벽 키워드 감지 여부
 */
export function detectBarrierKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BARRIER_KEYWORDS.some(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * 제품명/설명에서 효능 타입 자동 감지
 * @param text 제품명 또는 설명 텍스트
 * @returns 감지된 효능 타입 (기본값: hydrating)
 */
export function detectEfficacyFromText(text: string): keyof typeof SKINCARE_EFFICACY_KEYWORDS {
  const lowerText = text.toLowerCase();

  // 우선순위: barrier > 기타 (피부장벽 키워드가 있으면 우선 적용)
  if (detectBarrierKeywords(text)) {
    return 'barrier';
  }

  // 다른 효능 키워드 매칭
  for (const [efficacy, keywords] of Object.entries(EFFICACY_KEYWORD_PATTERNS)) {
    if (efficacy === 'barrier') continue; // 이미 체크함
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return efficacy as keyof typeof SKINCARE_EFFICACY_KEYWORDS;
    }
  }

  // 기본값: 수분/보습
  return 'hydrating';
}

/**
 * 피부장벽 상세 프롬프트 반환 (해당 효능일 경우)
 * @param efficacy 효능 타입
 * @returns 피부장벽 상세 프롬프트 또는 null
 */
export function getBarrierDetailedPrompt(efficacy: keyof typeof SKINCARE_EFFICACY_KEYWORDS): string | null {
  if (efficacy !== 'barrier') return null;

  const barrierData = SKINCARE_EFFICACY_KEYWORDS.barrier;
  if ('detailedPrompt' in barrierData) {
    return (barrierData as any).detailedPrompt;
  }
  return null;
}

/**
 * 피부장벽 섹션용 프롬프트인지 확인
 * @param section 섹션 타입
 * @param efficacy 효능 타입
 * @returns 피부장벽 상세 프롬프트 적용 여부
 */
export function shouldUseBarrierDetailedPrompt(
  section: SkincareDetailSectionType,
  efficacy: keyof typeof SKINCARE_EFFICACY_KEYWORDS
): boolean {
  const barrierSections: SkincareDetailSectionType[] = ['EFFICACY_VISUAL', 'INGREDIENT_TECH'];
  return efficacy === 'barrier' && barrierSections.includes(section);
}

/**
 * 제품 정보에서 스킨케어 프롬프트 옵션 자동 생성
 * @param productName 제품명
 * @param description 제품 설명 (optional)
 * @param subCategory 서브카테고리
 * @returns SkincareImagePromptOptions
 */
export function buildSkincareOptionsFromProduct(
  productName: string,
  description: string = '',
  subCategory: SkincareSubCategory = 'serum'
): SkincareImagePromptOptions {
  const combinedText = `${productName} ${description}`;
  const detectedEfficacy = detectEfficacyFromText(combinedText);

  return {
    productName,
    subCategory,
    primaryEfficacy: detectedEfficacy,
    additionalKeywords: detectBarrierKeywords(combinedText)
      ? ['skin barrier protection', 'ceramide layer', 'protective membrane']
      : [],
    includeNegative: true,
  };
}

// ============================================
// Export
// ============================================

export {
  SKINCARE_SECTION_BASE_PROMPTS,
  SUBCATEGORY_VISUAL_MODIFIERS,
  BARRIER_KEYWORDS,
  EFFICACY_KEYWORD_PATTERNS,
};
