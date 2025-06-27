'use client'

import { useState, useEffect } from 'react'
import { Building2, Lock, User, Upload, Calendar, CreditCard, FileText, ArrowLeft, Search, Eye, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'

interface Isletme {
  id: number
  ad: string
  yetkili_kisi: string
  pin: string
}

interface Staj {
  id: number
  ogrenci_id: number
  ogrenciler: {
    ad: string
    soyad: string
    sinif: string
  }
}

interface Dekont {
  id: number
  miktar: number
  odeme_tarihi: string
  dekont_dosyasi?: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  created_at: string
  ogrenciler?: { ad: string; soyad: string; sinif: string }
  ogretmenler?: { ad: string; soyad: string }
}

export default function IsletmeDekontPage() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' veya 'list'
  const [step, setStep] = useState(1) // 1: İşletme Seçimi, 2: PIN Girişi, 3: Dekont Formu
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [filteredIsletmeler, setFilteredIsletmeler] = useState<Isletme[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIsletme, setSelectedIsletme] = useState<Isletme | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [stajlar, setStajlar] = useState<Staj[]>([])
  const [loading, setLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Dekont listesi için state'ler
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [filteredDekontlar, setFilteredDekontlar] = useState<Dekont[]>([])
  const [dekontSearchTerm, setDekontSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewModal, setViewModal] = useState(false)
  const [selectedDekont, setSelectedDekont] = useState<Dekont | null>(null)

  // Dekont form verileri
  const [selectedStaj, setSelectedStaj] = useState('')
  const [miktar, setMiktar] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState('')
  const [dekontDosyasi, setDekontDosyasi] = useState<File | null>(null)

  // İşletmeleri yükle
  useEffect(() => {
    fetchIsletmeler()
  }, [])

  // Arama filtresini uygula
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredIsletmeler([])
      return
    }
    
    const filtered = isletmeler.filter(isletme => 
      isletme.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      isletme.yetkili_kisi.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredIsletmeler(filtered)
  }, [searchTerm, isletmeler])

  // Dekont filtreleme
  useEffect(() => {
    if (!selectedIsletme) return
    
    let filtered = dekontlar

    if (dekontSearchTerm) {
      filtered = filtered.filter(dekont => 
        dekont.ogrenciler?.ad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.ogrenciler?.soyad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.ogretmenler?.ad?.toLowerCase().includes(dekontSearchTerm.toLowerCase()) ||
        dekont.ogretmenler?.soyad?.toLowerCase().includes(dekontSearchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(dekont => dekont.onay_durumu === statusFilter)
    }

    setFilteredDekontlar(filtered)
  }, [dekontlar, dekontSearchTerm, statusFilter, selectedIsletme])

  const fetchIsletmeler = async () => {
    console.log('İşletmeler yükleniyor...')
    const { data, error } = await supabase
      .from('isletmeler')
      .select('id, ad, yetkili_kisi, pin')
      .order('ad')

    if (error) {
      console.error('İşletme yükleme hatası:', error)
      return
    }

    console.log('Yüklenen işletmeler:', data)
    if (data) {
      setIsletmeler(data)
    }
  }

  const fetchDekontlar = async () => {
    if (!selectedIsletme) return
    
    const { data, error } = await supabase
      .from('dekontlar')
      .select(`
        *,
        ogrenciler (ad, soyad, sinif),
        ogretmenler (ad, soyad)
      `)
      .eq('isletme_id', selectedIsletme.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Dekontlar çekilirken hata:', error)
    } else {
      setDekontlar(data || [])
      setFilteredDekontlar(data || [])
    }
  }

  // İşletme seç
  const handleIsletmeSelect = (isletme: Isletme) => {
    setSelectedIsletme(isletme)
    setSearchTerm(isletme.ad)
    setIsDropdownOpen(false)
    setStep(2)
    setPinInput('')
    setPinError('')
  }

  // PIN doğrula
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIsletme) return

    if (pinInput === selectedIsletme.pin) {
      setStep(3)
      setPinError('')
      fetchStajlar()
      fetchDekontlar()
    } else {
      setPinError('Yanlış PIN! Tekrar deneyin.')
      setPinInput('')
    }
  }

  // Stajları yükle
  const fetchStajlar = async () => {
    if (!selectedIsletme) return

    const { data, error } = await supabase
      .from('stajlar')
      .select(`
        id,
        ogrenci_id,
        ogrenciler (ad, soyad, sinif)
      `)
      .eq('isletme_id', selectedIsletme.id)
      .eq('durum', 'aktif')

    if (data) {
      setStajlar(data as any)
    }
  }

  // Dekont gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Dosya yükleme simülasyonu (gerçek uygulamada Supabase Storage kullanılır)
      let dosyaUrl = null
      if (dekontDosyasi) {
        dosyaUrl = `dekont_${Date.now()}_${dekontDosyasi.name}`
      }

      const { error } = await supabase
        .from('dekontlar')
        .insert({
          staj_id: parseInt(selectedStaj),
          isletme_id: selectedIsletme?.id,
          miktar: parseFloat(miktar),
          odeme_tarihi: odemeTarihi,
          dekont_dosyasi: dosyaUrl,
          onay_durumu: 'bekliyor'
        })

      if (error) throw error

      setSubmitSuccess(true)
      // Form sıfırla
      setSelectedStaj('')
      setMiktar('')
      setOdemeTarihi('')
      setDekontDosyasi(null)
      
      // Dekont listesini yenile
      fetchDekontlar()

    } catch (error) {
      console.error('Dekont gönderme hatası:', error)
      alert('Dekont gönderilirken hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  // Geri dön
  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setSelectedIsletme(null)
    } else if (step === 3) {
      setStep(2)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">İşletme Dekont Sistemi</h1>
              <p className="text-gray-600">Hüsniye Özdilek Mesleki ve Teknik Anadolu Lisesi</p>
            </div>
          </div>
        </div>

        {/* Step 1: İşletme Seçimi */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">İşletme Girişi</h2>
            </div>

            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="İşletme adı veya yetkili kişi ile arama yapın..."
                />
                <Search className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
              </div>

              {/* Dropdown */}
              {isDropdownOpen && filteredIsletmeler.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-10 max-h-60 overflow-y-auto">
                  {filteredIsletmeler.map((isletme) => (
                    <div
                      key={isletme.id}
                      onClick={() => handleIsletmeSelect(isletme)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{isletme.ad}</div>
                      <div className="text-sm text-gray-500">Yetkili: {isletme.yetkili_kisi}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {searchTerm && isDropdownOpen && filteredIsletmeler.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                Arama kriterlerinize uygun işletme bulunamadı.
              </div>
            )}
          </div>
        )}

        {/* Step 2: PIN Girişi */}
        {step === 2 && selectedIsletme && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Geri
            </button>

            <div className="text-center">
              <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">PIN Doğrulama</h2>
              <p className="text-gray-600 mb-6">
                <strong>{selectedIsletme.ad}</strong> işletmesi için PIN'inizi girin
              </p>

              <form onSubmit={handlePinSubmit} className="max-w-sm mx-auto">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full p-4 text-center text-2xl border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none mb-4"
                  placeholder="PIN"
                  maxLength={6}
                  required
                />
                {pinError && (
                  <div className="text-red-600 text-sm mb-4">{pinError}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Giriş Yap
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Ana Panel - Tabs */}
        {step === 3 && selectedIsletme && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Geri
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-800">{selectedIsletme.ad}</h2>
                  <p className="text-gray-600">Yetkili: {selectedIsletme.yetkili_kisi}</p>
                </div>
                <div></div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Dekont Yükle
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Dekont Listesi
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Yeni Dekont Yükle</h3>

                {submitSuccess ? (
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
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Yeni Dekont Yükle
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stajyer Öğrenci
                      </label>
                      <select
                        value={selectedStaj}
                        onChange={(e) => setSelectedStaj(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Öğrenci Seçin</option>
                        {stajlar.map((staj) => (
                          <option key={staj.id} value={staj.id}>
                            {staj.ogrenciler.ad} {staj.ogrenciler.soyad} - {staj.ogrenciler.sinif}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Miktarı (TL)
                      </label>
                      <input
                        type="number"
                        value={miktar}
                        onChange={(e) => setMiktar(e.target.value)}
                        step="0.01"
                        min="0"
                        required
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
                      disabled={loading}
                      className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
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

            {activeTab === 'list' && (
              <div className="space-y-6">
                {/* Filtreler */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Dekont Listesi</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                          placeholder="Öğrenci veya öğretmen adı..."
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
                  
                  <div className="text-sm text-gray-500">
                    Toplam: {filteredDekontlar.length} dekont
                  </div>
                </div>

                {/* Dekont Listesi */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Öğrenci / Öğretmen
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
                                {dekont.ogretmenler && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Öğretmen: {dekont.ogretmenler.ad} {dekont.ogretmenler.soyad}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm text-gray-900 flex items-center">
                                  <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                                  {dekont.miktar.toLocaleString('tr-TR')} TL
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
                  {filteredDekontlar.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Dekont bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {dekontSearchTerm || statusFilter !== 'all' 
                          ? 'Arama kriterlerinize uygun dekont bulunamadı.' 
                          : 'Henüz hiç dekont kaydı yok.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
              
              {selectedDekont.ogretmenler && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Öğretmen Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedDekont.ogretmenler.ad} {selectedDekont.ogretmenler.soyad}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ödeme Miktarı</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDekont.miktar.toLocaleString('tr-TR')} TL
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