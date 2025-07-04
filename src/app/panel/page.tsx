'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileText, LogOut, User, Upload, Plus, Download, Eye, Search, Filter, Receipt, Loader, GraduationCap, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
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
  odeme_tarihi?: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  aciklama?: string
  dosya_url?: string
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
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    aciklama: '',
    miktar: '',
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
    if (!selectedOgrenci || !dekontFormData.ay || !dekontFormData.yil) {
      alert('Dekont dönemi (ay ve yıl) zorunludur!')
      return
    }

    // Miktar alanı opsiyonel

    try {
      let dosyaUrl = null
      
      // Dosya varsa yükle
      if (dekontFormData.dosya) {
        // Simülasyon - gerçek uygulamada Supabase Storage kullanılacak
        dosyaUrl = `/uploads/dekontlar/${Date.now()}_${dekontFormData.dosya.name}`
      }

      // Ay adını al
      const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
      const ayAdi = aylar[dekontFormData.ay - 1]

      // Dekontlar tablosundaki mevcut kolonları kullan
      const { data: dekontData, error } = await supabase
        .from('dekontlar')
        .insert({
          staj_id: selectedOgrenci!.staj_id,
          ogrenci_id: selectedOgrenci!.id,
          isletme_id: isletme!.id,
          odeme_tarihi: new Date().toISOString().split('T')[0],
          ay: `${ayAdi} ${dekontFormData.yil}`,
          aciklama: dekontFormData.aciklama || null,
          miktar: dekontFormData.miktar ? parseFloat(dekontFormData.miktar) : null,
          dosya_url: dosyaUrl,
          onay_durumu: 'bekliyor'
        })

      if (error) {
        console.error('Dekont ekleme hatası:', error)
        console.error('Hata detayı:', error.message)
        console.error('Gönderilen veri:', {
          staj_id: selectedOgrenci!.staj_id,
          ogrenci_id: selectedOgrenci!.id,
          isletme_id: isletme!.id,
          ay: dekontFormData.ay,
          aciklama: dekontFormData.aciklama || null,
          miktar: dekontFormData.miktar ? parseFloat(dekontFormData.miktar) : null,
          dosya_url: dosyaUrl,
          onay_durumu: 'bekliyor'
        })
        alert(`Dekont eklenirken hata oluştu: ${error.message}`)
        return
      }

      alert('Dekont başarıyla eklendi!')
      setDekontModalOpen(false)
      setSelectedOgrenci(null)
      setDekontFormData({ 
        ay: new Date().getMonth() + 1, 
        yil: new Date().getFullYear(), 
        aciklama: '', 
        miktar: '', 
        dosya: null 
      })
      setActiveTab('dekontlar') // Dekont listesi sekmesine geç
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
          onay_durumu: dekont.onay_durumu,
          aciklama: '', // Tabloda açıklama alanı yok
          dosya_url: dekont.dekont_dosyas || dekont.dosya_url || dekont.file_url || null, // Farklı dosya kolun adlarını dene
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
    <div className="min-h-screen flex flex-col pb-16">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-indigo-600 to-indigo-800 pb-32">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-2xl transform rotate-6 scale-105 opacity-20" />
                  <div className="relative p-3 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-white">
                  {isletme.ad}
                </h1>
                <p className="text-indigo-200 text-sm">İşletme Paneli</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-xl bg-white bg-opacity-20 backdrop-blur-lg hover:bg-opacity-30 transition-all duration-200"
              title="Çıkış Yap"
            >
              <LogOut className="h-5 w-5 text-white" />
              <span className="sr-only">Çıkış Yap</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              {[
                { id: 'ogrenciler', icon: Users, label: 'Öğrenciler' },
                { id: 'dekontlar', icon: Receipt, label: 'Dekontlar' },
                { id: 'belgeler', icon: FileText, label: 'Belgeler' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`
                      group relative min-w-0 flex-1 overflow-hidden py-3 px-6 rounded-t-xl text-sm font-medium text-center hover:bg-white hover:bg-opacity-10 transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-indigo-700' 
                        : 'text-indigo-100 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-indigo-300 group-hover:text-white'} mr-2`} />
                      {tab.label}
                    </div>
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-700" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative -mt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 p-6 divide-y divide-gray-200">
            {activeTab === 'ogrenciler' && (
              <div className="space-y-6">
                {ogrenciler.map((ogrenci) => (
                  <div key={ogrenci.id} className="pt-6 first:pt-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {ogrenci.ad} {ogrenci.soyad}
                          </h3>
                          <p className="text-sm text-gray-500">{ogrenci.alan}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOgrenci(ogrenci)
                          setDekontModalOpen(true)
                        }}
                        className="flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-1.5" />
                        Dekont Yükle
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                        {ogrenci.sinif} - {ogrenci.no}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(ogrenci.baslangic_tarihi).toLocaleDateString('tr-TR')} - {new Date(ogrenci.bitis_tarihi).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dekontlar' && (
              <div className="space-y-6">
                {dekontlar.length > 0 ? (
                  dekontlar.map((dekont) => (
                    <div key={dekont.id} className="pt-6 first:pt-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {dekont.ay} {dekont.yil}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {dekont.dosya_url && (
                            <button
                              onClick={() => window.open(dekont.dosya_url, '_blank')}
                              className="flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 mr-1.5" />
                              İndir
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500">Ödeme Tarihi:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {dekont.odeme_tarihi ? new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500">Tutar:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {dekont.miktar?.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500">Durum:</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dekont.onay_durumu === 'onaylandi' 
                              ? 'bg-green-100 text-green-800'
                              : dekont.onay_durumu === 'bekliyor'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dekont.onay_durumu === 'onaylandi' ? 'Onaylandı'
                              : dekont.onay_durumu === 'bekliyor' ? 'Bekliyor'
                              : 'Reddedildi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz Dekont Yok</h3>
                    <p className="mt-2 text-sm text-gray-500">Bu işletmeye ait hiç dekont bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'belgeler' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    İşletme Belgeleri ({filteredBelgeler.length})
                  </h2>
                  <button
                    onClick={() => setBelgeModalOpen(true)}
                    className="flex items-center px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Belge Ekle
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Belgelerde ara..."
                      value={belgeSearchTerm}
                      onChange={(e) => setBelgeSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={belgeTurFilter}
                      onChange={(e) => setBelgeTurFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="all">Tüm Türler</option>
                      <option value="sozlesme">Sözleşme</option>
                      <option value="fesih_belgesi">Fesih Belgesi</option>
                      <option value="usta_ogretici_belgesi">Usta Öğretici Belgesi</option>
                      <option value="diger">Diğer</option>
                    </select>
                  </div>
                </div>

                {filteredBelgeler.length > 0 ? (
                  <div className="space-y-6">
                    {filteredBelgeler.map((belge) => (
                      <div key={belge.id} className="pt-6 first:pt-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center">
                              <FileText className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900">
                                {belge.ad}
                              </h3>
                              <p className="text-sm text-gray-500">{formatBelgeTur(belge.tur)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {belge.dosya_url && (
                              <button
                                onClick={() => window.open(belge.dosya_url, '_blank')}
                                className="flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                İndir
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">
                            Yüklenme Tarihi: {new Date(belge.yukleme_tarihi).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz Belge Yok</h3>
                    <p className="mt-2 text-sm text-gray-500">Bu işletmeye ait hiç belge bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={dekontModalOpen} onClose={() => setDekontModalOpen(false)} title="Yeni Dekont Ekle">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dekont Dönemi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={dekontFormData.ay}
                  onChange={(e) => setDekontFormData({...dekontFormData, ay: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Ay Seçiniz</option>
                  <option value="1">Ocak</option>
                  <option value="2">Şubat</option>
                  <option value="3">Mart</option>
                  <option value="4">Nisan</option>
                  <option value="5">Mayıs</option>
                  <option value="6">Haziran</option>
                  <option value="7">Temmuz</option>
                  <option value="8">Ağustos</option>
                  <option value="9">Eylül</option>
                  <option value="10">Ekim</option>
                  <option value="11">Kasım</option>
                  <option value="12">Aralık</option>
                </select>
              </div>
              <div>
                <select
                  value={dekontFormData.yil}
                  onChange={(e) => setDekontFormData({...dekontFormData, yil: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Yıl Seçiniz</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(yil => (
                    <option key={yil} value={yil}>{yil}</option>
                  ))}
                </select>
              </div>
            </div>
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
              Miktar (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={dekontFormData.miktar}
              onChange={(e) => setDekontFormData({...dekontFormData, miktar: e.target.value})}
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
                setDekontFormData({ 
                  ay: new Date().getMonth() + 1, 
                  yil: new Date().getFullYear(), 
                  aciklama: '', 
                  miktar: '', 
                  dosya: null 
                })
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Belge türünü yazınız"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Seçin <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
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
              className="px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-sm"
            >
              Belge Ekle
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
                            {dekont.odeme_tarihi ? new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : '-'}
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
                        {dekont.miktar ? dekont.miktar.toLocaleString('tr-TR', {
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
                    {selectedDekont.odeme_tarihi ? new Date(selectedDekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tutar:</span>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {selectedDekont.miktar ? selectedDekont.miktar.toLocaleString('tr-TR', {
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

      <footer className="w-full bg-gradient-to-br from-indigo-900 to-indigo-800 text-white py-4 fixed bottom-0 left-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="font-bold bg-white text-indigo-900 w-6 h-6 flex items-center justify-center rounded-md">
                N
              </div>
              <span className="text-sm">&copy; {new Date().getFullYear()} {okulAdi}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 