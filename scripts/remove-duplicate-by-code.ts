import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function run() {
  console.log('🔍 제품 코드 기준 중복 검사 시작...\n');

  // 올리브영 템플릿 전체 조회
  const allTemplates = await prisma.template.findMany({
    where: { tags: { has: '올리브영' } },
    select: { id: true, name: true, tags: true, createdAt: true },
    orderBy: { createdAt: 'asc' } // 먼저 생성된 것 유지
  });

  console.log(`📊 전체 올리브영 템플릿: ${allTemplates.length}개\n`);

  // 제품 코드별로 그룹화
  const codeMap: Record<string, typeof allTemplates> = {};

  allTemplates.forEach(t => {
    const code = t.tags.find(tag => tag.startsWith('A0000'));
    if (code) {
      if (!codeMap[code]) codeMap[code] = [];
      codeMap[code].push(t);
    }
  });

  // 중복 찾기
  const duplicates = Object.entries(codeMap).filter(([_, items]) => items.length > 1);

  console.log(`🔄 중복된 제품 코드: ${duplicates.length}개\n`);

  if (duplicates.length === 0) {
    console.log('✅ 중복 없음!');
    await prisma.$disconnect();
    return;
  }

  // 중복 목록 출력
  let totalToDelete = 0;
  const idsToDelete: string[] = [];

  duplicates.forEach(([code, items]) => {
    console.log(`\n📦 ${code} (${items.length}개)`);
    items.forEach((t, i) => {
      if (i === 0) {
        console.log(`  ✅ 유지: ${t.name.substring(0, 50)}`);
      } else {
        console.log(`  ❌ 삭제: ${t.name.substring(0, 50)}`);
        idsToDelete.push(t.id);
        totalToDelete++;
      }
    });
  });

  console.log(`\n\n📊 삭제 예정: ${totalToDelete}개`);
  console.log('🚀 중복 삭제 진행 중...\n');

  // 중복 삭제
  const result = await prisma.template.deleteMany({
    where: { id: { in: idsToDelete } }
  });

  console.log(`✅ 삭제 완료: ${result.count}개`);

  // 최종 확인
  const finalCount = await prisma.template.count({
    where: { tags: { has: '올리브영' } }
  });
  console.log(`📊 최종 올리브영 템플릿: ${finalCount}개`);

  await prisma.$disconnect();
}

run().catch(console.error);
