
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guide_mode_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dismissed_tip_ids text[] NOT NULL DEFAULT '{}';
