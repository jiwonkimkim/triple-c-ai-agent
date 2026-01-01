import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function check() {
  const t = await prisma.template.findFirst({ where: { tags: { has: '올리브영' } } });
  if (!t) {
    console.log('템플릿 없음');
    await prisma.$disconnect();
    return;
  }

  const s = t.sections as any;
  console.log('=== 저장된 데이터 확인 ===');
  console.log('이름:', t.name);
  console.log('설명:', t.description?.substring(0, 80) + '...');
  console.log('태그:', t.tags);
  console.log('previewImages:', t.previewImages?.length);
  console.log('\n=== sections ===');
  console.log('product_code:', s?.product_code);
  console.log('name:', s?.name);
  console.log('brand:', s?.brand);
  console.log('category:', s?.category);
  console.log('price:', s?.price);
  console.log('images 개수:', s?.images?.length);

  if (s?.images?.[0]) {
    console.log('\n첫번째 이미지:');
    console.log('  url:', s.images[0].url?.substring(0, 60) + '...');
    console.log('  filename:', s.images[0].filename);
    console.log('  ocr_text:', s.images[0].ocr_text?.substring(0, 50) + '...');
    console.log('  description:', s.images[0].description?.substring(0, 50) + '...');
    console.log('  prompt:', s.images[0].prompt?.substring(0, 50) + '...');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
