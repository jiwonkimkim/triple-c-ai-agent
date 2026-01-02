import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

const productCode = process.argv[2] || 'A000000199154';

async function run() {
  console.log(`\n🔍 제품 코드 검색: ${productCode}\n`);

  // 1. DB에서 해당 제품 코드 검색
  const templates = await prisma.template.findMany({
    where: { tags: { has: productCode } },
    select: { id: true, name: true, createdAt: true, tags: true }
  });

  console.log(`DB에서 발견: ${templates.length}개`);
  templates.forEach((t, i) => {
    console.log(`\n[${i + 1}] ${t.name}`);
    console.log(`    ID: ${t.id}`);
    console.log(`    생성: ${t.createdAt}`);
  });

  // 2. 전체 올리브영 템플릿 중복 체크
  console.log('\n\n📊 전체 중복 현황:');
  const allTemplates = await prisma.template.findMany({
    where: { tags: { has: '올리브영' } },
    select: { name: true, tags: true }
  });

  const codeCount: Record<string, number> = {};
  allTemplates.forEach(t => {
    const code = t.tags.find(tag => tag.startsWith('A0000'));
    if (code) {
      codeCount[code] = (codeCount[code] || 0) + 1;
    }
  });

  const duplicateCodes = Object.entries(codeCount).filter(([_, c]) => c > 1);
  console.log(`총 템플릿: ${allTemplates.length}개`);
  console.log(`중복 제품 코드: ${duplicateCodes.length}개`);

  if (duplicateCodes.length > 0) {
    console.log('\n중복 목록:');
    duplicateCodes.forEach(([code, count]) => {
      console.log(`  ${code}: ${count}개`);
    });
  }

  await prisma.$disconnect();
}

run().catch(console.error);
