-- Migration: Backfill schema drift between migrations and current schema.prisma
-- Tables and columns added to schema.prisma after the initial migration was committed
-- were never reflected in a migration file. This migration is fully idempotent
-- (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) so it is safe on both fresh CI
-- databases and existing production databases.

-- ── New Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationStatus') THEN
    CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'AWAITING_INPUT', 'GENERATING', 'COMPLETED', 'ABANDONED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentType') THEN
    CREATE TYPE "AgentType" AS ENUM ('COORDINATOR', 'INTAKE', 'CLARIFIER', 'SUGGESTER', 'PLANNER', 'BRAND_CONTEXT', 'GENERATOR', 'FEEDBACK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerTransactionType') THEN
    CREATE TYPE "SellerTransactionType" AS ENUM ('SALE', 'WITHDRAWAL', 'REFUND');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DetailPageStatus') THEN
    CREATE TYPE "DetailPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

-- ProjectStatus: add DELETED value (added after initial migration)
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DELETED';

-- ── New columns on existing tables ────────────────────────────────────────────

-- users: 2FA fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- projects: product info fields added after initial migration
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_features TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS copy_length TEXT DEFAULT 'medium';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_images TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_model TEXT DEFAULT 'gemini-2.5-flash-image';

-- detail_page_versions: fields added and nullability changes after initial migration
ALTER TABLE detail_page_versions ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE detail_page_versions ADD COLUMN IF NOT EXISTS content_json JSONB;
ALTER TABLE detail_page_versions ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE detail_page_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3);
DO $$ BEGIN
  -- Add status column only after DetailPageStatus enum exists (created above)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detail_page_versions' AND column_name = 'status'
  ) THEN
    ALTER TABLE detail_page_versions ADD COLUMN status "DetailPageStatus" NOT NULL DEFAULT 'DRAFT';
  END IF;
END $$;
-- Allow nullable hook_message and sections (schema marks them as optional for drafts)
ALTER TABLE detail_page_versions ALTER COLUMN hook_message DROP NOT NULL;
ALTER TABLE detail_page_versions ALTER COLUMN sections DROP NOT NULL;
-- Add unique constraint on (project_id, version_number) if not present
CREATE UNIQUE INDEX IF NOT EXISTS "detail_page_versions_project_id_version_number_key"
  ON detail_page_versions(project_id, version_number);

-- brand_profiles: voice_tone and style_guide added after initial migration
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS voice_tone TEXT;
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS style_guide JSONB;

-- editor_drafts: add unique constraint on project_id
CREATE UNIQUE INDEX IF NOT EXISTS "editor_drafts_project_id_key" ON editor_drafts(project_id);

-- templates: marketplace + search fields
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS published_at TIMESTAMP(3);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS preview_images TEXT[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- ── New tables ────────────────────────────────────────────────────────────────

-- login_history
CREATE TABLE IF NOT EXISTS "login_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ip_address" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "fail_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "login_history_user_id_idx" ON "login_history"("user_id");
CREATE INDEX IF NOT EXISTS "login_history_created_at_idx" ON "login_history"("created_at");
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'login_history_user_id_fkey'
  ) THEN
    ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- template_purchases
CREATE TABLE IF NOT EXISTS "template_purchases" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT,
    "price_paid" INTEGER NOT NULL,
    "seller_earning" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "template_purchases_template_id_buyer_id_key" ON "template_purchases"("template_id", "buyer_id");
CREATE INDEX IF NOT EXISTS "template_purchases_buyer_id_idx" ON "template_purchases"("buyer_id");
CREATE INDEX IF NOT EXISTS "template_purchases_seller_id_idx" ON "template_purchases"("seller_id");
CREATE INDEX IF NOT EXISTS "template_purchases_purchased_at_idx" ON "template_purchases"("purchased_at");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_purchases_template_id_fkey') THEN
    ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_purchases_buyer_id_fkey') THEN
    ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_buyer_id_fkey"
      FOREIGN KEY ("buyer_id") REFERENCES "users"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_purchases_seller_id_fkey') THEN
    ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_seller_id_fkey"
      FOREIGN KEY ("seller_id") REFERENCES "users"("id");
  END IF;
END $$;

-- seller_balances
CREATE TABLE IF NOT EXISTS "seller_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "available_credits" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_withdrawn" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seller_balances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "seller_balances_user_id_key" ON "seller_balances"("user_id");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'seller_balances_user_id_fkey') THEN
    ALTER TABLE "seller_balances" ADD CONSTRAINT "seller_balances_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- seller_transactions
CREATE TABLE IF NOT EXISTS "seller_transactions" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "type" "SellerTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT,
    "template_id" TEXT,
    "purchase_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "seller_transactions_seller_id_idx" ON "seller_transactions"("seller_id");
CREATE INDEX IF NOT EXISTS "seller_transactions_created_at_idx" ON "seller_transactions"("created_at");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'seller_transactions_seller_id_fkey') THEN
    ALTER TABLE "seller_transactions" ADD CONSTRAINT "seller_transactions_seller_id_fkey"
      FOREIGN KEY ("seller_id") REFERENCES "seller_balances"("user_id");
  END IF;
END $$;

-- template_reviews
CREATE TABLE IF NOT EXISTS "template_reviews" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "template_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "template_reviews_template_id_user_id_key" ON "template_reviews"("template_id", "user_id");
CREATE INDEX IF NOT EXISTS "template_reviews_template_id_idx" ON "template_reviews"("template_id");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_reviews_template_id_fkey') THEN
    ALTER TABLE "template_reviews" ADD CONSTRAINT "template_reviews_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_reviews_user_id_fkey') THEN
    ALTER TABLE "template_reviews" ADD CONSTRAINT "template_reviews_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "collected_data" JSONB NOT NULL DEFAULT '{}',
    "current_agent" "AgentType" NOT NULL DEFAULT 'COORDINATOR',
    "agent_state" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_project_id_key" ON "conversations"("project_id");
CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations"("user_id");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "conversations_created_at_idx" ON "conversations"("created_at");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_user_id_fkey') THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_project_id_fkey') THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- conversation_messages
CREATE TABLE IF NOT EXISTS "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "agent_type" "AgentType",
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "attachments" TEXT[] DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "conversation_messages_created_at_idx" ON "conversation_messages"("created_at");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversation_messages_conversation_id_fkey') THEN
    ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
  END IF;
END $$;
