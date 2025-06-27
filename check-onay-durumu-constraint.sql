-- Dekontlar tablosundaki onay_durumu constraint'ini kontrol et
-- Hangi değerlerin kabul edildiğini öğrenmek için

-- Check constraint'leri göster
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%onay_durumu%';

-- Constraint detaylarını göster
SELECT 
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'dekontlar' 
    AND tc.constraint_type = 'CHECK';

-- Mevcut dekontlardaki onay_durumu değerlerini kontrol et
SELECT DISTINCT onay_durumu 
FROM dekontlar 
WHERE onay_durumu IS NOT NULL;

-- Eğer constraint kaldırılması gerekiyorsa:
/*
ALTER TABLE dekontlar 
DROP CONSTRAINT dekontlar_onay_durumu_check;

-- Yeni constraint ekle (gerekiyorsa)
ALTER TABLE dekontlar 
ADD CONSTRAINT dekontlar_onay_durumu_check 
CHECK (onay_durumu IN ('bekliyor', 'onaylandi', 'reddedildi', 'beklemede'));
*/ 