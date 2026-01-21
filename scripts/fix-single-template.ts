import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function fix() {
  const items = [
    { productCode: 'A000000104146', folder: 'oliveyoung_로션_A000000104146' },
    { productCode: 'A000000228067', folder: 'oliveyoung_마스카라_A000000228067' },
    { productCode: 'A000000242004', folder: 'oliveyoung_스킨케어_A000000242004' },
  ];

  for (const item of items) {
    const localPath = `C:/Users/user/Desktop/AI심화캠프_패스트캠퍼스/code/crawling_oliv/oliveyoung_data/product_images/${item.folder}/main.jpeg`;

    console.log(`\n[${item.productCode}]`);
    console.log('Reading file:', localPath);

    if (!fs.existsSync(localPath)) {
      console.log('File not found, skipping');
      continue;
    }

    // 1. 파일 업로드
    const fileBuffer = fs.readFileSync(localPath);
    const r2Key = `templates/${item.productCode}/main.jpeg`;

    console.log('Uploading to R2:', r2Key);

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${r2Key}`;
    console.log('Uploaded:', url);

    // 2. JSON 메타데이터에서 이름 찾기
    const metadataPath = `C:/Users/user/Desktop/AI심화캠프_패스트캠퍼스/code/crawling_oliv/oliveyoung_data/ocr_results_gemini/${item.folder}.json`;
    let templateName = '';
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      templateName = metadata.name;
    }

    // 3. DB 업데이트
    const template = await prisma.template.findFirst({
      where: templateName ? { name: templateName } : { name: { contains: item.productCode } },
    });

    if (template) {
      console.log('Found template:', template.id, template.name.substring(0, 50));
      await prisma.template.update({
        where: { id: template.id },
        data: { thumbnailUrl: url },
      });
      console.log('DB updated!');
    } else {
      console.log('Template not found');
    }
  }

  await prisma.$disconnect();
}

fix().catch(console.error);
