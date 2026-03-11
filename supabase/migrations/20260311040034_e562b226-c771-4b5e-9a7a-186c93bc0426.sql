
-- Add new columns to strains_canonical
ALTER TABLE public.strains_canonical
  ADD COLUMN IF NOT EXISTS normalized_name text,
  ADD COLUMN IF NOT EXISTS breeder_name text,
  ADD COLUMN IF NOT EXISTS lineage_summary text,
  ADD COLUMN IF NOT EXISTS parent_1_name text,
  ADD COLUMN IF NOT EXISTS parent_2_name text,
  ADD COLUMN IF NOT EXISTS source_notes text,
  ADD COLUMN IF NOT EXISTS confidence_level smallint NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS verified_batch_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill normalized_name from existing canonical_name
UPDATE public.strains_canonical
SET normalized_name = lower(regexp_replace(canonical_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE normalized_name IS NULL;

-- Make normalized_name NOT NULL and unique
ALTER TABLE public.strains_canonical
  ALTER COLUMN normalized_name SET NOT NULL;
ALTER TABLE public.strains_canonical
  ADD CONSTRAINT strains_canonical_normalized_name_key UNIQUE (normalized_name);

-- Add confidence_level validation trigger
CREATE OR REPLACE FUNCTION public.validate_strain_confidence()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.confidence_level < 1 OR NEW.confidence_level > 5 THEN
    RAISE EXCEPTION 'confidence_level must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_strain_confidence
  BEFORE INSERT OR UPDATE ON public.strains_canonical
  FOR EACH ROW EXECUTE FUNCTION public.validate_strain_confidence();

-- Add updated_at trigger
CREATE TRIGGER trg_strains_canonical_updated_at
  BEFORE UPDATE ON public.strains_canonical
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to strain_aliases_canonical
ALTER TABLE public.strain_aliases_canonical
  ADD COLUMN IF NOT EXISTS normalized_alias text,
  ADD COLUMN IF NOT EXISTS alias_type text;

-- Backfill normalized_alias
UPDATE public.strain_aliases_canonical
SET normalized_alias = lower(regexp_replace(alias_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE normalized_alias IS NULL;

ALTER TABLE public.strain_aliases_canonical
  ALTER COLUMN normalized_alias SET NOT NULL;
ALTER TABLE public.strain_aliases_canonical
  ADD CONSTRAINT strain_aliases_canonical_normalized_alias_key UNIQUE (normalized_alias);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_strains_canonical_normalized_name ON public.strains_canonical (normalized_name);
CREATE INDEX IF NOT EXISTS idx_strains_canonical_confidence ON public.strains_canonical (confidence_level);
CREATE INDEX IF NOT EXISTS idx_strain_aliases_canonical_normalized ON public.strain_aliases_canonical (normalized_alias);
CREATE INDEX IF NOT EXISTS idx_strains_canonical_strain_type ON public.strains_canonical (strain_type);

-- RLS: ensure authenticated can read (already exists), block writes (already blocked)
-- Add is_active-aware RLS for reads
DROP POLICY IF EXISTS "Anyone can read canonical strains" ON public.strains_canonical;
CREATE POLICY "Authenticated can read active canonical strains"
  ON public.strains_canonical FOR SELECT TO authenticated
  USING (is_active = true);

-- Block client writes explicitly
CREATE POLICY "No client inserts on strains_canonical"
  ON public.strains_canonical FOR INSERT TO anon, authenticated
  WITH CHECK (false);
CREATE POLICY "No client updates on strains_canonical"
  ON public.strains_canonical FOR UPDATE TO anon, authenticated
  USING (false);
CREATE POLICY "No client deletes on strains_canonical"
  ON public.strains_canonical FOR DELETE TO anon, authenticated
  USING (false);

-- Block client writes on aliases (if not already)
CREATE POLICY "No client inserts on strain_aliases_canonical"
  ON public.strain_aliases_canonical FOR INSERT TO anon, authenticated
  WITH CHECK (false);
CREATE POLICY "No client updates on strain_aliases_canonical"
  ON public.strain_aliases_canonical FOR UPDATE TO anon, authenticated
  USING (false);
CREATE POLICY "No client deletes on strain_aliases_canonical"
  ON public.strain_aliases_canonical FOR DELETE TO anon, authenticated
  USING (false);

-- Update alias read policy to authenticated only
DROP POLICY IF EXISTS "Anyone can read canonical aliases" ON public.strain_aliases_canonical;
CREATE POLICY "Authenticated can read canonical aliases"
  ON public.strain_aliases_canonical FOR SELECT TO authenticated
  USING (true);
