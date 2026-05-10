-- Add paystack_mode column to payment_settings table
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS paystack_mode VARCHAR(10) DEFAULT 'test' CHECK (paystack_mode IN ('test', 'live'));

-- Update existing rows to have default mode
UPDATE payment_settings 
SET paystack_mode = 'test' 
WHERE paystack_mode IS NULL;
