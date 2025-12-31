import { GoogleGenerativeAI } from '@google/generative-ai';

export type ImageStyle = 'product' | 'lifestyle' | 'minimal' | 'vibrant' | 'luxury' | 'natural';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GenerateImageOptions {
  prompt: string;
  style?: ImageStyle;
  aspectRatio?: AspectRatio;
  negativePrompt?: string;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  enhancedPrompt?: string;
  error?: string;
  generator?: 'gemini-2.0-flash' | 'imagen-3';
}

const stylePrompts: Record<ImageStyle, string> = {
  'product': 'professional product photography, clean white background, studio lighting, high quality, commercial style',
  'lifestyle': 'lifestyle photography, natural lighting, warm tones, authentic, candid moment',
  'minimal': 'minimalist design, clean, simple, modern, white space, elegant',
  'vibrant': 'vibrant colors, bold, energetic, dynamic, eye-catching',
  'luxury': 'luxury style, premium, elegant, sophisticated, high-end, refined',
  'natural': 'natural, organic, earthy tones, sustainable, eco-friendly aesthetic',
};

export class ImageGenerationService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Gemini를 사용해 프롬프트를 보강합니다
   */
  async enhancePrompt(prompt: string, style?: ImageStyle): Promise<string> {
    let enhancedPrompt = prompt;

    if (style && stylePrompts[style]) {
      enhancedPrompt = `${prompt}, ${stylePrompts[style]}`;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(`
        You are an expert at creating image generation prompts.
        Convert this request into a detailed English prompt for high-quality image generation.
        Only output the prompt, no explanations. Keep it under 200 characters.

        Request: ${enhancedPrompt}
      `);

      return result.response.text().trim();
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      return enhancedPrompt;
    }
  }

  /**
   * Gemini 2.0 Flash로 이미지를 생성합니다 (네이티브 이미지 생성)
   */
  async generateWithGemini2(prompt: string): Promise<GenerateImageResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}`
            }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini 2.0 API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const candidates = result.candidates || [];

      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];

        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            return {
              success: true,
              imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              enhancedPrompt: prompt,
              generator: 'gemini-2.0-flash',
            };
          }
        }
      }

      throw new Error('No image generated');
    } catch (error) {
      return {
        success: false,
        error: String(error),
        enhancedPrompt: prompt,
      };
    }
  }

  /**
   * Imagen 3 API로 이미지를 생성합니다
   */
  async generateWithImagen(prompt: string, aspectRatio: AspectRatio = '1:1'): Promise<GenerateImageResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            safetyFilterLevel: 'block_few',
            personGeneration: 'allow_adult',
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const predictions = result.predictions || [];

      if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        return {
          success: true,
          imageUrl: `data:image/png;base64,${predictions[0].bytesBase64Encoded}`,
          enhancedPrompt: prompt,
        };
      }

      throw new Error('No image generated');
    } catch (error) {
      return {
        success: false,
        error: String(error),
        enhancedPrompt: prompt,
      };
    }
  }

  /**
   * 이미지 생성 메인 함수
   * Gemini 2.0 Flash를 먼저 시도하고, 실패시 Imagen 3으로 폴백
   */
  async generate(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const { prompt, style, aspectRatio = '1:1' } = options;

    // 프롬프트 보강
    const enhancedPrompt = await this.enhancePrompt(prompt, style);

    // 1차: Gemini 2.0 Flash로 시도
    const geminiResult = await this.generateWithGemini2(enhancedPrompt);
    if (geminiResult.success) {
      return {
        ...geminiResult,
        enhancedPrompt,
      };
    }

    // 2차: Imagen 3으로 폴백
    const imagenResult = await this.generateWithImagen(enhancedPrompt, aspectRatio);

    return {
      ...imagenResult,
      enhancedPrompt,
    };
  }
}

// 싱글톤 인스턴스
let imageService: ImageGenerationService | null = null;

export function getImageGenerationService(): ImageGenerationService {
  if (!imageService) {
    imageService = new ImageGenerationService();
  }
  return imageService;
}
