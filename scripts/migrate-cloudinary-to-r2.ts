/**
 * Cloudinary → R2 이미지 마이그레이션 스크립트
 *
 * 실행: npx tsx scripts/migrate-cloudinary-to-r2.ts
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

// 통계
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
};

/**
 * Cloudinary URL인지 확인
 */
function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * 이미지 다운로드
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`    [SKIP] HTTP ${response.status} - 이미지 접근 불가`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/webp';
    return { buffer, contentType };
  } catch (error: any) {
    console.log(`    [ERROR] 다운로드 실패: ${error.message}`);
    return null;
  }
}

/**
 * R2에 업로드
 */
async function uploadToR2(
  buffer: Buffer,
  contentType: string,
  key: string
): Promise<string | null> {
  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error: any) {
    console.log(`    [ERROR] R2 업로드 실패: ${error.message}`);
    return null;
  }
}

/**
 * Cloudinary URL에서 파일명 추출
 */
function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return fileName || `img_${Date.now()}`;
  } catch {
    return `img_${Date.now()}`;
  }
}

/**
 * 단일 이미지 마이그레이션
 */
async function migrateImage(
  cloudinaryUrl: string,
  folder: string
): Promise<string | null> {
  // 1. 다운로드
  const downloaded = await downloadImage(cloudinaryUrl);
  if (!downloaded) return null;

  // 2. R2에 업로드
  const fileName = extractFileName(cloudinaryUrl);
  const key = `${folder}/${fileName}`;
  const r2Url = await uploadToR2(downloaded.buffer, downloaded.contentType, key);

  return r2Url;
}

/**
 * Template 테이블 마이그레이션
 */
async function migrateTemplates() {
  console.log('\n========================================');
  console.log('Template 테이블 마이그레이션 시작');
  console.log('========================================\n');

  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { thumbnailUrl: { contains: 'cloudinary' } },
        // previewImages는 배열이라 별도 처리 필요
      ],
    },
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      previewImages: true,
    },
  });

  console.log(`총 ${templates.length}개 템플릿 발견\n`);
  stats.total += templates.length;

  for (const template of templates) {
    console.log(`[${templates.indexOf(template) + 1}/${templates.length}] ${template.name.substring(0, 40)}...`);

    let updated = false;
    const updates: { thumbnailUrl?: string; previewImages?: string[] } = {};

    // thumbnailUrl 마이그레이션
    if (isCloudinaryUrl(template.thumbnailUrl)) {
      console.log('  → thumbnailUrl 마이그레이션 중...');
      const newUrl = await migrateImage(template.thumbnailUrl!, 'templates/thumbnails');
      if (newUrl) {
        updates.thumbnailUrl = newUrl;
        updated = true;
        console.log(`    ✅ 성공: ${newUrl.substring(0, 60)}...`);
      } else {
        stats.failed++;
      }
    }

    // previewImages 마이그레이션
    if (template.previewImages && template.previewImages.length > 0) {
      const cloudinaryPreviews = template.previewImages.filter(isCloudinaryUrl);
      if (cloudinaryPreviews.length > 0) {
        console.log(`  → previewImages ${cloudinaryPreviews.length}개 마이그레이션 중...`);

        const newPreviewImages: string[] = [];
        let migratedCount = 0;

        for (const previewUrl of template.previewImages) {
          if (isCloudinaryUrl(previewUrl)) {
            const newUrl = await migrateImage(previewUrl, `templates/${template.id}/previews`);
            if (newUrl) {
              newPreviewImages.push(newUrl);
              migratedCount++;
            } else {
              // 실패한 경우 원본 URL 유지 (나중에 재시도 가능)
              newPreviewImages.push(previewUrl);
            }
          } else {
            // 이미 R2 URL이거나 다른 URL인 경우 유지
            newPreviewImages.push(previewUrl);
          }
        }

        if (migratedCount > 0) {
          updates.previewImages = newPreviewImages;
          updated = true;
          console.log(`    ✅ ${migratedCount}/${cloudinaryPreviews.length}개 성공`);
        }
      }
    }

    // DB 업데이트
    if (updated && Object.keys(updates).length > 0) {
      await prisma.template.update({
        where: { id: template.id },
        data: updates,
      });
      stats.success++;
      console.log('  → DB 업데이트 완료\n');
    } else if (!updated) {
      stats.skipped++;
      console.log('  → 마이그레이션 대상 없음 (스킵)\n');
    }
  }
}

/**
 * ProjectVersion 테이블 마이그레이션
 */
async function migrateProjectVersions() {
  console.log('\n========================================');
  console.log('ProjectVersion 테이블 마이그레이션 시작');
  console.log('========================================\n');

  const versions = await prisma.projectVersion.findMany({
    where: {
      thumbnail: { contains: 'cloudinary' },
    },
    select: {
      id: true,
      projectId: true,
      thumbnail: true,
    },
  });

  console.log(`총 ${versions.length}개 ProjectVersion 발견\n`);
  stats.total += versions.length;

  for (const version of versions) {
    console.log(`[${versions.indexOf(version) + 1}/${versions.length}] Version ${version.id.substring(0, 20)}...`);

    if (isCloudinaryUrl(version.thumbnail)) {
      console.log('  → thumbnail 마이그레이션 중...');
      const newUrl = await migrateImage(version.thumbnail!, `projects/${version.projectId}/thumbnails`);

      if (newUrl) {
        await prisma.projectVersion.update({
          where: { id: version.id },
          data: { thumbnail: newUrl },
        });
        stats.success++;
        console.log(`    ✅ 성공: ${newUrl.substring(0, 60)}...`);
        console.log('  → DB 업데이트 완료\n');
      } else {
        stats.failed++;
        console.log('  → 마이그레이션 실패\n');
      }
    }
  }
}

/**
 * Project 테이블의 productImages 마이그레이션
 */
async function migrateProjects() {
  console.log('\n========================================');
  console.log('Project productImages 마이그레이션 시작');
  console.log('========================================\n');

  // productImages 배열에 cloudinary URL이 있는 프로젝트 찾기
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      productImages: true,
    },
  });

  const projectsWithCloudinary = projects.filter(p =>
    p.productImages?.some(url => isCloudinaryUrl(url))
  );

  console.log(`총 ${projectsWithCloudinary.length}개 프로젝트 발견\n`);
  stats.total += projectsWithCloudinary.length;

  for (const project of projectsWithCloudinary) {
    console.log(`[${projectsWithCloudinary.indexOf(project) + 1}/${projectsWithCloudinary.length}] ${project.title?.substring(0, 40) || project.id}...`);

    const newProductImages: string[] = [];
    let migratedCount = 0;

    for (const imageUrl of project.productImages) {
      if (isCloudinaryUrl(imageUrl)) {
        const newUrl = await migrateImage(imageUrl, `projects/${project.id}/products`);
        if (newUrl) {
          newProductImages.push(newUrl);
          migratedCount++;
        } else {
          newProductImages.push(imageUrl); // 실패 시 원본 유지
        }
      } else {
        newProductImages.push(imageUrl);
      }
    }

    if (migratedCount > 0) {
      await prisma.project.update({
        where: { id: project.id },
        data: { productImages: newProductImages },
      });
      stats.success++;
      console.log(`  ✅ ${migratedCount}개 이미지 마이그레이션 완료\n`);
    } else {
      stats.skipped++;
      console.log('  → 마이그레이션 대상 없음\n');
    }
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('==========================================');
  console.log('   Cloudinary → R2 마이그레이션 시작');
  console.log('==========================================');
  console.log(`R2 Bucket: ${R2_BUCKET}`);
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}\n`);

  try {
    // 1. Template 마이그레이션
    await migrateTemplates();

    // 2. ProjectVersion 마이그레이션
    await migrateProjectVersions();

    // 3. Project productImages 마이그레이션
    await migrateProjects();

    // 결과 출력
    console.log('\n==========================================');
    console.log('           마이그레이션 완료');
    console.log('==========================================');
    console.log(`총 대상: ${stats.total}`);
    console.log(`성공: ${stats.success}`);
    console.log(`실패: ${stats.failed}`);
    console.log(`스킵: ${stats.skipped}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
