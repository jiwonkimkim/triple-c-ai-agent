/**
 * Oliveyoung 템플릿 업로드 스크립트
 * 이미지를 Cloudinary에 업로드하고, 템플릿 정보를 DB에 저장
 *
 * 실행: npx tsx scripts/upload-oliveyoung-templates.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { PrismaClient, TemplateCategory, TemplateCreator } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface OliveyoungImage {
  image: string;
  ocr_text: string;
  description: string;
  prompt: string;
}

interface OliveyoungTemplateData {
  product_code: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  folder_name: string;
  images: OliveyoungImage[];
}

// 이미지를 Cloudinary에 업로드
async function uploadToCloudinary(filePath: string, folder: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `triple-c/templates/${folder}`,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error(`  ✗ 업로드 실패: ${filePath}`, error);
    throw error;
  }
}

// 단일 템플릿 처리
async function processTemplate(templateDir: string): Promise<void> {
  const dirName = path.basename(templateDir);
  console.log(`\n📦 템플릿 처리 중: ${dirName}`);

  // JSON 파일 찾기
  const files = fs.readdirSync(templateDir);
  const jsonFile = files.find(f => f.endsWith('.json'));

  if (!jsonFile) {
    console.log(`  ⚠️ JSON 파일 없음, 건너뜀`);
    return;
  }

  // JSON 파일 읽기
  const jsonPath = path.join(templateDir, jsonFile);
  const templateData: OliveyoungTemplateData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`  📄 제품: ${templateData.name}`);
  console.log(`  🏷️ 브랜드: ${templateData.brand}`);

  // 기존 템플릿 확인
  const existing = await prisma.template.findFirst({
    where: {
      name: `[${templateData.brand}] ${templateData.name}`,
      category: TemplateCategory.BEAUTY,
    }
  });

  if (existing) {
    console.log(`  ⏭️ 이미 존재함, 건너뜀`);
    return;
  }

  // 이미지 업로드
  console.log(`  📤 이미지 업로드 중...`);
  const uploadedImages: string[] = [];
  let thumbnailUrl = '';

  // main.jpg 먼저 처리
  const mainImagePath = path.join(templateDir, 'main.jpg');
  if (fs.existsSync(mainImagePath)) {
    thumbnailUrl = await uploadToCloudinary(mainImagePath, dirName);
    uploadedImages.push(thumbnailUrl);
    console.log(`    ✓ main.jpg 업로드 완료`);
  }

  // 상세 이미지 업로드
  for (const imageInfo of templateData.images) {
    if (imageInfo.image === 'main.jpg' || imageInfo.image === 'detail_page.png') continue;

    const imagePath = path.join(templateDir, imageInfo.image);
    if (fs.existsSync(imagePath)) {
      const url = await uploadToCloudinary(imagePath, dirName);
      uploadedImages.push(url);
      console.log(`    ✓ ${imageInfo.image} 업로드 완료`);
    }
  }

  // 썸네일이 없으면 첫 번째 이미지 사용
  if (!thumbnailUrl && uploadedImages.length > 0) {
    thumbnailUrl = uploadedImages[0];
  }

  // 섹션 데이터 생성
  const sections = [
    {
      id: 'hero',
      type: 'HERO',
      title: templateData.brand,
      subtitle: templateData.name,
      imageUrl: thumbnailUrl,
    },
    {
      id: 'features',
      type: 'FEATURES',
      title: '제품 특징',
      items: templateData.images.slice(0, 5).map((img, idx) => ({
        id: `feature-${idx}`,
        title: img.ocr_text.split('\n')[0] || '',
        description: img.description,
        imageUrl: uploadedImages[idx + 1] || '',
      })),
    }
  ];

  // DB에 저장
  await prisma.template.create({
    data: {
      name: `[${templateData.brand}] ${templateData.name}`,
      category: TemplateCategory.BEAUTY,
      thumbnailUrl: thumbnailUrl,
      sections: sections,
      isReference: true,
      createdBy: TemplateCreator.SYSTEM,
      userId: null,
      isPublished: true,
      publishedAt: new Date(),
      price: 0,
      description: `${templateData.category} | ${templateData.brand} 제품 참조 템플릿`,
      previewImages: uploadedImages,
      tags: [
        templateData.brand,
        '올리브영',
        'K-뷰티',
        '참조템플릿',
        '립 메이크업'
      ],
      downloadCount: 0,
      rating: null,
      ratingCount: 0,
    },
  });

  console.log(`  ✓ DB에 저장 완료 (이미지 ${uploadedImages.length}개)`);
}

async function main() {
  console.log('🚀 Oliveyoung 템플릿 업로드 시작\n');

  // 환경변수 확인
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME 환경변수가 필요합니다');
    process.exit(1);
  }

  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

  // 템플릿 디렉토리 확인
  const templatesDir = path.join(process.cwd(), 'public', 'templates', 'oliveyoung');

  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ 템플릿 디렉토리를 찾을 수 없습니다: ${templatesDir}`);
    process.exit(1);
  }

  // 하위 디렉토리 찾기 (A000000... 형식)
  const subDirs = fs.readdirSync(templatesDir)
    .filter(name => name.startsWith('A'))
    .map(name => path.join(templatesDir, name))
    .filter(p => fs.statSync(p).isDirectory());

  console.log(`\n📁 발견된 템플릿 폴더: ${subDirs.length}개`);

  let successCount = 0;
  let errorCount = 0;

  for (const dir of subDirs) {
    try {
      await processTemplate(dir);
      successCount++;
    } catch (error) {
      console.error(`  ✗ 처리 실패:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
}

main()
  .catch((error) => {
    console.error('스크립트 실패:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
