/**
 * 채팅 서비스 E2E 테스트 (Playwright)
 *
 * 시나리오:
 *   1. 로그인 후 메시지 전송
 *   2. 스트리밍 응답 확인
 *   3. 이미지 첨부 시 정상 표시 여부
 *
 * 실행 방법:
 *   npx playwright test tests/e2e/chat/chat.spec.ts
 *   npx playwright test --ui   ← 대화형 UI 모드
 *
 * 사전 조건:
 *   - 개발 서버가 실행 중이거나 webServer 설정으로 자동 시작됨
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD 환경 변수 설정 (또는 기본값 사용)
 *   - auth.setup.ts 가 먼저 실행되어 .auth/user.json 에 세션이 저장됨.
 *
 * 모킹 전략:
 *   - AI 응답(LangGraph/Gemini): SSE 포맷으로 완전 모킹
 *   - 이미지 업로드(R2/Cloudflare): 모킹
 *   - 인증, 대화 생성, DB 저장: 실제 서버 사용
 *
 * [SSE 중간 상태 테스트 한계]
 *   Playwright의 route.fulfill()은 SSE body를 한 번에 전송합니다.
 *   브라우저는 전체 body를 수신 후 React state를 일괄 업데이트(batching)하므로,
 *   typing indicator와 streaming cursor 같은 중간 상태는 눈 깜짝할 순간에만 존재합니다.
 *   → delayMs 옵션으로 SSE 응답 전 지연을 주어 isStreaming=true 상태를 관찰합니다.
 *   → 진정한 chunk-by-chunk 스트리밍 테스트는 실제 서버(또는 mock SSE 서버)가 필요합니다.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import {
  MOCK_CONVERSATION_ID,
  MOCK_WELCOME_MESSAGE,
  setupAndNavigateToChatPage,
  mockMessagesEndpoint,
  mockImageUpload,
  SAMPLE_IMAGE_PATH,
  TINY_PNG_BUFFER,
} from '../helpers/chat-mocks';

/** 샘플 이미지 버퍼 (tests/e2e/fixtures/sample-product.png) */
const SAMPLE_IMAGE_BUFFER = fs.readFileSync(SAMPLE_IMAGE_PATH);

// ───────────────────────────────────────────────────────────────────────────
// 공통 상수
// ───────────────────────────────────────────────────────────────────────────

const USER_MESSAGE = '화장품 상세페이지 만들어주세요';
const AI_REPLY =
  '안녕하세요! 화장품 상세페이지를 도와드릴게요. 어떤 제품인지 알려주시겠어요?';
const IMAGE_CDN_URL = 'https://cdn.example.com/test-product.jpg';

// ═══════════════════════════════════════════════════════════════════════════
// 시나리오 1: 로그인 후 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

test.describe('시나리오 1: 로그인 후 메시지 전송', () => {
  // storageState 덕분에 이미 로그인된 상태로 시작

  test('로그인 후 채팅 목록 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/dashboard/chat');

    // 로그인 페이지로 리다이렉트되지 않아야 함
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/dashboard\/chat/);

    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '대화' })).toBeVisible();
  });

  test('새 대화를 시작하면 채팅 입력창이 표시된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    // 입력창 확인
    const textarea = page.getByTestId('chat-textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();

    // 웰컴 메시지 확인
    await expect(
      page.getByTestId('message-item').first()
    ).toContainText('안녕하세요');
  });

  test('메시지를 입력하고 Enter로 전송하면 사용자 메시지가 즉시 표시된다', async ({
    page,
  }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    const textarea = page.getByTestId('chat-textarea');
    await textarea.fill(USER_MESSAGE);
    await expect(textarea).toHaveValue(USER_MESSAGE);

    // Enter 전송
    await textarea.press('Enter');

    // 입력창 초기화 확인
    await expect(textarea).toHaveValue('', { timeout: 3_000 });

    // 사용자 메시지가 즉시 화면에 나타남
    const userMsg = page
      .getByTestId('message-item')
      .filter({ hasText: USER_MESSAGE });
    await expect(userMsg.first()).toBeVisible({ timeout: 5_000 });
  });

  test('전송 버튼 클릭으로 메시지가 전송된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);

    // 텍스트 입력 시 전송 버튼 활성화 확인
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeEnabled();

    await sendButton.click();

    // 입력창 초기화
    await expect(page.getByTestId('chat-textarea')).toHaveValue('', {
      timeout: 3_000,
    });

    // 사용자 메시지 표시 확인
    await expect(
      page.getByTestId('message-item').filter({ hasText: USER_MESSAGE }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('메시지 전송 후 AI 응답이 표시된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // AI 응답 텍스트 확인 (SSE 처리 완료 후)
    const aiReply = page
      .getByTestId('message-item')
      .filter({ hasText: '화장품 상세페이지' });
    await expect(aiReply.first()).toBeVisible({ timeout: 15_000 });
  });

  test('빈 메시지는 전송되지 않는다 (전송 버튼 비활성화)', async ({ page }) => {
    await setupAndNavigateToChatPage(page);

    const sendButton = page.getByTestId('send-button');
    const textarea = page.getByTestId('chat-textarea');

    // 초기 상태: 비활성화
    await expect(sendButton).toBeDisabled();

    // 공백만 입력해도 비활성화 유지
    await textarea.fill('   ');
    await expect(sendButton).toBeDisabled();

    // 실제 텍스트 입력 시 활성화
    await textarea.fill('안녕');
    await expect(sendButton).toBeEnabled();
  });

  test('Shift+Enter는 줄바꿈으로 처리된다 (전송 아님)', async ({ page }) => {
    await setupAndNavigateToChatPage(page);

    const textarea = page.getByTestId('chat-textarea');
    await textarea.fill('첫 번째 줄');
    await textarea.press('Shift+Enter');
    await textarea.type('두 번째 줄');

    // 전송되지 않고 줄바꿈이 포함된 텍스트가 입력창에 남아 있어야 함
    const value = await textarea.inputValue();
    expect(value).toContain('\n');
    await expect(textarea).not.toHaveValue('');
  });

  test('메시지 전송 후 스크롤이 최하단으로 이동한다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // AI 응답 대기
    await expect(
      page.getByTestId('message-item').filter({ hasText: '화장품' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // messagesEndRef div가 뷰포트 안에 있는지 확인
    const endRef = page.locator('[data-testid="messages-end"]');
    await expect(endRef).toBeInViewport({ timeout: 3_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 시나리오 2: 스트리밍 응답 확인
// ═══════════════════════════════════════════════════════════════════════════

test.describe('시나리오 2: 스트리밍 응답 확인', () => {
  test('메시지 전송 직후 send 버튼이 비활성화된다 (isStreaming=true)', async ({
    page,
  }) => {
    // SSE 응답 전 200ms 지연 → isStreaming=true 상태 관찰 가능
    await setupAndNavigateToChatPage(page, {
      replyContent: AI_REPLY,
      sseDelayMs: 200,
    });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);

    const sendButton = page.getByTestId('send-button');
    await sendButton.click();

    // fetch pending 상태에서 isStreaming=true → 버튼 비활성화
    await expect(sendButton).toBeDisabled({ timeout: 3_000 });
  });

  test('스트리밍 완료 후 send 버튼이 다시 활성화된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // AI 응답 완료 대기
    await expect(
      page.getByTestId('message-item').filter({ hasText: '화장품' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // 완료 후 전송 버튼 재활성화 (빈 textarea이므로 비활성 상태 → 텍스트 입력 후 확인)
    await page.getByTestId('chat-textarea').fill('다음 메시지');
    await expect(page.getByTestId('send-button')).toBeEnabled({ timeout: 3_000 });
  });

  test('스트리밍 중 사용자 메시지가 먼저 화면에 표시된다', async ({ page }) => {
    // SSE 응답 전 500ms 지연 → 사용자 메시지가 먼저 보이는 시간 확보
    await setupAndNavigateToChatPage(page, {
      replyContent: AI_REPLY,
      sseDelayMs: 500,
    });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // AI 응답 도착 전에 사용자 메시지가 이미 표시됨 (낙관적 업데이트)
    const userMsg = page
      .getByTestId('message-item')
      .filter({ hasText: USER_MESSAGE });
    await expect(userMsg.first()).toBeVisible({ timeout: 3_000 });
  });

  test('SSE 완료 후 AI 메시지 전체 텍스트가 정확하게 표시된다', async ({
    page,
  }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // 최종 AI 메시지 내용 확인
    const aiMsg = page
      .getByTestId('message-item')
      .filter({ hasText: '화장품 상세페이지를 도와드릴게요' });
    await expect(aiMsg.first()).toBeVisible({ timeout: 15_000 });
  });

  test('SSE 완료 후 typing indicator가 화면에 없다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // AI 응답 완료 대기
    await expect(
      page.getByTestId('message-item').filter({ hasText: '화장품' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // 완료 후 typing indicator 없어야 함
    await expect(page.getByTestId('typing-indicator')).toHaveCount(0, {
      timeout: 3_000,
    });
  });

  test('SSE 완료 후 스트리밍 커서(blink)가 사라진다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    await page.getByTestId('chat-textarea').fill(USER_MESSAGE);
    await page.getByTestId('send-button').click();

    // 스트리밍 커서가 있는 경우 사라질 때까지 대기
    // (batch SSE에서는 flash 후 바로 사라지므로 최종 상태가 0임을 확인)
    const blinkCursor = page.locator('.animate-\\[blink_1s_infinite\\]');
    await expect(blinkCursor).toHaveCount(0, { timeout: 15_000 });
  });

  test('여러 메시지를 연속으로 보내도 순서가 유지된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page, { replyContent: AI_REPLY });

    const messages = ['첫 번째 메시지', '두 번째 메시지'];

    for (const msg of messages) {
      // 이전 응답 대기 후 다음 메시지 전송
      await page.getByTestId('chat-textarea').fill(msg);
      await page.getByTestId('send-button').click();

      await expect(
        page.getByTestId('message-item').filter({ hasText: msg }).first()
      ).toBeVisible({ timeout: 5_000 });

      // AI 응답 완료 대기
      await expect(
        page
          .getByTestId('message-item')
          .filter({ hasText: '화장품' })
          .last()
      ).toBeVisible({ timeout: 15_000 });
    }

    // 총 메시지 수: 웰컴(1) + 유저(2) + AI 응답(2) = 5
    const allMessages = page.getByTestId('message-item');
    await expect(allMessages).toHaveCount(5, { timeout: 5_000 });
  });

  test('대화 삭제 메뉴가 표시된다', async ({ page }) => {
    await setupAndNavigateToChatPage(page);

    // MoreVertical 메뉴 클릭
    await page.locator('button').filter({ has: page.locator('.lucide-more-vertical') }).click();

    await expect(page.getByText('대화 삭제')).toBeVisible({ timeout: 3_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 시나리오 3: 이미지 첨부 시 정상 표시 여부
// ═══════════════════════════════════════════════════════════════════════════

test.describe('시나리오 3: 이미지 첨부 기능', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndNavigateToChatPage(page, {
      replyContent: '제품 이미지를 잘 받았어요! 어떤 제품인가요?',
      uploadedImageUrl: IMAGE_CDN_URL,
    });
  });

  test('첨부 버튼이 표시되고 클릭 가능하다', async ({ page }) => {
    const attachButton = page.getByTestId('attach-button');
    await expect(attachButton).toBeVisible();
    await expect(attachButton).toBeEnabled();
  });

  test('이미지 파일을 첨부하면 미리보기가 표시된다', async ({ page }) => {
    const fileInput = page.getByTestId('file-input');

    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    // 업로드 스피너 사라질 때까지 대기
    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 8_000,
    });

    // 미리보기 컨테이너 표시 확인
    const preview = page.getByTestId('attachment-preview');
    await expect(preview).toBeVisible({ timeout: 5_000 });

    // 미리보기 이미지 확인
    await expect(preview.locator('img').first()).toBeVisible();
  });

  test('이미지 업로드 완료 후 미리보기 src가 CDN URL로 교체된다', async ({
    page,
  }) => {
    const fileInput = page.getByTestId('file-input');

    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    // 업로드 완료 대기
    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 8_000,
    });

    // src가 Base64(data:)에서 CDN URL로 교체됨
    const previewImg = page.getByTestId('attachment-preview').locator('img').first();
    await expect(previewImg).toHaveAttribute('src', IMAGE_CDN_URL, {
      timeout: 5_000,
    });
  });

  test('X 버튼으로 첨부된 이미지를 제거할 수 있다', async ({ page }) => {
    const fileInput = page.getByTestId('file-input');

    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 8_000,
    });

    // 미리보기 내 X 버튼 클릭
    const removeButton = page
      .getByTestId('attachment-preview')
      .locator('button')
      .first();
    await removeButton.click();

    // 미리보기 사라짐
    await expect(page.getByTestId('attachment-preview')).toHaveCount(0, {
      timeout: 3_000,
    });
  });

  test('이미지만 첨부해도 전송 버튼이 활성화된다', async ({ page }) => {
    const sendButton = page.getByTestId('send-button');

    // 초기에는 비활성화
    await expect(sendButton).toBeDisabled();

    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    // 업로드 완료 후 활성화
    await expect(sendButton).toBeEnabled({ timeout: 8_000 });
  });

  test('이미지와 텍스트를 함께 전송하면 메시지에 이미지가 표시된다', async ({
    page,
  }) => {
    const fileInput = page.getByTestId('file-input');

    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 8_000,
    });

    // 텍스트도 함께 입력
    await page.getByTestId('chat-textarea').fill('이 제품 이미지로 상세페이지 만들어주세요');
    await page.getByTestId('send-button').click();

    // 전송된 메시지에 이미지가 표시됨
    const msgWithImage = page.getByTestId('message-item').filter({
      has: page.locator('img[alt*="첨부 이미지"]'),
    });
    await expect(msgWithImage.first()).toBeVisible({ timeout: 10_000 });

    // 이미지 src 확인
    const attachedImg = msgWithImage.first().locator('img').first();
    await expect(attachedImg).toHaveAttribute('src', IMAGE_CDN_URL);
  });

  test('이미지만 전송해도 메시지에 이미지가 표시된다', async ({ page }) => {
    const fileInput = page.getByTestId('file-input');

    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 8_000,
    });

    // 텍스트 없이 이미지만 전송
    await page.getByTestId('send-button').click();

    // 첨부 이미지가 메시지 아이템에 표시됨
    const msgWithImage = page.getByTestId('message-item').filter({
      has: page.locator('img[alt*="첨부 이미지"]'),
    });
    await expect(msgWithImage.first()).toBeVisible({ timeout: 10_000 });
  });

  test('최대 5장까지 첨부할 수 있고 그 이후 버튼이 비활성화된다', async ({
    page,
  }) => {
    const fileInput = page.getByTestId('file-input');

    // 5개 파일 한 번에 선택
    const fiveFiles = Array.from({ length: 5 }, (_, i) => ({
      name: `product-${i + 1}.png`,
      mimeType: 'image/png' as const,
      buffer: SAMPLE_IMAGE_BUFFER,
    }));

    await fileInput.setInputFiles(fiveFiles);

    // 모든 업로드 완료 대기
    await expect(page.locator('.animate-spin')).toHaveCount(0, {
      timeout: 15_000,
    });

    // 5개 미리보기 확인
    const previewImgs = page.getByTestId('attachment-preview').locator('img');
    await expect(previewImgs).toHaveCount(5, { timeout: 5_000 });

    // 5장 이상이면 첨부 버튼 비활성화
    await expect(page.getByTestId('attach-button')).toBeDisabled();
  });

  test('이미지 업로드 중에는 전송이 차단된다', async ({ page }) => {
    // 업로드 응답을 지연시켜 isUploading=true 상태 관찰
    await page.route('**/api/upload', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, url: IMAGE_CDN_URL }),
      });
    });

    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles({
      name: 'product-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_IMAGE_BUFFER,
    });

    // 업로드 중 전송 버튼 비활성화 확인
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeDisabled({ timeout: 3_000 });

    // 업로드 완료 후 활성화
    await expect(sendButton).toBeEnabled({ timeout: 8_000 });
  });
});
