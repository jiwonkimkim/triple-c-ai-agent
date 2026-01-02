import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function run() {
  const templates = await prisma.template.findMany({
    where: { tags: { has: '올리브영' } },
    select: { id: true, name: true, description: true }
  });

  const nameCount: Record<string, number> = {};
  templates.forEach(t => {
    nameCount[t.name] = (nameCount[t.name] || 0) + 1;
  });

  const duplicates = Object.entries(nameCount).filter(([_, c]) => c > 1);

  console.log('총 올리브영 템플릿:', templates.length);
  console.log('중복된 이름:', duplicates.length);

  if (duplicates.length > 0) {
    console.log('\n중복 목록:');
    duplicates.forEach(([name, count]) => {
      console.log(`  - ${name.substring(0, 50)}... : ${count}개`);
    });
  }

  await prisma.$disconnect();
}

run().catch(console.error);
