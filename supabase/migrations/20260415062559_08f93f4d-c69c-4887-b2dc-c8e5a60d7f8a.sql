CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);