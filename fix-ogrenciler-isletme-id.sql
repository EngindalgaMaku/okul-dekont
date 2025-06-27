-- Öğrenciler tablosuna isletme_id kolonu ekle ve ilişkileri düzelt

-- 1. Önce mevcut tablo yapısını kontrol et
SELECT 'Öğrenciler tablo yapısı:' as bilgi;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ogrenciler' 
ORDER BY ordinal_position;

-- 2. İsletme_id kolonu var mı kontrol et
SELECT 'İsletme_id kolonu var mı:' as kontrol;
SELECT COUNT(*) as kolun_var_mi
FROM information_schema.columns 
WHERE table_name = 'ogrenciler' 
AND column_name = 'isletme_id';

-- 3. İsletme_id kolonu yoksa ekle
ALTER TABLE ogrenciler 
ADD COLUMN IF NOT EXISTS isletme_id INTEGER REFERENCES isletmeler(id);

-- 4. Mevcut aktif stajlara göre isletme_id'leri güncelle
UPDATE ogrenciler 
SET isletme_id = s.isletme_id
FROM stajlar s
WHERE ogrenciler.id = s.ogrenci_id
AND s.durum = 'aktif' 
AND s.fesih_tarihi IS NULL;

-- 5. Kontrol: Güncellenmiş öğrenciler
SELECT 'Güncellenmiş öğrenciler:' as bilgi;
SELECT o.id, o.ad, o.soyad, o.no, o.isletme_id, i.ad as isletme_adi
FROM ogrenciler o
LEFT JOIN isletmeler i ON o.isletme_id = i.id
WHERE o.isletme_id IS NOT NULL;

-- 6. Test: İşletme 1 için uygun öğrenciler
SELECT 'İşletme 1 için uygun öğrenciler:' as test;
SELECT o.id, o.ad, o.soyad, o.no, o.sinif, o.alan_id, o.isletme_id, a.ad as alan_adi
FROM ogrenciler o
LEFT JOIN alanlar a ON o.alan_id = a.id
WHERE o.alan_id IN (SELECT alan_id FROM isletme_alanlar WHERE isletme_id = 1)
AND o.isletme_id IS NULL;

-- 7. Alternatif test: Tüm müsait öğrenciler
SELECT 'Tüm müsait öğrenciler:' as test2;
SELECT o.id, o.ad, o.soyad, o.no, o.sinif, o.alan_id, o.isletme_id, a.ad as alan_adi
FROM ogrenciler o
LEFT JOIN alanlar a ON o.alan_id = a.id
WHERE o.isletme_id IS NULL
ORDER BY o.ad;

-- 8. Eğer hala öğrenci yoksa, demo öğrenci ekle
INSERT INTO ogrenciler (ad, soyad, no, sinif, alan_id, isletme_id)
SELECT 'Test', 'Öğrenci', '12345', '12-A', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE isletme_id IS NULL)
AND EXISTS (SELECT 1 FROM alanlar WHERE id = 1); 