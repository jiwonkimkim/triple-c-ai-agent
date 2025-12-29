/**
 * 이미지 생성 프롬프트 빌더
 * 올리브영 패턴 분석 기반 이미지 프롬프트 생성
 * 상세페이지 특화 레이아웃, 텍스트 영역, 네거티브 프롬프트 적용
 */

import type { ProductVisualReference, SectionType, LayoutStyle, SafeZonePosition } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';
import {
  getOptimalCompositionForSection,
  buildNegativePrompt,
  buildTextSafeZonePrompt,
  LAYOUT_SAFE_ZONE_MAPPING,
} from './image-composition';

// ============================================
// 제품 일관성 지시문 생성
// ============================================

/**
 * 제품 일관성 지시문 생성
 * 모든 섹션 이미지에서 동일한 제품이 표시되도록 강제
 */
function buildProductConsistencyInstruction(
  productName: string,
  _category: string,
  visualReference?: ProductVisualReference
): string {
  const baseInstruction = `CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" product must appear identically across all images. Maintain consistent product design, shape, color, packaging, and branding elements throughout all sections.`;

  if (visualReference) {
    const details = [
      visualReference.appearance && `Product appearance: ${visualReference.appearance}`,
      visualReference.colorScheme && `Color scheme: ${visualReference.colorScheme}`,
      visualReference.packageShape && `Package shape: ${visualReference.packageShape}`,
      visualReference.brandVisual && `Brand visual style: ${visualReference.brandVisual}`,
    ].filter(Boolean).join('. ');

    return `${baseInstruction} ${details}`;
  }

  return `${baseInstruction} Use identical product rendering in every shot - same angles show same details, consistent lighting on product surface, uniform product proportions.`;
}

// ============================================
// 이미지 프롬프트 빌더
// ============================================

/**
 * 이미지 프롬프트 옵션
 */
export interface ImagePromptOptions {
  /** 선호하는 레이아웃 스타일 */
  preferredLayout?: LayoutStyle;
  /** 텍스트 배치 위치 (해당 영역 비워두기) */
  textPositions?: SafeZonePosition[];
  /** 네거티브 프롬프트 포함 여부 */
  includeNegative?: boolean;
  /** 추가 스타일 키워드 */
  additionalStyle?: string;
}

/**
 * 섹션별 이미지 생성 프롬프트 빌더
 * 중요: 이미지에는 텍스트를 포함하지 않음 (텍스트는 별도 오버레이)
 */
export function buildImagePrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string,
  visualReference?: ProductVisualReference,
  options?: ImagePromptOptions
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section as keyof typeof SECTION_STORY_GUIDE];

  if (!sectionGuide) {
    // CUSTOM 섹션이나 알 수 없는 섹션의 경우 FEATURES 가이드 사용
    return buildImagePrompt('FEATURES', productName, category, keyFeatures, brandStyle, visualReference, options);
  }

  // 최적 구도 설정 가져오기
  const composition = getOptimalCompositionForSection(section, options?.preferredLayout);

  // 올리브영 분석 기반 비주얼 키워드
  const visualKeywords = sectionGuide.visualEmphasis.slice(0, 4).join(', ');
  const categoryVisual = categoryPattern.visualPatterns.slice(0, 3).join(', ');

  // 제품 일관성 지시문
  const consistencyInstruction = buildProductConsistencyInstruction(productName, category, visualReference);

  // 제품 외형 참조 (있으면 사용)
  const productAppearance = visualReference?.appearance
    ? `${productName} (${visualReference.appearance})`
    : productName;

  // 레이아웃 구도 프롬프트
  const layoutPrompt = composition.layoutPrompt;

  // 텍스트 안전 영역 프롬프트
  const textZonePrompt = options?.textPositions
    ? buildTextSafeZonePrompt(options.textPositions)
    : composition.safeZonePrompt;

  // 스타일 추가
  const styleAddition = brandStyle
    ? `brand style: ${brandStyle}`
    : options?.additionalStyle || 'modern, clean, professional';

  // 섹션별 핵심 콘텐츠
  const sectionContent = buildSectionContent(
    section,
    productAppearance,
    category,
    keyFeatures,
    visualKeywords,
    categoryVisual
  );

  // 프롬프트 조합
  let prompt = `[PRODUCT CONSISTENCY: ${consistencyInstruction}] [LAYOUT: ${layoutPrompt}] [TEXT SPACE: ${textZonePrompt}] ${sectionContent}, ${styleAddition}, professional e-commerce detail page photography, high-end product advertising, 8k resolution`;

  // 네거티브 프롬프트 추가 (옵션)
  if (options?.includeNegative !== false) {
    const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);
    prompt += ` --negative ${negativePrompt}`;
  }

  return prompt;
}

/**
 * 섹션별 핵심 콘텐츠 빌더
 */
function buildSectionContent(
  section: SectionType,
  productAppearance: string,
  category: string,
  keyFeatures: string[],
  visualKeywords: string,
  categoryVisual: string
): string {
  const contents: Record<SectionType, string> = {
    // MAIN: 올리브영 main.jpg 스타일 - 제품 중심, 수상 배지, 프로모션 강조
    MAIN: `${productAppearance} main promotional image, ${category} product hero shot with large product packaging prominently displayed in center, award badges and certification marks on corners, premium promotional banner aesthetic, festive confetti or decorative elements, gift set composition with bonus items, vibrant gradient background matching brand colors, Korean beauty e-commerce main thumbnail style, eye-catching promotional layout, NO TEXT ON IMAGE, ${visualKeywords}, ${categoryVisual}`,

    HERO: `premium product photography of ${productAppearance}, elegant ${category} product hero shot, soft diffused studio lighting with subtle rim light, subtle reflection on surface, luxury beauty advertisement aesthetic, premium cosmetic branding, ${visualKeywords}, ${categoryVisual}`,

    FEATURES: `${productAppearance} showcasing key ingredient visualization for ${category}, featuring ${keyFeatures[0] || 'natural active ingredients'}, product displayed alongside fresh botanical elements with delicate water droplets, detailed macro photography style, scientific yet elegant presentation, ingredient highlight, ${visualKeywords}, ${categoryVisual}`,

    SOCIAL_PROOF: `${productAppearance} in clinical results context for ${category}, skin texture improvement visualization, professional dermatology documentation style, before-after comparison layout implied, even clinical lighting, neutral medical-grade background, trust-building scientific imagery, ${visualKeywords}, ${categoryVisual}`,

    HOW_TO_USE: `beauty application tutorial scene featuring ${productAppearance}, korean model demonstrating ${category} product application, clear step-by-step instructional composition, bright even lighting, clean minimal background, how-to guide aesthetic, easy-to-follow visual instruction, ${visualKeywords}, ${categoryVisual}`,

    FAQ: `${productAppearance} product collection display, complete ${category} lineup showcase, elegant product arrangement, gradient background transitioning smoothly, studio lighting with soft shadows, brand portfolio presentation, premium product range display, ${visualKeywords}, ${categoryVisual}`,

    CUSTOM: `${productAppearance} professional product photography, ${category} product showcase, clean composition, studio lighting, ${visualKeywords}, ${categoryVisual}`,
  };

  return contents[section] || contents.CUSTOM;
}

/**
 * 향상된 이미지 프롬프트 빌더 (더 세밀한 컨트롤)
 */
export function buildEnhancedImagePrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string,
  visualReference?: ProductVisualReference,
  layoutStyle?: LayoutStyle,
  textPositions?: SafeZonePosition[]
): string {
  return buildImagePrompt(
    section,
    productName,
    category,
    keyFeatures,
    brandStyle,
    visualReference,
    {
      preferredLayout: layoutStyle,
      textPositions,
      includeNegative: true,
    }
  );
}

/**
 * 간단한 이미지 프롬프트 (네거티브 없이)
 */
export function buildSimpleImagePrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string
): string {
  return buildImagePrompt(
    section,
    productName,
    category,
    keyFeatures,
    brandStyle,
    undefined,
    { includeNegative: false }
  );
}

/**
 * 레이아웃 지정 이미지 프롬프트
 */
export function buildLayoutSpecificPrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  layoutStyle: LayoutStyle,
  brandStyle?: string,
  visualReference?: ProductVisualReference
): string {
  // 해당 레이아웃의 기본 텍스트 영역 가져오기
  const textPositions = LAYOUT_SAFE_ZONE_MAPPING[layoutStyle];

  return buildImagePrompt(
    section,
    productName,
    category,
    keyFeatures,
    brandStyle,
    visualReference,
    {
      preferredLayout: layoutStyle,
      textPositions,
      includeNegative: true,
    }
  );
}
