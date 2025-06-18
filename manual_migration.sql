-- Manual SQL to add new fields to Supplier table
-- Run this directly in Supabase SQL Editor
ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "type" TEXT,
ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);

-- Create index for better performance on token lookups
CREATE INDEX IF NOT EXISTS "Supplier_type_idx" ON "Supplier" ("type");

CREATE INDEX IF NOT EXISTS "Supplier_accessToken_idx" ON "Supplier" ("accessToken");

-- Update existing CJ Dropshipping suppliers if any
UPDATE "Supplier"
SET
    "type" = 'CJ_DROPSHIPPING'
WHERE
    "name" ILIKE '%cj%'
    OR "name" ILIKE '%dropship%';