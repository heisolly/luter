-- Create payment_settings table for admin control
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paystack_enabled BOOLEAN DEFAULT true,
  stripe_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_transactions table for tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  reference TEXT UNIQUE NOT NULL,
  gateway VARCHAR(20) NOT NULL, -- 'paystack', 'stripe', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage payment settings" ON payment_settings
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view payment transactions" ON payment_transactions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'authenticated'
  );

CREATE POLICY "Users can insert own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'authenticated' AND
    user_id = auth.uid()
  );

-- Insert default payment settings
INSERT INTO payment_settings (paystack_enabled, stripe_enabled) 
VALUES (true, false)
ON CONFLICT (id) DO NOTHING;
