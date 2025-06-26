-- Öğretmen Koordinatörlük Sistemi
-- İşletmeler zaten ogretmen_id ile bağlı, bu sistemi güçlendirelim

-- İşletmeler tablosuna koordinatör bilgisi netleştirelim (zaten ogretmen_id var)
-- Mevcut yapı: isletmeler.ogretmen_id -> koordinatör öğretmen

-- Öğretmen giriş için session tablosu
CREATE TABLE IF NOT EXISTS ogretmen_sessions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ogretmen_id bigint REFERENCES ogretmenler(id) NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS politikaları
ALTER TABLE ogretmen_sessions ENABLE ROW LEVEL SECURITY;

-- Öğretmenler sadece kendi session'larını görebilir
CREATE POLICY "Ogretmenler can manage own sessions" ON ogretmen_sessions 
FOR ALL USING (ogretmen_id = auth.uid()::bigint);

-- Admin politikaları: Öğretmenler kendi koordinatörlük yaptığı işletmeleri görebilir
CREATE POLICY "Ogretmenler can see assigned isletmeler" ON isletmeler 
FOR SELECT USING (ogretmen_id = auth.uid()::bigint OR auth.role() = 'authenticated');

-- Öğretmenler kendi koordinatörlük yaptığı işletmelerin dekontlarını görebilir
CREATE POLICY "Ogretmenler can see assigned dekontlar" ON dekontlar 
FOR SELECT USING (
  ogretmen_id = auth.uid()::bigint OR 
  isletme_id IN (SELECT id FROM isletmeler WHERE ogretmen_id = auth.uid()::bigint) OR
  auth.role() = 'authenticated'
);

-- Koordinatör atamaları güncelleyelim (test verisi)
UPDATE isletmeler SET ogretmen_id = 1 WHERE id IN (1, 2); -- Mehmet Yılmaz -> 2 işletme
UPDATE isletmeler SET ogretmen_id = 2 WHERE id IN (3, 4); -- Ayşe Demir -> 2 işletme  
UPDATE isletmeler SET ogretmen_id = 3 WHERE id IN (5, 6); -- Fatma Kaya -> 2 işletme

-- Kontrol
SELECT 
  i.id,
  i.ad as isletme_ad,
  i.yetkili_kisi,
  o.ad as koordinator_ad,
  o.soyad as koordinator_soyad,
  o.pin as koordinator_pin
FROM isletmeler i 
LEFT JOIN ogretmenler o ON i.ogretmen_id = o.id 
ORDER BY o.ad, i.ad; 