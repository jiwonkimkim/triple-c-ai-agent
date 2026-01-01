import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function check() {
  const templates = await prisma.template.findMany({
    where: { tags: { has: '올리브영' } },
    take: 2,
  });

  console.log('=== 현재 저장된 템플릿 ===\n');
  templates.forEach((t, i) => {
    console.log(`[${i+1}] ID: ${t.id}`);
    console.log(`    이름: ${t.name}`);
    console.log(`    설명: ${t.description?.substring(0, 80)}`);
    console.log(`    태그: ${t.tags.join(', ')}`);
    console.log(`    썸네일: ${t.thumbnailUrl}`);
    console.log(`    isPublished: ${t.isPublished}`);
    const sections = t.sections as any;
    console.log(`    sections.product_code: ${sections?.product_code}`);
    console.log(`    sections.original_price: ${sections?.original_price}`);
    console.log(`    sections.images 개수: ${sections?.images?.length}`);
    console.log(`    previewImages 개수: ${t.previewImages?.length || 0}`);
    console.log('');
  });

  await prisma.$disconnect();
}

check().catch(console.error);
