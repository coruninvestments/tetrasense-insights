-- Fix: Add security_invoker to ensure RLS is respected on underlying session_logs table
-- This ensures the view runs with the permissions of the querying user, not the view creator

DROP VIEW IF EXISTS public.strain_community_stats;

CREATE VIEW public.strain_community_stats
WITH (security_invoker = on) AS
SELECT 
  strain_id,
  count(*)::integer AS total_sessions,
  -- Only expose aggregated averages when we have enough sessions for privacy
  -- Below threshold, return NULL to prevent inference from small samples
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_sleepiness), 1)
    ELSE NULL
  END AS avg_sleepiness,
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_relaxation), 1)
    ELSE NULL
  END AS avg_relaxation,
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_anxiety), 1)
    ELSE NULL
  END AS avg_anxiety,
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_focus), 1)
    ELSE NULL
  END AS avg_focus,
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_pain_relief), 1)
    ELSE NULL
  END AS avg_pain_relief,
  CASE 
    WHEN count(*) >= 10 THEN round(avg(effect_euphoria), 1)
    ELSE NULL
  END AS avg_euphoria,
  -- Positive outcome percentage only shown with sufficient sample size
  CASE 
    WHEN count(*) >= 10 THEN round(
      count(*) FILTER (
        WHERE (effect_relaxation >= 6 OR effect_sleepiness >= 6 OR effect_focus >= 6 OR effect_pain_relief >= 6)
        AND effect_anxiety <= 5
      )::numeric / NULLIF(count(*), 0)::numeric * 100, 
      1
    )
    ELSE NULL
  END AS percent_positive_outcome
FROM public.session_logs
WHERE strain_id IS NOT NULL
GROUP BY strain_id;

-- Add comment explaining privacy considerations
COMMENT ON VIEW public.strain_community_stats IS 
'Privacy-safe aggregated community statistics for strains. 
Averages and percentages are only exposed when total_sessions >= 10 
to prevent individual user identification from small sample sizes.
Uses security_invoker to respect RLS on session_logs.';