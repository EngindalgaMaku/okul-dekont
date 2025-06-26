-- İşletmeler tablosuna ogretmen_id kolonu ekleme
-- Koordinatörlük sistemi için gerekli

-- Kolonu ekle
ALTER TABLE isletmeler 
ADD COLUMN IF NOT EXISTS ogretmen_id bigint REFERENCES ogretmenler(id);

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_isletmeler_ogretmen_id ON isletmeler(ogretmen_id);

-- Test: Mevcut işletmelere rastgele koordinatör ata (örnek veri)
UPDATE isletmeler SET ogretmen_id = 1 WHERE id = 1; -- ABC Teknoloji -> Ayşe Demir  
UPDATE isletmeler SET ogretmen_id = 2 WHERE id = 2; -- XYZ İnşaat -> Fatma Kaya
UPDATE isletmeler SET ogretmen_id = 3 WHERE id = 3; -- DEF Otomotiv -> Hasan Çelik
UPDATE isletmeler SET ogretmen_id = 1 WHERE id = 4; -- MegaTech -> Ayşe Demir
UPDATE isletmeler SET ogretmen_id = 2 WHERE id = 5; -- AutoParts -> Fatma Kaya
UPDATE isletmeler SET ogretmen_id = 3 WHERE id = 6; -- ElektroMax -> Hasan Çelik

-- Kontrol sorgusu
SELECT 
  i.id,
  i.ad as isletme_adi,
  i.yetkili_kisi,
  o.ad as koordinator_adi,
  o.soyad as koordinator_soyadi
FROM isletmeler i
LEFT JOIN ogretmenler o ON i.ogretmen_id = o.id
ORDER BY i.ad; 