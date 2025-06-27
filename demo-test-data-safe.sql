-- Demo Test Verileri - Okul Dekont Sistemi (Güvenli Versiyon)
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Mevcut veriler varsa çakışma yapmaz

-- 1. Eğitim Yılları (sadece yoksa ekle)
INSERT INTO egitim_yillari (yil, aktif) 
SELECT '2024-2025', true
WHERE NOT EXISTS (SELECT 1 FROM egitim_yillari WHERE yil = '2024-2025');

INSERT INTO egitim_yillari (yil, aktif) 
SELECT '2023-2024', false
WHERE NOT EXISTS (SELECT 1 FROM egitim_yillari WHERE yil = '2023-2024');

-- 2. Alanlar (sadece yoksa ekle)
INSERT INTO alanlar (ad, aciklama) 
SELECT 'Bilgisayar Programcılığı', 'Yazılım geliştirme ve programlama alanı'
WHERE NOT EXISTS (SELECT 1 FROM alanlar WHERE ad = 'Bilgisayar Programcılığı');

INSERT INTO alanlar (ad, aciklama) 
SELECT 'Elektrik-Elektronik', 'Elektrik tesisatı ve elektronik sistemler'
WHERE NOT EXISTS (SELECT 1 FROM alanlar WHERE ad = 'Elektrik-Elektronik');

INSERT INTO alanlar (ad, aciklama) 
SELECT 'Makine Teknolojisi', 'Makine imalat ve bakım onarım'
WHERE NOT EXISTS (SELECT 1 FROM alanlar WHERE ad = 'Makine Teknolojisi');

INSERT INTO alanlar (ad, aciklama) 
SELECT 'Otomotiv Teknolojisi', 'Araç bakım onarım ve motor teknolojileri'
WHERE NOT EXISTS (SELECT 1 FROM alanlar WHERE ad = 'Otomotiv Teknolojisi');

INSERT INTO alanlar (ad, aciklama) 
SELECT 'İnşaat Teknolojisi', 'Yapı inşaat ve teknik resim'
WHERE NOT EXISTS (SELECT 1 FROM alanlar WHERE ad = 'İnşaat Teknolojisi');

-- Alan ID'lerini al
DO $$
DECLARE
    bilgisayar_id INTEGER;
    elektrik_id INTEGER;
    makine_id INTEGER;
    otomotiv_id INTEGER;
    insaat_id INTEGER;
BEGIN
    SELECT id INTO bilgisayar_id FROM alanlar WHERE ad = 'Bilgisayar Programcılığı';
    SELECT id INTO elektrik_id FROM alanlar WHERE ad = 'Elektrik-Elektronik';
    SELECT id INTO makine_id FROM alanlar WHERE ad = 'Makine Teknolojisi';
    SELECT id INTO otomotiv_id FROM alanlar WHERE ad = 'Otomotiv Teknolojisi';
    SELECT id INTO insaat_id FROM alanlar WHERE ad = 'İnşaat Teknolojisi';

    -- 3. İşletmeler (sadece yoksa ekle)
    INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) 
    SELECT 'TeknoSoft Yazılım A.Ş.', 'Ahmet ÖZKAN', '0532 123 4567', 'Teknokent, Ankara', '1234', bilgisayar_id
    WHERE NOT EXISTS (SELECT 1 FROM isletmeler WHERE ad = 'TeknoSoft Yazılım A.Ş.');

    INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) 
    SELECT 'ElektroTek Ltd. Şti.', 'Mehmet DEMİR', '0533 234 5678', 'Ostim, Ankara', '5678', elektrik_id
    WHERE NOT EXISTS (SELECT 1 FROM isletmeler WHERE ad = 'ElektroTek Ltd. Şti.');

    INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) 
    SELECT 'MakTek Endüstri', 'Ayşe YILMAZ', '0534 345 6789', 'İvedik OSB, Ankara', '9999', makine_id
    WHERE NOT EXISTS (SELECT 1 FROM isletmeler WHERE ad = 'MakTek Endüstri');

    INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) 
    SELECT 'OtoServis Plus', 'Fatma KAYA', '0535 456 7890', 'Siteler, Ankara', '1111', otomotiv_id
    WHERE NOT EXISTS (SELECT 1 FROM isletmeler WHERE ad = 'OtoServis Plus');

    INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) 
    SELECT 'YapıMar İnşaat', 'Ali ÇELIK', '0536 567 8901', 'Batıkent, Ankara', '2222', insaat_id
    WHERE NOT EXISTS (SELECT 1 FROM isletmeler WHERE ad = 'YapıMar İnşaat');

    -- 4. Öğretmenler (sadece yoksa ekle)
    INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) 
    SELECT 'Ahmet', 'YILMAZ', '0542 111 1111', 'ahmet.yilmaz@okul.edu.tr', '1111', bilgisayar_id
    WHERE NOT EXISTS (SELECT 1 FROM ogretmenler WHERE ad = 'Ahmet' AND soyad = 'YILMAZ');

    INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) 
    SELECT 'Ayşe', 'DEMİR', '0542 222 2222', 'ayse.demir@okul.edu.tr', '2222', elektrik_id
    WHERE NOT EXISTS (SELECT 1 FROM ogretmenler WHERE ad = 'Ayşe' AND soyad = 'DEMİR');

    INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) 
    SELECT 'Mehmet', 'KAYA', '0542 333 3333', 'mehmet.kaya@okul.edu.tr', '3333', makine_id
    WHERE NOT EXISTS (SELECT 1 FROM ogretmenler WHERE ad = 'Mehmet' AND soyad = 'KAYA');

    INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) 
    SELECT 'Fatma', 'ÖZKAN', '0542 444 4444', 'fatma.ozkan@okul.edu.tr', '4444', otomotiv_id
    WHERE NOT EXISTS (SELECT 1 FROM ogretmenler WHERE ad = 'Fatma' AND soyad = 'ÖZKAN');

    INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) 
    SELECT 'Ali', 'ŞEN', '0542 555 5555', 'ali.sen@okul.edu.tr', '5555', insaat_id
    WHERE NOT EXISTS (SELECT 1 FROM ogretmenler WHERE ad = 'Ali' AND soyad = 'ŞEN');

END $$;

-- 5. Sınıflar (dinamik olarak ekle)
DO $$
DECLARE
    ogretmen1_id INTEGER;
    ogretmen2_id INTEGER;
    ogretmen3_id INTEGER;
    alan1_id INTEGER;
    alan2_id INTEGER;
    alan3_id INTEGER;
BEGIN
    SELECT id, alan_id INTO ogretmen1_id, alan1_id FROM ogretmenler WHERE ad = 'Ahmet' AND soyad = 'YILMAZ';
    SELECT id, alan_id INTO ogretmen2_id, alan2_id FROM ogretmenler WHERE ad = 'Ayşe' AND soyad = 'DEMİR';  
    SELECT id, alan_id INTO ogretmen3_id, alan3_id FROM ogretmenler WHERE ad = 'Mehmet' AND soyad = 'KAYA';

    INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) 
    SELECT '11-A Bilgisayar Programcılığı', alan1_id, ogretmen1_id
    WHERE NOT EXISTS (SELECT 1 FROM siniflar WHERE sinif_adi = '11-A Bilgisayar Programcılığı');

    INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) 
    SELECT '12-A Bilgisayar Programcılığı', alan1_id, ogretmen1_id
    WHERE NOT EXISTS (SELECT 1 FROM siniflar WHERE sinif_adi = '12-A Bilgisayar Programcılığı');

    INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) 
    SELECT '11-B Elektrik-Elektronik', alan2_id, ogretmen2_id
    WHERE NOT EXISTS (SELECT 1 FROM siniflar WHERE sinif_adi = '11-B Elektrik-Elektronik');

    INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) 
    SELECT '12-B Elektrik-Elektronik', alan2_id, ogretmen2_id
    WHERE NOT EXISTS (SELECT 1 FROM siniflar WHERE sinif_adi = '12-B Elektrik-Elektronik');

    INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) 
    SELECT '11-C Makine Teknolojisi', alan3_id, ogretmen3_id
    WHERE NOT EXISTS (SELECT 1 FROM siniflar WHERE sinif_adi = '11-C Makine Teknolojisi');

END $$;

-- 6. Öğrenciler (dinamik olarak ekle)
DO $$
DECLARE
    sinif1_id INTEGER;
    sinif2_id INTEGER;
    sinif3_id INTEGER;
    sinif4_id INTEGER;
    sinif5_id INTEGER;
    isletme1_id INTEGER;
    isletme2_id INTEGER;
    isletme3_id INTEGER;
    isletme4_id INTEGER;
    isletme5_id INTEGER;
BEGIN
    SELECT id INTO sinif1_id FROM siniflar WHERE sinif_adi = '11-A Bilgisayar Programcılığı' LIMIT 1;
    SELECT id INTO sinif2_id FROM siniflar WHERE sinif_adi = '12-A Bilgisayar Programcılığı' LIMIT 1;
    SELECT id INTO sinif3_id FROM siniflar WHERE sinif_adi = '11-B Elektrik-Elektronik' LIMIT 1;
    SELECT id INTO sinif4_id FROM siniflar WHERE sinif_adi = '12-B Elektrik-Elektronik' LIMIT 1;
    SELECT id INTO sinif5_id FROM siniflar WHERE sinif_adi = '11-C Makine Teknolojisi' LIMIT 1;
    
    SELECT id INTO isletme1_id FROM isletmeler WHERE ad = 'TeknoSoft Yazılım A.Ş.' LIMIT 1;
    SELECT id INTO isletme2_id FROM isletmeler WHERE ad = 'ElektroTek Ltd. Şti.' LIMIT 1;
    SELECT id INTO isletme3_id FROM isletmeler WHERE ad = 'MakTek Endüstri' LIMIT 1;
    SELECT id INTO isletme4_id FROM isletmeler WHERE ad = 'OtoServis Plus' LIMIT 1;
    SELECT id INTO isletme5_id FROM isletmeler WHERE ad = 'YapıMar İnşaat' LIMIT 1;

    -- Öğrenci ekleme (sadece yoksa)
    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Emre', 'AKKAN', '2024001', '0555 111 1111', sinif1_id, isletme1_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024001');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Zeynep', 'VURAL', '2024002', '0555 222 2222', sinif1_id, isletme1_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024002');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Burak', 'TEKİN', '2024003', '0555 333 3333', sinif2_id, isletme1_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024003');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Selin', 'KORKMAZ', '2024004', '0555 444 4444', sinif3_id, isletme2_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024004');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Murat', 'ARSLAN', '2024005', '0555 555 5555', sinif3_id, isletme2_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024005');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Elif', 'ÇETİN', '2024006', '0555 666 6666', sinif4_id, isletme3_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024006');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Onur', 'KOCAK', '2024007', '0555 777 7777', sinif4_id, isletme3_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024007');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Gizem', 'UYSAL', '2024008', '0555 888 8888', sinif5_id, isletme4_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024008');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Deniz', 'POLAT', '2024009', '0555 999 9999', sinif5_id, isletme4_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024009');

    INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) 
    SELECT 'Can', 'ERDOĞAN', '2024010', '0555 101 0101', sinif1_id, isletme5_id
    WHERE NOT EXISTS (SELECT 1 FROM ogrenciler WHERE ogrenci_no = '2024010');

END $$;

-- 7. Test için güvenlik logları (sadece yoksa ekle)
DO $$
DECLARE
    ogretmen1_id INTEGER;
    ogretmen2_id INTEGER;
    isletme1_id INTEGER;
    isletme2_id INTEGER;
BEGIN
    SELECT id INTO ogretmen1_id FROM ogretmenler WHERE ad = 'Ahmet' AND soyad = 'YILMAZ';
    SELECT id INTO ogretmen2_id FROM ogretmenler WHERE ad = 'Ayşe' AND soyad = 'DEMİR';
    SELECT id INTO isletme1_id FROM isletmeler WHERE ad = 'TeknoSoft Yazılım A.Ş.';
    SELECT id INTO isletme2_id FROM isletmeler WHERE ad = 'ElektroTek Ltd. Şti.';

    -- PIN giriş logları
    INSERT INTO pin_giris_loglari (kullanici_tip, kullanici_id, ip_adresi, user_agent, basarili, hata_mesaji) 
    SELECT 'ogretmen', ogretmen1_id, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', true, NULL
    WHERE NOT EXISTS (SELECT 1 FROM pin_giris_loglari WHERE kullanici_tip = 'ogretmen' AND kullanici_id = ogretmen1_id AND basarili = true);

    INSERT INTO pin_giris_loglari (kullanici_tip, kullanici_id, ip_adresi, user_agent, basarili, hata_mesaji) 
    SELECT 'ogretmen', ogretmen2_id, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', false, 'Yanlış PIN'
    WHERE NOT EXISTS (SELECT 1 FROM pin_giris_loglari WHERE kullanici_tip = 'ogretmen' AND kullanici_id = ogretmen2_id AND basarili = false);

    INSERT INTO pin_giris_loglari (kullanici_tip, kullanici_id, ip_adresi, user_agent, basarili, hata_mesaji) 
    SELECT 'isletme', isletme1_id, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', true, NULL
    WHERE NOT EXISTS (SELECT 1 FROM pin_giris_loglari WHERE kullanici_tip = 'isletme' AND kullanici_id = isletme1_id AND basarili = true);

    INSERT INTO pin_giris_loglari (kullanici_tip, kullanici_id, ip_adresi, user_agent, basarili, hata_mesaji) 
    SELECT 'isletme', isletme2_id, '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', false, 'Yanlış PIN'
    WHERE NOT EXISTS (SELECT 1 FROM pin_giris_loglari WHERE kullanici_tip = 'isletme' AND kullanici_id = isletme2_id AND basarili = false);

END $$;

-- 8. Test için kilitli hesap (Mehmet KAYA'yı kilitle)
DO $$
DECLARE
    ogretmen3_id INTEGER;
BEGIN
    SELECT id INTO ogretmen3_id FROM ogretmenler WHERE ad = 'Mehmet' AND soyad = 'KAYA';
    
    INSERT INTO kilitli_hesaplar (kullanici_tip, kullanici_id, kilitlenme_tarihi, kilitlenme_nedeni, aktif) 
    SELECT 'ogretmen', ogretmen3_id, NOW(), '3 kez yanlış PIN girişi', true
    WHERE NOT EXISTS (SELECT 1 FROM kilitli_hesaplar WHERE kullanici_tip = 'ogretmen' AND kullanici_id = ogretmen3_id AND aktif = true);

END $$;

-- 9. Başarı mesajı
SELECT 'Demo test verileri başarıyla yüklendi! 🎉' as sonuc;

-- Demo notları:
-- ✅ Artık duplicate key hatası olmayacak
-- ✅ İşletme girişi: TeknoSoft (PIN: 1234)
-- ✅ Öğretmen girişi: Ahmet YILMAZ (PIN: 1111)
-- ✅ Kilitli hesap: Mehmet KAYA (PIN: 3333) - güvenlik demo için
-- ✅ Tüm test verileri hazır, demo yapılabilir 