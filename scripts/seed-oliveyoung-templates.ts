/**
 * Oliveyoung 템플릿 시드 스크립트
 * 실행: npx tsx scripts/seed-oliveyoung-templates.ts
 */

import { PrismaClient, TemplateCategory, TemplateCreator } from '@prisma/client';
import templatesData from './oliveyoung-templates.json';

const prisma = new PrismaClient();

interface OliveyoungTemplate {
  name: string;
  category: string;
  thumbnailUrl: string;
  brand: string;
  originalCategory: string;
  price: number;
  productUrl: string;
  productCode: string;
  description: string;
}

// Oliveyoung 카테고리 -> TemplateCategory 매핑
function mapCategory(originalCategory: string): TemplateCategory {
  // 모든 Oliveyoung 제품은 뷰티 카테고리
  return TemplateCategory.BEAUTY;
}

// 태그 생성
function generateTags(template: OliveyoungTemplate): string[] {
  const tags = [
    template.brand,
    template.originalCategory,
    '올리브영',
    'K-뷰티',
    '참조템플릿'
  ];
  return tags.filter(Boolean);
}

async function seedTemplates() {
  console.log('🌱 Oliveyoung 템플릿 시드 시작...\n');

  const templates = templatesData as OliveyoungTemplate[];
  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      // 기존 템플릿 확인 (중복 방지)
      const existing = await prisma.template.findFirst({
        where: {
          name: template.name,
          category: TemplateCategory.BEAUTY,
        }
      });

      if (existing) {
        console.log(`⏭️ 이미 존재: ${template.name.substring(0, 40)}...`);
        continue;
      }

      // 섹션 데이터 생성 (기본 구조)
      const sections = [
        {
          id: 'hero',
          type: 'HERO',
          title: template.brand,
          subtitle: template.name,
          imageUrl: template.thumbnailUrl,
        },
        {
          id: 'features',
          type: 'FEATURES',
          title: '제품 특징',
          description: template.description || '',
        }
      ];

      const created = await prisma.template.create({
        data: {
          name: template.name,
          category: mapCategory(template.originalCategory),
          thumbnailUrl: template.thumbnailUrl,
          sections: sections,
          isReference: true,
          createdBy: TemplateCreator.SYSTEM,
          userId: null,
          isPublished: true,
          publishedAt: new Date(),
          price: 0, // 무료 참조 템플릿
          description: `[${template.originalCategory}] ${template.brand} 제품 참조 템플릿`,
          previewImages: [template.thumbnailUrl],
          tags: generateTags(template),
          downloadCount: 0,
          rating: null,
          ratingCount: 0,
        },
      });

      console.log(`✓ 등록 완료: [${template.originalCategory}] ${template.brand}`);
      successCount++;
    } catch (error) {
      console.error(`✗ 등록 실패: ${template.name}`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
}

async function main() {
  try {
    await seedTemplates();
  } catch (error) {
    console.error('시드 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
