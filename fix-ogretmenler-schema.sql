-- Öğretmenler tablosuna tüm eksik alanları ekle
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS aktif boolean DEFAULT true;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS pin text DEFAULT '0000';
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS alan_id bigint REFERENCES alanlar(id);

-- Mevcut kayıtları güncelle
UPDATE ogretmenler SET aktif = true WHERE aktif IS NULL;
UPDATE ogretmenler SET pin = '1234' WHERE pin IS NULL OR pin = '';

-- Mevcut öğretmenlere random PIN ver
UPDATE ogretmenler SET pin = '1234' WHERE ad = 'Mehmet' AND soyad = 'Yılmaz';
UPDATE ogretmenler SET pin = '5678' WHERE ad = 'Ayşe' AND soyad = 'Demir';
UPDATE ogretmenler SET pin = '9012' WHERE ad = 'Fatma' AND soyad = 'Kaya';
UPDATE ogretmenler SET pin = '3456' WHERE ad = 'Ali' AND soyad = 'Özkan';
UPDATE ogretmenler SET pin = '7890' WHERE ad = 'Zeynep' AND soyad = 'Şahin';
UPDATE ogretmenler SET pin = '2468' WHERE ad = 'Hasan' AND soyad = 'Çelik';

-- Test verisi ekle (email, telefon, alan)
UPDATE ogretmenler SET 
  email = 'mehmet.yilmaz@okul.edu.tr',
  telefon = '0532-123-4567',
  alan_id = 1  -- Bilişim Teknolojileri
WHERE ad = 'Mehmet' AND soyad = 'Yılmaz';

UPDATE ogretmenler SET 
  email = 'ayse.demir@okul.edu.tr',
  telefon = '0532-123-4568',
  alan_id = 2  -- Gazetecilik
WHERE ad = 'Ayşe' AND soyad = 'Demir';

UPDATE ogretmenler SET 
  email = 'fatma.kaya@okul.edu.tr',
  telefon = '0532-123-4569',
  alan_id = 3  -- Halkla İlişkiler
WHERE ad = 'Fatma' AND soyad = 'Kaya';

UPDATE ogretmenler SET 
  email = 'ali.ozkan@okul.edu.tr',
  telefon = '0532-123-4570',
  alan_id = 4  -- Radyo ve Televizyon
WHERE ad = 'Ali' AND soyad = 'Özkan';

UPDATE ogretmenler SET 
  email = 'zeynep.sahin@okul.edu.tr',
  telefon = '0532-123-4571',
  alan_id = 1  -- Bilişim Teknolojileri
WHERE ad = 'Zeynep' AND soyad = 'Şahin';

UPDATE ogretmenler SET 
  email = 'hasan.celik@okul.edu.tr',
  telefon = '0532-123-4572',
  alan_id = 6  -- Sanat Tasarım
WHERE ad = 'Hasan' AND soyad = 'Çelik';

-- Kontrol et
SELECT id, ad, soyad, email, telefon, alan_id, aktif, pin FROM ogretmenler ORDER BY ad; 