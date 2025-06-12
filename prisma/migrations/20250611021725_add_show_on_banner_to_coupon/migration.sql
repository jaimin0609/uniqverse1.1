-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "showOnBanner" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Coupon_showOnBanner_idx" ON "Coupon"("showOnBanner");
