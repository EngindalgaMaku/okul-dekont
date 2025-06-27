'use client'

import { useState, useEffect } from 'react'
import { Building2, Lock, User, Upload, Calendar, CreditCard, FileText, ArrowLeft, Search, Eye, Filter, CheckCircle, XCircle, Clock, Plus, Download, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, validateFile } from '@/lib/storage'
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

interface Belge {
  id: number
  isletme_id: number
  ad: string
  tur: string
  dosya_url?: string
  yukleme_tarihi: string
}

export default function IsletmeDekontPage() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'list', 'belgeler'
  const [step, setStep] = useState(1) // 1: İşletme Seçimi, 2: PIN Girişi, 3: Ana Panel
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

  // Belgeler için state'ler
  const [belgeler, setBelgeler] = useState<Belge[]>([])
  const [filteredBelgeler, setFilteredBelgeler] = useState<Belge[]>([])
  const [belgeSearchTerm, setBelgeSearchTerm] = useState('')
  const [belgeTurFilter, setBelgeTurFilter] = useState<string>('all')
  const [belgeModalOpen, setBelgeModalOpen] = useState(false)
  const [belgeViewModal, setBelgeViewModal] = useState(false)
  const [selectedBelge, setSelectedBelge] = useState<Belge | null>(null)

  // Dekont form verileri
  const [selectedStaj, setSelectedStaj] = useState('')
  const [miktar, setMiktar] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState('')
  const [dekontDosyasi, setDekontDosyasi] = useState<File | null>(null)

  // Belge form verileri
  const [belgeFormData, setBelgeFormData] = useState({
    ad: '',
    tur: 'sozlesme',
    customTur: '',
    dosya: null as File | null
  })

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

  // Belge filtreleme
  useEffect(() => {
    if (!selectedIsletme) return
    
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
  }, [belgeler, belgeSearchTerm, belgeTurFilter, selectedIsletme])

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

  const fetchBelgeler = async () => {
    if (!selectedIsletme) return
    
    const { data, error } = await supabase
      .from('belgeler')
      .select('*')
      .eq('isletme_id', selectedIsletme.id)
      .order('yukleme_tarihi', { ascending: false })

    if (error) {
      console.error('Belgeler çekilirken hata:', error)
    } else {
      setBelgeler(data || [])
      setFilteredBelgeler(data || [])
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
      fetchBelgeler()
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
      let dosyaUrl = null
      let dosyaPath = null

      // Dosya yükleme işlemi
      if (dekontDosyasi) {
        // Dosya validasyonu
        const validation = validateFile(dekontDosyasi, 10, ['pdf', 'jpg', 'jpeg', 'png'])
        if (!validation.valid) {
          alert(validation.error)
          setLoading(false)
          return
        }

        // Dosyayı Supabase Storage'a yükle
        const uploadResult = await uploadFile('dekontlar', dekontDosyasi, 'dekont_')
        if (!uploadResult) {
          alert('Dosya yüklenirken hata oluştu!')
          setLoading(false)
          return
        }

        dosyaUrl = uploadResult.url
        dosyaPath = uploadResult.path
      }

      const { error } = await supabase
        .from('dekontlar')
        .insert({
          staj_id: parseInt(selectedStaj),
          isletme_id: selectedIsletme?.id,
          miktar: parseFloat(miktar),
          odeme_tarihi: odemeTarihi,
          dekont_dosyasi: dosyaUrl,
          dekont_dosya_path: dosyaPath,
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
      // Dosya validasyonu
      const validation = validateFile(belgeFormData.dosya, 10, ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      // Dosyayı Supabase Storage'a yükle
      const uploadResult = await uploadFile('belgeler', belgeFormData.dosya, 'belge_')
      if (!uploadResult) {
        alert('Dosya yüklenirken hata oluştu!')
        return
      }

      // Belge kaydını veritabanına ekle
      const { error: belgeError } = await supabase
        .from('belgeler')
        .insert({
          isletme_id: selectedIsletme?.id,
          ad: belgeFormData.ad,
          tur: belgeTuru,
          dosya_url: uploadResult.url,
          dosya_path: uploadResult.path,
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
      
      await fetchBelgeler()
      
    } catch (error) {
      console.error('Belge ekleme hatası:', error)
      alert('Belge eklenirken hata oluştu!')
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

  const handleBelgeView = (belge: Belge) => {
    setSelectedBelge(belge)
    setBelgeViewModal(true)
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

  const formatBelgeTur = (tur: string) => {
    switch (tur) {
      case 'sozlesme': return 'Sözleşme'
      case 'fesih_belgesi': return 'Fesih Belgesi'
      case 'usta_ogretici_belgesi': return 'Usta Öğretici Belgesi'
      default: return tur
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
                <button
                  onClick={() => setActiveTab('belgeler')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'belgeler'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Belgeler
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

            {activeTab === 'belgeler' && (
              <div className="space-y-6">
                {/* Belgeler Filtreler */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Belgeler</h3>
                    <button 
                      onClick={() => setBelgeModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Belge Ekle
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                          className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  
                  <div className="text-sm text-gray-500">
                    Toplam: {filteredBelgeler.length} belge
                  </div>
                </div>

                {/* Belgeler Listesi */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {filteredBelgeler.length > 0 ? (
                    <div className="space-y-4 p-6">
                      {filteredBelgeler.map((belge) => (
                        <div key={belge.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                                <FileText className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{belge.ad}</h4>
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
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz belge yok</h3>
                      <p className="text-gray-600 mb-6">Bu işletme için henüz belge yüklenmemiş.</p>
                      <button 
                        onClick={() => setBelgeModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Belgeyi Ekle
                      </button>
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
    </div>
  )
} 