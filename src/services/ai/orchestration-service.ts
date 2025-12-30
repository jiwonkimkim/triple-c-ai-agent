/**
 * 상세페이지 생성 오케스트레이션 서비스
 *
 * 메인 감독 역할:
 * 1. 전체 생성 흐름 관리
 * 2. 각 섹션별 개별 이미지 프롬프트 생성
 * 3. 패턴 분석 + 사용자 입력 + OCR 참조 데이터 통합
 *
 * 핵심 원칙:
 * - 이미지에는 텍스트 없이 제품만 생성
 * - 텍스트는 별도로 생성하여 이미지 위에 오버레이
 */

import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  getReferencePrompts,
  getVisualStyleKeywords,
  mapSectionTypeToPosition,
  SECTION_COMPOSITION_GUIDE,
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  buildOverlayTextPrompt,
  // 비주얼 테마 시스템
  autoSelectTheme,
  getVisualTheme,
  // 섹션 템플릿 시스템
  getSectionTemplate,
  mapToExtendedSectionType,
  buildSectionTemplatePrompt,
  // 네거티브 프롬프트
  buildNegativePrompt,
  // 이미지 개수 관련
  COPY_LENGTH_CONFIG,
  getSectionImagePrompt,
  type SectionPosition,
  type OverlayTextContent,
  type ProductVisualReference,
  type VisualTheme,
  type ExtendedSectionType,
} from './prompts';

// ============================================
// 타입 정의
// ============================================

export interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

export interface GenerationInput {
  productImages: string[];
  productName: string;
  category: string;
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
}

export interface SectionImagePrompt {
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  position: SectionPosition;
  imagePrompt: string;
  overlayText?: OverlayTextContent;
  compositionGuide: typeof SECTION_COMPOSITION_GUIDE[SectionPosition];
  imageIndex?: number;        // 다중 이미지일 때 인덱스 (0부터 시작)
  totalImagesInSection?: number; // 해당 섹션의 총 이미지 수
  variationHint?: string;     // 이미지 변형 힌트 (예: "shade #21", "step 1")
}

export interface OrchestrationResult {
  hookMessage: string;
  sections: {
    id: string;
    type: string;
    title?: string;
    body: string;
    order: number;
    imagePrompt: SectionImagePrompt;      // 기존 호환성 유지 (첫 번째 이미지)
    imagePrompts?: SectionImagePrompt[];  // 다중 이미지 프롬프트 배열
  }[];
}

// ============================================
// 이미지 개수 계산 유틸리티
// ============================================

/**
 * copyLength와 suggestedImageCount를 기반으로 실제 생성할 이미지 수 계산
 */
function calculateImageCount(
  copyLength: 'short' | 'medium' | 'long',
  suggestedImageCount: number,
  sectionType: string
): number {
  const config = COPY_LENGTH_CONFIG[copyLength];

  // MAIN과 HERO는 항상 1개
  if (sectionType === 'MAIN' || sectionType === 'HERO') {
    return 1;
  }

  // suggestedImageCount에 multiplier 적용
  const calculated = Math.round(suggestedImageCount * config.sectionImageMultiplier);

  // 최소 1개, 섹션당 최대 6개로 제한
  return Math.max(config.minImagesPerSection, Math.min(calculated, 6));
}

/**
 * 전체 이미지 수가 maxTotalImages를 초과하지 않도록 조정
 */
function adjustImageCountsToLimit(
  sectionImageCounts: { sectionType: string; count: number }[],
  copyLength: 'short' | 'medium' | 'long'
): Map<string, number> {
  const config = COPY_LENGTH_CONFIG[copyLength];
  const maxTotal = config.maxTotalImages;

  // 현재 총 이미지 수 계산
  let totalCount = sectionImageCounts.reduce((sum, s) => sum + s.count, 0);

  // 초과하지 않으면 그대로 반환
  if (totalCount <= maxTotal) {
    const result = new Map<string, number>();
    sectionImageCounts.forEach(s => result.set(s.sectionType, s.count));
    return result;
  }

  // 초과하면 비례 축소 (HERO는 제외하고)
  const heroCount = sectionImageCounts.find(s => s.sectionType === 'HERO')?.count || 1;
  const otherSections = sectionImageCounts.filter(s => s.sectionType !== 'HERO');
  const remainingBudget = maxTotal - heroCount;
  const otherTotal = otherSections.reduce((sum, s) => sum + s.count, 0);

  const result = new Map<string, number>();
  result.set('HERO', heroCount);

  if (otherTotal > 0) {
    const ratio = remainingBudget / otherTotal;
    otherSections.forEach(s => {
      const adjusted = Math.max(1, Math.round(s.count * ratio));
      result.set(s.sectionType, adjusted);
    });
  }

  return result;
}

/**
 * 다중 이미지 생성 시 변형 힌트 생성
 * - 카테고리와 섹션 타입에 따라 적절한 힌트 제공
 */
function generateVariationHint(
  sectionType: string,
  index: number,
  totalCount: number,
  category: string,
  _overlayTextGuide?: string // 향후 사용 예정
): string {
  // 카테고리별 특화 힌트
  const categoryLower = category.toLowerCase();

  // 쿠션/파운데이션 - 호수별 발색
  if (sectionType === 'FEATURES' && (categoryLower.includes('쿠션') || categoryLower.includes('파운데이션'))) {
    const shades = ['#13 아이보리', '#17 라이트베이지', '#21 내추럴베이지', '#23 미디엄베이지', '#25 웜베이지'];
    return shades[index] || `shade variation ${index + 1}`;
  }

  // 립 제품 - 컬러 바리에이션
  if (sectionType === 'FEATURES' && (categoryLower.includes('립') || categoryLower.includes('틴트'))) {
    const colors = ['코랄', '로즈', '레드', '누드', '피치', '버건디'];
    return colors[index] || `color ${index + 1}`;
  }

  // HOW_TO_USE - 사용 순서
  if (sectionType === 'HOW_TO_USE') {
    return `step ${index + 1} of ${totalCount}`;
  }

  // SOCIAL_PROOF - 후기 유형
  if (sectionType === 'SOCIAL_PROOF') {
    const proofTypes = ['before-after', 'real review', 'texture close-up', 'daily use'];
    return proofTypes[index] || `proof ${index + 1}`;
  }

  // 기본 변형
  return `variation ${index + 1} of ${totalCount}`;
}

// ============================================
// AI 클라이언트 초기화
// ============================================

const isPlaceholder = (key: string | undefined) =>
  !key || key.includes('your-') || key.includes('placeholder') || key.length < 20;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (isPlaceholder(apiKey)) return null;
  return new GoogleGenAI({ apiKey: apiKey! });
}

// ============================================
// 섹션별 이미지 프롬프트 생성기
// ============================================

export async function generateSectionImagePrompt(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  visualReference?: ProductVisualReference,
  visualTheme?: VisualTheme
): Promise<SectionImagePrompt> {
  const position = mapSectionTypeToPosition(sectionType);
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  // 텍스트 없는 이미지 프롬프트 생성
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 제품 일관성 지시문 (모든 섹션에서 동일한 제품 표시)
  const productConsistencyInstruction = buildProductConsistencyText(productName, category, visualReference);

  // 섹션 템플릿 기반 프롬프트
  const extendedSectionType = mapToExtendedSectionType(sectionType);
  const sectionTemplate = getSectionTemplate(extendedSectionType);
  const templatePrompt = buildSectionTemplatePrompt(
    sectionTemplate,
    productName,
    visualTheme?.backgroundColors.gradient || 'clean gradient',
    keyFeatures[0]
  );

  // 네거티브 프롬프트
  const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);

  // 참조 프롬프트에서 영감을 받아 새 프롬프트 생성
  const gemini = getGeminiClient();

  let imagePrompt: string;

  if (gemini) {
    // AI를 사용하여 맞춤형 프롬프트 생성
    const promptGenerationRequest = `
당신은 AI 이미지 생성(Gemini Imagen, DALL-E) 전문 프롬프트 엔지니어입니다.
상업용 제품 상세페이지에 사용될 고품질 이미지 생성 프롬프트를 작성해주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟 고객: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}
${visualReference?.appearance ? `- 제품 외형 상세: ${visualReference.appearance}` : ''}
${visualReference?.colorScheme ? `- 색상 구성: ${visualReference.colorScheme}` : ''}
${visualReference?.packageShape ? `- 패키지/용기 형태: ${visualReference.packageShape}` : ''}

## ⚠️ 중요: 제품 일관성 (CRITICAL)
${productConsistencyInstruction}

## 🎨 비주얼 테마 (모든 섹션에 동일하게 적용)
${visualTheme ? `
- 테마명: ${visualTheme.name}
- 배경색: ${visualTheme.backgroundColors.primary} (주), ${visualTheme.backgroundColors.secondary} (보조)
- 그라데이션: ${visualTheme.backgroundColors.gradient || '없음'}
- 조명: ${visualTheme.lighting.style}
- 분위기: ${visualTheme.moodKeywords.slice(0, 5).join(', ')}
- 일관성 지시: ${visualTheme.consistencyPrompt}
` : '기본 클린 미니멀 스타일'}

## 섹션 정보 (${sectionType})
- 위치/역할: ${position}
- 레이아웃 가이드: ${compositionGuide.layout}
- 제품 배치: ${compositionGuide.productPlacement}
- 텍스트 배치 (텍스트는 별도 오버레이): ${compositionGuide.textPlacement}
- 라이팅: ${compositionGuide.lighting}
- 분위기: ${compositionGuide.mood}

## 섹션 템플릿 참조
${templatePrompt}

## 참조 프롬프트 예시 (올리브영 베스트셀러 기반)
${referencePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 비주얼 스타일 키워드
${visualKeywords.join(', ')}

## Gemini Imagen 최적화 프롬프트 작성 가이드라인
1. **구체적인 시각적 묘사**: 제품의 외형, 질감, 재질, 광택을 상세히 기술
2. **조명과 그림자**: 스튜디오 조명, 자연광, 림 라이팅, 소프트박스 등 구체적 조명 설정
3. **구도와 앵글**: 카메라 앵글(eye-level, bird's eye, low angle), 구도(rule of thirds, centered) 명시
4. **배경과 환경**: 그라데이션 배경, 스튜디오 세팅, 미니멀 배경 등 상세 설명 (비주얼 테마와 일치시킬 것)
5. **분위기와 스타일**: luxury, premium, minimalist, clean, elegant 등 스타일 키워드
6. **기술적 품질**: 8K, photorealistic, professional photography, commercial quality 등 품질 키워드
7. **색상 팔레트**: 제품과 조화로운 배경 색상, 비주얼 테마의 색상 가이드 활용

## 네거티브 프롬프트 (제외할 요소)
${negativePrompt}

## 필수 규칙
1. 이미지에 텍스트, 글자, 로고, 워터마크가 절대 포함되면 안 됩니다 (텍스트는 별도 오버레이)
2. 텍스트가 들어갈 영역은 깨끗하게 비워두세요 (상단 30%, 하단 20% 등)
3. 영어로 작성해주세요 (Gemini Imagen 최적화)
4. 150-300 단어 사이의 상세한 프롬프트를 작성해주세요
5. **모든 섹션에서 동일한 제품이 일관되게 표시되어야 합니다**
6. **모든 섹션에서 동일한 배경색과 조명 스타일(비주얼 테마)을 유지해야 합니다**

## 출력 형식
- 프롬프트만 반환 (설명이나 마크다운 없이)
- 프롬프트 구조: [제품 일관성 지시] [테마/배경 지시] [섹션 콘텐츠] [품질/스타일 키워드] --negative [제외 요소]
- 콤마로 구분된 키워드/구문 형식
`;

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: promptGenerationRequest,
      });

      imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      // 제품 일관성 지시가 없으면 추가
      if (!imagePrompt.toLowerCase().includes('same product') && !imagePrompt.toLowerCase().includes('consistent product')) {
        imagePrompt = `[PRODUCT CONSISTENCY: Same exact "${productName}" product throughout all images] ${imagePrompt}`;
      }

      // 텍스트 제외 지시가 없으면 추가
      if (!imagePrompt.toLowerCase().includes('no text')) {
        imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
      }
    } catch (error) {
      console.error('[Orchestration] Failed to generate prompt with AI, using fallback:', error);
      imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords, visualReference, visualTheme);
    }
  } else {
    // AI 없이 규칙 기반 프롬프트 생성
    imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords, visualReference, visualTheme);
  }

  return {
    sectionType,
    position,
    imagePrompt,
    compositionGuide,
  };
}

// 제품 일관성 지시문 생성 헬퍼
function buildProductConsistencyText(
  productName: string,
  _category: string,
  visualReference?: ProductVisualReference
): string {
  let instruction = `모든 섹션 이미지에서 "${productName}" 제품이 동일하게 표시되어야 합니다.
제품의 디자인, 색상, 형태, 패키지가 섹션마다 달라지면 안 됩니다.
마치 같은 제품을 다른 각도와 상황에서 촬영한 것처럼 일관성을 유지해야 합니다.`;

  if (visualReference) {
    if (visualReference.appearance) {
      instruction += `\n- 제품 외형: ${visualReference.appearance}`;
    }
    if (visualReference.colorScheme) {
      instruction += `\n- 색상: ${visualReference.colorScheme}`;
    }
    if (visualReference.packageShape) {
      instruction += `\n- 패키지 형태: ${visualReference.packageShape}`;
    }
  }

  return instruction;
}

// 폴백 이미지 프롬프트 생성 (AI 없을 때) - Gemini Imagen 최적화
function buildFallbackImagePrompt(
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle: string | undefined,
  _position: SectionPosition,
  visualKeywords: string[],
  visualReference?: ProductVisualReference,
  visualTheme?: VisualTheme
): string {
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, no logos, text-free commercial photography only';
  const qualityKeywords = '8K resolution, photorealistic, professional commercial photography, high-end advertising quality, sharp focus, premium product visualization';
  const styleKeywords = visualKeywords.slice(0, 4).join(', ');
  const brandAddition = brandStyle ? `, brand aesthetic: ${brandStyle}` : '';

  // 제품 일관성 지시문
  const consistencyPrefix = `[CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" must appear identically in all images with consistent design, shape, color, texture and packaging throughout the entire product detail page]`;

  // 비주얼 테마 지시문
  const themePrefix = visualTheme
    ? `[VISUAL THEME: ${visualTheme.consistencyPrompt}] [BACKGROUND: ${visualTheme.backgroundColors.gradient || visualTheme.backgroundColors.primary}] [LIGHTING: ${visualTheme.lighting.style}]`
    : '[VISUAL THEME: clean minimal style with soft neutral background]';

  // 제품 외형 참조 (있으면 사용)
  const productDesc = visualReference?.appearance
    ? `${productName} (${visualReference.appearance})`
    : productName;

  const colorNote = visualReference?.colorScheme
    ? `, product color scheme: ${visualReference.colorScheme}`
    : '';

  const packageNote = visualReference?.packageShape
    ? `, package design: ${visualReference.packageShape}`
    : '';

  // 테마 무드 키워드
  const themeMood = visualTheme ? visualTheme.moodKeywords.slice(0, 3).join(', ') : 'modern, clean, professional';

  const basePrompts: Record<string, string> = {
    // MAIN: 올리브영 메인 썸네일 스타일 - 상세페이지 진입 전 제품 슬로건 이미지
    MAIN: `${consistencyPrefix} ${themePrefix} OLIVEYOUNG main thumbnail style product photography of ${productDesc}, ${category} product package floating centered with subtle shadow, colorful gradient background (blue to pink OR green to yellow tones), award badge effect (OLIVEYOUNG PICK, BEST SELLER medal), gift set and bonus items displayed together, sparkle confetti celebration atmosphere, festive promotional mood, product slogan text space at top, brand logo space at bottom, high contrast vibrant commercial photography, Korean beauty e-commerce style, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    HERO: `${consistencyPrefix} ${themePrefix} Ultra-premium product photography of ${productDesc}, elegant ${category} product hero shot, perfectly centered composition with rule of thirds, space for text overlay at top and bottom, sophisticated gradient background (${visualTheme?.backgroundColors.gradient || 'soft white to subtle warm tones'}), professional studio softbox lighting with gentle rim light creating elegant product silhouette, subtle surface reflection on glossy base, luxury beauty advertisement aesthetic, premium cosmetic brand campaign quality, ${themeMood}, high-end minimalist design${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    FEATURES: `${consistencyPrefix} ${themePrefix} The IDENTICAL ${productDesc} from HERO section showcased with key ingredient visualization for ${category}, featuring ${keyFeatures[0] || 'natural premium ingredients'}, same exact product displayed at slight angle alongside fresh botanical elements with crystal-clear water droplets, detailed macro photography with shallow depth of field, space for feature icons and text, clean minimalist background with soft gradient, natural window-style soft lighting with catchlights, scientific yet elegant aesthetic conveying innovation and quality, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    SOCIAL_PROOF: `${consistencyPrefix} ${themePrefix} The SAME ${productDesc} from previous sections presented with before-after skin texture comparison for ${category}, professional split-screen composition showing clear improvement, identical product prominently visible in frame, space for statistics and percentage badges, even diffused studio lighting for accurate skin tone representation, clinical dermatology results visualization, medical-grade professional photography style, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    HOW_TO_USE: `${consistencyPrefix} ${themePrefix} Step-by-step beauty application tutorial featuring the EXACT SAME ${productDesc} from previous sections, elegant model hand gently applying the IDENTICAL ${category} product with proper technique demonstration, clear instructional composition with clean negative space, space for numbered steps and guide text, bright even lighting with soft shadows, professional how-to tutorial photography style, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    FAQ: `${consistencyPrefix} ${themePrefix} The SAME ${productDesc} as hero item elegantly displayed in ${category} product collection showcase, complete brand lineup arranged in harmonious composition with IDENTICAL main product as focal point, space for Q&A text and product information table, products arranged with precise symmetry on premium surface, sophisticated gradient background, professional studio lighting with accent highlights, luxury brand portfolio presentation, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,
  };

  return basePrompts[sectionType] || basePrompts['FEATURES'];
}

// ============================================
// 오버레이 텍스트 생성기
// ============================================

export async function generateOverlayText(
  sectionType: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string
): Promise<OverlayTextContent | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  const prompt = buildOverlayTextPrompt(sectionType, productName, category, keyFeatures, targetAudience);

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr) as OverlayTextContent;
  } catch (error) {
    console.error('[Orchestration] Failed to generate overlay text:', error);
    return undefined;
  }
}

// ============================================
// 제품 외형 설명 생성기 (일관성을 위해)
// ============================================

async function generateProductVisualReference(
  productName: string,
  category: string,
  keyFeatures: string[],
  brandContext?: BrandContext | null
): Promise<ProductVisualReference> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // 기본값 반환
    return {
      appearance: `${category} product in elegant packaging`,
      colorScheme: 'premium neutral tones',
      packageShape: 'sleek modern design',
      brandVisual: brandContext?.imageKeywords?.join(', ') || 'minimalist luxury',
    };
  }

  const prompt = `
당신은 제품 시각화 전문가입니다.
다음 제품의 외형을 구체적으로 설명해주세요. 이 설명은 AI 이미지 생성에서 제품 일관성을 유지하는 데 사용됩니다.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
${brandContext ? `- 브랜드: ${brandContext.name}` : ''}
${brandContext?.imageKeywords ? `- 브랜드 스타일: ${brandContext.imageKeywords.join(', ')}` : ''}

## 요청
아래 JSON 형식으로 제품 외형을 설명해주세요:

{
  "appearance": "제품의 전체적인 외형 설명 (영어, 예: circular black compact case with embossed gold logo, sleek matte finish)",
  "colorScheme": "주요 색상 구성 (영어, 예: black case with rose gold accents)",
  "packageShape": "패키지/용기 형태 (영어, 예: round compact cushion case with mirror inside)",
  "brandVisual": "브랜드 시각 스타일 (영어, 예: minimalist luxury, modern elegance)"
}

카테고리 "${category}"에 맞는 일반적인 제품 형태를 상상하여 구체적으로 설명해주세요.
JSON만 반환하세요.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr) as ProductVisualReference;
    console.log('[Orchestration] Generated product visual reference:', result);
    return result;
  } catch (error) {
    console.error('[Orchestration] Failed to generate visual reference:', error);
    return {
      appearance: `${category} product in elegant packaging`,
      colorScheme: 'premium neutral tones',
      packageShape: 'sleek modern design',
      brandVisual: brandContext?.imageKeywords?.join(', ') || 'minimalist luxury',
    };
  }
}

// ============================================
// 메인 오케스트레이션 함수
// ============================================

export async function orchestrateDetailPageGeneration(
  input: GenerationInput
): Promise<OrchestrationResult[]> {
  console.log('[Orchestration] Starting detail page generation...');
  console.log(`[Orchestration] Product: ${input.productName}, Category: ${input.category}`);

  const gemini = getGeminiClient();

  // 0-1. 비주얼 테마 자동 선택 (전체 상세페이지에 일관된 스타일 적용)
  const brandTone = input.brandContext?.toneAndManner;
  const selectedThemeStyle = autoSelectTheme(input.category, brandTone);
  const visualTheme = getVisualTheme(selectedThemeStyle);
  console.log(`[Orchestration] Selected visual theme: ${visualTheme.name} (${selectedThemeStyle})`);
  console.log(`[Orchestration] Theme colors: ${visualTheme.backgroundColors.primary}, ${visualTheme.backgroundColors.secondary}`);

  // 0-2. 제품 외형 참조 생성 (모든 섹션에서 동일한 제품 표시를 위해)
  console.log('[Orchestration] Generating product visual reference for consistency...');
  const visualReference = await generateProductVisualReference(
    input.productName,
    input.category,
    input.keyFeatures,
    input.brandContext
  );

  // 1. 텍스트 콘텐츠 생성 (훅 메시지 + 섹션 카피)
  const systemPrompt = buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category);
  const userPrompt = buildEnhancedUserPrompt(input);

  const generateTextContent = async (versionIndex: number) => {
    const variationPrompt = versionIndex === 1
      ? '\n\nIMPORTANT: Create a distinctly different version with alternative messaging approach, different tone, or unique angle.'
      : '';

    if (!gemini) {
      // Mock 데이터 반환
      return {
        hookMessage: `${input.productName} - ${input.targetAudience}를 위한 완벽한 선택`,
        sections: [
          { type: 'HERO', title: `${input.productName} 소개`, body: `${input.targetAudience}를 위해 설계된 ${input.productName}입니다.` },
          { type: 'FEATURES', title: '주요 특징', body: input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n') },
          { type: 'SOCIAL_PROOF', title: '고객 후기', body: `"${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자` },
          { type: 'HOW_TO_USE', title: '사용 방법', body: `1. ${input.productName}을 준비합니다.\n2. 설정을 완료합니다.\n3. 사용을 시작하세요!` },
          { type: 'FAQ', title: '자주 묻는 질문', body: `Q: 주요 특징은?\nA: ${input.keyFeatures[0] || '뛰어난 품질'}입니다.` },
        ],
      };
    }

    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `${systemPrompt}\n\n${userPrompt}${variationPrompt}\n\nCRITICAL: Do NOT use any emojis (😊, ✨, 💕, 🌟, ❤️, etc.). Write plain text only.\n\nReturn only the JSON object, no additional text or markdown.`,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      console.error('[Orchestration] Failed to parse text content, using fallback');
      return null;
    }
  };

  // 2. 두 버전의 텍스트 콘텐츠 생성
  console.log('[Orchestration] Generating text content for 2 versions...');
  const [textContent1, textContent2] = await Promise.all([
    generateTextContent(0),
    generateTextContent(1),
  ]);

  // 3. 각 섹션별 다중 이미지 프롬프트 생성
  // MAIN: 올리브영 메인 썸네일 스타일 (상세페이지 진입 전 제품 슬로건 이미지)
  console.log('[Orchestration] Generating section image prompts with copyLength-based counts...');
  const sectionTypes: Array<'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ'> = [
    'MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'
  ];

  const brandStyle = input.brandContext?.imageKeywords?.join(', ');

  // 3-1. 각 섹션별 권장 이미지 수 계산
  const sectionImageCounts = sectionTypes.map(sectionType => {
    const extendedType = mapToExtendedSectionType(sectionType) as ExtendedSectionType;
    const sectionImageInfo = getSectionImagePrompt(
      extendedType,
      input.category,
      input.productName,
      visualTheme?.backgroundColors.gradient || 'soft gradient'
    );
    const count = calculateImageCount(
      input.copyLength,
      sectionImageInfo.suggestedImageCount,
      sectionType
    );
    return { sectionType, count, overlayTextGuide: sectionImageInfo.overlayTextGuide };
  });

  // 3-2. 전체 이미지 수가 maxTotalImages를 초과하지 않도록 조정
  const adjustedCounts = adjustImageCountsToLimit(sectionImageCounts, input.copyLength);

  const totalImages = Array.from(adjustedCounts.values()).reduce((sum, c) => sum + c, 0);
  console.log(`[Orchestration] Image counts by section (total: ${totalImages}):`, Object.fromEntries(adjustedCounts));

  // 3-3. 각 섹션별 다중 이미지 프롬프트 생성
  // - 동일한 visualReference 전달로 제품 일관성 유지
  // - 동일한 visualTheme 전달로 배경/조명/분위기 일관성 유지
  const imagePromptsMap = new Map<string, SectionImagePrompt[]>();

  await Promise.all(
    sectionTypes.map(async (sectionType) => {
      const imageCount = adjustedCounts.get(sectionType) || 1;
      const sectionInfo = sectionImageCounts.find(s => s.sectionType === sectionType);

      // 해당 섹션에 대해 imageCount만큼 프롬프트 생성
      const prompts: SectionImagePrompt[] = await Promise.all(
        Array.from({ length: imageCount }, async (_, index) => {
          // 변형 힌트 생성 (예: "variation 1 of 3", "shade #21")
          const variationHint = imageCount > 1
            ? generateVariationHint(sectionType, index, imageCount, input.category, sectionInfo?.overlayTextGuide)
            : undefined;

          const [imagePrompt, overlayText] = await Promise.all([
            generateSectionImagePrompt(
              sectionType,
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience,
              brandStyle,
              visualReference,
              visualTheme
            ),
            input.generateImages ? generateOverlayText(
              sectionType,
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience
            ) : undefined,
          ]);

          return {
            ...imagePrompt,
            overlayText,
            imageIndex: index,
            totalImagesInSection: imageCount,
            variationHint,
          };
        })
      );

      imagePromptsMap.set(sectionType, prompts);
    })
  );

  console.log('[Orchestration] Multi-image prompts generated for all sections');

  // 4. 결과 조합 (다중 이미지 프롬프트 포함)
  const buildResult = (textContent: { hookMessage: string; sections: Array<{ type: string; title?: string; body: string }> } | null): OrchestrationResult => {
    if (!textContent) {
      // 폴백 결과
      return {
        hookMessage: `${input.productName} - 최고의 선택`,
        sections: sectionTypes.map((type, index) => {
          const sectionPrompts = imagePromptsMap.get(type) || [];
          const firstPrompt = sectionPrompts[0];
          return {
            id: uuidv4(),
            type,
            title: type,
            body: `${input.productName} ${type} 섹션`,
            order: index,
            imagePrompt: firstPrompt,                    // 기존 호환성
            imagePrompts: sectionPrompts.length > 1 ? sectionPrompts : undefined, // 다중 이미지
          };
        }),
      };
    }

    return {
      hookMessage: textContent.hookMessage,
      sections: textContent.sections.map((section, index) => {
        const sectionType = section.type as 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
        const sectionPrompts = imagePromptsMap.get(sectionType) || imagePromptsMap.get('HERO') || [];
        const firstPrompt = sectionPrompts[0];

        return {
          id: uuidv4(),
          type: section.type,
          title: section.title,
          body: section.body,
          order: index,
          imagePrompt: firstPrompt,                      // 기존 호환성
          imagePrompts: sectionPrompts.length > 1 ? sectionPrompts : undefined, // 다중 이미지
        };
      }),
    };
  };

  const results = [
    buildResult(textContent1),
    buildResult(textContent2),
  ];

  console.log('[Orchestration] Detail page generation completed');

  return results;
}

// ============================================
// 단일 섹션 재생성 함수
// ============================================

export async function regenerateSectionImagePrompt(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  userFeedback?: string
): Promise<SectionImagePrompt> {
  console.log(`[Orchestration] Regenerating image prompt for ${sectionType}...`);

  const position = mapSectionTypeToPosition(sectionType);
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      sectionType,
      position,
      imagePrompt: buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords),
      compositionGuide,
    };
  }

  const promptGenerationRequest = `
당신은 상세페이지 이미지 프롬프트 전문가입니다.
기존 프롬프트를 개선하여 새로운 버전을 만들어주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}

## 섹션: ${sectionType} (${position})
- 레이아웃: ${compositionGuide.layout}
- 분위기: ${compositionGuide.mood}

## 참조 프롬프트 (올리브영 베스트셀러)
${referencePrompts.slice(0, 2).join('\n')}

${userFeedback ? `## 사용자 피드백\n${userFeedback}` : ''}

## 규칙
1. 텍스트 없이 제품만 포함
2. 영어로 작성
3. 이전과 다른 새로운 접근

프롬프트만 반환하세요.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: promptGenerationRequest,
    });

    let imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!imagePrompt.toLowerCase().includes('no text')) {
      imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
    }

    return {
      sectionType,
      position,
      imagePrompt,
      compositionGuide,
    };
  } catch (error) {
    console.error('[Orchestration] Regeneration failed:', error);
    const fallback = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords);
    return {
      sectionType,
      position,
      imagePrompt: fallback,
      compositionGuide,
    };
  }
}
