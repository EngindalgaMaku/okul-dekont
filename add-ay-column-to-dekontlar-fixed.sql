-- Dekontlar tablosuna 'ay' kolonu ekleme (Düzeltilmiş)
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

DO $$
BEGIN
    -- Eğer ay kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dekontlar' 
        AND column_name = 'ay'
    ) THEN
        ALTER TABLE dekontlar ADD COLUMN ay VARCHAR(20);
        RAISE NOTICE 'Dekontlar tablosuna ay kolonu başarıyla eklendi.';
        
        -- Mevcut kayıtlar için odeme_tarihi alanından ay bilgisini çıkart ve güncelle
        -- (odeme_tarihi NULL olmayan kayıtlar için)
        UPDATE dekontlar 
        SET ay = CASE 
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 1 THEN 'Ocak'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 2 THEN 'Şubat'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 3 THEN 'Mart'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 4 THEN 'Nisan'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 5 THEN 'Mayıs'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 6 THEN 'Haziran'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 7 THEN 'Temmuz'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 8 THEN 'Ağustos'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 9 THEN 'Eylül'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 10 THEN 'Ekim'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 11 THEN 'Kasım'
            WHEN EXTRACT(MONTH FROM odeme_tarihi::date) = 12 THEN 'Aralık'
        END
        WHERE odeme_tarihi IS NOT NULL;
        
        -- Eğer odeme_tarihi NULL ise created_at alanından ay bilgisini çıkart
        UPDATE dekontlar 
        SET ay = CASE 
            WHEN EXTRACT(MONTH FROM created_at::date) = 1 THEN 'Ocak'
            WHEN EXTRACT(MONTH FROM created_at::date) = 2 THEN 'Şubat'
            WHEN EXTRACT(MONTH FROM created_at::date) = 3 THEN 'Mart'
            WHEN EXTRACT(MONTH FROM created_at::date) = 4 THEN 'Nisan'
            WHEN EXTRACT(MONTH FROM created_at::date) = 5 THEN 'Mayıs'
            WHEN EXTRACT(MONTH FROM created_at::date) = 6 THEN 'Haziran'
            WHEN EXTRACT(MONTH FROM created_at::date) = 7 THEN 'Temmuz'
            WHEN EXTRACT(MONTH FROM created_at::date) = 8 THEN 'Ağustos'
            WHEN EXTRACT(MONTH FROM created_at::date) = 9 THEN 'Eylül'
            WHEN EXTRACT(MONTH FROM created_at::date) = 10 THEN 'Ekim'
            WHEN EXTRACT(MONTH FROM created_at::date) = 11 THEN 'Kasım'
            WHEN EXTRACT(MONTH FROM created_at::date) = 12 THEN 'Aralık'
        END
        WHERE odeme_tarihi IS NULL AND created_at IS NOT NULL AND ay IS NULL;
        
        RAISE NOTICE 'Mevcut kayıtlar için ay bilgisi güncellendi.';
    ELSE
        RAISE NOTICE 'Ay kolonu zaten mevcut.';
    END IF;
END
$$; 