'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Briefcase, Plus, Edit, Trash2, User, Users, ArrowLeft, GraduationCap, School } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Alan {
  id: number
  ad: string
}

interface HaftalikProgram {
  pazartesi: 'okul' | 'isletme' | 'bos'
  sali: 'okul' | 'isletme' | 'bos'
  carsamba: 'okul' | 'isletme' | 'bos' 
  persembe: 'okul' | 'isletme' | 'bos'
  cuma: 'okul' | 'isletme' | 'bos'
}

interface Sinif {
  id: number
  ad: string
  alan_id: number
  dal?: string
  isletme_gunleri?: string
  okul_gunleri?: string
  ogrenci_sayisi?: number
  haftalik_program?: HaftalikProgram
}

interface Ogrenci {
  id: number
  ad: string
  soyad: string
  no: string
  sinif: string
  alan_id: number
  isletme_adi?: string
  staj_durumu?: string
}

export default function AlanDetayPage() {
  const router = useRouter()
  const params = useParams()
  const alanId = params.id as string

  const [alan, setAlan] = useState<Alan | null>(null)
  const [siniflar, setSiniflar] = useState<Sinif[]>([])
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('siniflar')
  const [selectedSinifFilter, setSelectedSinifFilter] = useState('')
  const [filteredOgrenciler, setFilteredOgrenciler] = useState<Ogrenci[]>([])

  // Modal states
  const [sinifModalOpen, setSinifModalOpen] = useState(false)
  const [ogrenciModalOpen, setOgrenciModalOpen] = useState(false)
  const [editSinifModal, setEditSinifModal] = useState(false)
  const [deleteSinifModal, setDeleteSinifModal] = useState(false)
  const [editOgrenciModal, setEditOgrenciModal] = useState(false)
  const [deleteOgrenciModal, setDeleteOgrenciModal] = useState(false)
  const [selectedSinif, setSelectedSinif] = useState<Sinif | null>(null)
  const [selectedOgrenci, setSelectedOgrenci] = useState<Ogrenci | null>(null)

  // Form states
  const [yeniSinifAd, setYeniSinifAd] = useState('')
  const [editSinifAd, setEditSinifAd] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  // Sınıf ekleme form state
  const [sinifFormData, setSinifFormData] = useState({
    ad: '',
    dal: '',
    isletme_gunleri: '',
    okul_gunleri: '',
    haftalik_program: {
      pazartesi: 'bos' as 'okul' | 'isletme' | 'bos',
      sali: 'bos' as 'okul' | 'isletme' | 'bos',
      carsamba: 'bos' as 'okul' | 'isletme' | 'bos',
      persembe: 'bos' as 'okul' | 'isletme' | 'bos',
      cuma: 'bos' as 'okul' | 'isletme' | 'bos'
    }
  })

  // Sınıf düzenleme form state
  const [editSinifFormData, setEditSinifFormData] = useState({
    ad: '',
    dal: '',
    isletme_gunleri: '',
    okul_gunleri: '',
    haftalik_program: {
      pazartesi: 'bos' as 'okul' | 'isletme' | 'bos',
      sali: 'bos' as 'okul' | 'isletme' | 'bos',
      carsamba: 'bos' as 'okul' | 'isletme' | 'bos',
      persembe: 'bos' as 'okul' | 'isletme' | 'bos',
      cuma: 'bos' as 'okul' | 'isletme' | 'bos'
    }
  })

  // Öğrenci form state
  const [ogrenciFormData, setOgrenciFormData] = useState({
    ad: '',
    soyad: '',
    no: '',
    sinif: ''
  })

  // Öğrenci düzenleme form state
  const [editOgrenciFormData, setEditOgrenciFormData] = useState({
    ad: '',
    soyad: '',
    no: '',
    sinif: ''
  })

  useEffect(() => {
    if (alanId) {
      fetchAlanDetay()
      fetchSiniflar()
      fetchOgrenciler()
    }
  }, [alanId])

  // Öğrencileri filtreleme useEffect'i
  useEffect(() => {
    if (selectedSinifFilter) {
      setFilteredOgrenciler(ogrenciler.filter(ogrenci => ogrenci.sinif === selectedSinifFilter))
    } else {
      setFilteredOgrenciler(ogrenciler)
    }
  }, [ogrenciler, selectedSinifFilter])

  const fetchAlanDetay = async () => {
    const { data, error } = await supabase
      .from('alanlar')
      .select('*')
      .eq('id', alanId)
      .single()

    if (error) {
      console.error('Alan detayları alınırken hata:', error)
      router.push('/admin/alanlar')
    } else {
      setAlan(data)
    }
  }

  const fetchSiniflar = async () => {
    // Önce sınıfları al
    const { data: sinifData, error: sinifError } = await supabase
      .from('siniflar')
      .select('*')
      .eq('alan_id', alanId)
      .order('ad')

    if (sinifError) {
      console.error('Sınıflar alınırken hata:', sinifError)
      return
    }

    // Her sınıf için öğrenci sayısını al
    const siniflarWithCount = await Promise.all(
      (sinifData || []).map(async (sinif) => {
        const { count } = await supabase
          .from('ogrenciler')
          .select('*', { count: 'exact', head: true })
          .eq('sinif', sinif.ad)
          .eq('alan_id', alanId)

        return {
          ...sinif,
          ogrenci_sayisi: count || 0
        }
      })
    )

    setSiniflar(siniflarWithCount)
    setLoading(false)
  }

  const fetchOgrenciler = async () => {
    // Öğrencileri ve işletme bilgilerini çek
    const { data, error } = await supabase
      .from('ogrenciler')
      .select(`
        *,
        isletmeler(ad)
      `)
      .eq('alan_id', alanId)
      .order('sinif', { ascending: true })
      .order('ad', { ascending: true })

    if (error) {
      console.error('Öğrenciler alınırken hata:', error)
      return
    }

         // İşletme adını düzgün formata çevir
     const ogrencilerWithIsletme = (data || []).map((ogrenci: any) => ({
       ...ogrenci,
       isletme_adi: ogrenci.isletmeler?.ad || null,
       staj_durumu: ogrenci.isletme_id ? 'aktif' : 'isletmesi_yok'
     }))

    setOgrenciler(ogrencilerWithIsletme)
  }

  const handleSinifEkle = async () => {
    if (!sinifFormData.ad.trim()) {
      alert('Sınıf adı gereklidir!')
      return
    }

    setSubmitLoading(true)
    const { error } = await supabase
      .from('siniflar')
      .insert({
        ad: sinifFormData.ad.trim(),
        alan_id: parseInt(alanId),
        dal: sinifFormData.dal.trim() || null,
        isletme_gunleri: sinifFormData.isletme_gunleri || null,
        okul_gunleri: sinifFormData.okul_gunleri || null,
        haftalik_program: sinifFormData.haftalik_program || null
      })

    if (error) {
      alert('Sınıf eklenirken hata oluştu: ' + error.message)
    } else {
      setSinifModalOpen(false)
      setSinifFormData({ ad: '', dal: '', isletme_gunleri: '', okul_gunleri: '', haftalik_program: { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' } })
      fetchSiniflar()
    }
    setSubmitLoading(false)
  }

  const handleSinifDuzenle = (sinif: Sinif) => {
    setSelectedSinif(sinif)
    setEditSinifFormData({
      ad: sinif.ad,
      dal: sinif.dal || '',
      isletme_gunleri: sinif.isletme_gunleri || '',
      okul_gunleri: sinif.okul_gunleri || '',
      haftalik_program: sinif.haftalik_program || { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' }
    })
    setEditSinifModal(true)
  }

  const handleSinifGuncelle = async () => {
    if (!selectedSinif || !editSinifFormData.ad.trim()) {
      alert('Sınıf adı gereklidir!')
      return
    }

    setSubmitLoading(true)
    const { error } = await supabase
      .from('siniflar')
      .update({
        ad: editSinifFormData.ad.trim(),
        dal: editSinifFormData.dal.trim() || null,
        isletme_gunleri: editSinifFormData.isletme_gunleri || null,
        okul_gunleri: editSinifFormData.okul_gunleri || null,
        haftalik_program: editSinifFormData.haftalik_program || null
      })
      .eq('id', selectedSinif.id)

    if (error) {
      alert('Sınıf güncellenirken hata oluştu: ' + error.message)
    } else {
      setEditSinifModal(false)
      fetchSiniflar()
      fetchOgrenciler() // Öğrenci listesini de güncelle
    }
    setSubmitLoading(false)
  }

  const handleSinifSil = (sinif: Sinif) => {
    setSelectedSinif(sinif)
    setDeleteSinifModal(true)
  }

  const handleSinifSilOnayla = async () => {
    if (!selectedSinif) return

    // Önce bu sınıfta öğrenci var mı kontrol et
    const { data: ogrenciData, error: ogrenciError } = await supabase
      .from('ogrenciler')
      .select('id')
      .eq('sinif', selectedSinif.ad)
      .eq('alan_id', alanId)

    if (ogrenciError) {
      alert('Sınıf kontrolü yapılırken hata oluştu: ' + ogrenciError.message)
      return
    }

    if (ogrenciData && ogrenciData.length > 0) {
      alert(`Bu sınıfta ${ogrenciData.length} öğrenci var. Önce öğrencileri silin veya başka sınıfa taşıyın.`)
      setDeleteSinifModal(false)
      return
    }

    setSubmitLoading(true)
    const { error } = await supabase
      .from('siniflar')
      .delete()
      .eq('id', selectedSinif.id)

    if (error) {
      alert('Sınıf silinirken hata oluştu: ' + error.message)
    } else {
      setDeleteSinifModal(false)
      fetchSiniflar()
      fetchOgrenciler()
    }
    setSubmitLoading(false)
  }

  const handleOgrenciEkle = async () => {
    if (!ogrenciFormData.ad.trim() || !ogrenciFormData.soyad.trim() || 
        !ogrenciFormData.no.trim() || !ogrenciFormData.sinif.trim()) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }

    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogrenciler')
      .insert({
        ad: ogrenciFormData.ad.trim(),
        soyad: ogrenciFormData.soyad.trim(),
        no: ogrenciFormData.no.trim(),
        sinif: ogrenciFormData.sinif.trim(),
        alan_id: parseInt(alanId)
      })

    if (error) {
      alert('Öğrenci eklenirken hata oluştu: ' + error.message)
    } else {
      setOgrenciModalOpen(false)
      setOgrenciFormData({ ad: '', soyad: '', no: '', sinif: '' })
      fetchOgrenciler()
      fetchSiniflar() // Sınıf sayılarını güncelle
    }
    setSubmitLoading(false)
  }

  const handleSinifClick = (sinifAd: string) => {
    setSelectedSinifFilter(sinifAd)
    setActiveTab('ogrenciler')
  }

  const handleOgrenciDuzenle = (ogrenci: Ogrenci) => {
    setSelectedOgrenci(ogrenci)
    setEditOgrenciFormData({
      ad: ogrenci.ad,
      soyad: ogrenci.soyad,
      no: ogrenci.no,
      sinif: ogrenci.sinif
    })
    setEditOgrenciModal(true)
  }

  const handleOgrenciGuncelle = async () => {
    if (!selectedOgrenci || !editOgrenciFormData.ad.trim() || 
        !editOgrenciFormData.soyad.trim() || !editOgrenciFormData.no.trim() || 
        !editOgrenciFormData.sinif.trim()) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }

    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogrenciler')
      .update({
        ad: editOgrenciFormData.ad.trim(),
        soyad: editOgrenciFormData.soyad.trim(),
        no: editOgrenciFormData.no.trim(),
        sinif: editOgrenciFormData.sinif.trim()
      })
      .eq('id', selectedOgrenci.id)

    if (error) {
      alert('Öğrenci güncellenirken hata oluştu: ' + error.message)
    } else {
      setEditOgrenciModal(false)
      fetchOgrenciler()
      fetchSiniflar() // Sınıf sayılarını güncelle
    }
    setSubmitLoading(false)
  }

  const handleOgrenciSil = (ogrenci: Ogrenci) => {
    setSelectedOgrenci(ogrenci)
    setDeleteOgrenciModal(true)
  }

  const handleOgrenciSilOnayla = async () => {
    if (!selectedOgrenci) return

    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogrenciler')
      .delete()
      .eq('id', selectedOgrenci.id)

    if (error) {
      alert('Öğrenci silinirken hata oluştu: ' + error.message)
    } else {
      setDeleteOgrenciModal(false)
      fetchOgrenciler()
      fetchSiniflar() // Sınıf sayılarını güncelle
    }
    setSubmitLoading(false)
  }

  // Haftalık program yardımcı fonksiyonları
  const gunleriGetir = (programString: string): string[] => {
    if (!programString) return []
    return programString.split('-')
  }

  const programOtomatikOlustur = (isletmeGunleri: string, okulGunleri: string): HaftalikProgram => {
    const program: HaftalikProgram = {
      pazartesi: 'bos',
      sali: 'bos', 
      carsamba: 'bos',
      persembe: 'bos',
      cuma: 'bos'
    }

    const isletmeGunListesi = gunleriGetir(isletmeGunleri)
    const okulGunListesi = gunleriGetir(okulGunleri)

    // İşletme günlerini ayarla
    isletmeGunListesi.forEach(gun => {
      const gunAdi = gun.toLowerCase().trim()
      let programKey: keyof HaftalikProgram | null = null
      
      switch (gunAdi) {
        case 'pazartesi': programKey = 'pazartesi'; break
        case 'salı': programKey = 'sali'; break
        case 'çarşamba': programKey = 'carsamba'; break
        case 'perşembe': programKey = 'persembe'; break
        case 'cuma': programKey = 'cuma'; break
      }
      
      if (programKey) {
        program[programKey] = 'isletme'
      }
    })

    // Okul günlerini ayarla  
    okulGunListesi.forEach(gun => {
      const gunAdi = gun.toLowerCase().trim()
      let programKey: keyof HaftalikProgram | null = null
      
      switch (gunAdi) {
        case 'pazartesi': programKey = 'pazartesi'; break
        case 'salı': programKey = 'sali'; break
        case 'çarşamba': programKey = 'carsamba'; break
        case 'perşembe': programKey = 'persembe'; break
        case 'cuma': programKey = 'cuma'; break
      }
      
      if (programKey) {
        program[programKey] = 'okul'
      }
    })

    return program
  }

  // Haftalık Program Bileşeni
  const HaftalikProgramBileseni = ({ 
    program, 
    onChange, 
    readOnly = false 
  }: {
    program: HaftalikProgram
    onChange?: (yeniProgram: HaftalikProgram) => void
    readOnly?: boolean
  }) => {
    const gunler = [
      { key: 'pazartesi', label: 'Pazartesi' },
      { key: 'sali', label: 'Salı' },
      { key: 'carsamba', label: 'Çarşamba' },
      { key: 'persembe', label: 'Perşembe' },
      { key: 'cuma', label: 'Cuma' }
    ]

    const gunDegistir = (gun: keyof HaftalikProgram, durum: 'okul' | 'isletme' | 'bos') => {
      if (!onChange || readOnly) return
      onChange({
        ...program,
        [gun]: durum
      })
    }

    const durumRengi = (durum: string) => {
      switch (durum) {
        case 'okul': return 'bg-blue-100 border-blue-300 text-blue-800'
        case 'isletme': return 'bg-green-100 border-green-300 text-green-800'
        default: return 'bg-gray-100 border-gray-300 text-gray-600'
      }
    }

    const durumIkonu = (durum: string) => {
      switch (durum) {
        case 'okul': return '🏫'
        case 'isletme': return '🏢'
        default: return '⭕'
      }
    }

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Haftalık Program {!readOnly && '(Tıklayarak değiştirin)'}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {gunler.map(({ key, label }) => (
            <div key={key} className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
              <div 
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center
                  ${durumRengi(program[key as keyof HaftalikProgram])}
                  ${!readOnly ? 'hover:shadow-md transform hover:scale-105' : ''}
                `}
                onClick={() => {
                  if (readOnly) return
                  const mevcutDurum = program[key as keyof HaftalikProgram]
                  const yeniDurum = mevcutDurum === 'bos' ? 'okul' : 
                                  mevcutDurum === 'okul' ? 'isletme' : 'bos'
                  gunDegistir(key as keyof HaftalikProgram, yeniDurum)
                }}
              >
                <div className="text-lg mb-1">
                  {durumIkonu(program[key as keyof HaftalikProgram])}
                </div>
                <div className="text-xs font-semibold">
                  {program[key as keyof HaftalikProgram] === 'okul' ? 'Okul' :
                   program[key as keyof HaftalikProgram] === 'isletme' ? 'İşletme' : 'Boş'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {!readOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <div className="text-sm text-amber-700">
              <strong>12. Sınıf Kuralı:</strong> Haftada 2 gün okul, 3 gün işletme olmalıdır.
            </div>
            <div className="text-xs text-amber-600 mt-1">
              Günlere tıklayarak: Boş → Okul → İşletme döngüsü yapabilirsiniz.
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading || !alan) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/alanlar')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Alan Yönetimine Dön
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {alan.ad}
              </h1>
              <p className="text-gray-600 mt-2">Alan detayları, sınıflar ve öğrenciler</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('siniflar')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'siniflar'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  Sınıflar ({siniflar.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ogrenciler')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'ogrenciler'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Öğrenciler ({ogrenciler.length})
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'siniflar' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Sınıflar</h2>
                  <button
                    onClick={() => {
                      setSinifFormData({ ad: '', dal: '', isletme_gunleri: '', okul_gunleri: '', haftalik_program: { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' } })
                      setSinifModalOpen(true)
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Sınıf Ekle
                  </button>
                </div>

                {siniflar.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {siniflar.map((sinif) => (
                      <div key={sinif.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => handleSinifClick(sinif.ad)}
                            className="flex items-center flex-1 text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200"
                          >
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <School className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{sinif.ad}</h3>
                              <p className="text-sm text-gray-500">{sinif.ogrenci_sayisi} öğrenci</p>
                              {sinif.dal && (
                                <p className="text-xs text-indigo-600 font-medium">{sinif.dal}</p>
                              )}
                              {/* Haftalık Program Önizleme */}
                              {sinif.haftalik_program ? (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-600 mb-1">Haftalık Program:</div>
                                  <div className="flex gap-1">
                                    {['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'].map((gun) => {
                                      const durum = sinif.haftalik_program![gun as keyof HaftalikProgram]
                                      return (
                                        <div
                                          key={gun}
                                          className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                                            durum === 'okul' ? 'bg-blue-100 text-blue-700' :
                                            durum === 'isletme' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-500'
                                          }`}
                                          title={`${gun.charAt(0).toUpperCase() + gun.slice(1)}: ${
                                            durum === 'okul' ? 'Okul' :
                                            durum === 'isletme' ? 'İşletme' : 'Boş'
                                          }`}
                                        >
                                          {durum === 'okul' ? '🏫' : durum === 'isletme' ? '🏢' : '⭕'}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sinif.isletme_gunleri && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      🏢 {sinif.isletme_gunleri}
                                    </span>
                                  )}
                                  {sinif.okul_gunleri && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      🏫 {sinif.okul_gunleri}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSinifDuzenle(sinif)
                              }}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSinifSil(sinif)
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <School className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz sınıf yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Bu alan için henüz sınıf eklenmemiş.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setSinifFormData({ ad: '', dal: '', isletme_gunleri: '', okul_gunleri: '', haftalik_program: { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' } })
                          setSinifModalOpen(true)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Sınıfı Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900">Öğrenciler</h2>
                    {selectedSinifFilter && (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {selectedSinifFilter} Sınıfı
                        </span>
                        <button
                          onClick={() => setSelectedSinifFilter('')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedSinifFilter}
                      onChange={(e) => setSelectedSinifFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="">Tüm Sınıflar</option>
                      {siniflar.map((sinif) => (
                        <option key={sinif.id} value={sinif.ad}>
                          {sinif.ad}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setOgrenciFormData({ 
                          ad: '', 
                          soyad: '', 
                          no: '', 
                          sinif: selectedSinifFilter || '' 
                        })
                        setOgrenciModalOpen(true)
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Öğrenci Ekle
                    </button>
                  </div>
                </div>

                {filteredOgrenciler.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Öğrenci
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Numara
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sınıf
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aktif İşletme
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOgrenciler.map((ogrenci) => (
                          <tr key={ogrenci.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                  <User className="h-4 w-4 text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {ogrenci.ad} {ogrenci.soyad}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ogrenci.no}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {ogrenci.sinif}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ogrenci.isletme_adi ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  🏢 {ogrenci.isletme_adi}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  ❌ İşletmesi yok
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleOgrenciDuzenle(ogrenci)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOgrenciSil(ogrenci)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {selectedSinifFilter ? `${selectedSinifFilter} sınıfında öğrenci yok` : 'Henüz öğrenci yok'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedSinifFilter ? 
                        `${selectedSinifFilter} sınıfına henüz öğrenci eklenmemiş.` : 
                        'Bu alan için henüz öğrenci eklenmemiş.'}
                    </p>
                    <div className="mt-6">
                      {selectedSinifFilter && (
                        <button
                          onClick={() => setSelectedSinifFilter('')}
                          className="inline-flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all duration-200 mr-3"
                        >
                          Tüm Öğrencileri Göster
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setOgrenciFormData({ 
                            ad: '', 
                            soyad: '', 
                            no: '', 
                            sinif: selectedSinifFilter || '' 
                          })
                          setOgrenciModalOpen(true)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {selectedSinifFilter ? `${selectedSinifFilter}'a Öğrenci Ekle` : 'İlk Öğrenciyi Ekle'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sınıf Ekleme Modalı */}
      <Modal
        isOpen={sinifModalOpen}
        onClose={() => {
          setSinifModalOpen(false)
          setSinifFormData({ ad: '', dal: '', isletme_gunleri: '', okul_gunleri: '', haftalik_program: { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' } })
        }}
        title="Yeni Sınıf Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınıf Adı *
              </label>
              <input
                type="text"
                value={sinifFormData.ad}
                onChange={(e) => setSinifFormData({...sinifFormData, ad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: 12-A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dal
              </label>
              <input
                type="text"
                value={sinifFormData.dal}
                onChange={(e) => setSinifFormData({...sinifFormData, dal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: Web Programcılığı"
              />
            </div>
          </div>
          
          {/* Haftalık Program */}
          <div>
            <HaftalikProgramBileseni
              program={sinifFormData.haftalik_program}
              onChange={(yeniProgram) => setSinifFormData({...sinifFormData, haftalik_program: yeniProgram})}
            />
          </div>

          {/* Hızlı Seçim Butonları */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Hızlı Program Seçimi</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const program: HaftalikProgram = {
                    pazartesi: 'isletme',
                    sali: 'isletme', 
                    carsamba: 'isletme',
                    persembe: 'okul',
                    cuma: 'okul'
                  }
                  setSinifFormData({
                    ...sinifFormData, 
                    haftalik_program: program,
                    isletme_gunleri: 'Pazartesi-Salı-Çarşamba',
                    okul_gunleri: 'Perşembe-Cuma'
                  })
                }}
                className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                🏢 Pazartesi-Çarşamba İşletme<br/>🏫 Perşembe-Cuma Okul
              </button>
              <button
                type="button"
                onClick={() => {
                  const program: HaftalikProgram = {
                    pazartesi: 'okul',
                    sali: 'okul',
                    carsamba: 'okul', 
                    persembe: 'isletme',
                    cuma: 'isletme'
                  }
                  setSinifFormData({
                    ...sinifFormData,
                    haftalik_program: program,
                    isletme_gunleri: 'Perşembe-Cuma',
                    okul_gunleri: 'Pazartesi-Salı-Çarşamba'
                  })
                }}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                🏫 Pazartesi-Çarşamba Okul<br/>🏢 Perşembe-Cuma İşletme
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setSinifModalOpen(false)
                setSinifFormData({ ad: '', dal: '', isletme_gunleri: '', okul_gunleri: '', haftalik_program: { pazartesi: 'bos', sali: 'bos', carsamba: 'bos', persembe: 'bos', cuma: 'bos' } })
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSinifEkle}
              disabled={submitLoading || !sinifFormData.ad.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
            >
              {submitLoading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sınıf Düzenleme Modalı */}
      <Modal
        isOpen={editSinifModal}
        onClose={() => setEditSinifModal(false)}
        title="Sınıfı Düzenle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınıf Adı *
              </label>
              <input
                type="text"
                value={editSinifFormData.ad}
                onChange={(e) => setEditSinifFormData({...editSinifFormData, ad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dal
              </label>
              <input
                type="text"
                value={editSinifFormData.dal}
                onChange={(e) => setEditSinifFormData({...editSinifFormData, dal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: Web Programcılığı"
              />
            </div>
          </div>
          
          {/* Haftalık Program */}
          <div>
            <HaftalikProgramBileseni
              program={editSinifFormData.haftalik_program}
              onChange={(yeniProgram) => setEditSinifFormData({...editSinifFormData, haftalik_program: yeniProgram})}
            />
          </div>

          {/* Hızlı Seçim Butonları */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Hızlı Program Seçimi</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const program: HaftalikProgram = {
                    pazartesi: 'isletme',
                    sali: 'isletme', 
                    carsamba: 'isletme',
                    persembe: 'okul',
                    cuma: 'okul'
                  }
                  setEditSinifFormData({
                    ...editSinifFormData, 
                    haftalik_program: program,
                    isletme_gunleri: 'Pazartesi-Salı-Çarşamba',
                    okul_gunleri: 'Perşembe-Cuma'
                  })
                }}
                className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                🏢 Pazartesi-Çarşamba İşletme<br/>🏫 Perşembe-Cuma Okul
              </button>
              <button
                type="button"
                onClick={() => {
                  const program: HaftalikProgram = {
                    pazartesi: 'okul',
                    sali: 'okul',
                    carsamba: 'okul', 
                    persembe: 'isletme',
                    cuma: 'isletme'
                  }
                  setEditSinifFormData({
                    ...editSinifFormData,
                    haftalik_program: program,
                    isletme_gunleri: 'Perşembe-Cuma',
                    okul_gunleri: 'Pazartesi-Salı-Çarşamba'
                  })
                }}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                🏫 Pazartesi-Çarşamba Okul<br/>🏢 Perşembe-Cuma İşletme
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setEditSinifModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSinifGuncelle}
              disabled={submitLoading || !editSinifFormData.ad.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Öğrenci Ekleme Modalı */}
      <Modal
        isOpen={ogrenciModalOpen}
        onClose={() => {
          setOgrenciModalOpen(false)
          setOgrenciFormData({ ad: '', soyad: '', no: '', sinif: '' })
        }}
        title="Yeni Öğrenci Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                type="text"
                value={ogrenciFormData.ad}
                onChange={(e) => setOgrenciFormData({...ogrenciFormData, ad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Öğrenci adı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soyad
              </label>
              <input
                type="text"
                value={ogrenciFormData.soyad}
                onChange={(e) => setOgrenciFormData({...ogrenciFormData, soyad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Öğrenci soyadı"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öğrenci Numarası
              </label>
              <input
                type="text"
                value={ogrenciFormData.no}
                onChange={(e) => setOgrenciFormData({...ogrenciFormData, no: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: 1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınıf
              </label>
              <select
                value={ogrenciFormData.sinif}
                onChange={(e) => setOgrenciFormData({...ogrenciFormData, sinif: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sınıf Seçin</option>
                {siniflar.map((sinif) => (
                  <option key={sinif.id} value={sinif.ad}>
                    {sinif.ad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setOgrenciModalOpen(false)
                setOgrenciFormData({ ad: '', soyad: '', no: '', sinif: '' })
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleOgrenciEkle}
              disabled={submitLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
            >
              {submitLoading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Öğrenci Düzenleme Modalı */}
      <Modal
        isOpen={editOgrenciModal}
        onClose={() => setEditOgrenciModal(false)}
        title="Öğrenciyi Düzenle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                type="text"
                value={editOgrenciFormData.ad}
                onChange={(e) => setEditOgrenciFormData({...editOgrenciFormData, ad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Öğrenci adı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soyad
              </label>
              <input
                type="text"
                value={editOgrenciFormData.soyad}
                onChange={(e) => setEditOgrenciFormData({...editOgrenciFormData, soyad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Öğrenci soyadı"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öğrenci Numarası
              </label>
              <input
                type="text"
                value={editOgrenciFormData.no}
                onChange={(e) => setEditOgrenciFormData({...editOgrenciFormData, no: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: 1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınıf
              </label>
              <select
                value={editOgrenciFormData.sinif}
                onChange={(e) => setEditOgrenciFormData({...editOgrenciFormData, sinif: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sınıf Seçin</option>
                {siniflar.map((sinif) => (
                  <option key={sinif.id} value={sinif.ad}>
                    {sinif.ad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setEditOgrenciModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleOgrenciGuncelle}
              disabled={submitLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sınıf Silme Onay Modalı */}
      <ConfirmModal
        isOpen={deleteSinifModal}
        onClose={() => setDeleteSinifModal(false)}
        onConfirm={handleSinifSilOnayla}
        title="Sınıfı Sil"
        message={`"${selectedSinif?.ad}" sınıfını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        loading={submitLoading}
      />

      {/* Öğrenci Silme Onay Modalı */}
      <ConfirmModal
        isOpen={deleteOgrenciModal}
        onClose={() => setDeleteOgrenciModal(false)}
        onConfirm={handleOgrenciSilOnayla}
        title="Öğrenciyi Sil"
        message={`"${selectedOgrenci?.ad} ${selectedOgrenci?.soyad}" öğrencisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        loading={submitLoading}
      />
    </div>
  )
} 