
ALTER TABLE public.profiles
  ADD COLUMN active_batch_id uuid REFERENCES public.product_batches(id) ON DELETE SET NULL,
  ADD COLUMN active_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN active_strain_id uuid REFERENCES public.strains_canonical(id) ON DELETE SET NULL;
