-- Create isletme_belgeleri table
CREATE TABLE IF NOT EXISTS isletme_belgeleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isletme_id UUID NOT NULL REFERENCES isletmeler(id) ON DELETE CASCADE,
  ogretmen_id UUID NOT NULL REFERENCES ogretmenler(id) ON DELETE CASCADE,
  dosya_url TEXT NOT NULL,
  aciklama TEXT NOT NULL,
  yuklenme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE isletme_belgeleri ENABLE ROW LEVEL SECURITY;

-- Allow teachers to view their own documents
CREATE POLICY "Teachers can view their own documents"
  ON isletme_belgeleri
  FOR SELECT
  TO authenticated
  USING (
    ogretmen_id = auth.uid()
  );

-- Allow teachers to insert documents
CREATE POLICY "Teachers can insert documents"
  ON isletme_belgeleri
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ogretmen_id = auth.uid()
  );

-- Allow teachers to update their own documents
CREATE POLICY "Teachers can update their own documents"
  ON isletme_belgeleri
  FOR UPDATE
  TO authenticated
  USING (
    ogretmen_id = auth.uid()
  )
  WITH CHECK (
    ogretmen_id = auth.uid()
  );

-- Allow teachers to delete their own documents
CREATE POLICY "Teachers can delete their own documents"
  ON isletme_belgeleri
  FOR DELETE
  TO authenticated
  USING (
    ogretmen_id = auth.uid()
  ); 