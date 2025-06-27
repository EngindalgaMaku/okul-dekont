-- Ogrenciler tablosuna isletme_id alanını ekle (eğer yoksa)
ALTER TABLE ogrenciler 
ADD COLUMN IF NOT EXISTS isletme_id INTEGER REFERENCES isletmeler(id) ON DELETE SET NULL;

-- Mevcut öğrencileri stajlar tablosundan kontrol ederek güncelle
UPDATE ogrenciler 
SET isletme_id = stajlar.isletme_id 
FROM stajlar 
WHERE ogrenciler.id = stajlar.ogrenci_id 
AND ogrenciler.isletme_id IS NULL;

-- Kontrol için: Ogrenciler tablosundaki kayıtları listele
SELECT 
  o.id,
  o.ad,
  o.soyad,
  o.no,
  o.isletme_id,
  i.ad as isletme_adi
FROM ogrenciler o
LEFT JOIN isletmeler i ON o.isletme_id = i.id
ORDER BY o.id; 