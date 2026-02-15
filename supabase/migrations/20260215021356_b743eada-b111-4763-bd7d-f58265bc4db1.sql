
ALTER TABLE public.session_logs
  ADD COLUMN IF NOT EXISTS intent_match_score smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS comfort_score smallint DEFAULT NULL;
