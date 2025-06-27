-- Stajlar tablosuna tüm eksik kolonları ekle

-- 1. Mevcut stajlar tablo yapısını kontrol et
SELECT 'Mevcut stajlar tablo yapısı:' as bilgi;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stajlar' 
ORDER BY ordinal_position;

-- 2. Eksik kolonları tek tek ekle
ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS egitim_yili_id INTEGER REFERENCES egitim_yillari(id);

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS ogretmen_id INTEGER REFERENCES ogretmenler(id);

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS isletme_id INTEGER REFERENCES isletmeler(id);

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS baslangic_tarihi DATE;

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS bitis_tarihi DATE;

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS fesih_tarihi DATE;

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS durum VARCHAR(50) DEFAULT 'aktif';

ALTER TABLE stajlar 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 3. Mevcut stajlara varsayılan değerler ata
UPDATE stajlar 
SET egitim_yili_id = (SELECT id FROM egitim_yillari WHERE aktif = true LIMIT 1)
WHERE egitim_yili_id IS NULL;

UPDATE stajlar 
SET egitim_yili_id = (SELECT id FROM egitim_yillari ORDER BY id LIMIT 1)
WHERE egitim_yili_id IS NULL;

UPDATE stajlar 
SET durum = 'aktif'
WHERE durum IS NULL;

UPDATE stajlar 
SET baslangic_tarihi = CURRENT_DATE
WHERE baslangic_tarihi IS NULL;

UPDATE stajlar 
SET bitis_tarihi = CURRENT_DATE + INTERVAL '150 days'
WHERE bitis_tarihi IS NULL;

-- 4. Güncellenmiş tablo yapısını kontrol et
SELECT 'Güncellenmiş stajlar tablo yapısı:' as bilgi;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stajlar' 
ORDER BY ordinal_position;

-- 5. Test verisi ekle (eğer hiç staj yoksa)
INSERT INTO stajlar (ogrenci_id, isletme_id, egitim_yili_id, baslangic_tarihi, bitis_tarihi, durum)
SELECT 
    (SELECT id FROM ogrenciler WHERE isletme_id IS NULL LIMIT 1),
    1,
    (SELECT id FROM egitim_yillari WHERE aktif = true LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '150 days',
    'aktif'
WHERE NOT EXISTS (SELECT 1 FROM stajlar)
AND EXISTS (SELECT 1 FROM ogrenciler WHERE isletme_id IS NULL);

-- 6. Sonuç kontrolü
SELECT 'Mevcut stajlar:' as bilgi;
SELECT s.*, o.ad, o.soyad, i.ad as isletme_adi, e.yil as egitim_yili
FROM stajlar s
LEFT JOIN ogrenciler o ON s.ogrenci_id = o.id
LEFT JOIN isletmeler i ON s.isletme_id = i.id
LEFT JOIN egitim_yillari e ON s.egitim_yili_id = e.id
ORDER BY s.id DESC
LIMIT 5; 