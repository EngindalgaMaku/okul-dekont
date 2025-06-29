-- PIN KİLİTLEME SİSTEMİ
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Öğretmenler tablosuna kilitleme alanları ekle
ALTER TABLE ogretmenler 
ADD COLUMN IF NOT EXISTS yanlis_pin_sayisi integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hesap_kilitli boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS son_yanlis_giris timestamp with time zone,
ADD COLUMN IF NOT EXISTS kilitlenme_tarihi timestamp with time zone;

-- 2. İşletmeler tablosuna kilitleme alanları ekle  
ALTER TABLE isletmeler
ADD COLUMN IF NOT EXISTS yanlis_pin_sayisi integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hesap_kilitli boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS son_yanlis_giris timestamp with time zone,
ADD COLUMN IF NOT EXISTS kilitlenme_tarihi timestamp with time zone;

-- 3. Pin girişi log tablosu oluştur (yeni kayıtlar için)
CREATE TABLE IF NOT EXISTS pin_giris_loglari (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hesap_tipi text NOT NULL CHECK (hesap_tipi IN ('ogretmen', 'isletme')),
  hesap_id bigint NOT NULL,
  girilen_pin text NOT NULL,
  basarili boolean NOT NULL,
  ip_adresi text,
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- 4. Pin girişi kontrol fonksiyonu (öğretmenler için)
CREATE OR REPLACE FUNCTION check_ogretmen_pin_giris(
  p_ogretmen_id bigint,
  p_girilen_pin text,
  p_ip_adresi text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  ogretmen_record record;
  sonuc jsonb;
BEGIN
  -- Öğretmen bilgilerini al
  SELECT * INTO ogretmen_record FROM ogretmenler WHERE id = p_ogretmen_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('basarili', false, 'mesaj', 'Öğretmen kaydı bulunamadı. Lütfen yönetici ile iletişime geçin.');
  END IF;
  
  -- Hesap kilitli mi kontrol et
  IF ogretmen_record.hesap_kilitli THEN
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('ogretmen', p_ogretmen_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
    
    RETURN jsonb_build_object(
      'basarili', false, 
      'mesaj', '⚠️ Hesabınız güvenlik nedeniyle geçici olarak kilitlenmiştir. Lütfen okul yönetimi ile iletişime geçin.',
      'kilitli', true,
      'kilitlenme_tarihi', ogretmen_record.kilitlenme_tarihi
    );
  END IF;
  
  -- Pin doğru mu kontrol et
  IF ogretmen_record.pin = p_girilen_pin THEN
    -- Başarılı giriş - sayaçları sıfırla
    UPDATE ogretmenler 
    SET yanlis_pin_sayisi = 0, son_yanlis_giris = NULL
    WHERE id = p_ogretmen_id;
    
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('ogretmen', p_ogretmen_id, p_girilen_pin, true, p_ip_adresi, p_user_agent);
    
    RETURN jsonb_build_object('basarili', true, 'mesaj', 'Giriş başarılı! Hoş geldiniz.');
  ELSE
    -- Yanlış pin
    DECLARE
      yeni_yanlis_sayisi integer := ogretmen_record.yanlis_pin_sayisi + 1;
    BEGIN
      IF yeni_yanlis_sayisi >= 3 THEN
        -- Hesabı kilitle
        UPDATE ogretmenler 
        SET yanlis_pin_sayisi = yeni_yanlis_sayisi,
            hesap_kilitli = true,
            kilitlenme_tarihi = NOW(),
            son_yanlis_giris = NOW()
        WHERE id = p_ogretmen_id;
        
        -- Log ekle
        INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
        VALUES ('ogretmen', p_ogretmen_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
        
        RETURN jsonb_build_object(
          'basarili', false, 
          'mesaj', '🔒 Hesabınız 3 kez yanlış PIN girdiğiniz için güvenlik nedeniyle kilitlenmiştir. Lütfen okul yönetimi ile iletişime geçin.',
          'kilitli', true,
          'yanlis_sayisi', yeni_yanlis_sayisi
        );
      ELSE
        -- Sadece sayacı artır
        UPDATE ogretmenler 
        SET yanlis_pin_sayisi = yeni_yanlis_sayisi,
            son_yanlis_giris = NOW()
        WHERE id = p_ogretmen_id;
        
        -- Log ekle
        INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
        VALUES ('ogretmen', p_ogretmen_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
        
        RETURN jsonb_build_object(
          'basarili', false, 
          'mesaj', format('❌ Yanlış PIN kodu. Kalan deneme hakkınız: %s', 3 - yeni_yanlis_sayisi),
          'yanlis_sayisi', yeni_yanlis_sayisi,
          'kalan_hakki', 3 - yeni_yanlis_sayisi
        );
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Pin girişi kontrol fonksiyonu (işletmeler için)
CREATE OR REPLACE FUNCTION check_isletme_pin_giris(
  p_isletme_id bigint,
  p_girilen_pin text,
  p_ip_adresi text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  isletme_record record;
  sonuc jsonb;
BEGIN
  -- İşletme bilgilerini al
  SELECT * INTO isletme_record FROM isletmeler WHERE id = p_isletme_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('basarili', false, 'mesaj', 'İşletme kaydı bulunamadı. Lütfen yönetici ile iletişime geçin.');
  END IF;
  
  -- Hesap kilitli mi kontrol et
  IF isletme_record.hesap_kilitli THEN
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('isletme', p_isletme_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
    
    RETURN jsonb_build_object(
      'basarili', false, 
      'mesaj', '⚠️ Hesabınız güvenlik nedeniyle geçici olarak kilitlenmiştir. Lütfen okul yönetimi ile iletişime geçin.',
      'kilitli', true,
      'kilitlenme_tarihi', isletme_record.kilitlenme_tarihi
    );
  END IF;
  
  -- Pin doğru mu kontrol et
  IF isletme_record.pin = p_girilen_pin THEN
    -- Başarılı giriş - sayaçları sıfırla
    UPDATE isletmeler 
    SET yanlis_pin_sayisi = 0, son_yanlis_giris = NULL
    WHERE id = p_isletme_id;
    
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('isletme', p_isletme_id, p_girilen_pin, true, p_ip_adresi, p_user_agent);
    
    RETURN jsonb_build_object('basarili', true, 'mesaj', 'Giriş başarılı! Hoş geldiniz.');
  ELSE
    -- Yanlış pin
    DECLARE
      yeni_yanlis_sayisi integer := isletme_record.yanlis_pin_sayisi + 1;
    BEGIN
      IF yeni_yanlis_sayisi >= 3 THEN
        -- Hesabı kilitle
        UPDATE isletmeler 
        SET yanlis_pin_sayisi = yeni_yanlis_sayisi,
            hesap_kilitli = true,
            kilitlenme_tarihi = NOW(),
            son_yanlis_giris = NOW()
        WHERE id = p_isletme_id;
        
        -- Log ekle
        INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
        VALUES ('isletme', p_isletme_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
        
        RETURN jsonb_build_object(
          'basarili', false, 
          'mesaj', '🔒 Hesabınız 3 kez yanlış PIN girdiğiniz için güvenlik nedeniyle kilitlenmiştir. Lütfen okul yönetimi ile iletişime geçin.',
          'kilitli', true,
          'yanlis_sayisi', yeni_yanlis_sayisi
        );
      ELSE
        -- Sadece sayacı artır
        UPDATE isletmeler 
        SET yanlis_pin_sayisi = yeni_yanlis_sayisi,
            son_yanlis_giris = NOW()
        WHERE id = p_isletme_id;
        
        -- Log ekle
        INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
        VALUES ('isletme', p_isletme_id, p_girilen_pin, false, p_ip_adresi, p_user_agent);
        
        RETURN jsonb_build_object(
          'basarili', false, 
          'mesaj', format('❌ Yanlış PIN kodu. Kalan deneme hakkınız: %s', 3 - yeni_yanlis_sayisi),
          'yanlis_sayisi', yeni_yanlis_sayisi,
          'kalan_hakki', 3 - yeni_yanlis_sayisi
        );
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Admin kilidi açma fonksiyonu
CREATE OR REPLACE FUNCTION admin_hesap_kilidi_ac(
  p_hesap_tipi text,
  p_hesap_id bigint,
  p_admin_notu text DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
  IF p_hesap_tipi = 'ogretmen' THEN
    UPDATE ogretmenler 
    SET hesap_kilitli = false,
        yanlis_pin_sayisi = 0,
        son_yanlis_giris = NULL,
        kilitlenme_tarihi = NULL
    WHERE id = p_hesap_id;
    
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('ogretmen', p_hesap_id, 'ADMIN_KILIT_AC', true, 'ADMIN', p_admin_notu);
    
    RETURN jsonb_build_object('basarili', true, 'mesaj', 'Öğretmen hesabının kilidi başarıyla açıldı');
    
  ELSIF p_hesap_tipi = 'isletme' THEN
    UPDATE isletmeler 
    SET hesap_kilitli = false,
        yanlis_pin_sayisi = 0,
        son_yanlis_giris = NULL,
        kilitlenme_tarihi = NULL
    WHERE id = p_hesap_id;
    
    -- Log ekle
    INSERT INTO pin_giris_loglari (hesap_tipi, hesap_id, girilen_pin, basarili, ip_adresi, user_agent)
    VALUES ('isletme', p_hesap_id, 'ADMIN_KILIT_AC', true, 'ADMIN', p_admin_notu);
    
    RETURN jsonb_build_object('basarili', true, 'mesaj', 'İşletme hesabının kilidi başarıyla açıldı');
  ELSE
    RETURN jsonb_build_object('basarili', false, 'mesaj', 'Geçersiz hesap tipi');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS politikalarını düzenle/sil
DROP POLICY IF EXISTS "Pin logları okunabilir" ON pin_giris_loglari;
DROP POLICY IF EXISTS "Pin logları eklenebilir" ON pin_giris_loglari;

-- RLS'yi kapat (güvenlik logları için daha esnek olsun)
ALTER TABLE pin_giris_loglari DISABLE ROW LEVEL SECURITY;

-- 8. İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_ogretmenler_hesap_kilitli ON ogretmenler(hesap_kilitli);
CREATE INDEX IF NOT EXISTS idx_isletmeler_hesap_kilitli ON isletmeler(hesap_kilitli);
CREATE INDEX IF NOT EXISTS idx_pin_giris_loglari_hesap ON pin_giris_loglari(hesap_tipi, hesap_id);
CREATE INDEX IF NOT EXISTS idx_pin_giris_loglari_created_at ON pin_giris_loglari(created_at);

-- 9. Test fonksiyonları (isteğe bağlı)
/*
-- Örnek kullanım:
SELECT check_ogretmen_pin_giris(1, '1234', '192.168.1.1', 'Mozilla/5.0...');
SELECT check_isletme_pin_giris(1, '5678', '192.168.1.1', 'Mozilla/5.0...');
SELECT admin_hesap_kilidi_ac('ogretmen', 1, 'Yönetici tarafından açıldı');

-- Kilitli hesapları görme:
SELECT ad, soyad, hesap_kilitli, yanlis_pin_sayisi, kilitlenme_tarihi FROM ogretmenler WHERE hesap_kilitli = true;
SELECT ad, hesap_kilitli, yanlis_pin_sayisi, kilitlenme_tarihi FROM isletmeler WHERE hesap_kilitli = true;

-- Tüm logları görme:
SELECT 
  pgl.*,
  CASE 
    WHEN pgl.hesap_tipi = 'ogretmen' THEN (
      SELECT o.ad || ' ' || o.soyad FROM ogretmenler o WHERE o.id = pgl.hesap_id
    )
    WHEN pgl.hesap_tipi = 'isletme' THEN (
      SELECT i.ad FROM isletmeler i WHERE i.id = pgl.hesap_id
    )
  END as hesap_adi
FROM pin_giris_loglari pgl
ORDER BY pgl.created_at DESC;
*/

-- Önce mevcut hesap_id kolonunu değiştir
ALTER TABLE pin_giris_loglari 
ALTER COLUMN hesap_id TYPE bigint USING hesap_id::bigint; 