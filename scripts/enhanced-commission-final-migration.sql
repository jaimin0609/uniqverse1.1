-- Enhanced Commission System - Final Migration Script
-- This script completes the migration for the enhanced vendor commission system

-- First, let's add the missing columns to VendorCommissionSettings
DO $$
BEGIN
    -- Add planType column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'VendorCommissionSettings' AND column_name = 'planType') THEN
        ALTER TABLE "VendorCommissionSettings" ADD COLUMN "planType" TEXT DEFAULT 'STARTER' NOT NULL;
        RAISE NOTICE 'Added planType column';
    END IF;

    -- Add subscriptionStatus column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'VendorCommissionSettings' AND column_name = 'subscriptionStatus') THEN
        ALTER TABLE "VendorCommissionSettings" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'ACTIVE' NOT NULL;
        RAISE NOTICE 'Added subscriptionStatus column';
    END IF;

    -- Add customerDiscount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'VendorCommissionSettings' AND column_name = 'customerDiscount') THEN
        ALTER TABLE "VendorCommissionSettings" ADD COLUMN "customerDiscount" DECIMAL(5,2) DEFAULT 0.00;
        RAISE NOTICE 'Added customerDiscount column';
    END IF;

    -- Ensure transactionFee column exists with correct type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'VendorCommissionSettings' AND column_name = 'transactionFee') THEN
        ALTER TABLE "VendorCommissionSettings" ADD COLUMN "transactionFee" DECIMAL(5,2) DEFAULT 0.00;
        RAISE NOTICE 'Added transactionFee column';
    END IF;

    RAISE NOTICE 'VendorCommissionSettings migration completed successfully!';
END$$;

-- Update existing records with default plan settings based on their current commission rates
UPDATE "VendorCommissionSettings"
SET 
    "planType" = CASE 
        WHEN "defaultCommissionRate" <= 0.05 THEN 'STARTER'
        WHEN "defaultCommissionRate" <= 0.10 THEN 'PROFESSIONAL'
        ELSE 'ENTERPRISE'
    END,
    "subscriptionStatus" = 'ACTIVE',
    "transactionFee" = CASE 
        WHEN "defaultCommissionRate" <= 0.05 THEN 0.05
        WHEN "defaultCommissionRate" <= 0.10 THEN 0.03
        ELSE 0.02
    END,
    "customerDiscount" = CASE 
        WHEN "defaultCommissionRate" <= 0.05 THEN 0.00
        WHEN "defaultCommissionRate" <= 0.10 THEN 0.02
        ELSE 0.05
    END,
    "nextBillingDate" = CURRENT_DATE + INTERVAL '1 month',
    "features" = CASE 
        WHEN "defaultCommissionRate" <= 0.05 THEN '{"analytics": "basic", "support": "email", "promotion": "none"}'::jsonb
        WHEN "defaultCommissionRate" <= 0.10 THEN '{"analytics": "advanced", "support": "priority", "promotion": "featured"}'::jsonb
        ELSE '{"analytics": "premium", "support": "dedicated", "promotion": "homepage"}'::jsonb
    END
WHERE "planType" IS NULL OR "subscriptionStatus" IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_commission_plan_type ON "VendorCommissionSettings"("planType");
CREATE INDEX IF NOT EXISTS idx_vendor_commission_subscription_status ON "VendorCommissionSettings"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS idx_vendor_commission_next_billing ON "VendorCommissionSettings"("nextBillingDate");

-- Display final summary
SELECT 
    "planType",
    "subscriptionStatus",
    COUNT(*) as vendor_count,
    AVG("defaultCommissionRate") as avg_commission_rate,
    AVG("transactionFee") as avg_transaction_fee,
    AVG("customerDiscount") as avg_customer_discount
FROM "VendorCommissionSettings"
GROUP BY "planType", "subscriptionStatus"
ORDER BY "planType";

-- Verify all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'VendorCommissionSettings' 
ORDER BY ordinal_position;
