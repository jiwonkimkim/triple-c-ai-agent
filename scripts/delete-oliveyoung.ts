import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function run() {
  console.log('올리브영 템플릿 삭제 중...');

  const result = await prisma.template.deleteMany({
    where: { tags: { has: '올리브영' } }
  });

  console.log('삭제 완료:', result.count, '개');

  // 확인
  const remaining = await prisma.template.count({
    where: { tags: { has: '올리브영' } }
  });
  console.log('남은 올리브영 템플릿:', remaining, '개');

  await prisma.$disconnect();
}

run().catch(console.error);
