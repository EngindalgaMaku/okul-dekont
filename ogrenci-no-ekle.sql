-- Öğrenciler tablosuna 'no' alanı ekle
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS no text;

-- Mevcut öğrencilere numara ver
UPDATE ogrenciler SET no = '1001' WHERE id = 1;
UPDATE ogrenciler SET no = '1002' WHERE id = 2;
UPDATE ogrenciler SET no = '1003' WHERE id = 3;
UPDATE ogrenciler SET no = '1004' WHERE id = 4;
UPDATE ogrenciler SET no = '1005' WHERE id = 5;

-- Kontrol
SELECT * FROM ogrenciler; 