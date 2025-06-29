-- BASİT DEKONTLAR TABLOSU DÜZELTMESİ
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. Mevcut dekontlar tablosunu kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dekontlar' 
ORDER BY ordinal_position;

-- 2. Eksik kolonları basitçe ekle
ALTER TABLE dekontlar ADD COLUMN isletme_id bigint;
ALTER TABLE dekontlar ADD COLUMN ogretmen_id bigint;
ALTER TABLE dekontlar ADD COLUMN dosya_url TEXT;
ALTER TABLE dekontlar ADD COLUMN ay TEXT;

-- 3. Mevcut staj verilerinden isletme_id ve ogretmen_id güncelle
UPDATE dekontlar 
SET isletme_id = stajlar.isletme_id, 
    ogretmen_id = stajlar.ogretmen_id
FROM stajlar 
WHERE dekontlar.staj_id = stajlar.id;

-- 4. Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public) 
VALUES ('belgeler', 'belgeler', true) 
ON CONFLICT (id) DO NOTHING;

-- 5. Kontrol et - kolonlar eklenmiş mi?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dekontlar' 
ORDER BY ordinal_position; 