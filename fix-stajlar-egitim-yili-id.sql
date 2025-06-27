-- Stajlar tablosuna egitim_yili_id kolonu ekle

-- 1. Stajlar tablo yapısını kontrol et
SELECT 'Stajlar tablo yapısı:' as bilgi;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stajlar' 
ORDER BY ordinal_position;

-- 2. Egitim_yili_id kolonu var mı kontrol et
SELECT 'Egitim_yili_id kolunu var mı:' as kontrol;
SELECT COUNT(*) as kolun_var_mi
FROM information_schema.columns 
WHERE table_name = 'stajlar' 
AND column_name = 'egitim_yili_id';

-- 3. Egitim_yili_id kolonu yoksa ekle
ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS egitim_yili_id INTEGER REFERENCES egitim_yillari(id);

-- 4. Mevcut stajlara aktif eğitim yılını ata
UPDATE stajlar 
SET egitim_yili_id = (
    SELECT id FROM egitim_yillari WHERE aktif = true LIMIT 1
)
WHERE egitim_yili_id IS NULL;

-- 5. Eğer aktif eğitim yılı yoksa, ilk eğitim yılını ata
UPDATE stajlar 
SET egitim_yili_id = (
    SELECT id FROM egitim_yillari ORDER BY id LIMIT 1
)
WHERE egitim_yili_id IS NULL;

-- 6. Kontrol: Güncellenmiş stajlar
SELECT 'Güncellenmiş stajlar:' as bilgi;
SELECT s.id, s.ogrenci_id, s.isletme_id, s.egitim_yili_id, s.durum, e.yil as egitim_yili
FROM stajlar s
LEFT JOIN egitim_yillari e ON s.egitim_yili_id = e.id
ORDER BY s.id DESC
LIMIT 10;

-- 7. Eğitim yılları kontrolü
SELECT 'Mevcut eğitim yılları:' as bilgi;
SELECT * FROM egitim_yillari ORDER BY id; 