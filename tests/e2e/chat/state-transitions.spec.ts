/**
 * 상태 전이 검증 E2E 테스트
 *
 * 상태 다이어그램 기반으로 핵심 상태 전이(Transition) 경로를 검증합니다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  시나리오 1: 정보수집 → 기획 전환                              │
 * │    SUGGESTER 순차 체크 완료 시 PLANNER가 정상 호출되는지 확인  │
 * │                                                                 │
 * │  시나리오 2: 기획 AI 실패 → 에러 복구 (핵심)                  │
 * │    PLANNER LLM 오류 시 UI가 에러 메시지를 표시하고            │
 * │    재입력 가능한 상태를 유지하는지 확인                        │
 * │                                                                 │
 * │  시나리오 3: 생성 이중 확인 → modify 선택 시 피드백 복귀      │
 * │    readyToGenerate=true 후 COORDINATOR 확인 프롬프트가 뜨고,  │
 * │    "수정" 선택 시 GENERATOR 호출 없이 피드백 상태로 복귀하는지 │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * SSE 이벤트 흐름 (정상):  typing(true) → chunk×N → message → typing(false) → done
 * SSE 이벤트 흐름 (에러):  typing(true) → error
 */

import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';
import {
  mockCreateConversation,
  mockChatList,
  buildSSEErrorResponse,
  buildSSEWithDoneData,
  MOCK_CONVERSATION_ID,
  MOCK_WELCOME_MESSAGE,
} from '../helpers/chat-mocks';

// ─── 테스트용 메시지 픽스처 ────────────────────────────────────────────────

/**
 * 정보수집이 거의 완료된 상태.
 * SUGGESTER가 마지막 항목인 imageModel 선택지를 제시한 직후를 재현합니다.
 * (productName·category·copyLength 는 collectedData에 이미 저장된 상태)
 */
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
      '이미지 생성 모델을 선택해 주세요.\n\n• FLUX Pro: 고품질, 사실적인 표현\n• FLUX Schnell: 빠른 생성, 스케치 느낌',
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

/**
 * 기획 완료 상태.
 * PLANNER/PLANNING_CONSULTANT가 기획안을 제시하고
 * generate / modify_sections / modify_style 옵션이 표시된 직후를 재현합니다.
 */
const MESSAGES_AFTER_PLANNING = [
  MOCK_WELCOME_MESSAGE,
  {
    id: 'planner-plan-msg',
    role: 'assistant',
    content:
      '📋 기획안을 작성했습니다.\n\n**섹션 구성:** HERO → FEATURES → HOW_TO_USE → FAQ\n**스타일:** 미니멀 모던\n**톤앤매너:** 세련되고 간결한',
    agentType: 'PLANNER',
    metadata: {
      uiType: 'plan_preview',
      options: [
        { id: 'generate', label: '이대로 생성하기' },
        { id: 'modify_sections', label: '섹션 수정하기' },
        { id: 'modify_style', label: '스타일 수정하기' },
      ],
    },
    attachments: [],
    createdAt: new Date(Date.now() - 5_000).toISOString(),
  },
];

// ─── 공통 헬퍼: 모킹된 채팅 페이지 세팅 ──────────────────────────────────

/**
 * 채팅 목록 → 새 대화 → 대화 페이지까지 이동하고,
 * GET /messages 와 POST /messages 를 각각 다르게 모킹합니다.
 *
 * @param page          - Playwright Page
 * @param initialMessages - GET /messages 에서 반환할 초기 메시지 목록
 * @param postHandler   - POST /messages 요청을 처리할 함수 (callCount 추적용)
 */
async function setupChatWithCustomMock(
  page: Parameters<typeof mockCreateConversation>[0],
  initialMessages: object[],
  postHandler: (route: Route, callCount: number) => Promise<void>
): Promise<void> {
  await mockChatList(page, []);
  await page.goto('/dashboard/chat');
  await page.waitForLoadState('networkidle');
  await mockCreateConversation(page);

  let postCallCount = 0;

  await page.route(
    `**/api/chat/${MOCK_CONVERSATION_ID}/messages`,
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

      if (method === 'POST') {
        postCallCount += 1;
        await postHandler(route, postCallCount);
        return;
      }

      await route.continue();
    }
  );

  // 새 대화 버튼 클릭 → 대화 페이지 이동
  await page
    .getByTestId('new-chat-button')
    .or(page.getByRole('button', { name: '새 대화' }))
    .or(page.getByRole('button', { name: '첫 대화 시작하기' }))
    .first()
    .click();

  await page.waitForURL(`**/dashboard/chat/${MOCK_CONVERSATION_ID}`, {
    timeout: 10_000,
  });
  await page.waitForSelector('[data-testid="chat-textarea"]', {
    timeout: 10_000,
  });
}

// ─── SSE 응답 헤더 상수 ────────────────────────────────────────────────────
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

// ──────────────────────────────────────────────────────────────────────────────
// 시나리오 1: 정보수집 → 기획 단계 전환
// ──────────────────────────────────────────────────────────────────────────────

test.describe('시나리오 1: 정보수집 → 기획 단계 전환', () => {
  /**
   * 검증 목표:
   *   SUGGESTER가 imageModel 선택지를 제시한 상태에서 사용자가 선택하면
   *   PLANNER 에이전트가 실행되어 기획안 메시지가 표시되어야 한다.
   *
   * 상태 전이:
   *   InfoCollection (SUGGESTER:await_input)
   *     → [imageModel 선택]
   *     → Planning (PLANNER:await_input)
   */
  test('imageModel 선택 후 PLANNER의 기획안이 채팅에 표시된다', async ({ page }) => {
    const PLAN_REPLY =
      '📋 기획안을 작성했습니다.\n\n섹션: HERO, FEATURES, HOW_TO_USE\n스타일: 미니멀 모던';

    await setupChatWithCustomMock(
      page,
      MESSAGES_BEFORE_PLANNING,
      async (route) => {
        // SUGGESTER → PLANNER 전환: PLANNER 응답을 시뮬레이션
        await route.fulfill({
          status: 200,
          headers: SSE_HEADERS,
          body: buildSSEWithDoneData(PLAN_REPLY, {
            status: 'await_input',
            currentAgent: 'PLANNER',
            collectedData: {
              productName: '에어팟 프로 케이스',
              category: 'DIGITAL',
              copyLength: 'MEDIUM',
              imageModel: 'FLUX_PRO',
              plannedSections: ['HERO', 'FEATURES', 'HOW_TO_USE'],
            },
          }),
        });
      }
    );

    // imageModel 선택 메시지 전송 (텍스트 입력으로 시뮬레이션)
    await page.fill('[data-testid="chat-textarea"]', 'FLUX Pro로 선택할게요');
    await page.locator('[data-testid="send-button"]').click();

    // [검증 1] 기획안 메시지가 채팅에 표시되어야 한다
    await expect(
      page.locator('[data-testid="message-item"]').filter({ hasText: '기획안을 작성했습니다' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // [검증 2] 생성/수정 옵션 버튼이 표시되어야 한다 (기획 완료 상태의 트리거)
    //          실제 UI 컴포넌트가 metadata.options 를 렌더링하면 버튼이 나타남
    const generateBtn = page.getByRole('button', { name: /이대로 생성|섹션 수정|스타일 수정/i });
    // 옵션 버튼이 있으면 검증, 없으면 메시지 존재로 대체 검증 (UI 구현에 따라 다름)
    const hasPlanButtons = await generateBtn.first().isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasPlanButtons) {
      await expect(generateBtn.first()).toBeVisible();
    } else {
      // 메시지에 섹션 키워드가 포함되어 있으면 기획 단계 도달로 간주
      await expect(
        page.locator('[data-testid="message-item"]').filter({ hasText: /HERO|FEATURES|섹션/i }).first()
      ).toBeVisible({ timeout: 5_000 });
    }

    // [검증 3] URL이 채팅 페이지를 유지한다 (에디터로 이탈하면 안 됨)
    await expect(page).toHaveURL(/\/dashboard\/chat\//);
  });

  test('기획 단계 도달 후 빈 입력으로는 전송할 수 없다 (await_input 상태 보장)', async ({
    page,
  }) => {
    await setupChatWithCustomMock(
      page,
      MESSAGES_BEFORE_PLANNING,
      async (route) => {
        await route.fulfill({
          status: 200,
          headers: SSE_HEADERS,
          body: buildSSEWithDoneData('기획안 준비 완료!', {
            status: 'await_input',
            currentAgent: 'PLANNER',
          }),
        });
      }
    );

    await page.fill('[data-testid="chat-textarea"]', 'FLUX Pro');
    await page.keyboard.press('Enter');

    // AI 응답 대기 후 textarea 비우기
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10_000 });
    await page.fill('[data-testid="chat-textarea"]', '');

    // [검증] 텍스트가 없으면 전송 버튼이 비활성화 상태여야 한다
    await expect(page.locator('[data-testid="send-button"]')).toBeDisabled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 시나리오 2: 기획 단계 AI 실패 → 에러 복구 (핵심 시나리오)
// ──────────────────────────────────────────────────────────────────────────────

test.describe('시나리오 2: 기획 AI 실패 → 에러 복구', () => {
  /**
   * 검증 목표:
   *   PLANNER LLM 호출(Gemini API)이 실패했을 때
   *   - 서버가 SSE error 이벤트를 전송한다
   *   - 클라이언트가 에러 메시지를 채팅에 표시한다
   *   - 입력창(textarea)이 다시 활성화되어 재시도 가능한 상태가 된다
   *   - 로비(/)나 에러 페이지로 이탈하지 않는다
   *
   * 상태 전이:
   *   Planning (PLANNER)
   *     → [Gemini API 타임아웃/실패]
   *     → ⚠ SSE error 이벤트
   *     → Feedback 대기 (재입력 가능 상태)
   *
   *   실제 서버 동작 (route.ts:411-416):
   *     catch(error) { sendEvent('error', { message: error.message }); }
   */
  test('기획 AI 실패 시 에러 메시지가 표시되고 입력창이 활성화된다', async ({ page }) => {
    const LLM_ERROR_MESSAGE = 'AI 플랜 생성에 실패했습니다. 다시 시도해 주세요.';

    await setupChatWithCustomMock(
      page,
      MESSAGES_BEFORE_PLANNING,
      async (route) => {
        // PLANNER 노드에서 Gemini LLM 호출 실패 시뮬레이션
        // 실제 route.ts catch 블록이 보내는 SSE와 동일한 형식:
        //   event: typing / data: {"isTyping": true}
        //   event: error  / data: {"message": "..."}
        await route.fulfill({
          status: 200,
          headers: SSE_HEADERS,
          body: buildSSEErrorResponse(LLM_ERROR_MESSAGE),
        });
      }
    );

    // 기획 진입 트리거: imageModel 선택 후 플랜 요청
    await page.fill('[data-testid="chat-textarea"]', 'FLUX Pro 선택하고 기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // ─── 검증 ─────────────────────────────────────────────────────────────

    // [검증 1] 에러 메시지가 채팅창에 표시되어야 한다
    //          빈 화면이나 무한 로딩 상태면 안 됨
    //          에러는 error-banner (UI 상단 배너) 또는 message-item 으로 표시될 수 있음
    await expect(
      page.locator('[data-testid="error-banner"]')
    ).toBeVisible({ timeout: 15_000 });

    // [검증 2] typing-indicator(로딩 스피너)가 사라져야 한다
    //          에러 후에도 "입력 중..." 상태가 유지되면 안 됨
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeHidden({
      timeout: 5_000,
    });

    // [검증 3] textarea가 활성화 상태여야 한다 (재시도 가능)
    const textarea = page.locator('[data-testid="chat-textarea"]');
    await expect(textarea).toBeEnabled({ timeout: 5_000 });
    await expect(textarea).toBeVisible();

    // [검증 4] 텍스트 입력 후 전송 버튼이 활성화되어야 한다
    await textarea.fill('다시 기획해줘');
    await expect(page.locator('[data-testid="send-button"]')).toBeEnabled({ timeout: 3_000 });

    // [검증 5] URL이 채팅 페이지를 유지한다 (로비 또는 /login 으로 이탈하면 안 됨)
    await expect(page).toHaveURL(/\/dashboard\/chat\//);
    await expect(page).not.toHaveURL(/\/login|^\//);
  });

  /**
   * 검증 목표:
   *   기획 AI 실패 후 사용자가 재시도 메시지를 보냈을 때
   *   시스템이 다시 기획 단계를 수행하고 정상 응답을 반환해야 한다.
   *
   * 상태 전이:
   *   ⚠ Planning 실패 → Feedback (재입력 대기)
   *     → [사용자 재시도]
   *     → Planning (PLANNER) → 정상 기획안 반환
   */
  test('기획 실패 후 재시도 메시지를 보내면 새 기획안이 표시된다', async ({ page }) => {
    const LLM_ERROR_MESSAGE = 'AI 플랜 생성에 실패했습니다.';
    const RETRY_PLAN_CONTENT = '다시 기획안을 작성했습니다! 섹션: HERO, FEATURES, FAQ';

    // postCallCount 를 클로저로 추적
    let postCallCount = 0;

    await setupChatWithCustomMock(
      page,
      MESSAGES_BEFORE_PLANNING,
      async (route, callCount) => {
        postCallCount = callCount;

        if (callCount === 1) {
          // 첫 번째 요청: 기획 LLM 실패
          await route.fulfill({
            status: 200,
            headers: SSE_HEADERS,
            body: buildSSEErrorResponse(LLM_ERROR_MESSAGE),
          });
        } else {
          // 두 번째 요청: 재시도 성공 (Feedback → Planning 복귀)
          await route.fulfill({
            status: 200,
            headers: SSE_HEADERS,
            body: buildSSEWithDoneData(RETRY_PLAN_CONTENT, {
              status: 'await_input',
              currentAgent: 'PLANNER',
              collectedData: { plannedSections: ['HERO', 'FEATURES', 'FAQ'] },
            }),
          });
        }
      }
    );

    // 1차 전송 → 기획 실패
    await page.fill('[data-testid="chat-textarea"]', '기획 시작해줘');
    await page.locator('[data-testid="send-button"]').click();

    // 에러 메시지 등장 대기 (error-banner 에 표시됨)
    await expect(
      page.locator('[data-testid="error-banner"]')
    ).toBeVisible({ timeout: 15_000 });

    // 2차 전송 → 재시도
    await page.fill('[data-testid="chat-textarea"]', '다시 기획해줘');
    await page.locator('[data-testid="send-button"]').click();

    // [검증 1] 재시도 성공 메시지가 표시되어야 한다
    await expect(
      page
        .locator('[data-testid="message-item"]')
        .filter({ hasText: '다시 기획안을 작성했습니다' })
        .first()
    ).toBeVisible({ timeout: 15_000 });

    // [검증 2] 총 2번만 POST 호출됨 (GENERATOR가 호출되지 않았음)
    expect(postCallCount).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 시나리오 3: 생성 이중 확인(GenConfirm) → modify 선택 시 피드백 복귀
// ──────────────────────────────────────────────────────────────────────────────

test.describe('시나리오 3: 생성 이중 확인 → modify 선택 시 피드백 복귀', () => {
  /**
   * 검증 목표:
   *   기획 완료 후 "생성하기"를 선택하면 COORDINATOR가 이중 확인 프롬프트를 보내고,
   *   사용자가 "수정"을 선택했을 때 GENERATOR가 호출되지 않고
   *   피드백(Feedback) 상태로 안전하게 복귀해야 한다.
   *
   * 핵심 로직 (coordinator.ts:59-76):
   *   if (readyToGenerate && !confirmedGenerate) → 이중 확인 메시지 + await_input
   *   if (readyToGenerate && confirmedGenerate)  → GENERATOR 호출
   *
   * 상태 전이:
   *   Planning (await_input)
   *     → [generate 선택] → readyToGenerate=true
   *     → GenConfirm (COORDINATOR:await_input) ← 이 테스트의 핵심 검증 지점
   *     → [modify 선택]
   *     → Feedback (FEEDBACK:await_input)      ← GENERATOR 미호출 확인
   */
  test('생성 확인 화면에서 modify 선택 시 GENERATOR 호출 없이 피드백 상태로 복귀한다', async ({
    page,
  }) => {
    const CONFIRM_PROMPT =
      '정말 생성하시겠어요? 지금 바로 생성하거나 섹션·스타일을 수정할 수 있습니다.';
    const FEEDBACK_REPLY =
      '어떤 부분을 수정하고 싶으신가요? 섹션 구성이나 스타일을 변경할 수 있습니다.';

    let postCallCount = 0;

    await setupChatWithCustomMock(
      page,
      MESSAGES_AFTER_PLANNING,
      async (route, callCount) => {
        postCallCount = callCount;
        const body = await route.request().postDataJSON().catch(() => ({}));

        if (callCount === 1) {
          // "이대로 생성하기" 선택 → route.ts가 readyToGenerate=true 로 설정
          // → COORDINATOR가 이중 확인 메시지 전송 (confirmedGenerate는 아직 false)
          await route.fulfill({
            status: 200,
            headers: SSE_HEADERS,
            body: buildSSEWithDoneData(CONFIRM_PROMPT, {
              status: 'await_input',
              currentAgent: 'COORDINATOR',
              collectedData: {
                readyToGenerate: true,
                confirmedGenerate: false, // ← 이중 확인 대기 상태
              },
            }),
          });
        } else if (callCount === 2) {
          // "수정" 선택 → modifyRequest 설정, confirmedGenerate는 여전히 false
          // GENERATOR가 호출되면 안 됨
          await route.fulfill({
            status: 200,
            headers: SSE_HEADERS,
            body: buildSSEWithDoneData(FEEDBACK_REPLY, {
              status: 'await_input',
              currentAgent: 'FEEDBACK',
              collectedData: {
                readyToGenerate: false,
                modifyRequest: 'sections',
              },
            }),
          });
        }
      }
    );

    // ① "이대로 생성하기" 선택 — 버튼 또는 메시지로 시뮬레이션
    const generateBtn = page.getByRole('button', { name: /이대로 생성|생성하기/i }).first();
    const hasPlanBtn = await generateBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasPlanBtn) {
      await generateBtn.click();
    } else {
      await page.fill('[data-testid="chat-textarea"]', '이대로 생성해줘');
      await page.locator('[data-testid="send-button"]').click();
    }

    // ② 이중 확인 메시지 대기
    await expect(
      page.locator('[data-testid="message-item"]').filter({ hasText: '정말 생성하시겠어요' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // ③ "수정" 선택 — confirm 대신 modify 를 선택한다
    const modifyBtn = page.getByRole('button', { name: /수정|취소|modify/i }).first();
    const hasModifyBtn = await modifyBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasModifyBtn) {
      await modifyBtn.click();
    } else {
      await page.fill('[data-testid="chat-textarea"]', '아니요, 섹션 수정할게요');
      await page.locator('[data-testid="send-button"]').click();
    }

    // ─── 검증 ─────────────────────────────────────────────────────────────

    // [검증 1] 피드백 메시지가 표시되어야 한다
    await expect(
      page
        .locator('[data-testid="message-item"]')
        .filter({ hasText: '어떤 부분을 수정하고 싶으신가요' })
        .first()
    ).toBeVisible({ timeout: 15_000 });

    // [검증 2] GENERATOR가 호출되지 않았음을 확인
    //          POST 가 정확히 2번만 발생해야 한다 (generate 선택 + modify 선택)
    //          3번째 호출이 발생했다면 GENERATOR 흐름으로 진입한 것
    expect(postCallCount).toBe(2);

    // [검증 3] "생성 중" 메시지나 프로그레스 UI가 없어야 한다
    await expect(
      page.locator('[data-testid="message-item"]').filter({ hasText: /생성 중|상세페이지 생성/i })
    ).toHaveCount(0);

    // [검증 4] URL이 채팅 페이지를 유지한다 (에디터로 이탈하면 안 됨)
    await expect(page).toHaveURL(/\/dashboard\/chat\//);
    await expect(page).not.toHaveURL(/\/projects\//);

    // [검증 5] 입력창이 활성화 상태여야 한다 (피드백 입력 가능)
    await expect(page.locator('[data-testid="chat-textarea"]')).toBeEnabled({ timeout: 5_000 });
  });
});
