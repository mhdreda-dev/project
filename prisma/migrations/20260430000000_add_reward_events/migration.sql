-- CreateEnum
CREATE TYPE "RewardActionType" AS ENUM ('PRODUCT_ADDED', 'PRODUCT_SOLD');

-- CreateTable
CREATE TABLE "reward_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "actionType" "RewardActionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rewardAmountMAD" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reward_events_userId_idx" ON "reward_events"("userId");

-- CreateIndex
CREATE INDEX "reward_events_productId_idx" ON "reward_events"("productId");

-- CreateIndex
CREATE INDEX "reward_events_actionType_idx" ON "reward_events"("actionType");

-- CreateIndex
CREATE INDEX "reward_events_createdAt_idx" ON "reward_events"("createdAt");

-- AddForeignKey
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
