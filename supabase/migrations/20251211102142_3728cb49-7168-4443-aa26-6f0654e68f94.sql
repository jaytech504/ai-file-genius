-- Create storage bucket for temporary audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-audio', 'temp-audio', true);

-- Allow anyone to upload files to temp-audio bucket
CREATE POLICY "Allow public uploads to temp-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'temp-audio');

-- Allow anyone to read files from temp-audio bucket
CREATE POLICY "Allow public reads from temp-audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'temp-audio');

-- Allow anyone to delete their uploads from temp-audio bucket
CREATE POLICY "Allow public deletes from temp-audio"
ON storage.objects
FOR DELETE
USING (bucket_id = 'temp-audio');