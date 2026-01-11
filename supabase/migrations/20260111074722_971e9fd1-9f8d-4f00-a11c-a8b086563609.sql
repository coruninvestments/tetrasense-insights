-- Create enums for intent and method
CREATE TYPE public.session_intent AS ENUM ('sleep', 'relaxation', 'creativity', 'focus', 'pain_relief', 'social', 'recreation');
CREATE TYPE public.session_method AS ENUM ('smoke', 'vape', 'edible', 'tincture', 'topical', 'other');
CREATE TYPE public.dose_level AS ENUM ('low', 'medium', 'high');

-- Add new columns to session_logs
ALTER TABLE public.session_logs 
  ADD COLUMN local_time text,
  ADD COLUMN strain_id uuid REFERENCES public.strains(id) ON DELETE SET NULL,
  ADD COLUMN dose_level public.dose_level DEFAULT 'medium',
  ADD COLUMN dose_amount_mg numeric,
  ADD COLUMN effect_sleepiness smallint DEFAULT 0 CHECK (effect_sleepiness >= 0 AND effect_sleepiness <= 10),
  ADD COLUMN effect_relaxation smallint DEFAULT 0 CHECK (effect_relaxation >= 0 AND effect_relaxation <= 10),
  ADD COLUMN effect_anxiety smallint DEFAULT 0 CHECK (effect_anxiety >= 0 AND effect_anxiety <= 10),
  ADD COLUMN effect_focus smallint DEFAULT 0 CHECK (effect_focus >= 0 AND effect_focus <= 10),
  ADD COLUMN effect_pain_relief smallint DEFAULT 0 CHECK (effect_pain_relief >= 0 AND effect_pain_relief <= 10),
  ADD COLUMN effect_euphoria smallint DEFAULT 0 CHECK (effect_euphoria >= 0 AND effect_euphoria <= 10);

-- Rename strain_name to strain_name_text for clarity
ALTER TABLE public.session_logs RENAME COLUMN strain_name TO strain_name_text;