-- Modify strains table to use min/max THC/CBD and add pending status
ALTER TABLE public.strains 
ADD COLUMN IF NOT EXISTS thc_min numeric,
ADD COLUMN IF NOT EXISTS thc_max numeric,
ADD COLUMN IF NOT EXISTS cbd_min numeric,
ADD COLUMN IF NOT EXISTS cbd_max numeric,
ADD COLUMN IF NOT EXISTS is_pending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);

-- Migrate existing thc_range data to thc_min/thc_max
UPDATE public.strains 
SET thc_min = NULLIF(regexp_replace(thc_range, '[^0-9.].*', ''), '')::numeric,
    thc_max = NULLIF(regexp_replace(thc_range, '.*-([0-9.]+)%?', '\1'), '')::numeric
WHERE thc_range IS NOT NULL;

UPDATE public.strains 
SET cbd_min = NULLIF(regexp_replace(cbd_range, '[^0-9.].*', ''), '')::numeric,
    cbd_max = NULLIF(regexp_replace(cbd_range, '.*-([0-9.]+)%?', '\1'), '')::numeric
WHERE cbd_range IS NOT NULL;

-- Create strain_aliases table
CREATE TABLE public.strain_aliases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strain_id uuid NOT NULL REFERENCES public.strains(id) ON DELETE CASCADE,
    alias_name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(strain_id, alias_name)
);

-- Enable RLS on strain_aliases
ALTER TABLE public.strain_aliases ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved strain aliases
CREATE POLICY "Anyone can view strain aliases" 
ON public.strain_aliases 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.strains 
        WHERE strains.id = strain_aliases.strain_id 
        AND strains.is_pending = false
    )
);

-- Update strains RLS to show only approved strains publicly
DROP POLICY IF EXISTS "Anyone can view strains" ON public.strains;

CREATE POLICY "Anyone can view approved strains" 
ON public.strains 
FOR SELECT 
USING (is_pending = false OR submitted_by = auth.uid());

-- Allow authenticated users to insert pending strains
CREATE POLICY "Users can submit pending strains" 
ON public.strains 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_pending = true AND submitted_by = auth.uid());

-- Create index for faster alias searches
CREATE INDEX idx_strain_aliases_name ON public.strain_aliases USING gin(to_tsvector('english', alias_name));
CREATE INDEX idx_strains_name ON public.strains USING gin(to_tsvector('english', name));
CREATE INDEX idx_strains_pending ON public.strains(is_pending);