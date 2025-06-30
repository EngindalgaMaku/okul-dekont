'use client'

import { useState, useEffect } from 'react'
import { Building2, Lock, User, Upload, Calendar, CreditCard, FileText, ArrowLeft, Search, Eye, Filter, CheckCircle, XCircle, Clock, Plus, Download, Trash2, Loader2 } from 'lucide-react'
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
  odeme_son_tarihi: string
  ay: number
  yil: number
  dekont_dosyasi?: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  red_nedeni?: string
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
  const [dekontModalOpen, setDekontModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Staj | null>(null)
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false)
  const [selectedBelgeForDeletion, setSelectedBelgeForDeletion] = useState<Belge | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dekont form verileri
  const [dekontFormData, setDekontFormData] = useState({
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    aciklama: '',
    tutar: '',
    dosya: null as File | null
  })

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
        stajlar (
          ogrenciler (
            ad,
            soyad,
            sinif
          )
        ),
        isletmeler (ad)
      `)
      .eq('isletme_id', selectedIsletme.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Dekontlar çekilirken hata:', error)
    } else {
      const formattedData = data?.map(item => ({
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
          ogrenciler: item.stajlar?.length > 0 && item.stajlar[0].ogrenciler?.length > 0
            ? {
                ad: item.stajlar[0].ogrenciler[0].ad,
                soyad: item.stajlar[0].ogrenciler[0].soyad,
                sinif: item.stajlar[0].ogrenciler[0].sinif
              }
            : null
        },
        isletmeler: {
          ad: item.isletmeler?.ad || ''
        },
        // Eski kodla uyumluluk için
        miktar: item.tutar,
        tarih: item.odeme_tarihi,
        odeme_son_tarihi: item.odeme_son_tarihi,
        dekont_dosyasi: item.dekont_dosyasi
      })) || []
      setDekontlar(formattedData)
      setFilteredDekontlar(formattedData)
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
    setPinError('')

    try {
      if (!selectedIsletme || !dekontFormData.tutar || !dekontFormData.dosya) {
        alert('Lütfen tüm zorunlu alanları doldurun ve dekont dosyasını yükleyin.')
        setLoading(false)
        return
      }

      // Dosya validasyonu
      const fileValidation = validateFile(dekontFormData.dosya)
      if (!fileValidation.valid) {
        alert(fileValidation.error)
        setLoading(false)
        return
      }

      // Dosyayı yükle
      const uploadResult = await uploadFile(
        'dekontlar',
        dekontFormData.dosya,
        `${selectedIsletme.id}/`
      )

      if (!uploadResult) {
        throw new Error('Dosya yüklenemedi')
      }

      // Dekontu veritabanına kaydet
      const { error: dekontError } = await supabase
        .from('dekontlar')
        .insert({
          isletme_id: selectedIsletme.id,
          miktar: parseFloat(dekontFormData.tutar),
          tarih: new Date().toISOString(),
          ay: dekontFormData.ay,
          yil: dekontFormData.yil,
          aciklama: dekontFormData.aciklama || null,
          dekont_dosyasi: uploadResult.url,
          dekont_dosya_path: uploadResult.path,
          onay_durumu: 'bekliyor'
        })

      if (dekontError) {
        throw dekontError
      }

      // Başarılı
      setSubmitSuccess(true)
      setDekontFormData({
        ay: new Date().getMonth() + 1,
        yil: new Date().getFullYear(),
        aciklama: '',
        tutar: '',
        dosya: null
      })

      // Dekont listesini güncelle
      fetchDekontlar()

      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Dekont yükleme hatası:', error)
      alert('Dekont yüklenirken bir hata oluştu.')
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

  const handleLogout = () => {
    setSelectedIsletme(null)
    setStep(1)
    setSearchTerm('')
    setPinInput('')
    setPinError('')
  }

  const handleDeleteBelge = (belgeId: number) => {
    const belgeToDelete = belgeler.find(b => b.id === belgeId)
    if (belgeToDelete) {
      setSelectedBelgeForDeletion(belgeToDelete)
      setConfirmDeleteModalOpen(true)
    }
  }
  
  const confirmDeleteBelge = async () => {
    if (!selectedBelgeForDeletion) return
  
    setIsDeleting(true)
    
    // First, delete from storage if there's a file
    if (selectedBelgeForDeletion.dosya_url) {
        try {
          const pathParts = selectedBelgeForDeletion.dosya_url.split('/')
          const fileNameWithQuery = pathParts[pathParts.length - 1]
          const fileName = fileNameWithQuery.split('?')[0] // remove query params
          if (fileName) {
            const { error: storageError } = await supabase.storage.from('belgeler').remove([`${selectedIsletme?.id}/${fileName}`])
            if (storageError) {
              console.error('Storage file deletion error:', storageError)
            }
          }
        } catch(e) {
            console.error(e)
        }
    }
  
    // Then, delete from the database
    const { error } = await supabase
      .from('belgeler')
      .delete()
      .eq('id', selectedBelgeForDeletion.id)
  
    if (error) {
      console.error('Error deleting belge:', error)
      // Handle error display to user
    } else {
      // Remove from local state
      setBelgeler(belgeler.filter(b => b.id !== selectedBelgeForDeletion.id))
      setFilteredBelgeler(filteredBelgeler.filter(b => b.id !== selectedBelgeForDeletion.id))
    }
    
    setIsDeleting(false)
    setConfirmDeleteModalOpen(false)
    setSelectedBelgeForDeletion(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="absolute top-4 left-4 z-20">
        <img src="/logo-beyaz.png" alt="Logo" className="h-12" />
      </div>

      {step < 3 && (
        <button 
          onClick={handleLogout} 
          className="absolute top-6 right-6 bg-white text-gray-700 hover:bg-gray-200 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 z-20 flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfa
        </button>
      )}

      {/* Step 1: İşletme Seçimi */}
      {step === 1 && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl text-center">
            <Building2 className="mx-auto h-16 w-16 text-blue-600 mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">İşletme Girişi</h1>
            <p className="text-gray-500 mb-8">Lütfen işletmenizi seçin.</p>
            
            <div className="relative">
              <div className="flex items-center border-2 border-gray-200 rounded-lg focus-within:border-blue-500 transition-all duration-300">
                <Search className="h-5 w-5 text-gray-400 mx-3" />
                <input
                  type="text"
                  placeholder="İşletme adını arayın..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full py-3 pr-3 bg-transparent text-gray-700 focus:outline-none"
                />
              </div>
              
              {isDropdownOpen && searchTerm && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredIsletmeler.length > 0 ? (
                    filteredIsletmeler.map(isletme => (
                      <button
                        key={isletme.id}
                        onClick={() => handleIsletmeSelect(isletme)}
                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <p className="font-semibold">{isletme.ad}</p>
                        <p className="text-sm text-gray-500">{isletme.yetkili_kisi}</p>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-gray-500">İşletme bulunamadı.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: PIN Girişi */}
      {step === 2 && selectedIsletme && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl text-center">
            <Lock className="mx-auto h-16 w-16 text-blue-600 mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedIsletme.ad}</h1>
            <p className="text-gray-500 mb-8">Lütfen 4 haneli PIN kodunuzu girin.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-4xl tracking-[1em] bg-gray-100 border-2 border-gray-200 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-all duration-300"
              />
              {pinError && <p className="text-red-500 mt-4">{pinError}</p>}
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400"
                disabled={pinInput.length !== 4}
              >
                Giriş Yap
              </button>
            </form>
            <button onClick={() => setStep(1)} className="mt-6 text-sm text-gray-500 hover:text-blue-600">
              Farklı bir işletme seç
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ana Panel */}
      {step === 3 && selectedIsletme && (
        <div className="p-2 md:p-4 bg-gray-50 min-h-screen">
          <header className="bg-white shadow-md rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{selectedIsletme.ad}</h1>
                <p className="text-sm text-gray-500">İşletme Paneli | {selectedIsletme.yetkili_kisi}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Çıkış Yap
              </button>
            </div>
          </header>

          <main>
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm md:text-base flex items-center`}
                >
                  <User className="mr-2 h-4 w-4" /> Öğrenciler
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`${
                    activeTab === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm md:text-base flex items-center`}
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Yüklenmiş Dekontlar
                </button>
                <button
                  onClick={() => setActiveTab('belgeler')}
                  className={`${
                    activeTab === 'belgeler'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm md:text-base flex items-center`}
                >
                  <FileText className="mr-2 h-4 w-4" /> Belgeler
                </button>
              </nav>
            </div>
            
            {/* Öğrenci ve Dekont Yükleme Sekmesi */}
            {activeTab === 'upload' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Öğrenciler</h2>
                    <p className="text-gray-500 text-sm">İşletmenizde staj yapan öğrenciler</p>
                  </div>
                </div>

                {stajlar.length === 0 && !loading && (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p>Bu işletmeye atanmış stajyer öğrenci bulunmamaktadır.</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {stajlar.map(staj => (
                    <div key={staj.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-full mr-4">
                          <User className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{staj.ogrenciler.ad} {staj.ogrenciler.soyad}</p>
                          <p className="text-sm text-gray-500">{staj.ogrenciler.sinif}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                        <button 
                          onClick={() => {setSelectedStudent(staj); setDekontModalOpen(true)}} 
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors flex items-center justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2"/> Dekont Yükle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Yüklenmiş Dekontlar Sekmesi */}
            {activeTab === 'list' && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Öğrenci, öğretmen ara..."
                      value={dekontSearchTerm}
                      onChange={(e) => setDekontSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded-lg py-2 px-3"
                    >
                      <option value="all">Tümü</option>
                      <option value="bekliyor">Bekliyor</option>
                      <option value="onaylandi">Onaylandı</option>
                      <option value="reddedildi">Reddedildi</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2">Öğrenci</th>
                        <th scope="col" className="px-3 py-2">Dönem</th>
                        <th scope="col" className="px-3 py-2">Tutar</th>
                        <th scope="col" className="px-3 py-2">Onay Durumu</th>
                        <th scope="col" className="px-3 py-2">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDekontlar.map(dekont => (
                        <tr key={dekont.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">
                            {dekont.ogrenciler ? `${dekont.ogrenciler.ad} ${dekont.ogrenciler.soyad}` : 'N/A'}
                          </td>
                          <td className="px-3 py-2">{dekont.ay}/{dekont.yil}</td>
                          <td className="px-3 py-2">{dekont.miktar} TL</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(dekont.onay_durumu)}`}>
                              {getStatusText(dekont.onay_durumu)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => handleView(dekont)} className="text-blue-600 hover:underline">
                              <Eye className="w-5 h-5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                 {filteredDekontlar.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Gösterilecek dekont bulunamadı.</p>
                  </div>
                )}
              </div>
            )}

            {/* Belgeler Sekmesi */}
            {activeTab === 'belgeler' && (
               <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                  <div className="w-full sm:w-auto">
                    <input 
                      type="text"
                      placeholder="Belge adı veya türü ara..."
                      value={belgeSearchTerm}
                      onChange={(e) => setBelgeSearchTerm(e.target.value)}
                      className="pl-4 pr-4 py-2 border rounded-lg w-full"
                    />
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <select 
                      value={belgeTurFilter}
                      onChange={(e) => setBelgeTurFilter(e.target.value)}
                      className="border rounded-lg py-2 px-3 w-full sm:w-auto"
                    >
                      <option value="all">Tüm Türler</option>
                      <option value="sozlesme">Sözleşme</option>
                      <option value="rapor">Rapor</option>
                      <option value="diger">Diğer</option>
                    </select>
                    <button 
                      onClick={() => { setBelgeFormData({ ad: '', tur: 'sozlesme', customTur: '', dosya: null }); setBelgeModalOpen(true); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2"/> Belge Ekle
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2">Belge Adı</th>
                        <th scope="col" className="px-3 py-2">Türü</th>
                        <th scope="col" className="px-3 py-2">Yükleme Tarihi</th>
                        <th scope="col" className="px-3 py-2">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBelgeler.map(belge => (
                        <tr key={belge.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{belge.ad}</td>
                          <td className="px-3 py-2">{formatBelgeTur(belge.tur)}</td>
                          <td className="px-3 py-2">{new Date(belge.yukleme_tarihi).toLocaleDateString()}</td>
                          <td className="px-3 py-2 flex items-center gap-2">
                            <button onClick={() => handleBelgeView(belge)} className="text-blue-600 hover:text-blue-800">
                              <Eye className="w-5 h-5"/>
                            </button>
                            {belge.dosya_url && (
                              <a href={belge.dosya_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                                <Download className="w-5 h-5"/>
                              </a>
                            )}
                            <button onClick={() => handleDeleteBelge(belge.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 className="w-5 h-5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                 {filteredBelgeler.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Gösterilecek belge bulunamadı.</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Dekont Yükleme Modalı */}
      {dekontModalOpen && selectedStudent && (
        <Modal isOpen={dekontModalOpen} onClose={() => setDekontModalOpen(false)} title="Dekont Yükle">
          <div className="p-2">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Dekont Yükle</h2>
            <p className="mb-6 text-gray-600"><span className='font-bold'>{selectedStudent.ogrenciler.ad} {selectedStudent.ogrenciler.soyad}</span> için dekont yüklüyorsunuz.</p>
            
            {submitSuccess && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-xl font-semibold text-gray-800">Başarılı!</h3>
                <p className="mt-2 text-gray-600">Dekont başarıyla yüklendi ve onaya gönderildi.</p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false)
                    setDekontModalOpen(false)
                  }}
                  className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Kapat
                </button>
              </div>
            )}

            {!submitSuccess && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form alanları buraya gelecek */}
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Yükle ve Onaya Gönder'}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModal && selectedDekont && (
        <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Dekont Detayları">
          <div className="space-y-4">
            <p><strong>Öğrenci:</strong> {selectedDekont.ogrenciler?.ad} {selectedDekont.ogrenciler?.soyad}</p>
            <p><strong>Tutar:</strong> {selectedDekont.miktar} TL</p>
            <p><strong>Dönem:</strong> {selectedDekont.ay}/{selectedDekont.yil}</p>
            <p><strong>Onay Durumu:</strong> {getStatusText(selectedDekont.onay_durumu)}</p>
            {selectedDekont.dekont_dosyasi && (
                <a href={selectedDekont.dekont_dosyasi} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dosyayı Görüntüle</a>
            )}
          </div>
        </Modal>
      )}

      {/* Belge Ekleme Modalı */}
      {belgeModalOpen && (
        <Modal isOpen={belgeModalOpen} onClose={() => setBelgeModalOpen(false)} title="Yeni Belge Ekle">
           <form onSubmit={handleBelgeEkle} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Belge Adı</label>
                  <input type="text" value={belgeFormData.ad} onChange={(e) => setBelgeFormData({...belgeFormData, ad: e.target.value})} className="w-full border p-2 rounded" required/>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Belge Türü</label>
                  <select value={belgeFormData.tur} onChange={(e) => setBelgeFormData({...belgeFormData, tur: e.target.value})} className="w-full border p-2 rounded">
                      <option value="sozlesme">Sözleşme</option>
                      <option value="rapor">Rapor</option>
                      <option value="diger">Diğer</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Dosya</label>
                  <input type="file" onChange={(e) => setBelgeFormData({...belgeFormData, dosya: e.target.files ? e.target.files[0] : null})} className="w-full border p-2 rounded" required/>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Belge Ekle'}
              </button>
          </form>
        </Modal>
      )}

      {/* Belge Görüntüleme Modalı */}
      {belgeViewModal && selectedBelge && (
        <Modal isOpen={belgeViewModal} onClose={() => setBelgeViewModal(false)} title="Belge Detayları">
           <div className="space-y-4">
              <p><strong>Belge Adı:</strong> {selectedBelge.ad}</p>
              <p><strong>Türü:</strong> {formatBelgeTur(selectedBelge.tur)}</p>
              <p><strong>Yükleme Tarihi:</strong> {new Date(selectedBelge.yukleme_tarihi).toLocaleDateString()}</p>
              {selectedBelge.dosya_url && (
                  <a href={selectedBelge.dosya_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dosyayı Görüntüle</a>
              )}
          </div>
        </Modal>
      )}

       {/* Belge Silme Onay Modalı */}
       {confirmDeleteModalOpen && selectedBelgeForDeletion && (
        <Modal isOpen={confirmDeleteModalOpen} onClose={() => setConfirmDeleteModalOpen(false)} title="Belgeyi Sil">
            <div className="p-6 text-center">
                <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belgeyi Silmek İstediğinize Emin Misiniz?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Bu işlem geri alınamaz. "<span className="font-bold">{selectedBelgeForDeletion.ad}</span>" adlı belge kalıcı olarak silinecektir.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setConfirmDeleteModalOpen(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        İptal
                    </button>
                    <button
                        onClick={confirmDeleteBelge}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Sil
                    </button>
                </div>
            </div>
        </Modal>
      )}

    </div>
  );
} 