/**
 * 누락된 썸네일 업로드 스크립트
 *
 * thumbnailUrl이 없거나 Cloudinary URL인 템플릿의 썸네일을 R2로 업로드
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const LOCAL_IMAGES_PATH = 'C:\\Users\\user\\Desktop\\AI심화캠프_패스트캠퍼스\\code\\crawling_oliv\\oliveyoung_data\\product_images';
const LOCAL_METADATA_PATH = 'C:\\Users\\user\\Desktop\\AI심화캠프_패스트캠퍼스\\code\\crawling_oliv\\oliveyoung_data\\ocr_results_gemini';

let stats = { checked: 0, fixed: 0, skipped: 0 };

async function uploadFile(localPath: string, r2Key: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
  } catch (error: any) {
    console.log(`    [ERROR] ${error.message}`);
    return null;
  }
}

function findMainImage(folderPath: string): { path: string; ext: string } | null {
  const extensions = ['jpg', 'jpeg', 'png'];
  for (const ext of extensions) {
    const mainPath = path.join(folderPath, `main.${ext}`);
    if (fs.existsSync(mainPath)) {
      return { path: mainPath, ext };
    }
  }
  return null;
}

async function fix() {
  console.log('==========================================');
  console.log('   누락된 썸네일 수정 시작');
  console.log('==========================================\n');

  // 1. JSON 메타데이터 로드
  const metadataFiles = fs.readdirSync(LOCAL_METADATA_PATH).filter(f => f.endsWith('.json'));
  const nameToMetadata = new Map<string, { product_code: string; folder_name: string }>();

  for (const file of metadataFiles) {
    try {
      const content = fs.readFileSync(path.join(LOCAL_METADATA_PATH, file), 'utf-8');
      const metadata = JSON.parse(content);
      if (metadata.name && metadata.product_code) {
        nameToMetadata.set(metadata.name, {
          product_code: metadata.product_code,
          folder_name: metadata.folder_name,
        });
      }
    } catch (e) {}
  }

  console.log(`메타데이터 로드: ${nameToMetadata.size}개\n`);

  // 2. 모든 템플릿 조회
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, thumbnailUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`총 템플릿: ${templates.length}개\n`);
  console.log('========================================\n');

  for (const template of templates) {
    stats.checked++;
    const shortName = template.name.length > 50 ? template.name.substring(0, 50) + '...' : template.name;

    // R2 URL이면 스킵
    if (template.thumbnailUrl?.includes('r2.dev')) {
      continue;
    }

    // 메타데이터 찾기
    const metadata = nameToMetadata.get(template.name);
    if (!metadata) {
      continue;
    }

    const localFolder = path.join(LOCAL_IMAGES_PATH, metadata.folder_name);
    if (!fs.existsSync(localFolder)) {
      continue;
    }

    // main 이미지 찾기
    const mainImage = findMainImage(localFolder);
    if (!mainImage) {
      continue;
    }

    console.log(`[${stats.checked}] ${shortName}`);
    console.log(`  → 제품코드: ${metadata.product_code}`);
    console.log(`  → main.${mainImage.ext} 업로드 중...`);

    const r2Key = `templates/${metadata.product_code}/main.${mainImage.ext}`;
    const url = await uploadFile(mainImage.path, r2Key);

    if (url) {
      await prisma.template.update({
        where: { id: template.id },
        data: { thumbnailUrl: url },
      });
      stats.fixed++;
      console.log(`    ✅ 완료\n`);
    } else {
      stats.skipped++;
      console.log(`    ❌ 실패\n`);
    }
  }

  console.log('\n==========================================');
  console.log('           수정 완료');
  console.log('==========================================');
  console.log(`확인: ${stats.checked}`);
  console.log(`수정: ${stats.fixed}`);
  console.log(`스킵: ${stats.skipped}`);
  console.log('==========================================\n');

  await prisma.$disconnect();
}

fix().catch(console.error);
