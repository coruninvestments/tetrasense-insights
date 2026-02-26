ALTER TABLE public.session_logs
  ADD COLUMN time_of_day text,
  ADD COLUMN setting text,
  ADD COLUMN stomach text,
  ADD COLUMN caffeine boolean NOT NULL DEFAULT false,
  ADD COLUMN hydration text,
  ADD COLUMN sleep_quality text,
  ADD COLUMN mood_before text,
  ADD COLUMN stress_before text;