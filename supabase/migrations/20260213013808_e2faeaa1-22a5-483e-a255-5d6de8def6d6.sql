
-- Aggregated community strain stats (library strains only, no PII)
CREATE TABLE public.community_strain_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_id uuid NOT NULL REFERENCES public.strains(id) ON DELETE CASCADE,
  strain_name text NOT NULL,
  strain_type text NOT NULL,
  intent text NOT NULL,
  top_effects text[] NOT NULL DEFAULT '{}',
  outcome_positive_pct numeric,
  outcome_neutral_pct numeric,
  outcome_avoid_pct numeric,
  sample_size integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (strain_id, intent)
);

-- Enable RLS
ALTER TABLE public.community_strain_stats ENABLE ROW LEVEL SECURITY;

-- Public read access (no PII in this table)
CREATE POLICY "Anyone can read community strain stats"
  ON public.community_strain_stats
  FOR SELECT
  USING (true);

-- Block all writes from clients
-- (Only server/cron will populate via service role key)
