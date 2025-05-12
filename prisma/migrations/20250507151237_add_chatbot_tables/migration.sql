/*
  Warnings:

  - You are about to drop the column `settings` on the `HomepageSection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HomepageSection" DROP COLUMN "settings";

-- CreateTable
CREATE TABLE "ChatbotPattern" (
    "id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "response" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ChatbotPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotTrigger" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "ChatbotTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotFallback" (
    "id" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotFallback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotPattern_priority_idx" ON "ChatbotPattern"("priority");

-- CreateIndex
CREATE INDEX "ChatbotTrigger_patternId_idx" ON "ChatbotTrigger"("patternId");

-- AddForeignKey
ALTER TABLE "ChatbotPattern" ADD CONSTRAINT "ChatbotPattern_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotTrigger" ADD CONSTRAINT "ChatbotTrigger_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "ChatbotPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
