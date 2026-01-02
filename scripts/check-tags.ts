import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function run() {
  const templates = await prisma.template.findMany({
    where: { tags: { has: '올리브영' } },
    select: { id: true, name: true, tags: true },
    take: 5
  });

  console.log('샘플 템플릿의 tags:');
  templates.forEach(t => {
    const productCode = t.tags.find(tag => tag.startsWith('A0000'));
    console.log(`\n${t.name.substring(0, 40)}...`);
    console.log(`  제품코드: ${productCode || '없음'}`);
    console.log(`  전체 tags: ${t.tags.join(', ')}`);
  });

  await prisma.$disconnect();
}

run().catch(console.error);
