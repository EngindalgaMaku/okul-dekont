-- Supabase Storage bucket'larını oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('dekontlar', 'dekontlar', true),
  ('belgeler', 'belgeler', true)
ON CONFLICT (id) DO NOTHING;

-- Dekontlar bucket için policy'ler
CREATE POLICY "Anyone can view dekontlar" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'dekontlar');

CREATE POLICY "Anyone can upload dekontlar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'dekontlar');

CREATE POLICY "Anyone can update dekontlar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'dekontlar');

CREATE POLICY "Anyone can delete dekontlar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'dekontlar');

-- Belgeler bucket için policy'ler
CREATE POLICY "Anyone can view belgeler" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'belgeler');

CREATE POLICY "Anyone can upload belgeler" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'belgeler');

CREATE POLICY "Anyone can update belgeler" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'belgeler');

CREATE POLICY "Anyone can delete belgeler" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'belgeler');

-- Storage objelerine RLS etkinleştir (eğer değilse)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Bucket'ların varlığını kontrol et
SELECT id, name, public FROM storage.buckets WHERE id IN ('dekontlar', 'belgeler'); 