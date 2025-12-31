import OpenAI from 'openai';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;
const MAX_BATCH_SIZE = 100; // OpenAI allows up to 2048, but we use 100 for safety
const MAX_INPUT_TOKENS = 8191; // Model limit

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  tokenCount: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI client not available. OPENAI_API_KEY is not set.');
  }

  // Truncate if too long
  const truncatedText = truncateText(text, MAX_INPUT_TOKENS);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
    dimensions: EMBEDDING_DIMENSION,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI client not available. OPENAI_API_KEY is not set.');
  }

  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const truncatedBatch = batch.map((text) => truncateText(text, MAX_INPUT_TOKENS));

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedBatch,
      dimensions: EMBEDDING_DIMENSION,
    });

    for (let j = 0; j < batch.length; j++) {
      results.push({
        text: batch[j],
        embedding: response.data[j].embedding,
        tokenCount: response.usage?.total_tokens
          ? Math.floor(response.usage.total_tokens / batch.length)
          : estimateTokens(batch[j]),
      });
    }
  }

  return results;
}

/**
 * Generate query embedding (same as document embedding for this model)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return generateEmbedding(query);
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Estimate token count for a text (rough approximation)
 */
function estimateTokens(text: string): number {
  // OpenAI uses ~4 characters per token on average for English
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
function truncateText(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Rough truncation based on character count
  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars);
}

/**
 * Get embedding dimension for the model
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
