/**
 * SDXL Base 프롬프트 빌더
 */

import type { ModelPromptBuilder, PromptInput, PromptOutput } from '../../types';
import {
  getBaseTemplate,
  getCategoryTags,
  getBackgroundStyle,
  extractIngredients,
  QUALITY_TAGS,
} from '../../base-templates';
import { SDXL_CONFIG } from './config';
import { buildSDXLNegative } from './negative';

// ============================================
// SDXL 프롬프트 빌더
// ============================================

export const sdxlBuilder: ModelPromptBuilder = {
  config: SDXL_CONFIG,

  /**
   * 일반 섹션 프롬프트 빌드
   */
  buildPrompt(input: PromptInput): PromptOutput {
    const template = getBaseTemplate(input.sectionType);
    const categoryTags = getCategoryTags(input.category);
    const background = getBackgroundStyle(input.background);

    // 프롬프트 파츠 조합 (키워드 우선순위)
    const parts: string[] = [];

    // 1. 품질 태그 (최우선)
    parts.push(...QUALITY_TAGS.premium);
    parts.push(...QUALITY_TAGS.product);

    // 2. 제품명 + 카테고리
    parts.push(input.productName);
    parts.push(...categoryTags);

    // 3. 구도
    parts.push(template.composition);

    // 4. 배경
    parts.push(`${background} background`);

    // 5. 조명
    parts.push(template.lighting);

    // 6. 분위기
    parts.push(...template.mood);

    // 7. 핵심 특징 (있으면)
    if (input.keyFeatures && input.keyFeatures.length > 0) {
      parts.push(`featuring ${input.keyFeatures.slice(0, 2).join(' and ')}`);
    }

    // 8. 추가 키워드
    if (input.additionalKeywords) {
      parts.push(...input.additionalKeywords);
    }

    const positive = parts.join(', ');
    const negative = buildSDXLNegative({
      excludeHuman: !input.includeHuman,
      cleanBackground: true,
    });

    return { positive, negative };
  },

  /**
   * MAIN 섹션 전용 프롬프트 (재료 오브제 포함)
   */
  buildMainPrompt(input: PromptInput): PromptOutput {
    const template = getBaseTemplate('MAIN');
    const categoryTags = getCategoryTags(input.category);
    const background = getBackgroundStyle(input.background);
    const ingredients = extractIngredients(input.productName);

    const parts: string[] = [];

    // 1. 품질 태그
    parts.push(...QUALITY_TAGS.premium);
    parts.push(...QUALITY_TAGS.commercial);

    // 2. 제품 + 핵심 구도
    parts.push(input.productName);
    parts.push('product photography');
    parts.push('hero shot');
    parts.push('centered composition');

    // 3. 카테고리
    parts.push(...categoryTags);

    // 4. 구도 상세
    parts.push(template.composition);

    // 5. 배경
    parts.push(`${background} gradient background`);
    parts.push('soft transition');
    parts.push('clean minimal backdrop');

    // 6. 재료 오브제 (있으면)
    if (ingredients.length > 0) {
      parts.push(`with subtle ${ingredients.join(' and ')} decorative elements at base`);
    }

    // 7. 조명
    parts.push(template.lighting);

    // 8. 스타일
    parts.push('commercial photography');
    parts.push('e-commerce style');
    parts.push('Korean beauty aesthetic');
    parts.push('premium quality');

    // 9. 핵심 특징
    if (input.keyFeatures && input.keyFeatures.length > 0) {
      parts.push(`highlighting ${input.keyFeatures[0]}`);
    }

    const positive = parts.join(', ');
    const negative = buildSDXLNegative({
      excludeHuman: true,
      cleanBackground: true,
    });

    return { positive, negative };
  },
};
