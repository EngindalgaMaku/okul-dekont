'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, FileText, LogOut, Building2, Upload, Eye, Filter, CheckCircle, XCircle, Clock, Calendar, CreditCard, User, Search, Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import Modal from '@/components/ui/Modal'
import DekontBildirim from '@/components/ui/DekontBildirim'

interface Dekont {
  id: number
  isletme_id: number
  staj_id: number
  odeme_tarihi: string
  tutar: number
  dosya_url?: string
  aciklama?: string
  ay: number
  yil: number
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  created_at: string
  stajlar: {
    ogrenciler: {
      ad: string
      soyad: string
      sinif: string
      no: string
    } | null
  }
  isletmeler: {
    ad: string
  }
  // Eski kodla uyumluluk için
  tarih?: string
  miktar?: number
  ogrenci_adi?: string
  odeme_son_tarihi?: string
  dekont_dosyasi?: string
}

interface Ogretmen {
  id: number
  ad: string
  soyad: string
}

interface Isletme {
  id: number
  ad: string
  yetkili_kisi: string
  ogrenci_sayisi: number
}

interface Stajyer {
  id: number
  ad: string
  soyad: string
  sinif: string
  alan: string
  no: string
  isletme: {
    id: number
    ad: string
    yetkili_kisi: string
  }
  baslangic_tarihi: string
  bitis_tarihi: string
  staj_id: number
}

interface IsletmeBelgesi {
  id: number
  isletme_id: number
  ogretmen_id: number
  dosya_url: string
  aciklama: string
  yuklenme_tarihi: string
}

type ActiveTab = 'isletmeler' | 'dekontlar'

export default function OgretmenPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [ogretmen, setOgretmen] = useState<Ogretmen | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('isletmeler')
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [stajyerler, setStajyerler] = useState<Stajyer[]>([])
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [filteredDekontlar, setFilteredDekontlar] = useState<Dekont[]>([])
  const [loading, setLoading] = useState(true)
  const [belgeler, setBelgeler] = useState<IsletmeBelgesi[]>([])
  const [belgelerLoading, setBelgelerLoading] = useState(false)

  // Dekont yükleme için state'ler
  const [selectedStajyer, setSelectedStajyer] = useState('')
  const [miktar, setMiktar] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [dekontDosyasi, setDekontDosyasi] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Dekont filtreleme
  const [dekontSearchTerm, setDekontSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewModal, setViewModal] = useState(false)
  const [selectedDekont, setSelectedDekont] = useState<Dekont | null>(null)
  const [uploadModal, setUploadModal] = useState(false)
  const [selectedIsletme, setSelectedIsletme] = useState<Isletme | null>(null)
  const [belgelerModal, setBelgelerModal] = useState(false)
  const [belgeYuklemeModal, setBelgeYuklemeModal] = useState(false)
  const [belgeFile, setBelgeFile] = useState<File | null>(null)
  const [belgeAciklama, setBelgeAciklama] = useState('')
  const [belgeYuklemeLoading, setBelgeYuklemeLoading] = useState(false)

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // LocalStorage'dan öğretmen bilgilerini al
    const storedOgretmen = localStorage.getItem('ogretmen')
    if (!storedOgretmen) {
      router.push('/')
      return
    }

    setOgretmen(JSON.parse(storedOgretmen))
    fetchData()
  }, [])

  // Dekont filtreleme
  useEffect(() => {
    let filtered = dekontlar

    if (dekontSearchTerm) {
      filtered = filtered.filter(dekont => 
        dekont.stajlar?.ogrenciler?.ad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.stajlar?.ogrenciler?.soyad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.isletmeler?.ad?.toLowerCase().includes(dekontSearchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(dekont => dekont.onay_durumu === statusFilter)
    }

    setFilteredDekontlar(filtered)
  }, [dekontlar, dekontSearchTerm, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    const storedOgretmen = JSON.parse(localStorage.getItem('ogretmen') || '{}')

    // İşletmeleri getir
    const { data: isletmeData } = await supabase
      .from('isletmeler')
      .select(`
        id,
        ad,
        yetkili_kisi,
        stajlar (count)
      `)
      .eq('ogretmen_id', storedOgretmen.id)

    if (isletmeData) {
      const formattedIsletmeler = isletmeData.map((isletme: any) => ({
        id: isletme.id,
        ad: isletme.ad,
        yetkili_kisi: isletme.yetkili_kisi,
        ogrenci_sayisi: isletme.stajlar[0]?.count || 0
      }))
      setIsletmeler(formattedIsletmeler)
    }

    // Stajyerleri getir
    const { data: stajData } = await supabase
      .from('stajlar')
      .select(`
        id,
        baslangic_tarihi,
        bitis_tarihi,
        isletmeler (
          id,
          ad,
          yetkili_kisi
        ),
        ogrenciler (
          id,
          ad,
          soyad,
          sinif,
          alanlar (ad),
          no
        )
      `)
      .eq('ogretmen_id', storedOgretmen.id)
      .eq('durum', 'aktif')

    if (stajData) {
      const formattedStajyerler = stajData.map((staj: any) => ({
        id: staj.ogrenciler.id,
        ad: staj.ogrenciler.ad,
        soyad: staj.ogrenciler.soyad,
        sinif: staj.ogrenciler.sinif,
        alan: staj.ogrenciler.alanlar.ad,
        no: staj.ogrenciler.no,
        isletme: {
          id: staj.isletmeler.id,
          ad: staj.isletmeler.ad,
          yetkili_kisi: staj.isletmeler.yetkili_kisi
        },
        baslangic_tarihi: staj.baslangic_tarihi,
        bitis_tarihi: staj.bitis_tarihi,
        staj_id: staj.id
      }))
      setStajyerler(formattedStajyerler)
    }

    // Dekontları getir
    fetchDekontlar()
    setLoading(false)
  }

  const fetchDekontlar = async () => {
    const storedOgretmen = JSON.parse(localStorage.getItem('ogretmen') || '{}')
    
    const { data: dekontData } = await supabase
      .from('dekontlar')
      .select(`
        *,
        stajlar (
          ogrenciler (
            ad,
            soyad,
            sinif,
            no
          )
        ),
        isletmeler (ad)
      `)
      .eq('ogretmen_id', storedOgretmen.id)
      .order('created_at', { ascending: false })

    if (dekontData) {
      const formattedData = dekontData.map(item => ({
        id: item.id,
        isletme_id: item.isletme_id,
        staj_id: item.staj_id,
        odeme_tarihi: item.odeme_tarihi,
        tutar: item.tutar,
        dosya_url: item.dosya_url,
        aciklama: item.aciklama,
        ay: item.ay,
        yil: item.yil || new Date().getFullYear(),
        onay_durumu: item.onay_durumu,
        created_at: item.created_at,
        stajlar: {
          ogrenciler: item.stajlar?.ogrenciler
            ? {
                ad: item.stajlar.ogrenciler.ad,
                soyad: item.stajlar.ogrenciler.soyad,
                sinif: item.stajlar.ogrenciler.sinif,
                no: item.stajlar.ogrenciler.no
              }
            : null
        },
        isletmeler: {
          ad: item.isletmeler?.ad
        }
      }))
      setDekontlar(formattedData)
      setFilteredDekontlar(formattedData)
    }
  }

  const handleDekontSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dekontDosyasi || !ogretmen) return
    setUploadLoading(true)

    try {
      const selectedStajyerData = stajyerler.find(s => s.staj_id.toString() === selectedStajyer)
      if (!selectedStajyerData) throw new Error('Stajyer bulunamadı')

      // Dosya yükleme işlemi (gerçek uygulamada Supabase Storage kullanılır)
      let dosyaUrl = `dekont_${Date.now()}_${dekontDosyasi.name}`

      const { error } = await supabase
        .from('dekontlar')
        .insert({
          staj_id: parseInt(selectedStajyer),
          isletme_id: selectedStajyerData.isletme.id,
          ogretmen_id: ogretmen.id,
          tutar: miktar ? parseFloat(miktar) : null,
          odeme_tarihi: odemeTarihi,
          dosya_url: dosyaUrl,
          onay_durumu: 'bekliyor'
        })

      if (error) throw error

      // Form sıfırla
      setSelectedStajyer('')
      setMiktar('')
      setOdemeTarihi(new Date().toISOString().split('T')[0])
      setDekontDosyasi(null)
      setUploadModal(false)
      
      // Dekont listesini yenile
      fetchDekontlar()

      // Başarı mesajı göster
      setNotification({ message: 'Dekont başarıyla yüklendi', type: 'success' })
      setTimeout(() => {
        setNotification(null)
      }, 3000)

    } catch (error) {
      console.error('Dekont gönderme hatası:', error)
      setNotification({ message: 'Dekont gönderilirken hata oluştu!', type: 'error' })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('belgeler').download(filePath);
      if (error) throw error;
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = filePath.split('/').pop();
      link.setAttribute('download', fileName || 'dekont');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      console.error('Download error:', error.message);
      setNotification({ message: `Dosya indirilemedi: ${error.message}`, type: 'error' });
    }
  };

  const handleView = (dekont: Dekont) => {
    setSelectedDekont(dekont)
    setViewModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'reddedildi':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return 'Onaylandı'
      case 'reddedildi':
        return 'Reddedildi'
      default:
        return 'Bekliyor'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'reddedildi':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ogretmen')
    router.push('/')
  }

  const handleBelgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!belgeFile || !selectedIsletme || !ogretmen) return
    setBelgeYuklemeLoading(true)

    try {
      // Dosya yükleme işlemi (gerçek uygulamada Supabase Storage kullanılır)
      let dosyaUrl = `belge_${Date.now()}_${belgeFile.name}`

      const { error } = await supabase
        .from('isletme_belgeleri')
        .insert({
          isletme_id: selectedIsletme.id,
          ogretmen_id: ogretmen.id,
          dosya_url: dosyaUrl,
          aciklama: belgeAciklama,
          yuklenme_tarihi: new Date().toISOString()
        })

      if (error) throw error

      // Form sıfırla
      setBelgeFile(null)
      setBelgeAciklama('')
      setBelgeYuklemeModal(false)
      
      // Başarı mesajı göster
      setNotification({ message: 'Belge başarıyla yüklendi', type: 'success' })
      setTimeout(() => {
        setNotification(null)
      }, 3000)

    } catch (error) {
      console.error('Belge yükleme hatası:', error)
      setNotification({ message: 'Belge yüklenirken hata oluştu!', type: 'error' })
    } finally {
      setBelgeYuklemeLoading(false)
    }
  }

  const fetchBelgeler = async (isletmeId: number) => {
    setBelgelerLoading(true)
    try {
      const { data, error } = await supabase
        .from('isletme_belgeleri')
        .select('*')
        .eq('isletme_id', isletmeId)
        .order('yuklenme_tarihi', { ascending: false })

      if (error) throw error
      setBelgeler(data || [])
    } catch (error) {
      console.error('Belgeleri getirme hatası:', error)
      setNotification({ message: 'Belgeler yüklenirken hata oluştu!', type: 'error' })
    } finally {
      setBelgelerLoading(false)
    }
  }

  if (loading || !ogretmen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{ogretmen.ad} {ogretmen.soyad}</h1>
                <p className="text-sm opacity-90">Koordinatör Öğretmen</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white p-2 rounded-xl shadow-md mb-8">
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('isletmeler')}
              className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'isletmeler' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Building2 className="h-5 w-5" />
              <span>İşletmeler ({isletmeler.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dekontlar')}
              className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'dekontlar' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText className="h-5 w-5" />
              <span>Dekont Listesi ({dekontlar.length})</span>
            </button>
          </nav>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          {activeTab === 'isletmeler' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Koordinatörlüğünüzdeki İşletmeler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isletmeler.map(isletme => (
                  <div key={isletme.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">{isletme.ad}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedIsletme(isletme)
                              setBelgelerModal(true)
                              fetchBelgeler(isletme.id)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Belgeler"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">Yetkili: {isletme.yetkili_kisi}</p>
                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">ÖĞRENCİLER</div>
                        <div className="space-y-2">
                          {stajyerler
                            .filter(stajyer => stajyer.isletme.id === isletme.id)
                            .map(ogrenci => (
                              <div key={ogrenci.id} className="text-sm">
                                <div>
                                  <p className="font-medium text-gray-800">{ogrenci.ad} {ogrenci.soyad}</p>
                                  <p className="text-xs text-gray-500">{ogrenci.sinif} ({ogrenci.no}) / {ogrenci.alan}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedStajyer(ogrenci.staj_id.toString())
                                    setDekontDosyasi(null)
                                    setMiktar('')
                                    setOdemeTarihi(new Date().toISOString().split('T')[0])
                                    setUploadSuccess(false)
                                    setUploadModal(true)
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Dekont Yükle"
                                >
                                  <Upload className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dekontlar' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
                <div className="w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Öğrenci, işletme ara..."
                      value={dekontSearchTerm}
                      onChange={(e) => setDekontSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tümü</option>
                    <option value="bekliyor">Bekleyenler</option>
                    <option value="onaylandi">Onaylananlar</option>
                    <option value="reddedildi">Reddedilenler</option>
                  </select>
                </div>
              </div>

              {/* Mobil için kart görünümü, masaüstü için tablo */}
              <div className="block sm:hidden">
                {filteredDekontlar.map(dekont => (
                  <div key={dekont.id} className="bg-white rounded-lg shadow mb-4 overflow-hidden">
                    <div className="p-4">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-800">{dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}</div>
                        <div className="text-sm text-gray-500">{dekont.stajlar?.ogrenciler?.sinif} - <span className="font-medium">No: </span>{dekont.stajlar?.ogrenciler?.no}</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">İşletme:</span>
                          <span className="font-medium">{dekont.isletmeler?.ad}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Dönem:</span>
                          <span className="font-medium">{dekont.ay} {dekont.yil}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Durum:</span>
                          <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${getStatusClass(dekont.onay_durumu)}`}>
                            {getStatusIcon(dekont.onay_durumu)}
                            {getStatusText(dekont.onay_durumu)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t px-4 py-3 bg-gray-50 flex justify-end gap-2">
                      <button
                        onClick={() => handleView(dekont)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Görüntüle"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {dekont.dosya_url && (
                        <button
                          onClick={() => handleDownload(dekont.dosya_url!)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="İndir"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Masaüstü için tablo görünümü */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full bg-white shadow rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 font-semibold text-left">Öğrenci</th>
                      <th className="p-3 font-semibold text-left">İşletme</th>
                      <th className="p-3 font-semibold text-left">Dönem</th>
                      <th className="p-3 font-semibold text-left">Durum</th>
                      <th className="p-3 font-semibold text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDekontlar.map(dekont => (
                      <tr key={dekont.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-semibold text-gray-800">{dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}</div>
                          <div className="text-sm text-gray-500">{dekont.stajlar?.ogrenciler?.sinif} - <span className="font-medium">No: </span>{dekont.stajlar?.ogrenciler?.no}</div>
                        </td>
                        <td className="p-3">{dekont.isletmeler?.ad}</td>
                        <td className="p-3">{dekont.ay} {dekont.yil}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${getStatusClass(dekont.onay_durumu)}`}>
                            {getStatusIcon(dekont.onay_durumu)}
                            {getStatusText(dekont.onay_durumu)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(dekont)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Görüntüle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {dekont.dosya_url && (
                              <button
                                onClick={() => handleDownload(dekont.dosya_url!)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="İndir"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          © {new Date().getFullYear()} {okulAdi} - Koordinatörlük Yönetim Sistemi. Tüm Hakları Saklıdır.
        </div>
      </footer>

      {viewModal && selectedDekont && (
        <Modal 
          isOpen={viewModal} 
          onClose={() => setViewModal(false)}
          title="Dekont Detayları"
          size="lg"
        >
          <div className="space-y-4 p-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">Öğrenci Bilgileri</h4>
                 <p>{selectedDekont.stajlar?.ogrenciler?.ad} {selectedDekont.stajlar?.ogrenciler?.soyad}</p>
                 <p className="text-sm text-gray-600">{selectedDekont.stajlar?.ogrenciler?.sinif} - <span className="font-medium">No: </span>{selectedDekont.stajlar?.ogrenciler?.no}</p>
               </div>
               <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">İşletme Bilgileri</h4>
                 <p>{selectedDekont.isletmeler?.ad}</p>
               </div>
               <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">Dekont Bilgileri</h4>
                 <div className="space-y-1">
                   <div className="flex justify-between">
                     <span>Dönem:</span>
                     <span className="font-medium">{selectedDekont.ay} {selectedDekont.yil}</span>
                   </div>
                   <div className="flex justify-between mt-1">
                     <span>Tutar:</span>
                     <span className="font-medium">{selectedDekont.tutar ? `${selectedDekont.tutar} TL` : '-'}</span>
                   </div>
                   <div className="flex justify-between mt-1">
                     <span>Durum:</span>
                     <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${getStatusClass(selectedDekont.onay_durumu)}`}>
                       {getStatusIcon(selectedDekont.onay_durumu)}
                       {getStatusText(selectedDekont.onay_durumu)}
                     </span>
                   </div>
                 </div>
               </div>
             </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">Ödeme Detayları</h4>
                 <div className="flex justify-between">
                   <span>Dönem:</span>
                   <span className="font-medium">{new Date(selectedDekont.odeme_tarihi).toLocaleDateString()}</span>
                 </div>
                  <div className="flex justify-between mt-1">
                   <span>Tutar:</span>
                   <span className="font-medium">{selectedDekont.miktar ? `${selectedDekont.miktar} TL` : 'Belirtilmemiş'}</span>
                 </div>
                 <div className="flex justify-between mt-1">
                   <span>Yüklenme Tarihi:</span>
                   <span className="font-medium">{new Date(selectedDekont.created_at).toLocaleDateString()}</span>
                 </div>
               </div>
             <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">Onay Durumu</h4>
                  <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-sm font-medium ${getStatusClass(selectedDekont.onay_durumu)}`}>
                  {getStatusIcon(selectedDekont.onay_durumu)}
                  {getStatusText(selectedDekont.onay_durumu)}
                </span>
              </div>

             {selectedDekont.dekont_dosyasi && (
               <button
                 onClick={() => handleDownload(selectedDekont.dekont_dosyasi!)}
                 className="w-full flex justify-center items-center gap-2 mt-4 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
               >
                 <Download className="h-4 w-4"/>
                 Dekontu İndir
               </button>
             )}
          </div>
        </Modal>
      )}

      {uploadModal && (
        <Modal 
          isOpen={uploadModal} 
          onClose={() => setUploadModal(false)}
          title="Yeni Dekont Yükle"
          size="lg"
        >
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleDekontSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dekont Ayı</label>
                  <input
                    type="month"
                    value={odemeTarihi}
                    onChange={(e) => setOdemeTarihi(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (Opsiyonel)</label>
                  <input
                    type="number"
                    value={miktar}
                    onChange={(e) => setMiktar(e.target.value)}
                    placeholder="Örn: 1500.50"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dekont Dosyası</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Dosya yükle</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setDekontDosyasi(e.target.files ? e.target.files[0] : null)} accept=".pdf,.png,.jpg,.jpeg" required />
                      </label>
                      <p className="pl-1">veya sürükleyip bırakın</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG, JPEG</p>
                  </div>
                </div>
                {dekontDosyasi && <p className="text-sm text-gray-500 mt-2">Seçilen dosya: {dekontDosyasi.name}</p>}
              </div>
              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {uploadLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Dekontu Gönder'}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Belgeler Modalı */}
      {belgelerModal && selectedIsletme && (
        <Modal
          isOpen={belgelerModal}
          onClose={() => setBelgelerModal(false)}
          title={`${selectedIsletme.ad} - Belgeler`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Yüklenen Belgeler</h3>
              <button
                onClick={() => {
                  setBelgelerModal(false)
                  setBelgeYuklemeModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Yeni Belge Yükle</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {belgelerLoading ? (
                <div className="py-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                </div>
              ) : belgeler.length > 0 ? (
                belgeler.map(belge => (
                  <div key={belge.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{belge.aciklama}</p>
                      <p className="text-sm text-gray-500">{new Date(belge.yuklenme_tarihi).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(belge.dosya_url)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="İndir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  Henüz belge yüklenmemiş
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Belge Yükleme Modalı */}
      {belgeYuklemeModal && selectedIsletme && (
        <Modal
          isOpen={belgeYuklemeModal}
          onClose={() => setBelgeYuklemeModal(false)}
          title="Yeni Belge Yükle"
          size="lg"
        >
          <form onSubmit={handleBelgeSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={belgeAciklama}
                onChange={(e) => setBelgeAciklama(e.target.value)}
                placeholder="Belge açıklaması"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Belge Dosyası</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="belge-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Dosya yükle</span>
                      <input id="belge-upload" name="belge-upload" type="file" className="sr-only" onChange={(e) => setBelgeFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.doc,.docx,.xls,.xlsx" required />
                    </label>
                    <p className="pl-1">veya sürükleyip bırakın</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX</p>
                </div>
              </div>
              {belgeFile && <p className="text-sm text-gray-500 mt-2">Seçilen dosya: {belgeFile.name}</p>}
            </div>
            <button
              type="submit"
              disabled={belgeYuklemeLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {belgeYuklemeLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Belgeyi Yükle'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
} 