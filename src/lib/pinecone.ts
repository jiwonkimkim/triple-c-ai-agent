import { Pinecone } from '@pinecone-database/pinecone';

// Singleton Pinecone client
let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  return pineconeClient;
}

// Index name for brand knowledge base
export const BRAND_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'triple-c-brands';

// Embedding dimension (OpenAI text-embedding-3-small)
export const EMBEDDING_DIMENSION = 1536;

// Metadata fields stored with vectors
export interface BrandVectorMetadata {
  brandProfileId: string;
  sourceUrl?: string;
  sourceType: 'website' | 'document' | 'manual';
  chunkIndex: number;
  totalChunks: number;
  text: string;
  createdAt: string;
}

// Get or create the brand index
export async function getBrandIndex() {
  const client = getPineconeClient();

  // Check if index exists
  const indexes = await client.listIndexes();
  const indexExists = indexes.indexes?.some((idx) => idx.name === BRAND_INDEX_NAME);

  if (!indexExists) {
    // Create index if it doesn't exist
    await client.createIndex({
      name: BRAND_INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: process.env.PINECONE_REGION || 'us-east-1',
        },
      },
    });

    // Wait for index to be ready
    await waitForIndexReady(BRAND_INDEX_NAME);
  }

  return client.index(BRAND_INDEX_NAME);
}

// Wait for index to be ready
async function waitForIndexReady(indexName: string, maxWaitMs = 60000) {
  const client = getPineconeClient();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const description = await client.describeIndex(indexName);
    if (description.status?.ready) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Index ${indexName} did not become ready within ${maxWaitMs}ms`);
}

// Upsert vectors for a brand
export async function upsertBrandVectors(
  brandProfileId: string,
  vectors: { id: string; values: number[]; metadata: BrandVectorMetadata }[]
) {
  const index = await getBrandIndex();
  const namespace = index.namespace(brandProfileId);

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await namespace.upsert(batch as any);
  }
}

// Query vectors for a brand
export async function queryBrandVectors(
  brandProfileId: string,
  queryVector: number[],
  topK = 5
) {
  const index = await getBrandIndex();
  const namespace = index.namespace(brandProfileId);

  const results = await namespace.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return results.matches || [];
}

// Delete all vectors for a brand
export async function deleteBrandVectors(brandProfileId: string) {
  const index = await getBrandIndex();
  const namespace = index.namespace(brandProfileId);

  await namespace.deleteAll();
}

// Get vector count for a brand
export async function getBrandVectorCount(brandProfileId: string) {
  const index = await getBrandIndex();
  const stats = await index.describeIndexStats();

  return stats.namespaces?.[brandProfileId]?.recordCount || 0;
}
