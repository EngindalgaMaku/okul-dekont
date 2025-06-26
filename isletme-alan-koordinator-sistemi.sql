-- İşletme-Alan-Koordinatör Sistemi
-- İşletmeler birden fazla alana atanabilir, her alan için ayrı koordinatör

-- 1. Önce öğretmenlere alan ataması yapalım (eğer yoksa)
ALTER TABLE ogretmenler 
ADD COLUMN IF NOT EXISTS alan_id bigint REFERENCES alanlar(id);

-- 2. İşletme-Alan ilişki tablosu (Many-to-Many)
CREATE TABLE IF NOT EXISTS isletme_alanlar (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  isletme_id bigint REFERENCES isletmeler(id) ON DELETE CASCADE NOT NULL,
  alan_id bigint REFERENCES alanlar(id) ON DELETE CASCADE NOT NULL,
  koordinator_ogretmen_id bigint REFERENCES ogretmenler(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Aynı işletme-alan kombinasyonu sadece bir kez olabilir
  UNIQUE(isletme_id, alan_id)
);

-- 3. İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_isletme_alanlar_isletme_id ON isletme_alanlar(isletme_id);
CREATE INDEX IF NOT EXISTS idx_isletme_alanlar_alan_id ON isletme_alanlar(alan_id);
CREATE INDEX IF NOT EXISTS idx_isletme_alanlar_koordinator ON isletme_alanlar(koordinator_ogretmen_id);

-- 4. RLS Politikaları
ALTER TABLE isletme_alanlar ENABLE ROW LEVEL SECURITY;

-- Admin erişimi
CREATE POLICY "Admin can manage isletme_alanlar" ON isletme_alanlar 
FOR ALL USING (auth.role() = 'authenticated');

-- Öğretmenler sadece kendi koordinatörlük yaptığı kayıtları görebilir
CREATE POLICY "Ogretmenler can see assigned isletme_alanlar" ON isletme_alanlar 
FOR SELECT USING (
  koordinator_ogretmen_id = auth.uid()::bigint OR 
  auth.role() = 'authenticated'
);

-- 5. Örnek veri: Öğretmenlere alan ataması
UPDATE ogretmenler SET alan_id = 1 WHERE id IN (1, 2); -- Bilişim Teknolojileri
UPDATE ogretmenler SET alan_id = 2 WHERE id IN (3, 4); -- Gazetecilik  
UPDATE ogretmenler SET alan_id = 3 WHERE id IN (5, 6); -- Halkla İlişkiler

-- 6. Örnek veri: İşletme-alan atamaları
-- ABC Teknoloji -> Bilişim + Gazetecilik
INSERT INTO isletme_alanlar (isletme_id, alan_id, koordinator_ogretmen_id) VALUES
(1, 1, 1), -- ABC Teknoloji - Bilişim - Ayşe Demir
(1, 2, 3); -- ABC Teknoloji - Gazetecilik - Hasan Çelik

-- MegaTech -> Bilişim
INSERT INTO isletme_alanlar (isletme_id, alan_id, koordinator_ogretmen_id) VALUES
(4, 1, 2); -- MegaTech - Bilişim - Fatma Kaya

-- AutoParts -> Bilişim + Halkla İlişkiler
INSERT INTO isletme_alanlar (isletme_id, alan_id, koordinator_ogretmen_id) VALUES
(5, 1, 1), -- AutoParts - Bilişim - Ayşe Demir
(5, 3, 5); -- AutoParts - Halkla İlişkiler - Engin Dalga

-- 7. Kontrol sorguları
SELECT 'İşletme-Alan İlişkileri:' as baslik;
SELECT 
  i.ad as isletme_adi,
  a.ad as alan_adi,
  o.ad || ' ' || o.soyad as koordinator
FROM isletme_alanlar ia
JOIN isletmeler i ON ia.isletme_id = i.id
JOIN alanlar a ON ia.alan_id = a.id
LEFT JOIN ogretmenler o ON ia.koordinator_ogretmen_id = o.id
ORDER BY i.ad, a.ad;

SELECT 'Öğretmen-Alan İlişkileri:' as baslik;
SELECT 
  o.ad || ' ' || o.soyad as ogretmen,
  a.ad as alan
FROM ogretmenler o
LEFT JOIN alanlar a ON o.alan_id = a.id
ORDER BY o.ad; 