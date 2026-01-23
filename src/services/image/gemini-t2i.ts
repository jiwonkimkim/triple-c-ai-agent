/**
 * ★ Gemini Text-to-Image (T2I) 파이프라인 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 텍스트 프롬프트 기반 이미지 생성 함수들
 */

import type { OverlayTextContent, OverlayTextItem, SectionType } from '@/services/ai/prompts/types';
import { buildOverlayTextPrompt } from '@/services/ai/prompts/overlay-prompts';
import type { GeminiImageModel, GeminiGenerateImageOptions, GeminiGeneratedImage } from './gemini-types';
import { getSectionAspectRatio } from './gemini-resolution';
import {
  MISSION_PROMPT,
  NO_TEXT_IN_IMAGE_REINFORCEMENT,
  mapToBaseSectionType,
  buildSharedSectionPrompt,
  buildCreativeOverlayGuide,
  buildAudienceStyle,
  buildFeatureHighlight,
  buildOverlayTextRequest,
} from './gemini-prompts';
import { getGeminiClient, extractIngredientObjects, selectRandomMoodObjects } from './gemini-utils';

// ============================================
// ★ 핵심 T2I API 호출 함수
// ============================================

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

    // ★ Pro 모델은 1K 해상도 명시
    const isProModel = model.includes('pro');
    const imageConfig = {
      ...(aspectRatio && { aspectRatio: aspectRatio }),
      ...(isProModel && { imageSize: "1K" }),
    };

    let response;
    try {
      // ★★★ T2I: responseModalities로 이미지 생성 강제 + imageConfig로 비율/해상도 설정 ★★★
      response = await client.models.generateContent({
        model: model,
        contents: [prompt],
        config: {
          responseModalities: ['Image', 'Text'],  // ★ 이미지 생성 강제
          ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
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

            // texts 배열 형식만 지원
            if (parsed.texts && Array.isArray(parsed.texts)) {
              extractedOverlayText = { texts: parsed.texts };
              console.log(`[Gemini] ★ Overlay text extracted from image model: ${parsed.texts.length} texts`);
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

// ============================================
// ★ 섹션별 T2I 생성 함수
// ============================================

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
  let orchestrationContext = '';
  if (mappedSectionType !== 'MAIN' && imagePrompt && imagePrompt.trim()) {
    orchestrationContext = `

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
  // ★ 모델별 해상도 적용 (Flash: 864x1184, Pro: 896x1200 등)
  const overlayTextRequest = buildOverlayTextRequest(overlayTextPrompt, isFlashModel, aspectRatio, model);

  // ★★★ Step1/Step2 구조로 최종 프롬프트 조립 ★★★
  const noTextInStep1 = isFlashModel ? `\n${NO_TEXT_IN_IMAGE_REINFORCEMENT}` : '';
  const step1Content = `
[Step1. 이미지 디자인 - Image Design]
★ Generate the detail page image. DO NOT render any text/letters in the image.
(상세페이지 이미지를 생성합니다. 텍스트는 이미지로 생성하지 않습니다.)
${noTextInStep1}
${sectionPrompt}${orchestrationContext}`;

  const finalPrompt = MISSION_PROMPT + step1Content + overlayTextRequest;

  console.log(`[Gemini T2I] Generating ${sectionType} (→${mappedSectionType}) with aspectRatio: ${aspectRatio || '3:4'}, with overlay text request`);

  // ★★★ 프롬프트 구성요소 분리 (개발자 모드용) ★★★
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
    prompt: finalPrompt,
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
      // [0] 메타 정보 (UI 태그 표시용)
      generationMode: 'T2I',
      sectionTypeOriginal: sectionType,
      sectionTypeMapped: mappedSectionType,
      // ★ 미션 프롬프트
      missionPrompt: MISSION_PROMPT.trim(),
      // [1] 섹션별 프롬프트
      sectionBasePrompt,
      orchestrationPrompt: orchestrationContext || undefined,
      // [2] 오버레이 텍스트 관련 프롬프트
      overlayTextPrompt,
      overlayGuidePrompt: buildCreativeOverlayGuide(aspectRatio, model),
      // [3] 공통 프롬프트 (Flash 모델 전용)
      noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,
    },
  };
}

// ============================================
// ★ 레거시 T2I 함수들 (기존 호환용)
// ============================================

/** Build prompt for product hero image */
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

/** Generate product hero image using Gemini */
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

/** Generate product feature image using Gemini */
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

/** Generate lifestyle/context image using Gemini */
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

/** Generate section images for detail page */
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
