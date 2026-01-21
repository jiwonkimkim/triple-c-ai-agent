import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// .env.local 파일 로드 (override: true로 .env 덮어쓰기)
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function checkProject() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 'cmkalf2py000110w15tugnn5z' },
      select: {
        id: true,
        productName: true,
        category: true,
        subCategory: true,
        keyFeatures: true,
        brandProfileId: true,
        brandProfile: true,
        imageModel: true,  // ★ 이미지 모델 확인
      },
    });

    console.log('=== Project Info ===');
    console.log('Project ID:', project?.id);
    console.log('Product Name:', project?.productName);
    console.log('Category:', project?.category);
    console.log('SubCategory:', project?.subCategory);  // ★ 서브카테고리 확인
    console.log('Key Features:', project?.keyFeatures);
    console.log('Image Model:', project?.imageModel);  // ★ 이미지 모델
    console.log('Brand Profile ID:', project?.brandProfileId);

    console.log('');
    console.log('=== Brand Profile ===');
    if (project?.brandProfile) {
      console.log('Brand Name:', project.brandProfile.name);
      console.log('Identity:', (project.brandProfile.identity || '').substring(0, 300));
      console.log('Tone and Manner:', (project.brandProfile.toneAndManner || '').substring(0, 300));
      console.log('Image Keywords:', project.brandProfile.imageKeywords);
      console.log('Style Guide:', JSON.stringify(project.brandProfile.styleGuide, null, 2));

      // ★★★ RAG Context (Brand Document Chunks) 확인
      console.log('');
      console.log('=== RAG Context (Brand Document Chunks) ===');
      const chunks = await prisma.brandDocumentChunk.findMany({
        where: { brandProfileId: project.brandProfile.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      if (chunks.length > 0) {
        console.log(`Found ${chunks.length} chunks:`);
        chunks.forEach((chunk, idx) => {
          console.log(`\n--- Chunk ${idx + 1} ---`);
          console.log(chunk.content.substring(0, 500) + (chunk.content.length > 500 ? '...' : ''));
        });
      } else {
        console.log('No RAG chunks found for this brand!');
      }
    } else {
      console.log('No brand profile connected!');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkProject();
