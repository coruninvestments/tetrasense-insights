
-- 1. strains_canonical
CREATE TABLE public.strains_canonical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL UNIQUE,
  strain_type text,
  description text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_strains_canonical_name ON public.strains_canonical (canonical_name);

ALTER TABLE public.strains_canonical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read canonical strains"
  ON public.strains_canonical FOR SELECT USING (true);

-- 2. strain_aliases_canonical (separate from legacy strain_aliases)
CREATE TABLE public.strain_aliases_canonical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_id uuid NOT NULL REFERENCES public.strains_canonical(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  source text NOT NULL DEFAULT 'user',
  confidence int NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_strain_aliases_canonical_alias ON public.strain_aliases_canonical (alias_name);
CREATE INDEX idx_strain_aliases_canonical_strain ON public.strain_aliases_canonical (strain_id);

ALTER TABLE public.strain_aliases_canonical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read canonical aliases"
  ON public.strain_aliases_canonical FOR SELECT USING (true);

-- 3. products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_id uuid REFERENCES public.strains_canonical(id) ON DELETE SET NULL,
  brand_name text,
  product_name text NOT NULL,
  form text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_strain ON public.products (strain_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products"
  ON public.products FOR SELECT USING (true);

-- 4. product_batches
CREATE TABLE public.product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_code text,
  tested_at date,
  lab_name text,
  coa_url text,
  coa_file_path text,
  coa_status text NOT NULL DEFAULT 'unverified',
  lab_panel_common jsonb,
  lab_panel_custom jsonb,
  created_by_user_id uuid,
  is_public_library boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_batches_product ON public.product_batches (product_id);
CREATE INDEX idx_product_batches_batch_code ON public.product_batches (batch_code);

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

-- Public library batches readable by everyone
CREATE POLICY "Anyone can read public library batches"
  ON public.product_batches FOR SELECT
  USING (is_public_library = true);

-- Users can read their own draft batches
CREATE POLICY "Users can read own draft batches"
  ON public.product_batches FOR SELECT
  USING (created_by_user_id = auth.uid() AND is_public_library = false);

-- Users can insert private draft batches only
CREATE POLICY "Users can insert own draft batches"
  ON public.product_batches FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by_user_id = auth.uid()
    AND is_public_library = false
  );

-- Users can update their own drafts
CREATE POLICY "Users can update own draft batches"
  ON public.product_batches FOR UPDATE
  USING (created_by_user_id = auth.uid() AND is_public_library = false);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own draft batches"
  ON public.product_batches FOR DELETE
  USING (created_by_user_id = auth.uid() AND is_public_library = false);

-- 5. Update session_logs with new FK columns
ALTER TABLE public.session_logs
  ADD COLUMN canonical_strain_id uuid REFERENCES public.strains_canonical(id) ON DELETE SET NULL,
  ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN batch_id uuid REFERENCES public.product_batches(id) ON DELETE SET NULL,
  ADD COLUMN coa_attached boolean NOT NULL DEFAULT false;
