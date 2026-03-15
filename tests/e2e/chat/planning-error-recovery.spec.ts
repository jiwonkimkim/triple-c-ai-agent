/**
 * 기획 단계 AI 실패 → UI 복구 검증
 *
 * 검증 대상: 시나리오 2 — PLANNER LLM 실패 시 UI가 안전하게 복구되는가
 *
 * ── 실제 코드 흐름 ────────────────────────────────────────────────────────
 *
 *  서버 (route.ts)
 *    sendEvent('typing', { isTyping: true })   ← 라인 320
 *    await graph.invoke(...)                   ← 라인 323 (여기서 LLM 실패)
 *    catch → sendEvent('error', { message })   ← 라인 414
 *    finally → controller.close()              ← 라인 418 (스트림 종료)
 *
 *  클라이언트 (use-sse-stream.ts → use-chat.ts)
 *    typing 이벤트  → onTyping(true)
 *      setIsTyping(true)                       ← use-chat.ts:119
 *      messages에 임시 스트리밍 메시지 추가     ← use-chat.ts:125
 *    error 이벤트  → onError(message)
 *      setIsTyping(false)                      ← use-chat.ts:164  ★ typing-indicator 제거
 *      setError(message)                       ← use-chat.ts:163  ★ 에러 배너 표시
 *    스트림 종료 (finally)
 *      setIsStreaming(false)                   ← use-sse-stream.ts:122 ★ textarea 활성화
 *
 *  렌더링 (page.tsx)
 *    <TypingIndicator> 조건: isTyping && !messages.some(m => m.isStreaming)  ← 라인 179
 *    <ChatInput disabled={isStreaming}>                                       ← 라인 197
 *    {error && <div data-testid="error-banner">}                             ← 라인 188
 *
 * ── 에러 발생 시 임시 스트리밍 메시지 잔존 이슈 ─────────────────────────
 *
 *  onTyping(true) 에서 추가한 임시 메시지 { isStreaming: true, content: '' }는
 *  onError에서 제거되지 않는다 (onDone에서만 정리됨 — use-chat.ts:144).
 *  이 테스트는 해당 빈 메시지 버블이 UI에 표시되지 않음을 추가로 검증한다.
 */

import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import {
  mockCreateConversation,
  buildSSEErrorResponse,
  buildSSEWithDoneData,
  MOCK_CONVERSATION_ID,
  MOCK_WELCOME_MESSAGE,
} from '../helpers/chat-mocks';

// ─── 픽스처 ────────────────────────────────────────────────────────────────

/** imageModel 선택지를 제시한 직후 상태 (기획 직전) */
const MESSAGES_BEFORE_PLANNING = [
  MOCK_WELCOME_MESSAGE,
  {
    id: 'user-msg-1',
    role: 'user',
    content: '에어팟 프로 케이스 상세페이지 만들어줘',
    agentType: null,
    metadata: {},
    attachments: [],
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: 'suggester-imagemodel',
    role: 'assistant',
    content:
      '이미지 생성 모델을 선택해 주세요.\n\n• FLUX Pro: 고품질\n• FLUX Schnell: 빠른 생성',
    agentType: 'SUGGESTER',
    metadata: {
      uiType: 'options',
      options: [
        { id: 'imageModel_FLUX_PRO', label: 'FLUX Pro (고품질)' },
        { id: 'imageModel_FLUX_SCHNELL', label: 'FLUX Schnell (빠른 생성)' },
      ],
    },
    attachments: [],
    createdAt: new Date(Date.now() - 5_000).toISOString(),
  },
];

// ─── 공통 세팅 헬퍼 ────────────────────────────────────────────────────────

async function setupPlanningErrorScenario(
  page: Page,
  postHandler: (route: Route, callCount: number) => Promise<void>
): Promise<void> {
  await page.goto('/dashboard/chat');
  await page.waitForLoadState('networkidle');
  await mockCreateConversation(page);

  let callCount = 0;

  await page.route(
    `**/api/chat/${MOCK_CONVERSATION_ID}/messages`,
    async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messages: MESSAGES_BEFORE_PLANNING }),
        });
        return;
      }

      if (route.request().method() === 'POST') {
        callCount += 1;
        await postHandler(route, callCount);
        return;
      }

      await route.continue();
    }
  );

  await page
    .getByTestId('new-chat-button')
    .or(page.getByRole('button', { name: '새 대화' }))
    .or(page.getByRole('button', { name: '첫 대화 시작하기' }))
    .first()
    .click();

  await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
    timeout: 10_000,
  });
  await page.waitForSelector('[data-testid="chat-textarea"]', { timeout: 10_000 });
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

// ──────────────────────────────────────────────────────────────────────────────
// 메인 테스트
// ──────────────────────────────────────────────────────────────────────────────

test.describe('기획 AI 실패 → UI 복구', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // T-01: typing-indicator 제거 확인
  // ──────────────────────────────────────────────────────────────────────────
  test('T-01: SSE error 수신 후 typing-indicator가 사라진다', async ({ page }) => {
    /**
     * 검증 근거:
     *   use-chat.ts:164  onError → setIsTyping(false)
     *   page.tsx:179     isTyping && !isStreamingMsg → <TypingIndicator>
     *
     * isTyping=false 이므로 조건식이 false → TypingIndicator가 DOM에서 제거되어야 한다.
     *
     * 주의: route.fulfill()은 응답 전체를 한 번에 전송하므로
     *   typing(true) → error 이벤트가 연속으로 처리된다.
     *   React 18 배칭으로 인해 isTyping=true 상태가 렌더링되지 않을 수 있으므로
     *   "표시됐다가 사라짐" 대신 "최종적으로 사라짐"을 단언한다.
     */
    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다. 다시 시도해 주세요.'),
      });
    });

    // 메시지 전송 → PLANNER LLM 실패 유발
    await page.fill('[data-testid="chat-textarea"]', 'FLUX Pro로 기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // [단언] error 배너가 나타난 이후를 기점으로 typing-indicator 상태를 확인
    // error-banner 가시성을 먼저 기다린 뒤 체크해야 경쟁 조건을 피할 수 있다
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });

    // typing-indicator는 이미 숨겨져 있어야 한다
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeHidden();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-02: textarea 재활성화 확인
  // ──────────────────────────────────────────────────────────────────────────
  test('T-02: SSE error 수신 후 textarea가 다시 활성화된다', async ({ page }) => {
    /**
     * 검증 근거:
     *   use-sse-stream.ts:122  finally → setIsStreaming(false)
     *   page.tsx:197           <ChatInput disabled={isStreaming}>
     *   chat-input.tsx         <textarea disabled={disabled}>
     *
     * isStreaming=false가 된 순간 disabled 속성이 제거되어야 한다.
     *
     * 타이밍 참고:
     *   error 이벤트 처리 → setIsTyping(false), setError(msg)  (isStreaming=true 유지)
     *   스트림 종료 (finally) → setIsStreaming(false)           (textarea 활성화)
     *   두 단계가 분리되어 있으므로 toBeEnabled에 충분한 timeout을 준다.
     */
    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다. 다시 시도해 주세요.'),
      });
    });

    const textarea = page.locator('[data-testid="chat-textarea"]');

    // 전송 전: textarea는 활성화 상태여야 한다
    await expect(textarea).toBeEnabled();

    await page.fill('[data-testid="chat-textarea"]', 'FLUX Pro로 기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // 전송 직후: isStreaming=true → textarea는 비활성화된다
    // (스트리밍 응답이 완료되기 전까지 disabled)
    // → 이 상태는 짧으므로 단언하지 않고 복구 상태만 검증한다

    // [단언 1] error-banner 등장 대기 (error 이벤트 처리 완료 기점)
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });

    // [단언 2] 스트림 종료 후 textarea는 반드시 활성화되어야 한다
    //          isStreaming=false (finally 블록) 이 반영될 때까지 대기
    await expect(textarea).toBeEnabled({ timeout: 5_000 });

    // [단언 3] 실제로 텍스트를 입력할 수 있어야 한다 (포커스 가능 상태 확인)
    await textarea.fill('다시 시도해볼게요');
    await expect(textarea).toHaveValue('다시 시도해볼게요');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-03: 에러 배너 내용 확인
  // ──────────────────────────────────────────────────────────────────────────
  test('T-03: 서버가 보낸 에러 메시지가 에러 배너에 그대로 표시된다', async ({ page }) => {
    /**
     * 검증 근거:
     *   use-chat.ts:163    onError → setError(errorMessage)
     *   page.tsx:188-193   {error && <div data-testid="error-banner"><p>{error}</p>}
     *
     * 서버가 SSE error 이벤트에 담아 보낸 message 값이
     * 그대로 error-banner 안에 렌더링되어야 한다.
     */
    const SERVER_ERROR_MESSAGE = 'Gemini API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';

    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse(SERVER_ERROR_MESSAGE),
      });
    });

    await page.fill('[data-testid="chat-textarea"]', '기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // [단언] 에러 배너가 보이고 정확한 메시지를 포함한다
    const errorBanner = page.locator('[data-testid="error-banner"]');
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });
    await expect(errorBanner).toContainText(SERVER_ERROR_MESSAGE);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-04: 에러 후 재전송 가능 확인 (send-button 활성화)
  // ──────────────────────────────────────────────────────────────────────────
  test('T-04: 에러 복구 후 send-button이 활성화되고 재전송할 수 있다', async ({ page }) => {
    /**
     * 검증 근거:
     *   chat-input.tsx  send-button disabled 조건:
     *     disabled || isUploading || (!message.trim() && attachments.length === 0)
     *
     *   에러 후 disabled(=isStreaming)=false 이므로,
     *   textarea에 텍스트가 있으면 send-button이 활성화된다.
     */
    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다.'),
      });
    });

    // 1차 전송 → 실패 유발
    await page.fill('[data-testid="chat-textarea"]', '기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // error-banner 등장 대기
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });

    // [단언] 텍스트 입력 후 send-button 활성화
    await page.fill('[data-testid="chat-textarea"]', '다시 기획해줘');
    await expect(page.locator('[data-testid="send-button"]')).toBeEnabled({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-05: 에러 후 실제 재전송 → 정상 응답 수신
  // ──────────────────────────────────────────────────────────────────────────
  test('T-05: 에러 복구 후 재전송 시 정상 기획안을 수신한다', async ({ page }) => {
    /**
     * 검증 근거:
     *   1차 POST → SSE error → UI 복구
     *   2차 POST → 정상 SSE → 기획안 메시지 렌더링
     *
     *   재전송 시 sendMessage 내부에서 setError(null)을 먼저 호출하므로
     *   (use-chat.ts:252) error-banner도 사라져야 한다.
     */
    const RETRY_PLAN = '📋 기획안을 다시 작성했습니다. 섹션: HERO, FEATURES, FAQ';

    await setupPlanningErrorScenario(page, async (route, callCount) => {
      if (callCount === 1) {
        // 1차: 실패
        await route.fulfill({
          status: 200,
          headers: SSE_HEADERS,
          body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다.'),
        });
      } else {
        // 2차: 성공 (Feedback → Planning 복귀 시뮬레이션)
        await route.fulfill({
          status: 200,
          headers: SSE_HEADERS,
          body: buildSSEWithDoneData(RETRY_PLAN, {
            status: 'await_input',
            currentAgent: 'PLANNER',
            collectedData: { plannedSections: ['HERO', 'FEATURES', 'FAQ'] },
          }),
        });
      }
    });

    // 1차 전송 → 실패
    await page.fill('[data-testid="chat-textarea"]', '기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="chat-textarea"]')).toBeEnabled({ timeout: 5_000 });

    // 2차 전송 → 성공
    await page.fill('[data-testid="chat-textarea"]', '다시 기획해줘');
    await page.locator('[data-testid="send-button"]').click();

    // [단언 1] 재전송 시 setError(null) 호출 → 에러 배너 사라짐
    await expect(page.locator('[data-testid="error-banner"]')).toBeHidden({ timeout: 5_000 });

    // [단언 2] 정상 기획안 메시지가 채팅에 나타남
    await expect(
      page.locator('[data-testid="message-item"]').filter({ hasText: '기획안을 다시 작성했습니다' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // [단언 3] typing-indicator가 없음 (응답 완료 상태)
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeHidden();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-06: 에러 후 빈 ghost 메시지가 화면에 남지 않음
  // ──────────────────────────────────────────────────────────────────────────
  test('T-06: 에러 발생 시 빈 assistant 메시지 버블이 화면에 표시되지 않는다', async ({
    page,
  }) => {
    /**
     * 버그 방어 테스트:
     *   onTyping(true) 에서 { id: tempId, content: '', isStreaming: true } 메시지를 추가.
     *   onError에서는 이 메시지를 제거하지 않는다 (onDone에서만 정리).
     *   → content가 빈 assistant 메시지가 DOM에 렌더링될 수 있음.
     *
     *   page.tsx:179의 TypingIndicator 조건:
     *     isTyping && !messages.some(m => m.isStreaming)
     *   온전한 상태라면 content='', isStreaming=true 메시지가 남아있어도
     *   MessageItem 컴포넌트가 빈 content를 어떻게 처리하는지 확인한다.
     */
    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다.'),
      });
    });

    const userMessageText = 'FLUX Pro로 기획 시작해줘';
    await page.fill('[data-testid="chat-textarea"]', userMessageText);
    await page.locator('[data-testid="send-button"]').click();

    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });

    // [단언] message-item 중 텍스트가 없는(빈) assistant 버블이 없어야 한다
    //        role=assistant이면서 보이는 텍스트가 없는 버블을 확인
    const allMessageItems = page.locator('[data-testid="message-item"]');
    const count = await allMessageItems.count();

    for (let i = 0; i < count; i++) {
      const item = allMessageItems.nth(i);
      const text = await item.innerText();
      // 완전히 빈 메시지 버블이면 안 됨 (공백만 있는 경우 포함)
      expect(text.trim()).not.toBe('');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-07: 에러 후 URL 이탈 없음 확인
  // ──────────────────────────────────────────────────────────────────────────
  test('T-07: 에러 발생 시 로비나 로그인 페이지로 이탈하지 않는다', async ({ page }) => {
    await setupPlanningErrorScenario(page, async (route) => {
      await route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: buildSSEErrorResponse('AI 플랜 생성에 실패했습니다.'),
      });
    });

    await page.fill('[data-testid="chat-textarea"]', '기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 10_000 });

    // [단언 1] 채팅 페이지 URL 유지
    await expect(page).toHaveURL(/\/dashboard\/chat\//);

    // [단언 2] 로그인 페이지나 루트로 이탈하지 않음
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/^http:\/\/[^/]+\/$/);

    // [단언 3] 에디터(projects)로도 이탈하지 않음
    await expect(page).not.toHaveURL(/\/projects\//);
  });
});
