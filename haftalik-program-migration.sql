-- Haftalık Program Sistemi Migration
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Sınıflar tablosuna haftalık program alanını ekle
ALTER TABLE siniflar 
ADD COLUMN IF NOT EXISTS haftalik_program jsonb;

-- 2. Mevcut sınıfları güncelle (örnek veriler)
UPDATE siniflar SET 
  haftalik_program = '{"pazartesi": "isletme", "sali": "isletme", "carsamba": "isletme", "persembe": "okul", "cuma": "okul"}'::jsonb
WHERE ad = '12-A' AND haftalik_program IS NULL;

UPDATE siniflar SET 
  haftalik_program = '{"pazartesi": "okul", "sali": "okul", "carsamba": "okul", "persembe": "isletme", "cuma": "isletme"}'::jsonb
WHERE ad = '12-B' AND haftalik_program IS NULL;

-- 3. 12. sınıflar için program doğrulama fonksiyonu
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

-- 4. Trigger'ı oluştur
DROP TRIGGER IF EXISTS validate_schedule_trigger ON siniflar;
CREATE TRIGGER validate_schedule_trigger
  BEFORE INSERT OR UPDATE ON siniflar
  FOR EACH ROW
  EXECUTE FUNCTION validate_12th_grade_schedule();

-- 5. Kontrol sorgusu (isteğe bağlı)
-- SELECT ad, haftalik_program FROM siniflar WHERE haftalik_program IS NOT NULL; 