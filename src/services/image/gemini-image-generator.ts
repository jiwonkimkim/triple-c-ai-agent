import { GoogleGenAI } from '@google/genai';
import type { OverlayTextContent, OverlayTextItem, OverlayStatisticItem } from '@/services/ai/prompts/types';
import { generateFontGuideForAI } from '@/constants/fonts';

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
  // ★ 개발자 모드용 개별 프롬프트 구성요소
  promptComponents?: {
    orchestrationPrompt?: string;      // 오케스트레이션 AI가 생성한 시나리오
    categoryTemplatePrompt?: string;   // 섹션별 카테고리 템플릿
    i2iSystemPrompt?: string;          // I2I 시스템 프롬프트 (재배치 규칙)
    // ★★★ 고정/동적 프롬프트 분리 (NEW!)
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

  // 비율 지시 추가 (aspectRatio가 있을 때만)
  let enhancedPrompt = prompt;
  if (aspectRatio) {
    const aspectInstruction = aspectRatio === '1:1'
      ? '[IMAGE FORMAT: Output MUST be SQUARE (1:1 aspect ratio, 1024x1024)]'
      : aspectRatio === '16:9'
      ? '[IMAGE FORMAT: Output MUST be landscape (16:9 aspect ratio)]'
      : aspectRatio === '3:4'
      ? '[IMAGE FORMAT: Output MUST be portrait (3:4 aspect ratio)]'
      : `[IMAGE FORMAT: ${aspectRatio} aspect ratio]`;
    enhancedPrompt = `${aspectInstruction}\n\n${prompt}`;
  }

  try {
    console.log(`[Gemini] Generating image with model: ${model}, aspectRatio: ${aspectRatio || 'free'}`);
    console.log(`[Gemini] Prompt: ${prompt.substring(0, 100)}...`);

    // image_config 설정 (aspectRatio가 지정된 경우만)
    const imageConfig = aspectRatio ? {
      aspectRatio: aspectRatio,  // "1:1", "3:4", "16:9" 등
    } : undefined;

    // Generate images using Gemini with correct responseModalities format
    const response = await client.models.generateContent({
      model: model,
      contents: enhancedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        ...(imageConfig && { imageConfig }),
      },
    });

    // Process response parts to extract images
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`[Gemini] Image generated, mimeType: ${part.inlineData.mimeType}`);
          results.push({
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          });
        }
      }
    }

    console.log(`[Gemini] Total images generated: ${results.length}`);
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
 * - MAIN: 1:1 정사각형, 제품 정보 기반 맞춤 오브제 포함
 * - 나머지: 자유 비율
 */
export async function generateSectionImageWithGemini(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  imagePrompt: string,
  productName: string,
  category: string,
  model: GeminiImageModel = 'gemini-2.5-flash-image',
  keyFeatures?: string[],
  targetAudience?: string
): Promise<GeminiGeneratedImage> {
  // MAIN 섹션은 1:1, 나머지는 자유 비율
  const aspectRatio: ImageAspectRatio | undefined = sectionType === 'MAIN' ? '1:1' : undefined;

  // MAIN 섹션에 제품 정보 기반 맞춤 오브제 추가
  let enhancedPrompt = imagePrompt;
  if (sectionType === 'MAIN' && !imagePrompt.toLowerCase().includes('decorative')) {
    // 1. 제품명에서 실제 재료 오브제 추출 (매번 다른 조합)
    const ingredientObjects = extractIngredientObjects(productName, category);

    // 2. 랜덤 분위기 오브제 선택 (매번 다른 무드)
    const moodSelection = selectRandomMoodObjects();

    // 3. 타겟 고객 기반 스타일링
    let audienceStyle = '';
    if (targetAudience) {
      const audienceLower = targetAudience.toLowerCase();
      if (audienceLower.includes('20대') || audienceLower.includes('young') || audienceLower.includes('젊')) {
        audienceStyle = 'trendy, vibrant, youthful energy';
      } else if (audienceLower.includes('30대') || audienceLower.includes('40대') || audienceLower.includes('mature')) {
        audienceStyle = 'sophisticated, elegant, refined luxury';
      } else if (audienceLower.includes('남성') || audienceLower.includes('men') || audienceLower.includes('male')) {
        audienceStyle = 'masculine, bold, minimalist strength';
      } else if (audienceLower.includes('민감') || audienceLower.includes('sensitive')) {
        audienceStyle = 'gentle, calming, pure and clean';
      } else {
        audienceStyle = 'universal appeal, balanced aesthetic';
      }
    }

    // 4. 핵심 특징 반영
    let featureHighlight = '';
    if (keyFeatures && keyFeatures.length > 0) {
      featureHighlight = `Key product benefit to emphasize: ${keyFeatures[0]}`;
    }

    enhancedPrompt = `${imagePrompt}

[PREMIUM E-COMMERCE THUMBNAIL]

[VISUAL STYLE]
High-end beauty campaign aesthetic, editorial magazine quality, aspirational luxury feel.
Clean minimalist background with soft gradient that complements the product colors.

[PRODUCT HERO - DOMINANT FOCUS]
The product must be the absolute star - sharp, detailed, eye-catching.
Product takes 50-60% of the frame, perfectly lit with soft studio lighting.

[INGREDIENT VISUALIZATION]
Artfully arranged real ingredients nearby: ${ingredientObjects.join(', ')}
Place elegantly at the base or floating around the product (15-20% of frame).
Fresh, vibrant, photorealistic quality with natural textures.

[ATMOSPHERIC ELEMENTS - ${moodSelection.style}]
Subtle mood-setting accents: ${moodSelection.selected.join(', ')}
Delicately placed in background or sides (10-15% of frame).
Creates depth and visual interest without overwhelming the product.

[STYLING DIRECTION]
Target aesthetic: ${audienceStyle || 'Premium universal appeal'}
${featureHighlight || 'Highlight product quality and premium feel'}

[TECHNICAL REQUIREMENTS]
- Soft, diffused lighting with gentle highlights and shadows
- Shallow depth of field focusing on the product
- Rich, vibrant colors with professional color grading
- Premium commercial photography that triggers desire to purchase`;
  }

  console.log(`[Gemini T2I] Generating ${sectionType} with aspectRatio: ${aspectRatio || 'free'}`);

  const images = await generateImageWithGemini({
    prompt: enhancedPrompt,
    model,
    aspectRatio,
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType}`);
  }

  // 최종 사용된 프롬프트를 revisedPrompt로 반환
  return {
    ...images[0],
    revisedPrompt: enhancedPrompt,
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

    // 응답에서 이미지 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        console.log(`[Gemini I2I] Part type:`, part.text ? 'text' : part.inlineData ? 'inlineData' : 'unknown');
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
        } else if (part.text) {
          console.log(`[Gemini I2I] Text response instead of image: ${part.text.substring(0, 200)}...`);
        }
      }
    } else {
      console.warn(`[Gemini I2I] No candidates or parts in response`);
    }

    console.log(`[Gemini I2I] Total images generated: ${results.length}`);
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
    console.log(`[Gemini I2I] ★ TEXT BACKGROUND SECTION: ${sectionType} - Redirecting to T2I mode (no product)`);

    // ★★★ orchestration-service.ts와 동일한 로직 사용 ★★★
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

    const t2iPrompt = scenarioPrompt ||
      `${colorPrompt}, absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only --negative ${negativePrompt}`;

    // ★ 텍스트 배경 섹션은 'FEATURES'를 기본값으로 사용 (자유 비율)
    return generateSectionImageWithGemini(
      'FEATURES',
      t2iPrompt,
      productName,
      category,
      model,
      keyFeatures,
      targetAudience
    );
  }
  // MAIN 섹션: 제품명 기반 오브제 + 타겟/특징 반영
  let mainPrompt = '';
  if (sectionType === 'MAIN') {
    // 1. 제품명에서 실제 재료 오브제 추출 (매번 다른 조합)
    const ingredientObjects = extractIngredientObjects(productName, category);

    // 2. 랜덤 분위기 오브제 선택 (매번 다른 무드)
    const moodSelection = selectRandomMoodObjects();

    // 3. 타겟 고객 기반 스타일링
    let audienceStyle = 'Premium universal appeal';
    if (targetAudience) {
      const audienceLower = targetAudience.toLowerCase();
      if (audienceLower.includes('20대') || audienceLower.includes('young') || audienceLower.includes('젊')) {
        audienceStyle = 'trendy, vibrant, youthful energy';
      } else if (audienceLower.includes('30대') || audienceLower.includes('40대') || audienceLower.includes('mature')) {
        audienceStyle = 'sophisticated, elegant, refined luxury';
      } else if (audienceLower.includes('남성') || audienceLower.includes('men') || audienceLower.includes('male')) {
        audienceStyle = 'masculine, bold, minimalist strength';
      } else if (audienceLower.includes('민감') || audienceLower.includes('sensitive')) {
        audienceStyle = 'gentle, calming, pure and clean';
      }
    }

    // 4. 핵심 특징 반영
    const featureHighlight = keyFeatures && keyFeatures.length > 0
      ? `Emphasize: ${keyFeatures[0]}`
      : 'Highlight product quality';

    mainPrompt = `Create a KOREAN E-COMMERCE DETAIL PAGE THUMBNAIL for "${productName}".

USE THE PROVIDED PRODUCT IMAGE as reference - include this exact product in the new composition.

[KOREAN DETAIL PAGE STYLE - 올리브영/쿠팡 스타일]
- Premium beauty product thumbnail style (한국 뷰티 상세페이지)
- Clean, bright, aspirational aesthetic that Korean consumers love
- Magazine editorial meets e-commerce quality
- Soft gradient background complementing product colors

[CREATIVE COMPOSITION]
Design a visually striking thumbnail featuring the provided product.
- Product as HERO (50-60% of frame), sharp focus, eye-catching
- Product placement: CENTER or slightly UPPER-CENTER
- Decorative objects (15-20%): ${ingredientObjects.join(', ')}
- Atmospheric elements (10-15%): ${moodSelection.selected.join(', ')}
- Create depth with layered composition (foreground → product → background)
- Leave CLEAN SPACE at top (20%) for text overlay (slogan area)

[STYLING DIRECTION]
Target aesthetic: ${audienceStyle}
${featureHighlight}
Korean beauty trend: 글로우, 투명감, 프리미엄

[TECHNICAL REQUIREMENTS]
- Soft, diffused studio lighting with gentle rim light
- Shallow depth of field, soft bokeh background
- Rich, vibrant colors with professional color grading
- Premium commercial photography that triggers purchase desire
- 8K resolution, photorealistic, no text in image`;
  }

  // 섹션별 스타일 프롬프트 - 시나리오만 설명, 배치는 AI가 자연스럽게 결정
  const sectionPrompts: Record<string, string> = {
    MAIN: mainPrompt,

    HERO: `Create KOREAN E-COMMERCE HERO BANNER IMAGE using the provided product.
[SCENARIO: 상세페이지 최상단 히어로 배너]
- 고객이 처음 보는 강렬한 첫인상 이미지
- 제품이 돋보이면서 브랜드 슬로건이 들어갈 공간 필요
- 프리미엄하고 드라마틱한 분위기
- 올리브영/쿠팡 스타일 hero banner
${keyFeatures ? `Emphasize: ${keyFeatures[0]}` : ''}
8K, photorealistic, no text.`,

    FEATURES: `Create KOREAN E-COMMERCE FEATURES SECTION IMAGE using the provided product.
[SCENARIO: 제품 특징 소개 섹션]
- 제품의 장점과 특징을 설명하는 섹션용 이미지
- 제품 디테일이 잘 보이도록 각도 조절
- 특징 아이콘이나 설명이 들어갈 여백 고려
- 클린하고 정보전달에 효과적인 구성
${keyFeatures ? `Features: ${keyFeatures.slice(0, 2).join(', ')}` : ''}
8K, photorealistic, no text.`,

    SOCIAL_PROOF: `Create KOREAN E-COMMERCE REVIEW/TESTIMONIAL IMAGE using the provided product.
[SCENARIO: 고객 후기/리뷰 섹션]
- 리뷰와 별점이 함께 표시되는 섹션용 이미지
- 제품이 작고 자연스럽게 배치된 라이프스타일 느낌
- 신뢰감을 주는 따뜻한 분위기
- 후기 텍스트가 들어갈 충분한 공간
${targetAudience ? `Target: ${targetAudience}` : ''}
8K, photorealistic, no text.`,

    HOW_TO_USE: `Create KOREAN E-COMMERCE HOW-TO-USE IMAGE using the provided product.
[SCENARIO: 사용법 안내 섹션]
- 제품 사용 방법을 단계별로 설명하는 섹션용 이미지
- 제품을 손에 들거나 사용하는 맥락 표현
- 단계별 설명(STEP 1, 2, 3)이 들어갈 공간 고려
- 밝고 명확한 튜토리얼 분위기
8K, photorealistic, no text.`,

    FAQ: `Create KOREAN E-COMMERCE FAQ/INFO IMAGE using the provided product.
[SCENARIO: FAQ/추가정보 섹션]
- 자주 묻는 질문과 답변이 표시되는 섹션용 이미지
- 제품이 깔끔하게 보이는 미니멀한 구성
- Q&A 텍스트가 들어갈 충분한 여백
- 정보 전달에 집중하는 심플한 분위기
8K, photorealistic, no text.`,
  };

  // ★★★ 기본 템플릿 + 오케스트레이션 프롬프트 결합 ★★★
  // 1. 기본 템플릿: 카테고리별/섹션별 시각적 지시 (sectionPrompts)
  // 2. 오케스트레이션 프롬프트: 전체 상세페이지 메시지/컨텍스트 (scenarioPrompt)
  // 둘 다 결합하여 일관된 메시지 + 섹션별 스타일 모두 반영

  // 1. 기본 섹션 템플릿 가져오기
  let basePrompt = sectionPrompts[sectionType];

  if (!basePrompt) {
    console.log(`[Gemini I2I] ⚠️ No template for section type: ${sectionType}, using dynamic fallback`);
    // 미정의 섹션 타입에 대해 동적으로 프롬프트 생성 (섹션 타입명 포함)
    const sectionLabel = sectionType.replace(/_/g, ' ').toLowerCase();
    basePrompt = `Create KOREAN E-COMMERCE ${sectionType} IMAGE using the provided product as reference.
[KOREAN DETAIL PAGE - ${sectionType} SECTION ${sectionLabel} 섹션]
- Professional Korean e-commerce aesthetic
- Product-focused composition appropriate for ${sectionLabel}
- Clean, premium background with Korean beauty style
- High-quality commercial photography
Section type: ${sectionType}
Korean beauty detail page style, 올리브영/쿠팡 스타일.
8K, photorealistic, no text in image.`;
  } else {
    console.log(`[Gemini I2I] Using section template for ${sectionType}`);
  }

  // 2. 오케스트레이션 프롬프트 추가 (있으면)
  // 전체 상세페이지의 일관된 메시지와 컨텍스트를 담은 추가 지시
  // ★ MAIN 섹션은 이미 완성형 프롬프트라 오케스트레이션 컨텍스트 제외 (충돌 방지)
  let orchestrationContext = '';
  console.log(`[Gemini I2I] ★★★ scenarioPrompt received: ${scenarioPrompt ? 'YES (' + scenarioPrompt.length + ' chars)' : 'NO/EMPTY'}`);
  if (sectionType !== 'MAIN' && scenarioPrompt && scenarioPrompt.trim()) {
    console.log(`[Gemini I2I] ★ Adding orchestration context for ${sectionType}`);
    console.log(`[Gemini I2I] orchestration preview: ${scenarioPrompt.substring(0, 200)}...`);
    orchestrationContext = `

[ORCHESTRATION CONTEXT - 상세페이지 전체 메시지]
${scenarioPrompt}

[제품 배치 원칙]
- 위 오케스트레이션 컨텍스트의 시나리오에 맞게 제품을 자연스럽게 배치하세요
- 시나리오에 따라 제품이 부각되거나, 자연스럽게 녹아들 수 있습니다
- 항상 가운데에 놓지 말고, 시나리오에 어울리는 위치에 배치하세요`;
  } else {
    console.log(`[Gemini I2I] ★★★ orchestrationContext NOT added. Reason: sectionType=${sectionType}, scenarioPrompt=${scenarioPrompt ? 'exists' : 'empty'}`);
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

  const fullPrompt = `${basePrompt}${orchestrationContext}

Product: ${productName}
Category: ${category}
${additionalPrompt ? `Additional style: ${additionalPrompt}` : ''}

OUTPUT: High-quality commercial photography, 8K resolution, no text on image.`;

  console.log(`[Gemini I2I] Generating ${sectionType} section image`);
  if (sectionType === 'MAIN') {
    console.log(`[Gemini I2I] MAIN with custom objects - keyFeatures: ${keyFeatures?.join(', ')}, target: ${targetAudience}`);
  }

  // MAIN 섹션만 1:1 정사각형, 나머지는 비율 지정 안함 (자유 비율)
  // ★ preserveStrength 0.75: 제품 형태를 최대한 유지하면서 배경/스타일만 변경
  const images = await generateImageFromImage({
    sourceImage,
    prompt: fullPrompt,
    model,
    preserveStrength: 0.75, // ★ 0.4 → 0.75: 제품 일관성 강화
    ...(sectionType === 'MAIN' && { aspectRatio: '1:1' as const }),
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType} section`);
  }

  // 최종 사용된 프롬프트를 revisedPrompt로 반환 + 개별 프롬프트 구성요소 포함
  return {
    ...images[0],
    revisedPrompt: fullPrompt,
    // ★ 개발자 모드용: 개별 프롬프트 구성요소 (UI에서 분리 표시)
    promptComponents: {
      ...images[0].promptComponents,
      orchestrationPrompt: scenarioPrompt || undefined,       // 오케스트레이션 AI 생성 시나리오
      categoryTemplatePrompt: basePrompt,                     // 섹션별 카테고리 템플릿
      // ★★★ 고정/동적 프롬프트 분리 (NEW!)
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

  // ★★★ 섹션 타입 매핑 (다양한 섹션명을 기본 타입으로 변환)
  const mapSectionType = (type: string): 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' => {
    const upperType = type.toUpperCase();
    // REVIEW, SOCIAL, TESTIMONIAL 관련 → SOCIAL_PROOF
    if (/REVIEW|SOCIAL|TESTIMONIAL|PROOF|SHOWCASE/.test(upperType)) {
      return 'SOCIAL_PROOF';
    }
    // HOW_TO, USAGE, STEP 관련 → HOW_TO_USE
    if (/HOW_TO|USAGE|STEP|GUIDE/.test(upperType)) {
      return 'HOW_TO_USE';
    }
    // FEATURE, BENEFIT, INGREDIENT 관련 → FEATURES
    if (/FEATURE|BENEFIT|INGREDIENT|SPEC/.test(upperType)) {
      return 'FEATURES';
    }
    // HERO, BANNER 관련 → HERO
    if (/HERO|BANNER/.test(upperType)) {
      return 'HERO';
    }
    // FAQ 관련
    if (/FAQ|QUESTION/.test(upperType)) {
      return 'FAQ';
    }
    // MAIN 관련
    if (/MAIN|THUMBNAIL/.test(upperType)) {
      return 'MAIN';
    }
    // 기본값: 첫 단어로 매핑 시도
    const firstWord = upperType.split('_')[0];
    if (['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'].includes(firstWord)) {
      return firstWord as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
    }
    return 'FEATURES'; // 기본값
  };

  // ★ 텍스트 배경 섹션은 'FEATURES'를 기본값으로 사용 (자유 비율)
  const normalizedSectionType = isTextBackgroundSection
    ? 'FEATURES' as const
    : mapSectionType(sectionType);

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
    let t2iPrompt: string;
    if (isTextBackgroundSection) {
      // ★★★ orchestration-service.ts와 동일한 로직 사용 ★★★
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

      // ★★★ 텍스트 배경 섹션은 imagePrompt/scenarioPrompt를 무시하고 컬러 프롬프트만 사용
      // (scenarioPrompt에 제품 관련 내용이 포함되어 제품이 나오는 문제 방지)
      t2iPrompt = `${colorPrompt}, absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only --negative ${negativePrompt}`;
      console.log(`[Image+Overlay] ★ Text background section ${sectionType}: Using ${blockVariant} color prompt (no product)`);
    } else {
      t2iPrompt = imagePrompt || scenarioPrompt || `${productName} ${category} product image`;
    }

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

  // 2. 오버레이 텍스트 생성 (★ 이미지 컨텍스트 전달하여 어울리는 텍스트 생성)
  const overlayResult = await generateOverlayTextForSection(
    sectionType,
    productName,
    category,
    keyFeatures,
    targetAudience,
    {
      blockIndex,
      totalBlocks,
      variationHint,
    },
    usedImagePrompt  // ★ 이미지 생성에 사용된 프롬프트 전달
  );

  console.log(`[Image+Overlay] ${sectionType} image and overlay text generated successfully`);

  return {
    image: generatedImage,
    overlayText: overlayResult.overlayText,
    overlayPrompt: overlayResult.prompt,
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
  imageScenarioPrompt?: string  // ★ 이미지 생성에 사용된 시나리오 프롬프트
): Promise<{ overlayText: OverlayTextContent; prompt: string }> {
  const gemini = getGeminiClient();

  // ★★★ 텍스트 배경 섹션 감지 (임팩트 있는 타이포그래피 적용)
  const isTextBackgroundSection = /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);

  // ★★★ 섹션 타입 매핑 (다양한 섹션명을 기본 타입으로 변환)
  const mapSectionType = (type: string): 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' => {
    const upperType = type.toUpperCase();
    if (/REVIEW|SOCIAL|TESTIMONIAL|PROOF|SHOWCASE/.test(upperType)) return 'SOCIAL_PROOF';
    if (/HOW_TO|USAGE|STEP|GUIDE/.test(upperType)) return 'HOW_TO_USE';
    if (/FEATURE|BENEFIT|INGREDIENT|SPEC/.test(upperType)) return 'FEATURES';
    if (/HERO|BANNER/.test(upperType)) return 'HERO';
    if (/FAQ|QUESTION/.test(upperType)) return 'FAQ';
    if (/MAIN|THUMBNAIL/.test(upperType)) return 'MAIN';
    const firstWord = upperType.split('_')[0];
    if (['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'].includes(firstWord)) {
      return firstWord as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
    }
    return 'FEATURES';
  };

  // 섹션 타입 정규화
  const normalizedSection = mapSectionType(sectionType);

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
  const layout = isTextBackgroundSection
    ? textBannerLayout
    : (sectionLayouts[normalizedSection] || sectionLayouts.FEATURES);

  // 블록별 컨텍스트
  const blockContext = blockOptions?.variationHint
    ? `\n블록 특성: ${blockOptions.variationHint} (${(blockOptions.blockIndex || 0) + 1}/${blockOptions.totalBlocks || 1}번째)`
    : '';

  // 카테고리별 감각 키워드
  const categoryKeywords: Record<string, string[]> = {
    skincare: ['촉촉한', '탱글탱글', '윤기', '맑은', '투명한'],
    makeup: ['탱글', '영롱', '글로시', '선명한', '오래가는'],
    suncare: ['가벼운', '산뜻한', '투명한', 'SPF', 'PA'],
    cleansing: ['부드러운', '깨끗한', '촉촉한', '순한'],
  };

  const categoryKey = category.toLowerCase().includes('스킨') || category.toLowerCase().includes('skin') ? 'skincare'
    : category.toLowerCase().includes('메이크') || category.toLowerCase().includes('makeup') ? 'makeup'
    : category.toLowerCase().includes('선') || category.toLowerCase().includes('sun') ? 'suncare'
    : category.toLowerCase().includes('클렌') || category.toLowerCase().includes('cleans') ? 'cleansing'
    : 'skincare';

  const sensoryWords = categoryKeywords[categoryKey]?.join(', ') || '';

  // ★ 이미지 시나리오 컨텍스트 (이미지와 어울리는 텍스트 생성용)
  const imageContext = imageScenarioPrompt
    ? `\n## 이미지 시나리오 (★ 이 이미지에 어울리는 텍스트를 작성하세요!)
${imageScenarioPrompt}`
    : '';

  // ★★★ 텍스트 배경 섹션용 특별 프롬프트 (올리브영 상세페이지 스타일)
  const textBannerPrompt = `당신은 한국 올리브영 상세페이지 전문 디자이너입니다.
순수 색상 배경 위에 올라갈 **임팩트 있는 대형 타이포그래피**를 만들어주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## ★★★ 올리브영 텍스트 배너 스타일 가이드

### 레이아웃 구성 (3단 구조)
1. **상단 (y: 20%)**: 작은 서브텍스트 (브랜드명, 영문 카테고리, 해시태그 등)
   - fontSize: 14-16px, fontWeight: medium, color: #666666

2. **중앙 (y: 45-50%)**: ★ 대형 메인 카피 (핵심 메시지!) ★
   - fontSize: 36-48px (화면의 주인공!)
   - fontWeight: bold 또는 900
   - color: #222222 또는 #333333
   - 예시: "3초 얼굴형 교정카라", "단 3초만에 완성되는", "촉촉함이 다르다"

3. **하단 (y: 70-75%)**: 보조 메시지 또는 해시태그
   - fontSize: 16-20px
   - color: #555555
   - 예시: "넓어 보이는 #이마 라인 축소", "하루종일 유지되는 완벽한 Holding"

### 카피 작성 규칙
- 메인 카피는 **짧고 임팩트 있게** (10-20자)
- 숫자 강조: "3초", "48시간", "92%"
- 해시태그 스타일: #키워드
- 의성어/의태어 활용: "촉촉", "탱글탱글", "쫀쫀"
- 문제→해결 구조: "건조한 피부? → 촉촉함을 되찾다"

${generateFontGuideForAI()}

## 출력 형식 (JSON)
headline = 상단 서브텍스트, subheadline = 메인 대형 카피, body = 하단 보조 메시지

\`\`\`json
{
  "headline": {
    "text": "브랜드명 또는 영문 카테고리 (예: Fix&Fit, Skincare #01)",
    "x": 50,
    "y": 20,
    "fontSize": 14,
    "fontWeight": "500",
    "fontFamily": "Noto Sans KR, sans-serif",
    "color": "#666666",
    "textAlign": "center"
  },
  "subheadline": {
    "text": "★ 대형 메인 카피 (10-20자, 임팩트 있게!)",
    "x": 50,
    "y": 48,
    "fontSize": 42,
    "fontWeight": "800",
    "fontFamily": "Pretendard, sans-serif",
    "color": "#222222",
    "textAlign": "center"
  },
  "body": {
    "text": "보조 메시지 또는 #해시태그 스타일",
    "x": 50,
    "y": 72,
    "fontSize": 18,
    "fontWeight": "500",
    "fontFamily": "Noto Sans KR, sans-serif",
    "color": "#555555",
    "textAlign": "center"
  },
  "statistics": null,
  "cta": null
}
\`\`\`

★ 중요: 메인 카피(subheadline)가 가장 크고 눈에 띄어야 합니다! JSON만 출력하세요.`;

  // 일반 섹션용 프롬프트
  const normalPrompt = `당신은 한국 상세페이지 디자인 전문가입니다.
이미지 위에 배치할 오버레이 텍스트를 **자유롭게** 디자인하세요.
★★★ 디자인 완성도가 높은 상세페이지처럼 보이도록 텍스트를 배치하세요! ★★★

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}
${blockContext}
${imageContext}

## 섹션 목적: ${normalizedSection}
${normalizedSection === 'MAIN' ? '메인 썸네일 - 브랜드명과 슬로건으로 시선 끌기' : ''}
${normalizedSection === 'HERO' ? '히어로 - 고객 고민 공감 → 해결책 제시' : ''}
${normalizedSection === 'FEATURES' ? '특징 - 제품 특징/성분 강조' : ''}
${normalizedSection === 'SOCIAL_PROOF' ? '신뢰 - 통계 수치, 수상 이력' : ''}
${normalizedSection === 'HOW_TO_USE' ? '사용법 - STEP별 안내' : ''}
${normalizedSection === 'FAQ' ? 'FAQ - 질문과 답변' : ''}

## 참고 키워드
${sensoryWords}

## ★★★ 디자인 원칙 (필수!)
1. **텍스트 개수**: 1~4개 자유롭게 (꼭 다 채울 필요 없음!)
2. **계층 구조**: 큰 텍스트(메인) + 작은 텍스트(서브) 조합
3. **여백 활용**: 이미지가 숨 쉴 공간 확보
4. **시선 유도**: 중요한 메시지는 크고 눈에 띄게
5. **색상 대비**: 배경과 확실히 구분되는 색상

## 위치 가이드
- x: 0=왼쪽, 50=중앙, 100=오른쪽
- y: 0=상단, 50=중앙, 100=하단
- textAlign: left(왼쪽정렬), center(중앙정렬), right(오른쪽정렬)

## 색상 팔레트
- 밝은 배경: #1a1a1a, #222222, #333333
- 어두운 배경: #ffffff, #f5f5f5, #eeeeee
- 포인트: #e8b4b8(핑크), #4a90d9(블루), #5cb85c(그린)

${generateFontGuideForAI()}

## ★ 출력 형식 (texts 배열)
텍스트 개수와 내용을 **자유롭게** 결정하세요. 1~4개 권장.

\`\`\`json
{
  "texts": [
    {
      "text": "메인 카피 (가장 크고 눈에 띄게)",
      "x": 50,
      "y": 40,
      "fontSize": 36,
      "fontWeight": "bold",
      "fontFamily": "검은고딕, sans-serif",
      "color": "#ffffff",
      "textAlign": "center",
      "width": null
    },
    {
      "text": "서브 카피 (보조 설명)",
      "x": 50,
      "y": 60,
      "fontSize": 16,
      "fontWeight": "normal",
      "fontFamily": "Pretendard, sans-serif",
      "color": "#eeeeee",
      "textAlign": "center",
      "width": null
    }
  ]
}
\`\`\`

★ 중요:
- JSON만 출력 (설명 없이!)
- texts 배열에 1~4개 텍스트 자유롭게
- 디자인 완성도가 높아 보이도록!
- 줄바꿈 필요시 \\n 사용`;

  // ★ 텍스트 배경 섹션이면 특별 프롬프트, 아니면 일반 프롬프트
  const prompt = isTextBackgroundSection ? textBannerPrompt : normalPrompt;

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
 * 기본 오버레이 텍스트 생성 (폴백용)
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
    HERO: 'HERO',
    FEATURES: 'FEATURES',
    SOCIAL_PROOF: 'REVIEWS',
    HOW_TO_USE: 'HOW TO USE',
    FAQ: 'FAQ',
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
