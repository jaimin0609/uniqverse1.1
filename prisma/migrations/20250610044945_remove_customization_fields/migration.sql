/*
  Warnings:

  - You are about to drop the column `customDesignId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `customDesignId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `customizationTemplate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isCustomizable` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `printArea` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `CustomDesign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_customDesignId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDesign" DROP CONSTRAINT "CustomDesign_productId_fkey";

-- DropForeignKey
ALTER TABLE "CustomDesign" DROP CONSTRAINT "CustomDesign_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_customDesignId_fkey";

-- DropIndex
DROP INDEX "CartItem_customDesignId_idx";

-- DropIndex
DROP INDEX "OrderItem_customDesignId_idx";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "customDesignId";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "customDesignId";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "customizationTemplate",
DROP COLUMN "isCustomizable",
DROP COLUMN "printArea";

-- DropTable
DROP TABLE "CustomDesign";
