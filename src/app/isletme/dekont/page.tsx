'use client'

import { useState, useEffect } from 'react'
import { Building2, Lock, User, Upload, Calendar, CreditCard, FileText, ArrowLeft, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

export default function IsletmeDekontPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
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
                  placeholder="İşletme adı veya yetkili kişi ara..."
                  className="w-full p-4 border border-gray-200 rounded-lg pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              </div>

              {isDropdownOpen && filteredIsletmeler.length > 0 && (
                <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-10">
                  {filteredIsletmeler.map((isletme) => (
                    <div
                      key={isletme.id}
                      onClick={() => handleIsletmeSelect(isletme)}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800">{isletme.ad}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {isletme.yetkili_kisi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && filteredIsletmeler.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>İşletme bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: PIN Girişi */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Geri Dön
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">{selectedIsletme?.ad}</h2>
              <p className="text-gray-600 flex items-center justify-center gap-1">
                <User className="w-4 h-4" />
                {selectedIsletme?.yetkili_kisi}
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="max-w-sm mx-auto">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  PIN Kodu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="****"
                    className="w-full p-4 border border-gray-200 rounded-lg pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={4}
                  />
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                </div>
                {pinError && (
                  <p className="text-red-500 text-sm mt-2">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Dekont Formu */}
        {step === 3 && selectedIsletme && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold">Dekont Gönder</h2>
                <p className="text-sm text-gray-600">{selectedIsletme.ad}</p>
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                ✅ Dekont başarıyla gönderildi! Onay için beklemede.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Stajyer Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stajyer Öğrenci
                </label>
                <select
                  value={selectedStaj}
                  onChange={(e) => setSelectedStaj(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Stajyer seçin...</option>
                  {stajlar.map((staj) => (
                    <option key={staj.id} value={staj.id}>
                      {staj.ogrenciler.ad} {staj.ogrenciler.soyad} - {staj.ogrenciler.sinif}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ödeme Miktarı */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4" />
                  Ödeme Miktarı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={miktar}
                  onChange={(e) => setMiktar(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Ödeme Tarihi */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Ödeme Tarihi
                </label>
                <input
                  type="date"
                  value={odemeTarihi}
                  onChange={(e) => setOdemeTarihi(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Dekont Dosyası */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Upload className="w-4 h-4" />
                  Dekont Dosyası
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDekontDosyasi(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, JPEG veya PNG formatında yükleyebilirsiniz
                </p>
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Gönderiliyor...' : 'Dekont Gönder'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
} 