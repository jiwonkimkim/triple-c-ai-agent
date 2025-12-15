import { prisma } from '@/lib/prisma';
import {
  upsertBrandVectors,
  queryBrandVectors,
  deleteBrandVectors,
  getBrandVectorCount,
  type BrandVectorMetadata,
} from '@/lib/pinecone';
import { generateEmbeddings, generateQueryEmbedding } from './embeddings';
import { chunkText, extractTextFromHtml } from './text-chunker';
import { crawlUrl, crawlSite, type CrawlResult } from './web-crawler';

export interface BrandContext {
  brandProfileId: string;
  brandName: string;
  voiceTone: string | null;
  styleGuide: Record<string, any> | null;
  relevantChunks: {
    text: string;
    score: number;
    source?: string;
  }[];
}

export interface IndexBrandOptions {
  // Website URLs to crawl
  websiteUrls?: string[];
  // Manual text content to index
  manualContent?: string;
  // Maximum pages to crawl per URL
  maxPagesPerUrl?: number;
  // Clear existing vectors before indexing
  clearExisting?: boolean;
}

/**
 * Index brand content into vector database
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

  // Clear existing vectors if requested
  if (clearExisting) {
    await deleteBrandVectors(brandProfileId);
  }

  const allChunks: { text: string; sourceUrl?: string; sourceType: 'website' | 'document' | 'manual' }[] = [];
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
            sourceType: 'website',
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
        sourceType: 'manual',
      });
    }
  }

  if (allChunks.length === 0) {
    return { chunksIndexed: 0, pagesProcessed };
  }

  // Generate embeddings
  const embeddings = await generateEmbeddings(allChunks.map((c) => c.text));

  // Create vectors with metadata
  const vectors = embeddings.map((emb, index) => ({
    id: `${brandProfileId}-${Date.now()}-${index}`,
    values: emb.embedding,
    metadata: {
      brandProfileId,
      sourceUrl: allChunks[index].sourceUrl,
      sourceType: allChunks[index].sourceType,
      chunkIndex: index,
      totalChunks: embeddings.length,
      text: allChunks[index].text,
      createdAt: new Date().toISOString(),
    } as BrandVectorMetadata,
  }));

  // Upsert vectors
  await upsertBrandVectors(brandProfileId, vectors);

  // Update brand profile with index status
  await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: {
      updatedAt: new Date(),
    },
  });

  return { chunksIndexed: vectors.length, pagesProcessed };
}

/**
 * Retrieve relevant brand context for a query
 */
export async function getBrandContext(
  brandProfileId: string,
  query: string,
  topK = 5
): Promise<BrandContext | null> {
  // Get brand profile
  const brandProfile = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
  });

  if (!brandProfile) {
    return null;
  }

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);

  // Query vectors
  const matches = await queryBrandVectors(brandProfileId, queryEmbedding, topK);

  // Extract relevant chunks
  const relevantChunks = matches.map((match) => ({
    text: (match.metadata as BrandVectorMetadata)?.text || '',
    score: match.score || 0,
    source: (match.metadata as BrandVectorMetadata)?.sourceUrl,
  }));

  return {
    brandProfileId,
    brandName: brandProfile.name,
    voiceTone: brandProfile.voiceTone,
    styleGuide: brandProfile.styleGuide as Record<string, any> | null,
    relevantChunks,
  };
}

/**
 * Build context prompt from brand context
 */
export function buildContextPrompt(context: BrandContext): string {
  let prompt = `\n## Brand Context: ${context.brandName}\n\n`;

  if (context.voiceTone) {
    prompt += `**Voice & Tone:** ${context.voiceTone}\n\n`;
  }

  if (context.styleGuide) {
    prompt += `**Style Guide:**\n`;
    for (const [key, value] of Object.entries(context.styleGuide)) {
      prompt += `- ${key}: ${JSON.stringify(value)}\n`;
    }
    prompt += '\n';
  }

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
  const brandProfile = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
  });

  const vectorCount = await getBrandVectorCount(brandProfileId);

  return {
    vectorCount,
    lastUpdated: brandProfile?.updatedAt || null,
  };
}

/**
 * Delete brand knowledge base
 */
export async function deleteBrandIndex(brandProfileId: string): Promise<void> {
  await deleteBrandVectors(brandProfileId);
}

/**
 * Index a single URL for a brand
 */
export async function indexBrandUrl(
  brandProfileId: string,
  url: string
): Promise<{ chunksIndexed: number }> {
  const result = await crawlUrl(url);
  const chunks = chunkText(result.text, {
    maxChunkSize: 1000,
    overlap: 200,
  });

  if (chunks.length === 0) {
    return { chunksIndexed: 0 };
  }

  const embeddings = await generateEmbeddings(chunks.map((c) => c.text));

  const vectors = embeddings.map((emb, index) => ({
    id: `${brandProfileId}-${Date.now()}-${index}`,
    values: emb.embedding,
    metadata: {
      brandProfileId,
      sourceUrl: url,
      sourceType: 'website' as const,
      chunkIndex: index,
      totalChunks: embeddings.length,
      text: chunks[index].text,
      createdAt: new Date().toISOString(),
    } as BrandVectorMetadata,
  }));

  await upsertBrandVectors(brandProfileId, vectors);

  return { chunksIndexed: vectors.length };
}
