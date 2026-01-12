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

    // ★★★ I2I 모드: 제품 모양 유지 + 자연스러운 재배치 ★★★
    // 제품의 모양/디자인은 절대 변경하지 않고, 위치/각도만 재배치
    // 시나리오에 따라 제품을 사용 안해도 됨

    const enhancedPrompt = `[★★★ IMAGE-TO-IMAGE: PRODUCT REPOSITIONING ★★★]

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
❌ Transform products into something else
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
  let orchestrationContext = '';
  if (scenarioPrompt && scenarioPrompt.trim()) {
    console.log(`[Gemini I2I] ★ Adding orchestration context for ${sectionType}`);
    console.log(`[Gemini I2I] orchestration preview: ${scenarioPrompt.substring(0, 100)}...`);
    orchestrationContext = `

[ORCHESTRATION CONTEXT - 상세페이지 전체 메시지]
${scenarioPrompt}

[제품 배치 원칙]
- 위 오케스트레이션 컨텍스트의 시나리오에 맞게 제품을 자연스럽게 배치하세요
- 시나리오에 따라 제품이 부각되거나, 자연스럽게 녹아들 수 있습니다
- 항상 가운데에 놓지 말고, 시나리오에 어울리는 위치에 배치하세요`;
  }

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

  // 최종 사용된 프롬프트를 revisedPrompt로 반환
  return {
    ...images[0],
    revisedPrompt: fullPrompt,
  };
}

/**
 * 제품 이미지 기반 전체 상세페이지 이미지 세트 생성
 * - 모든 섹션 타입 지원 (기본 섹션 + 뷰티 서브카테고리 섹션 + 미정의 섹션)
 */
export async function generateDetailPageImagesFromProduct(
  sourceImage: string,
  productName: string,
  category: string,
  sections: string[],  // 모든 섹션 타입 허용
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
