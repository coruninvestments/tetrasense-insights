
-- 1. Replace anon-accessible public library policy with authenticated-only
DROP POLICY IF EXISTS "Anyone can read verified public library batches" ON public.product_batches;

CREATE POLICY "Authenticated users can read verified public library batches"
  ON public.product_batches
  FOR SELECT
  TO authenticated
  USING (is_public_library = true AND coa_status = 'verified');

-- 2. Prevent created_by_user_id from being changed after insert
CREATE OR REPLACE FUNCTION public.protect_batch_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id THEN
    NEW.created_by_user_id := OLD.created_by_user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_batch_owner
  BEFORE UPDATE ON public.product_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_batch_owner();
