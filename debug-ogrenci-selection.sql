-- Öğrenci seçim problemini debug etmek için sorgular

-- 1. İşletme ID 1'in alanlarını kontrol et
SELECT 'İşletme Alanları:' as bilgi;
SELECT ia.*, a.ad as alan_adi 
FROM isletme_alanlar ia
LEFT JOIN alanlar a ON ia.alan_id = a.id 
WHERE ia.isletme_id = 1;

-- 2. Tüm öğrencileri kontrol et
SELECT 'Tüm Öğrenciler (ilk 10):' as bilgi;
SELECT o.id, o.ad, o.soyad, o.no, o.sinif, o.alan_id, o.isletme_id, a.ad as alan_adi
FROM ogrenciler o
LEFT JOIN alanlar a ON o.alan_id = a.id
ORDER BY o.id
LIMIT 10;

-- 3. Tüm alanları kontrol et
SELECT 'Tüm Alanlar:' as bilgi;
SELECT * FROM alanlar ORDER BY id;

-- 4. İşletme 1 için uygun öğrencileri bul (mevcut mantık)
SELECT 'İşletme 1 için uygun öğrenciler (mevcut mantık):' as bilgi;
SELECT o.id, o.ad, o.soyad, o.no, o.sinif, o.alan_id, o.isletme_id, a.ad as alan_adi
FROM ogrenciler o
LEFT JOIN alanlar a ON o.alan_id = a.id
WHERE o.alan_id IN (SELECT alan_id FROM isletme_alanlar WHERE isletme_id = 1)
AND o.isletme_id IS NULL;

-- 5. Alternatif: Tüm müsait öğrenciler (alan kontrolü olmadan)
SELECT 'Müsait tüm öğrenciler (alan kontrolsüz):' as bilgi;
SELECT o.id, o.ad, o.soyad, o.no, o.sinif, o.alan_id, o.isletme_id, a.ad as alan_adi
FROM ogrenciler o
LEFT JOIN alanlar a ON o.alan_id = a.id
WHERE o.isletme_id IS NULL;

-- 6. Aktif stajları kontrol et
SELECT 'Aktif stajlar:' as bilgi;
SELECT s.*, o.ad, o.soyad, o.no
FROM stajlar s
LEFT JOIN ogrenciler o ON s.ogrenci_id = o.id
WHERE s.durum = 'aktif' AND s.fesih_tarihi IS NULL;

-- 7. İşletme-öğrenci bağlantısını kontrol et
SELECT 'İşletme-öğrenci bağlantıları:' as bilgi;
SELECT o.id, o.ad, o.soyad, o.isletme_id, i.ad as isletme_adi
FROM ogrenciler o
LEFT JOIN isletmeler i ON o.isletme_id = i.id
WHERE o.isletme_id IS NOT NULL; 