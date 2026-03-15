/**
 * Compatibility Auth Setup
 *
 * Firefox / WebKit 호환성 테스트를 위한 독립적인 인증 셋업입니다.
 * 실제 DB 없이 NextAuth JWT 토큰을 직접 생성하여 쿠키에 주입합니다.
 *
 * 동작 원리:
 *   next-auth/jwt의 encode() 함수는 NEXTAUTH_SECRET으로 JWE 토큰을 생성합니다.
 *   미들웨어(withAuth)는 이 쿠키를 검증하여 인증 상태를 확인합니다.
 *   동일한 NEXTAUTH_SECRET이 webServer와 이 파일에서 공유되므로 검증이 통과됩니다.
 *
 * 요구사항:
 *   - NEXTAUTH_SECRET 환경변수 (playwright.config.ts 의 webServerEnv 에서 주입)
 *   - 실제 DB 불필요 (DB 접근 없음)
 */

import { test as setup } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import * as path from 'path';
import * as fs from 'fs';

const COMPAT_AUTH_FILE = path.join(__dirname, '.auth/compat-user.json');

// playwright.config.ts 의 webServerEnv 와 동일한 폴백 비밀키
const TEST_SECRET =
  process.env.NEXTAUTH_SECRET ?? 'e2e-test-secret-do-not-use-in-production';

setup('호환성 테스트용 JWT 쿠키 생성', async ({ page }) => {
  // .auth 디렉토리 생성
  const authDir = path.dirname(COMPAT_AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // NextAuth v4 JWT 토큰 생성 (withAuth 미들웨어가 수락하는 형식)
  const nowSec = Math.floor(Date.now() / 1000);
  const sessionToken = await encode({
    token: {
      sub: 'compat-test-user-id',
      email: 'compat@triple-c.dev',
      name: '호환성 테스트 사용자',
      userType: 'B2C',
      iat: nowSec,
      exp: nowSec + 60 * 60, // 1시간 유효
      jti: `compat-jti-${Date.now()}`,
    },
    secret: TEST_SECRET,
    maxAge: 60 * 60,
  });

  // 브라우저 컨텍스트에 쿠키 주입
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      expires: nowSec + 60 * 60,
    },
  ]);

  // 실제 인증이 적용되는지 확인 (dashboard 페이지 접근 시 /login 으로 리디렉트 안되어야 함)
  await page.goto('/dashboard/chat');
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error(
      `JWT 쿠키 인증 실패: /login 으로 리디렉트됨. NEXTAUTH_SECRET이 webServer 와 일치하는지 확인하세요.\n현재 URL: ${currentUrl}`
    );
  }

  // 인증 상태(쿠키) 저장
  await page.context().storageState({ path: COMPAT_AUTH_FILE });
  console.log('✅ 호환성 테스트 인증 상태 저장 완료:', COMPAT_AUTH_FILE);
});
