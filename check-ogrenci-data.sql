-- Öğrenci sayısını kontrol et
SELECT 
  s.id as sinif_id,
  s.ad as sinif_adi,
  COUNT(o.id) as ogrenci_sayisi
FROM siniflar s
LEFT JOIN ogrenciler o ON o.sinif_id = s.id
WHERE s.id = '7'
GROUP BY s.id, s.ad;

-- Öğrenci detaylarını kontrol et
SELECT 
  o.*,
  i.ad as isletme_adi
FROM ogrenciler o
LEFT JOIN isletmeler i ON i.id = o.isletme_id
WHERE o.sinif_id = '7'
ORDER BY o.ad; 