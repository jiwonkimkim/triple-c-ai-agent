import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function check() {
  const templates = await prisma.template.findMany({
    where: { thumbnailUrl: { contains: 'cloudinary' } },
    select: { id: true, name: true, thumbnailUrl: true },
    take: 5,
  });

  console.log(`Found ${templates.length} templates with Cloudinary URLs\n`);

  for (const t of templates) {
    console.log('---');
    console.log('Name:', t.name);
    console.log('URL:', t.thumbnailUrl?.substring(0, 120));

    // URL에서 제품번호 추출 시도
    const match = t.thumbnailUrl?.match(/A\d{12}/);
    if (match) {
      console.log('Product Number from URL:', match[0]);
    }

    // 이름에서 제품번호 추출 시도
    const nameMatch = t.name.match(/A\d{12}/);
    if (nameMatch) {
      console.log('Product Number from Name:', nameMatch[0]);
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
