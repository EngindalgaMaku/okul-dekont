-- Dekontlar tablosunun yapısını kontrol et
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

-- Dekontlar tablosundaki tüm kolonları listele
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dekontlar' 
ORDER BY ordinal_position;

-- Dekontlar tablosundaki örnek veriyi de göster (ilk 5 kayıt)
SELECT * FROM dekontlar LIMIT 5; 