-- Supabase Web Arayüzü > SQL Editor'da çalıştırın
-- https://supabase.com/dashboard/project/guqwqbxsfvddwwczwljp/sql

-- Eğitim yılları tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.egitim_yillari (
    id SERIAL PRIMARY KEY,
    yil VARCHAR(20) NOT NULL UNIQUE,
    aktif BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS'i kapat (geçici olarak)
ALTER TABLE public.egitim_yillari DISABLE ROW LEVEL SECURITY;

-- Verileri ekle
INSERT INTO public.egitim_yillari (yil, aktif) VALUES 
('2023-2024', false),
('2024-2025', true),
('2025-2026', false)
ON CONFLICT (yil) DO NOTHING;

-- Kontrol et
SELECT * FROM public.egitim_yillari ORDER BY yil;

-- Öğretmenler tablosuna eksik alanları ekle
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE ogretmenler ADD COLUMN IF NOT EXISTS alan_id bigint REFERENCES alanlar(id);

-- Öğretmenler tablosuna test verisi ekle (email ve telefon bilgileri ile)
UPDATE ogretmenler SET 
  email = 'ali.ozkan@okul.edu.tr',
  telefon = '0532-123-4570',
  alan_id = 4  -- Radyo ve Televizyon
WHERE ad = 'Ali' AND soyad = 'Özkan';

UPDATE ogretmenler SET 
  email = 'ayse.demir@okul.edu.tr',
  telefon = '0532-123-4568',
  alan_id = 2  -- Gazetecilik
WHERE ad = 'Ayşe' AND soyad = 'Demir';

UPDATE ogretmenler SET 
  email = 'fatma.kaya@okul.edu.tr',
  telefon = '0532-123-4569',
  alan_id = 3  -- Halkla İlişkiler
WHERE ad = 'Fatma' AND soyad = 'Kaya';

UPDATE ogretmenler SET 
  email = 'hasan.celik@okul.edu.tr',
  telefon = '0532-123-4572',
  alan_id = 6  -- Sanat Tasarım
WHERE ad = 'Hasan' AND soyad = 'Çelik';

UPDATE ogretmenler SET 
  email = 'mehmet.yilmaz@okul.edu.tr',
  telefon = '0532-123-4567',
  alan_id = 1  -- Bilişim Teknolojileri
WHERE ad = 'Mehmet' AND soyad = 'Yılmaz';

UPDATE ogretmenler SET 
  email = 'zeynep.sahin@okul.edu.tr',
  telefon = '0532-123-4571',
  alan_id = 1  -- Bilişim Teknolojileri
WHERE ad = 'Zeynep' AND soyad = 'Şahin'; 