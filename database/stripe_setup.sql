-- =====================================================
-- STRIPE PAYMENT SYSTEM SETUP
-- =====================================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT DEFAULT 'free', -- 'free', 'pro', 'premium'
    status TEXT DEFAULT 'inactive', -- 'active', 'trailing', 'past_due', 'canceled', 'inactive'
    price_id TEXT,
    quantity INTEGER DEFAULT 1,
    cancel_at_period_end BOOLEAN DEFAULT false,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add subscription fields to profiles for quick access
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 3. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Subscriptions Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view their own subscription') THEN
        CREATE POLICY "Users can view their own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Trigger to update profiles when subscriptions change
CREATE OR REPLACE FUNCTION update_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET 
        subscription_tier = NEW.tier,
        subscription_status = NEW.status,
        stripe_customer_id = NEW.stripe_customer_id,
        is_premium = (NEW.tier != 'free' AND NEW.status = 'active')
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_subscription_change
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_profile_subscription();
