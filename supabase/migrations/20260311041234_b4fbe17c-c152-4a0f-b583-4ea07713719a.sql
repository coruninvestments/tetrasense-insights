
-- ============================================================
-- 1. Extend products table
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS normalized_product_name text,
  ADD COLUMN IF NOT EXISTS normalized_brand_name text,
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'flower',
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'user_submitted',
  ADD COLUMN IF NOT EXISTS state_code text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill normalized names from existing data
UPDATE public.products
SET normalized_product_name = lower(regexp_replace(product_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE normalized_product_name IS NULL;

UPDATE public.products
SET normalized_brand_name = lower(regexp_replace(brand_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE normalized_brand_name IS NULL AND brand_name IS NOT NULL;

-- Backfill product_type from existing form column
UPDATE public.products
SET product_type = COALESCE(form, 'flower')
WHERE product_type = 'flower' AND form IS NOT NULL AND form != 'flower';

-- Add indexes on products
CREATE INDEX IF NOT EXISTS idx_products_normalized_product_name ON public.products (normalized_product_name);
CREATE INDEX IF NOT EXISTS idx_products_normalized_brand_name ON public.products (normalized_brand_name);
CREATE INDEX IF NOT EXISTS idx_products_strain_id ON public.products (strain_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products (product_type);

-- Add updated_at trigger for products
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Extend product_batches table
-- ============================================================
ALTER TABLE public.product_batches
  ADD COLUMN IF NOT EXISTS batch_number text,
  ADD COLUMN IF NOT EXISTS lot_number text,
  ADD COLUMN IF NOT EXISTS coa_source_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS expiration_date date,
  ADD COLUMN IF NOT EXISTS total_thc_percent numeric,
  ADD COLUMN IF NOT EXISTS total_cbd_percent numeric,
  ADD COLUMN IF NOT EXISTS total_terpenes_percent numeric,
  ADD COLUMN IF NOT EXISTS intensity_hint_score smallint,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill verification_status from existing coa_status
UPDATE public.product_batches
SET verification_status = CASE
  WHEN coa_status = 'verified' THEN 'verified'
  WHEN coa_status = 'pending' THEN 'pending'
  WHEN coa_status = 'rejected' THEN 'rejected'
  ELSE 'draft'
END
WHERE verification_status = 'draft' AND coa_status != 'unverified';

-- Backfill batch_number from batch_code
UPDATE public.product_batches
SET batch_number = batch_code
WHERE batch_number IS NULL AND batch_code IS NOT NULL;

-- Add indexes on product_batches
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON public.product_batches (product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_verification_status ON public.product_batches (verification_status);
CREATE INDEX IF NOT EXISTS idx_product_batches_tested_at ON public.product_batches (tested_at);

-- Add updated_at trigger for product_batches
CREATE TRIGGER trg_product_batches_updated_at
  BEFORE UPDATE ON public.product_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Create batch_terpenes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.batch_terpenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.product_batches(id) ON DELETE CASCADE,
  terpene_id uuid NOT NULL REFERENCES public.terpenes_canonical(id),
  percent_value numeric NOT NULL,
  rank_order smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, terpene_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_terpenes_batch_id ON public.batch_terpenes (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_terpenes_terpene_id ON public.batch_terpenes (terpene_id);

ALTER TABLE public.batch_terpenes ENABLE ROW LEVEL SECURITY;

-- Users can read terpenes from verified public batches
CREATE POLICY "Read verified batch terpenes"
  ON public.batch_terpenes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_batches pb
      WHERE pb.id = batch_terpenes.batch_id
        AND pb.verification_status = 'verified'
        AND pb.is_public_library = true
    )
  );

-- Users can read terpenes from their own draft batches
CREATE POLICY "Read own draft batch terpenes"
  ON public.batch_terpenes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_batches pb
      WHERE pb.id = batch_terpenes.batch_id
        AND pb.created_by_user_id = auth.uid()
    )
  );

-- Block all client writes
CREATE POLICY "No client inserts on batch_terpenes"
  ON public.batch_terpenes FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on batch_terpenes"
  ON public.batch_terpenes FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on batch_terpenes"
  ON public.batch_terpenes FOR DELETE TO anon, authenticated
  USING (false);

-- ============================================================
-- 4. Create batch_cannabinoids
-- ============================================================
CREATE TABLE IF NOT EXISTS public.batch_cannabinoids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.product_batches(id) ON DELETE CASCADE,
  cannabinoid_id uuid NOT NULL REFERENCES public.cannabinoids_canonical(id),
  percent_value numeric,
  mg_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, cannabinoid_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_cannabinoids_batch_id ON public.batch_cannabinoids (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_cannabinoids_cannabinoid_id ON public.batch_cannabinoids (cannabinoid_id);

ALTER TABLE public.batch_cannabinoids ENABLE ROW LEVEL SECURITY;

-- Users can read cannabinoids from verified public batches
CREATE POLICY "Read verified batch cannabinoids"
  ON public.batch_cannabinoids FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_batches pb
      WHERE pb.id = batch_cannabinoids.batch_id
        AND pb.verification_status = 'verified'
        AND pb.is_public_library = true
    )
  );

-- Users can read cannabinoids from their own draft batches
CREATE POLICY "Read own draft batch cannabinoids"
  ON public.batch_cannabinoids FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_batches pb
      WHERE pb.id = batch_cannabinoids.batch_id
        AND pb.created_by_user_id = auth.uid()
    )
  );

-- Block all client writes
CREATE POLICY "No client inserts on batch_cannabinoids"
  ON public.batch_cannabinoids FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on batch_cannabinoids"
  ON public.batch_cannabinoids FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes on batch_cannabinoids"
  ON public.batch_cannabinoids FOR DELETE TO anon, authenticated
  USING (false);

-- ============================================================
-- 5. Update products RLS (add is_active filter to read policy)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
CREATE POLICY "Authenticated can read active products"
  ON public.products FOR SELECT TO authenticated
  USING (is_active = true);
