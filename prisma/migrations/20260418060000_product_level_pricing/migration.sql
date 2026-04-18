-- Add product-level pricing and stock threshold
ALTER TABLE "products"
  ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "costPrice" DECIMAL(10,2),
  ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- Backfill product-level prices from first existing size price (if any)
UPDATE "products" p
SET
  "price" = COALESCE(sub.price, 0),
  "costPrice" = sub."costPrice"
FROM (
  SELECT DISTINCT ON ("productId")
    "productId", "price", "costPrice"
  FROM "product_sizes"
  ORDER BY "productId", "createdAt" ASC
) sub
WHERE sub."productId" = p."id";

-- Backfill lowStockThreshold from max of existing size minQuantity (keeps alerts meaningful)
UPDATE "products" p
SET "lowStockThreshold" = COALESCE(sub.m, 5)
FROM (
  SELECT "productId", MAX("minQuantity") AS m
  FROM "product_sizes"
  GROUP BY "productId"
) sub
WHERE sub."productId" = p."id" AND sub.m IS NOT NULL;

-- Make legacy per-size price nullable (kept for backward compat, ignored going forward)
ALTER TABLE "product_sizes" ALTER COLUMN "price" DROP NOT NULL;
