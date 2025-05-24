-- CreateTable
CREATE TABLE "DropshippingSettings" (
    "id" TEXT NOT NULL,
    "autoProcess" BOOLEAN NOT NULL DEFAULT true,
    "autoSendOrders" BOOLEAN NOT NULL DEFAULT false,
    "statusCheckInterval" INTEGER NOT NULL DEFAULT 12,
    "defaultShippingDays" INTEGER NOT NULL DEFAULT 7,
    "notificationEmail" TEXT,
    "profitMargin" INTEGER NOT NULL DEFAULT 30,
    "automaticFulfillment" BOOLEAN NOT NULL DEFAULT true,
    "notifyCustomerOnShipment" BOOLEAN NOT NULL DEFAULT true,
    "defaultSupplier" TEXT,
    "supplierNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DropshippingSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DropshippingSettings" ADD CONSTRAINT "DropshippingSettings_defaultSupplier_fkey" FOREIGN KEY ("defaultSupplier") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE;