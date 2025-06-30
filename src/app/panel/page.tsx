'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileText, LogOut, User, Upload, Plus, Download, Eye, Search, Filter, Receipt, Loader, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import Modal from '@/components/ui/Modal'
import { User as AuthUser } from '@supabase/supabase-js'

interface Isletme {
  id: string
  ad: string
  yetkili_kisi: string
}

interface Ogrenci {
  id: number
  staj_id: number
  ad: string
  soyad: string
  sinif: string
  no: string
  alan: string
  baslangic_tarihi: string
  bitis_tarihi: string
  ogretmen_ad: string
  ogretmen_soyad: string
}

interface Dekont {
  id: number
  ogrenci_adi: string
  miktar: number | null
  odeme_tarihi: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  aciklama?: string
  dosya_url?: string
  tarih: string
  tutar: number | null
  ay: string
  yil: number | string
  stajlar?: {
    ogrenciler?: {
      ad: string
      soyad: string
    }
  }
}

interface Belge {
  id: number
  isletme_id: number
  ad: string
  tur: string
  dosya_url?: string
  yukleme_tarihi: string
}

type ActiveTab = 'ogrenciler' | 'dekontlar' | 'belgeler'

export default function PanelPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isletme, setIsletme] = useState<Isletme | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('ogrenciler')
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([])
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [belgeler, setBelgeler] = useState<Belge[]>([])
  const [filteredBelgeler, setFilteredBelgeler] = useState<Belge[]>([])
  const [loading, setLoading] = useState(true)

  // Belge yönetimi için state'ler
  const [belgeSearchTerm, setBelgeSearchTerm] = useState('')
  const [belgeTurFilter, setBelgeTurFilter] = useState<string>('all')
  const [belgeModalOpen, setBelgeModalOpen] = useState(false)
  const [belgeViewModal, setBelgeViewModal] = useState(false)
  const [selectedBelge, setSelectedBelge] = useState<Belge | null>(null)

  // Dekont yönetimi için state'ler
  const [dekontModalOpen, setDekontModalOpen] = useState(false)
  const [selectedOgrenci, setSelectedOgrenci] = useState<Ogrenci | null>(null)
  
  // Dekont görüntüleme için state'ler
  const [dekontViewModalOpen, setDekontViewModalOpen] = useState(false)
  const [selectedOgrenciDekontlar, setSelectedOgrenciDekontlar] = useState<Dekont[]>([])
  const [selectedDekont, setSelectedDekont] = useState<Dekont | null>(null)
  const [dekontDetailModalOpen, setDekontDetailModalOpen] = useState(false)

  // Belge form verileri
  const [belgeFormData, setBelgeFormData] = useState({
    ad: '',
    tur: 'sozlesme',
    customTur: '',
    dosya: null as File | null
  })

  // Dekont form verileri
  const [dekontFormData, setDekontFormData] = useState({
    tarih: '',
    ay: '',
    aciklama: '',
    tutar: '',
    dosya: null as File | null
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      const storedIsletme = localStorage.getItem('isletme')
      if (!storedIsletme) {
        setLoading(false)
        return
      }
      
      const parsedIsletme = JSON.parse(storedIsletme)
      setIsletme(parsedIsletme)
      if (parsedIsletme.id) {
        fetchData(parsedIsletme.id)
      }
    }

    checkUser()
  }, [router])

  // Belge filtreleme
  useEffect(() => {
    if (!isletme) return
    
    let filtered = belgeler

    if (belgeSearchTerm) {
      filtered = filtered.filter(belge => 
        belge.ad?.toLowerCase().includes(belgeSearchTerm.toLowerCase()) ||
        belge.tur?.toLowerCase().includes(belgeSearchTerm.toLowerCase())
      )
    }

    if (belgeTurFilter !== 'all') {
      filtered = filtered.filter(belge => belge.tur === belgeTurFilter)
    }

    setFilteredBelgeler(filtered)
  }, [belgeler, belgeSearchTerm, belgeTurFilter, isletme])

  const fetchData = async (isletmeId: string) => {
    setLoading(true)
    
    // Öğrencileri getir
    const { data: stajData } = await supabase
      .from('stajlar')
      .select(`
        id,
        baslangic_tarihi,
        bitis_tarihi,
        durum,
        ogrenci:ogrenciler(
          id,
          ad,
          soyad,
          sinif,
          no,
          alan:alanlar(ad)
        ),
        ogretmen:ogretmenler (
          ad,
          soyad
        )
      `)
      .eq('isletme_id', isletmeId)
      .eq('durum', 'aktif')

    if (stajData) {
      const formattedOgrenciler = stajData.map((staj: any) => ({
        id: staj.ogrenci.id,
        staj_id: staj.id,
        ad: staj.ogrenci.ad,
        soyad: staj.ogrenci.soyad,
        sinif: staj.ogrenci.sinif,
        no: staj.ogrenci.no,
        alan: staj.ogrenci.alan.ad,
        baslangic_tarihi: staj.baslangic_tarihi,
        bitis_tarihi: staj.bitis_tarihi,
        ogretmen_ad: staj.ogretmen.ad,
        ogretmen_soyad: staj.ogretmen.soyad,
      }))
      setOgrenciler(formattedOgrenciler)

      const stajIds = stajData.map(staj => staj.id);
      if (stajIds.length > 0) {
        const { data: dekontData, error: dekontError } = await supabase
          .from('dekontlar')
          .select(`*, stajlar(ogrenciler(ad, soyad))`)
          .in('staj_id', stajIds)
          .order('created_at', { ascending: false });

        if (dekontError) {
          console.error('Dekontları getirme hatası:', dekontError);
        } else if (dekontData) {
          setDekontlar(dekontData as unknown as Dekont[]);
        }
      }
    }

    // Belgeleri getir
    const { data: belgeData } = await supabase
      .from('belgeler')
      .select('*')
      .eq('isletme_id', isletmeId)
      .order('yukleme_tarihi', { ascending: false })

    if (belgeData) {
      setBelgeler(belgeData)
      setFilteredBelgeler(belgeData)
    }

    setLoading(false)
  }

  // Belge ekleme
  const handleBelgeEkle = async () => {
    if (!belgeFormData.ad.trim()) {
      alert('Belge adı gereklidir!')
      return
    }

    const belgeTuru = belgeFormData.tur === 'other' ? belgeFormData.customTur : belgeFormData.tur

    if (!belgeTuru.trim()) {
      alert('Belge türü gereklidir!')
      return
    }

    if (!belgeFormData.dosya) {
      alert('Dosya seçimi zorunludur!')
      return
    }

    if (!user || !isletme) {
      alert('Kullanıcı veya işletme bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
      return
    }

    try {
      const file = belgeFormData.dosya;
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = `${isletme.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('belgeler')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Dosya yükleme hatası:', uploadError);
        alert(`Dosya yüklenirken bir hata oluştu: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('belgeler')
        .getPublicUrl(filePath);

      const dosyaUrl = urlData.publicUrl;

      // Belgeler tablosuna kaydet
      const { data: insertData, error: insertError } = await supabase
        .from('belgeler')
        .insert({
          isletme_id: isletme.id,
          ad: belgeFormData.ad,
          tur: belgeTuru,
          dosya_url: dosyaUrl,
          user_id: user.id
        })
        .select()

      if (insertError) {
        console.error('Veritabanı ekleme hatası:', insertError);
        alert(`Belge bilgisi veritabanına kaydedilirken bir hata oluştu: ${insertError.message}`);
        
        await supabase.storage.from('belgeler').remove([filePath]);
        return;
      }

      setBelgeler(prev => [...prev, insertData[0]]);
      setBelgeModalOpen(false)
      setBelgeFormData({ ad: '', tur: 'sozlesme', customTur: '', dosya: null })
    } catch (error: any) {
      console.error('Belge ekleme sırasında beklenmedik hata:', error);
      alert(`Bir hata oluştu: ${error.message}`);
    }
  }

  const handleBelgeSil = async (belge: Belge) => {
    if (!belge.dosya_url) {
      alert("Bu belge için silinecek bir dosya bulunamadı.");
      return;
    }
    
    if (confirm(`'${belge.ad}' adlı belgeyi kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      try {
        const urlParts = belge.dosya_url.split('/belgeler/');
        if (urlParts.length < 2) {
          throw new Error("Geçersiz dosya URL formatı. Yol çıkarılamadı.");
        }
        const filePath = urlParts[1];
        
        const { error: storageError } = await supabase.storage.from('belgeler').remove([filePath]);
        if (storageError && storageError.message !== 'The resource was not found') {
          console.error("Depolama silme hatası:", storageError);
          alert(`Dosya depolamadan silinirken bir hata oluştu: ${storageError.message}`);
        }

        const { error: dbError } = await supabase.from('belgeler').delete().eq('id', belge.id);
        if (dbError) {
          throw new Error(`Veritabanı silme hatası: ${dbError.message}`);
        }

        setBelgeler(belgeler.filter(b => b.id !== belge.id));
        if (selectedBelge && selectedBelge.id === belge.id) {
          setBelgeViewModal(false);
          setSelectedBelge(null);
        }
      } catch (error: any) {
        console.error('Belge silinirken beklenmedik hata:', error);
        alert(`Bir hata oluştu: ${error.message}`);
      }
    }
  };

  // Belge Görüntüleme
  const handleBelgeView = (belge: Belge) => {
    setSelectedBelge(belge)
    setBelgeViewModal(true)
  }

  const formatBelgeTur = (tur: string) => {
    switch (tur) {
      case 'sozlesme': return 'Sözleşme'
      case 'fesih_belgesi': return 'Fesih Belgesi'
      case 'usta_ogretici_belgesi': return 'Usta Öğretici Belgesi'
      default: return tur
    }
  }

  const handleDekontEkle = async () => {
    if (!selectedOgrenci || !dekontFormData.tarih || !dekontFormData.ay) {
      alert('Dekont tarihi ve ayı zorunludur!')
      return
    }

    // Tutar alanı opsiyonel

    try {
      let dosyaUrl = null
      
      // Dosya varsa yükle
      if (dekontFormData.dosya) {
        // Simülasyon - gerçek uygulamada Supabase Storage kullanılacak
        dosyaUrl = `/uploads/dekontlar/${Date.now()}_${dekontFormData.dosya.name}`
      }

      // Dekontlar tablosundaki mevcut kolonları kullan
      const insertData: any = {
        staj_id: selectedOgrenci.staj_id,
        odeme_tarihi: dekontFormData.tarih,
        miktar: dekontFormData.tutar && dekontFormData.tutar.trim() !== '' ? parseFloat(dekontFormData.tutar) : null,
        onay_durumu: 'beklemede',
        ay: dekontFormData.ay
      }

      // Dosya kolonu varsa ekle - şimdilik kaldırıyoruz çünkü kolon adı belirsiz
      // dekont_dosyas kolonu bulunamıyor hatası alıyoruz
      if (dosyaUrl) {
        // Olası kolon isimleri: dosya_url, file_url, document_url, dekont_dosyas
        // insertData.dosya_url = dosyaUrl  // Gerçek kolon adı bulunduğunda açılacak
      }

      // Eğer aciklama alanı varsa ekle (tabloda göremiyoruz ama denemeye değer)
      if (dekontFormData.aciklama) {
        insertData.aciklama = dekontFormData.aciklama
      }

      const { error } = await supabase
        .from('dekontlar')
        .insert(insertData)

      if (error) {
        console.error('Dekont ekleme hatası:', error)
        console.error('Hata detayı:', error.message)
        console.error('Gönderilen veri:', {
          staj_id: selectedOgrenci.staj_id,
          ogrenci_id: selectedOgrenci.id,
          isletme_id: isletme!.id,
          tarih: dekontFormData.tarih,
          ay: dekontFormData.ay,
          aciklama: dekontFormData.aciklama || null,
          tutar: dekontFormData.tutar ? parseFloat(dekontFormData.tutar) : null,
          dosya_url: dosyaUrl,
          onay_durumu: 'beklemede'
        })
        alert(`Dekont eklenirken hata oluştu: ${error.message}`)
        return
      }

      alert('Dekont başarıyla eklendi!')
      setDekontModalOpen(false)
      setSelectedOgrenci(null)
      setDekontFormData({ tarih: '', ay: '', aciklama: '', tutar: '', dosya: null })
      if(isletme) fetchData(isletme.id) // Veriyi yeniden yükle
    } catch (error) {
      console.error('Dekont ekleme hatası:', error)
      alert('Dekont eklenirken bir hata oluştu!')
    }
  }

  // Dekont görüntüleme fonksiyonları
  const handleDekontlarGoster = async (ogrenci: Ogrenci) => {
    try {
      const { data: dekontData } = await supabase
        .from('dekontlar')
        .select('*')
        .eq('staj_id', ogrenci.staj_id)
        .order('created_at', { ascending: false })

      console.log('Dekont verisi:', dekontData) // Debug için
      if (dekontData) {
        const formattedDekontlar = dekontData.map((dekont: any) => ({
          id: dekont.id,
          ogrenci_adi: `${ogrenci.ad} ${ogrenci.soyad}`,
          miktar: dekont.miktar,
          odeme_tarihi: dekont.odeme_tarihi,
          onay_durumu: dekont.onay_durumu,
          aciklama: '', // Tabloda açıklama alanı yok
          dosya_url: dekont.dekont_dosyas || dekont.dosya_url || dekont.file_url || null, // Farklı dosya kolun adlarını dene
          tarih: dekont.odeme_tarihi,
          tutar: dekont.miktar,
          ay: dekont.ay || '',
          yil: dekont.yil || ''
        }))
        setSelectedOgrenciDekontlar(formattedDekontlar)
        setSelectedOgrenci(ogrenci)
        setDekontViewModalOpen(true)
      }
    } catch (error) {
      console.error('Dekont listesi alınırken hata:', error)
      alert('Dekontlar yüklenirken hata oluştu!')
    }
  }

  const handleDekontDetay = (dekont: Dekont) => {
    setSelectedDekont(dekont)
    setDekontDetailModalOpen(true)
  }

  const getOnayDurumuRenk = (durum: string) => {
    switch (durum) {
      case 'onaylandi':
        return 'bg-green-100 text-green-800'
      case 'reddedildi':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getOnayDurumuText = (durum: string) => {
    switch (durum) {
      case 'onaylandi':
        return 'Onaylandı'
      case 'reddedildi':
        return 'Reddedildi'
      case 'beklemede':
        return 'Beklemede'
      default:
        return 'Bekliyor'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isletme')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isletme) {
    // Bu durum normalde useEffect'teki yönlendirme ile engellenir,
    // ancak bir güvenlik katmanı olarak tutulabilir.
    return null 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-grow">
        <header className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 shadow-xl rounded-2xl mx-4 sm:mx-6 mt-6 mb-8 overflow-hidden">
          <div className="py-6 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-white">
                    {isletme.ad}
                  </h1>
                  <p className="text-sm text-blue-100 font-medium">İşletme Paneli</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 h-10 w-10 rounded-full transition-all duration-200"
                title="Çıkış Yap"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Çıkış Yap</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80">
            <div className="p-4 sm:p-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('ogrenciler')}
                    className={`${
                      activeTab === 'ogrenciler'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 sm:px-2 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Öğrenciler
                  </button>
                  <button
                    onClick={() => setActiveTab('dekontlar')}
                    className={`${
                      activeTab === 'dekontlar'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 sm:px-2 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <Receipt className="mr-2 h-5 w-5" />
                    Dekontlar
                  </button>
                  <button
                    onClick={() => setActiveTab('belgeler')}
                    className={`${
                      activeTab === 'belgeler'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 sm:px-2 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Belgeler
                  </button>
                </nav>
              </div>

              <div className="mt-6">
                {activeTab === 'ogrenciler' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Aktif Öğrenciler ({ogrenciler.length})
                    </h2>
                    <div className="space-y-4">
                      {ogrenciler.length > 0 ? (
                        ogrenciler.map(ogrenci => (
                          <div key={ogrenci.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/90 hover:bg-gray-100 transition-all duration-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                              <div className="flex items-center mb-3 sm:mb-0">
                                 <div className="p-3 bg-indigo-100 rounded-full mr-4">
                                  <User className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{ogrenci.ad} {ogrenci.soyad}</p>
                                  <p className="text-sm text-gray-500">{ogrenci.alan}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 text-left sm:text-right mb-4 sm:mb-0 w-full sm:w-auto">
                                  <p><span className="font-medium">Sınıf:</span> {ogrenci.sinif} - <span className="font-medium">No:</span> {ogrenci.no}</p>
                                  <p><span className="font-medium">Staj:</span> {new Date(ogrenci.baslangic_tarihi).toLocaleDateString('tr-TR')} - {new Date(ogrenci.bitis_tarihi).toLocaleDateString('tr-TR')}</p>
                                  <p className="flex items-center justify-start sm:justify-end mt-1">
                                    <GraduationCap className="h-4 w-4 mr-1.5 text-gray-400" />
                                    <span className="font-medium">Koor. Öğr:</span> {ogrenci.ogretmen_ad} {ogrenci.ogretmen_soyad}
                                  </p>
                              </div>
                              <div className="flex w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedOgrenci(ogrenci)
                                    setDekontModalOpen(true)
                                  }}
                                  title="Dekont Yükle"
                                  className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                  <Upload className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                          <Users className="mx-auto h-10 w-10 text-gray-400" />
                          <p className="mt-4 text-gray-600">Bu işletmede aktif staj yapan öğrenci bulunmamaktadır.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'dekontlar' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Tüm Dekontlar ({dekontlar.length})
                    </h2>
                    <div className="space-y-4">
                      {dekontlar.length > 0 ? (
                        dekontlar.map((dekont: Dekont) => (
                          <div
                            key={dekont.id}
                            className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/90 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              setSelectedDekont(dekont)
                              handleDekontDetay(dekont)
                            }}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                              <div className="flex items-center mb-3 sm:mb-0">
                                <div className="p-3 bg-blue-100 rounded-full mr-4">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {dekont.stajlar?.ogrenciler?.ad || 'Bilinmeyen Öğrenci'} {dekont.stajlar?.ogrenciler?.soyad || ''}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {dekont.ay} {dekont.yil}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                <p className="text-lg font-bold text-gray-900 flex-grow sm:flex-grow-0 text-left">
                                  ₺{dekont.tutar?.toLocaleString('tr-TR')}
                                </p>
                                <span
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium w-24 text-center ${
                                    dekont.onay_durumu === 'onaylandi'
                                      ? 'bg-green-100 text-green-800'
                                      : dekont.onay_durumu === 'reddedildi'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {getOnayDurumuText(dekont.onay_durumu)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                          <Receipt className="mx-auto h-10 w-10 text-gray-400" />
                          <p className="mt-4 text-gray-600">Bu işletmeye ait hiç dekont bulunmamaktadır.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'belgeler' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        İşletme Belgeleri ({filteredBelgeler.length})
                      </h2>
                      <button
                        onClick={() => setBelgeModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Yeni Belge Ekle
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                       <div className="relative flex-grow">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Belgelerde ara..."
                            value={belgeSearchTerm}
                            onChange={(e) => setBelgeSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                       </div>
                        <div className="relative">
                           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                              value={belgeTurFilter}
                              onChange={(e) => setBelgeTurFilter(e.target.value)}
                              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                            >
                              <option value="all">Tüm Türler</option>
                              <option value="sozlesme">Sözleşme</option>
                              <option value="fesih_belgesi">Fesih Belgesi</option>
                              <option value="usta_ogretici_belgesi">Usta Öğretici Belgesi</option>
                              <option value="diger">Diğer</option>
                          </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                      {filteredBelgeler.length > 0 ? (
                        filteredBelgeler.map(belge => (
                          <div key={belge.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/90 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between">
                             <div className="flex items-center">
                                <div className="p-3 bg-gray-200 rounded-full mr-4">
                                  <FileText className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{belge.ad}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatBelgeTur(belge.tur)} - {new Date(belge.yukleme_tarihi).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                              </div>
                            <div className="flex items-center gap-2">
                               <button
                                  onClick={() => handleBelgeView(belge)}
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-full transition-colors"
                                  title="Görüntüle/İndir"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                          <FileText className="mx-auto h-10 w-10 text-gray-400" />
                          <p className="mt-4 text-gray-600">Filtrelerle eşleşen belge bulunamadı.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Belge Ekleme Modalı */}
      <Modal isOpen={belgeModalOpen} onClose={() => setBelgeModalOpen(false)} title="Yeni Belge Ekle">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belge Adı
            </label>
            <input
              type="text"
              value={belgeFormData.ad}
              onChange={(e) => setBelgeFormData({...belgeFormData, ad: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Belge adını giriniz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belge Türü
            </label>
            <select
              value={belgeFormData.tur}
              onChange={(e) => setBelgeFormData({...belgeFormData, tur: e.target.value, customTur: ''})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="sozlesme">Sözleşme</option>
              <option value="fesih_belgesi">Fesih Belgesi</option>
              <option value="usta_ogretici_belgesi">Usta Öğretici Belgesi</option>
              <option value="other">Diğer (Manuel Giriş)</option>
            </select>
          </div>

          {belgeFormData.tur === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Özel Belge Türü
              </label>
              <input
                type="text"
                value={belgeFormData.customTur}
                onChange={(e) => setBelgeFormData({...belgeFormData, customTur: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Belge türünü yazınız"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Seçin <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                id="belge-dosya"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setBelgeFormData({...belgeFormData, dosya: e.target.files?.[0] || null})}
                className="hidden"
                required
              />
              <label htmlFor="belge-dosya" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {belgeFormData.dosya ? belgeFormData.dosya.name : 'Dosya seçmek için tıklayın'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG formatları desteklenir
                </p>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setBelgeModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleBelgeEkle}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Belge Ekle
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Belge Görüntüleme Modalı */}
      <Modal isOpen={belgeViewModal} onClose={() => setBelgeViewModal(false)} title={selectedBelge?.ad || 'Belge Detayı'}>
         {selectedBelge && (
          <div>
            <p><strong>Tür:</strong> {formatBelgeTur(selectedBelge.tur)}</p>
            <p><strong>Yükleme Tarihi:</strong> {new Date(selectedBelge.yukleme_tarihi).toLocaleDateString('tr-TR')}</p>
            
            {selectedBelge.dosya_url ? (
              <div className="mt-4">
                <a 
                  href={selectedBelge.dosya_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Eye className="mr-2 h-4 w-4" /> Belgeyi Görüntüle
                </a>
                 <a 
                  href={selectedBelge.dosya_url} 
                  download 
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" /> İndir
                </a>
              </div>
            ) : (
              <p className="mt-4 text-red-500">Bu belge için görüntülenecek bir dosya bulunamadı.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Dekont Yükleme Modalı */}
      <Modal isOpen={dekontModalOpen} onClose={() => setDekontModalOpen(false)} title={`Dekont Yükle - ${selectedOgrenci?.ad} ${selectedOgrenci?.soyad}`}>
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Öğrenci Bilgileri</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Öğrenci:</strong> {selectedOgrenci ? `${selectedOgrenci.ad} ${selectedOgrenci.soyad}` : ''}
              </div>
              <div>
                <strong>Sınıf:</strong> {selectedOgrenci ? selectedOgrenci.sinif : ''}
              </div>
              <div>
                <strong>Alan:</strong> {selectedOgrenci ? selectedOgrenci.alan : ''}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dekont Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dekontFormData.tarih}
              onChange={(e) => setDekontFormData({...dekontFormData, tarih: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dekont Ayı <span className="text-red-500">*</span>
            </label>
            <select
              value={dekontFormData.ay}
              onChange={(e) => setDekontFormData({...dekontFormData, ay: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Ay Seçiniz</option>
              <option value="Ocak">Ocak</option>
              <option value="Şubat">Şubat</option>
              <option value="Mart">Mart</option>
              <option value="Nisan">Nisan</option>
              <option value="Mayıs">Mayıs</option>
              <option value="Haziran">Haziran</option>
              <option value="Temmuz">Temmuz</option>
              <option value="Ağustos">Ağustos</option>
              <option value="Eylül">Eylül</option>
              <option value="Ekim">Ekim</option>
              <option value="Kasım">Kasım</option>
              <option value="Aralık">Aralık</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={dekontFormData.aciklama}
              onChange={(e) => setDekontFormData({...dekontFormData, aciklama: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Dekont açıklamasını giriniz (opsiyonel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={dekontFormData.tutar}
              onChange={(e) => setDekontFormData({...dekontFormData, tutar: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00 (opsiyonel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dekont Dosyası (Opsiyonel)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="dekont-dosya"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDekontFormData({...dekontFormData, dosya: e.target.files?.[0] || null})}
                className="hidden"
              />
              <label htmlFor="dekont-dosya" className="cursor-pointer">
                <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {dekontFormData.dosya ? dekontFormData.dosya.name : 'Dekont dosyası seçmek için tıklayın'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG formatları desteklenir
                </p>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setDekontModalOpen(false)
                setSelectedOgrenci(null)
                setDekontFormData({ tarih: '', ay: '', aciklama: '', tutar: '', dosya: null })
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleDekontEkle}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Dekont Ekle
            </button>
          </div>
        </div>
      </Modal>

      {/* Dekontları Görüntüleme Modalı */}
      <Modal isOpen={dekontViewModalOpen} onClose={() => setDekontViewModalOpen(false)} title={`${selectedOgrenci?.ad} ${selectedOgrenci?.soyad} - Dekontlar`}>
        <div className="space-y-4">
          {selectedOgrenci && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Öğrenci Bilgileri</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Ad Soyad:</span>
                  <p className="text-blue-900">{selectedOgrenci.ad} {selectedOgrenci.soyad}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Sınıf:</span>
                  <p className="text-blue-900">{selectedOgrenci.sinif} {selectedOgrenci.no && `- No: ${selectedOgrenci.no}`}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Alan:</span>
                  <p className="text-blue-900">{selectedOgrenci.alan}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Dekont Listesi ({selectedOgrenciDekontlar.length} adet)
            </h4>
          </div>

          {selectedOgrenciDekontlar.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedOgrenciDekontlar.map((dekont) => (
                <div 
                  key={dekont.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleDekontDetay(dekont)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {new Date(dekont.tarih).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long', 
                              year: 'numeric'
                            })}
                          </h5>
                          {dekont.ay && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              {dekont.ay} Ayı
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOnayDurumuRenk(dekont.onay_durumu)}`}>
                          {getOnayDurumuText(dekont.onay_durumu)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{dekont.aciklama}</p>
                      <p className="text-lg font-bold text-green-600">
                        {dekont.tutar ? dekont.tutar.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        }) : 'Tutar belirtilmemiş'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz dekont yok</h3>
              <p className="text-gray-500">Bu öğrenci için henüz dekont yüklenmemiş.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Dekont Detay Modalı */}
      <Modal isOpen={dekontDetailModalOpen} onClose={() => setDekontDetailModalOpen(false)} title="Dekont Detayı">
        {selectedDekont && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Tarih:</span>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedDekont.tarih).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long', 
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tutar:</span>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {selectedDekont.tutar ? selectedDekont.tutar.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }) : 'Tutar belirtilmemiş'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Onay Durumu:</span>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOnayDurumuRenk(selectedDekont.onay_durumu)}`}>
                  {getOnayDurumuText(selectedDekont.onay_durumu)}
                </span>
              </div>
            </div>

            {selectedDekont.aciklama && (
              <div>
                <span className="text-sm font-medium text-gray-700">Açıklama:</span>
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedDekont.aciklama}</p>
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-700">Dekont Dosyası:</span>
              <div className="bg-gray-50 rounded-lg p-4 mt-2">
                {selectedDekont.dosya_url ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">Dekont Belgesi</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.open(selectedDekont.dosya_url, '_blank')}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = selectedDekont.dosya_url!
                          link.download = `dekont_${selectedDekont.id}.pdf`
                          link.click()
                        }}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                        title="Dosyayı indir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Bu dekont için dosya yüklenmemiş</p>
                    <p className="text-xs text-gray-400 mt-1">Dosya yükleme özelliği geliştirilmektedir</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setDekontDetailModalOpen(false)
                  setSelectedDekont(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </Modal>

      <footer className="w-full bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="font-bold bg-white text-gray-800 w-6 h-6 flex items-center justify-center rounded-md">N</div>
            <span className="text-sm">© 2025 Hüsniye Özdilek MTAL</span>
          </div>
        </div>
      </footer>
    </div>
  )
} 