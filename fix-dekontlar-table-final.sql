-- Dekontlar tablosu için tüm sorunları çöz
-- Miktar kolonunu nullable yap ve onay_durumu constraint'ini kontrol et

-- 1. Mevcut tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dekontlar'
ORDER BY ordinal_position;

-- 2. Mevcut constraint'leri kontrol et
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%dekontlar%';

-- 3. Miktar kolonunu nullable yap (eğer NOT NULL ise)
ALTER TABLE dekontlar ALTER COLUMN miktar DROP NOT NULL;

-- 4. Onay durumu constraint'ini kontrol et ve gerekiyorsa yeniden oluştur
-- Önce mevcut constraint'i kaldır (varsa)
ALTER TABLE dekontlar DROP CONSTRAINT IF EXISTS dekontlar_onay_durumu_check;

-- Yeni constraint ekle
ALTER TABLE dekontlar ADD CONSTRAINT dekontlar_onay_durumu_check 
CHECK (onay_durumu IN ('bekliyor', 'onaylandi', 'reddedildi', 'beklemede'));

-- 5. Stajlar tablosunun yapısını kontrol et
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'stajlar'
ORDER BY ordinal_position;

-- 6. Son kontrol - tablo yapısı
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dekontlar' 
AND column_name IN ('miktar', 'onay_durumu'); 