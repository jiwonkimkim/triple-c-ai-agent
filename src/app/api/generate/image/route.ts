import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Gemini 2.0 Flash로 이미지 생성 (Experimental - 이미지 생성 지원)
async function generateImageWithGemini2(prompt: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  // Gemini 2.0 Flash Experimental (이미지 생성 지원)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

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
    throw new Error(`Gemini 2.0 API 오류: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Imagen 3 API 호출 (백업용)
async function generateImageWithImagen(prompt: string, aspectRatio: string = '1:1') {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, aspectRatio = '1:1' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 스타일에 따른 프롬프트 보강
    let enhancedPrompt = prompt;
    if (style) {
      const stylePrompts: Record<string, string> = {
        'product': 'professional product photography, clean white background, studio lighting, high quality, commercial style',
        'lifestyle': 'lifestyle photography, natural lighting, warm tones, authentic, candid moment',
        'minimal': 'minimalist design, clean, simple, modern, white space, elegant',
        'vibrant': 'vibrant colors, bold, energetic, dynamic, eye-catching',
        'luxury': 'luxury style, premium, elegant, sophisticated, high-end, refined',
        'natural': 'natural, organic, earthy tones, sustainable, eco-friendly aesthetic',
      };

      if (stylePrompts[style]) {
        enhancedPrompt = `${prompt}, ${stylePrompts[style]}`;
      }
    }

    // Gemini로 프롬프트 보강
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const promptResult = await model.generateContent(`
      You are an expert at creating image generation prompts.
      Convert this request into a detailed English prompt for high-quality image generation.
      Only output the prompt, no explanations.
      Keep it under 200 characters.

      Request: ${enhancedPrompt}
    `);

    const detailedPrompt = promptResult.response.text().trim();

    // 1차 시도: Gemini 2.0 Flash로 이미지 생성
    try {
      console.log('Trying Gemini 2.0 Flash for image generation...');
      const geminiResult = await generateImageWithGemini2(detailedPrompt);

      // Gemini 2.0 응답에서 이미지 추출
      const candidates = geminiResult.candidates || [];
      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];

        // 이미지 파트 찾기
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            const base64Image = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            const imageUrl = `data:${mimeType};base64,${base64Image}`;

            return NextResponse.json({
              success: true,
              data: {
                originalPrompt: prompt,
                enhancedPrompt: detailedPrompt,
                style,
                aspectRatio,
                imageUrl,
                mimeType,
                generator: 'gemini-2.0-flash',
              }
            });
          }
        }
      }

      console.log('Gemini 2.0 did not return an image, trying Imagen 3...');
    } catch (geminiError) {
      console.error('Gemini 2.0 Flash error:', geminiError);
      console.log('Falling back to Imagen 3...');
    }

    // 2차 시도: Imagen 3로 이미지 생성
    try {
      const imagenResult = await generateImageWithImagen(detailedPrompt, aspectRatio);

      // Imagen 응답에서 이미지 추출
      const predictions = imagenResult.predictions || [];
      if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        const base64Image = predictions[0].bytesBase64Encoded;
        const imageUrl = `data:image/png;base64,${base64Image}`;

        return NextResponse.json({
          success: true,
          data: {
            originalPrompt: prompt,
            enhancedPrompt: detailedPrompt,
            style,
            aspectRatio,
            imageUrl,
            mimeType: predictions[0].mimeType || 'image/png',
            generator: 'imagen-3',
          }
        });
      }

      throw new Error('이미지가 생성되지 않았습니다.');
    } catch (imagenError) {
      console.error('Imagen API error:', imagenError);

      // 모든 방법 실패시 프롬프트만 반환
      return NextResponse.json({
        success: false,
        message: '이미지 생성에 실패했습니다. Gemini 2.0과 Imagen 3 모두 사용할 수 없습니다.',
        data: {
          originalPrompt: prompt,
          enhancedPrompt: detailedPrompt,
          style,
          aspectRatio,
          imageUrl: null,
        },
        error: 'Both Gemini 2.0 and Imagen 3 failed to generate image',
      });
    }

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: '이미지 생성 중 오류가 발생했습니다.', details: String(error) },
      { status: 500 }
    );
  }
}

// 이미지 생성 상태 확인 (비동기 생성 시 사용)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId가 필요합니다.' },
      { status: 400 }
    );
  }

  // TODO: 실제 작업 상태 조회 로직 구현
  return NextResponse.json({
    jobId,
    status: 'pending',
    message: '이미지 생성 중입니다.',
  });
}
