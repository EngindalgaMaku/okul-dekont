# Okul Dekont Sistemi - Hüsniye Özdilek MTAL

Bu proje, Hüsniye Özdilek Ticaret Mesleki ve Teknik Anadolu Lisesi'nin 12. sınıf öğrencilerinin mesleki eğitim stajları ve dekont işlemlerini yönetmek için geliştirilmiş bir web uygulamasıdır.

## 🎯 Proje Amacı

12. sınıf öğrencileri, okul döneminde işletmelerde beceri eğitimi dersi kapsamında haftanın 3 günü staj yapmaktadır. Bu uygulamayla:
- Öğrenci-işletme eşleştirmeleri yapılabilir
- İşletmelerin ödediği maaş dekontları kolayca takip edilebilir
- Devlet katkı payı süreçleri yönetilebilir

## 🏗️ Teknolojiler

- **Frontend**: Next.js 14 + TypeScript
- **Veritabanı**: Supabase (PostgreSQL)
- **Stil**: Tailwind CSS
- **İkonlar**: Lucide React

## 📊 Sistem Modülleri

### 1. Alanlar Yönetimi
- 6 farklı mesleki eğitim alanı
- Alan bilgilerini düzenleme

### 2. Öğretmenler Yönetimi
- Alan öğretmenlerinin kaydı
- İletişim bilgileri

### 3. İşletmeler Yönetimi
- Staj yapılan işletmelerin kaydı
- Yetkili kişi ve iletişim bilgileri
- Vergi numarası takibi

### 4. Öğrenciler Yönetimi
- 12. sınıf öğrenci kayıtları
- Alan bazında sınıflandırma
- Veli bilgileri

### 5. Staj Takibi
- Öğrenci-işletme eşleştirmeleri
- Staj başlangıç/bitiş tarihleri
- Durum takibi (aktif/tamamlandı/iptal)

### 6. Dekont Yönetimi
- Maaş dekontlarının yüklenmesi
- Onay süreçleri
- Ödeme takibi

## 🚀 Kurulum

1. **Projeyi klonlayın:**
```bash
git clone [repo-url]
cd okul-dekont-sistemi
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın:**
```bash
cp env.example .env.local
```

`env.example` dosyasındaki Supabase bilgilerinizi `.env.local` dosyasına ekleyin.

4. **Supabase veritabanını kurun:**
Aşağıdaki SQL komutlarını Supabase SQL editöründe çalıştırın:

```sql
-- Alanlar tablosu
CREATE TABLE alanlar (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  aciklama TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Öğretmenler tablosu
CREATE TABLE ogretmenler (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(50) NOT NULL,
  soyad VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefon VARCHAR(20),
  alan_id INTEGER REFERENCES alanlar(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- İşletmeler tablosu
CREATE TABLE isletmeler (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(200) NOT NULL,
  yetkili_kisi VARCHAR(100) NOT NULL,
  telefon VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  adres TEXT NOT NULL,
  vergi_no VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Öğrenciler tablosu
CREATE TABLE ogrenciler (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(50) NOT NULL,
  soyad VARCHAR(50) NOT NULL,
  tc_no VARCHAR(11) UNIQUE NOT NULL,
  telefon VARCHAR(20),
  email VARCHAR(100),
  alan_id INTEGER REFERENCES alanlar(id),
  sinif VARCHAR(10) NOT NULL,
  veli_adi VARCHAR(100),
  veli_telefon VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stajlar tablosu
CREATE TABLE stajlar (
  id SERIAL PRIMARY KEY,
  ogrenci_id INTEGER REFERENCES ogrenciler(id),
  isletme_id INTEGER REFERENCES isletmeler(id),
  baslangic_tarihi DATE NOT NULL,
  bitis_tarihi DATE NOT NULL,
  durum VARCHAR(20) DEFAULT 'aktif' CHECK (durum IN ('aktif', 'tamamlandi', 'iptal')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dekontlar tablosu
CREATE TABLE dekontlar (
  id SERIAL PRIMARY KEY,
  staj_id INTEGER REFERENCES stajlar(id),
  miktar DECIMAL(10,2) NOT NULL,
  odeme_tarihi DATE NOT NULL,
  dekont_dosyasi TEXT,
  onay_durumu VARCHAR(20) DEFAULT 'bekliyor' CHECK (onay_durumu IN ('bekliyor', 'onaylandi', 'reddedildi')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Örnek veri ekleme
INSERT INTO alanlar (ad, aciklama) VALUES 
('Bilişim Teknolojileri', 'Bilgisayar programcılığı ve web tasarımı'),
('Elektrik-Elektronik', 'Elektrik tesisatı ve elektronik sistemler'),
('Makine Teknolojisi', 'CNC ve genel makine imalatı'),
('Otomotiv', 'Otomobil bakım ve onarımı'),
('Muhasebe ve Finans', 'Muhasebe ve mali işler'),
('Pazarlama ve Satış', 'Mağaza satış ve müşteri hizmetleri');
```

5. **Uygulamayı başlatın:**
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📱 Özellikler

### ✅ Tamamlanan Özellikler
- Modern ve responsive tasarım
- Ana dashboard ile istatistikler
- Modüler yapı (Alanlar, Öğretmenler, İşletmeler vb.)

### 🔄 Geliştirme Aşamasında
- CRUD operasyonları
- Dosya yükleme sistemi
- Rapor alma modülü
- E-posta bildirimleri

### 📋 Planlanan Özellikler
- Mobil uygulama desteği
- QR kod ile dekont doğrulama
- Otomatik katkı payı hesaplama
- Excel/PDF rapor çıktıları

## 🔐 Güvenlik

- Supabase Row Level Security (RLS) kullanılmıştır
- Kullanıcı rolleri ve yetkilendirme sistemi
- Hassas verilerin şifrelenmesi

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için: [okul email adresi]

---

**Hüsniye Özdilek Ticaret Mesleki ve Teknik Anadolu Lisesi** için geliştirilmiştir. 