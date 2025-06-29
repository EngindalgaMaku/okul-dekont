-- Bu betik, işletme PIN girişi sırasında alınan "column "hesap_id" is of type uuid but expression is of type bigint" 
-- hatasını çözmek için yazılmıştır.

-- 1. Hatalı `check_isletme_pin_giris` fonksiyonunu (bigint parametreli) sil.
-- Not: Fonksiyon imzasının tam olarak eşleşmesi gerekir. Eğer birden fazla versiyon varsa,
-- hepsini silmek için `fix-function-overload-error.sql` dosyasındaki gibi bir döngü kullanılabilir.
-- Şimdilik en yaygın haliyle siliyoruz.
DROP FUNCTION IF EXISTS check_isletme_pin_giris(bigint, text, text, text);

-- 2. Pin girişi kontrol fonksiyonunu (işletmeler için) doğru parametre tipiyle (uuid) yeniden oluştur.
CREATE OR REPLACE FUNCTION check_isletme_pin_giris(
  p_isletme_id uuid,
  p_girilen_pin text,
  p_ip_adresi text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  isletme_record record;
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
      yeni_yanlis_sayisi integer := COALESCE(isletme_record.yanlis_pin_sayisi, 0) + 1;
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

-- 3. Kontrol (İsteğe bağlı)
-- Bu sorgu, fonksiyonun doğru bir şekilde güncellendiğini teyit etmenize yardımcı olur.
SELECT 
    p.proname as "Fonksiyon Adı",
    pg_get_function_identity_arguments(p.oid) as "Parametreler"
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public' AND p.proname = 'check_isletme_pin_giris'; 