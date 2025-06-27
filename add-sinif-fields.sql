-- Sınıflar tablosuna dal ve gün bilgileri ekleme
ALTER TABLE siniflar 
ADD COLUMN IF NOT EXISTS dal text,
ADD COLUMN IF NOT EXISTS isletme_gunleri text,
ADD COLUMN IF NOT EXISTS okul_gunleri text,
ADD COLUMN IF NOT EXISTS haftalik_program jsonb;

-- Örnek veriler ekleyelim
UPDATE siniflar SET 
  dal = 'Web Programcılığı',
  isletme_gunleri = 'Pazartesi-Salı-Çarşamba',
  okul_gunleri = 'Perşembe-Cuma',
  haftalik_program = '{"pazartesi": "isletme", "sali": "isletme", "carsamba": "isletme", "persembe": "okul", "cuma": "okul"}'::jsonb
WHERE ad = '12-A';

UPDATE siniflar SET 
  dal = 'Veri Tabanı Programcılığı', 
  isletme_gunleri = 'Perşembe-Cuma',
  okul_gunleri = 'Pazartesi-Salı-Çarşamba',
  haftalik_program = '{"pazartesi": "okul", "sali": "okul", "carsamba": "okul", "persembe": "isletme", "cuma": "isletme"}'::jsonb
WHERE ad = '12-B'; 

-- 12. sınıflar için program doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION validate_12th_grade_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer sınıf 12. sınıf ise (adında '12' geçiyorsa) program kontrolü yap
  IF NEW.ad LIKE '%12%' AND NEW.haftalik_program IS NOT NULL THEN
    DECLARE
      okul_gun_sayisi integer := 0;
      isletme_gun_sayisi integer := 0;
      gun_durumu text;
    BEGIN
      -- Her günü kontrol et
      FOR gun_durumu IN 
        SELECT value FROM jsonb_each_text(NEW.haftalik_program)
      LOOP
        IF gun_durumu = 'okul' THEN
          okul_gun_sayisi := okul_gun_sayisi + 1;
        ELSIF gun_durumu = 'isletme' THEN
          isletme_gun_sayisi := isletme_gun_sayisi + 1;
        END IF;
      END LOOP;
      
      -- 12. sınıf kuralı: 2 gün okul, 3 gün işletme
      IF okul_gun_sayisi != 2 OR isletme_gun_sayisi != 3 THEN
        RAISE EXCEPTION '12. sınıflar için haftalık program 2 gün okul, 3 gün işletme olmalıdır. Mevcut: % gün okul, % gün işletme', okul_gun_sayisi, isletme_gun_sayisi;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS validate_schedule_trigger ON siniflar;
CREATE TRIGGER validate_schedule_trigger
  BEFORE INSERT OR UPDATE ON siniflar
  FOR EACH ROW
  EXECUTE FUNCTION validate_12th_grade_schedule(); 