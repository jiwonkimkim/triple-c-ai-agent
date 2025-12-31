/**
 * 랑콤 A000000229216 템플릿 업데이트 스크립트
 * 실행: npx tsx scripts/update-lancome-template.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma = new PrismaClient();

// OCR 데이터 로드
const ocrPath = path.join(os.homedir(), 'Desktop/reference-pages/ocr_results_gemini/oliveyoung_랑콤_A000000229216.json');
const ocrData = JSON.parse(fs.readFileSync(ocrPath, 'utf-8'));

async function updateLancomeTemplate() {
  const templateId = 'cmjsag6rs000bycjbel05lbny';
  const productCode = 'A000000229216';
  const basePath = `/templates/oliveyoung/${productCode}`;

  // OCR 데이터에서 이미지 목록 추출 (순서대로)
  const images = ocrData.images;

  // main.jpg 찾기
  const mainImage = images.find(img => img.image === 'main.jpg');

  // detail 이미지들 (순서대로)
  const detailImages = images
    .filter(img => img.image.startsWith('detail_') && img.image.endsWith('.jpg'))
    .sort((a, b) => a.image.localeCompare(b.image));

  // thumbnailUrl
  const thumbnailUrl = `${basePath}/main.jpg`;

  // previewImages (detail 이미지들)
  const previewImages = detailImages.map(img => `${basePath}/${img.image}`);

  // sections 데이터 (각 이미지별 정보 포함)
  const sections = detailImages.map((img, index) => ({
    id: `section_${index + 1}`,
    type: index === 0 ? 'HERO' : 'FEATURES',
    imageUrl: `${basePath}/${img.image}`,
    ocrText: img.ocr_text,
    description: img.description,
    prompt: img.prompt,
  }));

  console.log('📦 업데이트할 데이터:');
  console.log('- thumbnailUrl:', thumbnailUrl);
  console.log('- previewImages:', previewImages.length, '개');
  console.log('- sections:', sections.length, '개');

  try {
    const updated = await prisma.template.update({
      where: { id: templateId },
      data: {
        thumbnailUrl,
        previewImages,
        sections,
        description: `[${ocrData.category}] ${ocrData.brand} ${ocrData.name} - OCR 분석 완료된 참조 템플릿`,
      },
    });

    console.log('\n✅ 업데이트 완료:', updated.name);
    console.log('- ID:', updated.id);
    console.log('- thumbnailUrl:', updated.thumbnailUrl);
    console.log('- previewImages:', (updated.previewImages as string[])?.length, '개');
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLancomeTemplate();
