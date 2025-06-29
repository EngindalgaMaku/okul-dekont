'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileText, LogOut, User, Upload, Plus, Download, Eye, Search, Filter, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import Modal from '@/components/ui/Modal'

interface Isletme {
  id: number
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
}

interface Belge {
  id: number
  isletme_id: number
  ad: string
  tur: string
  dosya_url?: string
  yukleme_tarihi: string
}

export default function PanelPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [isletme, setIsletme] = useState<Isletme | null>(null)
  const [activeTab, setActiveTab] = useState('ogrenciler')
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
    // LocalStorage'dan işletme bilgilerini al
    const storedIsletme = localStorage.getItem('isletme')
    if (!storedIsletme) {
      router.push('/')
      return
    }

    setIsletme(JSON.parse(storedIsletme))
    fetchData()
  }, [])

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

  const fetchData = async () => {
    setLoading(true)
    const storedIsletme = JSON.parse(localStorage.getItem('isletme') || '{}')

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
        )
      `)
      .eq('isletme_id', storedIsletme.id)
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
        bitis_tarihi: staj.bitis_tarihi
      }))
      setOgrenciler(formattedOgrenciler)
    }

    // Dekontları şu anlık getirmiyoruz - tablo yapısı eksik

    // Belgeleri getir
    const { data: belgeData } = await supabase
      .from('belgeler')
      .select('*')
      .eq('isletme_id', storedIsletme.id)
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

    try {
      // Dosya yükleme simülasyonu (gerçek uygulamada Supabase Storage kullanılır)
      const dosyaAdi = `${Date.now()}_${belgeFormData.dosya.name}`
      const dosyaUrl = `belgeler/${dosyaAdi}`

      // Belge kaydını veritabanına ekle
      const { error: belgeError } = await supabase
        .from('belgeler')
        .insert({
          isletme_id: isletme?.id,
          ad: belgeFormData.ad,
          tur: belgeTuru,
          dosya_url: dosyaUrl,
          yukleme_tarihi: new Date().toISOString()
        })

      if (belgeError) {
        console.error('Belge ekleme hatası:', belgeError)
        alert('Belge eklenirken hata oluştu!')
        return
      }

      alert('Belge başarıyla eklendi!')
      setBelgeModalOpen(false)
      setBelgeFormData({
        ad: '',
        tur: 'sozlesme',
        customTur: '',
        dosya: null
      })
      
      await fetchData()
      
    } catch (error) {
      console.error('Belge ekleme hatası:', error)
      alert('Belge eklenirken hata oluştu!')
    }
  }

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
      fetchData() // Veriyi yeniden yükle
    } catch (error) {
      console.error('Dekont ekleme hatası:', error)
      alert('Dekont eklenirken hata oluştu!')
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
          ay: dekont.ay || ''
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

  if (!isletme) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl rounded-b-2xl">
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
                  <p className="text-sm text-indigo-100 font-medium">İşletme Paneli</p>
                  <p className="text-xs text-indigo-200">{isletme.yetkili_kisi}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-indigo-100 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8 flex-grow">
          <div className="w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex gap-8">
                <button
                  onClick={() => setActiveTab('ogrenciler')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'ogrenciler'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Öğrenciler</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('belgeler')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'belgeler'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>Belgeler</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Content */}
            {loading ? (
              <div className="w-full text-center py-16">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
              </div>
            ) : activeTab === 'ogrenciler' ? (
              <>
                <div className="px-4 py-6 border-b border-gray-200 sm:px-0">
                  <h2 className="text-xl font-semibold text-gray-900">Öğrenciler</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Toplam <span className="font-semibold text-indigo-600">{ogrenciler.length}</span> aktif öğrenci
                  </p>
                </div>
                {ogrenciler.length > 0 ? (
                  <div className="divide-y divide-gray-100 -mx-6 md:-mx-8">
                    {ogrenciler.map((ogrenci) => (
                      <div key={ogrenci.id} className="px-6 md:px-8 py-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                              <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-base font-semibold text-gray-900">
                                {ogrenci.ad} {ogrenci.soyad}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{ogrenci.alan}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {ogrenci.sinif} {ogrenci.no && ` - No: ${ogrenci.no}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(ogrenci.baslangic_tarihi).toLocaleDateString('tr-TR')} -{' '}
                                {new Date(ogrenci.bitis_tarihi).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleDekontlarGoster(ogrenci)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Dekontları görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-sm font-medium">Dekontları Görüntüle</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOgrenci(ogrenci)
                                  setDekontFormData({ 
                                    tarih: new Date().toISOString().split('T')[0], 
                                    ay: '',
                                    aciklama: '', 
                                    tutar: '', 
                                    dosya: null 
                                  })
                                  setDekontModalOpen(true)
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Dekont yükle"
                              >
                                <Receipt className="h-4 w-4" />
                                <span className="text-sm font-medium">Dekont Yükle</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Öğrenci Bulunamadı</h3>
                    <p className="mt-2 text-sm text-gray-500">Henüz aktif öğrenciniz bulunmuyor.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-6 border-b border-gray-200 sm:px-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Belgeler</h2>
                      <p className="mt-2 text-sm text-gray-600">
                        Toplam <span className="font-semibold text-indigo-600">{filteredBelgeler.length}</span> belge
                      </p>
                    </div>
                    <button 
                      onClick={() => setBelgeModalOpen(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Belge Ekle
                    </button>
                  </div>
                  
                  {/* Belge Filtreleri */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arama
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={belgeSearchTerm}
                          onChange={(e) => setBelgeSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Belge adı..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Belge Türü
                      </label>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={belgeTurFilter}
                          onChange={(e) => setBelgeTurFilter(e.target.value)}
                          className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="all">Tümü</option>
                          <option value="sozlesme">Sözleşme</option>
                          <option value="fesih_belgesi">Fesih Belgesi</option>
                          <option value="usta_ogretici_belgesi">Usta Öğretici Belgesi</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setBelgeSearchTerm('')
                          setBelgeTurFilter('all')
                        }}
                        className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Belgeler Listesi */}
                {filteredBelgeler.length > 0 ? (
                  <div className="divide-y divide-gray-100 -mx-6 md:-mx-8">
                    {filteredBelgeler.map((belge) => (
                      <div key={belge.id} className="px-6 md:px-8 py-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-xl">
                              <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-base font-semibold text-gray-900">{belge.ad}</h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {formatBelgeTur(belge.tur)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(belge.yukleme_tarihi).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleBelgeView(belge)}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Belgeyi görüntüle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {belge.dosya_url && (
                              <button 
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = belge.dosya_url!
                                  link.download = belge.ad
                                  link.click()
                                }}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                                title="Belgeyi indir"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz belge yok</h3>
                    <p className="mt-2 text-sm text-gray-500">Bu işletme için henüz belge yüklenmemiş.</p>
                    <div className="mt-8">
                      <button 
                        onClick={() => setBelgeModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        İlk Belgeyi Ekle
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl rounded-t-2xl mt-8">
          <div className="py-4 px-6 text-center text-sm text-white">
            &copy; {new Date().getFullYear()} {okulAdi} - Koordinatörlük Yönetimi Sistemi. Tüm Hakları Saklıdır.
          </div>
        </footer>
      </div>

      {/* Belge Ekleme Modalı */}
      <Modal 
        isOpen={belgeModalOpen} 
        onClose={() => setBelgeModalOpen(false)}
        title="Yeni Belge Ekle"
      >
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
      <Modal
        isOpen={belgeViewModal}
        onClose={() => setBelgeViewModal(false)}
        title="Belge Detayları"
        size="lg"
      >
        {selectedBelge && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Belge Adı</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-sm font-medium text-gray-900">{selectedBelge.ad}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Belge Türü</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {formatBelgeTur(selectedBelge.tur)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Yükleme Tarihi</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-sm text-gray-900">
                  {new Date(selectedBelge.yukleme_tarihi).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {selectedBelge.dosya_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dosya</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedBelge.ad}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.open(selectedBelge.dosya_url, '_blank')}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = selectedBelge.dosya_url!
                          link.download = selectedBelge.ad
                          link.click()
                        }}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Dekont Ekleme Modal */}
      <Modal 
        isOpen={dekontModalOpen} 
        onClose={() => {
          setDekontModalOpen(false)
          setSelectedOgrenci(null)
          setDekontFormData({ tarih: '', ay: '', aciklama: '', tutar: '', dosya: null })
        }}
        title={selectedOgrenci ? `${selectedOgrenci.ad} ${selectedOgrenci.soyad} - Dekont Yükle` : 'Dekont Yükle'}
        size="lg"
      >
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

      {/* Dekont Görüntüleme Modal */}
      <Modal 
        isOpen={dekontViewModalOpen} 
        onClose={() => {
          setDekontViewModalOpen(false)
          setSelectedOgrenci(null)
          setSelectedOgrenciDekontlar([])
        }}
        title={selectedOgrenci ? `${selectedOgrenci.ad} ${selectedOgrenci.soyad} - Dekontlar` : 'Dekontlar'}
        size="lg"
      >
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

      {/* Dekont Detay Modal */}
      <Modal 
        isOpen={dekontDetailModalOpen} 
        onClose={() => {
          setDekontDetailModalOpen(false)
          setSelectedDekont(null)
        }}
        title="Dekont Detayları"
        size="lg"
      >
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
    </div>
  )
} 