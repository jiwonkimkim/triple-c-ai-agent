import { GoogleGenAI } from '@google/genai';
import type { OverlayTextContent, OverlayTextItem, OverlayStatisticItem, SectionType } from '@/services/ai/prompts/types';
import { generateFontGuideForAI } from '@/constants/fonts';
import { buildOverlayTextPrompt, BlockOverlayOptions } from '@/services/ai/prompts/overlay-prompts';

// ============================================
// ★ 섹션 타입 매핑 (모듈 레벨 - 모든 함수에서 사용)
// ============================================

/**
 * ★★★ 비율별 실제 해상도 매핑 (Gemini 3 Pro Image 1K 기준) ★★★
 * 오버레이 텍스트 좌표 계산에 사용
 */
const ASPECT_RATIO_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 848, height: 1264 },
  '3:4': { width: 896, height: 1200 },
  '4:3': { width: 1200, height: 896 },
  '4:5': { width: 928, height: 1152 },
  '5:4': { width: 1152, height: 928 },
  '16:9': { width: 1376, height: 768 },
  '9:16': { width: 768, height: 1376 },
  '21:9': { width: 1584, height: 672 },
  '3:2': { width: 1264, height: 848 },
};

// 기본 해상도 (비율이 지정되지 않은 경우 - 3:4 상세페이지 기본)
const DEFAULT_RESOLUTION = { width: 896, height: 1200 };

/**
 * 비율에 해당하는 실제 해상도 반환
 */
function getResolutionForAspectRatio(aspectRatio?: string): { width: number; height: number } {
  if (!aspectRatio) return DEFAULT_RESOLUTION;
  return ASPECT_RATIO_RESOLUTIONS[aspectRatio] || DEFAULT_RESOLUTION;
}

/**
 * 섹션 타입별 aspectRatio 결정
 * - MAIN: 1:1 (정사각형 썸네일)
 * - TEXT_BANNER, DIVIDER_VISUAL, KEY_MESSAGE 등 텍스트 배경: 16:9 (가로 배너)
 * - 나머지: 3:4 (상세페이지 기본)
 */
function getSectionAspectRatio(sectionType: string): ImageAspectRatio | undefined {
  const upperType = sectionType.toUpperCase();

  // MAIN 섹션: 1:1 정사각형
  if (/^MAIN|THUMBNAIL/.test(upperType)) {
    return '1:1';
  }

  // 텍스트 배경 섹션: 16:9 가로 비율
  if (/TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL|BRAND_HEADER/.test(upperType)) {
    return '16:9';
  }

  // 나머지: 3:4 상세페이지 기본 비율
  return '3:4';
}

/**
 * ★★★ 공통 섹션 프롬프트 템플릿 (T2I/I2I 공유) ★★★
 * 이미지 입력 여부와 무관한 섹션별 시각 지침
 */
interface SectionPromptParams {
  productName: string;
  category: string;
  ingredientObjects: string[];
  moodSelection: string[];
  audienceStyle: string;
  featureHighlight: string;
  isI2I?: boolean;  // I2I 모드면 "USE THE PROVIDED PRODUCT IMAGE" 추가
}

function buildSharedSectionPrompt(sectionType: SectionType, params: SectionPromptParams): string {
  const { productName, ingredientObjects, moodSelection, audienceStyle, featureHighlight, isI2I } = params;

  const i2iPrefix = isI2I
    ? `
USE THE PROVIDED PRODUCT IMAGE as reference - include this exact product in the new composition.
(제공된 제품 이미지를 참조하여 새로운 구성에 포함)
`
    : '';

  // ★ 주요 섹션 타입만 정의, 나머지는 CUSTOM 폴백 사용
  const prompts: Partial<Record<SectionType, string>> = {
    MAIN: `Create a KOREAN E-COMMERCE DETAIL PAGE THUMBNAIL for "${productName}".
(한국 이커머스 상세페이지 썸네일 생성)
${i2iPrefix}
[KOREAN DETAIL PAGE STYLE]
(한국 상세페이지 스타일)
- Premium beauty product thumbnail style
  (프리미엄 뷰티 제품 썸네일 스타일)
- Clean, bright, aspirational aesthetic that Korean consumers love
  (한국 소비자가 좋아하는 깨끗하고 밝은 미학)
- Magazine editorial meets e-commerce quality
  (매거진 에디토리얼 + 이커머스 퀄리티)
- Soft gradient background complementing product colors
  (제품 컬러를 보완하는 부드러운 그라데이션 배경)

[CREATIVE COMPOSITION]
(크리에이티브 구성)
Design a visually striking thumbnail featuring ${isI2I ? 'the provided product' : productName}.
(시각적으로 눈에 띄는 썸네일 디자인)
- Product as HERO 50-60% of frame, sharp focus, eye-catching
  (제품이 주인공 50-60%, 선명한 초점)
- Product placement: CENTER or slightly UPPER-CENTER
  (제품 배치: 중앙 또는 약간 위쪽 중앙)
- Decorative objects 15-20%: ${ingredientObjects.join(', ')}
  (장식 오브젝트 15-20%)
- Atmospheric elements 10-15%: ${moodSelection.join(', ')}
  (분위기 요소 10-15%)
- Create depth with layered composition: foreground → product → background
  (레이어 구성으로 깊이감 생성)
- Leave CLEAN SPACE at top 20% for text overlay
  (상단 20%는 텍스트 오버레이를 위해 비워두기)

[STYLING DIRECTION]
(스타일링 방향)
Target aesthetic: ${audienceStyle}
(타겟 미학)
${featureHighlight}
Korean beauty trend: glow, transparency, premium
(한국 뷰티 트렌드: 글로우, 투명감, 프리미엄)

[TECHNICAL REQUIREMENTS]
(기술 요구사항)
- Soft, diffused studio lighting with gentle rim light
  (부드러운 확산 스튜디오 조명과 림 라이트)
- Shallow depth of field, soft bokeh background
  (얕은 피사계 심도, 부드러운 보케 배경)
- Rich, vibrant colors with professional color grading
  (풍부하고 생동감 있는 컬러와 전문 컬러 그레이딩)
- Premium commercial photography that triggers purchase desire
  (구매 욕구를 자극하는 프리미엄 상업 사진)
- 8K resolution, photorealistic, no text in image
  (8K 해상도, 포토리얼리스틱, 이미지 내 텍스트 없음)`,

    HERO: `Create KOREAN E-COMMERCE HERO BANNER IMAGE for ${productName}.
(한국 이커머스 히어로 배너 이미지 생성)
${i2iPrefix}
[SCENARIO]
(시나리오)
- First impression image at the top of detail page
  (상세페이지 최상단 첫인상 이미지)
- Product stands out with space for brand slogan
  (제품이 돋보이면서 브랜드 슬로건 공간 필요)
- Premium and dramatic atmosphere
  (프리미엄하고 드라마틱한 분위기)

[COMPOSITION]
(구성)
- WIDE FORMAT 16:9 ratio - horizontal banner
  (와이드 포맷 16:9 비율 - 가로 배너)
- Product featured prominently but with ample text space
  (제품이 돋보이되 충분한 텍스트 공간)
- Dramatic lighting, cinematic feel
  (드라마틱 조명, 시네마틱 느낌)
- Background: gradient or lifestyle scene
  (배경: 그라데이션 또는 라이프스타일 씬)
- Decorative elements: ${ingredientObjects.join(', ')}
  (장식 요소)

[STYLE]
(스타일)
${audienceStyle}
Korean luxury beauty aesthetic
(한국 럭셔리 뷰티 미학)
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,

    FEATURES: `Create KOREAN E-COMMERCE FEATURES SECTION IMAGE for ${productName}.
(한국 이커머스 특징 섹션 이미지 생성)
${i2iPrefix}
[SCENARIO]
(시나리오)
- Visualize key ingredients or functions of the product
  (제품의 핵심 성분이나 기능을 시각화)
- Clean and informative composition
  (깔끔하고 정보 전달력 있는 구성)

[COMPOSITION]
(구성)
- Clean, organized layout
  (깔끔하고 정돈된 레이아웃)
- Product with ingredient/feature visualization
  (제품과 성분/특징 시각화)
- Supporting elements: ${ingredientObjects.join(', ')}
  (보조 요소)
- Professional, informative aesthetic
  (전문적이고 정보적인 미학)

[STYLE]
(스타일)
${audienceStyle}
${featureHighlight}
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,

    SOCIAL_PROOF: `Create KOREAN E-COMMERCE SOCIAL PROOF IMAGE for ${productName}.
(한국 이커머스 소셜 프루프 이미지 생성)
${i2iPrefix}
[SCENARIO]
(시나리오)
- Warm and natural atmosphere that inspires trust
  (신뢰감을 주는 따뜻하고 자연스러운 분위기)
- Real use environment or beauty lifestyle
  (실제 사용 환경이나 뷰티 라이프스타일)

[COMPOSITION]
(구성)
- Lifestyle setting: bathroom, vanity, skincare routine
  (라이프스타일 세팅: 욕실, 화장대, 스킨케어 루틴)
- Warm, inviting atmosphere
  (따뜻하고 초대하는 분위기)
- Product in natural use context
  (자연스러운 사용 맥락의 제품)
- Soft, approachable lighting
  (부드럽고 친근한 조명)

[STYLE]
(스타일)
${audienceStyle}
Authentic, relatable aesthetic
(진정성 있고 공감가는 미학)
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,

    HOW_TO_USE: `Create KOREAN E-COMMERCE HOW-TO-USE IMAGE for ${productName}.
(한국 이커머스 사용법 이미지 생성)
${i2iPrefix}
[SCENARIO]
(시나리오)
- Clean image showing product usage steps
  (제품 사용 단계를 보여주는 깔끔한 이미지)
- Educational yet attractive composition
  (교육적이면서 매력적인 구성)

[COMPOSITION]
(구성)
- Step-by-step visual guide concept
  (단계별 비주얼 가이드 컨셉)
- Clean, instructional layout
  (깔끔하고 교육적인 레이아웃)
- Product application moment
  (제품 적용 순간)
- Hands or skin texture optional
  (손이나 피부 텍스처 선택사항)

[STYLE]
(스타일)
${audienceStyle}
Educational yet beautiful
(교육적이면서 아름다운)
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,

    FAQ: `Create KOREAN E-COMMERCE FAQ SECTION IMAGE for ${productName}.
(한국 이커머스 FAQ 섹션 이미지 생성)
${i2iPrefix}
[SCENARIO]
(시나리오)
- Friendly and helpful feeling
  (친근하고 도움이 되는 느낌)
- Clean background image
  (깔끔한 배경 이미지)

[COMPOSITION]
(구성)
- Simple, clean background
  (심플하고 깔끔한 배경)
- Subtle product placement
  (은은한 제품 배치)
- Soft, reassuring atmosphere
  (부드럽고 안심되는 분위기)
- Professional yet approachable
  (전문적이지만 친근한)

[STYLE]
(스타일)
${audienceStyle}
Helpful, trustworthy aesthetic
(도움이 되고 신뢰감 있는 미학)
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,

    CUSTOM: `Create KOREAN E-COMMERCE IMAGE for ${productName}.
(한국 이커머스 이미지 생성)
${i2iPrefix}
[COMPOSITION]
(구성)
- Premium Korean beauty aesthetic
  (프리미엄 한국 뷰티 미학)
- Product featured beautifully
  (제품이 아름답게 피처링)
- Decorative elements: ${ingredientObjects.join(', ')}
  (장식 요소)

[STYLE]
(스타일)
${audienceStyle}
${featureHighlight}
8K resolution, no text in image
(8K 해상도, 이미지 내 텍스트 없음)`,
  };

  // CUSTOM은 항상 정의되어 있으므로 non-null assertion 사용
  return prompts[sectionType] || prompts.CUSTOM!;
}

// ============================================
// ★★★ 공통 상수 (T2I/I2I 모두 사용) ★★★
// ============================================

/**
 * Flash 모델용 이미지 내 텍스트 생성 금지 강화 프롬프트
 */
const NO_TEXT_IN_IMAGE_REINFORCEMENT = `
[⚠️⚠️⚠️ CRITICAL - ABSOLUTELY NO TEXT IN IMAGE ⚠️⚠️⚠️]
(절대 이미지 안에 텍스트 금지)

★★★ THIS IS THE MOST IMPORTANT RULE ★★★
(이것이 가장 중요한 규칙입니다)

1. DO NOT generate ANY text, letters, words, numbers, or typography INSIDE the image
   (이미지 내부에 텍스트, 글자, 단어, 숫자, 타이포그래피 생성 금지)
2. DO NOT render Korean, English, Chinese, or ANY language text in the image
   (한글, 영어, 중국어 등 어떤 언어 텍스트도 이미지에 렌더링 금지)
3. The image must be 100% PURELY VISUAL: only product, background, props, lighting, effects
   (이미지는 100% 순수 비주얼: 제품, 배경, 소품, 조명, 효과만)
4. NEVER attempt to write "24H", "95%", "글로시", "촉촉한", or ANY text directly in the image
   (이미지에 직접 텍스트 쓰기 시도 금지)
5. Korean text especially MUST NOT appear in images - it will look broken and distorted!
   (특히 한글은 이미지에 절대 안됨 - 깨져서 보임!)

★ WHERE TEXT GOES:
(텍스트가 가는 곳)
- All text content → overlay JSON
  (모든 텍스트 내용 → 오버레이 JSON)
- The frontend renders text ON TOP of your clean image using HTML/CSS
  (프론트엔드가 HTML/CSS로 깨끗한 이미지 위에 텍스트 렌더링)
- Your job: generate a beautiful TEXT-FREE background image only
  (당신의 역할: 텍스트 없는 아름다운 배경 이미지만 생성)

★ VIOLATION = FAILED IMAGE:
(위반 = 실패한 이미지)
- If ANY text/letters/numbers/Korean characters appear in the generated image, it is REJECTED
  (텍스트/글자/숫자/한글이 이미지에 나타나면 거부됨)
- This includes: product labels with text, stats, titles, Korean words, watermarks, ANY text at all
  (포함: 텍스트가 있는 제품 라벨, 통계, 제목, 한글, 워터마크, 모든 텍스트)
- Generate ONLY: product visuals, backgrounds, lighting effects, decorative elements - NO TEXT
  (생성: 제품 비주얼, 배경, 조명 효과, 장식 요소만 - 텍스트 없음)
`;

/**
 * 자유로운 크리에이티브 오버레이 디자인 가이드 (% 좌표계)
 * @param aspectRatio - 이미지 비율 (1:1, 3:4, 16:9 등)
 */
function buildCreativeOverlayGuide(aspectRatio?: string): string {
  const resolution = getResolutionForAspectRatio(aspectRatio);
  const { width, height } = resolution;
  const isWide = width > height;  // 16:9 등 가로형
  const isTall = height > width;  // 3:4, 9:16 등 세로형

  return `
[★ CREATIVE OVERLAY TEXT DESIGN ★]

You are a trendy Korean e-commerce detail page designer.
(당신은 트렌디한 한국 이커머스 상세페이지 디자이너입니다.)

Return only detail-page style text design to be placed on top of the image, freely based on the image to be generated and the prompt context.
(생성될 이미지와 사용된 프롬프트 상황에 맞게 자유롭게 이미지 위에 얹을 상세페이지 스타일 텍스트 디자인만 반환하세요.)

Design CREATIVE, PLAYFUL, and BOLD typography that matches the generated image!
(생성될 이미지에 어울리는 창의적이고, 키치하고, 대담한 타이포그래피를 디자인하세요!)

★★★ DESIGN FREEDOM ★★★
(디자인 자유도)
- Look at the image and design text that COMPLEMENTS it
  (이미지를 보고 어울리는 텍스트를 디자인)
- Be creative with placement - not everything needs to be centered!
  (창의적인 배치 - 모든 것이 중앙 정렬일 필요 없음!)
- Use unexpected positions, dynamic layouts, asymmetric designs
  (예상치 못한 위치, 다이나믹한 레이아웃, 비대칭 디자인)
- Mix different sizes dramatically for visual impact
  (시각적 임팩트를 위해 다양한 크기를 과감하게 믹스)

★★★ COORDINATE SYSTEM: PERCENTAGE 0-100 ★★★
(좌표 시스템: 퍼센트 0-100)
Image aspect ratio: ${aspectRatio || '3:4'} (${width}x${height}px)
(이미지 비율)
${isWide ? `⚠️ WIDE FORMAT: Horizontal banner - spread text across width
  (가로형: 텍스트를 너비에 걸쳐 배치)` : ''}
${isTall ? `⚠️ TALL FORMAT: Vertical layout - stack text vertically
  (세로형: 텍스트를 세로로 쌓기)` : ''}

- x: 0-100 (0=left, 50=center, 100=right) - PERCENTAGE!
  (0=왼쪽, 50=중앙, 100=오른쪽 - 퍼센트!)
- y: 0-100 (0=top, 50=middle, 100=bottom) - PERCENTAGE!
  (0=상단, 50=중앙, 100=하단 - 퍼센트!)
- fontSize: 12-72px - be bold with sizes!
  (크기를 과감하게!)
- Place texts where they look BEST with the image
  (이미지에 가장 잘 어울리는 위치에 배치)

★★★ COLOR & STYLE INSPIRATION ★★★
(컬러 & 스타일 영감)
- Vibrant: #FF6B6B, #4ECDC4, #FFE66D, #FF8C42
  (비비드)
- Elegant: #2C3E50, #E74C3C, #1ABC9C, #9B59B6
  (엘레강스)
- Luxurious: #C9B037, #BF9270, #2E4057, #8B4513
  (럭셔리)
- Pastel: #FFB3BA, #BAFFC9, #BAE1FF, #FFFFBA
  (파스텔)
- Match colors to the image mood!
  (이미지 무드에 맞는 컬러 매칭!)

CRITICAL RULES:
(중요 규칙)
- fontSize: INTEGER 12-72
  (정수 12-72)
- x, y: INTEGER 0-100 PERCENTAGE, NOT pixels!
  (정수 0-100 퍼센트, 픽셀 아님!)
- Do NOT overlap texts - maintain 10+ gap
  (텍스트 겹침 금지 - 10% 이상 간격 유지)
- Make it look like professional Korean detail page design!
  (전문적인 한국 상세페이지 디자인처럼!)
`;
}

/**
 * 타겟 고객 기반 스타일 문자열 생성
 */
function buildAudienceStyle(targetAudience?: string): string {
  if (!targetAudience) return 'Premium universal appeal';

  const audienceLower = targetAudience.toLowerCase();
  if (audienceLower.includes('20대') || audienceLower.includes('young') || audienceLower.includes('젊')) {
    return 'trendy, vibrant, youthful energy';
  } else if (audienceLower.includes('30대') || audienceLower.includes('40대') || audienceLower.includes('mature')) {
    return 'sophisticated, elegant, refined luxury';
  } else if (audienceLower.includes('남성') || audienceLower.includes('men') || audienceLower.includes('male')) {
    return 'masculine, bold, minimalist strength';
  } else if (audienceLower.includes('민감') || audienceLower.includes('sensitive')) {
    return 'gentle, calming, pure and clean';
  }
  return 'Premium universal appeal';
}

/**
 * 핵심 특징 강조 문자열 생성
 */
function buildFeatureHighlight(keyFeatures?: string[]): string {
  return keyFeatures && keyFeatures.length > 0
    ? `Emphasize: ${keyFeatures[0]}`
    : 'Highlight product quality';
}

/**
 * 오버레이 텍스트 요청 프롬프트 생성 (공통)
 * @param overlayTextPrompt - 오버레이 텍스트 프롬프트
 * @param isFlashModel - Flash 모델 여부 (텍스트 금지 강화)
 * @param aspectRatio - 이미지 비율 (좌표계 결정용)
 */
function buildOverlayTextRequest(overlayTextPrompt: string, isFlashModel: boolean, aspectRatio?: string): string {
  const noTextReinforcement = isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : '';
  const creativeGuide = buildCreativeOverlayGuide(aspectRatio);

  return `

[★★★ OUTPUT REQUIREMENTS ★★★]
(출력 요구사항)

1. GENERATE IMAGE FIRST (REQUIRED) - This is the primary output
   (이미지 먼저 생성 (필수) - 이것이 주요 출력)
2. THEN return overlay text JSON for placing text ON TOP of the generated image
   (그 다음 생성된 이미지 위에 배치할 오버레이 텍스트 JSON 반환)

[OVERLAY TEXT = Text to be placed ON TOP of the generated image]
(오버레이 텍스트 = 생성된 이미지 위에 배치할 텍스트)
- NOT text inside the image
  (이미지 안에 들어가는 텍스트가 아님)
- This is typography metadata: content, position, style for frontend rendering
  (프론트엔드 렌더링을 위한 타이포그래피 메타데이터: 내용, 위치, 스타일)
- The overlay will be rendered as HTML/CSS on top of your clean image
  (오버레이는 깨끗한 이미지 위에 HTML/CSS로 렌더링됨)
${noTextReinforcement}
${creativeGuide}
${overlayTextPrompt}

CRITICAL: You MUST generate an image. The overlay JSON is additional metadata for text positioning.
(중요: 반드시 이미지를 생성해야 합니다. 오버레이 JSON은 텍스트 배치를 위한 추가 메타데이터입니다.)`;
}

/**
 * 다양한 섹션 타입명을 기본 SectionType으로 변환
 * ★ 새로운 섹션 타입도 자동 매핑 (패턴 기반)
 *
 * 매핑 규칙 (우선순위 순):
 * 1. REVIEW|SOCIAL|TESTIMONIAL|PROOF|SHOWCASE → SOCIAL_PROOF
 * 2. HOW_TO|USAGE|STEP|GUIDE → HOW_TO_USE
 * 3. FEATURE|BENEFIT|INGREDIENT|SPEC → FEATURES
 * 4. HERO|BANNER|HEADER|KEY_MESSAGE|DIVIDER → HERO (★ BRAND_HEADER 포함!)
 * 5. BRAND_TRUST|AWARD|RANKING → FEATURES (브랜드 신뢰/수상/랭킹)
 * 6. FAQ|QUESTION → FAQ
 * 7. MAIN|THUMBNAIL → MAIN
 * 8. 그 외 → FEATURES (기본값)
 */
function mapToBaseSectionType(type: string): SectionType {
  const upperType = type.toUpperCase();

  // REVIEW, SOCIAL, TESTIMONIAL 관련 → SOCIAL_PROOF
  if (/REVIEW|SOCIAL|TESTIMONIAL|PROOF|SHOWCASE/.test(upperType)) {
    return 'SOCIAL_PROOF';
  }
  // HOW_TO, USAGE, STEP 관련 → HOW_TO_USE
  if (/HOW_TO|USAGE|STEP|GUIDE/.test(upperType)) {
    return 'HOW_TO_USE';
  }
  // FEATURE, BENEFIT, INGREDIENT, SPEC 관련 → FEATURES
  if (/FEATURE|BENEFIT|INGREDIENT|SPEC/.test(upperType)) {
    return 'FEATURES';
  }
  // ★★★ HERO, BANNER, HEADER, TEXT_BANNER, KEY_MESSAGE, DIVIDER 관련 → HERO
  // ★ BRAND_HEADER 등 HEADER 포함 섹션은 HERO로 매핑 (BRAND보다 먼저 체크!)
  if (/HERO|BANNER|HEADER|KEY_MESSAGE|DIVIDER/.test(upperType)) {
    return 'HERO';
  }
  // ★ BRAND_TRUST, AWARD, RANKING 등 확장 타입 → FEATURES (HEADER 제외)
  if (/BRAND_TRUST|AWARD|RANKING/.test(upperType)) {
    return 'FEATURES';
  }
  // FAQ 관련
  if (/FAQ|QUESTION/.test(upperType)) {
    return 'FAQ';
  }
  // MAIN 관련
  if (/MAIN|THUMBNAIL/.test(upperType)) {
    return 'MAIN';
  }
  // ★ 첫 번째 단어가 기본 타입인 경우 (FEATURES_1, HERO_2 등)
  const firstWord = upperType.split('_')[0];
  if (['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'].includes(firstWord)) {
    return firstWord as SectionType;
  }
  // 기본값 - 미정의 섹션도 FEATURES로 처리
  console.log(`[mapToBaseSectionType] Unknown section type: ${type} → FEATURES`);
  return 'FEATURES';
}

// Singleton Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }

    geminiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }

  return geminiClient;
}

// Gemini 이미지 생성 지원 모델
// - gemini-2.5-flash-image: Image-to-Image 지원 (Nano Banana), 빠른 속도, 1024px
// - gemini-3-pro-image-preview: Image-to-Image 지원 (Nano Banana Pro), 고품질, 4K
// - gemini-2.0-flash-exp: Text/Vision 모델 (Image-to-Image 미지원)
export type GeminiImageModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

// Image-to-Image를 지원하는 모델 (기본값으로 사용)
export const DEFAULT_IMAGE_MODEL: GeminiImageModel = 'gemini-2.5-flash-image';
export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GeminiGenerateImageOptions {
  prompt: string;
  model?: GeminiImageModel;
  aspectRatio?: ImageAspectRatio;
  numberOfImages?: number;
}

export interface GeminiGeneratedImage {
  base64Data: string;
  mimeType: string;
  revisedPrompt?: string;
  // ★ 이미지 모델이 함께 리턴한 오버레이 텍스트
  overlayText?: OverlayTextContent;
  // ★★★ 개발자 모드용 개별 프롬프트 구성요소 (분류별) ★★★
  promptComponents?: {
    // [1] 섹션별 프롬프트
    sectionBasePrompt?: string;        // 섹션별 기본 프롬프트 (buildSharedSectionPrompt - MAIN, HERO, FEATURES 등)
    orchestrationPrompt?: string;      // 오케스트레이션 AI가 생성한 시나리오
    categoryTemplatePrompt?: string;   // (deprecated) 섹션별 카테고리 템플릿 - sectionBasePrompt 사용
    i2iSystemPrompt?: string;          // I2I 시스템 프롬프트 (제품 재배치 규칙)
    // [2] 카테고리별 프롬프트 (뷰티 서브카테고리)
    categoryPrompt?: string;           // 카테고리별 고도화 프롬프트 (스킨케어/립/선케어 등)
    subCategory?: string;              // 서브카테고리명 (skincare, lip, suncare 등)
    // [3] 오버레이 텍스트 관련 프롬프트
    overlayTextPrompt?: string;        // 섹션별 오버레이 텍스트 프롬프트 (buildOverlayTextPrompt)
    overlayGuidePrompt?: string;       // 오버레이 디자인 가이드 (buildCreativeOverlayGuide - 공통)
    overlayOutputRequirements?: string; // 오버레이 출력 요구사항 (buildOverlayTextRequest - 공통)
    // [4] 공통 프롬프트 (Flash 모델 전용)
    noTextReinforcement?: string;      // Flash 모델용 텍스트 금지 강화 프롬프트 (NO_TEXT_IN_IMAGE_REINFORCEMENT)
    // [5] 레거시 (이전 호환성)
    fixedPrompt?: string;              // 고정 프롬프트 (제품일관성, 품질, no-text, 네거티브)
    dynamicPrompt?: string;            // 동적 프롬프트 (테마, 섹션템플릿, 오케스트레이션 등)
  };
}

/**
 * Generate images using Gemini image generation models
 * Supports: gemini-2.0-flash-exp, gemini-2.5-flash-preview-05-20
 */
export async function generateImageWithGemini(
  options: GeminiGenerateImageOptions
): Promise<GeminiGeneratedImage[]> {
  const {
    prompt,
    model = 'gemini-2.5-flash-image',
    aspectRatio,
  } = options;

  const client = getGeminiClient();
  const results: GeminiGeneratedImage[] = [];

  try {
    console.log(`[Gemini] Generating image with model: ${model}, aspectRatio: ${aspectRatio || 'free'}`);
    console.log(`[Gemini] Prompt: ${prompt.substring(0, 100)}...`);

    // ★★★ T2I 모드: Google AI 공식 문서 형식 그대로 사용 ★★★
    console.log(`[Gemini T2I] ★★★ Sending TEXT-TO-IMAGE request ★★★`);
    console.log(`[Gemini T2I] Model: ${model}`);
    console.log(`[Gemini T2I] AspectRatio: ${aspectRatio || 'free'} (via imageConfig)`);
    console.log(`[Gemini T2I] Prompt length: ${prompt.length} chars`);

    let response;
    try {
      // ★★★ T2I: responseModalities로 이미지 생성 강제 + imageConfig로 비율 설정 ★★★
      response = await client.models.generateContent({
        model: model,
        contents: [prompt],
        config: {
          responseModalities: ['Image', 'Text'],  // ★ 이미지 생성 강제
          ...(aspectRatio && {
            imageConfig: {
              aspectRatio: aspectRatio,
            },
          }),
        },
      });
    } catch (apiError: unknown) {
      const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
      console.error(`[Gemini T2I] ★★★ API CALL FAILED ★★★`);
      console.error(`[Gemini T2I] Error: ${errMsg}`);
      console.error(`[Gemini T2I] Full error:`, apiError);
      throw apiError;
    }

    // Process response parts to extract images AND text (overlay)
    let extractedOverlayText: OverlayTextContent | undefined;

    // ★★★ API 응답 디버깅 ★★★
    console.log(`[Gemini T2I] ★ Response debug:`, JSON.stringify({
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      hasContent: !!response.candidates?.[0]?.content,
      hasParts: !!response.candidates?.[0]?.content?.parts,
      partsLength: response.candidates?.[0]?.content?.parts?.length,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings?.map(r => `${r.category}:${r.probability}`),
    }));

    if (response.candidates && response.candidates[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      console.log(`[Gemini] Processing ${parts.length} parts...`);

      for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        const part = parts[partIdx];
        console.log(`[Gemini] Part ${partIdx}: hasInlineData=${!!part.inlineData}, hasText=${!!part.text}`);

        // ★ 이미지 추출
        if (part.inlineData && part.inlineData.data) {
          console.log(`[Gemini] Image generated, mimeType: ${part.inlineData.mimeType}`);
          results.push({
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          });
        }
        // ★ 텍스트 추출 (오버레이 텍스트 JSON)
        if (part.text) {
          try {
            let jsonStr = part.text.trim();
            // JSON 코드블록 제거
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            const parsed = JSON.parse(jsonStr) as OverlayTextContent & { texts?: OverlayTextItem[] };

            // texts 배열이 있으면 그대로 사용
            if (parsed.texts && Array.isArray(parsed.texts)) {
              extractedOverlayText = { texts: parsed.texts };
              console.log(`[Gemini] ★ Overlay text extracted from image model: ${parsed.texts.length} texts`);
            } else if (parsed.headline || parsed.subheadline) {
              // 기존 형식도 지원
              extractedOverlayText = parsed;
              console.log(`[Gemini] ★ Overlay text extracted from image model (legacy format)`);
            }
          } catch {
            // JSON 파싱 실패 시 무시 (일반 텍스트일 수 있음)
            console.log(`[Gemini] Text response (not overlay JSON): ${part.text.substring(0, 100)}...`);
          }
        }
      }
    }

    // ★ 이미지에 오버레이 텍스트 첨부
    if (extractedOverlayText && results.length > 0) {
      results[0].overlayText = extractedOverlayText;
    }

    // ★★★ 이미지 생성 실패 시 상세 로그 ★★★
    if (results.length === 0) {
      console.error(`[Gemini] ⚠️ NO IMAGE GENERATED! API returned no image data.`);
      console.error(`[Gemini] ⚠️ Prompt used (first 500 chars): ${prompt.substring(0, 500)}...`);
      console.error(`[Gemini] ⚠️ Model: ${model}, aspectRatio: ${aspectRatio}`);
    }

    console.log(`[Gemini] Total images generated: ${results.length}, overlayText: ${extractedOverlayText ? 'YES' : 'NO'}`);
    return results;
  } catch (error) {
    console.error('[Gemini] Image generation error:', error);
    throw error;
  }
}

/**
 * Generate product hero image using Gemini
 */
export async function generateProductHeroImageWithGemini(
  productName: string,
  category: string,
  brandStyle?: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image'
): Promise<GeminiGeneratedImage> {
  const prompt = buildProductHeroPrompt(productName, category, brandStyle);

  const images = await generateImageWithGemini({
    prompt,
    model,
    aspectRatio: '16:9',
  });

  if (images.length === 0) {
    throw new Error('No image generated');
  }

  return images[0];
}

/**
 * Generate product feature image using Gemini
 */
export async function generateProductFeatureImageWithGemini(
  productName: string,
  feature: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image'
): Promise<GeminiGeneratedImage> {
  const prompt = `Professional product photography showcasing ${productName}'s ${feature}.
Clean white background, studio lighting, high-end commercial photography style.
Focus on the feature detail, minimalist composition.
Create a high-quality product image.`;

  const images = await generateImageWithGemini({
    prompt,
    model,
    aspectRatio: '1:1',
  });

  if (images.length === 0) {
    throw new Error('No image generated');
  }

  return images[0];
}

/**
 * Generate lifestyle/context image using Gemini
 */
export async function generateLifestyleImageWithGemini(
  productName: string,
  targetAudience: string,
  scenario: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image'
): Promise<GeminiGeneratedImage> {
  const prompt = `Lifestyle photography of ${productName} being used by ${targetAudience} in ${scenario}.
Natural lighting, authentic moment, aspirational but relatable.
High-quality commercial lifestyle photography.
Create a realistic and appealing lifestyle image.`;

  const images = await generateImageWithGemini({
    prompt,
    model,
    aspectRatio: '16:9',
  });

  if (images.length === 0) {
    throw new Error('No image generated');
  }

  return images[0];
}

/**
 * Generate section images for detail page
 */
export async function generateDetailPageImagesWithGemini(
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image'
): Promise<{
  heroImage: GeminiGeneratedImage;
  featureImages: GeminiGeneratedImage[];
}> {
  // Generate hero image
  const heroImage = await generateProductHeroImageWithGemini(
    productName,
    category,
    brandStyle,
    model
  );

  // Generate feature images (up to 3)
  const featureImages: GeminiGeneratedImage[] = [];
  const featuresToGenerate = keyFeatures.slice(0, 3);

  for (const feature of featuresToGenerate) {
    try {
      const featureImage = await generateProductFeatureImageWithGemini(
        productName,
        feature,
        model
      );
      featureImages.push(featureImage);
    } catch (error) {
      console.error(`Failed to generate feature image for: ${feature}`, error);
    }
  }

  return {
    heroImage,
    featureImages,
  };
}

/**
 * 매번 다른 분위기 오브제 조합을 선택하는 헬퍼 함수
 */
function selectRandomMoodObjects(): { selected: string[]; style: string } {
  const moodCategories = [
    { style: 'Romantic/Feminine', objects: ['soft silk fabric draped elegantly', 'dried flower petals', 'satin ribbon curls', 'delicate lace edge'] },
    { style: 'Fresh/Natural', objects: ['crystal water droplets', 'fresh green leaves', 'morning dew on petals', 'bamboo elements'] },
    { style: 'Luxurious/Premium', objects: ['velvet texture backdrop', 'crystal prism accents', 'gold metallic accents', 'pearl scattered'] },
    { style: 'Clean/Minimal', objects: ['smooth white pebbles', 'geometric marble shapes', 'frosted glass elements', 'simple ceramic'] },
    { style: 'Warm/Cozy', objects: ['cream cashmere fabric', 'natural wood slice', 'warm-toned dried flowers', 'cork elements'] },
    { style: 'Cool/Refreshing', objects: ['ice cube accents', 'water splash frozen', 'mint leaves', 'blue-tinted glass'] },
  ];

  // 랜덤하게 무드 카테고리 선택
  const randomIndex = Math.floor(Math.random() * moodCategories.length);
  const selectedMood = moodCategories[randomIndex];

  // 해당 카테고리에서 1-2개 랜덤 선택
  const shuffled = [...selectedMood.objects].sort(() => Math.random() - 0.5);
  const count = 1 + Math.floor(Math.random() * 2); // 1-2개

  return {
    selected: shuffled.slice(0, count),
    style: selectedMood.style
  };
}

/**
 * 제품명에서 재료 키워드 추출 및 구체적 오브제 반환
 */
function extractIngredientObjects(productName: string, category: string): string[] {
  const lowerName = productName.toLowerCase();
  const ingredients: string[] = [];

  // 제품명에서 키워드 매칭
  if (lowerName.includes('로즈') || lowerName.includes('rose') || lowerName.includes('장미')) {
    ingredients.push('fresh pink roses', 'scattered rose petals');
  }
  if (lowerName.includes('베리') || lowerName.includes('berry')) {
    const berries = ['fresh strawberries', 'ripe raspberries', 'blueberries with water droplets'];
    ingredients.push(berries[Math.floor(Math.random() * berries.length)]);
  }
  if (lowerName.includes('허니') || lowerName.includes('honey') || lowerName.includes('꿀')) {
    ingredients.push('golden honey drip', 'honeycomb piece');
  }
  if (lowerName.includes('그린티') || lowerName.includes('녹차') || lowerName.includes('green tea')) {
    ingredients.push('fresh green tea leaves', 'matcha powder dusting');
  }
  if (lowerName.includes('시트러스') || lowerName.includes('citrus') || lowerName.includes('레몬') || lowerName.includes('오렌지')) {
    ingredients.push('citrus fruit slices with water droplets');
  }
  if (lowerName.includes('라벤더') || lowerName.includes('lavender')) {
    ingredients.push('lavender sprigs', 'dried lavender buds');
  }
  if (lowerName.includes('민트') || lowerName.includes('mint')) {
    ingredients.push('fresh mint leaves');
  }
  if (lowerName.includes('코코넛') || lowerName.includes('coconut')) {
    ingredients.push('coconut pieces', 'coconut flakes');
  }
  if (lowerName.includes('아보카도') || lowerName.includes('avocado')) {
    ingredients.push('creamy avocado slices');
  }
  if (lowerName.includes('알로에') || lowerName.includes('aloe')) {
    ingredients.push('aloe vera gel texture', 'aloe leaves');
  }
  if (lowerName.includes('진주') || lowerName.includes('pearl')) {
    ingredients.push('pearl beads scattered elegantly');
  }
  if (lowerName.includes('골드') || lowerName.includes('gold')) {
    ingredients.push('gold leaf accents', 'gold flakes');
  }
  if (lowerName.includes('히알루론') || lowerName.includes('hyaluronic') || lowerName.includes('수분')) {
    ingredients.push('water droplets', 'hydrating gel texture');
  }
  if (lowerName.includes('비타민') || lowerName.includes('vitamin') || lowerName.includes('c')) {
    ingredients.push('fresh orange slices', 'vitamin capsules');
  }
  if (lowerName.includes('콜라겐') || lowerName.includes('collagen')) {
    ingredients.push('gel texture swirls', 'protein molecule visualization');
  }

  // 매칭되는 키워드 없으면 카테고리 기반 기본 오브제
  if (ingredients.length === 0) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('립') || categoryLower.includes('lip')) {
      ingredients.push('fresh flower petals', 'glossy texture elements');
    } else if (categoryLower.includes('스킨') || categoryLower.includes('skin')) {
      ingredients.push('water droplets', 'fresh botanical leaves');
    } else if (categoryLower.includes('헤어') || categoryLower.includes('hair')) {
      ingredients.push('silk strands', 'natural oil droplets');
    } else {
      ingredients.push('elegant botanical elements', 'natural texture accents');
    }
  }

  // 최대 2개만 반환 (랜덤 셔플)
  return ingredients.sort(() => Math.random() - 0.5).slice(0, 2);
}

/**
 * 섹션 타입별 Text-to-Image 생성
 * - MAIN: 1:1 정사각형
 * - TEXT_BANNER, DIVIDER_VISUAL, KEY_MESSAGE 등 텍스트 배경: 16:9 가로
 * - 나머지: 자유 비율
 */
export async function generateSectionImageWithGemini(
  sectionType: string,  // ★ I2I와 동일하게 모든 섹션 타입 허용
  imagePrompt: string,
  productName: string,
  category: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image',
  keyFeatures?: string[],
  targetAudience?: string
): Promise<GeminiGeneratedImage> {
  // ★★★ 모듈 레벨 mapToBaseSectionType 사용 (I2I와 동일) ★★★
  const mappedSectionType = mapToBaseSectionType(sectionType);
  console.log(`[Gemini T2I] Section type mapping: ${sectionType} → ${mappedSectionType}`);

  // ★★★ 섹션별 aspectRatio 결정 (공통 함수 사용) ★★★
  // - MAIN: 1:1, TEXT_BANNER/DIVIDER_VISUAL 등: 16:9, 나머지: 자유
  const aspectRatio = getSectionAspectRatio(sectionType);

  // ★★★ 공통 함수 사용 (T2I/I2I 동일) ★★★
  const ingredientObjects = extractIngredientObjects(productName, category);
  const moodSelection = selectRandomMoodObjects();
  const audienceStyle = buildAudienceStyle(targetAudience);
  const featureHighlight = buildFeatureHighlight(keyFeatures);

  // ★★★ 공통 섹션 프롬프트 템플릿 사용 ★★★
  let sectionPrompt = buildSharedSectionPrompt(mappedSectionType, {
    productName,
    category,
    ingredientObjects,
    moodSelection: moodSelection.selected,
    audienceStyle,
    featureHighlight,
    isI2I: false,  // T2I 모드
  });

  // ★ imagePrompt가 있으면 오케스트레이션 컨텍스트로 추가 (MAIN 제외)
  if (mappedSectionType !== 'MAIN' && imagePrompt && imagePrompt.trim()) {
    sectionPrompt = `${sectionPrompt}

[ORCHESTRATION CONTEXT - 상세페이지 전체 메시지]
${imagePrompt}`;
  }

  console.log(`[Gemini T2I] Using shared section template for ${sectionType} → ${mappedSectionType}`);

  // ★★★ 공통 오버레이 텍스트 요청 생성 ★★★
  const overlayTextPrompt = buildOverlayTextPrompt(
    mappedSectionType as SectionType,
    productName,
    category,
    keyFeatures || [],
    targetAudience || 'General'
  );

  const isFlashModel = model === 'gemini-2.5-flash-image';
  const overlayTextRequest = buildOverlayTextRequest(overlayTextPrompt, isFlashModel, aspectRatio);

  const finalPrompt = sectionPrompt + overlayTextRequest;

  console.log(`[Gemini T2I] Generating ${sectionType} (→${mappedSectionType}) with aspectRatio: ${aspectRatio || '3:4'}, with overlay text request`);

  // ★★★ 프롬프트 구성요소 분리 (개발자 모드용) ★★★
  // 섹션 기본 프롬프트 (buildSharedSectionPrompt 결과)
  const sectionBasePrompt = buildSharedSectionPrompt(mappedSectionType, {
    productName,
    category,
    ingredientObjects,
    moodSelection: moodSelection.selected,
    audienceStyle,
    featureHighlight,
    isI2I: false,
  });

  const images = await generateImageWithGemini({
    prompt: finalPrompt,  // ★ 오버레이 텍스트 요청 포함된 프롬프트
    model,
    aspectRatio,
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType}`);
  }

  // 최종 사용된 프롬프트를 revisedPrompt로 반환 + 개별 프롬프트 구성요소 포함
  return {
    ...images[0],
    revisedPrompt: finalPrompt,
    // ★★★ 개발자 모드용: 개별 프롬프트 구성요소 (UI에서 분리 표시) ★★★
    promptComponents: {
      // [1] 섹션별 프롬프트
      sectionBasePrompt,                                      // 섹션별 기본 프롬프트 (MAIN, HERO, FEATURES 등)
      orchestrationPrompt: (mappedSectionType !== 'MAIN' && imagePrompt) ? imagePrompt : undefined,  // 오케스트레이션 AI 생성 시나리오
      // [2] 오버레이 텍스트 관련 프롬프트
      overlayTextPrompt,                                      // 섹션별 오버레이 텍스트 프롬프트
      overlayGuidePrompt: buildCreativeOverlayGuide(aspectRatio),  // 오버레이 디자인 가이드 (공통)
      // [3] 공통 프롬프트 (Flash 모델 전용)
      noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,  // Flash 모델용 텍스트 금지 강화
    },
  };
}

/**
 * Build prompt for product hero image
 */
function buildProductHeroPrompt(
  productName: string,
  category: string,
  brandStyle?: string
): string {
  const basePrompt = `Professional product photography of ${productName} (${category}).
Hero shot composition with dramatic lighting.
Premium, high-end commercial photography style.
Create a stunning product image suitable for an e-commerce detail page.`;

  if (brandStyle) {
    return `${basePrompt}
Brand aesthetic: ${brandStyle}.
Maintain brand consistency in color palette and mood.`;
  }

  return `${basePrompt}
Modern, clean aesthetic with soft shadows and reflections.`;
}

/**
 * Convert base64 image to data URL
 */
export function base64ToDataUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

/**
 * URL을 base64 data URL로 변환
 * - 이미 data URL이면 그대로 반환
 * - 상대 경로(/uploads/...)면 서버에서 fetch하여 base64로 변환
 * - 외부 URL이면 fetch하여 base64로 변환
 */
export async function urlToBase64DataUrl(imageUrl: string): Promise<string> {
  // 이미 data URL인 경우 그대로 반환
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    let fetchUrl = imageUrl;

    // 상대 경로인 경우 절대 경로로 변환
    if (imageUrl.startsWith('/')) {
      // Docker 내부에서는 항상 localhost:3000 사용
      fetchUrl = `http://localhost:3000${imageUrl}`;
    }
    // localhost:3002 (외부 포트) → localhost:3000 (내부 포트) 변환
    else if (imageUrl.includes('localhost:3002')) {
      fetchUrl = imageUrl.replace('localhost:3002', 'localhost:3000');
    }

    console.log(`[Image Utils] Fetching image from: ${fetchUrl}`);

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Content-Type 가져오기
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const dataUrl = `data:${contentType};base64,${base64}`;
    console.log(`[Image Utils] Converted to base64 (${Math.round(base64.length / 1024)}KB)`);

    return dataUrl;
  } catch (error) {
    console.error('[Image Utils] Failed to convert URL to base64:', error);
    throw error;
  }
}

// ============================================
// 배경 제거 기능
// ============================================

export interface RemoveBackgroundOptions {
  /** 원본 이미지 (base64 또는 data URL) */
  sourceImage: string;
  /** 모델 선택 */
  model?: GeminiImageModel;
  /** 투명 배경 여부 (true: 투명, false: 흰색 배경) */
  transparent?: boolean;
}

/**
 * 배경 제거: 제품 이미지에서 배경을 제거하고 제품만 추출
 * - Gemini의 이미지 편집 기능 활용
 * - 투명 배경 또는 흰색 배경 선택 가능
 */
export async function removeBackground(
  options: RemoveBackgroundOptions
): Promise<GeminiGeneratedImage> {
  const {
    sourceImage,
    model = DEFAULT_IMAGE_MODEL,  // gemini-2.5-flash-image
    transparent = true,
  } = options;

  const client = getGeminiClient();

  try {
    // base64 데이터 추출 (URL인 경우 fetch하여 변환)
    const { base64, mimeType } = await extractBase64FromSource(sourceImage);

    console.log(`[Gemini BG] Starting background removal`);
    console.log(`[Gemini BG] Model: ${model}, Transparent: ${transparent}`);

    const backgroundStyle = transparent
      ? 'completely transparent background (PNG with alpha channel)'
      : 'pure white background (#FFFFFF)';

    const prompt = `[BACKGROUND REMOVAL TASK]
Remove the background from this product image completely.

REQUIREMENTS:
1. Extract ONLY the product/object from the image
2. Remove ALL background elements
3. Keep the product exactly as it is - same shape, color, details
4. Output with ${backgroundStyle}
5. Maintain high quality and sharp edges around the product
6. No shadows unless they are part of the product itself

OUTPUT: Clean product cutout with ${backgroundStyle}, professional e-commerce quality.`;

    // Gemini에 이미지 + 배경 제거 요청 전송
    const response = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    // 응답에서 이미지 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`[Gemini BG] Background removed successfully`);
          return {
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
    }

    throw new Error('No image returned from background removal');
  } catch (error) {
    console.error('[Gemini BG] Background removal error:', error);
    throw error;
  }
}

/**
 * 제품 이미지 전처리: 배경 제거 후 Image-to-Image에 사용할 수 있는 형태로 반환
 */
export async function preprocessProductImage(
  sourceImage: string,
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL  // gemini-2.5-flash-image
): Promise<string> {
  try {
    console.log('[Gemini] Preprocessing product image (removing background)...');

    // ★ transparent: false로 변경 - 흰색 배경 사용
    // Gemini가 투명 배경을 바둑판 패턴으로 렌더링하는 문제 방지
    const result = await removeBackground({
      sourceImage,
      model,
      transparent: false,  // 흰색 배경 (#FFFFFF)
    });

    const dataUrl = base64ToDataUrl(result.base64Data, result.mimeType);
    console.log('[Gemini] Product image preprocessed successfully');

    return dataUrl;
  } catch (error) {
    console.error('[Gemini] Failed to preprocess image, using original:', error);
    // 실패 시 원본 이미지 반환
    return sourceImage;
  }
}

// ============================================
// Image-to-Image 기능 (사용자 제품 이미지 기반)
// ============================================

export interface ImageToImageOptions {
  /** 원본 이미지 (base64 또는 data URL) */
  sourceImage: string;
  /** 변환 프롬프트 */
  prompt: string;
  /** 모델 선택 */
  model?: GeminiImageModel;
  /** 원본 이미지 유지 강도 (0.0 ~ 1.0, 높을수록 원본 유지) */
  preserveStrength?: number;
  /** 출력 이미지 비율 (기본: 3:4 상세페이지용) */
  aspectRatio?: ImageAspectRatio;
}

/**
 * URL, data URL, 또는 순수 base64에서 base64 데이터 추출
 * - HTTP/HTTPS URL: fetch하여 base64 변환
 * - data URL: 파싱하여 base64 추출
 * - 순수 base64: 그대로 반환
 */
async function extractBase64FromSource(source: string): Promise<{ base64: string; mimeType: string }> {
  // HTTP/HTTPS URL인 경우 fetch하여 base64로 변환
  if (source.startsWith('http://') || source.startsWith('https://')) {
    console.log('[Gemini] Fetching image from URL for base64 conversion...');
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // MIME 타입 결정 (확장자 기반 fallback)
      let mimeType = contentType.split(';')[0].trim();
      if (!mimeType.startsWith('image/')) {
        // URL 확장자로 추측
        if (source.endsWith('.webp')) mimeType = 'image/webp';
        else if (source.endsWith('.png')) mimeType = 'image/png';
        else if (source.endsWith('.gif')) mimeType = 'image/gif';
        else mimeType = 'image/jpeg';
      }

      console.log(`[Gemini] Image fetched: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB, ${mimeType}`);
      return { base64, mimeType };
    } catch (error) {
      console.error('[Gemini] Failed to fetch image from URL:', error);
      throw new Error(`Failed to fetch image from URL: ${source}`);
    }
  }

  // data URL 형식인 경우 파싱
  if (source.startsWith('data:')) {
    const matches = source.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { base64: matches[2], mimeType: matches[1] };
    }
    throw new Error('Invalid data URL format');
  }

  // 순수 base64인 경우 그대로 반환
  return { base64: source, mimeType: 'image/jpeg' };
}

/**
 * URL 또는 data URL에서 base64 데이터 추출 (동기 버전 - 레거시 호환)
 * @deprecated extractBase64FromSource 사용 권장
 */
function extractBase64FromDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  // HTTP URL은 동기 함수에서 처리 불가 - 에러 발생시킴
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    throw new Error('HTTP URLs must be processed with extractBase64FromSource (async)');
  }

  // 이미 순수 base64인 경우
  if (!dataUrl.startsWith('data:')) {
    return { base64: dataUrl, mimeType: 'image/jpeg' };
  }

  // data:image/jpeg;base64,... 형식 파싱
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    return { base64: matches[2], mimeType: matches[1] };
  }

  throw new Error('Invalid data URL format');
}

/**
 * Image-to-Image: 사용자 제품 이미지 + 이미지 프롬프트(텍스트)를 함께 입력
 * - 사용자가 업로드한 제품 이미지를 그대로 사용
 * - 기존 오케스트레이션에서 생성된 상세 프롬프트를 함께 전달
 * - 제품 형태/색상 유지, 배경/조명/스타일만 변경
 */
export async function generateImageFromImage(
  options: ImageToImageOptions
): Promise<GeminiGeneratedImage[]> {
  const {
    sourceImage,
    prompt,
    model = DEFAULT_IMAGE_MODEL,  // gemini-2.5-flash-image (Image-to-Image 지원)
    preserveStrength = 0.85,
    aspectRatio,  // undefined면 자유 비율
  } = options;

  const client = getGeminiClient();
  const results: GeminiGeneratedImage[] = [];

  try {
    // base64 데이터 추출 (URL인 경우 fetch하여 변환)
    const { base64, mimeType } = await extractBase64FromSource(sourceImage);

    console.log(`[Gemini I2I] Starting image-to-image generation`);
    console.log(`[Gemini I2I] Model: ${model}, Preserve: ${preserveStrength}, AspectRatio: ${aspectRatio || 'free'}`);
    console.log(`[Gemini I2I] Prompt: ${prompt.substring(0, 150)}...`);

    // 비율 지시 (aspectRatio가 있을 때만)
    let aspectRatioSection = '';
    if (aspectRatio) {
      const aspectRatioInstruction = aspectRatio === '1:1'
        ? 'Output image MUST be SQUARE (1:1 aspect ratio, e.g., 1024x1024).'
        : aspectRatio === '3:4'
        ? 'Output image MUST be portrait orientation (3:4 aspect ratio, e.g., 768x1024).'
        : aspectRatio === '16:9'
        ? 'Output image MUST be landscape orientation (16:9 aspect ratio, e.g., 1024x576).'
        : `Output image aspect ratio: ${aspectRatio}`;
      aspectRatioSection = `\n[IMAGE FORMAT]\n${aspectRatioInstruction}\n`;
    }

    // ★★★ I2I 모드: 제품 모양 유지 + 자연스러운 재배치 ★★★
    // 제품의 모양/디자인은 절대 변경하지 않고, 위치/각도만 재배치
    // 시나리오에 따라 제품을 사용 안해도 됨

    // ★ I2I 시스템 프롬프트 (개발자 모드용으로 별도 저장)
    const i2iSystemPrompt = `[★★★ IMAGE-TO-IMAGE: PRODUCT REPOSITIONING ★★★]

[CRITICAL RULES - 절대 규칙]
1. DO NOT change the product's shape, design, color, or appearance
2. DO NOT create different products or modify the attached products
3. ONLY REPOSITION/REARRANGE the attached products naturally
4. If the scenario doesn't need products, you may omit them entirely

첨부된 제품의 "모양"을 바꾸거나 다른 제품을 만들지 마세요!
오직 "재배치"만 하세요. 시나리오에 제품이 필요없으면 사용하지 않아도 됩니다.

[★★★ REPOSITIONING RULES - 재배치 규칙 ★★★]
- Keep the EXACT product appearance (shape, color, design, packaging)
- Change ONLY: position, angle, size, lighting on the product
- If multiple products in the image: treat each as a separate item and rearrange naturally
- Products can be: tilted, stacked, grouped, partially visible - but SAME SHAPE
- DO NOT copy the original arrangement - ALWAYS rearrange to fit the new scene

제품이 여러개인 경우:
- 각 제품을 개별 아이템으로 인식하세요
- 입력된 배치를 그대로 복사하지 마세요!
- 생성되는 시나리오/상황에 맞게 새롭게 재배치하세요
- 자연스럽게 재배치, 그룹핑, 정렬하세요
- 모든 제품의 원래 모양을 유지하세요

[WHAT YOU CAN DO]
✅ Reposition products to different locations
✅ Adjust product angles (tilt, rotate)
✅ Change product scale for composition
✅ Add new background, lighting, props, atmosphere
✅ Omit products entirely if scenario doesn't need them

[WHAT YOU CANNOT DO]
❌ Change product shape or design
❌ Create new/different products
❌ Modify product colors or packaging
❌ Transform products into something else`;

    const enhancedPrompt = `${i2iSystemPrompt}
${aspectRatioSection}
[CREATIVE DIRECTION / 시나리오]
${prompt}

[OUTPUT]
- Professional Korean e-commerce aesthetic (올리브영/쿠팡 스타일)
- 8K resolution, absolutely no text/typography/watermarks`;

    // Gemini에 이미지 + 텍스트 프롬프트 동시 전송 (Google AI 공식 방식)
    console.log(`[Gemini I2I] ★★★ Sending IMAGE-TO-IMAGE request ★★★`);
    console.log(`[Gemini I2I] Model: ${model}`);
    console.log(`[Gemini I2I] Image attached: YES (${base64.length} chars, mimeType: ${mimeType})`);
    console.log(`[Gemini I2I] AspectRatio: ${aspectRatio || 'free'}`);
    console.log(`[Gemini I2I] Prompt preview: ${enhancedPrompt.substring(0, 200)}...`);

    // image_config 설정 (aspectRatio가 지정된 경우만)
    const imageConfig = aspectRatio ? {
      aspectRatio: aspectRatio,  // "1:1", "3:4", "16:9" 등
      // imageSize: "2K",  // Pro 모델에서 지원 시 활성화
    } : undefined;

    const response = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            // 프롬프트 먼저, 이미지 나중에 (Google AI 예시 순서)
            {
              text: enhancedPrompt,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],  // 텍스트+이미지 동시 응답
        ...(imageConfig && { imageConfig }),
      },
    });

    console.log(`[Gemini I2I] Response received:`, JSON.stringify({
      hasResponse: !!response,
      hasCandidates: !!response?.candidates,
      candidatesCount: response?.candidates?.length,
      hasParts: !!response?.candidates?.[0]?.content?.parts,
      partsCount: response?.candidates?.[0]?.content?.parts?.length,
    }));

    // 응답에서 이미지 AND 텍스트(오버레이) 추출
    let extractedOverlayText: OverlayTextContent | undefined;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        console.log(`[Gemini I2I] Part type:`, part.text ? 'text' : part.inlineData ? 'inlineData' : 'unknown');
        // ★ 이미지 추출
        if (part.inlineData && part.inlineData.data) {
          console.log(`[Gemini I2I] Image generated, mimeType: ${part.inlineData.mimeType}, data length: ${part.inlineData.data.length}`);
          results.push({
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
            // ★ 개발자 모드용: I2I 시스템 프롬프트 포함
            promptComponents: {
              i2iSystemPrompt: i2iSystemPrompt,
            },
          });
        }
        // ★ 텍스트 추출 (오버레이 텍스트 JSON)
        if (part.text) {
          try {
            let jsonStr = part.text.trim();
            // JSON 코드블록 제거
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            const parsed = JSON.parse(jsonStr) as OverlayTextContent & { texts?: OverlayTextItem[] };

            // texts 배열이 있으면 그대로 사용
            if (parsed.texts && Array.isArray(parsed.texts)) {
              extractedOverlayText = { texts: parsed.texts };
              console.log(`[Gemini I2I] ★ Overlay text extracted from image model: ${parsed.texts.length} texts`);
            } else if (parsed.headline || parsed.subheadline) {
              // 기존 형식도 지원
              extractedOverlayText = parsed;
              console.log(`[Gemini I2I] ★ Overlay text extracted from image model (legacy format)`);
            }
          } catch {
            // JSON 파싱 실패 시 무시 (일반 텍스트일 수 있음)
            console.log(`[Gemini I2I] Text response (not overlay JSON): ${part.text.substring(0, 100)}...`);
          }
        }
      }
    } else {
      console.warn(`[Gemini I2I] No candidates or parts in response`);
    }

    // ★ 이미지에 오버레이 텍스트 첨부
    if (extractedOverlayText && results.length > 0) {
      results[0].overlayText = extractedOverlayText;
    }

    console.log(`[Gemini I2I] Total images generated: ${results.length}, overlayText: ${extractedOverlayText ? 'YES' : 'NO'}`);
    return results;
  } catch (error) {
    console.error('[Gemini I2I] Image-to-image generation error:', error);
    throw error;
  }
}

/**
 * 상세페이지 섹션용 Image-to-Image 생성
 * - 사용자 제품 이미지를 기반으로 각 섹션에 맞는 스타일로 변환
 * - keyFeatures와 targetAudience를 반영하여 맞춤형 이미지 생성
 * - scenarioPrompt가 전달되면 오케스트레이션 프롬프트 활용 (없으면 기본 템플릿 사용)
 */
export async function generateSectionImageFromProduct(
  sourceImage: string,
  sectionType: string,  // 모든 섹션 타입 허용 (MAIN, HERO, BRAND_HEADER, HERO_LIP 등)
  productName: string,
  category: string,
  additionalPrompt?: string,
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL,  // gemini-2.5-flash-image
  keyFeatures?: string[],
  targetAudience?: string,
  scenarioPrompt?: string  // ★ 오케스트레이션에서 생성된 시나리오 프롬프트
): Promise<GeminiGeneratedImage> {
  // ★★★ 텍스트 배경 섹션은 제품 이미지 없이 T2I로 생성해야 함
  const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);
  if (isTextBackgroundSection) {
    console.log(`[Gemini I2I] ★ TEXT BACKGROUND SECTION: ${sectionType} - Using direct color prompt (bypassing buildSharedSectionPrompt)`);

    // ★★★ generateImageWithGemini 직접 호출 (buildSharedSectionPrompt 우회!)
    // generateSectionImageWithGemini를 거치면 제품 관련 내용이 포함되므로 직접 호출

    const categoryColorMap: Record<string, { primary: string; gradient: string; name: string }> = {
      lip: { primary: '#FFB6C1', gradient: 'soft pink to coral', name: 'pink' },
      skincare: { primary: '#98D8AA', gradient: 'white to soft mint', name: 'mint' },
      mascara: { primary: '#1a1a1a', gradient: 'black to hot pink', name: 'black' },
      maskpack: { primary: '#98D8AA', gradient: 'soft green to white', name: 'green' },
      suncare: { primary: '#FFD700', gradient: 'warm yellow to white', name: 'yellow' },
    };
    const lowerCategory = category.toLowerCase();
    const detectedCategory = Object.keys(categoryColorMap).find(key => lowerCategory.includes(key)) || 'skincare';
    const colorInfo = categoryColorMap[detectedCategory];

    // ★ solid 색상 프롬프트 (orchestration-service와 동일)
    const colorPrompt = `Pure solid ${colorInfo.name} (${colorInfo.primary}) color fill only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean solid color, 8K resolution`;
    const negativePrompt = 'product, cosmetic, bottle, tube, packaging, container, objects, shapes, decorations, patterns, textures, elements, water droplets, leaves, botanical, sparkles, glow effects, text, letters, words, typography';

    // ★★★ 오버레이 텍스트 요청 생성
    const textBgOverlayPrompt = buildOverlayTextPrompt(
      'FEATURES' as SectionType,
      productName,
      category,
      keyFeatures || [],
      targetAudience || 'General'
    );
    const isFlashModel = model === 'gemini-2.5-flash-image';
    const overlayTextRequest = buildOverlayTextRequest(textBgOverlayPrompt, isFlashModel, '16:9');

    // ★★★ 최종 프롬프트: 색상 + 오버레이 (제품 관련 내용 없음!)
    const textBgFinalPrompt = `${colorPrompt}, absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only --negative ${negativePrompt}${overlayTextRequest}`;

    // ★★★ generateImageWithGemini 직접 호출
    const textBgImages = await generateImageWithGemini({
      prompt: textBgFinalPrompt,
      model,
      aspectRatio: '16:9',
    });

    if (textBgImages.length === 0) {
      throw new Error(`No image generated for text background section ${sectionType}`);
    }

    // ★★★ promptComponents 설정 (텍스트 배경 전용)
    return {
      ...textBgImages[0],
      revisedPrompt: textBgFinalPrompt,
      promptComponents: {
        overlayTextPrompt: textBgOverlayPrompt,
        overlayGuidePrompt: buildCreativeOverlayGuide('16:9'),
        noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,
        fixedPrompt: `[TEXT BACKGROUND - ${sectionType}]\n${colorPrompt}\n\n--negative ${negativePrompt}`,
        dynamicPrompt: `[Direct color prompt - no product, no buildSharedSectionPrompt]`,
      },
    };
  }

  // ★★★ 모듈 레벨 mapToBaseSectionType 사용 (함수 초반에 정의)
  const mappedSectionType = mapToBaseSectionType(sectionType);
  console.log(`[Gemini I2I] Section type mapping: ${sectionType} → ${mappedSectionType}`);

  // ★★★ 공통 함수 사용 (T2I/I2I 동일) ★★★
  const ingredientObjects = extractIngredientObjects(productName, category);
  const moodSelection = selectRandomMoodObjects();
  const audienceStyle = buildAudienceStyle(targetAudience);
  const featureHighlight = buildFeatureHighlight(keyFeatures);

  // ★★★ 공통 섹션 프롬프트 템플릿 사용 ★★★
  const basePrompt = buildSharedSectionPrompt(mappedSectionType, {
    productName,
    category,
    ingredientObjects,
    moodSelection: moodSelection.selected,
    audienceStyle,
    featureHighlight,
    isI2I: true,  // I2I 모드 - "USE THE PROVIDED PRODUCT IMAGE" 추가
  });

  console.log(`[Gemini I2I] Using shared section template for ${sectionType} → ${mappedSectionType}`);

  // 2. 오케스트레이션 프롬프트 추가 (있으면)
  // 전체 상세페이지의 일관된 메시지와 컨텍스트를 담은 추가 지시
  // ★ MAIN 섹션은 이미 완성형 프롬프트라 오케스트레이션 컨텍스트 제외 (충돌 방지)
  let orchestrationContext = '';
  console.log(`[Gemini I2I] ★★★ scenarioPrompt received: ${scenarioPrompt ? 'YES (' + scenarioPrompt.length + ' chars)' : 'NO/EMPTY'}`);
  if (mappedSectionType !== 'MAIN' && scenarioPrompt && scenarioPrompt.trim()) {
    console.log(`[Gemini I2I] ★ Adding orchestration context for ${sectionType} (→${mappedSectionType})`);
    console.log(`[Gemini I2I] orchestration preview: ${scenarioPrompt.substring(0, 200)}...`);
    orchestrationContext = `

[ORCHESTRATION CONTEXT - 상세페이지 전체 메시지]
${scenarioPrompt}

[제품 배치 원칙]
- 위 오케스트레이션 컨텍스트의 시나리오에 맞게 제품을 자연스럽게 배치하세요
- 시나리오에 따라 제품이 부각되거나, 자연스럽게 녹아들 수 있습니다
- 항상 가운데에 놓지 말고, 시나리오에 어울리는 위치에 배치하세요`;
  } else {
    console.log(`[Gemini I2I] ★★★ orchestrationContext NOT added. Reason: sectionType=${sectionType} (→${mappedSectionType}), scenarioPrompt=${scenarioPrompt ? 'exists' : 'empty'}`);
  }

  // ★★★ 고정/동적 프롬프트 분리 (DEV 모드 표시용)
  const fixedPromptParts = [
    'OUTPUT: High-quality commercial photography, 8K resolution, no text on image.',
  ];

  const dynamicPromptParts = [
    basePrompt,
    orchestrationContext,
    `Product: ${productName}`,
    `Category: ${category}`,
    additionalPrompt ? `Additional style: ${additionalPrompt}` : '',
  ].filter(Boolean);

  // ★★★ 공통 오버레이 텍스트 요청 생성 ★★★
  const overlayTextPrompt = buildOverlayTextPrompt(
    mappedSectionType,
    productName,
    category,
    keyFeatures || [],
    targetAudience || 'General'
  );

  // ★★★ 섹션별 aspectRatio 결정 (공통 함수 사용) ★★★
  // - MAIN: 1:1, TEXT_BANNER/DIVIDER_VISUAL 등: 16:9, 나머지: 3:4
  const aspectRatio = getSectionAspectRatio(sectionType);

  const isFlashModel = model === 'gemini-2.5-flash-image';
  const overlayTextRequest = buildOverlayTextRequest(overlayTextPrompt, isFlashModel, aspectRatio);

  const fullPrompt = `${basePrompt}${orchestrationContext}

Product: ${productName}
Category: ${category}
${additionalPrompt ? `Additional style: ${additionalPrompt}` : ''}

OUTPUT: High-quality commercial photography, 8K resolution, no text on image.
${overlayTextRequest}`;

  console.log(`[Gemini I2I] Generating ${sectionType} (→${mappedSectionType}) section image, aspectRatio: ${aspectRatio || '3:4'}`);
  if (mappedSectionType === 'MAIN') {
    console.log(`[Gemini I2I] MAIN with custom objects - keyFeatures: ${keyFeatures?.join(', ')}, target: ${targetAudience}`);
  }

  // ★ preserveStrength 0.75: 제품 형태를 최대한 유지하면서 배경/스타일만 변경
  const images = await generateImageFromImage({
    sourceImage,
    prompt: fullPrompt,
    model,
    preserveStrength: 0.75, // ★ 0.4 → 0.75: 제품 일관성 강화
    ...(aspectRatio && { aspectRatio }),
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType} section`);
  }

  // 최종 사용된 프롬프트를 revisedPrompt로 반환 + 개별 프롬프트 구성요소 포함
  return {
    ...images[0],
    revisedPrompt: fullPrompt,
    // ★★★ 개발자 모드용: 개별 프롬프트 구성요소 (UI에서 분리 표시) ★★★
    promptComponents: {
      ...images[0].promptComponents,
      // [1] 섹션별 프롬프트
      sectionBasePrompt: basePrompt,                          // 섹션별 기본 프롬프트 (MAIN, HERO, FEATURES 등)
      orchestrationPrompt: scenarioPrompt || undefined,       // 오케스트레이션 AI 생성 시나리오
      i2iSystemPrompt: orchestrationContext || undefined,     // I2I 시스템 프롬프트 (제품 재배치 규칙)
      // [2] 오버레이 텍스트 관련 프롬프트
      overlayTextPrompt,                                      // 섹션별 오버레이 텍스트 프롬프트
      overlayGuidePrompt: buildCreativeOverlayGuide(aspectRatio),  // 오버레이 디자인 가이드 (공통)
      // [3] 공통 프롬프트 (Flash 모델 전용)
      noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,  // Flash 모델용 텍스트 금지 강화
      // [4] 레거시 (이전 호환성)
      fixedPrompt: fixedPromptParts.join('\n\n'),
      dynamicPrompt: dynamicPromptParts.join('\n\n'),
    },
  };
}

// ============================================
// ★★★ 이미지 + 오버레이 텍스트 통합 생성 함수 (NEW!)
// ============================================

/**
 * 이미지 생성 결과 + 오버레이 텍스트 통합 반환 타입
 */
export interface ImageWithOverlayResult {
  image: GeminiGeneratedImage;
  overlayText: OverlayTextContent;
  overlayPrompt?: string; // 개발자 모드용
}

/**
 * 섹션 이미지와 오버레이 텍스트를 함께 생성 (통합 함수)
 * - T2I 모드: sourceImage가 없으면 imagePrompt 기반 Text-to-Image 생성
 * - I2I 모드: sourceImage가 있으면 Image-to-Image 생성
 * - 처음 생성, 전체 재생성, 섹션 재생성 모두에서 동일하게 사용
 * - 이미지 생성 → 오버레이 텍스트 생성 (동일 컨텍스트)
 */
export async function generateSectionImageWithOverlay(
  sourceImage: string | null,  // null이면 T2I 모드
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  options?: {
    additionalPrompt?: string;
    model?: GeminiImageModel;
    scenarioPrompt?: string;
    blockIndex?: number;
    totalBlocks?: number;
    variationHint?: string;
    imagePrompt?: string;  // T2I 모드용 이미지 프롬프트
  }
): Promise<ImageWithOverlayResult> {
  const {
    additionalPrompt,
    model = DEFAULT_IMAGE_MODEL,
    scenarioPrompt,
    blockIndex = 0,
    totalBlocks = 1,
    variationHint,
    imagePrompt,
  } = options || {};

  // ★★★ 텍스트 배경 섹션 감지 (제품 이미지 없이 순수 배경만 생성)
  const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);

  // ★★★ 모듈 레벨 mapToBaseSectionType 사용 (중복 제거)
  // ★ 텍스트 배경 섹션은 'FEATURES'를 기본값으로 사용 (자유 비율)
  const normalizedSectionType = isTextBackgroundSection
    ? 'FEATURES' as const
    : mapToBaseSectionType(sectionType);

  // 모드 결정:
  // - 텍스트 배경 섹션: 항상 T2I 모드 (제품 이미지 제외)
  // - 일반 섹션: sourceImage 유무로 T2I/I2I 결정
  const isI2IMode = !isTextBackgroundSection && sourceImage && sourceImage.length > 0;
  const mode = isI2IMode ? 'I2I' : 'T2I';

  if (isTextBackgroundSection) {
    console.log(`[Image+Overlay] ★ TEXT BACKGROUND SECTION: ${sectionType} - Forcing T2I mode (no product image)`);
  }
  console.log(`[Image+Overlay] Generating ${sectionType} image with overlay text (${mode} mode)...`);

  // 1. 이미지 생성 (모드에 따라 다른 함수 호출)
  let generatedImage: GeminiGeneratedImage;
  let usedImagePrompt: string = '';  // ★ 이미지 생성에 사용된 프롬프트 저장

  if (isI2IMode && sourceImage) {
    // I2I 모드: 제품 이미지 기반 생성
    generatedImage = await generateSectionImageFromProduct(
      sourceImage,
      sectionType,
      productName,
      category,
      additionalPrompt,
      model,
      keyFeatures,
      targetAudience,
      scenarioPrompt
    );
    // ★ 이미지에 사용된 프롬프트 저장 (revisedPrompt 우선, 없으면 scenarioPrompt)
    usedImagePrompt = generatedImage.revisedPrompt || scenarioPrompt || '';
  } else {
    // T2I 모드: 프롬프트 기반 생성
    // ★★★ 텍스트 배경 섹션일 때는 제품 없는 순수 색상 프롬프트 사용
    if (isTextBackgroundSection) {
      // ★★★ 텍스트 배경 섹션: generateImageWithGemini 직접 호출 ★★★
      // generateSectionImageWithGemini를 거치면 buildSharedSectionPrompt가 실행되어 제품 관련 내용이 포함됨
      // 따라서 직접 generateImageWithGemini를 호출하여 순수 색상 프롬프트만 사용

      // 카테고리별 색상 매핑
      const categoryColorMap: Record<string, { primary: string; gradient: string; name: string }> = {
        lip: { primary: '#FFB6C1', gradient: 'soft pink to coral', name: 'pink' },
        skincare: { primary: '#98D8AA', gradient: 'white to soft mint', name: 'mint' },
        mascara: { primary: '#1a1a1a', gradient: 'black to hot pink', name: 'black' },
        maskpack: { primary: '#98D8AA', gradient: 'soft green to white', name: 'green' },
        suncare: { primary: '#FFD700', gradient: 'warm yellow to white', name: 'yellow' },
      };
      const lowerCategory = category.toLowerCase();
      const detectedCategory = Object.keys(categoryColorMap).find(key => lowerCategory.includes(key)) || 'skincare';
      const colorInfo = categoryColorMap[detectedCategory];

      // ★ blockIndex 기반으로 solid/gradient 선택 (orchestration-service와 동일)
      const blockVariant = blockIndex % 2 === 0 ? 'solid' : 'gradient';

      // ★ orchestration-service.ts와 동일한 프롬프트 포맷
      const colorPrompt = blockVariant === 'solid'
        ? `Pure solid ${colorInfo.name} (${colorInfo.primary}) color fill only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean solid color, 8K resolution`
        : `Simple horizontal gradient from ${colorInfo.gradient} only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean gradient, 8K resolution`;

      // ★ 동일한 negative prompt
      const negativePrompt = 'product, cosmetic, bottle, tube, packaging, container, objects, shapes, decorations, patterns, textures, elements, water droplets, leaves, botanical, sparkles, glow effects, text, letters, words, typography';

      // ★★★ 오버레이 텍스트 요청 생성 (텍스트 배경용)
      const textBgOverlayPrompt = buildOverlayTextPrompt(
        'FEATURES' as SectionType,  // 텍스트 배경은 FEATURES 레이아웃 사용
        productName,
        category,
        keyFeatures || [],
        targetAudience || 'General'
      );
      const isFlashModel = model === 'gemini-2.5-flash-image';
      const overlayTextRequest = buildOverlayTextRequest(textBgOverlayPrompt, isFlashModel, '16:9');

      // ★★★ 최종 프롬프트: 색상 프롬프트 + 오버레이 텍스트 요청 (제품 관련 내용 없음!)
      const textBgFinalPrompt = `${colorPrompt}, absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only --negative ${negativePrompt}${overlayTextRequest}`;

      console.log(`[Image+Overlay] ★ Text background section ${sectionType}: Using ${blockVariant} color prompt DIRECTLY (bypassing buildSharedSectionPrompt)`);

      // ★★★ generateImageWithGemini 직접 호출 (buildSharedSectionPrompt 우회!)
      const textBgImages = await generateImageWithGemini({
        prompt: textBgFinalPrompt,
        model,
        aspectRatio: '16:9',  // 텍스트 배경은 16:9
      });

      if (textBgImages.length === 0) {
        throw new Error(`No image generated for text background section ${sectionType}`);
      }

      // ★★★ promptComponents 설정 (텍스트 배경 전용 - sectionBasePrompt 없음!)
      generatedImage = {
        ...textBgImages[0],
        revisedPrompt: textBgFinalPrompt,
        promptComponents: {
          // 텍스트 배경 섹션은 sectionBasePrompt 없음 (제품 관련 내용 방지)
          // orchestrationPrompt도 없음 (색상 프롬프트만 사용)
          overlayTextPrompt: textBgOverlayPrompt,
          overlayGuidePrompt: buildCreativeOverlayGuide('16:9'),
          noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,
          // 텍스트 배경 전용 프롬프트 (DEV 모드 표시용)
          fixedPrompt: `[TEXT BACKGROUND - ${sectionType}]\n${colorPrompt}\n\n--negative ${negativePrompt}`,
          dynamicPrompt: `[Direct color prompt - no product, no buildSharedSectionPrompt]`,
        },
      };
      usedImagePrompt = textBgFinalPrompt;
    } else {
      // ★★★ 일반 섹션: generateSectionImageWithGemini 사용
      const t2iPrompt = imagePrompt || scenarioPrompt || `${productName} ${category} product image`;

      generatedImage = await generateSectionImageWithGemini(
        normalizedSectionType,
        t2iPrompt,
        productName,
        category,
        model,
        keyFeatures,
        targetAudience
      );
      // ★ 이미지에 사용된 프롬프트 저장
      usedImagePrompt = generatedImage.revisedPrompt || t2iPrompt;
    }
  }

  // 2. 오버레이 텍스트 처리
  // ★★★ 이미지 모델에서 받은 overlayText만 사용 (텍스트 모델 폴백 없음!)
  let finalOverlayText: OverlayTextContent = generatedImage.overlayText || createDefaultOverlayForSection(
    sectionType,
    productName,
    keyFeatures
  );
  const overlayPrompt: string = usedImagePrompt;

  if (generatedImage.overlayText) {
    console.log(`[Image+Overlay] ★ Using overlay text from IMAGE MODEL`);
  } else {
    console.log(`[Image+Overlay] ⚠️ Image model did not return overlay text, using default`);
  }

  console.log(`[Image+Overlay] ${sectionType} image and overlay text generated successfully`);

  return {
    image: generatedImage,
    overlayText: finalOverlayText,
    overlayPrompt: overlayPrompt,
  };
}

/**
 * 섹션용 오버레이 텍스트 생성
 * - 위치, 내용, 스타일(색상, 폰트크기, 굵기, 폰트, 정렬) 모두 포함
 * - 이미지 시나리오 컨텍스트를 기반으로 이미지와 어울리는 텍스트 생성
 * - ★ 텍스트 배경 섹션은 임팩트 있는 대형 타이포그래피 스타일 적용
 */
async function generateOverlayTextForSection(
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  blockOptions?: {
    blockIndex?: number;
    totalBlocks?: number;
    variationHint?: string;
  },
  _imageScenarioPrompt?: string  // ★ 향후 이미지 컨텍스트 활용 예정 (현재 공통 프롬프트 사용)
): Promise<{ overlayText: OverlayTextContent; prompt: string }> {
  const gemini = getGeminiClient();

  // ★★★ 텍스트 배경 섹션 감지 (임팩트 있는 타이포그래피 적용)
  const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);

  // ★★★ 모듈 레벨 mapToBaseSectionType 사용 (중복 제거)
  const normalizedSection = mapToBaseSectionType(sectionType);

  // ★★★ 텍스트 배경 섹션용 특별 레이아웃 (올리브영 스타일)
  const textBannerLayout = {
    // 상단 작은 서브텍스트 (브랜드명/섹션명)
    headline: { x: 50, y: 15, fontSize: 14, align: 'center' as const },
    // 중앙 대형 메인 헤드라인 (★ 핵심!)
    subheadline: { x: 50, y: 45, fontSize: 48, align: 'center' as const },
    // 하단 보조 메시지
    body: { x: 50, y: 70, fontSize: 18, align: 'center' as const },
    // 통계 (필요시)
    statistics: { x: 50, y: 85, fontSize: 32 },
  };

  // 섹션별 레이아웃 가이드
  const sectionLayouts: Record<string, {
    headline: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    subheadline: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    body: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    statistics: { x: number; y: number; fontSize: number };
  }> = {
    MAIN: {
      headline: { x: 8, y: 8, fontSize: 32, align: 'left' },
      subheadline: { x: 8, y: 18, fontSize: 18, align: 'left' },
      body: { x: 8, y: 28, fontSize: 14, align: 'left' },
      statistics: { x: 8, y: 85, fontSize: 24 },
    },
    HERO: {
      headline: { x: 50, y: 8, fontSize: 28, align: 'center' },
      subheadline: { x: 50, y: 18, fontSize: 16, align: 'center' },
      body: { x: 50, y: 85, fontSize: 14, align: 'center' },
      statistics: { x: 50, y: 50, fontSize: 48 },
    },
    FEATURES: {
      headline: { x: 50, y: 5, fontSize: 14, align: 'center' },
      subheadline: { x: 50, y: 12, fontSize: 24, align: 'center' },
      body: { x: 50, y: 88, fontSize: 12, align: 'center' },
      statistics: { x: 50, y: 55, fontSize: 36 },
    },
    SOCIAL_PROOF: {
      headline: { x: 50, y: 55, fontSize: 14, align: 'center' },
      subheadline: { x: 50, y: 62, fontSize: 20, align: 'center' },
      body: { x: 50, y: 88, fontSize: 12, align: 'center' },
      statistics: { x: 50, y: 78, fontSize: 48 },
    },
    HOW_TO_USE: {
      headline: { x: 50, y: 5, fontSize: 14, align: 'center' },
      subheadline: { x: 50, y: 12, fontSize: 20, align: 'center' },
      body: { x: 50, y: 85, fontSize: 12, align: 'center' },
      statistics: { x: 50, y: 50, fontSize: 32 },
    },
    FAQ: {
      headline: { x: 50, y: 10, fontSize: 18, align: 'center' },
      subheadline: { x: 50, y: 22, fontSize: 14, align: 'center' },
      body: { x: 50, y: 50, fontSize: 14, align: 'center' },
      statistics: { x: 50, y: 80, fontSize: 24 },
    },
  };

  // ★ 텍스트 배경 섹션이면 특별 레이아웃, 아니면 일반 레이아웃
  // (기존 형식 폴백용으로 유지)
  const layout = isTextBackgroundSection
    ? textBannerLayout
    : (sectionLayouts[normalizedSection] || sectionLayouts.FEATURES);

  // ★★★ 공통 프롬프트 빌더 사용 (overlay-prompts.ts)
  // 이렇게 하면 초기 생성과 재생성이 항상 동일한 프롬프트를 사용합니다
  const overlayBlockOptions: BlockOverlayOptions = {
    blockIndex: blockOptions?.blockIndex,
    totalBlocks: blockOptions?.totalBlocks,
    variationHint: blockOptions?.variationHint,
  };

  // ★ 공통 프롬프트 사용 (overlay-prompts.ts의 buildOverlayTextPrompt)
  const prompt = buildOverlayTextPrompt(
    normalizedSection as SectionType,
    productName,
    category,
    keyFeatures,
    targetAudience,
    overlayBlockOptions
  );

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr) as OverlayTextContent & { texts?: OverlayTextItem[] };

    // ★ 새 형식 (texts 배열) 또는 기존 형식 처리
    let normalizedOverlay: OverlayTextContent;

    if (parsed.texts && Array.isArray(parsed.texts) && parsed.texts.length > 0) {
      // ★ 새 형식: texts 배열 사용 (AI 자유 디자인)
      normalizedOverlay = {
        texts: parsed.texts.map(item => ({
          text: item.text || '',
          x: item.x ?? 50,
          y: item.y ?? 50,
          fontSize: item.fontSize ?? 24,
          fontWeight: item.fontWeight ?? 'medium',
          fontFamily: item.fontFamily ?? 'Pretendard, sans-serif',
          color: item.color ?? '#333333',
          textAlign: item.textAlign ?? 'center',
        })),
      };
      console.log(`[Overlay] Generated ${parsed.texts.length} texts (free form) for ${sectionType}`);
    } else {
      // 기존 형식: headline/subheadline/body 구조
      normalizedOverlay = {
        headline: normalizeOverlayItem(parsed.headline, layout.headline),
        subheadline: normalizeOverlayItem(parsed.subheadline, layout.subheadline),
        body: normalizeOverlayItem(parsed.body, layout.body),
        statistics: normalizeStatistics(parsed.statistics, layout.statistics),
        cta: normalizeOverlayItem(parsed.cta, { x: 50, y: 90, fontSize: 16, align: 'center' }),
      };
      console.log(`[Overlay] Generated overlay text (legacy format) for ${sectionType}`);
    }

    return {
      overlayText: normalizedOverlay,
      prompt,
    };
  } catch (error) {
    console.error(`[Overlay] Failed to generate overlay text for ${sectionType}:`, error);

    // 폴백: 기본 오버레이 텍스트 생성
    return {
      overlayText: createDefaultOverlay(normalizedSection, productName, keyFeatures, layout),
      prompt,
    };
  }
}

/**
 * 오버레이 아이템 정규화 (string → OverlayTextItem)
 * - fontFamily도 처리
 */
function normalizeOverlayItem(
  item: OverlayTextItem | string | null | undefined,
  defaultLayout: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' }
): OverlayTextItem | undefined {
  if (!item) return undefined;

  if (typeof item === 'string') {
    return {
      text: item,
      x: defaultLayout.x,
      y: defaultLayout.y,
      fontSize: defaultLayout.fontSize,
      fontWeight: 'medium',
      fontFamily: 'Pretendard, sans-serif',  // 기본 폰트
      color: '#333333',
      textAlign: defaultLayout.align,
    };
  }

  return {
    text: item.text,
    x: item.x ?? defaultLayout.x,
    y: item.y ?? defaultLayout.y,
    fontSize: item.fontSize ?? defaultLayout.fontSize,
    fontWeight: item.fontWeight ?? 'medium',
    fontFamily: item.fontFamily ?? 'Pretendard, sans-serif',  // ★ AI가 선택한 폰트 또는 기본값
    color: item.color ?? '#333333',
    textAlign: item.textAlign ?? defaultLayout.align,
  };
}

/**
 * 통계 배열 정규화
 * - fontFamily도 처리
 */
function normalizeStatistics(
  stats: (OverlayStatisticItem | string)[] | null | undefined,
  defaultLayout: { x: number; y: number; fontSize: number }
): OverlayStatisticItem[] | undefined {
  if (!stats || stats.length === 0) return undefined;

  return stats.map((stat, idx) => {
    if (typeof stat === 'string') {
      return {
        text: stat,
        x: defaultLayout.x,
        y: defaultLayout.y + (idx * 12),
        fontSize: defaultLayout.fontSize,
        fontWeight: 'bold' as const,
        fontFamily: 'Montserrat, sans-serif',  // 숫자에 어울리는 기본 폰트
        color: '#ffffff',
      };
    }
    return {
      text: stat.text,
      x: stat.x ?? defaultLayout.x,
      y: stat.y ?? defaultLayout.y + (idx * 12),
      fontSize: stat.fontSize ?? defaultLayout.fontSize,
      fontWeight: stat.fontWeight ?? 'bold',
      fontFamily: stat.fontFamily ?? 'Montserrat, sans-serif',  // ★ AI가 선택한 폰트 또는 기본값
      color: stat.color ?? '#ffffff',
    };
  });
}

/**
 * 섹션별 기본 오버레이 텍스트 생성 (이미지 모델이 리턴 안했을 때 폴백)
 * - 심플한 texts 배열 형식으로 반환
 */
function createDefaultOverlayForSection(
  sectionType: string,
  productName: string,
  keyFeatures: string[]
): OverlayTextContent {
  const normalizedSection = mapToBaseSectionType(sectionType);

  const sectionHeadlines: Record<string, string> = {
    MAIN: productName.slice(0, 20),
    HERO: productName,
    FEATURES: keyFeatures[0] || productName,
    SOCIAL_PROOF: productName,
    HOW_TO_USE: productName,
    FAQ: productName,
  };

  // texts 배열 형식으로 반환 (새 형식)
  const texts: OverlayTextItem[] = [
    {
      text: sectionHeadlines[normalizedSection] || productName,
      x: 50,
      y: 15,
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: '#333333',
      textAlign: 'center' as const,
    },
  ];

  // 키 피처가 있으면 추가
  if (keyFeatures[0]) {
    texts.push({
      text: keyFeatures[0].slice(0, 40),
      x: 50,
      y: 28,
      fontSize: 16,
      fontWeight: 'normal' as const,
      color: '#666666',
      textAlign: 'center' as const,
    });
  }

  return { texts };
}

/**
 * 기본 오버레이 텍스트 생성 (폴백용 - 레거시)
 */
function createDefaultOverlay(
  sectionType: string,
  productName: string,
  keyFeatures: string[],
  layout: {
    headline: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    subheadline: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    body: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' };
    statistics: { x: number; y: number; fontSize: number };
  }
): OverlayTextContent {
  const sectionHeadlines: Record<string, string> = {
    MAIN: productName.slice(0, 15),
    HERO: productName,
    FEATURES: keyFeatures[0] || productName,
    SOCIAL_PROOF: productName,
    HOW_TO_USE: productName,
    FAQ: productName,
  };

  return {
    headline: {
      text: sectionHeadlines[sectionType] || 'SECTION',
      x: layout.headline.x,
      y: layout.headline.y,
      fontSize: layout.headline.fontSize,
      fontWeight: 'bold',
      color: '#333333',
      textAlign: layout.headline.align,
    },
    subheadline: {
      text: keyFeatures[0]?.slice(0, 30) || productName,
      x: layout.subheadline.x,
      y: layout.subheadline.y,
      fontSize: layout.subheadline.fontSize,
      fontWeight: 'medium',
      color: '#666666',
      textAlign: layout.subheadline.align,
    },
  };
}
