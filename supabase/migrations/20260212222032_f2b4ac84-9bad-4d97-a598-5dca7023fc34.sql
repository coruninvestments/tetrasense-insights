
-- Add new nullable columns for enhanced session logging
ALTER TABLE public.session_logs
  ADD COLUMN IF NOT EXISTS effect_dry_mouth smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effect_dry_eyes smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effect_throat_irritation smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effect_body_heaviness smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effect_duration_bucket text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS effect_body_mind smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outcome_preference text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_effects jsonb DEFAULT NULL;
