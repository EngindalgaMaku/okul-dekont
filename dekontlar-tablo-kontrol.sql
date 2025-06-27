-- Dekontlar tablosu yapısını kontrol et
-- Mevcut kolonları görmek için

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dekontlar'
ORDER BY ordinal_position;

-- Tablodaki örnek veriyi kontrol et
SELECT * FROM dekontlar LIMIT 3;

-- Eğer tabloda veri yoksa, örnek veri eklemek için hazır komut:
/*
INSERT INTO dekontlar (staj_id, odeme_tarihi, miktar, onay_durumu, ay) 
VALUES (1, '2025-01-20', 1000.00, 'beklemede', 'Ocak');
*/ 