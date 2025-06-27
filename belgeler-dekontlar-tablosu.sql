-- Belgeler tablosu oluştur
CREATE TABLE IF NOT EXISTS belgeler (
    id SERIAL PRIMARY KEY,
    isletme_id INTEGER REFERENCES isletmeler(id) ON DELETE CASCADE,
    ad VARCHAR(255) NOT NULL,
    tur VARCHAR(100) NOT NULL,
    dosya_url TEXT NOT NULL,
    yukleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dekontlar tablosu oluştur
CREATE TABLE IF NOT EXISTS dekontlar (
    id SERIAL PRIMARY KEY,
    isletme_id INTEGER REFERENCES isletmeler(id) ON DELETE CASCADE,
    tarih DATE NOT NULL,
    aciklama TEXT NOT NULL,
    tutar DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) politikaları ekle
ALTER TABLE belgeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE dekontlar ENABLE ROW LEVEL SECURITY;

-- Anonymous kullanıcılar için okuma izni
CREATE POLICY "Allow anonymous read access" ON belgeler FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON dekontlar FOR SELECT USING (true);

-- Anonymous kullanıcılar için yazma izni
CREATE POLICY "Allow anonymous insert access" ON belgeler FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access" ON dekontlar FOR INSERT WITH CHECK (true);

-- Anonymous kullanıcılar için güncelleme izni  
CREATE POLICY "Allow anonymous update access" ON belgeler FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON dekontlar FOR UPDATE USING (true);

-- Anonymous kullanıcılar için silme izni
CREATE POLICY "Allow anonymous delete access" ON belgeler FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON dekontlar FOR DELETE USING (true);

-- Supabase Storage bucket'ı oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('belgeler', 'belgeler', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy'leri ekle
CREATE POLICY "Anyone can view belgeler" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'belgeler');

CREATE POLICY "Anyone can upload belgeler" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'belgeler');

CREATE POLICY "Anyone can update belgeler" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'belgeler');

CREATE POLICY "Anyone can delete belgeler" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'belgeler'); 