
-- Function: admin_review_queue - list batches with filters and chemistry counts
CREATE OR REPLACE FUNCTION public.admin_review_queue(
  _status text DEFAULT NULL,
  _lab_name text DEFAULT NULL,
  _has_unmapped boolean DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  product_name text,
  brand_name text,
  strain_name text,
  strain_id uuid,
  lab_name text,
  coa_url text,
  coa_file_path text,
  batch_number text,
  lot_number text,
  coa_source_type text,
  verification_status text,
  coa_status text,
  created_at timestamptz,
  created_by_user_id uuid,
  tested_at date,
  total_thc_percent numeric,
  total_cbd_percent numeric,
  total_terpenes_percent numeric,
  terpene_count bigint,
  cannabinoid_count bigint,
  lab_panel_custom jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
    SELECT
      pb.id, pb.product_id,
      p.product_name, p.brand_name,
      sc.canonical_name AS strain_name,
      p.strain_id,
      pb.lab_name, pb.coa_url, pb.coa_file_path,
      pb.batch_number, pb.lot_number,
      pb.coa_source_type, pb.verification_status, pb.coa_status,
      pb.created_at, pb.created_by_user_id,
      pb.tested_at, pb.total_thc_percent, pb.total_cbd_percent, pb.total_terpenes_percent,
      (SELECT count(*) FROM batch_terpenes bt WHERE bt.batch_id = pb.id) AS terpene_count,
      (SELECT count(*) FROM batch_cannabinoids bc WHERE bc.batch_id = pb.id) AS cannabinoid_count,
      pb.lab_panel_custom
    FROM product_batches pb
    JOIN products p ON p.id = pb.product_id
    LEFT JOIN strains_canonical sc ON sc.id = p.strain_id
    WHERE (_status IS NULL OR pb.verification_status = _status)
      AND (_lab_name IS NULL OR pb.lab_name ILIKE '%' || _lab_name || '%')
    ORDER BY
      CASE pb.verification_status
        WHEN 'pending' THEN 1
        WHEN 'draft' THEN 2
        WHEN 'rejected' THEN 3
        WHEN 'verified' THEN 4
        ELSE 5
      END,
      pb.created_at DESC;
END;
$$;

-- Function: admin_batch_detail - get full batch with terpenes and cannabinoids
CREATE OR REPLACE FUNCTION public.admin_batch_detail(_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'batch', row_to_json(pb),
    'product', row_to_json(p),
    'strain', CASE WHEN sc.id IS NOT NULL THEN row_to_json(sc) ELSE NULL END,
    'terpenes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', bt.id, 'terpene_id', bt.terpene_id,
        'terpene_name', tc.canonical_name,
        'percent_value', bt.percent_value,
        'rank_order', bt.rank_order
      ) ORDER BY bt.rank_order NULLS LAST)
      FROM batch_terpenes bt
      JOIN terpenes_canonical tc ON tc.id = bt.terpene_id
      WHERE bt.batch_id = pb.id
    ), '[]'::jsonb),
    'cannabinoids', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', bc.id, 'cannabinoid_id', bc.cannabinoid_id,
        'cannabinoid_name', cc.canonical_name,
        'percent_value', bc.percent_value,
        'mg_value', bc.mg_value
      ))
      FROM batch_cannabinoids bc
      JOIN cannabinoids_canonical cc ON cc.id = bc.cannabinoid_id
      WHERE bc.batch_id = pb.id
    ), '[]'::jsonb),
    'ingestion', (
      SELECT row_to_json(ci)
      FROM coa_ingestions ci
      WHERE ci.batch_id = pb.id
      ORDER BY ci.created_at DESC
      LIMIT 1
    )
  ) INTO result
  FROM product_batches pb
  JOIN products p ON p.id = pb.product_id
  LEFT JOIN strains_canonical sc ON sc.id = p.strain_id
  WHERE pb.id = _batch_id;

  RETURN result;
END;
$$;

-- Function: admin_set_verification_status
CREATE OR REPLACE FUNCTION public.admin_set_verification_status(
  _batch_id uuid,
  _status text,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _status NOT IN ('verified', 'rejected', 'draft', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: %', _status;
  END IF;

  UPDATE product_batches SET
    verification_status = _status,
    coa_status = CASE
      WHEN _status = 'verified' THEN 'verified'
      WHEN _status = 'rejected' THEN 'rejected'
      ELSE coa_status
    END,
    coa_reject_reason = CASE WHEN _status = 'rejected' THEN _reason ELSE coa_reject_reason END,
    verified_at = CASE WHEN _status = 'verified' THEN now() ELSE verified_at END,
    verified_by = CASE WHEN _status = 'verified' THEN auth.uid() ELSE verified_by END
  WHERE id = _batch_id;
END;
$$;

-- Function: admin_update_product_metadata
CREATE OR REPLACE FUNCTION public.admin_update_product_metadata(
  _product_id uuid,
  _product_name text DEFAULT NULL,
  _brand_name text DEFAULT NULL,
  _strain_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE products SET
    product_name = COALESCE(_product_name, product_name),
    normalized_product_name = COALESCE(lower(trim(_product_name)), normalized_product_name),
    brand_name = COALESCE(_brand_name, brand_name),
    normalized_brand_name = COALESCE(lower(trim(_brand_name)), normalized_brand_name),
    strain_id = COALESCE(_strain_id, strain_id),
    updated_at = now()
  WHERE id = _product_id;
END;
$$;

-- Function: admin_update_batch_metadata
CREATE OR REPLACE FUNCTION public.admin_update_batch_metadata(
  _batch_id uuid,
  _lab_name text DEFAULT NULL,
  _batch_number text DEFAULT NULL,
  _lot_number text DEFAULT NULL,
  _total_thc_percent numeric DEFAULT NULL,
  _total_cbd_percent numeric DEFAULT NULL,
  _total_terpenes_percent numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE product_batches SET
    lab_name = COALESCE(_lab_name, lab_name),
    batch_number = COALESCE(_batch_number, batch_number),
    lot_number = COALESCE(_lot_number, lot_number),
    total_thc_percent = COALESCE(_total_thc_percent, total_thc_percent),
    total_cbd_percent = COALESCE(_total_cbd_percent, total_cbd_percent),
    total_terpenes_percent = COALESCE(_total_terpenes_percent, total_terpenes_percent),
    updated_at = now()
  WHERE id = _batch_id;
END;
$$;

-- Function: admin_remove_batch_compound
CREATE OR REPLACE FUNCTION public.admin_remove_batch_compound(
  _type text,
  _row_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _type = 'terpene' THEN
    DELETE FROM batch_terpenes WHERE id = _row_id;
  ELSIF _type = 'cannabinoid' THEN
    DELETE FROM batch_cannabinoids WHERE id = _row_id;
  ELSE
    RAISE EXCEPTION 'Invalid compound type: %', _type;
  END IF;
END;
$$;

-- Function: admin_review_stats
CREATE OR REPLACE FUNCTION public.admin_review_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'pending', count(*) FILTER (WHERE verification_status = 'pending'),
      'draft', count(*) FILTER (WHERE verification_status = 'draft'),
      'verified', count(*) FILTER (WHERE verification_status = 'verified'),
      'rejected', count(*) FILTER (WHERE verification_status = 'rejected'),
      'total', count(*)
    )
    FROM product_batches
  );
END;
$$;
