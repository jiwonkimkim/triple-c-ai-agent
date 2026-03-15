/**
 * Chat API Mock Helpers
 *
 * 채팅 서비스 E2E 테스트에서 사용하는 API 모킹 유틸리티입니다.
 *
 * - AI(LangGraph/Gemini) 호출은 외부 의존성이므로 SSE 응답을 모킹합니다.
 * - 이미지 업로드(R2)도 모킹하여 테스트를 빠르고 안정적으로 만듭니다.
 * - 인증 및 DB 쿼리(대화 생성, 메시지 저장)는 실제 서버를 사용합니다.
 *
 * [SSE 형식]
 *   event: <name>\ndata: <json>\n\n
 *
 * 서버가 보내는 이벤트 순서:
 *   typing(true) → chunk(×N) → message → typing(false) → done
 */

import * as path from 'path';
import * as fs from 'fs';
import type { Page, Route } from '@playwright/test';

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 모킹 시 사용할 고정 대화 ID */
export const MOCK_CONVERSATION_ID = 'e2e-test-conv-001';

/** POST /api/chat 생성 직후 서버가 삽입하는 웰컴 메시지 */
export const MOCK_WELCOME_MESSAGE = {
  id: 'welcome-msg-001',
  role: 'assistant',
  content:
    '안녕하세요! 저는 상세페이지 생성 도우미예요. 🎨\n\n어떤 제품의 상세페이지를 만들어 드릴까요?',
  agentType: 'COORDINATOR',
  metadata: { uiType: 'text' },
  attachments: [],
  createdAt: new Date().toISOString(),
};

// ─── SSE 응답 빌더 ──────────────────────────────────────────────────────────

/**
 * SSE 형식의 AI 응답 문자열을 생성합니다.
 * route.fulfill()의 body로 사용합니다.
 *
 * @param replyContent - AI가 답변할 텍스트
 * @param messageId    - 생성될 메시지 ID (기본값: 'ai-msg-001')
 */
export function buildSSEResponse(
  replyContent: string,
  messageId = 'ai-msg-001'
): string {
  const makeEvent = (name: string, data: object) =>
    `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

  const events: string[] = [];

  // 1. 타이핑 시작
  events.push(makeEvent('typing', { isTyping: true }));

  // 2. 단어 단위 chunk 이벤트 (누적 전송)
  const tokens = replyContent.match(/\S+|\s+/g) ?? [replyContent];
  let accumulated = '';
  tokens.forEach((token, i) => {
    accumulated += token;
    events.push(
      makeEvent('chunk', {
        messageId,
        content: accumulated,
        isComplete: i === tokens.length - 1,
      })
    );
  });

  // 3. 완성된 메시지
  events.push(
    makeEvent('message', {
      id: messageId,
      role: 'assistant',
      content: replyContent,
      agentType: 'COORDINATOR',
      metadata: {},
      createdAt: new Date().toISOString(),
    })
  );

  // 4. 타이핑 종료
  events.push(makeEvent('typing', { isTyping: false }));

  // 5. 완료
  events.push(
    makeEvent('done', {
      status: 'await_input',
      currentAgent: 'COORDINATOR',
      collectedData: {},
    })
  );

  return events.join('');
}

// ─── API 모킹 함수 ─────────────────────────────────────────────────────────

/**
 * POST /api/chat — 새 대화 생성 모킹
 * 고정된 conversationId를 반환하여 결정론적인 URL 이동을 보장합니다.
 */
export async function mockCreateConversation(
  page: Page,
  conversationId = MOCK_CONVERSATION_ID
): Promise<void> {
  await page.route('**/api/chat', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conversationId, status: 'ACTIVE' }),
    });
  });
}

/**
 * /api/chat/{conversationId}/messages — GET(초기 로드) + POST(SSE 전송) 모킹
 *
 * - GET: 초기 메시지 목록 반환
 * - POST: SSE 스트리밍 응답 반환 (replyContent가 있을 때만)
 *         없으면 route.continue()로 실제 서버로 전달
 *
 * @param options.initialMessages - GET 응답에 포함될 초기 메시지 배열
 * @param options.replyContent    - POST(SSE) 응답으로 보낼 AI 답변 텍스트
 * @param options.delayMs         - SSE 응답 전 지연 시간(ms). 중간 상태 테스트에 사용
 */
export async function mockMessagesEndpoint(
  page: Page,
  conversationId = MOCK_CONVERSATION_ID,
  options: {
    initialMessages?: object[];
    replyContent?: string;
    delayMs?: number;
  } = {}
): Promise<void> {
  const {
    initialMessages = [MOCK_WELCOME_MESSAGE],
    replyContent,
    delayMs = 0,
  } = options;

  await page.route(
    `**/api/chat/${conversationId}/messages`,
    async (route: Route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messages: initialMessages }),
        });
        return;
      }

      if (method === 'POST' && replyContent !== undefined) {
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: buildSSEResponse(replyContent, `ai-msg-${Date.now()}`),
        });
        return;
      }

      await route.continue();
    }
  );
}

/**
 * POST /api/upload — 이미지 업로드 모킹
 * 실제 R2 업로드 없이 CDN URL을 즉시 반환합니다.
 */
export async function mockImageUpload(
  page: Page,
  uploadedUrl = 'https://cdn.example.com/test-product.jpg'
): Promise<void> {
  await page.route('**/api/upload', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, url: uploadedUrl }),
    });
  });
}

/**
 * 채팅 E2E 테스트를 위한 통합 모킹 설정 + 새 대화 생성까지 수행합니다.
 *
 * 1. POST /api/chat        → 고정 conversationId 반환
 * 2. GET/POST /api/chat/{id}/messages → 초기 메시지 + SSE 응답 모킹
 * 3. "새 대화" 버튼 클릭
 * 4. 대화 페이지(/dashboard/chat/{id}) 로드 대기
 *
 * @returns 생성된 대화 ID
 */
export async function setupAndNavigateToChatPage(
  page: Page,
  options: {
    replyContent?: string;
    initialMessages?: object[];
    uploadedImageUrl?: string;
    sseDelayMs?: number;
  } = {}
): Promise<string> {
  const { replyContent, initialMessages, uploadedImageUrl, sseDelayMs } =
    options;

  // 채팅 목록 페이지로 이동
  await page.goto('/dashboard/chat');
  await page.waitForLoadState('networkidle');

  // API 모킹 설정
  await mockCreateConversation(page);
  await mockMessagesEndpoint(page, MOCK_CONVERSATION_ID, {
    initialMessages,
    replyContent,
    delayMs: sseDelayMs,
  });
  if (uploadedImageUrl) {
    await mockImageUpload(page, uploadedImageUrl);
  }

  // "새 대화" 버튼 클릭 (대화가 없으면 "첫 대화 시작하기" 버튼도 처리)
  const newChatButton = page
    .getByTestId('new-chat-button')
    .or(page.getByRole('button', { name: '새 대화' }))
    .or(page.getByRole('button', { name: '첫 대화 시작하기' }));

  await newChatButton.first().click();

  // 대화 페이지 로드 대기
  await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
    timeout: 10_000,
  });

  // textarea가 렌더링될 때까지 대기
  await page.waitForSelector('[data-testid="chat-textarea"]', {
    timeout: 10_000,
  });

  return MOCK_CONVERSATION_ID;
}

// ─── 추가 SSE 빌더 ─────────────────────────────────────────────────────────

/**
 * SSE 에러 이벤트를 생성합니다.
 * route.ts catch 블록이 실제로 보내는 형식과 동일:
 *   typing(true) → error
 *
 * @param errorMessage - 클라이언트에 전달할 오류 메시지
 */
export function buildSSEErrorResponse(errorMessage: string): string {
  const makeEvent = (name: string, data: object) =>
    `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

  return [
    makeEvent('typing', { isTyping: true }),
    makeEvent('error', { message: errorMessage }),
  ].join('');
}

/**
 * done 이벤트에 임의의 상태(collectedData, currentAgent 등)를 담은 SSE를 생성합니다.
 * 특정 상태(기획 완료, 생성 확인 등)를 테스트에서 재현할 때 사용합니다.
 *
 * @param replyContent - 스트리밍할 AI 메시지 텍스트
 * @param donePayload  - done 이벤트에 포함할 추가 데이터 (currentAgent, collectedData 등)
 * @param messageId    - 메시지 ID (기본값: 자동 생성)
 */
export function buildSSEWithDoneData(
  replyContent: string,
  donePayload: {
    status?: string;
    currentAgent?: string;
    collectedData?: Record<string, unknown>;
    projectId?: string;
  },
  messageId = `ai-msg-${Date.now()}`
): string {
  const makeEvent = (name: string, data: object) =>
    `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

  const events: string[] = [];

  events.push(makeEvent('typing', { isTyping: true }));

  const tokens = replyContent.match(/\S+|\s+/g) ?? [replyContent];
  let accumulated = '';
  tokens.forEach((token, i) => {
    accumulated += token;
    events.push(
      makeEvent('chunk', {
        messageId,
        content: accumulated,
        isComplete: i === tokens.length - 1,
      })
    );
  });

  events.push(
    makeEvent('message', {
      id: messageId,
      role: 'assistant',
      content: replyContent,
      agentType: donePayload.currentAgent ?? 'COORDINATOR',
      metadata: {},
      createdAt: new Date().toISOString(),
    })
  );

  events.push(makeEvent('typing', { isTyping: false }));

  events.push(
    makeEvent('done', {
      status: donePayload.status ?? 'await_input',
      currentAgent: donePayload.currentAgent ?? 'COORDINATOR',
      collectedData: donePayload.collectedData ?? {},
      ...(donePayload.projectId && { projectId: donePayload.projectId }),
    })
  );

  return events.join('');
}

/** 테스트용 샘플 이미지 경로 (200×200 보라-인디고 그라디언트 PNG) */
export const SAMPLE_IMAGE_PATH = path.join(
  __dirname,
  '../fixtures/sample-product.png'
);

/** 테스트용 최소 PNG (1×1 px, 흑색) — 빠른 단위 테스트용 */
export const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjAAAAAElFTkSuQmCC',
  'base64'
);
