-- Dekontlar tablosuna 'ay' kolonu ekleme
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

-- Önce mevcut ay kolonu var mı kontrol edelim
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
        
        -- Mevcut kayıtlar için tarih alanından ay bilgisini çıkart ve güncelle
        UPDATE dekontlar 
        SET ay = CASE 
            WHEN EXTRACT(MONTH FROM tarih::date) = 1 THEN 'Ocak'
            WHEN EXTRACT(MONTH FROM tarih::date) = 2 THEN 'Şubat'
            WHEN EXTRACT(MONTH FROM tarih::date) = 3 THEN 'Mart'
            WHEN EXTRACT(MONTH FROM tarih::date) = 4 THEN 'Nisan'
            WHEN EXTRACT(MONTH FROM tarih::date) = 5 THEN 'Mayıs'
            WHEN EXTRACT(MONTH FROM tarih::date) = 6 THEN 'Haziran'
            WHEN EXTRACT(MONTH FROM tarih::date) = 7 THEN 'Temmuz'
            WHEN EXTRACT(MONTH FROM tarih::date) = 8 THEN 'Ağustos'
            WHEN EXTRACT(MONTH FROM tarih::date) = 9 THEN 'Eylül'
            WHEN EXTRACT(MONTH FROM tarih::date) = 10 THEN 'Ekim'
            WHEN EXTRACT(MONTH FROM tarih::date) = 11 THEN 'Kasım'
            WHEN EXTRACT(MONTH FROM tarih::date) = 12 THEN 'Aralık'
        END
        WHERE tarih IS NOT NULL;
        
        RAISE NOTICE 'Dekontlar tablosuna ay kolonu başarıyla eklendi ve mevcut kayıtlar güncellendi.';
    ELSE
        RAISE NOTICE 'Ay kolonu zaten mevcut.';
    END IF;
END
$$; 