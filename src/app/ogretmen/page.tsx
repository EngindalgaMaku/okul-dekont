'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, FileText, LogOut, Building2, Upload, Eye, Filter, CheckCircle, XCircle, Clock, Calendar, CreditCard, User, Search, Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import Modal from '@/components/ui/Modal'
import DekontBildirim from '@/components/ui/DekontBildirim'

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

type ActiveTab = 'isletmeler' | 'stajyerler' | 'dekont-yukle' | 'dekontlar'

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
    <div className="min-h-screen bg-gray-100">
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              onClick={() => setActiveTab('stajyerler')}
              className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'stajyerler' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="h-5 w-5" />
              <span>Öğrenciler ({stajyerler.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dekont-yukle')}
              className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'dekont-yukle' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Upload className="h-5 w-5" />
              <span>Dekont Yükle</span>
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
                  <div key={isletme.id} className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-blue-100 hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{isletme.ad}</h3>
                      <div className="p-2 bg-blue-50 rounded-full">
                        <Building2 className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Yetkili: {isletme.yetkili_kisi}</p>
                    <p className="text-sm text-gray-600 mt-1">{isletme.ogrenci_sayisi} aktif stajyer</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stajyerler' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Aktif Öğrencileriniz</h2>
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3 font-semibold">Öğrenci</th>
                            <th className="p-3 font-semibold">İşletme</th>
                            <th className="p-3 font-semibold">Staj Tarihleri</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stajyerler.map(stajyer => (
                            <tr key={stajyer.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                    <p className="font-semibold text-gray-800">{stajyer.ad} {stajyer.soyad}</p>
                                    <p className="text-xs text-gray-500">{stajyer.sinif} - {stajyer.alan}</p>
                                </td>
                                <td className="p-3">{stajyer.isletme.ad}</td>
                                <td className="p-3">{new Date(stajyer.baslangic_tarihi).toLocaleDateString()} - {new Date(stajyer.bitis_tarihi).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
               </div>
            </div>
          )}

          {activeTab === 'dekont-yukle' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Yeni Dekont Yükle</h2>
              <form onSubmit={handleDekontSubmit} className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Stajyer Seç</label>
                   <select
                     value={selectedStajyer}
                     onChange={(e) => setSelectedStajyer(e.target.value)}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                     required
                   >
                     <option value="" disabled>Lütfen bir stajyer seçin</option>
                     {stajyerler.map(stajyer => (
                       <option key={stajyer.staj_id} value={stajyer.staj_id}>
                         {stajyer.ad} {stajyer.soyad} ({stajyer.isletme.ad})
                       </option>
                     ))}
                   </select>
                 </div>
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
          )}

          {activeTab === 'dekontlar' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">Yüklenen Dekontlar</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Öğrenci, işletme ara..."
                        value={dekontSearchTerm}
                        onChange={(e) => setDekontSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                     <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">Tümü</option>
                      <option value="bekliyor">Bekliyor</option>
                      <option value="onaylandi">Onaylandı</option>
                      <option value="reddedildi">Reddedildi</option>
                    </select>
                  </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3 font-semibold">Öğrenci</th>
                            <th className="p-3 font-semibold">İşletme</th>
                            <th className="p-3 font-semibold">Dönem</th>
                            <th className="p-3 font-semibold">Durum</th>
                            <th className="p-3 font-semibold">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDekontlar.map(dekont => (
                            <tr key={dekont.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-semibold text-gray-800">{dekont.ogrenciler?.ad} {dekont.ogrenciler?.soyad}</td>
                                <td className="p-3">{dekont.isletmeler?.ad}</td>
                                <td className="p-3">{new Date(dekont.odeme_tarihi).toLocaleDateString()}</td>
                                <td className="p-3">
                                   <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${getStatusClass(dekont.onay_durumu)}`}>
                                      {getStatusIcon(dekont.onay_durumu)}
                                      {getStatusText(dekont.onay_durumu)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <button onClick={() => handleView(dekont)} className="p-1 text-gray-500 hover:text-blue-600">
                                    <Eye className="w-5 h-5"/>
                                  </button>
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

      <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          © {new Date().getFullYear()} {okulAdi} - Koordinatörlük Yönetim Sistemi. Tüm Hakları Saklıdır.
        </div>
      </footer>

      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Dekont Detayları" size="lg">
        {selectedDekont && (
          <div className="space-y-4 p-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">Öğrenci Bilgileri</h4>
                 <p>{selectedDekont.ogrenciler?.ad} {selectedDekont.ogrenciler?.soyad}</p>
                 <p className="text-sm text-gray-600">{selectedDekont.ogrenciler?.sinif}</p>
               </div>
               <div className="bg-gray-100 p-4 rounded-lg">
                 <h4 className="font-semibold mb-2">İşletme Bilgileri</h4>
                 <p>{selectedDekont.isletmeler?.ad}</p>
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
        )}
      </Modal>
    </div>
  )
} 