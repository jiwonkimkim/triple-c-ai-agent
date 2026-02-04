import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, productImages: true, createdAt: true }
  });

  console.log('=== 최신 프로젝트 ===');
  console.log('ID:', project?.id);
  console.log('Title:', project?.title);
  console.log('ProductImages:', JSON.stringify(project?.productImages));
  console.log('CreatedAt:', project?.createdAt);

  if (project) {
    const version = await prisma.detailPageVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
    });

    console.log('\n=== DetailPageVersion ===');
    if (version) {
      console.log('Version:', version.versionNumber);
      const sections = version.sections as any[];
      console.log('Sections count:', sections?.length || 0);

      if (sections && sections.length > 0) {
        sections.forEach((s: any, i: number) => {
          const imgUrl = s.imageUrl || (s.imageUrls && s.imageUrls[0]);
          const prompts = s.imagePrompts || (s.imagePrompt ? [s.imagePrompt] : []);
          console.log(`  [${i}] ${s.type}:`);
          console.log(`       imageUrl: ${imgUrl ? imgUrl.substring(0, 60) + '...' : 'NO IMAGE'}`);
          console.log(`       prompts: ${prompts.length} 개`);
          if (prompts.length > 0) {
            console.log(`       prompt[0]: ${JSON.stringify(prompts[0]).substring(0, 80)}...`);
          }
        });
      }
    } else {
      console.log('No DetailPageVersion found');
    }
  }
}

main().catch(e => console.error('Error:', e.message)).finally(() => prisma.$disconnect());
