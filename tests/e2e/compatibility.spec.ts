/**
 * Cross-Browser Compatibility Tests
 *
 * Chrome / Firefox / WebKit(Safari) 세 환경에서 채팅 UI가 정상적으로
 * 렌더링되는지 검증합니다.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  TC-01  채팅 목록 페이지 — 빈 상태 핵심 UI 렌더링               │
 * │  TC-02  채팅 목록 페이지 — 대화 항목 렌더링                     │
 * │  TC-03  채팅 대화 페이지 — 입력창 및 헤더 렌더링                │
 * │  TC-04  채팅 대화 페이지 — SSE 스트리밍 후 메시지 렌더링        │
 * │  TC-05  에러 배너 — API 오류 시 에러 배너 렌더링                │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ─── 로그 포맷 (표 정리용) ────────────────────────────────────────
 *  [COMPAT] | <browser> | <TC-ID> | PASS/FAIL | <duration_ms>ms | <detail>
 *
 * ─── 실행 ─────────────────────────────────────────────────────────
 *  모든 브라우저:  npx playwright test compatibility.spec.ts
 *  특정 브라우저: npx playwright test compatibility.spec.ts --project=compat-firefox
 *  결과 보고서:   npx playwright show-report
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import {
  MOCK_CONVERSATION_ID,
  MOCK_WELCOME_MESSAGE,
  buildSSEResponse,
  buildSSEErrorResponse,
} from './helpers/chat-mocks';

// ─── 로그 유틸리티 ──────────────────────────────────────────────────────────

type TestResult = {
  browser: string;
  tcId: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  detail: string;
};

/** 모듈 범위 결과 배열 — afterAll 에서 표로 출력 */
const results: TestResult[] = [];

/**
 * 구조화된 호환성 로그를 남깁니다.
 * CI/로컬 모두에서 grep 하기 쉬운 단일 줄 형식입니다.
 *
 * 출력 예시:
 *   [COMPAT] | chromium | TC-01 | PASS | 342ms | 채팅 목록 빈 상태 렌더링 확인
 */
function logResult(result: TestResult): void {
  results.push(result);
  const { browser, tcId, status, durationMs, detail } = result;
  console.log(
    `[COMPAT] | ${browser.padEnd(14)} | ${tcId} | ${status.padEnd(4)} | ${String(durationMs).padStart(6)}ms | ${detail}`
  );
}

/** 밀리초 단위 경과 시간 측정용 타이머 */
function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

// ─── API 모킹 헬퍼 ──────────────────────────────────────────────────────────

/** GET /api/chat — 대화 목록 응답 모킹 */
async function mockChatList(
  page: Page,
  conversations: object[] = []
): Promise<void> {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conversations }),
    });
  });
}

/** POST /api/chat — 새 대화 생성 모킹 */
async function mockCreateConversation(page: Page): Promise<void> {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        conversationId: MOCK_CONVERSATION_ID,
        status: 'ACTIVE',
      }),
    });
  });
}

/** GET + POST /api/chat/{id}/messages — 초기 메시지 + SSE 응답 모킹 */
async function mockMessagesEndpoint(
  page: Page,
  options: { replyContent?: string; errorMessage?: string } = {}
): Promise<void> {
  await page.route(
    `**/api/chat/${MOCK_CONVERSATION_ID}/messages`,
    async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messages: [MOCK_WELCOME_MESSAGE] }),
        });
        return;
      }

      if (method === 'POST') {
        const body = options.errorMessage
          ? buildSSEErrorResponse(options.errorMessage)
          : buildSSEResponse(
              options.replyContent ?? '테스트 응답입니다.',
              `ai-msg-${Date.now()}`
            );

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body,
        });
        return;
      }

      await route.continue();
    }
  );
}

/** 채팅 목록 페이지 → 새 대화 클릭 → 채팅 페이지 진입까지 수행 */
async function navigateToChatPage(page: Page): Promise<void> {
  await mockCreateConversation(page);
  await mockMessagesEndpoint(page);

  const newChatBtn = page
    .getByTestId('new-chat-button')
    .or(page.getByRole('button', { name: '새 대화' }))
    .or(page.getByRole('button', { name: '첫 대화 시작하기' }));

  await newChatBtn.first().click();

  await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
    timeout: 10_000,
  });
  await page.waitForSelector('[data-testid="chat-textarea"]', {
    timeout: 10_000,
  });
}

// ─── 샘플 대화 픽스처 ───────────────────────────────────────────────────────

const SAMPLE_CONVERSATION = {
  id: 'conv-sample-001',
  title: '에어팟 프로 케이스 상세페이지',
  status: 'ACTIVE' as const,
  currentAgent: 'COORDINATOR',
  projectId: null,
  createdAt: new Date(Date.now() - 60_000 * 10).toISOString(),
  updatedAt: new Date(Date.now() - 60_000 * 2).toISOString(),
  messageCount: 5,
  lastMessage: '이미지 생성 모델을 선택해 주세요.',
};

// ─── 테스트 스위트 ──────────────────────────────────────────────────────────

test.describe('Cross-Browser Compatibility', () => {
  // 각 테스트가 독립적인 페이지를 사용하도록 보장
  test.describe.configure({ mode: 'serial' });

  // ── 결과 요약 표 출력 ────────────────────────────────────────────────────
  test.afterAll(() => {
    if (results.length === 0) return;

    const sep = '─'.repeat(80);
    console.log(`\n${sep}`);
    console.log('[COMPAT] 호환성 테스트 결과 요약');
    console.log(sep);
    console.log(
      `${'브라우저'.padEnd(16)} ${'TC-ID'.padEnd(8)} ${'결과'.padEnd(6)} ${'소요(ms)'.padStart(9)}  세부사항`
    );
    console.log(sep);

    for (const r of results) {
      const statusMark = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      console.log(
        `${r.browser.padEnd(16)} ${r.tcId.padEnd(8)} ${statusMark.padEnd(8)} ${String(r.durationMs).padStart(7)}ms  ${r.detail}`
      );
    }

    const total = results.length;
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = total - passed;
    console.log(sep);
    console.log(
      `[COMPAT] 합계: 전체 ${total}건 | ✅ PASS ${passed}건 | ❌ FAIL ${failed}건`
    );
    console.log(`${sep}\n`);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-01: 채팅 목록 페이지 — 빈 상태 핵심 UI 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  test('TC-01: 채팅 목록 페이지 빈 상태 UI 렌더링', async ({
    page,
    browserName,
  }) => {
    const elapsed = startTimer();

    await mockChatList(page, []); // 빈 목록
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // 페이지 제목 (exact: true — '아직 대화가 없습니다' 등 다른 heading과 구분)
    await expect(page.getByRole('heading', { name: '대화', exact: true })).toBeVisible();

    // 서브타이틀
    await expect(
      page.getByText('AI와 대화하며 프로젝트를 만들어보세요')
    ).toBeVisible();

    // 상단 새 대화 버튼
    await expect(page.getByTestId('new-chat-button').first()).toBeVisible();

    // 빈 상태 안내 텍스트
    await expect(page.getByText('아직 대화가 없습니다')).toBeVisible();

    // 빈 상태 CTA 버튼 (두 번째 new-chat-button)
    await expect(
      page.getByRole('button', { name: '첫 대화 시작하기' })
    ).toBeVisible();

    logResult({
      browser: browserName,
      tcId: 'TC-01',
      status: 'PASS',
      durationMs: elapsed(),
      detail: '채팅 목록 빈 상태: 제목·서브타이틀·새 대화 버튼·CTA 렌더링 확인',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-02: 채팅 목록 페이지 — 대화 항목 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  test('TC-02: 채팅 목록 페이지 대화 항목 렌더링', async ({
    page,
    browserName,
  }) => {
    const elapsed = startTimer();

    await mockChatList(page, [SAMPLE_CONVERSATION]);
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // 대화 제목
    await expect(
      page.getByText('에어팟 프로 케이스 상세페이지')
    ).toBeVisible();

    // 상태 배지 (진행 중)
    await expect(page.getByText('진행 중')).toBeVisible();

    // 마지막 메시지 미리보기
    await expect(
      page.getByText('이미지 생성 모델을 선택해 주세요.')
    ).toBeVisible();

    // 메시지 수 표시
    await expect(page.getByText('5개 메시지')).toBeVisible();

    logResult({
      browser: browserName,
      tcId: 'TC-02',
      status: 'PASS',
      durationMs: elapsed(),
      detail:
        '대화 항목: 제목·상태 배지·마지막 메시지·메시지 수 렌더링 확인',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-03: 채팅 대화 페이지 — 입력창 및 헤더 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  test('TC-03: 채팅 대화 페이지 입력창·헤더 렌더링', async ({
    page,
    browserName,
  }) => {
    const elapsed = startTimer();

    await mockChatList(page, []);
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    await navigateToChatPage(page);

    // 헤더 — 뒤로가기 버튼 (data-testid="back-button")
    await expect(page.getByTestId('back-button')).toBeVisible();

    // 헤더 — 페이지 제목
    await expect(page.getByRole('heading', { name: '새 프로젝트' })).toBeVisible();

    // 웰컴 메시지 (초기 AI 메시지)
    await expect(
      page.getByText('상세페이지 생성 도우미')
    ).toBeVisible();

    // 채팅 입력 textarea
    const textarea = page.getByTestId('chat-textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();

    // placeholder 텍스트
    await expect(textarea).toHaveAttribute(
      'placeholder',
      /메시지를 입력하세요/
    );

    logResult({
      browser: browserName,
      tcId: 'TC-03',
      status: 'PASS',
      durationMs: elapsed(),
      detail:
        '채팅 대화 페이지: 뒤로가기·제목·웰컴 메시지·textarea·placeholder 렌더링 확인',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-04: 채팅 대화 페이지 — SSE 스트리밍 후 AI 메시지 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  test('TC-04: SSE 스트리밍 후 AI 메시지 렌더링', async ({
    page,
    browserName,
  }) => {
    const elapsed = startTimer();

    const AI_REPLY = '안녕하세요! 어떤 제품의 상세페이지를 만들까요?';

    await mockChatList(page, []);
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // messages 엔드포인트를 AI_REPLY로 설정 후 채팅 페이지 진입
    await mockCreateConversation(page);
    await page.route(
      `**/api/chat/${MOCK_CONVERSATION_ID}/messages`,
      async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ messages: [MOCK_WELCOME_MESSAGE] }),
          });
          return;
        }
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
            body: buildSSEResponse(AI_REPLY, `ai-msg-${Date.now()}`),
          });
          return;
        }
        await route.continue();
      }
    );

    const newChatBtn = page
      .getByTestId('new-chat-button')
      .or(page.getByRole('button', { name: '첫 대화 시작하기' }));
    await newChatBtn.first().click();
    await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
      timeout: 10_000,
    });
    await page.waitForSelector('[data-testid="chat-textarea"]', {
      timeout: 10_000,
    });

    // 메시지 전송
    const textarea = page.getByTestId('chat-textarea');
    await textarea.fill('상세페이지 만들어줘');
    await textarea.press('Enter');

    // AI 응답 메시지가 렌더링될 때까지 대기 (최대 10초)
    await expect(page.getByText(AI_REPLY)).toBeVisible({ timeout: 10_000 });

    // 스트리밍 완료 후 textarea가 다시 활성화되어 있어야 함
    await expect(textarea).toBeEnabled({ timeout: 5_000 });

    // 에러 배너가 없어야 함
    await expect(page.getByTestId('error-banner')).not.toBeVisible();

    logResult({
      browser: browserName,
      tcId: 'TC-04',
      status: 'PASS',
      durationMs: elapsed(),
      detail:
        'SSE 스트리밍: AI 응답 텍스트 렌더링 및 textarea 재활성화·에러 없음 확인',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-05: 에러 배너 — API 오류 시 에러 배너 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  test('TC-05: API 오류 시 에러 배너 렌더링', async ({
    page,
    browserName,
  }) => {
    const elapsed = startTimer();

    const ERROR_MSG = 'AI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    await mockChatList(page, []);
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    await mockCreateConversation(page);
    await page.route(
      `**/api/chat/${MOCK_CONVERSATION_ID}/messages`,
      async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ messages: [MOCK_WELCOME_MESSAGE] }),
          });
          return;
        }
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
            body: buildSSEErrorResponse(ERROR_MSG),
          });
          return;
        }
        await route.continue();
      }
    );

    const newChatBtn = page
      .getByTestId('new-chat-button')
      .or(page.getByRole('button', { name: '첫 대화 시작하기' }));
    await newChatBtn.first().click();
    await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
      timeout: 10_000,
    });
    await page.waitForSelector('[data-testid="chat-textarea"]', {
      timeout: 10_000,
    });

    // 메시지 전송 → 에러 SSE 수신
    const textarea = page.getByTestId('chat-textarea');
    await textarea.fill('상세페이지 만들어줘');
    await textarea.press('Enter');

    // 에러 배너 렌더링 확인
    const errorBanner = page.getByTestId('error-banner');
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });
    await expect(errorBanner).toContainText(ERROR_MSG);

    // 에러 후 textarea가 다시 활성화되어 있어야 함
    await expect(textarea).toBeEnabled({ timeout: 5_000 });

    // URL이 채팅 페이지를 유지해야 함
    expect(page.url()).toContain(`/dashboard/chat/${MOCK_CONVERSATION_ID}`);

    logResult({
      browser: browserName,
      tcId: 'TC-05',
      status: 'PASS',
      durationMs: elapsed(),
      detail:
        '에러 배너: 오류 메시지 표시·textarea 재활성화·URL 유지 확인',
    });
  });
});
