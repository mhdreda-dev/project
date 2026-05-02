-- Phase 1 multi-store foundation.
-- Additive only: existing rows are assigned to a default store while current
-- application queries continue to work without store scoping.

CREATE TABLE "stores" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
CREATE INDEX "stores_slug_idx" ON "stores"("slug");
CREATE INDEX "stores_isActive_idx" ON "stores"("isActive");
CREATE INDEX "stores_isDefault_idx" ON "stores"("isDefault");

INSERT INTO "stores" ("id", "name", "slug", "isDefault", "isActive")
VALUES ('default-store', 'Benami', 'benami', true, true);

ALTER TABLE "users" ADD COLUMN "storeId" TEXT;
ALTER TABLE "brands" ADD COLUMN "storeId" TEXT;
ALTER TABLE "products" ADD COLUMN "storeId" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "storeId" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "storeId" TEXT;
ALTER TABLE "reward_events" ADD COLUMN "storeId" TEXT;
ALTER TABLE "ai_conversations" ADD COLUMN "storeId" TEXT;
ALTER TABLE "ai_leads" ADD COLUMN "storeId" TEXT;

UPDATE "users" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "brands" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "products" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "stock_movements" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "activity_logs" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "reward_events" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "ai_conversations" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;
UPDATE "ai_leads" SET "storeId" = 'default-store' WHERE "storeId" IS NULL;

CREATE INDEX "users_storeId_idx" ON "users"("storeId");
CREATE INDEX "brands_storeId_idx" ON "brands"("storeId");
CREATE INDEX "products_storeId_idx" ON "products"("storeId");
CREATE INDEX "stock_movements_storeId_idx" ON "stock_movements"("storeId");
CREATE INDEX "activity_logs_storeId_idx" ON "activity_logs"("storeId");
CREATE INDEX "reward_events_storeId_idx" ON "reward_events"("storeId");
CREATE INDEX "ai_conversations_storeId_idx" ON "ai_conversations"("storeId");
CREATE INDEX "ai_leads_storeId_idx" ON "ai_leads"("storeId");

ALTER TABLE "users"
  ADD CONSTRAINT "users_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "brands"
  ADD CONSTRAINT "brands_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reward_events"
  ADD CONSTRAINT "reward_events_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_conversations"
  ADD CONSTRAINT "ai_conversations_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_leads"
  ADD CONSTRAINT "ai_leads_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
