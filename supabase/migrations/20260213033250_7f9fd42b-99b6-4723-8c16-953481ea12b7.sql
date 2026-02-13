
-- Create private storage bucket for COA files
INSERT INTO storage.buckets (id, name, public)
VALUES ('coa-files', 'coa-files', false);

-- Users can upload into their own folder: {user_id}/...
CREATE POLICY "Users can upload own COA files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coa-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read only their own files
CREATE POLICY "Users can read own COA files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'coa-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update own COA files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coa-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete own COA files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'coa-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
