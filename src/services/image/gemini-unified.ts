/**
 * ★ Gemini 통합 이미지 + 오버레이 생성 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - T2I/I2I 모드 자동 라우팅, 메인 진입점
 */

import type { OverlayTextContent, SectionType } from '@/services/ai/prompts/types';
import { buildOverlayTextPrompt } from '@/services/ai/prompts/overlay-prompts';
import type { GeminiImageModel, GeminiGeneratedImage, ImageWithOverlayResult } from './gemini-types';
import { DEFAULT_IMAGE_MODEL } from './gemini-types';
import {
  mapToBaseSectionType,
  buildCreativeOverlayGuide,
  buildOverlayTextRequest,
  NO_TEXT_IN_IMAGE_REINFORCEMENT,
} from './gemini-prompts';
import { generateImageWithGemini, generateSectionImageWithGemini } from './gemini-t2i';
import { generateSectionImageFromProduct } from './gemini-i2i';
import { createDefaultOverlayForSection } from './gemini-overlay';

// ============================================
// ★ 통합 이미지 + 오버레이 생성 함수 (메인 진입점)
// ============================================

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
  let usedImagePrompt: string = '';

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
    usedImagePrompt = generatedImage.revisedPrompt || scenarioPrompt || '';
  } else {
    // T2I 모드: 프롬프트 기반 생성
    if (isTextBackgroundSection) {
      // ★★★ 텍스트 배경 섹션: generateImageWithGemini 직접 호출 ★★★
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

      const blockVariant = blockIndex % 2 === 0 ? 'solid' : 'gradient';

      const colorPrompt = blockVariant === 'solid'
        ? `Pure solid ${colorInfo.name} (${colorInfo.primary}) color fill only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean solid color`
        : `Simple horizontal gradient from ${colorInfo.gradient} only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean gradient`;

      const negativePrompt = 'product, cosmetic, bottle, tube, packaging, container, objects, shapes, decorations, patterns, textures, elements, water droplets, leaves, botanical, sparkles, glow effects, text, letters, words, typography';

      const textBgOverlayPrompt = buildOverlayTextPrompt(
        'FEATURES' as SectionType,
        productName,
        category,
        keyFeatures || [],
        targetAudience || 'General'
      );
      const isFlashModel = model === 'gemini-2.5-flash-image';
      const overlayTextRequest = buildOverlayTextRequest(textBgOverlayPrompt, isFlashModel, '16:9', model);

      const textBgFinalPrompt = `${colorPrompt}, absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only --negative ${negativePrompt}${overlayTextRequest}`;

      console.log(`[Image+Overlay] ★ Text background section ${sectionType}: Using ${blockVariant} color prompt DIRECTLY (bypassing buildSharedSectionPrompt)`);

      const textBgImages = await generateImageWithGemini({
        prompt: textBgFinalPrompt,
        model,
        aspectRatio: '16:9',
      });

      if (textBgImages.length === 0) {
        throw new Error(`No image generated for text background section ${sectionType}`);
      }

      generatedImage = {
        ...textBgImages[0],
        revisedPrompt: textBgFinalPrompt,
        promptComponents: {
          generationMode: 'T2I',
          sectionTypeOriginal: sectionType,
          sectionTypeMapped: 'TEXT_BACKGROUND',
          sectionBasePrompt: colorPrompt,
          overlayTextPrompt: textBgOverlayPrompt,
          overlayGuidePrompt: buildCreativeOverlayGuide('16:9', model),
          noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,
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
      usedImagePrompt = generatedImage.revisedPrompt || t2iPrompt;
    }
  }

  // 2. 오버레이 텍스트 처리
  // ★★★ 이미지 모델에서 받은 overlayText만 사용 (텍스트 모델 폴백 없음!)
  const finalOverlayText: OverlayTextContent = generatedImage.overlayText || createDefaultOverlayForSection(
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
