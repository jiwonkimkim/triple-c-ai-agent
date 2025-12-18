import prisma from '@/lib/prisma';
import { chunkText } from './text-chunker';
import { crawlSite, crawlUrl } from './web-crawler';

export interface BrandContext {
  brandProfileId: string;
  brandName: string;
  relevantChunks: {
    text: string;
    source?: string;
  }[];
}

export interface IndexBrandOptions {
  websiteUrls?: string[];
  manualContent?: string;
  maxPagesPerUrl?: number;
  clearExisting?: boolean;
}

/**
 * Index brand content into database (simple text storage)
 */
export async function indexBrandContent(
  brandProfileId: string,
  options: IndexBrandOptions = {}
): Promise<{ chunksIndexed: number; pagesProcessed: number }> {
  const {
    websiteUrls = [],
    manualContent,
    maxPagesPerUrl = 20,
    clearExisting = false,
  } = options;

  // Clear existing chunks if requested
  if (clearExisting) {
    await prisma.brandDocumentChunk.deleteMany({
      where: { brandProfileId },
    });
  }

  const allChunks: { text: string; sourceUrl?: string; sourceType: 'WEBSITE' | 'UPLOAD' | 'INSTAGRAM' }[] = [];
  let pagesProcessed = 0;

  // Process website URLs
  for (const url of websiteUrls) {
    try {
      const results = await crawlSite(url, { maxPages: maxPagesPerUrl });
      pagesProcessed += results.length;

      for (const result of results) {
        const chunks = chunkText(result.text, {
          maxChunkSize: 1000,
          overlap: 200,
        });

        for (const chunk of chunks) {
          allChunks.push({
            text: chunk.text,
            sourceUrl: result.url,
            sourceType: 'WEBSITE',
          });
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  // Process manual content
  if (manualContent) {
    const chunks = chunkText(manualContent, {
      maxChunkSize: 1000,
      overlap: 200,
    });

    for (const chunk of chunks) {
      allChunks.push({
        text: chunk.text,
        sourceType: 'UPLOAD',
      });
    }
  }

  if (allChunks.length === 0) {
    return { chunksIndexed: 0, pagesProcessed };
  }

  // Save chunks to database
  await prisma.brandDocumentChunk.createMany({
    data: allChunks.map((chunk) => ({
      brandProfileId,
      source: chunk.sourceType,
      content: chunk.text,
      metadata: {
        sourceUrl: chunk.sourceUrl || null,
        createdAt: new Date().toISOString(),
      },
    })),
  });

  // Update brand profile timestamp
  await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { updatedAt: new Date() },
  });

  return { chunksIndexed: allChunks.length, pagesProcessed };
}

/**
 * Retrieve brand context using simple text search
 */
export async function getBrandContext(
  brandProfileId: string,
  query: string,
  topK = 5
): Promise<BrandContext | null> {
  const brandProfile = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
  });

  if (!brandProfile) {
    return null;
  }

  // Simple keyword search (can be improved with full-text search later)
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  let chunks;
  if (keywords.length > 0) {
    // Search for chunks containing any of the keywords
    chunks = await prisma.brandDocumentChunk.findMany({
      where: {
        brandProfileId,
        OR: keywords.map(keyword => ({
          content: { contains: keyword, mode: 'insensitive' as const },
        })),
      },
      take: topK,
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // If no keywords, just get recent chunks
    chunks = await prisma.brandDocumentChunk.findMany({
      where: { brandProfileId },
      take: topK,
      orderBy: { createdAt: 'desc' },
    });
  }

  const relevantChunks = chunks.map((chunk) => ({
    text: chunk.content,
    source: (chunk.metadata as { sourceUrl?: string })?.sourceUrl,
  }));

  return {
    brandProfileId,
    brandName: brandProfile.name,
    relevantChunks,
  };
}

/**
 * Build context prompt from brand context
 */
export function buildContextPrompt(context: BrandContext): string {
  let prompt = `\n## Brand Context: ${context.brandName}\n\n`;

  if (context.relevantChunks.length > 0) {
    prompt += `**Relevant Brand Information:**\n\n`;
    for (const chunk of context.relevantChunks) {
      prompt += `> ${chunk.text}\n`;
      if (chunk.source) {
        prompt += `> _Source: ${chunk.source}_\n`;
      }
      prompt += '\n';
    }
  }

  return prompt;
}

/**
 * Get brand knowledge base statistics
 */
export async function getBrandIndexStats(brandProfileId: string): Promise<{
  vectorCount: number;
  lastUpdated: Date | null;
}> {
  const [brandProfile, chunkCount] = await Promise.all([
    prisma.brandProfile.findUnique({
      where: { id: brandProfileId },
    }),
    prisma.brandDocumentChunk.count({
      where: { brandProfileId },
    }),
  ]);

  return {
    vectorCount: chunkCount,
    lastUpdated: brandProfile?.updatedAt || null,
  };
}

/**
 * Delete brand knowledge base
 */
export async function deleteBrandIndex(brandProfileId: string): Promise<void> {
  await prisma.brandDocumentChunk.deleteMany({
    where: { brandProfileId },
  });
}

/**
 * Index a single URL for a brand
 */
export async function indexBrandUrl(
  brandProfileId: string,
  url: string
): Promise<{ chunksIndexed: number }> {
  try {
    const result = await crawlUrl(url);
    const chunks = chunkText(result.text, {
      maxChunkSize: 1000,
      overlap: 200,
    });

    if (chunks.length === 0) {
      return { chunksIndexed: 0 };
    }

    await prisma.brandDocumentChunk.createMany({
      data: chunks.map((chunk) => ({
        brandProfileId,
        source: 'WEBSITE' as const,
        content: chunk.text,
        metadata: {
          sourceUrl: url,
          createdAt: new Date().toISOString(),
        },
      })),
    });

    return { chunksIndexed: chunks.length };
  } catch (error) {
    console.error(`Failed to index URL ${url}:`, error);
    return { chunksIndexed: 0 };
  }
}
