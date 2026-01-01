import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = process.argv[2] || 'C:/Users/user/Desktop/AI심화캠프_패스트캠퍼스/code/crawling_oliv/oliveyoung_data/product_images';
const JSON_DIR = process.argv[3] || 'C:/Users/user/Desktop/AI심화캠프_패스트캠퍼스/code/crawling_oliv/oliveyoung_data/ocr_results_gemini';

console.log('🚀 빠른 업로드 시작 (중복 체크 없음)\n');

async function uploadImage(filePath: string): Promise<string | null> {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) return null; // 10MB 초과 스킵

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'oliveyoung-templates',
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch {
    return null;
  }
}

async function run() {
  const subDirs = fs.readdirSync(IMAGES_DIR)
    .filter(name => name.startsWith('oliveyoung_') && !name.endsWith('.zip'))
    .map(name => ({
      imageDir: path.join(IMAGES_DIR, name),
      jsonPath: path.join(JSON_DIR, `${name}.json`),
      name,
    }))
    .filter(item => fs.statSync(item.imageDir).isDirectory());

  console.log(`📁 총 ${subDirs.length}개 폴더\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const { imageDir, jsonPath, name } of subDirs) {
    if (!fs.existsSync(jsonPath)) {
      skipped++;
      continue;
    }

    try {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const productName = jsonData.name || name;
      const brand = jsonData.brand || '올리브영';
      const productCode = jsonData.product_code || name.match(/A\d{12}/)?.[0] || '';
      const originalPrice = jsonData.price || '';

      // 이미지 업로드 (main, detail만 - detail_page 제외)
      const imageFiles = fs.readdirSync(imageDir)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .filter(f => !f.includes('detail_page')) // 전체 페이지 이미지 제외
        .sort();

      const uploadedImages: {
        url: string;
        filename: string;
        isMain: boolean;
        ocr_text?: string;
        description?: string;
        prompt?: string;
      }[] = [];

      for (const file of imageFiles) {
        const url = await uploadImage(path.join(imageDir, file));
        if (url) {
          // JSON에서 해당 이미지의 메타데이터 찾기
          const imageMeta = jsonData.images?.find((img: any) => img.image === file);
          uploadedImages.push({
            url,
            filename: file,
            isMain: file.startsWith('main'),
            ocr_text: imageMeta?.ocr_text || '',
            description: imageMeta?.description || '',
            prompt: imageMeta?.prompt || '',
          });
        }
      }

      if (uploadedImages.length === 0) {
        skipped++;
        continue;
      }

      // DB 저장
      const mainImage = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0].url;
      const allImageUrls = uploadedImages.map(i => i.url);

      // 첫 번째 이미지의 description 가져오기
      const firstImageDesc = uploadedImages.find(i => !i.isMain)?.description || uploadedImages[0]?.description || productName;

      await prisma.template.create({
        data: {
          name: productName,
          description: firstImageDesc,
          thumbnailUrl: mainImage,
          previewImages: allImageUrls, // 모든 이미지 순서대로
          category: 'BEAUTY',
          tags: ['올리브영', brand, productCode].filter(Boolean),
          price: 0,
          isPublished: true,
          publishedAt: new Date(),
          sections: {
            // 기본 제품 정보
            product_code: productCode,
            name: productName,
            brand: brand,
            category: jsonData.category || '',
            price: originalPrice,
            // 각 이미지 URL + 메타데이터 연결
            images: uploadedImages,
          },
        },
      });

      uploaded++;
      process.stdout.write(`\r✅ ${uploaded}개 업로드 완료 (스킵: ${skipped})`);
    } catch {
      skipped++;
    }
  }

  console.log(`\n\n🎉 완료! 업로드: ${uploaded}개, 스킵: ${skipped}개`);
  await prisma.$disconnect();
}

run().catch(console.error);
