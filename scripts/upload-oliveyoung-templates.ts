/**
 * Oliveyoung 템플릿 업로드 스크립트
 * 이미지를 Cloudinary에 업로드하고, 템플릿 정보를 DB에 저장
 *
 * 실행: npx tsx scripts/upload-oliveyoung-templates.ts [이미지폴더] [JSON폴더]
 * 예시: npx tsx scripts/upload-oliveyoung-templates.ts "C:/path/to/product_images" "C:/path/to/ocr_results_gemini"
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { PrismaClient, TemplateCategory, TemplateCreator } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

// 명령줄 인자에서 경로 받기
const IMAGES_DIR = process.argv[2] || path.join(process.cwd(), 'public', 'templates', 'oliveyoung');
const JSON_DIR = process.argv[3] || IMAGES_DIR;

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

// 카테고리 매핑
function mapCategory(category: string): TemplateCategory {
  const lower = category.toLowerCase();
  if (lower.includes('패션') || lower.includes('의류')) return TemplateCategory.FASHION;
  if (lower.includes('푸드') || lower.includes('음식')) return TemplateCategory.FOOD;
  return TemplateCategory.BEAUTY; // 기본값
}

// 중복 제거를 위한 핵심 제품명 추출 (더 강력한 버전)
function extractCoreProductName(name: string): string {
  let result = name
    // 브랜드명 앞의 대괄호 제거 [브랜드]
    .replace(/^\[[^\]]+\]\s*/, '')
    // 괄호 안 내용 모두 제거 (옵션, 용량 등)
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    // 용량 제거 (10ml, 50g, 100ml, 1.5L 등)
    .replace(/\d+(\.\d+)?\s*(ml|g|mg|l|oz|매|개|입|ea)/gi, '')
    // 옵션 관련 단어 제거
    .replace(/(단품|리필|기획|세트|더블|트리플|본품|증정|한정|어워즈|NEW|new)/gi, '')
    // 1+1, 2+1 등 제거
    .replace(/\d\+\d/g, '')
    // 슬래시와 그 뒤 내용 제거
    .replace(/\/.*$/g, '')
    // 특수문자 제거 (한글, 영문, 숫자만 남김)
    .replace(/[^\w\s가-힣]/g, ' ')
    // 연속 공백 정리
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

// 두 문자열의 유사도 계산 (0~1)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // 짧은 문자열이 긴 문자열에 포함되면 높은 유사도
  if (longer.toLowerCase().includes(shorter.toLowerCase())) {
    return shorter.length / longer.length + 0.3; // 포함되면 보너스
  }

  // 단어 기반 비교
  const words1 = s1.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const words2 = s2.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  const commonWords = words1.filter(w => words2.includes(w));
  const totalWords = new Set([...words1, ...words2]).size;

  return totalWords > 0 ? commonWords.length / totalWords : 0;
}

// 브랜드별 중복 추적
const uploadedProducts = new Map<string, string[]>(); // 브랜드 -> 핵심 제품명 배열

// 제품 코드 중복 추적 (가장 확실한 방법)
const processedProductCodes = new Set<string>();

function isDuplicateProduct(brand: string, name: string): { isDup: boolean; matchedWith?: string } {
  const coreName = extractCoreProductName(name);

  if (!uploadedProducts.has(brand)) {
    uploadedProducts.set(brand, []);
  }

  const brandProducts = uploadedProducts.get(brand)!;

  // 정확히 일치하는지 확인
  const exactMatch = brandProducts.find(p => p.toLowerCase() === coreName.toLowerCase());
  if (exactMatch) {
    return { isDup: true, matchedWith: exactMatch };
  }

  // 유사도 기반 중복 체크 (70% 이상 유사하면 중복)
  for (const existingProduct of brandProducts) {
    const sim = similarity(coreName, existingProduct);
    if (sim >= 0.7) {
      return { isDup: true, matchedWith: existingProduct };
    }
  }

  brandProducts.push(coreName);
  return { isDup: false };
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
async function processTemplate(imageDir: string, jsonPath: string): Promise<boolean> {
  const dirName = path.basename(imageDir);
  console.log(`\n📦 템플릿 처리 중: ${dirName}`);

  // JSON 파일 확인
  if (!fs.existsSync(jsonPath)) {
    console.log(`  ⚠️ JSON 파일 없음: ${jsonPath}`);
    return false;
  }

  // JSON 파일 읽기
  const templateData: OliveyoungTemplateData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`  📄 제품: ${templateData.name}`);
  console.log(`  🏷️ 브랜드: ${templateData.brand}`);
  console.log(`  🔑 코드: ${templateData.product_code}`);

  // 1. 제품 코드로 중복 체크 (가장 확실)
  if (processedProductCodes.has(templateData.product_code)) {
    console.log(`  ⏭️ 이미 처리된 제품 코드, 건너뜀`);
    return false;
  }

  // 2. DB에서 제품 코드 체크
  const existingByCode = await prisma.template.findFirst({
    where: { tags: { has: templateData.product_code } }
  });

  if (existingByCode) {
    console.log(`  ⏭️ DB에 이미 존재함 (코드: ${templateData.product_code})`);
    processedProductCodes.add(templateData.product_code);
    return false;
  }

  // 3. 제품명 유사도 체크 (같은 브랜드 내)
  const dupCheck = isDuplicateProduct(templateData.brand, templateData.name);
  if (dupCheck.isDup) {
    console.log(`  ⏭️ 유사 제품, 건너뜀`);
    console.log(`     핵심명: "${extractCoreProductName(templateData.name)}"`);
    console.log(`     유사: "${dupCheck.matchedWith}"`);
    processedProductCodes.add(templateData.product_code);
    return false;
  }

  // 처리된 제품 코드로 등록
  processedProductCodes.add(templateData.product_code);

  // 이미지 업로드
  console.log(`  📤 이미지 업로드 중...`);
  const uploadedImages: string[] = [];
  let thumbnailUrl = '';

  // main.jpg 먼저 처리
  const mainImagePath = path.join(imageDir, 'main.jpg');
  if (fs.existsSync(mainImagePath)) {
    thumbnailUrl = await uploadToCloudinary(mainImagePath, dirName);
    uploadedImages.push(thumbnailUrl);
    console.log(`    ✓ main.jpg 업로드 완료`);
  }

  // 상세 이미지 업로드
  if (templateData.images && templateData.images.length > 0) {
    for (const imageInfo of templateData.images) {
      if (imageInfo.image === 'main.jpg' || imageInfo.image === 'detail_page.png') continue;

      const imagePath = path.join(imageDir, imageInfo.image);
      if (fs.existsSync(imagePath)) {
        const url = await uploadToCloudinary(imagePath, dirName);
        uploadedImages.push(url);
        console.log(`    ✓ ${imageInfo.image} 업로드 완료`);
      }
    }
  } else {
    // images 배열이 없으면 폴더 내 모든 jpg 파일 업로드
    const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    for (const file of files) {
      if (file === 'main.jpg') continue;
      const imagePath = path.join(imageDir, file);
      const url = await uploadToCloudinary(imagePath, dirName);
      uploadedImages.push(url);
      console.log(`    ✓ ${file} 업로드 완료`);
    }
  }

  // 썸네일이 없으면 첫 번째 이미지 사용
  if (!thumbnailUrl && uploadedImages.length > 0) {
    thumbnailUrl = uploadedImages[0];
  }

  if (!thumbnailUrl) {
    console.log(`  ⚠️ 이미지가 없음, 건너뜀`);
    return false;
  }

  // 섹션 데이터 생성 - 모든 이미지 정보 저장
  const sections = [
    {
      id: 'hero',
      type: 'HERO',
      title: templateData.brand,
      subtitle: templateData.name,
      imageUrl: thumbnailUrl,
      productCode: templateData.product_code, // 제품 코드 저장
      originalPrice: templateData.price, // 원본 가격 저장
    },
    {
      id: 'features',
      type: 'FEATURES',
      title: '제품 특징',
      // 모든 이미지 정보 저장 (5개 제한 없음)
      items: (templateData.images || []).map((img, idx) => ({
        id: `feature-${idx}`,
        imageName: img.image, // 원본 이미지 파일명
        title: img.ocr_text?.split('\n')[0] || '',
        ocrText: img.ocr_text || '', // OCR 텍스트 전체 저장
        description: img.description || '',
        prompt: img.prompt || '', // AI 프롬프트 저장
        imageUrl: uploadedImages[idx + 1] || '',
      })),
    },
    {
      id: 'raw_data',
      type: 'RAW_DATA',
      title: '원본 데이터',
      productCode: templateData.product_code,
      originalPrice: templateData.price,
      folderName: templateData.folder_name,
      originalCategory: templateData.category,
      // 전체 이미지 메타데이터 백업
      allImages: (templateData.images || []).map(img => ({
        image: img.image,
        ocr_text: img.ocr_text,
        description: img.description,
        prompt: img.prompt,
      })),
    }
  ];

  // 태그 생성
  const tags = [
    templateData.brand,
    '올리브영',
    'K-뷰티',
    '참조템플릿',
    templateData.product_code, // 제품 코드도 태그에 추가
  ];

  // 카테고리 추출
  if (templateData.category) {
    const categoryParts = templateData.category.split('>').map(s => s.trim());
    tags.push(...categoryParts.filter(Boolean));
  }

  // 원본 가격 파싱 (예: "32,000원" -> 32000)
  const originalPrice = parseInt(templateData.price?.replace(/[^0-9]/g, '') || '0');

  // DB에 저장
  await prisma.template.create({
    data: {
      name: `[${templateData.brand}] ${templateData.name}`,
      category: mapCategory(templateData.category || ''),
      thumbnailUrl: thumbnailUrl,
      sections: sections,
      isReference: true,
      createdBy: TemplateCreator.SYSTEM,
      userId: null,
      isPublished: true,
      publishedAt: new Date(),
      price: 0, // 마켓플레이스 가격은 0 (무료)
      description: `${templateData.category || '뷰티'} | ${templateData.brand} | 원가: ${templateData.price || '미정'} | 코드: ${templateData.product_code}`,
      previewImages: uploadedImages,
      tags: [...new Set(tags)], // 중복 제거
      downloadCount: 0,
      rating: null,
      ratingCount: 0,
    },
  });

  console.log(`  ✓ DB에 저장 완료 (이미지 ${uploadedImages.length}개)`);
  return true;
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
  console.log(`📁 이미지 폴더: ${IMAGES_DIR}`);
  console.log(`📁 JSON 폴더: ${JSON_DIR}`);

  // 폴더 존재 확인
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ 이미지 폴더를 찾을 수 없습니다: ${IMAGES_DIR}`);
    process.exit(1);
  }

  // 하위 디렉토리 찾기 (oliveyoung_ 로 시작하는 폴더)
  const allDirs = fs.readdirSync(IMAGES_DIR)
    .filter(name => name.startsWith('oliveyoung_') && !name.endsWith('.zip'))
    .map(name => ({
      imageDir: path.join(IMAGES_DIR, name),
      jsonPath: path.join(JSON_DIR, `${name}.json`),
      name,
      // 폴더명에서 제품 코드 추출 (A000000XXXXXX)
      productCode: name.match(/A\d{12}/)?.[0] || '',
    }))
    .filter(item => fs.statSync(item.imageDir).isDirectory() && item.productCode);

  // 제품 코드 기준 중복 제거 (첫 번째만 유지)
  const seenCodes = new Set<string>();
  const subDirs = allDirs.filter(item => {
    if (seenCodes.has(item.productCode)) {
      console.log(`⏭️ 폴더 중복 제거: ${item.name} (코드: ${item.productCode})`);
      return false;
    }
    seenCodes.add(item.productCode);
    return true;
  });

  console.log(`\n📁 전체 폴더: ${allDirs.length}개`);
  console.log(`📁 중복 제거 후: ${subDirs.length}개`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const { imageDir, jsonPath, name } of subDirs) {
    try {
      const success = await processTemplate(imageDir, jsonPath);
      if (success) {
        successCount++;
      } else {
        skipCount++;
      }
    } catch (error) {
      console.error(`  ✗ 처리 실패:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 결과: 성공 ${successCount}개, 건너뜀 ${skipCount}개, 실패 ${errorCount}개`);
}

main()
  .catch((error) => {
    console.error('스크립트 실패:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
