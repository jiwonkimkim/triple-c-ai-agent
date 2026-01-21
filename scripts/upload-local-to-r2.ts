/**
 * 로컬 이미지 → R2 업로드 스크립트
 *
 * JSON 메타데이터를 기반으로 로컬 이미지를 R2에 업로드하고 DB 업데이트
 * 실행: npx tsx scripts/upload-local-to-r2.ts
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

// R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// 로컬 경로들
const LOCAL_IMAGES_PATH = 'C:\\Users\\user\\Desktop\\AI심화캠프_패스트캠퍼스\\code\\crawling_oliv\\oliveyoung_data\\product_images';
const LOCAL_METADATA_PATH = 'C:\\Users\\user\\Desktop\\AI심화캠프_패스트캠퍼스\\code\\crawling_oliv\\oliveyoung_data\\ocr_results_gemini';

// 7GB 제한 (바이트)
const MAX_UPLOAD_SIZE = 7 * 1024 * 1024 * 1024; // 7GB

// 통계
let stats = {
  totalMetadata: 0,
  matchedTemplates: 0,
  uploadedFiles: 0,
  uploadedBytes: 0,
  updatedTemplates: 0,
  skippedTemplates: 0,
  errors: 0,
};

interface ProductMetadata {
  product_code: string;
  name: string;
  brand: string;
  folder_name: string;
}

/**
 * Content-Type 결정
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * 파일을 R2에 업로드
 */
async function uploadFileToR2(
  localPath: string,
  r2Key: string
): Promise<{ url: string; size: number } | null> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    return {
      url: `${R2_PUBLIC_URL}/${r2Key}`,
      size: fileBuffer.length,
    };
  } catch (error: any) {
    console.log(`    [ERROR] 업로드 실패: ${error.message}`);
    return null;
  }
}

/**
 * 폴더 크기 계산
 */
function getFolderSize(folderPath: string): number {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        totalSize += stat.size;
      }
    }
  } catch (e) {
    // ignore
  }
  return totalSize;
}

/**
 * 메인 실행
 */
async function main() {
  console.log('==========================================');
  console.log('   로컬 이미지 → R2 업로드 시작');
  console.log('==========================================');
  console.log(`R2 Bucket: ${R2_BUCKET}`);
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}`);
  console.log(`이미지 경로: ${LOCAL_IMAGES_PATH}`);
  console.log(`메타데이터 경로: ${LOCAL_METADATA_PATH}`);
  console.log(`최대 업로드 용량: ${(MAX_UPLOAD_SIZE / 1024 / 1024 / 1024).toFixed(1)}GB\n`);

  try {
    // 1. JSON 메타데이터 파일 읽기
    const metadataFiles = fs.readdirSync(LOCAL_METADATA_PATH)
      .filter(f => f.endsWith('.json'));

    console.log(`메타데이터 파일 수: ${metadataFiles.length}개\n`);
    stats.totalMetadata = metadataFiles.length;

    // 2. 이름 → 메타데이터 매핑 생성
    const nameToMetadata = new Map<string, ProductMetadata>();
    for (const file of metadataFiles) {
      try {
        const content = fs.readFileSync(path.join(LOCAL_METADATA_PATH, file), 'utf-8');
        const metadata: ProductMetadata = JSON.parse(content);
        if (metadata.name && metadata.product_code) {
          nameToMetadata.set(metadata.name, metadata);
        }
      } catch (e) {
        // skip invalid JSON
      }
    }
    console.log(`매핑된 메타데이터: ${nameToMetadata.size}개\n`);

    // 3. DB에서 Cloudinary URL이 있는 템플릿 조회
    const templates = await prisma.template.findMany({
      where: {
        thumbnailUrl: { contains: 'cloudinary' },
      },
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        previewImages: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Cloudinary URL 템플릿: ${templates.length}개\n`);
    console.log('========================================\n');

    // 4. 템플릿별로 처리
    for (const template of templates) {
      // 용량 제한 체크
      if (stats.uploadedBytes >= MAX_UPLOAD_SIZE) {
        console.log(`\n⚠️ 최대 업로드 용량(${(MAX_UPLOAD_SIZE / 1024 / 1024 / 1024).toFixed(1)}GB) 도달. 중단합니다.\n`);
        break;
      }

      const index = templates.indexOf(template) + 1;
      const shortName = template.name.length > 50 ? template.name.substring(0, 50) + '...' : template.name;
      console.log(`[${index}/${templates.length}] ${shortName}`);

      // 템플릿 이름으로 메타데이터 찾기
      const metadata = nameToMetadata.get(template.name);
      if (!metadata) {
        console.log('  → 메타데이터 없음 (스킵)\n');
        stats.skippedTemplates++;
        continue;
      }

      const productCode = metadata.product_code;
      const localFolder = path.join(LOCAL_IMAGES_PATH, metadata.folder_name);

      console.log(`  → 제품코드: ${productCode}`);
      console.log(`  → 폴더: ${metadata.folder_name}`);

      // 로컬 폴더 존재 확인
      if (!fs.existsSync(localFolder)) {
        console.log('  → 로컬 폴더 없음 (스킵)\n');
        stats.skippedTemplates++;
        continue;
      }

      stats.matchedTemplates++;

      // 폴더 크기 체크
      const folderSize = getFolderSize(localFolder);
      if (stats.uploadedBytes + folderSize > MAX_UPLOAD_SIZE) {
        console.log(`  → 용량 초과 예상 (${((stats.uploadedBytes + folderSize) / 1024 / 1024 / 1024).toFixed(2)}GB), 스킵\n`);
        stats.skippedTemplates++;
        continue;
      }

      const updates: { thumbnailUrl?: string; previewImages?: string[] } = {};

      // 5. main.jpg, main.jpeg, main.png → thumbnailUrl
      let mainPath = path.join(localFolder, 'main.jpg');
      let mainExt = 'jpg';
      if (!fs.existsSync(mainPath)) {
        mainPath = path.join(localFolder, 'main.jpeg');
        mainExt = 'jpeg';
      }
      if (!fs.existsSync(mainPath)) {
        mainPath = path.join(localFolder, 'main.png');
        mainExt = 'png';
      }
      if (fs.existsSync(mainPath)) {
        console.log(`  → main.${mainExt} 업로드 중...`);
        const r2Key = `templates/${productCode}/main.${mainExt}`;
        const result = await uploadFileToR2(mainPath, r2Key);
        if (result) {
          updates.thumbnailUrl = result.url;
          stats.uploadedBytes += result.size;
          stats.uploadedFiles++;
          console.log(`    ✅ 완료`);
        } else {
          stats.errors++;
        }
      }

      // 6. detail_*.jpg, detail_*.png, detail_*.gif → previewImages
      const files = fs.readdirSync(localFolder);
      const detailFiles = files
        .filter(f => f.startsWith('detail_') && !f.includes('detail_page') &&
                     (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif')))
        .sort();

      if (detailFiles.length > 0) {
        console.log(`  → detail 이미지 ${detailFiles.length}개 업로드 중...`);
        const previewUrls: string[] = [];
        let uploadedCount = 0;

        for (const detailFile of detailFiles) {
          const detailPath = path.join(localFolder, detailFile);
          const r2Key = `templates/${productCode}/${detailFile}`;
          const result = await uploadFileToR2(detailPath, r2Key);

          if (result) {
            previewUrls.push(result.url);
            stats.uploadedBytes += result.size;
            stats.uploadedFiles++;
            uploadedCount++;
          } else {
            stats.errors++;
          }
        }

        if (previewUrls.length > 0) {
          updates.previewImages = previewUrls;
          console.log(`    ✅ ${uploadedCount}/${detailFiles.length}개 완료`);
        }
      }

      // 7. DB 업데이트
      if (Object.keys(updates).length > 0) {
        await prisma.template.update({
          where: { id: template.id },
          data: updates,
        });
        stats.updatedTemplates++;
        console.log('  → DB 업데이트 완료');
      }

      const uploadedMB = (stats.uploadedBytes / 1024 / 1024).toFixed(1);
      const uploadedGB = (stats.uploadedBytes / 1024 / 1024 / 1024).toFixed(2);
      console.log(`  → 누적: ${uploadedMB}MB (${uploadedGB}GB)\n`);
    }

    // 결과 출력
    console.log('\n==========================================');
    console.log('           업로드 완료');
    console.log('==========================================');
    console.log(`총 메타데이터: ${stats.totalMetadata}`);
    console.log(`매칭된 템플릿: ${stats.matchedTemplates}`);
    console.log(`업데이트된 템플릿: ${stats.updatedTemplates}`);
    console.log(`스킵된 템플릿: ${stats.skippedTemplates}`);
    console.log(`업로드된 파일: ${stats.uploadedFiles}`);
    console.log(`총 업로드 용량: ${(stats.uploadedBytes / 1024 / 1024 / 1024).toFixed(2)}GB`);
    console.log(`에러: ${stats.errors}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('업로드 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
