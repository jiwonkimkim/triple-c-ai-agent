/**
 * nGrinder 부하 테스트 — POST /api/generate/detail-page
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  엔드포인트 분석 요약                                                   │
 * │                                                                         │
 * │  병목 구간 (느린 순)                                                    │
 * │  1위. generateDetailPage() — AI 호출 (전체 응답 시간의 ~90%)           │
 * │       · 텍스트 생성 (OpenAI)   : 5 ~ 10s     ← generateImages=false   │
 * │       · 이미지 생성 (Gemini)   : 20 ~ 60s/섹션 ← generateImages=true  │
 * │  2위. 직렬 DB 쿼리 × 5개      : 50 ~ 200ms   (병렬화 미적용)          │
 * │  3위. getServerSession         : 10 ~ 30ms   (JWT 파싱 + DB)           │
 * │                                                                         │
 * │  타임아웃 설정: maxDuration = 300s (Vercel Pro)                        │
 * │  SLA 목표:     텍스트 생성 < 10s (CLAUDE.md Performance targets)       │
 * │                                                                         │
 * │  동시 부하 취약점                                                       │
 * │  · DB 커넥션 풀 고갈: 직렬 쿼리 5개 × vUser 수                        │
 * │  · 외부 AI API Rate Limit (OpenAI / Gemini)                            │
 * │  · 크레딧 차감 race condition (trialCredits DECREMENT)                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * 유저 시나리오 (1 vUser):
 *   Step 1. GET  /api/auth/csrf               → CSRF 토큰 획득
 *   Step 2. POST /api/auth/callback/credentials → 로그인 → 세션 쿠키 획득
 *   Step 3. POST /api/projects                → 프로젝트 생성 → projectId 획득
 *   Step 4. POST /api/generate/detail-page    → 상세페이지 생성 (핵심 측정 대상)
 *
 * nGrinder 설정 권장값:
 *   · vUser : 1 (이 스크립트 기준; 부하 테스트 시 점진 증가)
 *   · Duration : 300s
 *   · Ramp-up  : 30s
 *   · Think Time: 2000ms (실제 사용자 입력 딜레이 시뮬레이션)
 *
 * 사전 준비:
 *   1. TEST_EMAIL / TEST_PASSWORD 에 사전 생성된 계정 입력
 *   2. 해당 계정에 trialCredits >= 반복 횟수만큼 크레딧 보유
 *   3. BASE_URL 을 테스트 환경 URL로 변경
 */

import static net.grinder.script.Grinder.grinder
import static org.junit.Assert.*
import static org.hamcrest.Matchers.*

import net.grinder.plugin.http.HTTPRequest
import net.grinder.plugin.http.HTTPPluginControl
import net.grinder.script.GTest
import net.grinder.scriptengine.groovy.junit.GrinderRunner
import net.grinder.scriptengine.groovy.junit.annotation.BeforeProcess
import net.grinder.scriptengine.groovy.junit.annotation.BeforeThread
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

import HTTPClient.HTTPResponse
import HTTPClient.NVPair

import groovy.json.JsonOutput
import groovy.json.JsonSlurper

// ═══════════════════════════════════════════════════════════════════════════

@RunWith(GrinderRunner)
class TestRunner {

  // ─── 환경 설정 ────────────────────────────────────────────────────────────

  /** 테스트 대상 서버 URL */
  static final String BASE_URL = "http://localhost:3000"

  /**
   * 요청 타임아웃 (ms)
   * · maxDuration=300s 이지만 텍스트 전용(generateImages=false)은 ~10s
   * · 여유 있게 30s 설정
   */
  static final int TIMEOUT_MS = 30_000

  /**
   * 응답 시간 SLA (ms) — CLAUDE.md: "text gen <10s"
   * 이 값을 초과하면 테스트 FAIL 처리
   */
  static final long SLA_RESPONSE_TIME_MS = 10_000L

  // ─── 테스트 계정 ──────────────────────────────────────────────────────────

  /**
   * 사전 생성된 테스트 계정 (Round Robin 으로 vUser마다 분산)
   * - 각 계정은 반복 횟수만큼 trialCredits 보유 필요
   * - 실제 테스트 전 DB에 INSERT 또는 회원가입 API로 생성
   */
  static final String[] TEST_EMAILS = [
    "load-test-1@triple-c.dev",
    "load-test-2@triple-c.dev",
    "load-test-3@triple-c.dev",
  ]
  static final String TEST_PASSWORD = "LoadTest1!"

  // ─── 상품 시나리오 (실제 유저가 입력하는 데이터) ─────────────────────────

  /**
   * [상품명, 카테고리, 주요특징, 타겟] — vUser마다 Round Robin 배정
   * CLAUDE.md 카테고리: FASHION, FOOD, BEAUTY, DIGITAL, GENERIC
   */
  static final Object[][] PRODUCT_SCENARIOS = [
    ["나이키 에어맥스 270",   "FASHION", "경량 에어유닛, 운동/일상 겸용, 다양한 컬러",       "20-30대 패션 관심층"],
    ["설화수 윤조에센스 6세대", "BEAUTY",  "피부 진정, 수분 공급, 발효 성분, 민감성 피부 적합", "30-40대 피부관리 관심 여성"],
    ["애플 에어팟 프로 2세대", "DIGITAL", "ANC 노이즈캔슬링, 공간음향, H2 칩, IPX4 방수",    "20-40대 애플 생태계 유저"],
  ]

  // ─── GTest 인스턴스 (nGrinder 통계 측정 단위) ────────────────────────────

  static GTest csrfTest        // Step 1: CSRF 토큰
  static GTest loginTest       // Step 2: 로그인
  static GTest createProjTest  // Step 3: 프로젝트 생성
  static GTest generateTest    // Step 4: 상세페이지 생성 ← 핵심 측정

  static HTTPRequest request

  // ─── 스레드 로컬 변수 ─────────────────────────────────────────────────────

  String sessionCookie   // 로그인 후 획득한 next-auth.session-token
  String projectId       // 생성된 프로젝트 ID
  int    scenarioIdx     // 이 스레드에 할당된 상품 시나리오 인덱스

  // ═══════════════════════════════════════════════════════════════════════
  // @BeforeProcess — 프로세스(워커) 당 1회 실행
  // ═══════════════════════════════════════════════════════════════════════

  @BeforeProcess
  static void beforeProcess() {
    // 전역 타임아웃 설정 (AI 생성 응답 대기 시간 고려)
    HTTPPluginControl.getConnectionDefaults().timeout = TIMEOUT_MS

    // 쿠키 자동 처리 활성화 (Set-Cookie → 다음 요청에 자동 포함)
    HTTPPluginControl.getConnectionDefaults().setUseCookies(true)

    // nGrinder 통계 단위 등록 (번호, 레이블)
    csrfTest       = new GTest(1, "Step1_CSRF_Token")
    loginTest      = new GTest(2, "Step2_Login")
    createProjTest = new GTest(3, "Step3_Create_Project")
    generateTest   = new GTest(4, "Step4_Generate_DetailPage")  // ← 메인 측정

    request = new HTTPRequest()

    grinder.logger.info("=== [Setup] BeforeProcess 완료. BASE_URL=${BASE_URL}, SLA=${SLA_RESPONSE_TIME_MS}ms ===")
  }

  // ═══════════════════════════════════════════════════════════════════════
  // @BeforeThread — 스레드 당 1회 실행 (GTest 메서드 바인딩)
  // ═══════════════════════════════════════════════════════════════════════

  @BeforeThread
  void beforeThread() {
    // 각 GTest에 이 인스턴스의 메서드를 바인딩 → 응답 시간 개별 측정
    csrfTest.record(this, "step1_getCsrfToken")
    loginTest.record(this, "step2_login")
    createProjTest.record(this, "step3_createProject")
    generateTest.record(this, "step4_generateDetailPage")

    // 응답 시간을 요청 완료 후 즉시 보고
    grinder.statistics.delayReports = true

    // 스레드 번호 기반 Round Robin으로 시나리오 배정
    scenarioIdx = (int)(grinder.threadNumber % PRODUCT_SCENARIOS.length)

    grinder.logger.info(
      "[Thread-${grinder.threadNumber}] 시나리오 배정: " +
      "${PRODUCT_SCENARIOS[scenarioIdx][0]} / ${PRODUCT_SCENARIOS[scenarioIdx][1]}"
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // @Before — 각 @Test 전 공통 헤더 초기화
  // ═══════════════════════════════════════════════════════════════════════

  @Before
  void before() {
    request.setHeaders([
      new NVPair("Accept", "application/json"),
    ] as NVPair[])
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Step 1: CSRF 토큰 획득
  //   NextAuth는 POST 요청 시 CSRF 토큰 필수
  //   GET /api/auth/csrf → { "csrfToken": "abc123..." }
  // ═══════════════════════════════════════════════════════════════════════

  @Test
  void step1_getCsrfToken() {
    request.setHeaders([
      new NVPair("Accept", "application/json"),
    ] as NVPair[])

    HTTPResponse result = request.GET("${BASE_URL}/api/auth/csrf")

    // 상태 코드 검증
    assertThat(
      "[Step1] CSRF 엔드포인트 상태 코드",
      result.statusCode,
      is(200)
    )

    // csrfToken 파싱 후 스레드 변수에 저장 (Step 2에서 사용)
    def body = new JsonSlurper().parseText(result.text)
    def csrfToken = body?.csrfToken as String

    assertThat("[Step1] csrfToken 존재 여부", csrfToken, notNullValue())

    // 스레드 변수에 저장 (Groovy 클로저 scope 우회)
    this.metaClass.csrfToken = csrfToken

    grinder.logger.info("[Step1] ✓ CSRF 토큰 획득 완료 (토큰 앞 8자: ${csrfToken?.take(8)}...)")
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Step 2: 로그인 → 세션 쿠키 획득
  //   POST /api/auth/callback/credentials
  //   Content-Type: application/x-www-form-urlencoded
  //   → 성공 시 Set-Cookie: next-auth.session-token=...
  // ═══════════════════════════════════════════════════════════════════════

  @Test
  void step2_login() {
    def emailIdx  = (int)(grinder.threadNumber % TEST_EMAILS.length)
    def email     = TEST_EMAILS[emailIdx]
    def csrfToken = this.metaClass.hasProperty(this, "csrfToken")
                    ? this.metaClass.csrfToken
                    : ""

    // form-urlencoded 페이로드 (NextAuth credentials provider 규격)
    def formBody = "csrfToken=${URLEncoder.encode(csrfToken, 'UTF-8')}" +
                   "&callbackUrl=${URLEncoder.encode(BASE_URL, 'UTF-8')}" +
                   "&email=${URLEncoder.encode(email, 'UTF-8')}" +
                   "&password=${URLEncoder.encode(TEST_PASSWORD, 'UTF-8')}" +
                   "&json=true"

    request.setHeaders([
      new NVPair("Content-Type", "application/x-www-form-urlencoded"),
      new NVPair("Accept",       "application/json"),
    ] as NVPair[])

    HTTPResponse result = request.POST(
      "${BASE_URL}/api/auth/callback/credentials",
      formBody.getBytes("UTF-8")
    )

    // NextAuth는 로그인 성공 시 200 또는 302 반환
    def status = result.statusCode
    assertThat(
      "[Step2] 로그인 상태 코드 (200 또는 302 허용)",
      status,
      anyOf(is(200), is(302))
    )

    // Set-Cookie 헤더에서 세션 토큰 추출
    result.listHeaders().each { header ->
      if (header.name?.toLowerCase() == "set-cookie" &&
          header.value?.contains("next-auth.session-token")) {
        // "next-auth.session-token=xxx; Path=/; HttpOnly; ..." 에서 쿠키 값만 추출
        sessionCookie = header.value.split(";")[0].trim()
        grinder.logger.info("[Step2] ✓ 세션 쿠키 획득: ${sessionCookie.take(40)}...")
      }
    }

    if (!sessionCookie) {
      // 쿠키 자동 관리가 활성화된 경우 이미 요청에 포함되므로 경고만 출력
      grinder.logger.warn(
        "[Step2] ⚠ Set-Cookie 헤더에서 세션 토큰을 찾지 못했습니다. " +
        "HTTPPluginControl의 쿠키 자동 관리가 활성화되어 있으면 정상입니다."
      )
    }

    grinder.logger.info("[Step2] ✓ 로그인 완료 (계정: ${email}, 상태: ${status})")
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Step 3: 프로젝트 생성 → projectId 획득
  //   POST /api/projects
  //   요청마다 새 프로젝트를 생성하여 독립적인 테스트 보장
  // ═══════════════════════════════════════════════════════════════════════

  @Test
  void step3_createProject() {
    def scenario = PRODUCT_SCENARIOS[scenarioIdx]

    def headers = [new NVPair("Content-Type", "application/json"),
                   new NVPair("Accept",       "application/json")]
    if (sessionCookie) {
      headers << new NVPair("Cookie", sessionCookie)
    }
    request.setHeaders(headers as NVPair[])

    def payload = JsonOutput.toJson([
      title:       "${scenario[0]} 상세페이지 - 부하테스트",
      productName: scenario[0],
      category:    scenario[1],
    ])

    HTTPResponse result = request.POST(
      "${BASE_URL}/api/projects",
      payload.getBytes("UTF-8")
    )

    assertThat(
      "[Step3] 프로젝트 생성 상태 코드",
      result.statusCode,
      is(201)
    )

    def body = new JsonSlurper().parseText(result.text)
    projectId = body?.data?.id as String

    assertThat("[Step3] projectId 존재 여부", projectId, not(isEmptyOrNullString()))

    grinder.logger.info("[Step3] ✓ 프로젝트 생성 완료 (ID: ${projectId})")
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Step 4: 상세페이지 생성 ← 핵심 부하 측정 대상
  //
  //   POST /api/generate/detail-page
  //
  //   내부 처리 순서:
  //     1. getServerSession      (~10-30ms)   JWT 파싱 + DB
  //     2. prisma.user.findUnique (~5-15ms)   크레딧 조회
  //     3. prisma.project.findUnique (~5-15ms) 프로젝트 조회
  //     4. generateDetailPage()  (5,000-10,000ms) ← AI 호출 (90% 이상)
  //        · buildEnhancedSystemPrompt → OpenAI Chat API
  //        · 훅 메시지 생성 + 섹션 본문 생성 (텍스트 전용)
  //     5. prisma 버전/히스토리 저장 (병렬 × 5쿼리)
  //     6. trialCredits 차감
  //
  //   측정 지표:
  //     · 응답 시간 (SLA: < 10,000ms)
  //     · HTTP 상태 코드 (200 OK)
  //     · 응답 바디: success=true, versions 배열 존재
  // ═══════════════════════════════════════════════════════════════════════

  @Test
  void step4_generateDetailPage() {
    // 선행 Step 실패 시 스킵 (오류 연쇄 방지)
    if (!projectId) {
      grinder.logger.error("[Step4] ✗ projectId 없음 — Step3 실패 가능성. 스킵합니다.")
      return
    }

    def scenario = PRODUCT_SCENARIOS[scenarioIdx]

    def headers = [new NVPair("Content-Type", "application/json"),
                   new NVPair("Accept",       "application/json")]
    if (sessionCookie) {
      headers << new NVPair("Cookie", sessionCookie)
    }
    request.setHeaders(headers as NVPair[])

    // ── 요청 페이로드 ─────────────────────────────────────────────────
    // 유저 시나리오: 상품명 + 카테고리 입력 후 "생성" 버튼 클릭
    // generateImages=false: 이미지 생성 비활성화 → 텍스트 생성만 (SLA 10s 기준)
    // generateImages=true 로 변경 시 응답 시간 20-60s 증가 주의
    def payload = JsonOutput.toJson([
      projectId:      projectId,
      productName:    scenario[0],           // 상품명
      category:       scenario[1],           // 카테고리 (FASHION / BEAUTY / DIGITAL)
      keyFeatures:    [scenario[2] as String], // 주요 특징 (최소 1개 필수)
      targetAudience: scenario[3],           // 타겟 고객
      copyLength:     "medium",              // short / medium / long
      generateImages: false,                 // ★ false = 텍스트 생성 전용 (빠름)
    ])

    // ── 요청 전송 & 응답 시간 측정 ───────────────────────────────────
    long startTime = System.currentTimeMillis()

    HTTPResponse result = request.POST(
      "${BASE_URL}/api/generate/detail-page",
      payload.getBytes("UTF-8")
    )

    long elapsed = System.currentTimeMillis() - startTime

    // ── 검증 1: HTTP 상태 코드 ────────────────────────────────────────
    assertThat(
      "[Step4] 상태 코드 200 OK (실제: ${result.statusCode})",
      result.statusCode,
      is(200)
    )

    // ── 검증 2: 응답 시간 SLA ─────────────────────────────────────────
    // CLAUDE.md Performance targets: "text gen <10s"
    assertThat(
      "[Step4] 응답 시간 SLA ${SLA_RESPONSE_TIME_MS}ms 이하 (실제: ${elapsed}ms)",
      elapsed,
      lessThan(SLA_RESPONSE_TIME_MS)
    )

    // ── 검증 3: 응답 바디 구조 ────────────────────────────────────────
    def body
    try {
      body = new JsonSlurper().parseText(result.text)
    } catch (Exception e) {
      fail("[Step4] 응답 바디 JSON 파싱 실패: ${result.text.take(200)}")
    }

    assertThat(
      "[Step4] success 필드가 true",
      body?.success as Boolean,
      is(true)
    )

    assertThat(
      "[Step4] data.versions 배열 존재",
      body?.data?.versions,
      notNullValue()
    )

    def versionCount    = body?.data?.versions?.size() ?: 0
    def remainingCredit = body?.data?.remainingCredits ?: "N/A"

    // ── 성능 로그 ─────────────────────────────────────────────────────
    grinder.logger.info(
      "[Step4] ✓ 생성 완료 | " +
      "상품: ${scenario[0]} | " +
      "카테고리: ${scenario[1]} | " +
      "상태: ${result.statusCode} | " +
      "응답시간: ${elapsed}ms | " +
      "버전수: ${versionCount} | " +
      "잔여크레딧: ${remainingCredit}"
    )

    // SLA 경계 경고 로그
    if (elapsed > SLA_RESPONSE_TIME_MS * 0.8) {
      grinder.logger.warn(
        "[Step4] ⚠ 응답 시간이 SLA의 80% 초과 (${elapsed}ms / ${SLA_RESPONSE_TIME_MS}ms)"
      )
    }
  }
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * nGrinder 실행 전 체크리스트
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. 테스트 계정 사전 생성
 *    - load-test-1@triple-c.dev / LoadTest1! 계정 생성 (회원가입 또는 DB INSERT)
 *    - trialCredits >= (Duration / 평균응답시간) 크레딧 보유
 *
 * 2. nGrinder 권장 설정
 *    ┌──────────────────────────────────────────────┐
 *    │  항목          │ 1 vUser 기준 │ 부하 테스트    │
 *    ├──────────────────────────────────────────────┤
 *    │  vUser         │ 1            │ 5 → 10 → 20   │
 *    │  Duration      │ 300s         │ 600s           │
 *    │  Ramp-up       │ 0s           │ 60s            │
 *    │  Think Time    │ 2000ms       │ 1000ms         │
 *    │  Timeout       │ 30,000ms     │ 30,000ms       │
 *    └──────────────────────────────────────────────┘
 *
 * 3. 예상 측정 지표 (generateImages=false 기준)
 *    ┌────────────────────────────────────────────────────────────────┐
 *    │  지표                  │ 정상         │ 주의         │ 위험    │
 *    ├────────────────────────────────────────────────────────────────┤
 *    │  Step4 응답 시간 P50   │ < 5,000ms    │ 5~8,000ms    │ > 8s    │
 *    │  Step4 응답 시간 P90   │ < 8,000ms    │ 8~10,000ms   │ > 10s   │
 *    │  Step4 응답 시간 P99   │ < 10,000ms   │ SLA 경계     │ > 10s   │
 *    │  에러율 (5xx)          │ 0%           │ < 1%         │ > 1%    │
 *    │  TPS                   │ 0.1 ~ 0.2    │ (AI 특성상 낮음)       │
 *    └────────────────────────────────────────────────────────────────┘
 *
 * 4. 동시 부하 취약 시나리오
 *    - vUser >= 5 이상: DB 커넥션 풀 고갈 (prisma 직렬 쿼리 × 5)
 *    - vUser >= 10 이상: OpenAI/Gemini Rate Limit (429 Too Many Requests)
 *    - 동일 계정 동시 요청: trialCredits race condition 가능성
 *
 * 5. 스크립트 업로드 경로 (nGrinder Web UI)
 *    Script → Upload → generate-detail-page.groovy
 */
