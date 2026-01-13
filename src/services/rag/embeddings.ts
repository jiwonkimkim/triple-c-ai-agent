// Hugging Face Inference API for embeddings
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';
const EMBEDDING_DIMENSION = 384;
const MAX_BATCH_SIZE = 100;
const MAX_INPUT_CHARS = 8000;
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`;

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  tokenCount: number;
}

function getHuggingFaceApiKey(): string | null {
  return process.env.HUGGINGFACE_API_KEY || null;
}

/**
 * Generate embedding for a single text using Hugging Face
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getHuggingFaceApiKey();

  if (!apiKey) {
    throw new Error('Hugging Face API key not available. HUGGINGFACE_API_KEY is not set.');
  }

  const truncatedText = truncateText(text, MAX_INPUT_CHARS);

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: truncatedText,
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  const result = await response.json();

  // HF returns nested array for single input
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const apiKey = getHuggingFaceApiKey();

  if (!apiKey) {
    throw new Error('Hugging Face API key not available. HUGGINGFACE_API_KEY is not set.');
  }

  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const truncatedBatch = batch.map(text => truncateText(text, MAX_INPUT_CHARS));

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: truncatedBatch,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const embeddings = await response.json();

    for (let j = 0; j < batch.length; j++) {
      results.push({
        text: batch[j],
        embedding: embeddings[j],
        tokenCount: estimateTokens(batch[j]),
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
