-- Eğitim Yılları Tablosu Oluştur
CREATE TABLE egitim_yillari (
    id BIGSERIAL PRIMARY KEY,
    yil VARCHAR(20) NOT NULL UNIQUE,
    aktif BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Başlangıç verilerini ekle
INSERT INTO egitim_yillari (yil, aktif) VALUES 
('2023-2024', false),
('2024-2025', true),
('2025-2026', false);

-- RLS'yi etkinleştir
ALTER TABLE egitim_yillari ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir politikası
CREATE POLICY "Egitim yillari herkes okuyabilir" ON egitim_yillari
    FOR SELECT USING (true);

-- Authenticated kullanıcılar ekleyebilir/güncelleyebilir
CREATE POLICY "Allow all for authenticated users" ON egitim_yillari
    FOR ALL USING (auth.role() = 'authenticated');

-- Sonucu kontrol et
SELECT * FROM egitim_yillari ORDER BY yil; 