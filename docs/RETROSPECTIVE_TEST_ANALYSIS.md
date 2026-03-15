# 🔬 Fix 커밋 20개 — QA 관점 사전 테스트 분석

> 분석 기준: **"이 버그를 코딩 전에 잡으려면 어떤 테스트가 필요했나?"**
> 분석 대상: `fix:` 커밋 20개 (프로젝트 전체 git log 기준)
> 작성 관점: QA 엔지니어

---

## 카테고리 1 — 채팅 메시지 상태 관리

| # | 커밋 | 버그 1줄 요약 | 사전 감지 테스트 케이스 | Playwright 코드 아이디어 | 테스트 설계 기법 |
|---|------|--------------|----------------------|------------------------|----------------|
| 1 | `12146b1` | 이미지만 첨부한 메시지가 AI 응답 후 대화창에서 삭제됨 | `content = ""`이고 `attachments.length > 0`인 메시지가 필터링되지 않는지 검증 | `await page.setInputFiles('[data-testid="image-input"]', 'test.png');`<br>`await page.click('[data-testid="send-button"]');`<br>`await expect(page.locator('[data-testid="message-image"]')).toBeVisible();`<br>`// AI 응답 대기 후 재확인`<br>`await expect(page.locator('[data-testid="message-image"]')).toBeVisible();` | **동등 분할**: ①텍스트만 ②이미지만 ③텍스트+이미지 3개 클래스로 분할 → ②번 경로가 미테스트였음 |
| 2 | `c050584` | 선택지 클릭 시 라벨("패션") 대신 내부 ID("option-1")가 DB에 저장됨 | 선택지 클릭 → 페이지 새로고침 후 표시 텍스트가 라벨인지 확인 | `await page.click('[data-testid="option-button-fashion"]');`<br>`await page.reload();`<br>`const msgText = page.locator('[data-role="user"]').last();`<br>`await expect(msgText).not.toContainText(/option-\d+/);`<br>`await expect(msgText).toContainText('패션');` | **에러 추정**: 내부 식별자가 UI에 노출되는 패턴은 option/id/key 전달 시 전형적 실수 → 명시적으로 추정 케이스 작성 |
| 3 | `b80bfa1` | 이미지 미첨부 상태에서 "완료" 입력 시 기획 단계로 직행 | 이미지 업로드 없이 정보 입력 완료 시 이미지 요청 메시지 출력 여부 | `await sendMessage('제품명: 나이키 운동화, 카테고리: 패션');`<br>`await sendMessage('완료');`<br>`// 기획 단계 메시지가 아닌 이미지 업로드 요청 메시지 확인`<br>`await expect(page.locator('.ai-message').last()).toContainText('이미지');` | **상태 전이 테스트**: 정보수집→이미지업로드→기획의 전이 경로에서 이미지 누락 시 기획으로 건너뛰는 경로 명시적 추가 |
| 4 | `f44a7aa` | "브랜드 없이 진행" 선택 시 `undefined` 반환으로 브랜드 선택 무한 루프 | 브랜드 없이 진행 선택 후 다음 단계로 진행되는지(루프 없음) 확인 | `await page.click('text=브랜드 없이 진행');`<br>`// 동일한 선택지가 다시 표시되지 않는지 (루프 감지)`<br>`await page.waitForTimeout(2000);`<br>`const optionCount = await page.locator('text=브랜드 없이 진행').count();`<br>`expect(optionCount).toBe(0);` | **에러 추정**: `null` vs `undefined` 혼용은 조건문 오동작의 전형적 원인 → 선택 없음/null/undefined 3개 케이스 추정 |

---

## 카테고리 2 — 입력 유효성 검사 & API 계약

| # | 커밋 | 버그 1줄 요약 | 사전 감지 테스트 케이스 | Playwright 코드 아이디어 | 테스트 설계 기법 |
|---|------|--------------|----------------------|------------------------|----------------|
| 5 | `411ec1c` | `brandProfileId: null` 입력 시 Zod validation이 `"expected string"` 오류 반환 | 폼에서 선택 안 함(null) 상태로 제출 시 500이 아닌 정상 처리되는지 검증 | `// API 직접 테스트 (Playwright request)`<br>`const res = await request.post('/api/projects', {`<br>`  data: { brandProfileId: null, workspaceId: null, name: '테스트' }`<br>`});`<br>`expect(res.status()).not.toBe(500);`<br>`expect(res.status()).toBe(201);` | **경계값 분석**: 선택형 필드의 유효 값 = `string \| null` → null은 허용 경계값이므로 명시적 테스트 필요 |
| 6 | `4811178` | 브랜드가 0개일 때 "브랜드 없이 진행" 옵션 자체가 UI에서 숨겨짐 | 브랜드 목록이 빈 상태에서 프로젝트 생성 페이지 진입 시 옵션 표시 여부 | `// 브랜드 0개 상태 mock 후 접근`<br>`await page.route('/api/brands', r => r.fulfill({ json: { data: [] } }));`<br>`await page.goto('/dashboard/projects/new');`<br>`await expect(page.locator('text=브랜드 없이 진행')).toBeVisible();` | **동등 분할**: 브랜드 ①0개 ②1개 ③다수 — 0개 케이스(경계)가 별도 렌더링 분기임을 인지 |
| 7 | `8d5050b` | 브랜드 상세 페이지에서 `projects.map is not a function` 런타임 에러 | API 응답이 `{ data: { items: [] } }` 구조임에도 `.map()` 직접 호출 시 크래시 | `await page.goto('/dashboard/brands/test-id');`<br>`const errors: string[] = [];`<br>`page.on('console', m => m.type() === 'error' && errors.push(m.text()));`<br>`await page.waitForLoadState('networkidle');`<br>`expect(errors.filter(e => e.includes('.map'))).toHaveLength(0);` | **에러 추정**: 배열 아닌 객체에 `.map()` 호출 — API 응답 래핑 구조 변경 시 전형적 실수 → 계약 테스트 필요 |
| 8 | `6f14921` | 세션 쿠키의 `sub` 값이 DB `users.id`와 달라 FK 제약 오류 발생 | 이메일로 로그인한 세션으로 프로젝트 생성 시 200 반환되는지 확인 | `const res = await request.post('/api/projects', {`<br>`  data: { name: '테스트 프로젝트' },`<br>`  headers: { Cookie: sessionCookie }`<br>`});`<br>`expect(res.status()).not.toBe(500);`<br>`const body = await res.json();`<br>`expect(JSON.stringify(body)).not.toContain('Foreign key');` | **상태 조합 테스트**: 세션 ID × DB ID 일치/불일치 2가지 조합 — NextAuth 세션과 Prisma user 간 동기화 가정을 검증 |

---

## 카테고리 3 — UI 상태 & 네비게이션

| # | 커밋 | 버그 1줄 요약 | 사전 감지 테스트 케이스 | Playwright 코드 아이디어 | 테스트 설계 기법 |
|---|------|--------------|----------------------|------------------------|----------------|
| 9 | `59a9394` | `/dashboard/chat`에서도 "홈" 사이드바 메뉴가 활성화됨 (경로 부분 매칭 오류) | `/dashboard`, `/dashboard/chat`, `/dashboard/projects`에서 각각 하나의 메뉴만 활성화 확인 | `for (const [path, activeMenu] of [`<br>`  ['/dashboard', '홈'],`<br>`  ['/dashboard/chat', '채팅'],`<br>`  ['/dashboard/projects', '프로젝트']`<br>`]) {`<br>`  await page.goto(path);`<br>`  const active = page.locator('[data-active="true"]');`<br>`  await expect(active).toHaveCount(1);`<br>`  await expect(active).toContainText(activeMenu);`<br>`}` | **경계값 분석**: 경로 `/dashboard`는 `/dashboard/chat`의 prefix → `startsWith` vs `===` 경계. 정확 매칭만 활성화되어야 함 |
| 10 | `60261bb` | 이미지 업로드 오류 시 `alert()` 다이얼로그가 앱 UI를 블로킹 | 파일 크기 초과/형식 오류 시 toast가 표시되고 alert 다이얼로그가 열리지 않는지 확인 | `page.on('dialog', d => { throw new Error('alert() 호출됨: ' + d.message()); });`<br>`await page.setInputFiles('[data-testid="image-input"]', oversizedFile);`<br>`await expect(page.locator('[data-testid="toast"]')).toBeVisible();`<br>`// 위에서 throw 없으면 alert 없음` | **에러 추정**: 에러 피드백 방식이 `alert()` vs `toast` vs `inline` — 브라우저 네이티브 UI 사용 여부 명시적 추정 케이스 |
| 11 | `0053346`<br>`9317120` | 이미지 생성 탭·오버레이 탭 헤더 높이가 다른 탭과 달라 레이아웃 불일치 | 모든 탭 헤더의 `height`가 동일한지 시각/DOM 속성 검증 | `const tabs = ['image-gen', 'overlay', 'basic'];`<br>`const heights = await Promise.all(tabs.map(tab =>`<br>`  page.locator(\`[data-tab="${tab}"] .tab-header\`).evaluate(el => el.getBoundingClientRect().height)`<br>`));`<br>`const allEqual = heights.every(h => h === heights[0]);`<br>`expect(allEqual).toBe(true);` | **동등 분할**: 동일 컴포넌트가 N개 탭에 반복 사용될 때 → 모든 인스턴스에 동일 기준 적용하는 파라미터화 테스트 필요 |

---

## 카테고리 4 — AI 생성 & 프롬프트 출력

| # | 커밋 | 버그 1줄 요약 | 사전 감지 테스트 케이스 | Playwright 코드 아이디어 | 테스트 설계 기법 |
|---|------|--------------|----------------------|------------------------|----------------|
| 12 | `8385ca3` | 섹션 재생성 후 훅 메시지(첫 문구)가 초기화되어 사라짐 | 섹션 하나만 재생성 후 나머지 섹션·훅 메시지가 유지되는지 확인 | `const hookBefore = await page.locator('[data-testid="hook-message"]').textContent();`<br>`await page.click('[data-testid="regenerate-section-1"]');`<br>`await page.waitForSelector('[data-testid="section-1-loading"]', { state: 'hidden' });`<br>`const hookAfter = await page.locator('[data-testid="hook-message"]').textContent();`<br>`expect(hookAfter).toBe(hookBefore);` | **에러 추정**: 부분 업데이트 시 전체 상태 덮어쓰는 패턴 → 재생성/업데이트 후 "건드리지 않은 필드 유지" 케이스 명시 |
| 13 | `b05be10` | 섹션 재생성 시 최종 프롬프트가 초기 생성과 다른 구성요소를 사용 | 초기 생성과 재생성에서 최종 결합 프롬프트의 구성요소가 동일한지 비교 | `const initial = await request.post('/api/generate/section', { data: payload });`<br>`const regen = await request.post('/api/generate/section', { data: payload });`<br>`const initPrompt = (await initial.json()).revisedPrompt;`<br>`const regenPrompt = (await regen.json()).revisedPrompt;`<br>`expect(regenPrompt).toContain(payload.overlayTextPrompt ?? '');` | **에러 추정**: 초기/재실행 경로가 분기될 때 중간 변수를 빠뜨리는 패턴 → 두 경로의 출력 동등성 검증 |
| 14 | `8204dab`<br>`3486ab6` | fontSize 허용 범위가 12-48로 설정되어 AI가 48 초과 값 반환 시 무효 처리 | AI 응답의 `fontSize` 값이 유효 범위(12-80)에 속하는지, 경계값에서 정상 처리되는지 | `for (const fontSize of [11, 12, 48, 49, 80, 81]) {`<br>`  const res = await request.post('/api/generate/section', {`<br>`    data: { ...payload, overrides: { fontSize } }`<br>`  });`<br>`  const valid = fontSize >= 12 && fontSize <= 80;`<br>`  expect(res.status()).toBe(valid ? 200 : 400);`<br>`}` | **경계값 분석**: min=12, max=80 → 테스트 포인트 = {11, 12, 80, 81} 4개 경계값. 범위 변경 시 자동으로 실패하는 파라미터화 테스트 |
| 15 | `cf6c74e` | AI가 `color` 필드에 넣어야 할 HEX값(`#FF0000`)을 `text` 필드에 반환 | AI 응답 JSON의 `text` 필드가 HEX 패턴(`#[0-9A-F]{6}`)을 포함하지 않는지 검증 | `const res = await request.post('/api/generate/section', { data: payload });`<br>`const sections = (await res.json()).sections;`<br>`for (const section of sections) {`<br>`  for (const item of section.items ?? []) {`<br>`    expect(item.text ?? '').not.toMatch(/#[0-9A-Fa-f]{6}/);`<br>`  }`<br>`}` | **에러 추정**: AI가 필드 정의를 오해하고 관련 값을 엉뚱한 필드에 채우는 패턴 → 필드 타입 오염 케이스 명시 |
| 16 | `aea9f21` | 이미지 생성 최종 프롬프트에 오버레이용 텍스트 지침이 포함되어 이미지 품질 저하 | 이미지 생성 API 응답의 최종 프롬프트에 오버레이 전용 키워드가 없는지 확인 | `const res = await request.post('/api/generate/section', { data: payload });`<br>`const finalPrompt = (await res.json()).finalImagePrompt;`<br>`expect(finalPrompt).not.toContain('overlay');`<br>`expect(finalPrompt).not.toContain('텍스트 디자인');` | **에러 추정**: 프롬프트 조합 함수가 용도별 분기 없이 모든 컴포넌트를 concat하는 패턴 → 출력 분리 검증 필요 |

---

## 카테고리 5 — 인증 & 데이터 무결성

| # | 커밋 | 버그 1줄 요약 | 사전 감지 테스트 케이스 | Playwright 코드 아이디어 | 테스트 설계 기법 |
|---|------|--------------|----------------------|------------------------|----------------|
| 17 | `ff5fa04` | `User-BrandProfile` 관계 누락으로 브랜드 프로필 생성 시 DB 오류 | 브랜드 프로필 생성 → 조회 → 삭제 전체 CRUD 사이클이 오류 없이 완료되는지 | `const create = await request.post('/api/brands', { data: brandPayload });`<br>`expect(create.status()).toBe(201);`<br>`const id = (await create.json()).data.id;`<br>`const read = await request.get(\`/api/brands/${id}\`);`<br>`expect(read.status()).toBe(200);`<br>`const del = await request.delete(\`/api/brands/${id}\`);`<br>`expect(del.status()).toBe(200);` | **CRUD 완전성 테스트**: Create-Read-Update-Delete 4개 연산을 순서대로 모두 검증 → 관계 누락 시 Create 단계에서 즉시 실패 감지 |
| 18 | `ad92969` | AI API 키 미설정 또는 호출 실패 시 에러 핸들링 없어 500 반환 | API 키 없는 환경에서 생성 요청 시 500 대신 의미 있는 오류/mock 응답 반환 확인 | `const res = await request.post('/api/generate/detail-page', {`<br>`  data: projectPayload,`<br>`  headers: { 'x-use-mock': 'true' }`<br>`});`<br>`expect(res.status()).not.toBe(500);`<br>`const body = await res.json();`<br>`expect(body).toHaveProperty('sections');` | **에러 추정**: 외부 API 장애 시나리오 — 네트워크 오류, 타임아웃, 키 미설정 3가지 추정 케이스 + mock fallback 검증 |
| 19 | `02070ef` | Prisma 스키마-코드 불일치로 신규 프로젝트 생성 시 여러 경로 오류 | 프로젝트 생성 플로우 전체(입력 → API → DB → 응답)가 오류 없이 완료되는지 E2E 검증 | `await page.goto('/dashboard/projects/new');`<br>`await page.fill('[name="productName"]', '테스트 상품');`<br>`await page.selectOption('[name="category"]', 'FASHION');`<br>`await page.click('text=프로젝트 생성');`<br>`await expect(page).toHaveURL(/\/dashboard\/projects\/[\w-]+/);`<br>`await expect(page.locator('h1')).toContainText('테스트 상품');` | **시나리오 기반 테스트**: 다수 파일 수정이 동반되는 기능은 단위 테스트만으로 부족 → 전체 사용자 플로우를 하나의 E2E 시나리오로 커버 |
| 20 | `371fc16` | GitHub Actions에서 한글 커밋 메시지 파싱 실패로 CI 오류 | CI 파이프라인에서 한글/특수문자 포함 커밋 메시지가 있을 때 Actions가 통과되는지 확인 | `# Playwright 대신 GitHub Actions workflow 테스트`<br>`# 한글 이름 파일/경로 처리 검증`<br>`# workflow_dispatch로 한글 커밋 메시지 포함 브랜치 트리거 후 Status 확인` | **에러 추정**: ASCII 외 문자를 파싱할 때의 인코딩 오류 — 한글·이모지·특수문자 포함 입력을 명시적 추정 케이스로 추가 |

---

## 테스트 설계 기법 요약

| 기법 | 적용 건수 | 설명 |
|------|----------|------|
| **에러 추정 (Error Guessing)** | 8건 | 개발자가 놓치기 쉬운 패턴(null/undefined 혼용, 내부 키 노출, alert 사용)을 경험으로 추정 |
| **경계값 분석 (BVA)** | 4건 | min/max 값과 그 인접값(±1) 테스트 — fontSize, 경로 매칭, null 허용 여부 |
| **동등 분할 (Equivalence Partitioning)** | 4건 | 입력을 클래스로 나눠 각 대표값 1개씩 테스트 — 텍스트/이미지/텍스트+이미지 |
| **상태 전이 테스트 (State Transition)** | 2건 | 각 상태에서 가능한 전이 경로를 명시적으로 검증 — 챗봇 플로우 |
| **CRUD 완전성** | 1건 | Create-Read-Update-Delete 4개 연산을 순서대로 모두 검증 |
| **시나리오 기반 E2E** | 1건 | 여러 컴포넌트에 걸친 플로우를 하나의 사용자 시나리오로 커버 |
