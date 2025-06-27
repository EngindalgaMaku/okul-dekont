-- ÇALIŞAN DATABASE DÜZELTME SQL'İ
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Önce eksik kolonları ekle
ALTER TABLE isletmeler ADD COLUMN IF NOT EXISTS alan_id INTEGER;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS alan_id INTEGER;
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS sinif_id INTEGER;
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS isletme_id INTEGER;
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS ogrenci_no VARCHAR(20);
ALTER TABLE ogrenciler ADD COLUMN IF NOT EXISTS telefon VARCHAR(15);
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS baslangic_saati TIME;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS bitis_saati TIME;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS teorik_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS uygulama_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS davranis_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS devam_puan INTEGER;
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS olusturan_tip VARCHAR(20);
ALTER TABLE dekontlar ADD COLUMN IF NOT EXISTS olusturan_id INTEGER;

-- 2. Siniflar tablosunu oluştur
CREATE TABLE IF NOT EXISTS siniflar (
    id SERIAL PRIMARY KEY,
    sinif_adi VARCHAR(100) NOT NULL,
    alan_id INTEGER,
    ogretmen_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. PIN giriş logları tablosu
CREATE TABLE IF NOT EXISTS pin_giris_loglari (
    id SERIAL PRIMARY KEY,
    kullanici_tip VARCHAR(20) NOT NULL,
    kullanici_id INTEGER NOT NULL,
    ip_adresi VARCHAR(50),
    user_agent TEXT,
    basarili BOOLEAN NOT NULL,
    hata_mesaji TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Kilitli hesaplar tablosu
CREATE TABLE IF NOT EXISTS kilitli_hesaplar (
    id SERIAL PRIMARY KEY,
    kullanici_tip VARCHAR(20) NOT NULL,
    kullanici_id INTEGER NOT NULL,
    kilitlenme_tarihi TIMESTAMP DEFAULT NOW(),
    kilitlenme_nedeni TEXT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Foreign key'leri güvenli şekilde ekle
DO $$
BEGIN
    -- İşletmeler - Alan ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_isletmeler_alan') THEN
        ALTER TABLE isletmeler ADD CONSTRAINT fk_isletmeler_alan 
        FOREIGN KEY (alan_id) REFERENCES alanlar(id);
    END IF;
    
    -- Öğretmenler - Alan ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_ogretmenler_alan') THEN
        ALTER TABLE ogretmenler ADD CONSTRAINT fk_ogretmenler_alan 
        FOREIGN KEY (alan_id) REFERENCES alanlar(id);
    END IF;
    
    -- Sınıflar - Alan ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_siniflar_alan') THEN
        ALTER TABLE siniflar ADD CONSTRAINT fk_siniflar_alan 
        FOREIGN KEY (alan_id) REFERENCES alanlar(id);
    END IF;
    
    -- Sınıflar - Öğretmen ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_siniflar_ogretmen') THEN
        ALTER TABLE siniflar ADD CONSTRAINT fk_siniflar_ogretmen 
        FOREIGN KEY (ogretmen_id) REFERENCES ogretmenler(id);
    END IF;
    
    -- Öğrenciler - Sınıf ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_ogrenciler_sinif') THEN
        ALTER TABLE ogrenciler ADD CONSTRAINT fk_ogrenciler_sinif 
        FOREIGN KEY (sinif_id) REFERENCES siniflar(id);
    END IF;
    
    -- Öğrenciler - İşletme ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_ogrenciler_isletme') THEN
        ALTER TABLE ogrenciler ADD CONSTRAINT fk_ogrenciler_isletme 
        FOREIGN KEY (isletme_id) REFERENCES isletmeler(id);
    END IF;
    
    -- Dekontlar - Öğrenci ilişkisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_dekontlar_ogrenci') THEN
        ALTER TABLE dekontlar ADD CONSTRAINT fk_dekontlar_ogrenci 
        FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id);
    END IF;
    
END $$;

-- 6. Unique constraint'leri güvenli şekilde ekle
DO $$
BEGIN
    -- Öğrenci no unique
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_ogrenci_no') THEN
        ALTER TABLE ogrenciler ADD CONSTRAINT unique_ogrenci_no UNIQUE (ogrenci_no);
    END IF;
    
    -- Sınıf adı unique
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_sinif_adi') THEN
        ALTER TABLE siniflar ADD CONSTRAINT unique_sinif_adi UNIQUE (sinif_adi);
    END IF;
    
END $$;

-- 7. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_isletmeler_alan ON isletmeler(alan_id);
CREATE INDEX IF NOT EXISTS idx_ogretmenler_alan ON ogretmenler(alan_id);
CREATE INDEX IF NOT EXISTS idx_siniflar_alan ON siniflar(alan_id);
CREATE INDEX IF NOT EXISTS idx_siniflar_ogretmen ON siniflar(ogretmen_id);
CREATE INDEX IF NOT EXISTS idx_ogrenciler_sinif ON ogrenciler(sinif_id);
CREATE INDEX IF NOT EXISTS idx_ogrenciler_isletme ON ogrenciler(isletme_id);
CREATE INDEX IF NOT EXISTS idx_dekontlar_ogrenci ON dekontlar(ogrenci_id);
CREATE INDEX IF NOT EXISTS idx_pin_logs_kullanici ON pin_giris_loglari(kullanici_tip, kullanici_id);

-- 8. Başarı mesajı
SELECT 'Database başarıyla düzeltildi! Artık demo verilerini yükleyebilirsiniz.' as mesaj; 