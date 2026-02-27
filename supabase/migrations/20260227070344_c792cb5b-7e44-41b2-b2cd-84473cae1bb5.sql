
-- Tighten public batch visibility: only verified + public batches visible to everyone
DROP POLICY "Anyone can read public library batches" ON public.product_batches;

CREATE POLICY "Anyone can read verified public library batches"
  ON public.product_batches FOR SELECT
  USING (is_public_library = true AND coa_status = 'verified');
