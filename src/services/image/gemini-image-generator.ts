import { GoogleGenAI } from '@google/genai';

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

    // Generate images using Gemini with correct responseModalities format
    const response = await client.models.generateContent({
      model: model,
      contents: enhancedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
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

  return images[0];
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
    // base64 데이터 추출
    const { base64, mimeType } = extractBase64FromDataUrl(sourceImage);

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

    const result = await removeBackground({
      sourceImage,
      model,
      transparent: true,
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
 * URL 또는 data URL에서 base64 데이터 추출
 */
function extractBase64FromDataUrl(dataUrl: string): { base64: string; mimeType: string } {
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
    // base64 데이터 추출
    const { base64, mimeType } = extractBase64FromDataUrl(sourceImage);

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

    // 제품 참조 + 창의적 구성 프롬프트 결합
    const enhancedPrompt = `[PRODUCT REFERENCE]
Use the provided product image as a reference for product identity (brand, colors, general form).
You may reposition, resize, or angle the product creatively to create an appealing composition.
${aspectRatioSection}
[CREATIVE DIRECTION]
${prompt}

[OUTPUT REQUIREMENTS]
- Feature the same product but in a NEW creative composition
- Apply dynamic positioning, interesting angles, and professional styling
- High-quality commercial photography output
- No text or watermarks on the image`;

    // Gemini에 이미지 + 텍스트 프롬프트 동시 전송
    console.log(`[Gemini I2I] Sending request to ${model}...`);
    console.log(`[Gemini I2I] Image size (base64 length): ${base64.length}`);

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
              text: enhancedPrompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
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
 */
export async function generateSectionImageFromProduct(
  sourceImage: string,
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  additionalPrompt?: string,
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL,  // gemini-2.5-flash-image
  keyFeatures?: string[],
  targetAudience?: string
): Promise<GeminiGeneratedImage> {
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

    mainPrompt = `Create a premium e-commerce thumbnail for "${productName}".

USE THE PROVIDED PRODUCT IMAGE as reference - include this exact product in the new composition.

[VISUAL STYLE]
High-end beauty campaign aesthetic, editorial magazine quality, aspirational luxury feel.
Clean minimalist background with soft gradient that complements the product colors.

[CREATIVE COMPOSITION]
Design a fresh, visually striking thumbnail featuring the provided product.
- Product as the hero (40-50% of frame), can be angled or styled creatively
- Arrange with decorative objects: ${ingredientObjects.join(', ')}
- Add atmospheric elements: ${moodSelection.selected.join(', ')}
- Create depth with layered composition (foreground, product, background)

[STYLING DIRECTION]
Target aesthetic: ${audienceStyle}
${featureHighlight}

[TECHNICAL REQUIREMENTS]
- Soft, diffused lighting with gentle highlights and shadows
- Shallow depth of field with bokeh background
- Rich, vibrant colors with professional color grading
- Premium commercial photography that triggers desire to purchase
- Fresh, modern e-commerce thumbnail style`;
  }

  // 섹션별 스타일 프롬프트 - 제품 이미지를 참조하여 각각 다른 구성 생성
  // 각 섹션마다 다른 앵글, 위치, 크기를 명시적으로 지정
  const sectionPrompts: Record<string, string> = {
    MAIN: mainPrompt,

    HERO: `Create a dramatic hero shot using the provided product as reference.
[UNIQUE COMPOSITION - HERO STYLE]
- Product placement: UPPER CENTER of frame (30-40% from top)
- Product size: LARGE, commanding presence (55-65% of frame)
- Angle: FRONT-FACING with subtle 10-degree tilt
- Background: Dramatic gradient from dark top to light bottom
- Lighting: Strong rim lighting from behind, soft fill from front
- Add elegant bokeh lights in background for depth
Luxury beauty brand aesthetic.${keyFeatures ? ` Emphasize: ${keyFeatures[0]}` : ''}`,

    FEATURES: `Create a feature highlight image using the provided product as reference.
[UNIQUE COMPOSITION - FEATURES STYLE]
- Product placement: LEFT SIDE of frame (positioned at 25-35% from left)
- Product size: MEDIUM (35-45% of frame), leaving space for feature visualization
- Angle: 45-DEGREE ANGLE showing product details
- Background: Clean white/cream gradient
- Add floating ingredient particles or icons on the RIGHT side
- Show product texture/quality details clearly
Modern, clean aesthetic.${keyFeatures ? ` Feature focus: ${keyFeatures.slice(0, 2).join(', ')}` : ''}`,

    SOCIAL_PROOF: `Create a testimonial/review style image using the provided product as reference.
[UNIQUE COMPOSITION - SOCIAL PROOF STYLE]
- Product placement: BOTTOM RIGHT corner (positioned at 65-75% from left, 60-70% from top)
- Product size: SMALLER, humble presence (25-35% of frame)
- Angle: SLIGHT TOP-DOWN view (15-20 degrees)
- Background: Warm, inviting neutral tones with soft vignette
- Large empty space in upper-left for quote/testimonial overlay
- Soft, natural lighting that feels authentic
Professional, trustworthy aesthetic.${targetAudience ? ` Target: ${targetAudience}` : ''}`,

    HOW_TO_USE: `Create a how-to-use tutorial image using the provided product as reference.
[UNIQUE COMPOSITION - HOW TO USE STYLE]
- Product placement: CENTER-RIGHT (positioned at 55-65% from left)
- Product size: MEDIUM-LARGE (40-50% of frame)
- Angle: SIDE PROFILE view showing application angle
- Background: Bright, clean white with subtle shadows
- Show hands or application context nearby (suggested, not holding product)
- Bright, clinical yet friendly lighting
Clean instructional composition.`,

    FAQ: `Create a product information image using the provided product as reference.
[UNIQUE COMPOSITION - FAQ STYLE]
- Product placement: LOWER CENTER (positioned at 50% from left, 55-65% from top)
- Product size: MEDIUM (35-45% of frame)
- Angle: STRAIGHT-ON front view for clear identification
- Background: Simple gradient with space for Q&A text at top
- Professional, informative studio lighting
- Clean, minimal styling with no distracting elements
Professional showcase style.`,
  };

  const basePrompt = sectionPrompts[sectionType] || sectionPrompts['HERO'];
  const fullPrompt = `${basePrompt}

Product: ${productName}
Category: ${category}
${additionalPrompt ? `Additional style: ${additionalPrompt}` : ''}

OUTPUT: High-quality commercial photography, 8K resolution, no text on image.`;

  console.log(`[Gemini I2I] Generating ${sectionType} section image`);
  if (sectionType === 'MAIN') {
    console.log(`[Gemini I2I] MAIN with custom objects - keyFeatures: ${keyFeatures?.join(', ')}, target: ${targetAudience}`);
  }

  // MAIN 섹션만 1:1 정사각형, 나머지는 비율 지정 안함 (자유 비율)
  const images = await generateImageFromImage({
    sourceImage,
    prompt: fullPrompt,
    model,
    preserveStrength: 0.4, // 제품 이미지를 참조하되 새로운 구성으로 생성
    ...(sectionType === 'MAIN' && { aspectRatio: '1:1' as const }),
  });

  if (images.length === 0) {
    throw new Error(`No image generated for ${sectionType} section`);
  }

  return images[0];
}

/**
 * 제품 이미지 기반 전체 상세페이지 이미지 세트 생성
 */
export async function generateDetailPageImagesFromProduct(
  sourceImage: string,
  productName: string,
  category: string,
  sections: Array<'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ'>,
  brandStyle?: string,
  model: GeminiImageModel = DEFAULT_IMAGE_MODEL  // gemini-2.5-flash-image
): Promise<Map<string, GeminiGeneratedImage>> {
  const results = new Map<string, GeminiGeneratedImage>();

  console.log(`[Gemini I2I] Generating ${sections.length} section images from product image`);

  for (const sectionType of sections) {
    try {
      console.log(`[Gemini I2I] Generating ${sectionType} section image...`);
      const image = await generateSectionImageFromProduct(
        sourceImage,
        sectionType,
        productName,
        category,
        brandStyle,
        model
      );
      results.set(sectionType, image);
      console.log(`[Gemini I2I] ${sectionType} section image generated successfully`);
    } catch (error) {
      console.error(`[Gemini I2I] Failed to generate ${sectionType} section image:`, error);
      // 실패해도 계속 진행
    }
  }

  console.log(`[Gemini I2I] Generated ${results.size}/${sections.length} section images`);
  return results;
}
