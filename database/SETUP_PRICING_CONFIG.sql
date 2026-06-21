-- =============================================================
-- LUTER PRICING CONFIG SETUP
-- Run this in your Supabase SQL editor to create/sync pricing config
-- =============================================================

-- 1. Create pricing_config table if not exists
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

-- 2. Seed default values including the new 2000 credits limit for Pro plan
INSERT INTO pricing_config (id, costs, limits, pricing, reset_time, free_naira)
VALUES (
  1,
  '{
    "UPLOAD_AUDIO": 20,
    "OPEN_MATERIAL": 50,
    "GENERATE_SUMMARY": 5,
    "GENERATE_FLASHCARDS": 10,
    "GENERATE_QUIZ": 10,
    "GENERATE_AI_NOTES": 80,
    "AI_CHAT": 20,
    "EXPLAIN_TEXT": 10,
    "START_MOCK_EXAM": 15,
    "MOCK_TUTOR": 20,
    "MOCK_WEAKNESS": 10,
    "NOTES_AI_CHAT": 20,
    "BATTLE_QUESTIONS": 10,
    "BATTLE_HINT": 5,
    "BATTLE_PERFORMANCE": 30,
    "GROUP_QUIZ": 30,
    "PLAYGROUND_QUESTIONS": 10,
    "VOICE_AGENT": 5,
    "WRITE_AI_ASSIST": 5,
    "IMAGE_OCR": 0,
    "AUDIO_PER_MIN": 20
  }'::jsonb,
  '{
    "free": 200,
    "pro": 2000,
    "beast": null
  }'::jsonb,
  '{
    "proMonthly": 7,
    "beastMonthly": 15,
    "proYearly": 65,
    "beastYearly": 140
  }'::jsonb,
  '04:00',
  false
)
ON CONFLICT (id) DO UPDATE
SET 
  costs = EXCLUDED.costs,
  limits = EXCLUDED.limits,
  pricing = EXCLUDED.pricing;

-- 3. Enable RLS (Row Level Security)
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- 4. Anyone can SELECT (read) the pricing configuration
DROP POLICY IF EXISTS pricing_config_select ON pricing_config;
CREATE POLICY pricing_config_select ON pricing_config
  FOR SELECT USING (true);

-- 5. Only users with role = 'admin' (or using service_role) can UPDATE/INSERT configuration
DROP POLICY IF EXISTS pricing_config_update ON pricing_config;
CREATE POLICY pricing_config_update ON pricing_config
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Trigger to auto-update timestamp
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

-- 7. Grant access to authenticated users
GRANT SELECT, UPDATE ON pricing_config TO authenticated;
