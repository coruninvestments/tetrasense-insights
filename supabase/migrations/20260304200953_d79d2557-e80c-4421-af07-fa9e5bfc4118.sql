-- Explicit denial policies for products table (writes handled by edge function via service_role)
CREATE POLICY "Client inserts to products are forbidden"
  ON public.products FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Client updates to products are forbidden"
  ON public.products FOR UPDATE TO authenticated, anon
  USING (false);

CREATE POLICY "Client deletes to products are forbidden"
  ON public.products FOR DELETE TO authenticated, anon
  USING (false);