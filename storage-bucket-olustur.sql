-- STORAGE BUCKET OLUŞTUR
-- Supabase SQL Editor'de çalıştırın

-- 1. Bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('belgeler', 'belgeler', true, 10485760, 
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS politikalarını ekle
CREATE POLICY "Herkes okuyabilir" ON storage.objects
FOR SELECT USING (bucket_id = 'belgeler');

CREATE POLICY "Herkes yükleyebilir" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'belgeler');

-- 3. Kontrol et
SELECT * FROM storage.buckets WHERE id = 'belgeler'; 