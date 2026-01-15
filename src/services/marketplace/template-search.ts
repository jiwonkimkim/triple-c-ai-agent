import { prisma } from '@/lib/prisma';
import { generateQueryEmbedding } from '@/services/rag/embeddings';
import { TemplateCategory, Prisma } from '@prisma/client';

export interface TemplateSearchOptions {
  query: string;
  category?: TemplateCategory | 'all';
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  minSimilarity?: number; // 0.0 ~ 1.0
  hybridWeight?: number; // 0.0 = keyword only, 1.0 = semantic only, 0.5 = hybrid
}

export interface TemplateSearchResult {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string | null;
  description: string | null;
  price: number;
  tags: string[];
  downloadCount: number;
  rating: number | null;
  ratingCount: number;
  publishedAt: Date | null;
  similarity: number; // cosine similarity (0 ~ 1)
  seller: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

interface RawSearchResult {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string | null;
  description: string | null;
  price: number;
  tags: string[];
  downloadCount: number;
  rating: number | null;
  ratingCount: number;
  publishedAt: Date | null;
  similarity: number;
  user_id: string | null;
  user_name: string | null;
  user_nickname: string | null;
  user_image: string | null;
}

/**
 * Semantic search for templates with hybrid scoring
 */
export async function semanticSearchTemplates(
  options: TemplateSearchOptions
): Promise<{ templates: TemplateSearchResult[]; total: number }> {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    limit = 12,
    offset = 0,
    minSimilarity = 0.3,
    hybridWeight = 0.7, // Default: 70% semantic, 30% keyword
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build category filter
  const categoryFilter =
    category && category !== 'all'
      ? Prisma.sql`AND t.category = ${category}::"TemplateCategory"`
      : Prisma.empty;

  // Build price filters
  const minPriceFilter =
    minPrice !== undefined ? Prisma.sql`AND t.price >= ${minPrice}` : Prisma.empty;
  const maxPriceFilter =
    maxPrice !== undefined ? Prisma.sql`AND t.price <= ${maxPrice}` : Prisma.empty;

  // Hybrid search query
  const results = await prisma.$queryRaw<RawSearchResult[]>`
    WITH semantic_scores AS (
      SELECT
        id,
        1 - (embedding <=> ${embeddingStr}::vector) as semantic_score
      FROM templates
      WHERE
        is_published = true
        AND embedding IS NOT NULL
        ${categoryFilter}
        ${minPriceFilter}
        ${maxPriceFilter}
    ),
    keyword_scores AS (
      SELECT
        id,
        -- 합산 방식: 여러 필드에서 매칭되면 점수가 누적됨
        (
          CASE WHEN name ILIKE ${'%' + query + '%'} THEN 0.5 ELSE 0 END +
          CASE WHEN description ILIKE ${'%' + query + '%'} THEN 0.3 ELSE 0 END +
          CASE WHEN array_to_string(tags, ' ') ILIKE ${'%' + query + '%'} THEN 0.2 ELSE 0 END +
          -- 개별 단어 매칭 (2자 이상 단어들이 모두 포함되면 보너스)
          CASE WHEN embedding_text ILIKE ALL(
            SELECT '%' || word || '%'
            FROM unnest(string_to_array(${query}, ' ')) AS word
            WHERE length(word) >= 2
          ) THEN 0.4 ELSE 0 END
        ) as keyword_score
      FROM templates
      WHERE
        is_published = true
        ${categoryFilter}
        ${minPriceFilter}
        ${maxPriceFilter}
    ),
    combined_scores AS (
      SELECT
        COALESCE(s.id, k.id) as id,
        (COALESCE(s.semantic_score, 0) * ${hybridWeight} +
         COALESCE(k.keyword_score, 0) * ${1 - hybridWeight}) as combined_score
      FROM semantic_scores s
      FULL OUTER JOIN keyword_scores k ON s.id = k.id
      WHERE COALESCE(s.semantic_score, 0) >= ${minSimilarity}
         OR COALESCE(k.keyword_score, 0) > 0
    )
    SELECT
      t.id,
      t.name,
      t.category,
      t.thumbnail_url as "thumbnailUrl",
      t.description,
      t.price,
      t.tags,
      t.download_count as "downloadCount",
      t.rating,
      t.rating_count as "ratingCount",
      t.published_at as "publishedAt",
      c.combined_score as similarity,
      t.user_id,
      u.name as user_name,
      u.nickname as user_nickname,
      u.image as user_image
    FROM combined_scores c
    JOIN templates t ON c.id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY c.combined_score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Get total count
  const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH semantic_scores AS (
      SELECT id, 1 - (embedding <=> ${embeddingStr}::vector) as semantic_score
      FROM templates
      WHERE is_published = true AND embedding IS NOT NULL
        ${categoryFilter}
        ${minPriceFilter}
        ${maxPriceFilter}
    ),
    keyword_scores AS (
      SELECT id,
        (
          CASE WHEN name ILIKE ${'%' + query + '%'} THEN 0.5 ELSE 0 END +
          CASE WHEN description ILIKE ${'%' + query + '%'} THEN 0.3 ELSE 0 END +
          CASE WHEN array_to_string(tags, ' ') ILIKE ${'%' + query + '%'} THEN 0.2 ELSE 0 END +
          CASE WHEN embedding_text ILIKE ALL(
            SELECT '%' || word || '%'
            FROM unnest(string_to_array(${query}, ' ')) AS word
            WHERE length(word) >= 2
          ) THEN 0.4 ELSE 0 END
        ) as keyword_score
      FROM templates
      WHERE is_published = true
        ${categoryFilter}
        ${minPriceFilter}
        ${maxPriceFilter}
    )
    SELECT COUNT(DISTINCT COALESCE(s.id, k.id)) as count
    FROM semantic_scores s
    FULL OUTER JOIN keyword_scores k ON s.id = k.id
    WHERE COALESCE(s.semantic_score, 0) >= ${minSimilarity}
       OR COALESCE(k.keyword_score, 0) > 0
  `;

  const templates = results.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    thumbnailUrl: r.thumbnailUrl,
    description: r.description,
    price: r.price,
    tags: r.tags,
    downloadCount: r.downloadCount,
    rating: r.rating,
    ratingCount: r.ratingCount,
    publishedAt: r.publishedAt,
    similarity: r.similarity,
    seller: r.user_id
      ? {
          id: r.user_id,
          name: r.user_name || r.user_nickname || 'Unknown',
          image: r.user_image,
        }
      : null,
  }));

  return {
    templates,
    total: Number(countResult[0]?.count ?? 0),
  };
}

/**
 * Find similar templates based on embedding similarity
 */
export async function findSimilarTemplates(
  templateId: string,
  limit = 5
): Promise<TemplateSearchResult[]> {
  const results = await prisma.$queryRaw<RawSearchResult[]>`
    WITH target AS (
      SELECT embedding FROM templates WHERE id = ${templateId}
    )
    SELECT
      t.id,
      t.name,
      t.category,
      t.thumbnail_url as "thumbnailUrl",
      t.description,
      t.price,
      t.tags,
      t.download_count as "downloadCount",
      t.rating,
      t.rating_count as "ratingCount",
      t.published_at as "publishedAt",
      1 - (t.embedding <=> (SELECT embedding FROM target)) as similarity,
      t.user_id,
      u.name as user_name,
      u.nickname as user_nickname,
      u.image as user_image
    FROM templates t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE
      t.is_published = true
      AND t.id != ${templateId}
      AND t.embedding IS NOT NULL
    ORDER BY t.embedding <=> (SELECT embedding FROM target)
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    thumbnailUrl: r.thumbnailUrl,
    description: r.description,
    price: r.price,
    tags: r.tags,
    downloadCount: r.downloadCount,
    rating: r.rating,
    ratingCount: r.ratingCount,
    publishedAt: r.publishedAt,
    similarity: r.similarity,
    seller: r.user_id
      ? {
          id: r.user_id,
          name: r.user_name || r.user_nickname || 'Unknown',
          image: r.user_image,
        }
      : null,
  }));
}

/**
 * Simple semantic search (semantic only, no hybrid)
 */
export async function pureSemanticSearch(
  query: string,
  options: {
    category?: TemplateCategory | 'all';
    limit?: number;
    minSimilarity?: number;
  } = {}
): Promise<TemplateSearchResult[]> {
  const { category, limit = 10, minSimilarity = 0.3 } = options;

  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const categoryFilter =
    category && category !== 'all'
      ? Prisma.sql`AND category = ${category}::"TemplateCategory"`
      : Prisma.empty;

  const results = await prisma.$queryRaw<RawSearchResult[]>`
    SELECT
      t.id,
      t.name,
      t.category,
      t.thumbnail_url as "thumbnailUrl",
      t.description,
      t.price,
      t.tags,
      t.download_count as "downloadCount",
      t.rating,
      t.rating_count as "ratingCount",
      t.published_at as "publishedAt",
      1 - (t.embedding <=> ${embeddingStr}::vector) as similarity,
      t.user_id,
      u.name as user_name,
      u.nickname as user_nickname,
      u.image as user_image
    FROM templates t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE
      t.is_published = true
      AND t.embedding IS NOT NULL
      AND 1 - (t.embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
      ${categoryFilter}
    ORDER BY t.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    thumbnailUrl: r.thumbnailUrl,
    description: r.description,
    price: r.price,
    tags: r.tags,
    downloadCount: r.downloadCount,
    rating: r.rating,
    ratingCount: r.ratingCount,
    publishedAt: r.publishedAt,
    similarity: r.similarity,
    seller: r.user_id
      ? {
          id: r.user_id,
          name: r.user_name || r.user_nickname || 'Unknown',
          image: r.user_image,
        }
      : null,
  }));
}
