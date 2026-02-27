
-- 1. Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role function (must exist before policy references it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policy on user_roles (now has_role exists)
CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. coa_reject_reason column
ALTER TABLE public.product_batches
  ADD COLUMN coa_reject_reason text;

-- 6. is_admin() convenience function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- 7. Admin RPC: list pending batches
CREATE OR REPLACE FUNCTION public.admin_pending_batches()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  batch_code text,
  tested_at date,
  lab_name text,
  coa_url text,
  coa_file_path text,
  coa_status text,
  coa_reject_reason text,
  lab_panel_common jsonb,
  lab_panel_custom jsonb,
  is_public_library boolean,
  created_at timestamptz,
  created_by_user_id uuid,
  product_name text,
  brand_name text,
  strain_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT pb.id, pb.product_id, pb.batch_code, pb.tested_at, pb.lab_name,
           pb.coa_url, pb.coa_file_path, pb.coa_status, pb.coa_reject_reason,
           pb.lab_panel_common, pb.lab_panel_custom, pb.is_public_library,
           pb.created_at, pb.created_by_user_id,
           p.product_name, p.brand_name,
           sc.canonical_name AS strain_name
    FROM public.product_batches pb
    JOIN public.products p ON p.id = pb.product_id
    LEFT JOIN public.strains_canonical sc ON sc.id = p.strain_id
    WHERE pb.coa_status = 'pending'
    ORDER BY pb.created_at ASC;
END;
$$;

-- 8. Admin RPC: approve
CREATE OR REPLACE FUNCTION public.admin_approve_batch(_batch_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.product_batches SET coa_status = 'verified', coa_reject_reason = NULL WHERE id = _batch_id;
END;
$$;

-- 9. Admin RPC: reject
CREATE OR REPLACE FUNCTION public.admin_reject_batch(_batch_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.product_batches SET coa_status = 'rejected', coa_reject_reason = _reason WHERE id = _batch_id;
END;
$$;

-- 10. Admin RPC: update lab panel
CREATE OR REPLACE FUNCTION public.admin_update_lab_panel(_batch_id uuid, _lab_panel_common jsonb, _lab_panel_custom jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.product_batches SET lab_panel_common = _lab_panel_common, lab_panel_custom = _lab_panel_custom WHERE id = _batch_id;
END;
$$;
