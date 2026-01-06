import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getComfyUIService, ModelType } from '@/lib/services/comfyui';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

type ImageGenerator = 'gemini' | 'imagen' | 'sd35-medium' | 'sdxl-base' | 'auto';

// 스타일별 프롬프트 보강
const stylePrompts: Record<string, string> = {
  'product': 'professional product photography, clean white background, studio lighting, high quality, commercial style',
  'lifestyle': 'lifestyle photography, natural lighting, warm tones, authentic, candid moment',
  'minimal': 'minimalist design, clean, simple, modern, white space, elegant',
  'vibrant': 'vibrant colors, bold, energetic, dynamic, eye-catching',
  'luxury': 'luxury style, premium, elegant, sophisticated, high-end, refined',
  'natural': 'natural, organic, earthy tones, sustainable, eco-friendly aesthetic',
  'cosmetic': 'luxury cosmetic product photography, soft gradient background, sparkling bokeh, floating 3D effect, commercial beauty advertisement',
};

// ComfyUI (SD 3.5 / Flux)로 이미지 생성
async function generateWithComfyUI(
  prompt: string,
  model: ModelType,
  width: number = 1024,
  height: number = 1024
) {
  const comfyui = getComfyUIService();

  const isAvailable = await comfyui.isAvailable();
  if (!isAvailable) {
    throw new Error('ComfyUI 서버가 실행 중이지 않습니다. ComfyUI를 먼저 시작해주세요.');
  }

  // SDXL은 적은 steps, SD 3.5는 더 많은 steps
  const steps = model === 'sdxl-base' ? 25 : 20;
  const cfg = model === 'sdxl-base' ? 7 : 4.5;

  const result = await comfyui.generate({
    prompt,
    negativePrompt: 'ugly, blurry, low quality, distorted, deformed',
    width,
    height,
    steps,
    cfg,
    model,
  });

  if (!result.success) {
    throw new Error(result.error || '이미지 생성 실패');
  }

  return {
    imageUrl: result.imageUrl,
    generator: model,
    executionTime: result.executionTime,
  };
}

// Gemini 2.0 Flash로 이미지 생성
async function generateImageWithGemini2(prompt: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini 2.0 API 오류: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Imagen 3 API 호출
async function generateImageWithImagen(prompt: string, aspectRatio: string = '1:1') {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        safetyFilterLevel: 'block_few',
        personGeneration: 'allow_adult',
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen API 오류: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 프롬프트 보강 (Gemini 사용)
async function enhancePrompt(prompt: string): Promise<string> {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return prompt; // API 키 없으면 원본 반환
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(`
      You are an expert at creating image generation prompts.
      Convert this request into a detailed English prompt for high-quality image generation.
      Only output the prompt, no explanations.
      Keep it under 200 characters.

      Request: ${prompt}
    `);
    return result.response.text().trim();
  } catch {
    return prompt; // 실패시 원본 반환
  }
}

// aspectRatio를 width/height로 변환
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '4:5': { width: 896, height: 1120 }, // 모바일 썸네일 최적화
  };
  return ratioMap[aspectRatio] || { width: 1024, height: 1024 };
}

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      style,
      aspectRatio = '1:1',
      generator = 'auto' as ImageGenerator,
      enhanceWithAI = true,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 스타일에 따른 프롬프트 보강
    let enhancedPrompt = prompt;
    if (style && stylePrompts[style]) {
      enhancedPrompt = `${prompt}, ${stylePrompts[style]}`;
    }

    // AI로 프롬프트 보강 (선택적)
    if (enhanceWithAI) {
      enhancedPrompt = await enhancePrompt(enhancedPrompt);
    }

    const { width, height } = getImageDimensions(aspectRatio);

    // Generator 선택 로직
    let selectedGenerator: ImageGenerator = generator;

    if (generator === 'auto') {
      // auto: ComfyUI 사용 가능하면 SDXL, 아니면 Gemini
      const comfyui = getComfyUIService();
      const comfyAvailable = await comfyui.isAvailable();
      selectedGenerator = comfyAvailable ? 'sdxl-base' : 'gemini';
    }

    // SD 3.5 또는 SDXL로 생성
    if (selectedGenerator === 'sd35-medium' || selectedGenerator === 'sdxl-base') {
      try {
        const result = await generateWithComfyUI(
          enhancedPrompt,
          selectedGenerator as ModelType,
          width,
          height
        );

        return NextResponse.json({
          success: true,
          data: {
            originalPrompt: prompt,
            enhancedPrompt,
            style,
            aspectRatio,
            imageUrl: result.imageUrl,
            mimeType: 'image/png',
            generator: result.generator,
            executionTime: result.executionTime,
          }
        });
      } catch (comfyError) {
        console.error('ComfyUI error:', comfyError);

        // ComfyUI 실패시 Gemini로 폴백 (auto 모드일 때만)
        if (generator === 'auto') {
          console.log('Falling back to Gemini...');
          selectedGenerator = 'gemini';
        } else {
          throw comfyError;
        }
      }
    }

    // Gemini로 생성
    if (selectedGenerator === 'gemini') {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json(
          { error: 'Google AI API 키가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }

      try {
        const geminiResult = await generateImageWithGemini2(enhancedPrompt);
        const candidates = geminiResult.candidates || [];

        if (candidates.length > 0) {
          const parts = candidates[0].content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              const base64Image = part.inlineData.data;
              const mimeType = part.inlineData.mimeType;

              return NextResponse.json({
                success: true,
                data: {
                  originalPrompt: prompt,
                  enhancedPrompt,
                  style,
                  aspectRatio,
                  imageUrl: `data:${mimeType};base64,${base64Image}`,
                  mimeType,
                  generator: 'gemini-2.0-flash',
                }
              });
            }
          }
        }

        // Gemini가 이미지를 반환하지 않으면 Imagen으로 폴백
        selectedGenerator = 'imagen';
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
        selectedGenerator = 'imagen';
      }
    }

    // Imagen으로 생성
    if (selectedGenerator === 'imagen') {
      try {
        const imagenResult = await generateImageWithImagen(enhancedPrompt, aspectRatio);
        const predictions = imagenResult.predictions || [];

        if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
          return NextResponse.json({
            success: true,
            data: {
              originalPrompt: prompt,
              enhancedPrompt,
              style,
              aspectRatio,
              imageUrl: `data:image/png;base64,${predictions[0].bytesBase64Encoded}`,
              mimeType: predictions[0].mimeType || 'image/png',
              generator: 'imagen-3',
            }
          });
        }
      } catch (imagenError) {
        console.error('Imagen error:', imagenError);
      }
    }

    // 모든 방법 실패
    return NextResponse.json({
      success: false,
      message: '이미지 생성에 실패했습니다.',
      data: {
        originalPrompt: prompt,
        enhancedPrompt,
        style,
        aspectRatio,
        imageUrl: null,
      },
      error: 'All image generation methods failed',
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: '이미지 생성 중 오류가 발생했습니다.', details: String(error) },
      { status: 500 }
    );
  }
}

// 서버 상태 확인
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    // TODO: 작업 상태 조회
    return NextResponse.json({
      jobId,
      status: 'pending',
      message: '이미지 생성 중입니다.',
    });
  }

  // 사용 가능한 생성기 확인
  const comfyui = getComfyUIService();
  const comfyAvailable = await comfyui.isAvailable();
  const geminiAvailable = !!process.env.GOOGLE_AI_API_KEY;

  return NextResponse.json({
    generators: {
      'sdxl-base': comfyAvailable,
      'sd35-medium': comfyAvailable,
      'gemini': geminiAvailable,
      'imagen': geminiAvailable,
    },
    recommended: comfyAvailable ? 'sdxl-base' : (geminiAvailable ? 'gemini' : null),
  });
}
