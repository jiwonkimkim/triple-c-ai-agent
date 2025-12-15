/**
 * Text chunking utilities for RAG pipeline
 * Splits text into overlapping chunks suitable for embedding
 */

export interface ChunkOptions {
  // Maximum characters per chunk
  maxChunkSize?: number;
  // Overlap between chunks (characters)
  overlap?: number;
  // Minimum chunk size (to avoid very small chunks)
  minChunkSize?: number;
  // Separators to use for splitting (in order of priority)
  separators?: string[];
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1000,
  overlap: 200,
  minChunkSize: 100,
  separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '],
};

export interface TextChunk {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, options?: ChunkOptions): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxChunkSize, overlap, minChunkSize, separators } = opts;

  // Clean and normalize text
  const cleanedText = cleanText(text);

  if (cleanedText.length <= maxChunkSize) {
    return [
      {
        text: cleanedText,
        index: 0,
        startChar: 0,
        endChar: cleanedText.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < cleanedText.length) {
    // Calculate chunk end position
    let chunkEnd = Math.min(currentPosition + maxChunkSize, cleanedText.length);

    // If not at the end, try to find a good break point
    if (chunkEnd < cleanedText.length) {
      const breakPoint = findBreakPoint(
        cleanedText,
        currentPosition,
        chunkEnd,
        separators
      );
      if (breakPoint > currentPosition + minChunkSize) {
        chunkEnd = breakPoint;
      }
    }

    // Extract chunk
    const chunkText = cleanedText.slice(currentPosition, chunkEnd).trim();

    if (chunkText.length >= minChunkSize) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        startChar: currentPosition,
        endChar: chunkEnd,
      });
      chunkIndex++;
    }

    // Move position with overlap
    currentPosition = chunkEnd - overlap;

    // Ensure we're making progress
    if (currentPosition <= chunks[chunks.length - 1]?.startChar) {
      currentPosition = chunkEnd;
    }
  }

  return chunks;
}

/**
 * Find the best break point in a text segment
 */
function findBreakPoint(
  text: string,
  start: number,
  maxEnd: number,
  separators: string[]
): number {
  // Search backwards from maxEnd for a separator
  for (const separator of separators) {
    // Search in the last 20% of the chunk for a break point
    const searchStart = Math.floor(start + (maxEnd - start) * 0.8);
    const segment = text.slice(searchStart, maxEnd);
    const lastIndex = segment.lastIndexOf(separator);

    if (lastIndex !== -1) {
      return searchStart + lastIndex + separator.length;
    }
  }

  // No good break point found, use maxEnd
  return maxEnd;
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  return (
    text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
  );
}

/**
 * Extract meaningful text from HTML
 */
export function extractTextFromHtml(html: string): string {
  // Remove script and style tags with content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace
  return cleanText(text);
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }

  // Decode numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  return result;
}

/**
 * Estimate token count for a text (rough approximation)
 * OpenAI uses ~4 characters per token on average
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks with a maximum token count
 */
export function chunkByTokens(
  text: string,
  maxTokens = 500,
  overlapTokens = 50
): TextChunk[] {
  const charsPerToken = 4;
  return chunkText(text, {
    maxChunkSize: maxTokens * charsPerToken,
    overlap: overlapTokens * charsPerToken,
    minChunkSize: 50 * charsPerToken,
  });
}
