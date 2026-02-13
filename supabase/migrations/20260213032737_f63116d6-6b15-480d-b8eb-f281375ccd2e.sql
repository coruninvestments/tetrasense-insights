
-- COA ingestion pipeline table
CREATE TABLE public.coa_ingestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.product_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('url', 'file')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'parsed', 'failed')),
  raw_text TEXT,
  extracted_json JSONB,
  parser_version TEXT NOT NULL DEFAULT 'stub-v0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coa_ingestions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ingestions
CREATE POLICY "Users can view own ingestions"
  ON public.coa_ingestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingestions"
  ON public.coa_ingestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingestions"
  ON public.coa_ingestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingestions"
  ON public.coa_ingestions FOR DELETE
  USING (auth.uid() = user_id);
