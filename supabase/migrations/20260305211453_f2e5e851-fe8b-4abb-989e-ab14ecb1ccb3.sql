
CREATE OR REPLACE FUNCTION public.refresh_community_strain_stats()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_count integer;
BEGIN
  -- Admin guard: only admins can trigger a full stats rebuild
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Clear existing stats
  DELETE FROM public.community_strain_stats;

  -- Rebuild from opted-in users' canonical sessions
  INSERT INTO public.community_strain_stats (
    strain_id, strain_name, strain_type, intent,
    top_effects,
    outcome_positive_pct, outcome_neutral_pct, outcome_avoid_pct,
    sample_size, last_updated
  )
  SELECT
    sl.canonical_strain_id,
    sc.canonical_name,
    COALESCE(sc.strain_type, 'hybrid'),
    sl.intent,
    (
      SELECT array_agg(eff ORDER BY avg_val DESC)
      FROM (
        SELECT unnest(ARRAY['sleepiness','relaxation','focus','pain_relief','euphoria','anxiety']) AS eff,
               unnest(ARRAY[
                 AVG(sl2.effect_sleepiness),
                 AVG(sl2.effect_relaxation),
                 AVG(sl2.effect_focus),
                 AVG(sl2.effect_pain_relief),
                 AVG(sl2.effect_euphoria),
                 AVG(sl2.effect_anxiety)
               ]) AS avg_val
        FROM session_logs sl2
        INNER JOIN profiles p2 ON p2.user_id = sl2.user_id AND p2.community_sharing_enabled = true
        WHERE sl2.canonical_strain_id = sl.canonical_strain_id
          AND sl2.intent = sl.intent
      ) ranked
      LIMIT 3
    ),
    ROUND(100.0 * COUNT(*) FILTER (WHERE sl.outcome = 'positive') / NULLIF(COUNT(*), 0), 1),
    ROUND(100.0 * COUNT(*) FILTER (WHERE sl.outcome = 'neutral') / NULLIF(COUNT(*), 0), 1),
    ROUND(100.0 * COUNT(*) FILTER (WHERE sl.outcome = 'negative') / NULLIF(COUNT(*), 0), 1),
    COUNT(*)::integer,
    now()
  FROM session_logs sl
  INNER JOIN profiles p ON p.user_id = sl.user_id AND p.community_sharing_enabled = true
  INNER JOIN strains_canonical sc ON sc.id = sl.canonical_strain_id
  WHERE sl.canonical_strain_id IS NOT NULL
  GROUP BY sl.canonical_strain_id, sc.canonical_name, sc.strain_type, sl.intent
  HAVING COUNT(*) >= 1;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN row_count;
END;
$$;
