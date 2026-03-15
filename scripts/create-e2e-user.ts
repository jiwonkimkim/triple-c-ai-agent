/**
 * E2E 테스트용 유저 생성 스크립트
 *
 * CI(GitHub Actions)에서 Playwright auth.setup.ts 실행 전
 * 테스트 계정이 DB에 없으면 자동으로 생성합니다.
 *
 * 사용:
 *   npx tsx scripts/create-e2e-user.ts
 *
 * 환경 변수:
 *   DATABASE_URL       - PostgreSQL 연결 문자열
 *   TEST_USER_EMAIL    - 테스트 계정 이메일 (기본: e2e-test@triple-c.dev)
 *   TEST_USER_PASSWORD - 테스트 계정 비밀번호 (기본: E2eTestPw1234!)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TEST_USER_EMAIL ?? 'e2e-test@triple-c.dev';
  const password = process.env.TEST_USER_PASSWORD ?? 'E2eTestPw1234!';

  // 이미 존재하면 스킵
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ E2E 테스트 유저 이미 존재:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: new Date(), // credentials 로그인에 필요
      name: 'E2E Test User',
      userType: 'B2C',
      trialCredits: 100,
    },
  });

  console.log('✅ E2E 테스트 유저 생성 완료:', email);
}

main()
  .catch((err) => {
    console.error('❌ 테스트 유저 생성 실패:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
