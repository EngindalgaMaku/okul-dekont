-- Öğretmenler tablosuna eksik alanları ekle
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS aktif boolean DEFAULT true;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS alan_id bigint REFERENCES alanlar(id);

-- Mevcut kayıtları aktif yap
UPDATE ogretmenler SET aktif = true WHERE aktif IS NULL;

-- Test verisi ekle
UPDATE ogretmenler SET 
  email = 'ali.ozkan@okul.edu.tr',
  telefon = '0532-123-4570',
  alan_id = 4,  -- Radyo ve Televizyon
  aktif = true
WHERE ad = 'Ali' AND soyad = 'Özkan';

UPDATE ogretmenler SET 
  email = 'ayse.demir@okul.edu.tr',
  telefon = '0532-123-4568',
  alan_id = 2,  -- Gazetecilik
  aktif = true
WHERE ad = 'Ayşe' AND soyad = 'Demir';

UPDATE ogretmenler SET 
  email = 'fatma.kaya@okul.edu.tr',
  telefon = '0532-123-4569',
  alan_id = 3,  -- Halkla İlişkiler
  aktif = true
WHERE ad = 'Fatma' AND soyad = 'Kaya';

UPDATE ogretmenler SET 
  email = 'hasan.celik@okul.edu.tr',
  telefon = '0532-123-4572',
  alan_id = 6,  -- Sanat Tasarım
  aktif = true
WHERE ad = 'Hasan' AND soyad = 'Çelik';

UPDATE ogretmenler SET 
  email = 'mehmet.yilmaz@okul.edu.tr',
  telefon = '0532-123-4567',
  alan_id = 1,  -- Bilişim Teknolojileri
  aktif = true
WHERE ad = 'Mehmet' AND soyad = 'Yılmaz';

UPDATE ogretmenler SET 
  email = 'zeynep.sahin@okul.edu.tr',
  telefon = '0532-123-4571',
  alan_id = 1,  -- Bilişim Teknolojileri
  aktif = true
WHERE ad = 'Zeynep' AND soyad = 'Şahin';

-- Kontrol
SELECT id, ad, soyad, email, telefon, alan_id, aktif, pin FROM ogretmenler ORDER BY ad; 