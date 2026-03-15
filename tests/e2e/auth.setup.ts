/**
 * Playwright Auth Setup
 * 테스트 실행 전 로그인을 수행하고 인증 상태(쿠키/세션)를 저장합니다.
 *
 * 실행 순서: setup 프로젝트 → chromium 프로젝트 (playwright.config.ts 참고)
 *
 * 환경 변수:
 *   TEST_USER_EMAIL    - 테스트용 계정 이메일 (기본값: test@triple-c.dev)
 *   TEST_USER_PASSWORD - 테스트용 계정 비밀번호 (기본값: Test1234!@)
 */

import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('로그인 세션 저장', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? 'test@triple-c.dev';
  const password = process.env.TEST_USER_PASSWORD ?? 'Test1234!@';

  // .auth 폴더가 없으면 생성
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 로그인 페이지로 이동
  await page.goto('/login');
  await page.waitForSelector('input#email', { timeout: 15_000 });

  // 이메일 / 비밀번호 입력
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: '로그인' }).click();

  // 대시보드 이동 확인
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // 인증 상태(쿠키 포함) 저장
  await page.context().storageState({ path: AUTH_FILE });
  console.log('✅ 인증 상태 저장 완료:', AUTH_FILE);
});
