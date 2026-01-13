import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`;

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not set');
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text.slice(0, 8000),
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    throw new Error(`HF API error: ${await response.text()}`);
  }

  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : result;
}

function buildSearchText(template: {
  name: string;
  description?: string | null;
  tags: string[];
  category?: string;
  sections?: any;
}): string {
  const parts: string[] = [template.name, template.name];
  if (template.category) parts.push(template.category.toLowerCase());
  if (template.description) parts.push(template.description);

  // All section descriptions
  if (template.sections && Array.isArray(template.sections)) {
    for (const section of template.sections) {
      if (section.description) {
        parts.push(section.description);
      }
    }
  }

  if (template.tags?.length) parts.push(template.tags.join(' '));
  return parts.join(' ').trim();
}

async function main() {
  console.log('Starting template embedding...');

  // Get published templates
  const templates = await prisma.template.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      category: true,
      sections: true,
    },
  });

  console.log(`Found ${templates.length} published templates`);

  let success = 0;
  let failed = 0;

  for (const template of templates) {
    try {
      const searchText = buildSearchText(template);
      console.log(`Embedding: ${template.name}...`);

      const embedding = await generateEmbedding(searchText);

      await prisma.$executeRaw`
        UPDATE templates
        SET
          embedding = ${embedding}::vector,
          embedding_text = ${searchText},
          embedded_at = NOW()
        WHERE id = ${template.id}
      `;

      success++;
      console.log(`  ✓ Done (${success}/${templates.length})`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Failed: ${error}`);
    }
  }

  console.log(`\nComplete: ${success} success, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch(console.error);
