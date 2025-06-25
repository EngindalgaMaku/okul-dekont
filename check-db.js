const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://guqwqbxsfvddwwczwljp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cXdxYnhzZnZkZHd3Y3p3bGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODk0NjAsImV4cCI6MjA2NjI2NTQ2MH0.M9DmYt3TcUiM50tviy8P4DhgTlADVjPEZBX8CNCpQOs'
);

async function checkData() {
  console.log('Veritabanı bağlantısı kontrol ediliyor...');
  
  // İşletmeler tablosunu kontrol et
  console.log('\n=== İŞLETMELER ===');
  const { data: isletmeler, error: isletmeError } = await supabase
    .from('isletmeler')
    .select('*');
  
  if (isletmeError) {
    console.error('İşletmeler hatası:', isletmeError);
  } else {
    console.log('İşletme sayısı:', isletmeler?.length || 0);
    isletmeler?.forEach(i => console.log(`- ${i.ad} (${i.yetkili_kisi})`));
  }

  // Diğer tabloları da kontrol et
  console.log('\n=== ALANLAR ===');
  const { data: alanlar, error: alanError } = await supabase
    .from('alanlar')
    .select('*');
  
  if (alanError) {
    console.error('Alanlar hatası:', alanError);
  } else {
    console.log('Alan sayısı:', alanlar?.length || 0);
  }

  console.log('\n=== ÖĞRENCİLER ===');
  const { data: ogrenciler, error: ogrenciError } = await supabase
    .from('ogrenciler')
    .select('*');
  
  if (ogrenciError) {
    console.error('Öğrenciler hatası:', ogrenciError);
  } else {
    console.log('Öğrenci sayısı:', ogrenciler?.length || 0);
  }
}

checkData(); 