-- Dekontlar tablosunu test et ve tüm kolonları göster

-- 1. Dekontlar tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dekontlar'
ORDER BY ordinal_position;

-- 2. Mevcut dekont verilerini kontrol et
SELECT * FROM dekontlar LIMIT 3;

-- 3. Dosya kolunu bul (olası isimler)
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'dekontlar' 
AND (column_name LIKE '%dosya%' OR column_name LIKE '%file%' OR column_name LIKE '%document%');

-- 4. Stajlar tablosunun yapısını da kontrol et
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'stajlar'
ORDER BY ordinal_position; 