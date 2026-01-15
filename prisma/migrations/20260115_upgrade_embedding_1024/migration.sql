-- Migration: Upgrade embedding dimension from 384 to 1024 (bge-large-en-v1.5)
-- This migration:
-- 1. Drops the existing embedding column (384 dimensions)
-- 2. Recreates it with 1024 dimensions
-- 3. Clears embedding_text and embedded_at to force re-embedding

-- Step 1: Drop the old embedding column
ALTER TABLE templates DROP COLUMN IF EXISTS embedding;

-- Step 2: Add new embedding column with 1024 dimensions
ALTER TABLE templates ADD COLUMN embedding vector(1024);

-- Step 3: Clear embedding metadata to indicate re-embedding is needed
UPDATE templates SET embedding_text = NULL, embedded_at = NULL;

-- Note: After running this migration, you must re-embed all templates
-- Run: npx ts-node scripts/reembed-templates.ts
