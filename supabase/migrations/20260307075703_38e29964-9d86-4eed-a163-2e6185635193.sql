
ALTER TABLE public.session_logs
  ADD COLUMN IF NOT EXISTS aroma_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flavor_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inhale_quality text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aftertaste text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sensory_enjoyment smallint DEFAULT NULL;
