-- Create a view for strain community statistics (aggregated and anonymous)
CREATE OR REPLACE VIEW public.strain_community_stats AS
SELECT 
  strain_id,
  COUNT(*)::integer AS total_sessions,
  ROUND(AVG(effect_sleepiness)::numeric, 1) AS avg_sleepiness,
  ROUND(AVG(effect_relaxation)::numeric, 1) AS avg_relaxation,
  ROUND(AVG(effect_anxiety)::numeric, 1) AS avg_anxiety,
  ROUND(AVG(effect_focus)::numeric, 1) AS avg_focus,
  ROUND(AVG(effect_pain_relief)::numeric, 1) AS avg_pain_relief,
  ROUND(AVG(effect_euphoria)::numeric, 1) AS avg_euphoria,
  ROUND(
    (COUNT(*) FILTER (
      WHERE (effect_relaxation >= 6 OR effect_sleepiness >= 6 OR effect_focus >= 6 OR effect_pain_relief >= 6)
      AND effect_anxiety <= 5
    )::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 
    1
  ) AS percent_positive_outcome
FROM public.session_logs
WHERE strain_id IS NOT NULL
GROUP BY strain_id;

-- Grant access to the view
GRANT SELECT ON public.strain_community_stats TO anon, authenticated;