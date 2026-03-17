import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ── .env.local 로드 (NEXTAUTH_SECRET 등 로컬 환경변수 반영) ─────────────────
// Playwright의 webServer는 Node 프로세스를 직접 실행하므로 .env.local을 자동
// 로드하지 않습니다. webServer.env 옵션에 필수 변수를 명시적으로 전달합니다.
function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const localEnv = loadEnvFile(path.join(__dirname, '.env.local'));
const testEnv = loadEnvFile(path.join(__dirname, '.env.test'));

// webServer에 주입할 환경변수 우선순위:
//   .env.local (로컬 개발) > process.env (CI job env) > .env.test > 하드코딩 기본값
//
// ⚠️ 주의: Playwright webServer의 env 옵션은 process.env에 MERGE됩니다.
//   즉, 여기서 명시한 키가 process.env의 동일 키를 덮어씁니다.
//   .env.test에 플레이스홀더(YOUR_PASSWORD_HERE 등)가 있으면 CI의 올바른 값을
//   덮어쓰게 되므로, 반드시 process.env를 명시적 폴백으로 포함해야 합니다.
const webServerEnv: Record<string, string> = {
  ...testEnv,
  ...localEnv,
  // DATABASE_URL: .env.local > CI process.env > .env.test > 빈 문자열
  // CI에서 .env.test의 플레이스홀더가 process.env(DB 컨테이너 URL)를 덮어쓰는 버그 방지
  DATABASE_URL:
    localEnv.DATABASE_URL ??
    process.env.DATABASE_URL ??
    testEnv.DATABASE_URL ??
    '',
  // NEXTAUTH_SECRET: webServer와 테스트 러너가 동일한 시크릿을 써야 JWT 검증 통과
  // .env.local > .env.test > CI process.env > 하드코딩 기본값 순으로 결정
  NEXTAUTH_SECRET:
    localEnv.NEXTAUTH_SECRET ??
    testEnv.NEXTAUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'e2e-test-secret-do-not-use-in-production',
  NEXTAUTH_URL:
    localEnv.NEXTAUTH_URL ??
    testEnv.NEXTAUTH_URL ??
    process.env.NEXTAUTH_URL ??
    BASE_URL,
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'ko-KR',
  },
  projects: [
    // ── 인증 셋업 A: 실제 DB 로그인 (chromium 전체 테스트용) ───────────────
    {
      name: 'setup',
      testMatch: /(?<!compat-)auth\.setup\.ts/,
    },

    // ── 인증 셋업 B: JWT 직접 생성 (firefox/webkit 호환성 테스트 전용) ──────
    // DB 없이 NEXTAUTH_SECRET 만으로 유효한 세션 쿠키를 생성합니다.
    {
      name: 'compat-setup',
      testMatch: /compat-auth\.setup\.ts/,
    },

    // ── chromium: 전체 테스트 스위트 ──────────────────────────────────────
    // setup(실제 DB 로그인)에 의존합니다.
    // DB/환경 변수가 없으면 setup이 실패하여 chromium 테스트 전체가 skip됩니다.
    // compatibility.spec.ts 도 포함됩니다 (DB 있을 때 완전한 결과 확인 가능).
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── firefox / webkit: compatibility.spec.ts 전용 ───────────────────────
    // compat-setup(JWT 직접 생성)에 의존 → 실제 DB 불필요
    // npx playwright test --project=chromium --project=firefox --project=webkit
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/compat-user.json',
      },
      dependencies: ['compat-setup'],
      testMatch: /compatibility\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/compat-user.json',
      },
      dependencies: ['compat-setup'],
      testMatch: /compatibility\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    // /login 페이지는 NEXTAUTH_SECRET이 있으면 DB 없이도 200을 반환합니다.
    // 루트(/)는 auth 에러 페이지로 307 → 500 리디렉트될 수 있어 헬스체크 실패합니다.
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: webServerEnv,
  },
});
