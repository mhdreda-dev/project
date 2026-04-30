-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "requestedProduct" TEXT,
    "requestedBrand" TEXT,
    "requestedCategory" TEXT,
    "requestedSize" TEXT,
    "requestedColor" TEXT,
    "matchedProductId" TEXT,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_leads" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "productName" TEXT,
    "size" TEXT,
    "color" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_createdAt_idx" ON "ai_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "ai_conversations_requestedProduct_idx" ON "ai_conversations"("requestedProduct");

-- CreateIndex
CREATE INDEX "ai_conversations_requestedCategory_idx" ON "ai_conversations"("requestedCategory");

-- CreateIndex
CREATE INDEX "ai_conversations_requestedSize_idx" ON "ai_conversations"("requestedSize");

-- CreateIndex
CREATE INDEX "ai_conversations_requestedColor_idx" ON "ai_conversations"("requestedColor");

-- CreateIndex
CREATE INDEX "ai_conversations_matchedProductId_idx" ON "ai_conversations"("matchedProductId");

-- CreateIndex
CREATE INDEX "ai_conversations_isUnavailable_idx" ON "ai_conversations"("isUnavailable");

-- CreateIndex
CREATE INDEX "ai_leads_createdAt_idx" ON "ai_leads"("createdAt");

-- CreateIndex
CREATE INDEX "ai_leads_status_idx" ON "ai_leads"("status");

-- CreateIndex
CREATE INDEX "ai_leads_phone_idx" ON "ai_leads"("phone");

-- CreateIndex
CREATE INDEX "ai_leads_email_idx" ON "ai_leads"("email");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_leads" ADD CONSTRAINT "ai_leads_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
