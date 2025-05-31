-- DropForeignKey
ALTER TABLE "InventoryHistory" DROP CONSTRAINT "InventoryHistory_userId_fkey";

-- AlterTable
ALTER TABLE "InventoryHistory" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InventoryHistory" ADD CONSTRAINT "InventoryHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
