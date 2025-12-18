import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// 편집 가능한 요소 타입
interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'heading';
  content: string;
  styles?: Record<string, string>;
  level?: number;
  alt?: string;
}

interface EditRequest {
  projectId: string;
  message: string;
  targetElement?: EditableElement;
  allElements?: EditableElement[];
}

// AI 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock 모드 확인
function shouldUseMock(): boolean {
  if (process.env.USE_MOCK_AI === 'true') return true;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const isPlaceholder = (key: string | undefined) =>
    !key || key.includes('your-') || key.includes('placeholder') || key.length < 20;

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  return isDev && isPlaceholder(anthropicKey) && isPlaceholder(openaiKey);
}

// Mock 편집 응답 생성
function generateMockEdit(message: string, element?: EditableElement): Partial<EditableElement> | null {
  if (!element) return null;

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
    if (el.type === 'text' || el.type === 'heading') {
      const mockUpdate = generateMockEdit(message, el);
      if (mockUpdate) {
        return { ...el, ...mockUpdate };
      }
    }
    return el;
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: EditRequest = await request.json();
    const { message, targetElement, allElements } = body;

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: '수정 요청을 입력해주세요' }, { status: 400 });
    }

    // Mock 모드
    if (shouldUseMock()) {
      console.log('[DEV] Using mock AI edit');

      if (targetElement) {
        const mockUpdate = generateMockEdit(message, targetElement);
        return NextResponse.json({
          success: true,
          updatedElement: mockUpdate,
        });
      } else if (allElements) {
        const updatedElements = generateMockFullEdit(message, allElements);
        return NextResponse.json({
          success: true,
          updatedElements,
        });
      }

      return NextResponse.json({ success: false, error: '편집할 대상이 없습니다' }, { status: 400 });
    }

    // 실제 AI 편집
    const useAnthropic = !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-'));

    if (targetElement) {
      // 선택된 요소만 수정
      const prompt = buildElementEditPrompt(message, targetElement);
      const result = await callAI(prompt, useAnthropic);

      return NextResponse.json({
        success: true,
        updatedElement: { content: result },
      });
    } else if (allElements) {
      // 전체 페이지 수정
      const prompt = buildFullPageEditPrompt(message, allElements);
      const result = await callAI(prompt, useAnthropic);

      try {
        const updatedElements = JSON.parse(result);
        return NextResponse.json({
          success: true,
          updatedElements,
        });
      } catch {
        // JSON 파싱 실패 시 텍스트 요소들만 수정
        const updatedElements = allElements.map((el) => {
          if (el.type === 'text' || el.type === 'heading') {
            return { ...el, content: el.content + ' (수정됨)' };
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
  return `다음 텍스트를 사용자의 요청에 맞게 수정해주세요.

현재 텍스트:
"${element.content}"

요소 타입: ${element.type === 'heading' ? '제목' : '본문 텍스트'}

사용자 요청: "${message}"

수정된 텍스트만 반환해주세요. 다른 설명 없이 수정된 텍스트만 출력하세요.`;
}

function buildFullPageEditPrompt(message: string, elements: EditableElement[]): string {
  const elementsJson = JSON.stringify(
    elements.map((el) => ({
      id: el.id,
      type: el.type,
      content: el.content,
    })),
    null,
    2
  );

  return `다음 상세페이지 콘텐츠를 사용자의 요청에 맞게 수정해주세요.

현재 콘텐츠:
${elementsJson}

사용자 요청: "${message}"

수정된 콘텐츠를 동일한 JSON 형식으로 반환해주세요.
각 요소의 id와 type은 유지하고 content만 수정하세요.
JSON 배열만 반환하고 다른 설명은 포함하지 마세요.`;
}

async function callAI(prompt: string, useAnthropic: boolean = true): Promise<string> {
  if (useAnthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || '';
  } else {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content || '';
  }
}
