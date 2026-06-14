-- =============================================================
-- FIX PAYMENT SETTINGS — RLS + deduplicate + enable payments
-- Run in Supabase SQL Editor
-- =============================================================

-- 1. Add SELECT policy so regular users can read payment settings
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;
CREATE POLICY "Admins can manage payment settings" ON payment_settings
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow all authenticated users to SELECT
DROP POLICY IF EXISTS "Anyone can read payment settings" ON payment_settings;
CREATE POLICY "Anyone can read payment settings" ON payment_settings
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- 2. Deduplicate — keep only the row with paystack_enabled = true (or the first one)
DELETE FROM payment_settings
WHERE id NOT IN (
  SELECT id FROM payment_settings ORDER BY paystack_enabled DESC, created_at ASC LIMIT 1
);

-- 3. Enable Paystack
UPDATE payment_settings SET paystack_enabled = true WHERE paystack_enabled = false;

-- 4. Enforce single-row with id = 1 (like pricing_config)
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS single_row_id INT DEFAULT 1;
UPDATE payment_settings SET single_row_id = 1;
ALTER TABLE payment_settings ADD CONSTRAINT payment_settings_single_row UNIQUE (single_row_id);

-- Verify
SELECT id, paystack_enabled, paystack_mode, stripe_enabled FROM payment_settings;
