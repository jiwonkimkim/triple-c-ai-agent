import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function cleanup() {
  console.log('🧹 전체 정리 시작\n');

  // 1. DB 정리
  console.log('🗄️ DB 정리 중...');
  let totalDeleted = 0;
  let deleted = 1;
  while (deleted > 0) {
    const result = await prisma.template.deleteMany({
      where: { tags: { has: '올리브영' } }
    });
    deleted = result.count;
    totalDeleted += deleted;
  }
  console.log('   삭제된 템플릿:', totalDeleted);

  // 2. Cloudinary 정리
  console.log('\n☁️ Cloudinary 정리 중...');
  try {
    // 이미지 삭제 (최대 1000개씩)
    let totalImages = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await cloudinary.api.delete_resources_by_prefix('oliveyoung-templates/', {
        resource_type: 'image',
        type: 'upload',
        max_results: 1000
      });
      const count = Object.keys(result.deleted || {}).length;
      totalImages += count;
      console.log('   삭제됨:', count);
      hasMore = count === 1000;
    }

    console.log('   총 삭제된 이미지:', totalImages);

    // 폴더 삭제
    try {
      await cloudinary.api.delete_folder('oliveyoung-templates');
      console.log('   폴더 삭제 완료');
    } catch {
      console.log('   폴더 없음 또는 이미 삭제됨');
    }
  } catch (e: any) {
    console.log('   Cloudinary 오류:', e.message || e);
  }

  // 3. 최종 확인
  console.log('\n📊 최종 확인:');
  const remaining = await prisma.template.count({ where: { tags: { has: '올리브영' } } });
  console.log('   남은 올리브영 템플릿:', remaining);

  await prisma.$disconnect();
  console.log('\n✅ 정리 완료!');
}

cleanup().catch(console.error);
