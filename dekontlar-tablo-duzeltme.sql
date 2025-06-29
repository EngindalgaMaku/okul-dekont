-- Dekontlar tablosunun tüm eksik kolonlarını düzeltme
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

-- 1. Önce mevcut tablo yapısını kontrol edelim
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dekontlar'
ORDER BY ordinal_position;

-- 2. Eksik kolonları ekle
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS isletme_id bigint;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS ogretmen_id bigint;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS dosya_url TEXT;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS ay TEXT;

-- 3. Foreign key kısıtlamalarını ekle (PostgreSQL uyumlu)
DO $$
BEGIN
    -- isletme_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dekontlar_isletme' 
        AND table_name = 'dekontlar'
    ) THEN
        ALTER TABLE dekontlar 
        ADD CONSTRAINT fk_dekontlar_isletme 
        FOREIGN KEY (isletme_id) REFERENCES isletmeler(id);
    END IF;

    -- ogretmen_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dekontlar_ogretmen' 
        AND table_name = 'dekontlar'
    ) THEN
        ALTER TABLE dekontlar 
        ADD CONSTRAINT fk_dekontlar_ogretmen 
        FOREIGN KEY (ogretmen_id) REFERENCES ogretmenler(id);
    END IF;
END
$$;

-- 4. Mevcut staj kayıtlarından isletme_id ve ogretmen_id'leri güncelle
UPDATE dekontlar 
SET isletme_id = s.isletme_id, 
    ogretmen_id = s.ogretmen_id
FROM stajlar s 
WHERE dekontlar.staj_id = s.id 
AND dekontlar.isletme_id IS NULL;

-- 5. Storage bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('belgeler', 'belgeler', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- 6. Storage için RLS politikaları
DO $$
BEGIN
    -- Public read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow public read access' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow public read access" ON storage.objects
        FOR SELECT USING (bucket_id = 'belgeler');
    END IF;

    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow authenticated users to upload' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'belgeler');
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow users to update their own files' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow users to update their own files" ON storage.objects
        FOR UPDATE USING (bucket_id = 'belgeler');
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow users to delete their own files' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow users to delete their own files" ON storage.objects
        FOR DELETE USING (bucket_id = 'belgeler');
    END IF;
END
$$;

-- 7. Son kontrol - güncellenmiş tablo yapısı
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dekontlar'
ORDER BY ordinal_position; 