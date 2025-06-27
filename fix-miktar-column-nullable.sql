-- Dekontlar tablosundaki miktar kolonunu nullable yapma
-- Tutar alanının opsiyonel olması için gerekli

-- Mevcut constraint'i kontrol et
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'dekontlar' AND column_name = 'miktar';

-- Eğer miktar kolonu NOT NULL ise, NULL'a çevir
ALTER TABLE dekontlar 
ALTER COLUMN miktar DROP NOT NULL;

-- Kontrol et
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'dekontlar' AND column_name = 'miktar'; 