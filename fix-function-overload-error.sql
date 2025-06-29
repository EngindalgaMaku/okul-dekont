-- Bu betik, "Could not choose the best candidate function" hatasını çözmek için
-- veritabanında var olan tüm `check_ogretmen_pin_giris` fonksiyonlarını siler
-- ve ardından doğru sürümü (uuid parametresi ile) yeniden oluşturur.

-- 1. Mevcut tüm check_ogretmen_pin_giris fonksiyonlarını sil
DO $$ 
DECLARE 
  func_record record;
BEGIN
  FOR func_record IN 
    SELECT ns.nspname as schema_name,
           p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace ns ON p.pronamespace = ns.oid
    WHERE p.proname = 'check_ogretmen_pin_giris'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s)',
                  func_record.schema_name,
                  func_record.function_name,
                  func_record.arguments);
  END LOOP;
END $$;


-- 2. Pin girişi kontrol fonksiyonunu (öğretmenler için) doğru şema ile yeniden oluştur.
-- Bu versiyon p_ogretmen_id için UUID kullanır.
CREATE OR REPLACE FUNCTION check_ogretmen_pin_giris(
  p_ogretmen_id uuid,
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

-- Bu komutlar, veritabanında aynı isimde bulunan ve çakışmaya neden olan
-- fonksiyonların yanlış olan versiyonlarını kaldırır.
-- Böylece sadece doğru olan versiyonlar kalır ve "Could not choose the best candidate function" hatası çözülür.

-- 1. İşletme girişi için oluşturulmuş hatalı (uuid bekleyen) fonksiyonu sil.
DROP FUNCTION IF EXISTS public.check_isletme_pin_giris(uuid, text, text, text);

-- 2. Önceki adımlarda yapılan bir yazım hatasıyla oluşturulmuş olan hatalı öğretmen fonksiyonunu sil.
DROP FUNCTION IF EXISTS public.check_ogretmen_pin_gis(uuid, text, text, text); 