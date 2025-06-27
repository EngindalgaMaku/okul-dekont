'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, FileText, LogOut, Building2, Bell, Upload, Eye, Filter, CheckCircle, XCircle, Clock, Calendar, CreditCard, User, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import Modal from '@/components/ui/Modal'

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
  isletme: {
    id: number
    ad: string
    yetkili_kisi: string
  }
  baslangic_tarihi: string
  bitis_tarihi: string
  staj_id: number
}

interface Dekont {
  id: number
  miktar: number
  odeme_tarihi: string
  dekont_dosyasi?: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  created_at: string
  ogrenciler?: { ad: string; soyad: string; sinif: string }
  isletmeler?: { ad: string }
}

export default function OgretmenPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [ogretmen, setOgretmen] = useState<Ogretmen | null>(null)
  const [activeTab, setActiveTab] = useState('isletmeler')
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [stajyerler, setStajyerler] = useState<Stajyer[]>([])
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [filteredDekontlar, setFilteredDekontlar] = useState<Dekont[]>([])
  const [loading, setLoading] = useState(true)

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
        dekont.ogrenciler?.ad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.ogrenciler?.soyad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
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
        ogrenci_sayisi: isletme.stajlar.count
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
          alanlar (ad)
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
        ogrenciler (ad, soyad, sinif),
        isletmeler (ad)
      `)
      .eq('ogretmen_id', storedOgretmen.id)
      .order('created_at', { ascending: false })

    if (dekontData) {
      setDekontlar(dekontData || [])
      setFilteredDekontlar(dekontData || [])
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
          miktar: miktar ? parseFloat(miktar) : null,
          odeme_tarihi: odemeTarihi,
          dekont_dosyasi: dosyaUrl,
          onay_durumu: 'bekliyor'
        })

      if (error) throw error

      setUploadSuccess(true)
      // Form sıfırla
      setSelectedStajyer('')
      setMiktar('')
      setOdemeTarihi(new Date().toISOString().split('T')[0])
      setDekontDosyasi(null)
      
      // Dekont listesini yenile
      fetchDekontlar()

      // 2 saniye sonra success mesajını kaldır
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Dekont gönderme hatası:', error)
      alert('Dekont gönderilirken hata oluştu!')
    } finally {
      setUploadLoading(false)
    }
  }

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

  if (!ogretmen) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  {ogretmen.ad} {ogretmen.soyad}
                </h1>
                <p className="text-sm text-gray-600">Koordinatör Öğretmen</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{okulAdi}</p>
                <p className="text-xs text-gray-500">{egitimYili} Eğitim-Öğretim Yılı</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('isletmeler')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'isletmeler'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5 inline mr-2" />
                İşletmeler ({isletmeler.length})
              </button>
              <button
                onClick={() => setActiveTab('stajyerler')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stajyerler'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                Stajyerler ({stajyerler.length})
              </button>
              <button
                onClick={() => setActiveTab('dekont-yukle')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dekont-yukle'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="h-5 w-5 inline mr-2" />
                Dekont Yükle
              </button>
              <button
                onClick={() => setActiveTab('dekontlar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dekontlar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 inline mr-2" />
                Dekont Listesi ({dekontlar.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* İşletmeler Tab */}
            {activeTab === 'isletmeler' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Koordine Ettiğiniz İşletmeler</h2>
                {isletmeler.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">İşletme bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Henüz koordine ettiğiniz işletme bulunmuyor.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isletmeler.map((isletme) => (
                      <div key={isletme.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{isletme.ad}</h3>
                            <p className="text-sm text-gray-600">Yetkili: {isletme.yetkili_kisi}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {isletme.ogrenci_sayisi} aktif stajyer
                            </p>
                          </div>
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stajyerler Tab */}
            {activeTab === 'stajyerler' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Koordine Ettiğiniz Stajyerler</h2>
                {stajyerler.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Stajyer bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Henüz koordine ettiğiniz stajyer bulunmuyor.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Öğrenci
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sınıf / Alan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşletme
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Staj Dönemi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stajyerler.map((stajyer) => (
                          <tr key={stajyer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stajyer.ad} {stajyer.soyad}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stajyer.sinif} / {stajyer.alan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <div className="font-medium">{stajyer.isletme.ad}</div>
                                <div className="text-xs text-gray-400">Yetkili: {stajyer.isletme.yetkili_kisi}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(stajyer.baslangic_tarihi).toLocaleDateString('tr-TR')} - {new Date(stajyer.bitis_tarihi).toLocaleDateString('tr-TR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Dekont Yükle Tab */}
            {activeTab === 'dekont-yukle' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Yeni Dekont Yükle</h2>
                
                {uploadSuccess ? (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">
                      Dekont Başarıyla Gönderildi
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Dekontunuz onay için gönderildi.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleDekontSubmit} className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stajyer Öğrenci
                      </label>
                      <select
                        value={selectedStajyer}
                        onChange={(e) => setSelectedStajyer(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Öğrenci Seçin</option>
                        {stajyerler.map((stajyer) => (
                          <option key={stajyer.staj_id} value={stajyer.staj_id}>
                            {stajyer.ad} {stajyer.soyad} - {stajyer.isletme.ad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Miktarı (TL) - İsteğe Bağlı
                      </label>
                      <input
                        type="number"
                        value={miktar}
                        onChange={(e) => setMiktar(e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Tarihi
                      </label>
                      <input
                        type="date"
                        value={odemeTarihi}
                        onChange={(e) => setOdemeTarihi(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dekont Dosyası
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setDekontDosyasi(e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        PDF, JPG, JPEG veya PNG formatında dosya yükleyebilirsiniz.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {uploadLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Dekont Gönder
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Dekont Listesi Tab */}
            {activeTab === 'dekontlar' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Dekont Listesi</h2>
                </div>

                {/* Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arama
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={dekontSearchTerm}
                        onChange={(e) => setDekontSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Öğrenci adı veya işletme..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Onay Durumu
                    </label>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="bekliyor">Bekliyor</option>
                        <option value="onaylandi">Onaylandı</option>
                        <option value="reddedildi">Reddedildi</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDekontSearchTerm('')
                        setStatusFilter('all')
                      }}
                      className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Filtreleri Temizle
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Toplam: {filteredDekontlar.length} dekont
                </div>

                {filteredDekontlar.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Dekont bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {dekontSearchTerm || statusFilter !== 'all' 
                        ? 'Arama kriterlerinize uygun dekont bulunamadı.' 
                        : 'Henüz hiç dekont kaydı yok.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Öğrenci / İşletme
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Miktar / Tarih
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDekontlar.map((dekont) => (
                          <tr key={dekont.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  <User className="h-4 w-4 mr-2 text-gray-400" />
                                  {dekont.ogrenciler?.ad} {dekont.ogrenciler?.soyad}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                                  {dekont.isletmeler?.ad}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm text-gray-900 flex items-center">
                                  <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                                  {dekont.miktar ? `${dekont.miktar.toLocaleString('tr-TR')} TL` : 'Belirtilmemiş'}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(dekont.onay_durumu)}`}>
                                {getStatusIcon(dekont.onay_durumu)}
                                <span className="ml-1">{getStatusText(dekont.onay_durumu)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleView(dekont)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* View Modal */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Dekont Detayları"
        size="lg"
      >
        {selectedDekont && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Öğrenci Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDekont.ogrenciler?.ad} {selectedDekont.ogrenciler?.soyad}
                    </span>
                  </div>
                  {selectedDekont.ogrenciler?.sinif && (
                    <div className="text-sm text-gray-500 mt-1">
                      Sınıf: {selectedDekont.ogrenciler.sinif}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">İşletme Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDekont.isletmeler?.ad}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ödeme Miktarı</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDekont.miktar ? `${selectedDekont.miktar.toLocaleString('tr-TR')} TL` : 'Belirtilmemiş'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ödeme Tarihi</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(selectedDekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Onay Durumu</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(selectedDekont.onay_durumu)}`}>
                  {getStatusIcon(selectedDekont.onay_durumu)}
                  <span className="ml-2">{getStatusText(selectedDekont.onay_durumu)}</span>
                </span>
              </div>
            </div>

            {selectedDekont.dekont_dosyasi && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dekont Dosyası</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {selectedDekont.dekont_dosyasi}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Kayıt Tarihi</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-sm text-gray-600">
                  {new Date(selectedDekont.created_at).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
} 