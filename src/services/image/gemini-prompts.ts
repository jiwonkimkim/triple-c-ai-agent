/**
 * ★ Gemini 이미지 생성 프롬프트 빌더 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 섹션별 프롬프트 템플릿, 오버레이 가이드, 미션 프롬프트 등
 */

import type { SectionType } from '@/services/ai/prompts/types';
import type { SectionPromptParams } from './gemini-types';
import { getResolutionForAspectRatio, isProImageModel } from './gemini-resolution';

// ============================================
// ★ 미션 프롬프트 (이미지 생성 최상단 삽입)
// ============================================

/** ★★★ 미션 프롬프트: 모든 이미지 생성 프롬프트 맨 앞에 추가 ★★★ */
export const MISSION_PROMPT = `We are designing a product detail page. Our mission has 2 steps:
1. Design the detail page IMAGE (DO NOT render any text/letters on the image)
2. Design the copywriting overlay text for the detail page and return it as JSON.
(상세페이지를 디자인합니다. 미션 2단계: 1. 이미지 디자인 (글씨는 그리지 않음) 2. 오버레이 카피라이트를 디자인하여 JSON 반환)

`;

// ============================================
// ★ Flash 모델 텍스트 금지 강화 프롬프트
// ============================================

/** Flash 모델용 이미지 내 텍스트 생성 금지 강화 프롬프트 */
export const NO_TEXT_IN_IMAGE_REINFORCEMENT = `
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

// ============================================
// ★ 섹션 타입 매핑
// ============================================

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
export function mapToBaseSectionType(type: string): SectionType {
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

// ============================================
// ★ 공통 섹션 프롬프트 빌더
// ============================================

/**
 * ★★★ 공통 섹션 프롬프트 템플릿 (T2I/I2I 공유) ★★★
 * 이미지 입력 여부와 무관한 섹션별 시각 지침
 */
export function buildSharedSectionPrompt(sectionType: SectionType, params: SectionPromptParams): string {
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
- Photorealistic, no text in image
  (포토리얼리스틱, 이미지 내 텍스트 없음)`,

    HERO: `Create KOREAN E-COMMERCE main banner image for ${productName}.
(한국 이커머스 메인 배너 이미지 생성)
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
No text in image
(이미지 내 텍스트 없음)`,

    FEATURES: `Create KOREAN E-COMMERCE product benefits and ingredients section image for ${productName}.
(한국 이커머스 제품 특징 및 성분 섹션 이미지 생성)
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
No text in image
(이미지 내 텍스트 없음)`,

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
No text in image
(이미지 내 텍스트 없음)`,

    HOW_TO_USE: `Create KOREAN E-COMMERCE usage guide section image for ${productName}.
(한국 이커머스 사용법 가이드 섹션 이미지 생성)
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
No text in image
(이미지 내 텍스트 없음)`,

    FAQ: `Create KOREAN E-COMMERCE questions and answers background image for ${productName}.
(한국 이커머스 질문 답변 배경 이미지 생성)
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
No text in image
(이미지 내 텍스트 없음)`,

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
No text in image
(이미지 내 텍스트 없음)`,
  };

  // CUSTOM은 항상 정의되어 있으므로 non-null assertion 사용
  return prompts[sectionType] || prompts.CUSTOM!;
}

// ============================================
// ★ 오버레이 디자인 가이드
// ============================================

/**
 * 자유로운 크리에이티브 오버레이 디자인 가이드 (% 좌표계)
 * @param aspectRatio - 이미지 비율 (1:1, 3:4, 16:9 등)
 * @param model - 사용 모델 (Flash/Pro에 따라 해상도 다름)
 */
export function buildCreativeOverlayGuide(aspectRatio?: string, model?: string): string {
  const resolution = getResolutionForAspectRatio(aspectRatio, model);
  const { width, height } = resolution;
  const isWide = width > height;  // 16:9 등 가로형
  const isTall = height > width;  // 3:4, 9:16 등 세로형
  const modelName = isProImageModel(model) ? 'Pro (1K)' : 'Flash';

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

★★★ CANVAS SIZE & COORDINATE SYSTEM ★★★
(캔버스 크기 & 좌표 시스템)

📐 MODEL: ${modelName} | OUTPUT IMAGE SIZE: ${width} x ${height} pixels
(모델: ${modelName} | 출력 이미지 크기: ${width} x ${height} 픽셀)
Image aspect ratio: ${aspectRatio || '3:4'}
(이미지 비율)
${isWide ? `⚠️ WIDE FORMAT: Horizontal banner - spread text across width
  (가로형: 텍스트를 너비에 걸쳐 배치)` : ''}
${isTall ? `⚠️ TALL FORMAT: Vertical layout - stack text vertically
  (세로형: 텍스트를 세로로 쌓기)` : ''}

📍 POSITION (x, y): PERCENTAGE 0.0-100.0 with DECIMALS
(위치: 퍼센트 0.0-100.0, 소수점 허용)
- x: 0.0-100.0 (0=left, 50=center, 100=right)
  Examples: 12.5, 33.3, 66.7, 87.5
- y: 0.0-100.0 (0=top, 50=middle, 100=bottom)
  Examples: 8.5, 25.0, 45.5, 92.3

🔤 FONT SIZE: Pixels for ${width} x ${height} canvas
(폰트 크기: ${width} x ${height} 캔버스 기준 픽셀값)
- Design text sizes freely based on the canvas resolution above
  (위 캔버스 해상도를 기준으로 자유롭게 텍스트 크기 디자인)
- fontSize value = actual pixel size on the generated image
  (fontSize 값 = 생성된 이미지의 실제 픽셀 크기)

- Place texts where they look BEST with the image
  (이미지에 가장 잘 어울리는 위치에 배치)

★★★ COLOR & STYLE INSPIRATION ★★★
- Match colors to the image mood!
  (이미지 무드에 맞는 컬러 매칭!)

CRITICAL RULES:
(중요 규칙)
- fontSize: INTEGER 12-72
  (정수 12-72)
- x, y: DECIMAL 0.0-100.0 PERCENTAGE (e.g., 33.5, 66.7), NOT pixels!
  (소수점 포함 0.0-100.0 퍼센트, 픽셀 아님!)
- Use precise decimal values for accurate positioning
  (정확한 위치를 위해 소수점 값 사용)
- Make it look like professional Korean detail page design!
  (전문적인 한국 상세페이지 디자인처럼!)
`;
}

// ============================================
// ★ 스타일/특징 빌더
// ============================================

/** 타겟 고객 기반 스타일 문자열 생성 */
export function buildAudienceStyle(targetAudience?: string): string {
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

/** 핵심 특징 강조 문자열 생성 */
export function buildFeatureHighlight(keyFeatures?: string[]): string {
  return keyFeatures && keyFeatures.length > 0
    ? `Emphasize: ${keyFeatures[0]}`
    : 'Highlight product quality';
}

// ============================================
// ★ 오버레이 텍스트 요청 프롬프트 생성
// ============================================

/**
 * 오버레이 텍스트 요청 프롬프트 생성 (공통)
 * @param overlayTextPrompt - 오버레이 텍스트 프롬프트
 * @param isFlashModel - Flash 모델 여부 (텍스트 금지 강화)
 * @param aspectRatio - 이미지 비율 (좌표계 결정용)
 * @param model - 사용 모델 (해상도 결정용)
 */
export function buildOverlayTextRequest(
  overlayTextPrompt: string,
  isFlashModel: boolean,
  aspectRatio?: string,
  model?: string
): string {
  const noTextReinforcement = isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : '';
  const creativeGuide = buildCreativeOverlayGuide(aspectRatio, model);

  return `

[★★★ OUTPUT REQUIREMENTS ★★★]
(출력 요구사항)

1. GENERATE IMAGE FIRST (REQUIRED) - This is the primary output
   (이미지 먼저 생성 (필수) - 이것이 주요 출력)
2. THEN return overlay text JSON for placing text ON TOP of the generated image
   (그 다음 생성된 이미지 위에 배치할 오버레이 텍스트 JSON 반환)
3. DO NOT put Korean text directly in the image - return it as overlay text instead
   (이미지에 한글 텍스트를 직접 넣지 말고, 오버레이 텍스트로 반환하세요)

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
