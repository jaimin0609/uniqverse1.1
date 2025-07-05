-- Fix existing commission records to show vendor earnings instead of platform commission
-- This script will recalculate and update all existing commission records
-- First, let's see what we have
SELECT
    vc.id,
    vc.saleAmount,
    vc.commissionAmount,
    vc.commissionRate,
    u.name as vendorName,
    o.orderNumber
FROM
    VendorCommission vc
    JOIN User u ON vc.vendorId = u.id
    JOIN Order o ON vc.orderId = o.id
ORDER BY
    vc.createdAt DESC
LIMIT
    10;

-- The issue is that commissionAmount stores platform commission, not vendor earnings
-- We need to update it to store vendor earnings
-- For STARTER plan (8% commission + $0.30 transaction fee):
-- Vendor earnings = saleAmount - (saleAmount * 0.08 + 0.30)
UPDATE VendorCommission
SET
    commissionAmount = saleAmount - (saleAmount * commissionRate + transactionFee)
WHERE
    status IN ('PENDING', 'APPROVED', 'PAID');

-- Verify the update
SELECT
    vc.id,
    vc.saleAmount,
    vc.commissionAmount as vendorEarnings,
    (
        vc.saleAmount * vc.commissionRate + vc.transactionFee
    ) as platformCommission,
    u.name as vendorName
FROM
    VendorCommission vc
    JOIN User u ON vc.vendorId = u.id
ORDER BY
    vc.createdAt DESC
LIMIT
    5;