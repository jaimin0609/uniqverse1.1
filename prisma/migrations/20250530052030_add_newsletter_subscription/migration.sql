-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "externalLinks" JSONB,
ADD COLUMN     "isAdEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "_CategoryToCoupon" ADD CONSTRAINT "_CategoryToCoupon_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CategoryToCoupon_AB_unique";

-- AlterTable
ALTER TABLE "_CouponToProduct" ADD CONSTRAINT "_CouponToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CouponToProduct_AB_unique";

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'image',
    "textOverlay" TEXT,
    "textPosition" TEXT NOT NULL DEFAULT 'center',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textSize" TEXT NOT NULL DEFAULT 'text-2xl',
    "textShadow" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT,
    "opacity" INTEGER NOT NULL DEFAULT 100,
    "effectType" TEXT,
    "linkUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT,
    "preferences" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Event_isActive_idx" ON "Event"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_unsubscribeToken_key" ON "NewsletterSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_email_idx" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_status_idx" ON "NewsletterSubscription"("status");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_subscribedAt_idx" ON "NewsletterSubscription"("subscribedAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_unsubscribeToken_idx" ON "NewsletterSubscription"("unsubscribeToken");
