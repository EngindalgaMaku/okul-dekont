-- Öğrenciler tablosuna 'no' alanı ekleme
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS no text;

-- Mevcut öğrencilere örnek no'ları ekle
UPDATE ogrenciler SET no = '1001' WHERE ad = 'Mustafa' AND soyad = 'Şahin';
UPDATE ogrenciler SET no = '1002' WHERE ad = 'Fatma' AND soyad = 'Yıldız';
UPDATE ogrenciler SET no = '1003' WHERE ad = 'Zehra' AND soyad = 'Çelik';

-- Kontrol et
SELECT id, ad, soyad, no, sinif, alan_id FROM ogrenciler ORDER BY ad; 