import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function check() {
  const template = await prisma.template.findFirst({
    where: { name: { contains: '라운드랩 포 맨 소나무 진정 토너' } },
    select: { id: true, name: true, thumbnailUrl: true, previewImages: true }
  });

  console.log('Template:', template?.name);
  console.log('Thumbnail:', template?.thumbnailUrl);
  console.log('Preview count:', template?.previewImages?.length || 0);
  console.log('First 3 previews:', template?.previewImages?.slice(0, 3));

  await prisma.$disconnect();
}

check().catch(console.error);
