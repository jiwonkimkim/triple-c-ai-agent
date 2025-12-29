/**
 * 이미지 생성 프롬프트 빌더
 * 올리브영 패턴 분석 기반 이미지 프롬프트 생성
 */

import type { ProductVisualReference, SectionType } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';

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
 * 섹션별 이미지 생성 프롬프트 빌더
 * 중요: 이미지에는 텍스트를 포함하지 않음 (텍스트는 별도 오버레이)
 */
export function buildImagePrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string,
  visualReference?: ProductVisualReference
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section as keyof typeof SECTION_STORY_GUIDE];

  if (!sectionGuide) {
    // CUSTOM 섹션이나 알 수 없는 섹션의 경우 FEATURES 가이드 사용
    return buildImagePrompt('FEATURES', productName, category, keyFeatures, brandStyle, visualReference);
  }

  // 올리브영 분석 기반 비주얼 키워드
  const visualKeywords = sectionGuide.visualEmphasis.slice(0, 4).join(', ');
  const categoryVisual = categoryPattern.visualPatterns.slice(0, 3).join(', ');

  // 텍스트 제외 지시 (이미지에는 제품만, 텍스트는 별도 오버레이)
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 제품 일관성 지시문
  const consistencyInstruction = buildProductConsistencyInstruction(productName, category, visualReference);

  // 제품 외형 참조 (있으면 사용)
  const productAppearance = visualReference?.appearance
    ? `${productName} (${visualReference.appearance})`
    : productName;

  const basePrompts: Record<string, string> = {
    HERO: `[${consistencyInstruction}] product photography of ${productAppearance}, elegant ${category} product, centered hero composition, gradient background, soft diffused studio lighting, subtle reflection, luxury beauty advertisement, premium cosmetic branding, high-end minimalist aesthetic, ${visualKeywords}, ${categoryVisual}, 8k resolution, ${noTextInstruction}`,

    FEATURES: `[${consistencyInstruction}] ${productAppearance} with key ingredient visualization for ${category}, ${keyFeatures[0] || 'natural ingredients'}, the SAME product from HERO section displayed alongside fresh botanical elements with water droplets, detailed macro photography, clean background, natural soft lighting, scientific yet elegant aesthetic, ingredient showcase, ${visualKeywords}, ${categoryVisual}, high detail, ${noTextInstruction}`,

    SOCIAL_PROOF: `[${consistencyInstruction}] ${productAppearance} shown with skin texture comparison for ${category}, the SAME product from previous sections, split screen composition showing skin improvement with product visible, even studio lighting, neutral background, clinical results visualization, professional dermatology style, ${visualKeywords}, ${categoryVisual}, trust-building imagery, ${noTextInstruction}`,

    HOW_TO_USE: `[${consistencyInstruction}] beauty application tutorial featuring ${productAppearance}, the SAME product from previous sections, korean model applying the IDENTICAL ${category} product, clear instructional composition, bright lighting, clean minimal background, how-to tutorial style, easy to follow visual guide, ${visualKeywords}, ${categoryVisual}, aspirational lifestyle, ${noTextInstruction}`,

    FAQ: `[${consistencyInstruction}] ${productAppearance} collection showcase, the SAME product from all previous sections as the hero item, complete lineup display with IDENTICAL main product, products arranged elegantly, gradient background, studio lighting, brand portfolio presentation, premium product range, ${visualKeywords}, ${categoryVisual}, ${noTextInstruction}`,
  };

  const styleAddition = brandStyle ? `, brand style: ${brandStyle}` : ', modern, clean, professional';

  return `${basePrompts[section] || basePrompts.FEATURES}${styleAddition}`;
}

// 하위 호환성을 위한 별칭
export const buildEnhancedImagePrompt = buildImagePrompt;
