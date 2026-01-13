import { GoogleGenerativeAI } from '@google/generative-ai';

// Singleton Gemini client
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!geminiClient) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return null;
    }

    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }

  return geminiClient;
}

// Embedding model configuration (Gemini)
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;
const MAX_BATCH_SIZE = 100;
const MAX_INPUT_CHARS = 10000; // Gemini limit

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  tokenCount: number;
}

/**
 * Generate embedding for a single text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error('Gemini client not available. GOOGLE_AI_API_KEY is not set.');
  }

  const truncatedText = truncateText(text, MAX_INPUT_CHARS);
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.embedContent(truncatedText);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error('Gemini client not available. GOOGLE_AI_API_KEY is not set.');
  }

  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);

    // Gemini doesn't support batch embedding, process one by one
    for (const text of batch) {
      const truncatedText = truncateText(text, MAX_INPUT_CHARS);
      const result = await model.embedContent(truncatedText);

      results.push({
        text,
        embedding: result.embedding.values,
        tokenCount: estimateTokens(text),
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
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within character limit
 */
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars);
}

/**
 * Get embedding dimension for the model
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
