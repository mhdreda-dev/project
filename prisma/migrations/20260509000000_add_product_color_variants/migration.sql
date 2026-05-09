-- Add color variants without changing existing simple product rows.
CREATE TABLE "product_variants" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "colorHex" TEXT,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_variant_images" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_variant_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "product_sizes" ADD COLUMN "variantId" TEXT;

CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");
CREATE INDEX "product_variant_images_variantId_idx" ON "product_variant_images"("variantId");
CREATE INDEX "product_sizes_variantId_idx" ON "product_sizes"("variantId");

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variant_images"
  ADD CONSTRAINT "product_variant_images_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_sizes"
  ADD CONSTRAINT "product_sizes_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "product_sizes_productId_size_key";

CREATE UNIQUE INDEX "product_sizes_simple_product_size_key"
  ON "product_sizes"("productId", "size")
  WHERE "variantId" IS NULL;

CREATE UNIQUE INDEX "product_sizes_variant_size_key"
  ON "product_sizes"("variantId", "size")
  WHERE "variantId" IS NOT NULL;
