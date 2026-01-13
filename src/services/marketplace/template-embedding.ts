import { prisma } from '@/lib/prisma';
import { generateEmbedding, generateEmbeddings } from '@/services/rag/embeddings';

// Embedding dimension (Gemini text-embedding-004)
export const TEMPLATE_EMBEDDING_DIMENSION = 384;

/**
 * Build search text for template embedding
 * Combines name + description + tags with name weighted higher
 */
export function buildTemplateSearchText(template: {
  name: string;
  description?: string | null;
  tags: string[];
  category?: string;
}): string {
  const parts: string[] = [];

  // Name (weighted higher - repeated twice)
  parts.push(template.name);
  parts.push(template.name);

  // Category
  if (template.category) {
    parts.push(template.category.toLowerCase());
  }

  // Description
  if (template.description) {
    parts.push(template.description);
  }

  // Tags
  if (template.tags && template.tags.length > 0) {
    parts.push(template.tags.join(' '));
  }

  return parts.join(' ').trim();
}

/**
 * Embed a single template
 */
export async function embedTemplate(templateId: string): Promise<void> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      category: true,
    },
  });

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const searchText = buildTemplateSearchText(template);
  const embedding = await generateEmbedding(searchText);

  // Update with raw SQL for vector column
  await prisma.$executeRaw`
    UPDATE templates
    SET
      embedding = ${embedding}::vector,
      embedding_text = ${searchText},
      embedded_at = NOW()
    WHERE id = ${templateId}
  `;
}

/**
 * Batch embed multiple templates (for migration)
 */
export async function embedTemplates(
  templateIds: string[],
  options: {
    batchSize?: number;
    onProgress?: (count: number, total: number) => void;
  } = {}
): Promise<{ success: number; failed: string[] }> {
  const { batchSize = 50, onProgress } = options;
  const failed: string[] = [];
  let successCount = 0;

  for (let i = 0; i < templateIds.length; i += batchSize) {
    const batchIds = templateIds.slice(i, i + batchSize);

    const templates = await prisma.template.findMany({
      where: { id: { in: batchIds } },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        category: true,
      },
    });

    const textsWithIds = templates.map((t) => ({
      id: t.id,
      text: buildTemplateSearchText(t),
    }));

    try {
      const embeddings = await generateEmbeddings(textsWithIds.map((t) => t.text));

      // Update each template with embedding
      for (let idx = 0; idx < textsWithIds.length; idx++) {
        const { id, text } = textsWithIds[idx];
        const embeddingArray = embeddings[idx].embedding;

        await prisma.$executeRaw`
          UPDATE templates
          SET
            embedding = ${embeddingArray}::vector,
            embedding_text = ${text},
            embedded_at = NOW()
          WHERE id = ${id}
        `;
      }

      successCount += templates.length;
    } catch (error) {
      console.error(`Batch embedding failed:`, error);
      failed.push(...batchIds);
    }

    onProgress?.(successCount, templateIds.length);
  }

  return { success: successCount, failed };
}

/**
 * Get templates without embeddings
 */
export async function getTemplatesWithoutEmbedding(limit = 100): Promise<string[]> {
  const templates = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM templates
    WHERE is_published = true AND embedding IS NULL
    LIMIT ${limit}
  `;

  return templates.map((t) => t.id);
}

/**
 * Re-embed all published templates
 */
export async function reembedAllTemplates(
  onProgress?: (count: number, total: number) => void
): Promise<{ success: number; failed: string[] }> {
  const templates = await prisma.template.findMany({
    where: { isPublished: true },
    select: { id: true },
  });

  const ids = templates.map((t) => t.id);
  return embedTemplates(ids, { onProgress });
}

/**
 * Check if template has embedding
 */
export async function hasEmbedding(templateId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
    SELECT embedding IS NOT NULL as has_embedding
    FROM templates
    WHERE id = ${templateId}
  `;

  return result[0]?.has_embedding ?? false;
}
