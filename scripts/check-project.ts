import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

// 썸네일 추출 로직 테스트 (프론트엔드와 동일)
function getFirstImageFromVersions(versions: any[]): string | undefined {
  for (const version of versions || []) {
    // 1. contentJson에서 이미지 찾기 (에디터 저장 데이터)
    const contentJson = version.contentJson as any;
    if (Array.isArray(contentJson) && contentJson.length > 0) {
      for (const section of contentJson) {
        if (section.blocks && Array.isArray(section.blocks)) {
          for (const block of section.blocks) {
            if ((block.type === 'image' || block.type === 'image-overlay') && block.src) {
              return block.src;
            }
          }
        }
      }
    }

    // 2. sections에서 이미지 찾기 (AI 생성 데이터)
    const sections = version.sections;
    if (sections && Array.isArray(sections) && sections.length > 0) {
      for (const section of sections) {
        if (section.blocks && Array.isArray(section.blocks)) {
          for (const block of section.blocks) {
            if (block.type === 'image' && block.src) {
              return block.src;
            }
          }
        }
        if (section.imageUrls && Array.isArray(section.imageUrls) && section.imageUrls.length > 0) {
          return section.imageUrls[0];
        }
        if (section.imageUrl) {
          return section.imageUrl;
        }
      }
    }
  }
  return undefined;
}

async function main() {
  // 최근 프로젝트 10개 확인
  const projects = await prisma.project.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    include: {
      detailPageVersions: {
        select: {
          id: true,
          sections: true,
          contentJson: true,
        },
        orderBy: { versionNumber: 'desc' },
        take: 3,
      },
    },
  });

  console.log(`\n=== 최근 프로젝트 ${projects.length}개 썸네일 테스트 ===\n`);

  for (const project of projects) {
    const thumbnail = getFirstImageFromVersions(project.detailPageVersions);
    const fallback = project.productImages?.[0];
    const finalThumb = thumbnail || fallback;

    console.log(`[${project.title}]`);
    console.log(`  버전 수: ${project.detailPageVersions.length}`);
    console.log(`  썸네일: ${finalThumb ? finalThumb.slice(0, 60) + '...' : '없음'}`);
    console.log(`  소스: ${thumbnail ? 'versions' : fallback ? 'productImages' : 'none'}`);
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
