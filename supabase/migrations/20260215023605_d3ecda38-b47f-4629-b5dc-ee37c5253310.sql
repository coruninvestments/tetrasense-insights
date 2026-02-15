
-- Add onboarding and calibration columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_anchors jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quick_log_enabled boolean NOT NULL DEFAULT true;
