/**
 * Flux Schnell 프롬프트 빌더
 * Flux는 자연어를 더 잘 이해하므로 문장형 프롬프트 사용
 */

import type { ModelPromptBuilder, PromptInput, PromptOutput } from '../../types';
import {
  getBaseTemplate,
  getCategoryTags,
  getBackgroundStyle,
  extractIngredients,
} from '../../base-templates';
import { FLUX_CONFIG } from './config';

// ============================================
// Flux 프롬프트 빌더
// ============================================

export const fluxBuilder: ModelPromptBuilder = {
  config: FLUX_CONFIG,

  /**
   * 일반 섹션 프롬프트 빌드
   * Flux는 자연어 스타일로 작성
   */
  buildPrompt(input: PromptInput): PromptOutput {
    const template = getBaseTemplate(input.sectionType);
    const categoryTags = getCategoryTags(input.category);
    const background = getBackgroundStyle(input.background);

    // Flux는 문장형 프롬프트 선호
    const sentences: string[] = [];

    // 1. 메인 설명
    sentences.push(
      `Professional ${categoryTags[0] || 'product'} photography of ${input.productName}.`
    );

    // 2. 구도
    sentences.push(template.composition + '.');

    // 3. 배경 & 조명
    sentences.push(`${background} background with ${template.lighting}.`);

    // 4. 분위기
    sentences.push(`${template.mood.slice(0, 3).join(', ')} aesthetic.`);

    // 5. 특징 (있으면)
    if (input.keyFeatures && input.keyFeatures.length > 0) {
      sentences.push(`Highlighting ${input.keyFeatures[0]}.`);
    }

    // 6. 품질
    sentences.push('8K, ultra detailed, commercial quality photography.');

    // 7. 텍스트 제외
    sentences.push('No text, no typography, no watermarks.');

    const positive = sentences.join(' ');

    return {
      positive,
      negative: '', // Flux는 네거티브 미지원
    };
  },

  /**
   * MAIN 섹션 전용 프롬프트
   */
  buildMainPrompt(input: PromptInput): PromptOutput {
    const background = getBackgroundStyle(input.background);
    const categoryTags = getCategoryTags(input.category);
    const ingredients = extractIngredients(input.productName);

    const sentences: string[] = [];

    // 1. 메인 설명
    sentences.push(
      `Stunning e-commerce hero shot of ${input.productName}, a premium ${categoryTags[0] || 'product'}.`
    );

    // 2. 구도
    sentences.push(
      'Product centered in frame taking 50-60% of the image, sharp focus on product details.'
    );

    // 3. 배경
    sentences.push(
      `Clean ${background} gradient background with empty space at top 25% and bottom 20% for text overlay.`
    );

    // 4. 재료 오브제 (있으면)
    if (ingredients.length > 0) {
      sentences.push(
        `Subtle decorative ${ingredients.join(' and ')} elements artfully placed at the base.`
      );
    }

    // 5. 조명 & 스타일
    sentences.push(
      'Soft studio lighting with gentle highlights and subtle shadows. Premium commercial photography style.'
    );

    // 6. 분위기
    sentences.push(
      'Korean beauty aesthetic, aspirational luxury feel, e-commerce ready.'
    );

    // 7. 품질
    sentences.push(
      '8K ultra detailed, masterpiece quality, professional product photography.'
    );

    // 8. 제외
    sentences.push(
      'Absolutely no text, no typography, no watermarks, no logos in the image.'
    );

    const positive = sentences.join(' ');

    return {
      positive,
      negative: '',
    };
  },
};
