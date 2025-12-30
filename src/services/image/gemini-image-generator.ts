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
export type GeminiImageModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';
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
  } = options;

  const client = getGeminiClient();
  const results: GeminiGeneratedImage[] = [];

  try {
    console.log(`[Gemini] Generating image with model: ${model}`);
    console.log(`[Gemini] Prompt: ${prompt.substring(0, 100)}...`);

    // Generate images using Gemini with correct responseModalities format
    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
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
    model = 'gemini-2.0-flash-exp',
    preserveStrength = 0.85,
  } = options;

  const client = getGeminiClient();
  const results: GeminiGeneratedImage[] = [];

  try {
    // base64 데이터 추출
    const { base64, mimeType } = extractBase64FromDataUrl(sourceImage);

    console.log(`[Gemini I2I] Starting image-to-image generation`);
    console.log(`[Gemini I2I] Model: ${model}, Preserve: ${preserveStrength}`);
    console.log(`[Gemini I2I] Prompt: ${prompt.substring(0, 150)}...`);

    // 제품 유지 + 기존 프롬프트 결합
    const enhancedPrompt = `[CRITICAL INSTRUCTION]
You MUST use the EXACT product from the input image. The product's shape, color, design, packaging, and all visual details must remain IDENTICAL.
Only change the background, lighting, composition, and styling according to the prompt below.

[STYLE PROMPT]
${prompt}

[OUTPUT REQUIREMENTS]
- Keep the EXACT same product from input image (${preserveStrength * 100}% preservation)
- Apply the styling and composition from the prompt
- High-quality commercial photography output
- No text or watermarks on the image`;

    // Gemini에 이미지 + 텍스트 프롬프트 동시 전송
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

    // 응답에서 이미지 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`[Gemini I2I] Image generated, mimeType: ${part.inlineData.mimeType}`);
          results.push({
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          });
        }
      }
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
 */
export async function generateSectionImageFromProduct(
  sourceImage: string,
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  additionalPrompt?: string,
  model: GeminiImageModel = 'gemini-2.0-flash-exp'
): Promise<GeminiGeneratedImage> {
  // 섹션별 스타일 프롬프트
  const sectionPrompts: Record<string, string> = {
    MAIN: `Create an e-commerce main thumbnail image. Place the EXACT same product from the input image in the center with a colorful gradient background (blue to pink or green to yellow tones). Add celebratory atmosphere with subtle sparkles. Professional Korean beauty e-commerce style. Product must be IDENTICAL to input.`,

    HERO: `Create a premium hero shot. Keep the EXACT same product from input, place it centered on elegant gradient background. Add professional studio lighting with soft rim light and subtle reflection. Luxury beauty brand aesthetic. Product must remain IDENTICAL.`,

    FEATURES: `Create a feature highlight image. The EXACT same product from input shown at slight angle with ingredient visualization nearby. Clean minimalist background with soft gradient. Scientific yet elegant aesthetic. Product must be IDENTICAL to input.`,

    SOCIAL_PROOF: `Create a testimonial/review style image. The EXACT same product from input displayed prominently with clean background suitable for adding review text and statistics overlay. Clinical professional style. Product must remain IDENTICAL.`,

    HOW_TO_USE: `Create a how-to-use tutorial image. Show the EXACT same product from input in a context suggesting application/usage. Clean instructional composition with space for step numbers. Bright even lighting. Product must be IDENTICAL.`,

    FAQ: `Create a product information image. The EXACT same product from input elegantly displayed with clean space for Q&A text overlay. Professional product showcase style. Product must remain IDENTICAL to input.`,
  };

  const basePrompt = sectionPrompts[sectionType] || sectionPrompts['HERO'];
  const fullPrompt = `${basePrompt}

Product: ${productName}
Category: ${category}
${additionalPrompt ? `Additional style: ${additionalPrompt}` : ''}

OUTPUT: High-quality commercial photography, 8K resolution, no text on image.`;

  const images = await generateImageFromImage({
    sourceImage,
    prompt: fullPrompt,
    model,
    preserveStrength: 0.85, // 제품 형태 강하게 유지
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
  model: GeminiImageModel = 'gemini-2.0-flash-exp'
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
