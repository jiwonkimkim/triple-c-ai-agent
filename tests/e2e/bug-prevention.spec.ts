/**
 * Bug Prevention Spec
 *
 * 재발 방지 테스트 — "이 버그를 코딩 전에 잡으려면 어떤 테스트가 필요했나?"
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  Case #1  (커밋 12146b1)                                                │
 * │  이미지 전용 메시지 소실 방지                                           │
 * │  content="" + attachments=[url] 메시지가 필터에서 제거되지 않아야 함    │
 * │                                                                          │
 * │  Case #14 (커밋 8204dab, 3486ab6)                                       │
 * │  fontSize 경계값 분석                                                    │
 * │  오버레이 텍스트 fontSize가 구 상한(48) → 신 상한(80)으로 확장됨        │
 * │  에디터가 49~80 범위 값을 정상 렌더링함을 보장                          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * 테스트 설계 기법:
 *   Case #1  — 동등 분할 (텍스트만 / 이미지만 / 텍스트+이미지 / 완전 빈)
 *   Case #14 — 경계값 분석 BVA: {12, 48, 49, 65, 80}
 */

import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import {
  setupAndNavigateToChatPage,
  MOCK_WELCOME_MESSAGE,
  SAMPLE_IMAGE_PATH,
} from './helpers/chat-mocks';

// ─── 공통 상수 ──────────────────────────────────────────────────────────────

/** R2 업로드 성공 시 반환되는 CDN URL (mockImageUpload 와 일치) */
const IMAGE_CDN_URL = 'https://pub-test.r2.dev/e2e-test-product.jpg';

// ═══════════════════════════════════════════════════════════════════════════
// Case #1 — 이미지 전용 메시지 소실 방지 (커밋 12146b1)
// ═══════════════════════════════════════════════════════════════════════════
//
// 수정 전 버그:
//   use-chat.ts의 두 곳에서 content.trim() === '' 메시지를 일괄 제거
//   → 이미지만 첨부한 메시지(content="")가 AI 응답 수신 후 대화창에서 사라짐
//   → 페이지 재진입(DB 로드) 시에도 동일 필터로 이미지 메시지가 없어짐
//
// 수정 후:
//   hasContent || hasAttachments 조건으로 변경
//   → content가 없어도 attachments가 있으면 메시지 유지
//
// 두 가지 경로 검증:
//   경로 A — 전송 직후 (클라이언트 상태, onDone 콜백)
//   경로 B — 페이지 재진입 (서버 GET 응답, loadMessages 필터)
// ────────────────────────────────────────────────────────────────────────────

test.describe('[Case #1] 이미지 전용 메시지 소실 방지 (커밋 12146b1)', () => {
  /**
   * content="" + attachments=[url] 형태의 메시지 픽스처
   * DB에서 로드한 이미지 전용 메시지와 동일한 구조
   */
  const IMAGE_ONLY_MESSAGE = {
    id: 'user-img-only-001',
    role: 'user',
    content: '',              // ← 버그 트리거: 빈 content
    attachments: [IMAGE_CDN_URL],
    agentType: null,
    metadata: {},
    createdAt: new Date(Date.now() - 30_000).toISOString(),
  };

  // ── TC-1.1: 경로 A — 전송 직후 + AI 응답 후 이미지 메시지 유지 ──────────

  /**
   * 버그 재현 흐름:
   *   1. 이미지만 첨부 (텍스트 없음) → 전송
   *   2. UI에 content="" 메시지 추가 (attachments=[url])
   *   3. AI SSE done 이벤트 수신 → onDone 콜백 실행
   *   4. 버그: filter(m => m.content.trim()) 에서 content="" 메시지 제거됨
   *   5. 이미지 메시지가 대화창에서 사라짐
   *
   * 동등 분할 클래스: ②이미지만 (핵심 미테스트 클래스)
   */
  test('TC-1.1: 이미지만 첨부 후 전송 → AI 응답 수신 후에도 이미지 메시지가 유지된다', async ({
    page,
  }) => {
    const AI_REPLY = '이미지를 잘 받았습니다! 어떤 제품인가요?';

    await setupAndNavigateToChatPage(page, {
      replyContent: AI_REPLY,
      uploadedImageUrl: IMAGE_CDN_URL,
    });

    // ① 이미지만 첨부 (텍스트 없음)
    await page.setInputFiles('[data-testid="file-input"]', SAMPLE_IMAGE_PATH);

    // R2 업로드 완료 대기 (미리보기 표시 + 스피너 소멸)
    await expect(page.locator('[data-testid="attachment-preview"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator('[data-testid="attach-button"] [class*="animate-spin"]')
    ).toBeHidden({ timeout: 8_000 });

    // ② 텍스트 없이 전송
    await page.locator('[data-testid="send-button"]').click();

    // ③ 전송 직후: 이미지 메시지가 대화창에 표시됨
    await expect(
      page.locator('[data-testid="message-item"] img[alt*="첨부 이미지"]').first()
    ).toBeVisible({ timeout: 5_000 });

    // ④ AI 응답 수신 대기 (SSE done 이벤트 → onDone 콜백 실행 시점)
    await expect(
      page.locator('[data-testid="message-item"]').filter({ hasText: AI_REPLY })
    ).toBeVisible({ timeout: 15_000 });

    // ⑤ [핵심 검증] AI 응답 후에도 이미지 메시지가 여전히 존재해야 함
    //    버그 발생 시: onDone filter가 content="" 메시지를 제거해 이미지가 사라짐
    await expect(
      page.locator('[data-testid="message-item"] img[alt*="첨부 이미지"]').first()
    ).toBeVisible({ timeout: 3_000 });

    // ⑥ 총 메시지 수: 웰컴(1) + 이미지 유저 메시지(1) + AI 응답(1) = 3개 이상
    const count = await page.locator('[data-testid="message-item"]').count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ── TC-1.2: 경로 B — DB 로드 시 이미지 전용 메시지 표시 ─────────────────

  /**
   * 버그 재현 흐름:
   *   1. GET /api/chat/{id}/messages 응답에 content="" 메시지 포함
   *   2. 버그: .filter(msg => msg.content.trim()) 가 content="" 메시지 제거
   *   3. 대화 페이지 재진입 시 이미지 메시지가 보이지 않음
   *
   * 동등 분할 클래스: ②이미지만 (DB 로드 경로)
   */
  test('TC-1.2: 페이지 재진입(DB 로드) 시 이미지 전용 메시지가 필터링 없이 표시된다', async ({
    page,
  }) => {
    // DB 로드 상황 시뮬레이션: content="" + attachments=[url] 메시지를 초기 데이터로 설정
    await setupAndNavigateToChatPage(page, {
      initialMessages: [MOCK_WELCOME_MESSAGE, IMAGE_ONLY_MESSAGE],
    });

    // [핵심 검증] content="" 이미지 메시지가 필터링 없이 표시되어야 함
    await expect(
      page
        .locator('[data-testid="message-item"] img[src="' + IMAGE_CDN_URL + '"]')
        .first()
    ).toBeVisible({ timeout: 5_000 });

    // 정확히 2개: 웰컴 메시지(1) + 이미지 전용 메시지(1)
    await expect(page.locator('[data-testid="message-item"]')).toHaveCount(2, {
      timeout: 3_000,
    });
  });

  // ── TC-1.3: 동등 분할 — 텍스트+이미지 혼합 메시지 회귀 확인 ──────────────

  /**
   * 목적: content가 있는 ③텍스트+이미지 클래스에 영향을 주지 않았는지 확인
   *
   * 동등 분할 클래스: ③텍스트+이미지 (회귀)
   */
  test('TC-1.3: 텍스트+이미지 혼합 메시지는 AI 응답 후에도 텍스트와 이미지 모두 유지된다 (회귀)', async ({
    page,
  }) => {
    await setupAndNavigateToChatPage(page, {
      replyContent: '이미지와 텍스트 모두 잘 받았습니다!',
      uploadedImageUrl: IMAGE_CDN_URL,
    });

    // 이미지 첨부
    await page.setInputFiles('[data-testid="file-input"]', SAMPLE_IMAGE_PATH);
    await expect(page.locator('[data-testid="attachment-preview"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator('[data-testid="attach-button"] [class*="animate-spin"]')
    ).toBeHidden({ timeout: 8_000 });

    // 텍스트도 함께 입력 후 전송
    await page.fill('[data-testid="chat-textarea"]', '이 이미지로 상세페이지 만들어줘');
    await page.locator('[data-testid="send-button"]').click();

    // AI 응답 대기
    await expect(
      page
        .locator('[data-testid="message-item"]')
        .filter({ hasText: '이미지와 텍스트 모두 잘 받았습니다' })
    ).toBeVisible({ timeout: 15_000 });

    // [검증 1] 사용자가 입력한 텍스트가 유지됨
    await expect(
      page
        .locator('[data-testid="message-item"]')
        .filter({ hasText: '이 이미지로 상세페이지 만들어줘' })
    ).toBeVisible();

    // [검증 2] 이미지도 함께 유지됨
    await expect(
      page.locator('[data-testid="message-item"] img[alt*="첨부 이미지"]').first()
    ).toBeVisible();
  });

  // ── TC-1.4: 경계값 — 완전 빈 메시지는 여전히 필터링되어야 함 ─────────────

  /**
   * 목적: 수정된 필터 조건이 너무 넓어지지 않았는지 확인
   *   content="" + attachments=[] 인 완전 빈 메시지는 제거되어야 함
   *
   * 동등 분할 클래스: ④완전 빈 (기존 필터 동작 유지)
   */
  test('TC-1.4: 완전 빈 메시지(content="" + attachments=[])는 DB 로드 시 표시되지 않는다 (경계값)', async ({
    page,
  }) => {
    const EMPTY_MESSAGE = {
      id: 'user-empty-001',
      role: 'user',
      content: '',        // content 없음
      attachments: [],    // attachments도 없음 ← 이것이 이미지 전용 메시지와의 차이
      agentType: null,
      metadata: {},
      createdAt: new Date(Date.now() - 30_000).toISOString(),
    };

    await setupAndNavigateToChatPage(page, {
      initialMessages: [MOCK_WELCOME_MESSAGE, EMPTY_MESSAGE],
    });

    // [검증] 완전 빈 메시지는 필터링되어 웰컴 메시지만 1개 표시되어야 함
    await expect(page.locator('[data-testid="message-item"]')).toHaveCount(1, {
      timeout: 5_000,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Case #14 — fontSize 경계값 분석 (커밋 8204dab, 3486ab6)
// ═══════════════════════════════════════════════════════════════════════════
//
// 수정 전 버그:
//   overlay-prompts.ts: "fontSize": (내용에 맞는 크기 12-48)
//   → AI가 프롬프트 지시에 따라 fontSize > 48 값을 절대 반환하지 않음
//   → 큰 배너 텍스트, 강조 헤드라인 등에서 폰트 크기 불충분 (UX 저하)
//
// 수정 후:
//   "fontSize": (내용에 맞는 크기 12-80) 으로 프롬프트 변경
//   → AI가 49~80 범위 값을 자유롭게 반환 가능
//
// 에디터 렌더링 로직 (image-overlay-block.tsx):
//   fontSize: `${(overlayText.style.fontSize || 16) * scale}px`
//   → style.fontSize 값을 그대로 CSS로 적용 (캡/클램프 없음)
//   → 49~80 범위 값이 오면 그대로 렌더링되어야 함
//
// 테스트 설계 기법: 경계값 분석 (BVA)
//   경계값 집합: {12(min), 48(구max), 49(구max+1), 65(신범위중간), 80(신max)}
// ────────────────────────────────────────────────────────────────────────────

test.describe('[Case #14] fontSize 경계값 분석 — 에디터 오버레이 렌더링 (커밋 8204dab)', () => {
  const TEST_PROJECT_ID = 'e2e-font-size-test-proj';

  // ── 공통 헬퍼: 특정 fontSize를 가진 오버레이 콘텐츠 모킹 ────────────────

  /**
   * 에디터가 /api/projects/{id}/content 에서 받는 응답 구조
   * overlayTexts[].style.fontSize 에 테스트할 경계값을 삽입
   */
  function buildEditorContentMock(fontSize: number) {
    return {
      success: true,
      data: {
        editorSections: [
          {
            id: `section-fs-${fontSize}`,
            name: 'HERO',
            blocks: [
              {
                id: `block-fs-${fontSize}`,
                type: 'image-overlay',
                src: 'https://cdn.example.com/test-product.jpg',
                alt: '테스트 상품 이미지',
                overlayTexts: [
                  {
                    id: `text-fs-${fontSize}`,
                    type: 'headline',
                    content: `fontSize-${fontSize}-headline`,   // 텍스트로 fontSize 값 추적
                    style: {
                      x: 50,
                      y: 30,
                      fontSize,                                 // ← 테스트 대상 경계값
                      fontWeight: 'bold',
                      fontFamily: 'Pretendard, sans-serif',
                      color: '#FFFFFF',
                      textShadow: true,
                      textAlign: 'center',
                      opacity: 100,
                      rotation: 0,
                    },
                    zIndex: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * 에디터 페이지가 /api/projects/{id} 에서 받는 최소 프로젝트 메타데이터
   */
  function buildProjectMock(projectId: string) {
    return {
      data: {
        id: projectId,
        name: 'fontSize 경계값 E2E 테스트',
        status: 'COMPLETED',
        category: 'FASHION',
        productName: '테스트 상품',
        keyFeatures: ['기능1'],
        targetAudience: '20-30대',
        productImages: ['https://cdn.example.com/test-product.jpg'],
        imageModel: 'gemini-2.5-flash-image',
        brandProfile: null,
        workspace: null,
        detailPageVersions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 공통 설정: 프로젝트 API + 에디터 콘텐츠 API 모킹 후 에디터 페이지 이동
   *
   * 모킹 대상:
   *   GET /api/projects/{id}         → 프로젝트 메타데이터
   *   GET /api/projects/{id}/content → 오버레이 포함 에디터 콘텐츠 (fontSize 주입)
   *   POST /api/projects/{id}/drafts → 자동 저장 (성공으로 처리)
   */
  async function setupEditorWithFontSize(page: Page, fontSize: number): Promise<void> {
    const projectId = TEST_PROJECT_ID;

    // 프로젝트 메타데이터 모킹
    await page.route(`**/api/projects/${projectId}`, async (route: Route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildProjectMock(projectId)),
      });
    });

    // 에디터 콘텐츠 모킹 (fontSize 경계값 포함)
    await page.route(`**/api/projects/${projectId}/content`, async (route: Route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildEditorContentMock(fontSize)),
      });
    });

    // 자동 저장 API — 성공으로 처리 (테스트와 무관)
    await page.route(`**/api/projects/${projectId}/drafts`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto(`/dashboard/projects/${projectId}`);
    await page.waitForLoadState('networkidle');
  }

  // ── 콘솔 에러 수집 헬퍼 ──────────────────────────────────────────────────

  function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    return errors;
  }

  // ── TC-14.1: fontSize=12 (min 경계값) ──────────────────────────────────

  test('TC-14.1: fontSize=12 (min 경계값) — 에디터가 JS 오류 없이 로드된다', async ({
    page,
  }) => {
    const TARGET = 12;
    const errors = collectConsoleErrors(page);

    await setupEditorWithFontSize(page, TARGET);

    // [검증 1] 에러 페이지로 이탈하지 않음
    await expect(page).not.toHaveURL(/\/error|\/login/);

    // [검증 2] fontSize 관련 JS 런타임 오류 없음
    const fontErrors = errors.filter(
      (e) => e.includes('fontSize') || e.includes('NaN') || e.includes('Invalid')
    );
    expect(fontErrors, `fontSize=${TARGET} 에서 발생한 콘솔 오류: ${fontErrors.join(', ')}`).toHaveLength(0);

    // [검증 3] 오버레이 텍스트 요소가 DOM에 렌더링됨
    await expect(
      page.locator(`text=fontSize-${TARGET}-headline`).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-14.2: fontSize=48 (구 max 경계값) ────────────────────────────────

  test('TC-14.2: fontSize=48 (구 max 경계값, 수정 전 상한) — 에디터가 정상 렌더링된다', async ({
    page,
  }) => {
    const TARGET = 48;
    const errors = collectConsoleErrors(page);

    await setupEditorWithFontSize(page, TARGET);

    await expect(page).not.toHaveURL(/\/error|\/login/);

    const fontErrors = errors.filter(
      (e) => e.includes('fontSize') || e.includes('NaN')
    );
    expect(fontErrors, `fontSize=${TARGET} 콘솔 오류: ${fontErrors.join(', ')}`).toHaveLength(0);

    await expect(
      page.locator(`text=fontSize-${TARGET}-headline`).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-14.3: fontSize=65 (핵심 케이스 — 구 범위 초과, 신 범위 유효값) ────

  /**
   * 이 값은 수정 전 AI 프롬프트가 "12-48"을 지시했기 때문에
   * AI가 절대 반환하지 않던 값입니다.
   * 에디터가 이 값을 받아도 캡/클램프/오류 없이 렌더링해야 합니다.
   *
   * image-overlay-block.tsx:
   *   fontSize: `${(overlayText.style.fontSize || 16) * scale}px`
   *   → 클램프 없이 그대로 CSS 적용 → 정상 동작해야 함
   */
  test('TC-14.3: fontSize=65 (핵심 — 구 범위 초과) — 에디터가 값을 캡하지 않고 정상 렌더링한다', async ({
    page,
  }) => {
    const TARGET = 65;
    const errors = collectConsoleErrors(page);

    await setupEditorWithFontSize(page, TARGET);

    await expect(page).not.toHaveURL(/\/error|\/login/);

    const fontErrors = errors.filter(
      (e) => e.includes('fontSize') || e.includes('NaN')
    );
    expect(fontErrors, `fontSize=${TARGET} 콘솔 오류: ${fontErrors.join(', ')}`).toHaveLength(0);

    // 오버레이 텍스트 요소 확인
    const overlayEl = page.locator(`text=fontSize-${TARGET}-headline`).first();
    await expect(overlayEl).toBeVisible({ timeout: 10_000 });

    // [핵심 검증] 렌더링된 font-size CSS 값이 유효한 양수여야 함
    // 캡이 있다면 48px 이하로 렌더링되고, 없다면 scale × 65 크기로 렌더링됨
    // NaN / 0 이 아닌지만 확인 (scale 팩터로 인해 절대값 비교 불가)
    const computedFontSizePx = await overlayEl.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(computedFontSizePx, 'fontSize가 NaN 또는 0이어서는 안 됨').toBeGreaterThan(0);
    expect(isNaN(computedFontSizePx), 'fontSize가 NaN이어서는 안 됨').toBe(false);
  });

  // ── TC-14.4: fontSize=80 (신 max 경계값) ────────────────────────────────

  test('TC-14.4: fontSize=80 (신 max 경계값) — 에디터가 정상 렌더링된다', async ({
    page,
  }) => {
    const TARGET = 80;
    const errors = collectConsoleErrors(page);

    await setupEditorWithFontSize(page, TARGET);

    await expect(page).not.toHaveURL(/\/error|\/login/);

    const fontErrors = errors.filter(
      (e) => e.includes('fontSize') || e.includes('NaN')
    );
    expect(fontErrors, `fontSize=${TARGET} 콘솔 오류: ${fontErrors.join(', ')}`).toHaveLength(0);

    await expect(
      page.locator(`text=fontSize-${TARGET}-headline`).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-14.5: BVA 파라미터화 — 경계값 집합 전체 검증 ─────────────────────

  /**
   * 경계값 분석 집합:
   *   {12, 48, 49, 65, 80}
   *
   *   - 12:  min 경계값                          (구·신 범위 모두 유효)
   *   - 48:  구 max 경계값 (수정 전 상한)         (구·신 범위 모두 유효)
   *   - 49:  구 max+1 = 신 범위 진입점           (신 범위에서만 유효 ← 핵심)
   *   - 65:  신 범위 내 중간값                    (신 범위에서만 유효 ← 핵심)
   *   - 80:  신 max 경계값                        (신 범위에서만 유효)
   *
   * 이 중 49, 65, 80이 수정으로 인해 새롭게 허용된 값들입니다.
   */
  const BVA_CASES = [
    { fontSize: 12, label: 'min 경계값',              isNewRange: false },
    { fontSize: 48, label: '구 max 경계값 (수정 전 상한)', isNewRange: false },
    { fontSize: 49, label: '구 max+1 (신 범위 진입점)',   isNewRange: true  },
    { fontSize: 65, label: '신 범위 중간값',              isNewRange: true  },
    { fontSize: 80, label: '신 max 경계값',               isNewRange: true  },
  ];

  for (const { fontSize, label, isNewRange } of BVA_CASES) {
    test(`TC-14.5 [BVA] fontSize=${fontSize} (${label}) — 에디터 로드 시 JS 오류가 없다${isNewRange ? ' ★신범위' : ''}`, async ({
      page,
    }) => {
      const errors = collectConsoleErrors(page);

      await setupEditorWithFontSize(page, fontSize);

      // [검증 1] 에러 페이지로 이탈하지 않음
      await expect(page).not.toHaveURL(/\/error/);

      // [검증 2] JS 런타임 오류 없음 (fontSize 처리 중 예외 발생 여부)
      const criticalErrors = errors.filter(
        (e) =>
          e.includes('fontSize') ||
          e.includes('NaN') ||
          e.includes('Cannot read') ||
          e.includes('undefined is not')
      );
      expect(
        criticalErrors,
        `fontSize=${fontSize} 에서 발생한 치명적 JS 오류:\n${criticalErrors.join('\n')}`
      ).toHaveLength(0);
    });
  }
});
