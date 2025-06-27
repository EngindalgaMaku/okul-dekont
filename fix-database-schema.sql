-- Database Schema Düzeltme ve Güncelleme
-- Bu dosyayı önce çalıştırın, sonra demo verilerini yükleyin

-- 1. Mevcut tablo yapılarını kontrol edelim
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('isletmeler', 'ogretmenler', 'siniflar', 'ogrenciler', 'dekontlar')
ORDER BY table_name, ordinal_position;

-- 2. İşletmeler tablosuna eksik kolonlar
ALTER TABLE isletmeler ADD COLUMN IF NOT EXISTS alan_id INTEGER;
ALTER TABLE isletmeler ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE isletmeler ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Öğretmenler tablosuna eksik kolonlar
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS alan_id INTEGER;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 4. Sınıflar tablosunu kontrol et ve gerekirse oluştur
CREATE TABLE IF NOT EXISTS siniflar (
    id SERIAL PRIMARY KEY,
    sinif_adi VARCHAR(100) NOT NULL UNIQUE,
    alan_id INTEGER REFERENCES alanlar(id),
    ogretmen_id INTEGER REFERENCES ogretmenler(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Öğrenciler tablosuna eksik kolonlar
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS sinif_id INTEGER;
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS isletme_id INTEGER;
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS ogrenci_no VARCHAR(20);
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS telefon VARCHAR(15);

-- 6. Dekontlar tablosuna eksik kolonlar
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS baslangic_saati TIME;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS bitis_saati TIME;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS teorik_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS uygulama_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS davranis_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS devam_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS olusturan_tip VARCHAR(20);
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS olusturan_id INTEGER;

-- 7. PIN giriş logları tablosunu oluştur
CREATE TABLE IF NOT EXISTS pin_giris_loglari (
    id SERIAL PRIMARY KEY,
    kullanici_tip VARCHAR(20) NOT NULL, -- 'ogretmen' veya 'isletme'
    kullanici_id INTEGER NOT NULL,
    ip_adresi INET,
    user_agent TEXT,
    basarili BOOLEAN NOT NULL,
    hata_mesaji TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Kilitli hesaplar tablosunu oluştur
CREATE TABLE IF NOT EXISTS kilitli_hesaplar (
    id SERIAL PRIMARY KEY,
    kullanici_tip VARCHAR(20) NOT NULL, -- 'ogretmen' veya 'isletme'
    kullanici_id INTEGER NOT NULL,
    kilitlenme_tarihi TIMESTAMP DEFAULT NOW(),
    kilitlenme_nedeni TEXT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Admin kullanıcıları tablosunu oluştur
CREATE TABLE IF NOT EXISTS admin_kullanicilar (
    id SERIAL PRIMARY KEY,
    kullanici_adi VARCHAR(50) UNIQUE NOT NULL,
    sifre_hash VARCHAR(255) NOT NULL,
    tam_ad VARCHAR(100),
    email VARCHAR(100),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Foreign key kısıtlamalarını ekle
ALTER TABLE isletmeler ADD CONSTRAINT IF NOT EXISTS fk_isletmeler_alan 
    FOREIGN KEY (alan_id) REFERENCES alanlar(id);

ALTER TABLE ogretmenler ADD CONSTRAINT IF NOT EXISTS fk_ogretmenler_alan 
    FOREIGN KEY (alan_id) REFERENCES alanlar(id);

ALTER TABLE siniflar ADD CONSTRAINT IF NOT EXISTS fk_siniflar_alan 
    FOREIGN KEY (alan_id) REFERENCES alanlar(id);

ALTER TABLE siniflar ADD CONSTRAINT IF NOT EXISTS fk_siniflar_ogretmen 
    FOREIGN KEY (ogretmen_id) REFERENCES ogretmenler(id);

ALTER TABLE ogrenciler ADD CONSTRAINT IF NOT EXISTS fk_ogrenciler_sinif 
    FOREIGN KEY (sinif_id) REFERENCES siniflar(id);

ALTER TABLE ogrenciler ADD CONSTRAINT IF NOT EXISTS fk_ogrenciler_isletme 
    FOREIGN KEY (isletme_id) REFERENCES isletmeler(id);

ALTER TABLE dekontlar ADD CONSTRAINT IF NOT EXISTS fk_dekontlar_ogrenci 
    FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id);

-- 11. İndeksleri ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_isletmeler_alan ON isletmeler(alan_id);
CREATE INDEX IF NOT EXISTS idx_ogretmenler_alan ON ogretmenler(alan_id);
CREATE INDEX IF NOT EXISTS idx_siniflar_alan ON siniflar(alan_id);
CREATE INDEX IF NOT EXISTS idx_siniflar_ogretmen ON siniflar(ogretmen_id);
CREATE INDEX IF NOT EXISTS idx_ogrenciler_sinif ON ogrenciler(sinif_id);
CREATE INDEX IF NOT EXISTS idx_ogrenciler_isletme ON ogrenciler(isletme_id);
CREATE INDEX IF NOT EXISTS idx_dekontlar_ogrenci ON dekontlar(ogrenci_id);
CREATE INDEX IF NOT EXISTS idx_pin_logs_kullanici ON pin_giris_loglari(kullanici_tip, kullanici_id);
CREATE INDEX IF NOT EXISTS idx_kilitli_hesaplar_kullanici ON kilitli_hesaplar(kullanici_tip, kullanici_id);

-- 12. Unique kısıtlamaları ekle
ALTER TABLE ogrenciler ADD CONSTRAINT IF NOT EXISTS unique_ogrenci_no UNIQUE (ogrenci_no);

-- 13. Check kısıtlamaları ekle (veri bütünlüğü için)
ALTER TABLE dekontlar ADD CONSTRAINT IF NOT EXISTS check_puanlar_gecerli 
    CHECK (teorik_puan >= 0 AND teorik_puan <= 100 AND 
           uygulama_puan >= 0 AND uygulama_puan <= 100 AND
           davranis_puan >= 0 AND davranis_puan <= 100 AND
           devam_puan >= 0 AND devam_puan <= 100);

ALTER TABLE dekontlar ADD CONSTRAINT IF NOT EXISTS check_olusturan_tip 
    CHECK (olusturan_tip IN ('ogretmen', 'isletme'));

ALTER TABLE pin_giris_loglari ADD CONSTRAINT IF NOT EXISTS check_kullanici_tip_pin 
    CHECK (kullanici_tip IN ('ogretmen', 'isletme'));

ALTER TABLE kilitli_hesaplar ADD CONSTRAINT IF NOT EXISTS check_kullanici_tip_kilit 
    CHECK (kullanici_tip IN ('ogretmen', 'isletme'));

-- 14. Başarı mesajı
SELECT 'Database schema başarıyla güncellendi! ✅' as sonuc,
       'Artık demo verilerini yükleyebilirsiniz!' as bilgi; 