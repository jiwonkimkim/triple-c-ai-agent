import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

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
    // ── 인증 셋업 ──────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ── chromium: 전체 테스트 스위트 (기본 실행 환경) ──────────────────────
    // npx playwright test                          → chromium만 실행
    // npx playwright test --project=chromium       → 전체 테스트
    // npx playwright test compatibility.spec.ts    → compatibility만 chromium 실행
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── firefox / webkit: compatibility.spec.ts 전용 ───────────────────────
    // npx playwright test --project=chromium --project=firefox --project=webkit
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /compatibility\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /compatibility\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
