-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "customDesignId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customDesignId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customizationTemplate" TEXT,
ADD COLUMN     "isCustomizable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printArea" TEXT;

-- CreateTable
CREATE TABLE "CustomDesign" (
    "id" TEXT NOT NULL,
    "designData" TEXT NOT NULL,
    "previewImageUrl" TEXT,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "designName" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomDesign_productId_idx" ON "CustomDesign"("productId");

-- CreateIndex
CREATE INDEX "CustomDesign_userId_idx" ON "CustomDesign"("userId");

-- CreateIndex
CREATE INDEX "CustomDesign_createdAt_idx" ON "CustomDesign"("createdAt");

-- CreateIndex
CREATE INDEX "CartItem_customDesignId_idx" ON "CartItem"("customDesignId");

-- CreateIndex
CREATE INDEX "OrderItem_customDesignId_idx" ON "OrderItem"("customDesignId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_customDesignId_fkey" FOREIGN KEY ("customDesignId") REFERENCES "CustomDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_customDesignId_fkey" FOREIGN KEY ("customDesignId") REFERENCES "CustomDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDesign" ADD CONSTRAINT "CustomDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDesign" ADD CONSTRAINT "CustomDesign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
