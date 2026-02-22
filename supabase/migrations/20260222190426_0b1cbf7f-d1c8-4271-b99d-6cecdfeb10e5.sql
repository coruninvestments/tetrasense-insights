ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_age_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disclaimer_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS disclaimer_version text,
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamptz;