import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import {
  generateImageWithGemini,
  base64ToDataUrl,
  isGeminiConfigured,
} from '@/services/image/gemini-image-generator';

export const dynamic = 'force-dynamic';

// Groq client (OpenAI-compatible API)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// 편집 가능한 요소 타입
interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'heading' | 'image-overlay';
  content?: string;
  styles?: Record<string, string>;
  level?: number;
  alt?: string;
  // image-overlay 블록용
  overlayTexts?: Array<{
    id: string;
    type: string;
    content: string;
    style: Record<string, unknown>;
    zIndex?: number;
  }>;
  src?: string;
  overlayGradient?: string;
}

interface EditRequest {
  projectId: string;
  message: string;
  targetElement?: EditableElement;
  allElements?: EditableElement[];
  editType?: 'text' | 'image' | 'both'; // 편집 유형
}

// AI 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Helper to check placeholder keys
const isPlaceholder = (key: string | undefined) =>
  !key || key.includes('your-') || key.includes('placeholder') || key.length < 20;

// Get available AI provider (Groq first for text generation)
function getAvailableProvider(): 'groq' | 'anthropic' | 'openai' | 'gemini' | null {
  if (!isPlaceholder(process.env.GROQ_API_KEY)) return 'groq';
  if (!isPlaceholder(process.env.ANTHROPIC_API_KEY)) return 'anthropic';
  if (!isPlaceholder(process.env.OPENAI_API_KEY)) return 'openai';
  if (!isPlaceholder(process.env.GOOGLE_AI_API_KEY)) return 'gemini';
  return null;
}

// Mock 모드 확인
function shouldUseMock(): boolean {
  if (process.env.USE_MOCK_AI === 'true') {
    console.log('[AI Edit] USE_MOCK_AI is true');
    return true;
  }
  const provider = getAvailableProvider();
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  console.log('[AI Edit] Available provider:', provider);
  console.log('[AI Edit] GOOGLE_AI_API_KEY:', googleKey ? `${googleKey.substring(0, 10)}...` : 'not set');
  console.log('[AI Edit] isPlaceholder check:', isPlaceholder(googleKey));
  return provider === null;
}

// Mock 편집 응답 생성
function generateMockEdit(message: string, element?: EditableElement): Partial<EditableElement> | null {
  if (!element) return null;

  // image-overlay 블록 처리
  if (element.type === 'image-overlay' && element.overlayTexts) {
    const updatedOverlayTexts = element.overlayTexts.map(text => {
      let newContent = text.content;

      if (message.includes('짧게') || message.includes('줄여')) {
        const words = text.content.split(' ');
        newContent = words.slice(0, Math.ceil(words.length / 2)).join(' ');
      } else if (message.includes('길게') || message.includes('자세')) {
        newContent = text.content + ' - 더 자세한 내용';
      } else if (message.includes('밝게') || message.includes('친근')) {
        newContent = text.content.replace(/\./g, '!');
      } else if (message.includes('전문') || message.includes('격식')) {
        newContent = text.content.replace(/!/g, '.').replace(/😊/g, '');
      } else {
        newContent = text.content + ' (수정됨)';
      }

      return { ...text, content: newContent };
    });

    return { overlayTexts: updatedOverlayTexts };
  }

  // 일반 텍스트/헤딩 요소 처리
  if (!element.content) return null;

  // 간단한 Mock 응답
  if (message.includes('짧게') || message.includes('줄여')) {
    const words = element.content.split(' ');
    return { content: words.slice(0, Math.ceil(words.length / 2)).join(' ') + '...' };
  }

  if (message.includes('길게') || message.includes('자세')) {
    return { content: element.content + '\n\n추가 설명: 더 자세한 내용이 여기에 들어갑니다.' };
  }

  if (message.includes('밝게') || message.includes('친근')) {
    return { content: element.content + ' 😊' };
  }

  if (message.includes('전문') || message.includes('격식')) {
    return { content: element.content.replace(/!+/g, '.').replace(/😊/g, '') };
  }

  // 기본 수정
  return { content: `[수정됨] ${element.content}` };
}

// Mock 전체 페이지 편집
function generateMockFullEdit(message: string, elements: EditableElement[]): EditableElement[] {
  return elements.map((el) => {
    if (el.type === 'text' || el.type === 'heading' || el.type === 'image-overlay') {
      const mockUpdate = generateMockEdit(message, el);
      if (mockUpdate) {
        return { ...el, ...mockUpdate };
      }
    }
    return el;
  });
}

// 이미지 편집 요청인지 확인
function isImageEditRequest(message: string): boolean {
  const imageKeywords = [
    '이미지', '사진', '배경', '그림', '이미지로', '사진으로',
    '이미지를', '사진을', '배경을', '그림을',
    'image', 'photo', 'background', 'picture',
    '바꿔', '변경', '수정', '생성', '만들어',
    '밝게', '어둡게', '화려하게', '심플하게',
  ];
  const lowerMessage = message.toLowerCase();
  return imageKeywords.some((keyword) => lowerMessage.includes(keyword));
}

// AI를 사용하여 이미지 프롬프트 생성
async function generateImagePrompt(
  message: string,
  currentImageContext?: string,
  provider?: 'groq' | 'anthropic' | 'openai' | 'gemini' | null
): Promise<string> {
  const systemPrompt = `You are an expert at creating image generation prompts.
Based on the user's request, create a detailed image generation prompt for a product detail page.
The image should be professional, high-quality, and suitable for e-commerce.
Output ONLY the image prompt, no explanation.`;

  const userPrompt = `User request: "${message}"
${currentImageContext ? `Current image context: ${currentImageContext}` : ''}
Create a detailed image generation prompt for this request.`;

  if (provider && provider !== null) {
    try {
      const result = await callAI(`${systemPrompt}\n\n${userPrompt}`, provider);
      return result.trim();
    } catch (error) {
      console.error('[AI Edit] Failed to generate image prompt:', error);
    }
  }

  // Fallback: 간단한 프롬프트 생성
  return `Professional product photography. ${message}.
High-quality, commercial style, clean background, studio lighting.
Create a stunning image suitable for an e-commerce detail page.`;
}

// Gemini로 이미지 생성
async function generateEditedImage(prompt: string): Promise<string | null> {
  if (!isGeminiConfigured()) {
    console.log('[AI Edit] Gemini not configured for image generation');
    return null;
  }

  try {
    console.log('[AI Edit] Generating image with prompt:', prompt.substring(0, 100));
    const images = await generateImageWithGemini({
      prompt,
      model: 'gemini-2.5-flash-image',
      aspectRatio: '16:9',
    });

    if (images.length > 0) {
      const dataUrl = base64ToDataUrl(images[0].base64Data, images[0].mimeType);
      console.log('[AI Edit] Image generated successfully');
      return dataUrl;
    }
  } catch (error) {
    console.error('[AI Edit] Image generation failed:', error);
  }

  return null;
}

export async function POST(request: NextRequest) {
  console.log('[AI Edit] ====== POST /api/ai/edit received ======');
  try {
    const session = await getServerSession(authOptions);
    console.log('[AI Edit] Session:', session?.user?.email || 'no session');

    if (!session?.user) {
      console.log('[AI Edit] Unauthorized - no session');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: EditRequest = await request.json();
    const { message, targetElement, allElements, editType = 'text' } = body;
    console.log('[AI Edit] Request body:', {
      message: message?.substring(0, 50),
      hasTargetElement: !!targetElement,
      allElementsCount: allElements?.length,
      editType,
    });

    if (!message?.trim()) {
      console.log('[AI Edit] Empty message');
      return NextResponse.json({ success: false, error: '수정 요청을 입력해주세요' }, { status: 400 });
    }

    // 이미지 편집 요청 처리 (editType이 image 또는 both인 경우에만)
    // editType이 'text'일 때는 메시지 키워드와 관계없이 텍스트만 수정
    const shouldEditImage = editType === 'image' || editType === 'both';

    if (shouldEditImage && targetElement?.type === 'image-overlay') {
      console.log('[AI Edit] Image edit requested for image-overlay block');

      // AI로 이미지 프롬프트 생성
      const provider = getAvailableProvider();
      const imagePrompt = await generateImagePrompt(
        message,
        targetElement.alt || targetElement.overlayTexts?.[0]?.content,
        provider
      );

      // 이미지 생성
      const newImageSrc = await generateEditedImage(imagePrompt);

      if (newImageSrc) {
        // 텍스트도 같이 편집할지 결정
        if (editType === 'both' || !isImageEditRequest(message)) {
          // 텍스트도 편집
          const textProvider = getAvailableProvider();
          if (textProvider && targetElement.overlayTexts) {
            try {
              const textPrompt = buildElementEditPrompt(message, targetElement);
              const textResult = await callAI(textPrompt, textProvider);

              let cleanResult = textResult.trim();
              if (cleanResult.startsWith('```json')) {
                cleanResult = cleanResult.slice(7);
              } else if (cleanResult.startsWith('```')) {
                cleanResult = cleanResult.slice(3);
              }
              if (cleanResult.endsWith('```')) {
                cleanResult = cleanResult.slice(0, -3);
              }
              cleanResult = cleanResult.trim();

              const updatedTexts = JSON.parse(cleanResult);
              const mergedOverlayTexts = targetElement.overlayTexts.map((original) => {
                const updated = updatedTexts.find((u: { id: string }) => u.id === original.id);
                return updated ? { ...original, content: updated.content } : original;
              });

              return NextResponse.json({
                success: true,
                updatedElement: { src: newImageSrc, overlayTexts: mergedOverlayTexts },
                editedImage: true,
              });
            } catch (error) {
              console.log('[AI Edit] Text edit failed, returning only image update');
            }
          }
        }

        // 이미지만 반환
        return NextResponse.json({
          success: true,
          updatedElement: { src: newImageSrc },
          editedImage: true,
        });
      } else {
        console.log('[AI Edit] Image generation failed, falling back to text-only edit');
      }
    }

    // Mock 모드
    if (shouldUseMock()) {
      console.log('[DEV] Using mock AI edit');
      console.log('[DEV] targetElement:', targetElement ? 'exists' : 'null');
      console.log('[DEV] allElements:', allElements ? `${allElements.length} items` : 'null');

      if (targetElement) {
        const mockUpdate = generateMockEdit(message, targetElement);
        console.log('[DEV] mockUpdate:', mockUpdate);
        if (!mockUpdate) {
          return NextResponse.json({
            success: true,
            updatedElement: { content: `[수정됨] ${targetElement.content}` },
          });
        }
        return NextResponse.json({
          success: true,
          updatedElement: mockUpdate,
        });
      } else if (allElements && allElements.length > 0) {
        const updatedElements = generateMockFullEdit(message, allElements);
        console.log('[DEV] updatedElements count:', updatedElements.length);
        return NextResponse.json({
          success: true,
          updatedElements,
        });
      }

      return NextResponse.json({ success: false, error: '편집할 대상이 없습니다' }, { status: 400 });
    }

    // 실제 AI 편집
    const provider = getAvailableProvider();
    console.log('[AI Edit] Using provider:', provider);

    if (targetElement) {
      // 선택된 요소만 수정
      const prompt = buildElementEditPrompt(message, targetElement);
      console.log('[AI Edit] Single element prompt length:', prompt.length, 'chars');
      const result = await callAI(prompt, provider!);

      // image-overlay 블록 처리
      if (targetElement.type === 'image-overlay' && targetElement.overlayTexts) {
        try {
          // Clean up markdown code blocks if present
          let cleanResult = result.trim();
          if (cleanResult.startsWith('```json')) {
            cleanResult = cleanResult.slice(7);
          } else if (cleanResult.startsWith('```')) {
            cleanResult = cleanResult.slice(3);
          }
          if (cleanResult.endsWith('```')) {
            cleanResult = cleanResult.slice(0, -3);
          }
          cleanResult = cleanResult.trim();

          const updatedTexts = JSON.parse(cleanResult);
          // Merge updated content with original overlay texts (keep styles)
          const mergedOverlayTexts = targetElement.overlayTexts.map((original) => {
            const updated = updatedTexts.find((u: { id: string }) => u.id === original.id);
            if (updated) {
              return { ...original, content: updated.content };
            }
            return original;
          });

          return NextResponse.json({
            success: true,
            updatedElement: { overlayTexts: mergedOverlayTexts },
          });
        } catch (parseError) {
          console.error('[AI Edit] Failed to parse image-overlay response:', parseError);
          // Fallback: return original with slight modification indicator
          return NextResponse.json({
            success: true,
            updatedElement: {
              overlayTexts: targetElement.overlayTexts.map((t) => ({
                ...t,
                content: t.content + ' (수정됨)',
              })),
            },
          });
        }
      }

      // 일반 텍스트/헤딩 요소
      return NextResponse.json({
        success: true,
        updatedElement: { content: result },
      });
    } else if (allElements) {
      // 전체 페이지 수정 - 텍스트 요소 및 image-overlay 블록 포함
      const editableElements = allElements.filter(
        (el) => el.type === 'text' || el.type === 'heading' || el.type === 'image-overlay'
      );
      console.log('[AI Edit] Filtering elements: total', allElements.length, '-> editable', editableElements.length);

      const prompt = buildFullPageEditPrompt(message, editableElements);
      console.log('[AI Edit] Full page prompt length:', prompt.length, 'chars');
      const result = await callAI(prompt, provider!);

      try {
        // Clean up markdown code blocks if present
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```json')) {
          cleanResult = cleanResult.slice(7);
        } else if (cleanResult.startsWith('```')) {
          cleanResult = cleanResult.slice(3);
        }
        if (cleanResult.endsWith('```')) {
          cleanResult = cleanResult.slice(0, -3);
        }
        cleanResult = cleanResult.trim();

        const updatedElements = JSON.parse(cleanResult);
        // 원본 요소와 병합
        const updatedMap = new Map<string, EditableElement>(
          updatedElements.map((el: EditableElement) => [el.id, el])
        );
        const mergedElements = allElements.map((el) => {
          const updated = updatedMap.get(el.id);
          if (updated) {
            // image-overlay인 경우 overlayTexts만 업데이트
            if (el.type === 'image-overlay' && updated.overlayTexts) {
              const mergedOverlayTexts = el.overlayTexts?.map((original) => {
                const updatedText = updated.overlayTexts?.find(
                  (u: { id: string }) => u.id === original.id
                );
                if (updatedText) {
                  return { ...original, content: updatedText.content };
                }
                return original;
              });
              return { ...el, overlayTexts: mergedOverlayTexts };
            }
            return { ...el, ...updated };
          }
          return el;
        });
        return NextResponse.json({
          success: true,
          updatedElements: mergedElements,
        });
      } catch {
        // JSON 파싱 실패 시 텍스트 요소들만 수정
        const updatedElements = allElements.map((el) => {
          if (el.type === 'text' || el.type === 'heading') {
            return { ...el, content: el.content + ' (수정됨)' };
          }
          if (el.type === 'image-overlay' && el.overlayTexts) {
            return {
              ...el,
              overlayTexts: el.overlayTexts.map((t) => ({
                ...t,
                content: t.content + ' (수정됨)',
              })),
            };
          }
          return el;
        });
        return NextResponse.json({
          success: true,
          updatedElements,
        });
      }
    }

    return NextResponse.json({ success: false, error: '편집할 대상이 없습니다' }, { status: 400 });
  } catch (error) {
    console.error('AI edit error:', error);
    return NextResponse.json(
      { success: false, error: 'AI 편집 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

function buildElementEditPrompt(message: string, element: EditableElement): string {
  // image-overlay 블록 처리
  if (element.type === 'image-overlay' && element.overlayTexts) {
    const textsJson = JSON.stringify(
      element.overlayTexts.map((t) => ({
        id: t.id,
        type: t.type,
        content: t.content,
      })),
      null,
      2
    );

    return `다음 이미지 오버레이 블록의 텍스트들을 사용자의 요청에 맞게 수정해주세요.

현재 텍스트들:
${textsJson}

사용자 요청: "${message}"

수정된 텍스트들을 동일한 JSON 형식으로 반환해주세요.
각 요소의 id와 type은 유지하고 content만 수정하세요.
JSON 배열만 반환하고 다른 설명은 포함하지 마세요.`;
  }

  // 일반 텍스트/헤딩 요소 처리
  return `다음 텍스트를 사용자의 요청에 맞게 수정해주세요.

현재 텍스트:
"${element.content}"

요소 타입: ${element.type === 'heading' ? '제목' : '본문 텍스트'}

사용자 요청: "${message}"

수정된 텍스트만 반환해주세요. 다른 설명 없이 수정된 텍스트만 출력하세요.`;
}

function buildFullPageEditPrompt(message: string, elements: EditableElement[]): string {
  const elementsJson = JSON.stringify(
    elements.map((el) => {
      if (el.type === 'image-overlay' && el.overlayTexts) {
        return {
          id: el.id,
          type: el.type,
          overlayTexts: el.overlayTexts.map((t) => ({
            id: t.id,
            type: t.type,
            content: t.content,
          })),
        };
      }
      return {
        id: el.id,
        type: el.type,
        content: el.content,
      };
    }),
    null,
    2
  );

  return `다음 상세페이지 콘텐츠를 사용자의 요청에 맞게 수정해주세요.

현재 콘텐츠:
${elementsJson}

사용자 요청: "${message}"

수정된 콘텐츠를 동일한 JSON 형식으로 반환해주세요.
각 요소의 id와 type은 유지하세요.
- text/heading 요소는 content만 수정하세요.
- image-overlay 요소는 overlayTexts 배열 안의 각 텍스트 content만 수정하세요.
JSON 배열만 반환하고 다른 설명은 포함하지 마세요.`;
}

async function callAI(prompt: string, provider: 'groq' | 'anthropic' | 'openai' | 'gemini'): Promise<string> {
  if (provider === 'groq') {
    try {
      // llama-3.3-70b-versatile has larger context window (128k) for longer prompts
      console.log('[AI Edit] Calling Groq API with model: llama-3.3-70b-versatile');
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      console.log('[AI Edit] Groq response received');
      return response.choices[0]?.message?.content || '';
    } catch (groqError) {
      console.error('[AI Edit] Groq API error:', groqError);
      throw groqError;
    }
  } else if (provider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || '';
  } else if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content || '';
  } else {
    // Gemini
    try {
      console.log('[AI Edit] Calling Gemini API...');
      const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      console.log('[AI Edit] Gemini response received');
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (geminiError) {
      console.error('[AI Edit] Gemini API error:', geminiError);
      throw geminiError;
    }
  }
}
