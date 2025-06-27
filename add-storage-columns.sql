-- Dekontlar tablosuna dosya path kolonu ekle
ALTER TABLE dekontlar 
ADD COLUMN IF NOT EXISTS dekont_dosya_path TEXT;

-- Belgeler tablosuna dosya path kolonu ekle  
ALTER TABLE belgeler
ADD COLUMN IF NOT EXISTS dosya_path TEXT;

-- Mevcut kayıtları kontrol et
SELECT 
  'dekontlar' as tablo,
  COUNT(*) as toplam_kayit,
  COUNT(dekont_dosyasi) as dosyali_kayit,
  COUNT(dekont_dosya_path) as path_olan_kayit
FROM dekontlar

UNION ALL

SELECT 
  'belgeler' as tablo,
  COUNT(*) as toplam_kayit,
  COUNT(dosya_url) as dosyali_kayit,
  COUNT(dosya_path) as path_olan_kayit
FROM belgeler; 