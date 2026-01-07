import prisma from '@/lib/prisma';
import { chunkText } from './text-chunker';
import { crawlSite, crawlUrl, BrandAssets } from './web-crawler';

// Merged brand assets from multiple pages
export interface MergedBrandAssets {
  colors: {
    primary?: string;
    secondary?: string;
    palette: string[];
  };
  images: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  fonts: {
    primary?: string;
    all: string[];
  };
  extractedAt: string;
  sourceUrl?: string;
}

export interface BrandContext {
  brandProfileId: string;
  brandName: string;
  identity: string;
  toneAndManner: string;
  voiceTone: string | null;
  imageKeywords: string[];
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
): Promise<{ chunksIndexed: number; pagesProcessed: number; extractedAssets?: MergedBrandAssets }> {
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
  const allBrandAssets: BrandAssets[] = [];
  let pagesProcessed = 0;
  let primarySourceUrl: string | undefined;

  // Process website URLs
  for (const url of websiteUrls) {
    if (!primarySourceUrl) primarySourceUrl = url;
    try {
      const results = await crawlSite(url, { maxPages: maxPagesPerUrl });
      pagesProcessed += results.length;

      for (const result of results) {
        // Collect brand assets from each page
        allBrandAssets.push(result.brandAssets);

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

  // Merge brand assets from all pages
  const mergedAssets = mergeBrandAssets(allBrandAssets, primarySourceUrl);

  // Save styleGuide if we extracted assets
  if (mergedAssets && (mergedAssets.colors.primary || mergedAssets.images.logo || mergedAssets.fonts.primary)) {
    await prisma.brandProfile.update({
      where: { id: brandProfileId },
      data: {
        styleGuide: JSON.parse(JSON.stringify(mergedAssets)),
        updatedAt: new Date(),
      },
    });
  }

  if (allChunks.length === 0) {
    return { chunksIndexed: 0, pagesProcessed, extractedAssets: mergedAssets };
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

  return { chunksIndexed: allChunks.length, pagesProcessed, extractedAssets: mergedAssets };
}

/**
 * Merge brand assets from multiple crawled pages
 */
function mergeBrandAssets(assets: BrandAssets[], sourceUrl?: string): MergedBrandAssets {
  // Count color frequencies across all pages
  const colorCounts = new Map<string, number>();
  for (const asset of assets) {
    for (const color of asset.colors.all) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }
  }

  // Sort colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  // Collect fonts with frequency
  const fontCounts = new Map<string, number>();
  for (const asset of assets) {
    for (const font of asset.fonts.all) {
      fontCounts.set(font, (fontCounts.get(font) || 0) + 1);
    }
  }
  const sortedFonts = Array.from(fontCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([font]) => font);

  // Find first available logo, favicon, ogImage (prefer earlier pages - usually homepage)
  let logo: string | undefined;
  let favicon: string | undefined;
  let ogImage: string | undefined;

  for (const asset of assets) {
    if (!logo && asset.images.logo) logo = asset.images.logo;
    if (!favicon && asset.images.favicon) favicon = asset.images.favicon;
    if (!ogImage && asset.images.ogImage) ogImage = asset.images.ogImage;
    if (logo && favicon && ogImage) break;
  }

  // Use theme-color if available, otherwise use most frequent color
  const themeColor = assets.find(a => a.colors.themeColor)?.colors.themeColor;

  return {
    colors: {
      primary: themeColor || sortedColors[0],
      secondary: sortedColors[themeColor ? 0 : 1],
      palette: sortedColors.slice(0, 10),
    },
    images: {
      logo,
      favicon,
      ogImage,
    },
    fonts: {
      primary: sortedFonts[0],
      all: sortedFonts.slice(0, 5),
    },
    extractedAt: new Date().toISOString(),
    sourceUrl,
  };
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
    identity: brandProfile.identity,
    toneAndManner: brandProfile.toneAndManner,
    voiceTone: brandProfile.voiceTone,
    imageKeywords: brandProfile.imageKeywords,
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
