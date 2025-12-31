import OpenAI from 'openai';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

export type ImageQuality = 'draft' | 'hd';
export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
export type ImageStyle = 'vivid' | 'natural';

export interface GenerateImageOptions {
  prompt: string;
  quality?: ImageQuality;
  size?: ImageSize;
  style?: ImageStyle;
  n?: number;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

// Map quality to DALL-E parameters
const qualityMap: Record<ImageQuality, 'standard' | 'hd'> = {
  draft: 'standard',
  hd: 'hd',
};

/**
 * Generate images using DALL-E 3
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const {
    prompt,
    quality = 'draft',
    size = '1024x1024',
    style = 'vivid',
    n = 1,
  } = options;

  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI client not available. OPENAI_API_KEY is not set.');
  }

  // DALL-E 3 only supports n=1, so we need multiple calls for multiple images
  const results: GeneratedImage[] = [];

  for (let i = 0; i < n; i++) {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: qualityMap[quality],
      style,
      response_format: 'url',
    });

    if (response.data?.[0]) {
      results.push({
        url: response.data[0].url!,
        revisedPrompt: response.data[0].revised_prompt,
      });
    }
  }

  return results;
}

/**
 * Generate product hero image
 */
export async function generateProductHeroImage(
  productName: string,
  category: string,
  brandStyle?: string,
  quality: ImageQuality = 'draft'
): Promise<GeneratedImage> {
  const prompt = buildProductHeroPrompt(productName, category, brandStyle);

  const images = await generateImage({
    prompt,
    quality,
    size: '1792x1024', // Wide format for hero images
    style: 'vivid',
  });

  return images[0];
}

/**
 * Generate product feature image
 */
export async function generateProductFeatureImage(
  productName: string,
  feature: string,
  quality: ImageQuality = 'draft'
): Promise<GeneratedImage> {
  const prompt = `Professional product photography showcasing ${productName}'s ${feature}.
Clean white background, studio lighting, high-end commercial photography style.
Focus on the feature detail, minimalist composition.`;

  const images = await generateImage({
    prompt,
    quality,
    size: '1024x1024',
    style: 'natural',
  });

  return images[0];
}

/**
 * Generate lifestyle/context image
 */
export async function generateLifestyleImage(
  productName: string,
  targetAudience: string,
  scenario: string,
  quality: ImageQuality = 'draft'
): Promise<GeneratedImage> {
  const prompt = `Lifestyle photography of ${productName} being used by ${targetAudience} in ${scenario}.
Natural lighting, authentic moment, aspirational but relatable.
High-quality commercial lifestyle photography.`;

  const images = await generateImage({
    prompt,
    quality,
    size: '1792x1024',
    style: 'natural',
  });

  return images[0];
}

/**
 * Generate banner image for promotions
 */
export async function generateBannerImage(
  headline: string,
  theme: string,
  quality: ImageQuality = 'draft'
): Promise<GeneratedImage> {
  const prompt = `Marketing banner background for "${headline}".
Theme: ${theme}. Abstract, modern design with smooth gradients.
Leave space for text overlay. Commercial banner art style.`;

  const images = await generateImage({
    prompt,
    quality,
    size: '1792x1024',
    style: 'vivid',
  });

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
Premium, high-end commercial photography style.`;

  if (brandStyle) {
    return `${basePrompt}
Brand aesthetic: ${brandStyle}.
Maintain brand consistency in color palette and mood.`;
  }

  return `${basePrompt}
Modern, clean aesthetic with soft shadows and reflections.`;
}

/**
 * Estimate generation time based on quality
 */
export function estimateGenerationTime(quality: ImageQuality, count: number): number {
  // Approximate times in seconds
  const timePerImage = quality === 'hd' ? 20 : 10;
  return timePerImage * count;
}

/**
 * Get recommended image settings for different use cases
 */
export function getRecommendedSettings(useCase: 'hero' | 'feature' | 'lifestyle' | 'banner'): {
  size: ImageSize;
  style: ImageStyle;
} {
  switch (useCase) {
    case 'hero':
      return { size: '1792x1024', style: 'vivid' };
    case 'feature':
      return { size: '1024x1024', style: 'natural' };
    case 'lifestyle':
      return { size: '1792x1024', style: 'natural' };
    case 'banner':
      return { size: '1792x1024', style: 'vivid' };
    default:
      return { size: '1024x1024', style: 'vivid' };
  }
}
