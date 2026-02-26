ALTER TABLE public.session_logs
  ADD COLUMN dose_unit text,
  ADD COLUMN dose_count numeric,
  ADD COLUMN dose_normalized_score numeric;