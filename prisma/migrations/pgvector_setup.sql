-- pgvector setup for Neon PostgreSQL
-- Run this SQL in Neon SQL Editor after Prisma migration

-- Step 1: Enable pgvector extension (Neon supports this by default)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add vector column to templates table
-- Note: Prisma will create embedding_text and embedded_at columns automatically
-- This SQL adds the vector column if it doesn't exist
-- Using 768 dimensions for Gemini text-embedding-004
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'templates' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE templates ADD COLUMN embedding vector(768);
    END IF;
END $$;

-- Step 3: Create HNSW index for fast similarity search
-- HNSW (Hierarchical Navigable Small World) is recommended for most use cases
-- - m: number of bi-directional links (16 is good for 1536 dimensions)
-- - ef_construction: size of dynamic candidate list (64 is balanced)
DROP INDEX IF EXISTS templates_embedding_idx;
CREATE INDEX templates_embedding_idx
ON templates USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Optional: Create IVFFlat index (alternative to HNSW)
-- Uncomment if you prefer IVFFlat over HNSW
-- IVFFlat is faster to build but slightly slower to query
-- DROP INDEX IF EXISTS templates_embedding_ivfflat_idx;
-- CREATE INDEX templates_embedding_ivfflat_idx
-- ON templates USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Verify setup
SELECT
    'pgvector extension' as check_item,
    EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as status
UNION ALL
SELECT
    'embedding column',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'embedding')
UNION ALL
SELECT
    'HNSW index',
    EXISTS(SELECT 1 FROM pg_indexes WHERE tablename = 'templates' AND indexname = 'templates_embedding_idx');
