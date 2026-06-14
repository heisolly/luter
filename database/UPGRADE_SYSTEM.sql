-- =============================================================
-- LUTER UPGRADE SYSTEM — RUN IN SUPABASE SQL EDITOR
-- 1. pricing_config table for admin pricing overrides
-- 2. Daily credit reset via pg_cron
-- 3. Paystack payment_settings default row
-- =============================================================

-- ═════════════════════════════════════════════════════════════
-- 1. PRICING CONFIG TABLE
-- ═════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  costs JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  pricing JSONB DEFAULT '{}',
  reset_time TEXT DEFAULT '04:00',
  free_naira BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed default row
INSERT INTO pricing_config (id, costs, limits, pricing, reset_time, free_naira)
VALUES (1, '{}', '{}', '{}', '04:00', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read, only service_role / authenticated admin can update
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_config_select ON pricing_config;
CREATE POLICY pricing_config_select ON pricing_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS pricing_config_update ON pricing_config;
CREATE POLICY pricing_config_update ON pricing_config
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'service_role');

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_config_timestamp ON pricing_config;
CREATE TRIGGER trg_pricing_config_timestamp
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_config_timestamp();


-- ═════════════════════════════════════════════════════════════
-- 2. DAILY CREDIT RESET (pg_cron)
-- ═════════════════════════════════════════════════════════════

-- Ensure the reset_daily_credits function exists
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  updated INTEGER;
BEGIN
  UPDATE user_stats
  SET ai_credits_used = 0
  WHERE ai_credits_used > 0;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;

-- Grant to service_role (needed for cron)
GRANT EXECUTE ON FUNCTION reset_daily_credits TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job (idempotent — uses named dollar tag to avoid nesting conflict)
DO $cron_block$
BEGIN
  PERFORM cron.schedule(
    'reset-daily-credits',
    '0 0 * * *',
    $cron_body$ SELECT reset_daily_credits(); $cron_body$
  );
EXCEPTION WHEN OTHERS THEN
  BEGIN
    PERFORM cron.unschedule('reset-daily-credits');
    PERFORM cron.schedule(
      'reset-daily-credits',
      '0 0 * * *',
      $cron_body$ SELECT reset_daily_credits(); $cron_body$
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
  END;
END;
$cron_block$;


-- ═════════════════════════════════════════════════════════════
-- 3. PAYMENT SETTINGS — ensure default row exists
-- ═════════════════════════════════════════════════════════════

INSERT INTO payment_settings (paystack_enabled, paystack_mode, stripe_enabled)
VALUES (false, 'test', false)
ON CONFLICT DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 4. VERIFICATION QUERIES (run these to confirm everything is working)
-- ═════════════════════════════════════════════════════════════

-- Check pricing_config exists
SELECT * FROM pricing_config;

-- Check payment_settings
SELECT id, paystack_enabled, paystack_mode FROM payment_settings;

-- Check cron jobs (column names vary by Supabase pg_cron version — use safe columns only)
SELECT jobname, schedule FROM cron.job WHERE jobname = 'reset-daily-credits';

-- Check reset_daily_credits function
SELECT proname, prosrc FROM pg_proc WHERE proname = 'reset_daily_credits';
