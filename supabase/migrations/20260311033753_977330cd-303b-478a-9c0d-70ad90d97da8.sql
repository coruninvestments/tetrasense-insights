
-- ══════════════════════════════════════════════════════════════════
-- Canonical Chemical Catalog: terpenes + cannabinoids
-- ══════════════════════════════════════════════════════════════════

-- 1. terpenes_canonical
CREATE TABLE public.terpenes_canonical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  short_name text,
  aroma_tags text[] NOT NULL DEFAULT '{}',
  flavor_tags text[] NOT NULL DEFAULT '{}',
  potential_effect_tags text[] NOT NULL DEFAULT '{}',
  chemical_family text,
  boiling_point_c numeric,
  research_summary text,
  evidence_level smallint NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT terpenes_canonical_name_unique UNIQUE (canonical_name),
  CONSTRAINT terpenes_evidence_level_range CHECK (evidence_level BETWEEN 1 AND 5)
);

-- 2. cannabinoids_canonical
CREATE TABLE public.cannabinoids_canonical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  short_name text NOT NULL,
  psychoactive_level text NOT NULL DEFAULT 'none',
  potential_effect_tags text[] NOT NULL DEFAULT '{}',
  medical_interest_tags text[] NOT NULL DEFAULT '{}',
  boiling_point_c numeric,
  research_summary text,
  evidence_level smallint NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cannabinoids_canonical_name_unique UNIQUE (canonical_name),
  CONSTRAINT cannabinoids_short_name_unique UNIQUE (short_name),
  CONSTRAINT cannabinoids_evidence_level_range CHECK (evidence_level BETWEEN 1 AND 5)
);

-- 3. terpene_aliases
CREATE TABLE public.terpene_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terpene_id uuid NOT NULL REFERENCES public.terpenes_canonical(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT terpene_aliases_unique UNIQUE (terpene_id, alias_name)
);

-- 4. cannabinoid_aliases
CREATE TABLE public.cannabinoid_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cannabinoid_id uuid NOT NULL REFERENCES public.cannabinoids_canonical(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cannabinoid_aliases_unique UNIQUE (cannabinoid_id, alias_name)
);

-- updated_at triggers
CREATE TRIGGER set_terpenes_updated_at
  BEFORE UPDATE ON public.terpenes_canonical
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_cannabinoids_updated_at
  BEFORE UPDATE ON public.cannabinoids_canonical
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════
-- RLS: read-only for authenticated, no client writes
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.terpenes_canonical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cannabinoids_canonical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terpene_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cannabinoid_aliases ENABLE ROW LEVEL SECURITY;

-- SELECT policies (authenticated only)
CREATE POLICY "Authenticated can read terpenes"
  ON public.terpenes_canonical FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read cannabinoids"
  ON public.cannabinoids_canonical FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read terpene aliases"
  ON public.terpene_aliases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read cannabinoid aliases"
  ON public.cannabinoid_aliases FOR SELECT TO authenticated
  USING (true);

-- Block all client writes (INSERT/UPDATE/DELETE)
CREATE POLICY "No client inserts on terpenes"
  ON public.terpenes_canonical FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on terpenes"
  ON public.terpenes_canonical FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on terpenes"
  ON public.terpenes_canonical FOR DELETE TO anon, authenticated
  USING (false);

CREATE POLICY "No client inserts on cannabinoids"
  ON public.cannabinoids_canonical FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on cannabinoids"
  ON public.cannabinoids_canonical FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on cannabinoids"
  ON public.cannabinoids_canonical FOR DELETE TO anon, authenticated
  USING (false);

CREATE POLICY "No client inserts on terpene aliases"
  ON public.terpene_aliases FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on terpene aliases"
  ON public.terpene_aliases FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on terpene aliases"
  ON public.terpene_aliases FOR DELETE TO anon, authenticated
  USING (false);

CREATE POLICY "No client inserts on cannabinoid aliases"
  ON public.cannabinoid_aliases FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on cannabinoid aliases"
  ON public.cannabinoid_aliases FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on cannabinoid aliases"
  ON public.cannabinoid_aliases FOR DELETE TO anon, authenticated
  USING (false);
