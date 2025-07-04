'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Briefcase, Plus, Edit, Trash2, User, Users, ArrowLeft, GraduationCap, School, UserCheck, Settings, AlertTriangle, Lock, Building2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Link from 'next/link'

interface Alan {
  id: number
  ad: string
  aciklama?: string
  aktif: boolean
}

interface HaftalikProgram {
  pazartesi: 'okul' | 'isletme' | 'bos'
  sali: 'okul' | 'isletme' | 'bos'
  carsamba: 'okul' | 'isletme' | 'bos'
  persembe: 'okul' | 'isletme' | 'bos'
  cuma: 'okul' | 'isletme' | 'bos'
}

interface Sinif {
  id: string
  ad: string
  dal?: string
  ogrenci_sayisi?: number
  alan_id: string
  isletme_gunleri?: string
  okul_gunleri?: string
  haftalik_program?: HaftalikProgram
}

interface Ogrenci {
  id: string
  ad: string
  soyad: string
  ogrenci_no: string
  sinif_id: string
}

interface OgrenciFormData {
  ad: string
  soyad: string
  ogrenci_no: string
  sinif_id: string
}

interface Ogretmen {
  id: number
  ad: string
  soyad: string
  email: string
  alan_id: number
  telefon?: string
  is_koordinator?: boolean
}

interface Isletme {
  id: string
  ad: string
  adres?: string
  telefon?: string
  alan_id: string
}

export default function AlanDetayPage() {
  const router = useRouter()
  const params = useParams()
  const alanId = params.id as string
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'ogretmenler'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [alan, setAlan] = useState<Alan | null>(null)
  const [siniflar, setSiniflar] = useState<Sinif[]>([])
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([])
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSinifFilter, setSelectedSinifFilter] = useState('')
  const [filteredOgrenciler, setFilteredOgrenciler] = useState<Ogrenci[]>([])
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])

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
  const [ogrenciFormData, setOgrenciFormData] = useState<OgrenciFormData>({
    ad: '',
    soyad: '',
    ogrenci_no: '',
    sinif_id: ''
  })

  // Öğrenci düzenleme form state
  const [editOgrenciFormData, setEditOgrenciFormData] = useState({
    ad: '',
    soyad: '',
    no: '',
    sinif: ''
  })

  // Alan ayarları için state'ler
  const [alanAyarlarModal, setAlanAyarlarModal] = useState(false)
  const [alanSilModal, setAlanSilModal] = useState(false)
  const [alanFormData, setAlanFormData] = useState({
    ad: '',
    aciklama: '',
    aktif: false
  })

  // Silme onayı için state
  const [silmeOnayi, setSilmeOnayi] = useState('')
  const [silmeHatasi, setSilmeHatasi] = useState('')

  useEffect(() => {
    if (alanId) {
      fetchAlanDetay()
      fetchSiniflar()
      fetchOgrenciler()
      fetchOgretmenler()
      fetchIsletmeler()
    }
  }, [alanId])

  useEffect(() => {
    if (alan) {
      setAlanFormData({
        ad: alan.ad,
        aciklama: alan.aciklama || '',
        aktif: alan.aktif || false
      })
    }
  }, [alan])

  // Öğrencileri filtreleme useEffect'i
  useEffect(() => {
    if (selectedSinifFilter) {
      setFilteredOgrenciler(ogrenciler.filter(ogrenci => ogrenci.sinif_id === selectedSinifFilter))
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

  const fetchOgretmenler = async () => {
    const { data, error } = await supabase
      .from('ogretmenler')
      .select('*')
      .eq('alan_id', alanId)
      .order('ad', { ascending: true })

    if (error) {
      console.error('Öğretmenler alınırken hata:', error)
      return
    }

    setOgretmenler(data || [])
  }

  const fetchIsletmeler = async () => {
    const { data, error } = await supabase
      .from('isletme_alanlar')
      .select('isletmeler(*)')
      .eq('alan_id', alanId)

    if (error) {
      console.error('İşletmeler alınırken hata:', error)
    } else if (data) {
      const isletmeListesi = data
        .map((item: any) => item.isletmeler)
        .filter(Boolean) as Isletme[]
      
      isletmeListesi.sort((a, b) => (a.ad || '').localeCompare(b.ad || ''))
      setIsletmeler(isletmeListesi)
    }
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
        !ogrenciFormData.ogrenci_no.trim() || !ogrenciFormData.sinif_id.trim()) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }

    try {
      const { data, error } = await supabase
        .from('ogrenciler')
        .insert([
          {
            ad: ogrenciFormData.ad.trim(),
            soyad: ogrenciFormData.soyad.trim(),
            ogrenci_no: ogrenciFormData.ogrenci_no.trim(),
            sinif_id: ogrenciFormData.sinif_id,
            alan_id: params.id
          }
        ])
        .select()

      if (error) throw error

      setOgrenciler([...ogrenciler, data[0]])
      setOgrenciModalOpen(false)
      setOgrenciFormData({ ad: '', soyad: '', ogrenci_no: '', sinif_id: '' })
    } catch (error) {
      console.error('Öğrenci eklenirken hata:', error)
      alert('Öğrenci eklenirken bir hata oluştu')
    }
  }

  const handleSinifClick = (sinif: Sinif) => {
    setSelectedSinif(selectedSinif?.id === sinif.id ? null : sinif)
  }

  const handleOgrenciDuzenle = (ogrenci: Ogrenci) => {
    setSelectedOgrenci(ogrenci)
    setEditOgrenciFormData({
      ad: ogrenci.ad,
      soyad: ogrenci.soyad,
      no: ogrenci.ogrenci_no,
      sinif: ogrenci.sinif_id
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

    const durumMetni = (durum: string) => {
      switch (durum) {
        case 'okul': return 'Okul'
        case 'isletme': return 'İşletme'
        default: return 'Boş'
      }
    }

    const sonrakiDurum = (durum: string): 'okul' | 'isletme' | 'bos' => {
      switch (durum) {
        case 'bos': return 'okul'
        case 'okul': return 'isletme'
        default: return 'bos'
      }
    }

    return (
      <div className="grid grid-cols-5 gap-4">
        {gunler.map(({ key, label }) => (
          <div key={key} className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">
              {label}
            </div>
            <button
              type="button"
              onClick={() => gunDegistir(key as keyof HaftalikProgram, sonrakiDurum(program[key as keyof HaftalikProgram]))}
              disabled={readOnly}
              className={`w-full p-4 rounded-lg border ${durumRengi(program[key as keyof HaftalikProgram])} ${!readOnly && 'hover:opacity-80'} transition-opacity duration-200`}
            >
              <div className="text-2xl mb-1">{durumIkonu(program[key as keyof HaftalikProgram])}</div>
              <div className="text-sm font-medium">{durumMetni(program[key as keyof HaftalikProgram])}</div>
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Alan güncelleme fonksiyonu
  const handleAlanGuncelle = async () => {
    if (!alanFormData.ad.trim()) {
      alert('Alan adı boş olamaz!')
      return
    }

    try {
      setSubmitLoading(true)
      
      const { data, error } = await supabase
        .from('alanlar')
        .update({
          ad: alanFormData.ad.trim(),
          aciklama: alanFormData.aciklama?.trim() || null,
          aktif: alanFormData.aktif
        })
        .eq('id', alanId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Başarılı güncelleme
      await fetchAlanDetay()
      setAlanAyarlarModal(false)
    } catch (error) {
      console.error('Alan güncellenirken hata:', error)
      alert('Alan güncellenirken bir hata oluştu.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // Alan silme fonksiyonu
  const handleAlanSil = async () => {
    try {
      setSubmitLoading(true)

      // Önce bağlı öğrencileri kontrol et
      const { data: ogrenciler, error: ogrenciError } = await supabase
        .from('ogrenciler')
        .select('id')
        .eq('alan_id', alanId)

      if (ogrenciError) throw ogrenciError

      if (ogrenciler && ogrenciler.length > 0) {
        alert(`Bu alanda ${ogrenciler.length} öğrenci kayıtlı. Önce öğrencileri başka bir alana aktarmanız gerekiyor.`)
        setAlanSilModal(false)
        return
      }

      // Öğretmenleri kontrol et
      const { data: ogretmenler, error: ogretmenError } = await supabase
        .from('ogretmenler')
        .select('id, ad, soyad')
        .eq('alan_id', alanId)

      if (ogretmenError) throw ogretmenError

      if (ogretmenler && ogretmenler.length > 0) {
        const ogretmenListesi = ogretmenler.map(o => `${o.ad} ${o.soyad}`).join(', ')
        alert(`Bu alanda ${ogretmenler.length} öğretmen görevli (${ogretmenListesi}). Önce öğretmenleri başka bir alana aktarmanız gerekiyor.`)
        setAlanSilModal(false)
        return
      }

      const { error } = await supabase
        .from('alanlar')
        .delete()
        .eq('id', alanId)

      if (error) throw error

      router.push('/admin/alanlar')
    } catch (error) {
      console.error('Alan silinirken hata:', error)
      alert('Alan silinirken bir hata oluştu.')
    } finally {
      setSubmitLoading(false)
      setAlanSilModal(false)
    }
  }

  // Pasif alan kontrolü
  if (!alan?.aktif) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Üst Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center text-sm text-gray-600 mb-2">
                <Link href="/admin/alanlar" className="hover:text-indigo-600 flex items-center">
                  Meslek Alanları
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-gray-900">{alan?.ad}</span>
              </nav>

              <h1 className="text-2xl font-semibold text-gray-900">{alan?.ad}</h1>
            </div>

            <button
              onClick={() => setAlanAyarlarModal(true)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Alan Bilgileri */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent mb-2">
              {alan?.ad}
            </h1>
            <p className="text-gray-600">
              Alan detayları, sınıflar ve öğrenciler
            </p>
            {alan?.aciklama && (
              <p className="mt-4 text-gray-700 bg-amber-50 rounded-lg p-4">
                {alan.aciklama}
              </p>
            )}
            
            {/* Pasif Alan Uyarısı */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Bu Alan Pasif Durumda
                  </h3>
                  <p className="text-amber-700 mb-4">
                    Bu alanda herhangi bir işlem yapabilmek için önce alanı aktif hale getirmeniz gerekmektedir.
                    Pasif alanlarda öğrenci ve öğretmen işlemleri yapılamaz.
                  </p>
                  <button
                    onClick={() => setAlanAyarlarModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors duration-200"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Alan Ayarlarını Aç
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kilitli İçerik */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center opacity-50">
            <School className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-500 mb-2">
              Alan İçeriği Kilitli
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Bu alandaki öğretmen, sınıf ve öğrenci bilgilerine erişmek için 
              önce alanı aktif hale getirmeniz gerekmektedir.
            </p>
          </div>
        </div>

        {/* Modalları ekle */}
        <Modal
          isOpen={alanAyarlarModal}
          onClose={() => setAlanAyarlarModal(false)}
          title="Alan Ayarları"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alan Adı
              </label>
              <input
                type="text"
                value={alanFormData.ad}
                onChange={(e) => setAlanFormData({ ...alanFormData, ad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={alanFormData.aciklama}
                onChange={(e) => setAlanFormData({ ...alanFormData, aciklama: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="alan-aktif"
                checked={alanFormData.aktif}
                onChange={(e) => setAlanFormData({ ...alanFormData, aktif: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="alan-aktif" className="ml-2 block text-sm text-gray-700">
                Alan aktif
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setAlanSilModal(true)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
              >
                Alanı Sil
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => setAlanAyarlarModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleAlanGuncelle}
                  disabled={submitLoading || !alanFormData.ad.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={alanSilModal}
          onClose={() => {
            setAlanSilModal(false)
            setSilmeOnayi('')
            setSilmeHatasi('')
          }}
          title="Alanı Sil"
        >
          <div className="space-y-4">
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-semibold">Dikkat!</span>
              </div>
              <p>Bu alan kalıcı olarak silinecek ve bu işlem geri alınamaz.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Onay
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Silme işlemini onaylamak için alan adını <span className="font-mono bg-gray-100 px-1 rounded">{alan?.ad}</span> yazın:
              </p>
              <input
                type="text"
                value={silmeOnayi}
                onChange={(e) => {
                  setSilmeOnayi(e.target.value)
                  setSilmeHatasi('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Alan adını yazın"
              />
              {silmeHatasi && (
                <p className="mt-1 text-sm text-red-600">{silmeHatasi}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => {
                  setAlanSilModal(false)
                  setSilmeOnayi('')
                  setSilmeHatasi('')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (silmeOnayi !== alan?.ad) {
                    setSilmeHatasi('Alan adı eşleşmiyor')
                    return
                  }
                  handleAlanSil()
                }}
                disabled={!silmeOnayi || silmeOnayi !== alan?.ad || submitLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Üst Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-600 mb-2">
              <Link href="/admin/alanlar" className="hover:text-indigo-600 flex items-center">
                Meslek Alanları
              </Link>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-gray-900">{alan?.ad}</span>
            </nav>

            <h1 className="text-2xl font-semibold text-gray-900">{alan?.ad}</h1>
          </div>

          <button
            onClick={() => setAlanAyarlarModal(true)}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('ogretmenler')
                  router.replace(`/admin/alanlar/${alanId}?tab=ogretmenler`)
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'ogretmenler'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5" />
                Öğretmenler ({ogretmenler.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('siniflar')
                  router.replace(`/admin/alanlar/${alanId}?tab=siniflar`)
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'siniflar'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Sınıflar ({siniflar.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('isletmeler')
                  router.replace(`/admin/alanlar/${alanId}?tab=isletmeler`)
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'isletmeler'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5" />
                İşletmeler ({isletmeler.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'ogretmenler' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ogretmenler.map((ogretmen: any) => (
                  <div
                    key={ogretmen.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-full">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{ogretmen.ad} {ogretmen.soyad}</h3>
                        {ogretmen.email && <p className="text-sm text-gray-500">{ogretmen.email}</p>}
                        {ogretmen.telefon && <p className="text-sm text-gray-500">{ogretmen.telefon}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'siniflar' && (
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
                          <Link
                            href={`/admin/alanlar/${alanId}/siniflar/${sinif.id}`}
                            className="flex items-center flex-1 text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200"
                          >
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <School className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{sinif.ad}</h3>
                              <p className="text-sm text-gray-500">{sinif.ogrenci_sayisi || 0} öğrenci</p>
                              {sinif.dal && (
                                <p className="text-xs text-indigo-600 font-medium">{sinif.dal}</p>
                              )}
                            </div>
                          </Link>
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'isletmeler' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isletmeler.map((isletme: any) => (
                  <div
                    key={isletme.id}
                    onClick={() => router.push(`/admin/isletmeler/${isletme.id}?ref=/admin/alanlar/${alanId}?tab=isletmeler`)}
                    className="p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-full">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{isletme.ad}</h3>
                        {isletme.adres && <p className="text-sm text-gray-500">{isletme.adres}</p>}
                        {isletme.telefon && <p className="text-sm text-gray-500">{isletme.telefon}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sınıf Ekleme Modalı */}
      <Modal
        isOpen={sinifModalOpen}
        onClose={() => setSinifModalOpen(false)}
        title="Yeni Sınıf Ekle"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sınıf Adı
            </label>
            <input
              type="text"
              value={sinifFormData.ad}
              onChange={(e) => setSinifFormData({ ...sinifFormData, ad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Örn: 12-A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dal
            </label>
            <input
              type="text"
              value={sinifFormData.dal}
              onChange={(e) => setSinifFormData({ ...sinifFormData, dal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Örn: Web Programcılığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Haftalık Program
            </label>
            <HaftalikProgramBileseni
              program={sinifFormData.haftalik_program}
              onChange={(yeniProgram) => setSinifFormData({ ...sinifFormData, haftalik_program: yeniProgram })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setSinifModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleSinifEkle}
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
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
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sınıf Adı
            </label>
            <input
              type="text"
              value={editSinifFormData.ad}
              onChange={(e) => setEditSinifFormData({ ...editSinifFormData, ad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dal
            </label>
            <input
              type="text"
              value={editSinifFormData.dal}
              onChange={(e) => setEditSinifFormData({ ...editSinifFormData, dal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Haftalık Program
            </label>
            <HaftalikProgramBileseni
              program={editSinifFormData.haftalik_program}
              onChange={(yeniProgram) => setEditSinifFormData({ ...editSinifFormData, haftalik_program: yeniProgram })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setEditSinifModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleSinifGuncelle}
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
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
        description={`"${selectedSinif?.ad}" sınıfını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        isLoading={submitLoading}
      />

      {/* Öğrenci Modalları */}
      <Modal
        isOpen={ogrenciModalOpen}
        onClose={() => setOgrenciModalOpen(false)}
        title="Yeni Öğrenci Ekle"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad
            </label>
            <input
              type="text"
              value={ogrenciFormData.ad}
              onChange={(e) => setOgrenciFormData({ ...ogrenciFormData, ad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soyad
            </label>
            <input
              type="text"
              value={ogrenciFormData.soyad}
              onChange={(e) => setOgrenciFormData({ ...ogrenciFormData, soyad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öğrenci No
            </label>
            <input
              type="text"
              value={ogrenciFormData.ogrenci_no}
              onChange={(e) => setOgrenciFormData({ ...ogrenciFormData, ogrenci_no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setOgrenciModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleOgrenciEkle}
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
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
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad
            </label>
            <input
              type="text"
              value={editOgrenciFormData.ad}
              onChange={(e) => setEditOgrenciFormData({ ...editOgrenciFormData, ad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soyad
            </label>
            <input
              type="text"
              value={editOgrenciFormData.soyad}
              onChange={(e) => setEditOgrenciFormData({ ...editOgrenciFormData, soyad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öğrenci No
            </label>
            <input
              type="text"
              value={editOgrenciFormData.no}
              onChange={(e) => setEditOgrenciFormData({ ...editOgrenciFormData, no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setEditOgrenciModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleOgrenciGuncelle}
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Öğrenci Silme Onay Modalı */}
      <ConfirmModal
        isOpen={deleteOgrenciModal}
        onClose={() => setDeleteOgrenciModal(false)}
        onConfirm={handleOgrenciSilOnayla}
        title="Öğrenciyi Sil"
        description={`"${selectedOgrenci?.ad} ${selectedOgrenci?.soyad}" öğrencisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        isLoading={submitLoading}
      />

      {/* Alan Ayarları Modalı */}
      <Modal
        isOpen={alanAyarlarModal}
        onClose={() => setAlanAyarlarModal(false)}
        title="Alan Ayarları"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alan Adı
            </label>
            <input
              type="text"
              value={alanFormData.ad}
              onChange={(e) => setAlanFormData({ ...alanFormData, ad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={alanFormData.aciklama}
              onChange={(e) => setAlanFormData({ ...alanFormData, aciklama: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="aktif"
              checked={alanFormData.aktif}
              onChange={(e) => setAlanFormData({ ...alanFormData, aktif: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="aktif" className="ml-2 block text-sm text-gray-900">
              Alan aktif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setAlanAyarlarModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleAlanGuncelle}
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Alan Silme Onay Modalı */}
      <Modal
        isOpen={alanSilModal}
        onClose={() => setAlanSilModal(false)}
        title="Alanı Sil"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  Dikkat: Bu işlem geri alınamaz!
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Bu alanı silmek için alan adını ({alan?.ad}) aşağıdaki kutuya yazın.
                    Bu işlem geri alınamaz ve tüm alan verilerini silecektir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onay için alan adını yazın
            </label>
            <input
              type="text"
              value={silmeOnayi}
              onChange={(e) => setSilmeOnayi(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={alan?.ad}
            />
          </div>

          {silmeHatasi && (
            <div className="text-sm text-red-600">
              {silmeHatasi}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => {
                setAlanSilModal(false)
                setSilmeOnayi('')
                setSilmeHatasi('')
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleAlanSil}
              disabled={submitLoading || silmeOnayi !== alan?.ad}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {submitLoading ? 'Siliniyor...' : 'Alanı Sil'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 