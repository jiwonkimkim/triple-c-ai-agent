// Re-embed all published templates with new model (bge-large-en-v1.5, 1024 dimensions)
// Run: npx tsx scripts/reembed-templates.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMBEDDING_MODEL = 'BAAI/bge-large-en-v1.5';
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`;

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not set');
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
    const error = await response.text();
    throw new Error(`HF API error: ${error}`);
  }

  const result = await response.json();
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }
  return result;
}

function buildTemplateSearchText(template: {
  name: string;
  description?: string | null;
  tags: string[];
  category?: string;
  sections?: any;
}): string {
  const parts: string[] = [];
  parts.push(template.name);
  parts.push(template.name);
  if (template.category) parts.push(template.category.toLowerCase());
  if (template.description) parts.push(template.description);
  if (template.sections && typeof template.sections === 'object') {
    const sections = template.sections as { images?: Array<{ description?: string }> };
    if (sections.images && Array.isArray(sections.images)) {
      for (const image of sections.images) {
        if (image.description) parts.push(image.description);
      }
    }
  }
  if (template.tags && template.tags.length > 0) {
    parts.push(template.tags.join(' '));
  }
  return parts.join(' ').trim();
}

async function main() {
  console.log('='.repeat(50));
  console.log('Re-embedding templates with bge-large-en-v1.5 (1024 dim)');
  console.log('='.repeat(50));

  // Get all published templates
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

  console.log(`\nFound ${templates.length} published templates to re-embed\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const progress = `[${i + 1}/${templates.length}]`;

    try {
      // Build search text
      const searchText = buildTemplateSearchText(template);

      // Generate new embedding
      const embedding = await generateEmbedding(searchText);

      // Verify dimension
      if (embedding.length !== 1024) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
      }

      // Update in database
      await prisma.$executeRaw`
        UPDATE templates
        SET
          embedding = ${embedding}::vector,
          embedding_text = ${searchText},
          embedded_at = NOW()
        WHERE id = ${template.id}
      `;

      success++;
      console.log(`${progress} ✅ ${template.name}`);
    } catch (error) {
      failed++;
      console.error(`${progress} ❌ ${template.name}:`, error instanceof Error ? error.message : error);
    }

    // Small delay to avoid rate limiting
    if (i < templates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${templates.length}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
