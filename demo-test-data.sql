-- Demo Test Verileri - Okul Dekont Sistemi
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Eğitim Yılları
INSERT INTO egitim_yillari (yil, aktif) VALUES 
('2024-2025', true),
('2023-2024', false);

-- 2. Alanlar
INSERT INTO alanlar (ad, aciklama) VALUES 
('Bilgisayar Programcılığı', 'Yazılım geliştirme ve programlama alanı'),
('Elektrik-Elektronik', 'Elektrik tesisatı ve elektronik sistemler'),
('Makine Teknolojisi', 'Makine imalat ve bakım onarım'),
('Otomotiv Teknolojisi', 'Araç bakım onarım ve motor teknolojileri'),
('İnşaat Teknolojisi', 'Yapı inşaat ve teknik resim');

-- 3. İşletmeler
INSERT INTO isletmeler (ad, yetkili_kisi, telefon, adres, pin, alan_id) VALUES 
('TeknoSoft Yazılım A.Ş.', 'Ahmet ÖZKAN', '0532 123 4567', 'Teknokent, Ankara', '1234', 1),
('ElektroTek Ltd. Şti.', 'Mehmet DEMİR', '0533 234 5678', 'Ostim, Ankara', '5678', 2),
('MakTek Endüstri', 'Ayşe YILMAZ', '0534 345 6789', 'İvedik OSB, Ankara', '9999', 3),
('OtoServis Plus', 'Fatma KAYA', '0535 456 7890', 'Siteler, Ankara', '1111', 4),
('YapıMar İnşaat', 'Ali ÇELIK', '0536 567 8901', 'Batıkent, Ankara', '2222', 5);

-- 4. Öğretmenler
INSERT INTO ogretmenler (ad, soyad, telefon, email, pin, alan_id) VALUES 
('Ahmet', 'YILMAZ', '0542 111 1111', 'ahmet.yilmaz@okul.edu.tr', '1111', 1),
('Ayşe', 'DEMİR', '0542 222 2222', 'ayse.demir@okul.edu.tr', '2222', 2),
('Mehmet', 'KAYA', '0542 333 3333', 'mehmet.kaya@okul.edu.tr', '3333', 3),
('Fatma', 'ÖZKAN', '0542 444 4444', 'fatma.ozkan@okul.edu.tr', '4444', 4),
('Ali', 'ŞEN', '0542 555 5555', 'ali.sen@okul.edu.tr', '5555', 5);

-- 5. Sınıflar
INSERT INTO siniflar (sinif_adi, alan_id, ogretmen_id) VALUES 
('11-A Bilgisayar Programcılığı', 1, 1),
('12-A Bilgisayar Programcılığı', 1, 1),
('11-B Elektrik-Elektronik', 2, 2),
('12-B Elektrik-Elektronik', 2, 2),
('11-C Makine Teknolojisi', 3, 3);

-- 6. Öğrenciler
INSERT INTO ogrenciler (ad, soyad, ogrenci_no, telefon, sinif_id, isletme_id) VALUES 
('Emre', 'AKKAN', '2024001', '0555 111 1111', 1, 1),
('Zeynep', 'VURAL', '2024002', '0555 222 2222', 1, 1),
('Burak', 'TEKİN', '2024003', '0555 333 3333', 2, 1),
('Selin', 'KORKMAZ', '2024004', '0555 444 4444', 3, 2),
('Murat', 'ARSLAN', '2024005', '0555 555 5555', 3, 2),
('Elif', 'ÇETİN', '2024006', '0555 666 6666', 4, 3),
('Onur', 'KOCAK', '2024007', '0555 777 7777', 4, 3),
('Gizem', 'UYSAL', '2024008', '0555 888 8888', 5, 4),
('Deniz', 'POLAT', '2024009', '0555 999 9999', 5, 4),
('Can', 'ERDOĞAN', '2024010', '0555 101 0101', 1, 5);

-- 7. Örnek Dekontlar
INSERT INTO dekontlar (ogrenci_id, tarih, baslangic_saati, bitis_saati, aciklama, teorik_puan, uygulama_puan, davranis_puan, devam_puan, durum, olusturan_tip, olusturan_id) VALUES 
(1, '2024-01-15', '08:00', '17:00', 'Web sitesi frontend geliştirme çalışmaları', 85, 90, 95, 100, 'onaylandi', 'isletme', 1),
(1, '2024-01-16', '08:00', '17:00', 'React.js component geliştirme', 88, 92, 95, 100, 'onaylandi', 'isletme', 1),
(2, '2024-01-15', '08:00', '17:00', 'Backend API geliştirme', 82, 85, 90, 100, 'beklemede', 'isletme', 1),
(3, '2024-01-17', '08:00', '16:00', 'Mobil uygulama test çalışmaları', 80, 88, 92, 100, 'beklemede', 'ogretmen', 1),
(4, '2024-01-18', '08:00', '17:00', 'Elektrik pano kurulum çalışması', 75, 82, 88, 100, 'onaylandi', 'isletme', 2),
(5, '2024-01-18', '08:00', '17:00', 'Motor kontrol devresi kurulumu', 78, 85, 90, 100, 'beklemede', 'isletme', 2),
(6, '2024-01-19', '08:00', '17:00', 'CNC tezgah programlama', 85, 88, 85, 100, 'onaylandi', 'isletme', 3),
(7, '2024-01-19', '08:00', '17:00', 'Kaynak işlemleri ve kalite kontrol', 80, 85, 88, 100, 'beklemede', 'ogretmen', 3),
(8, '2024-01-20', '08:00', '17:00', 'Motor bakım ve onarım işlemleri', 82, 88, 92, 100, 'onaylandi', 'isletme', 4),
(9, '2024-01-20', '08:00', '17:00', 'Fren sistemi kontrolü ve ayarı', 85, 90, 95, 100, 'beklemede', 'isletme', 4);

-- 8. Demo için Admin kullanıcısı (şifre: admin123)
INSERT INTO admin_kullanicilar (kullanici_adi, sifre_hash, tam_ad, email, aktif) VALUES 
('admin', '$2b$10$XYZ...', 'Sistem Yöneticisi', 'admin@okul.edu.tr', true);

-- 9. Güvenlik test verileri için bazı PIN giriş logları
INSERT INTO pin_giris_loglari (kullanici_tip, kullanici_id, ip_adresi, user_agent, basarili, hata_mesaji) VALUES 
('ogretmen', 1, '192.168.1.100', 'Mozilla/5.0...', true, NULL),
('ogretmen', 2, '192.168.1.101', 'Mozilla/5.0...', false, 'Yanlış PIN'),
('isletme', 1, '192.168.1.102', 'Mozilla/5.0...', true, NULL),
('isletme', 2, '192.168.1.103', 'Mozilla/5.0...', false, 'Yanlış PIN');

-- 10. Test için bir hesabı kilitli duruma getir
INSERT INTO kilitli_hesaplar (kullanici_tip, kullanici_id, kilitlenme_tarihi, kilitlenme_nedeni, aktif) VALUES 
('ogretmen', 3, NOW(), '3 kez yanlış PIN girişi', true);

-- Demo notları:
-- - İşletme girişi: TeknoSoft (PIN: 1234)
-- - Öğretmen girişi: Ahmet YILMAZ (PIN: 1111)
-- - Admin girişi: admin / admin123
-- - Kilitli hesap: Mehmet KAYA (PIN: 3333) - kilitli
-- - Test için farklı durumlarda dekontlar mevcut
-- - Responsive tasarım test edilebilir
-- - Güvenlik özellikleri demo edilebilir 