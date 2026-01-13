require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmkalf2py000110w15tugnn5z';

  // Get all versions for this project
  const versions = await prisma.projectVersion.findMany({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      action: true,
      description: true,
      createdAt: true,
    },
    take: 10,
  });

  console.log('=== Project Versions (최신 10개) ===');
  versions.forEach(v => {
    console.log('v' + v.versionNumber + ' [' + v.id + '] - ' + v.action + ' - ' + v.description);
  });

  // Get detail page versions
  const detailVersions = await prisma.detailPageVersion.findMany({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      status: true,
      createdAt: true,
    },
    take: 10,
  });

  console.log('');
  console.log('=== Detail Page Versions (최신 10개) ===');
  detailVersions.forEach(v => {
    console.log('v' + v.versionNumber + ' [' + v.id + '] - ' + v.status);
  });

  // Get version 29 specifically
  const v29 = await prisma.projectVersion.findFirst({
    where: { projectId, versionNumber: 29 },
  });

  console.log('');
  console.log('=== Version 29 Details ===');
  if (v29) {
    console.log('ID:', v29.id);
    console.log('Content keys:', v29.content ? Object.keys(v29.content) : 'null');
    const content = v29.content;
    if (content && content.sections) {
      console.log('Sections count:', content.sections.length);
      if (content.sections[0]) {
        console.log('First section keys:', Object.keys(content.sections[0]));
        console.log('First section name:', content.sections[0].name);
      }
    }
  } else {
    console.log('Version 29 not found!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
