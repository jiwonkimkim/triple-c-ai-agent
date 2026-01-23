/**
 * ★ Gemini Image-to-Image (I2I) 파이프라인 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 사용자 제품 이미지 기반 생성, 배경 제거, 전처리
 */

import type { OverlayTextContent, OverlayTextItem, SectionType } from '@/services/ai/prompts/types';
import { buildOverlayTextPrompt } from '@/services/ai/prompts/overlay-prompts';
import type { GeminiImageModel, GeminiGeneratedImage, ImageToImageOptions, RemoveBackgroundOptions } from './gemini-types';
import { DEFAULT_IMAGE_MODEL } from './gemini-types';
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
import { getGeminiClient, extractBase64FromSource, base64ToDataUrl, extractIngredientObjects, selectRandomMoodObjects } from './gemini-utils';
import { generateImageWithGemini } from './gemini-t2i';

// ============================================
// ★ 배경 제거 기능
// ============================================

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
    model = DEFAULT_IMAGE_MODEL,
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
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL
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
// ★ 핵심 I2I API 호출 함수
// ============================================

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
    model = DEFAULT_IMAGE_MODEL,
    preserveStrength = 0.85,
    aspectRatio,
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
- Absolutely no text/typography/watermarks`;

    // Gemini에 이미지 + 텍스트 프롬프트 동시 전송 (Google AI 공식 방식)
    console.log(`[Gemini I2I] ★★★ Sending IMAGE-TO-IMAGE request ★★★`);
    console.log(`[Gemini I2I] Model: ${model}`);
    console.log(`[Gemini I2I] Image attached: YES (${base64.length} chars, mimeType: ${mimeType})`);
    console.log(`[Gemini I2I] AspectRatio: ${aspectRatio || 'free'}`);
    console.log(`[Gemini I2I] Prompt preview: ${enhancedPrompt.substring(0, 200)}...`);

    // image_config 설정
    const isProModel = model.includes('pro');
    const imageConfig = {
      ...(aspectRatio && { aspectRatio: aspectRatio }),
      ...(isProModel && { imageSize: "1K" }),
    };

    const response = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
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
        responseModalities: ['TEXT', 'IMAGE'],
        ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
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

            // texts 배열 형식만 지원
            if (parsed.texts && Array.isArray(parsed.texts)) {
              extractedOverlayText = { texts: parsed.texts };
              console.log(`[Gemini I2I] ★ Overlay text extracted from image model: ${parsed.texts.length} texts`);
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

// ============================================
// ★ 섹션별 I2I 생성 함수
// ============================================

/**
 * 상세페이지 섹션용 Image-to-Image 생성
 * - 사용자 제품 이미지를 기반으로 각 섹션에 맞는 스타일로 변환
 * - keyFeatures와 targetAudience를 반영하여 맞춤형 이미지 생성
 * - scenarioPrompt가 전달되면 오케스트레이션 프롬프트 활용 (없으면 기본 템플릿 사용)
 */
export async function generateSectionImageFromProduct(
  sourceImage: string,
  sectionType: string,
  productName: string,
  category: string,
  additionalPrompt?: string,
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL,
  keyFeatures?: string[],
  targetAudience?: string,
  scenarioPrompt?: string
): Promise<GeminiGeneratedImage> {
  // ★★★ 텍스트 배경 섹션은 제품 이미지 없이 T2I로 생성해야 함
  const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);
  if (isTextBackgroundSection) {
    console.log(`[Gemini I2I] ★ TEXT BACKGROUND SECTION: ${sectionType} - Using direct color prompt (bypassing buildSharedSectionPrompt)`);

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

    const colorPrompt = `Pure solid ${colorInfo.name} (${colorInfo.primary}) color fill only, completely flat empty background, no objects, no shapes, no textures, no patterns, just clean solid color`;
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

    const textBgImages = await generateImageWithGemini({
      prompt: textBgFinalPrompt,
      model,
      aspectRatio: '16:9',
    });

    if (textBgImages.length === 0) {
      throw new Error(`No image generated for text background section ${sectionType}`);
    }

    return {
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
  }

  // ★★★ 일반 I2I 섹션 처리
  const mappedSectionType = mapToBaseSectionType(sectionType);
  console.log(`[Gemini I2I] Section type mapping: ${sectionType} → ${mappedSectionType}`);

  const ingredientObjects = extractIngredientObjects(productName, category);
  const moodSelection = selectRandomMoodObjects();
  const audienceStyle = buildAudienceStyle(targetAudience);
  const featureHighlight = buildFeatureHighlight(keyFeatures);

  const basePrompt = buildSharedSectionPrompt(mappedSectionType, {
    productName,
    category,
    ingredientObjects,
    moodSelection: moodSelection.selected,
    audienceStyle,
    featureHighlight,
    isI2I: true,
  });

  console.log(`[Gemini I2I] Using shared section template for ${sectionType} → ${mappedSectionType}`);

  // 오케스트레이션 프롬프트 추가
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

  // 오버레이 텍스트 요청 생성
  const overlayTextPrompt = buildOverlayTextPrompt(
    mappedSectionType,
    productName,
    category,
    keyFeatures || [],
    targetAudience || 'General'
  );

  const aspectRatio = getSectionAspectRatio(sectionType);
  const isFlashModel = model === 'gemini-2.5-flash-image';
  const overlayTextRequest = buildOverlayTextRequest(overlayTextPrompt, isFlashModel, aspectRatio, model);

  const fullPrompt = `${MISSION_PROMPT}${basePrompt}${orchestrationContext}

Product: ${productName}
Category: ${category}
${additionalPrompt ? `Additional style: ${additionalPrompt}` : ''}

OUTPUT: High-quality commercial photography, no text on image.
${overlayTextRequest}`;

  console.log(`[Gemini I2I] Generating ${sectionType} (→${mappedSectionType}) section image, aspectRatio: ${aspectRatio || '3:4'}`);
  if (mappedSectionType === 'MAIN') {
    console.log(`[Gemini I2I] MAIN with custom objects - keyFeatures: ${keyFeatures?.join(', ')}, target: ${targetAudience}`);
  }

  const images = await generateImageFromImage({
    sourceImage,
    prompt: fullPrompt,
    model,
    preserveStrength: 0.75,
    ...(aspectRatio && { aspectRatio }),
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType} section`);
  }

  return {
    ...images[0],
    revisedPrompt: fullPrompt,
    promptComponents: {
      ...images[0].promptComponents,
      generationMode: 'I2I',
      sectionTypeOriginal: sectionType,
      sectionTypeMapped: mappedSectionType,
      missionPrompt: MISSION_PROMPT.trim(),
      sectionBasePrompt: basePrompt,
      orchestrationPrompt: scenarioPrompt || undefined,
      i2iSystemPrompt: orchestrationContext || undefined,
      overlayTextPrompt,
      overlayGuidePrompt: buildCreativeOverlayGuide(aspectRatio, model),
      noTextReinforcement: isFlashModel ? NO_TEXT_IN_IMAGE_REINFORCEMENT : undefined,
    },
  };
}
