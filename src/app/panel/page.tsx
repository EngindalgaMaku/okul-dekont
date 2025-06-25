'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileText, LogOut, User, Bell, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'

interface Isletme {
  id: number
  ad: string
  yetkili_kisi: string
}

interface Stajyer {
  id: number
  ad: string
  soyad: string
  sinif: string
  alan: string
  baslangic_tarihi: string
  bitis_tarihi: string
}

interface Dekont {
  id: number
  ogrenci_adi: string
  miktar: number
  odeme_tarihi: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
}

export default function PanelPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [isletme, setIsletme] = useState<Isletme | null>(null)
  const [activeTab, setActiveTab] = useState('stajyerler')
  const [stajyerler, setStajyerler] = useState<Stajyer[]>([])
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [loading, setLoading] = useState(true)

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

  const fetchData = async () => {
    setLoading(true)
    const storedIsletme = JSON.parse(localStorage.getItem('isletme') || '{}')

    // Stajyerleri getir
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
          alan:alanlar(ad)
        )
      `)
      .eq('isletme_id', storedIsletme.id)
      .eq('durum', 'aktif')

    if (stajData) {
      const formattedStajyerler = stajData.map((staj: any) => ({
        id: staj.ogrenci.id,
        ad: staj.ogrenci.ad,
        soyad: staj.ogrenci.soyad,
        sinif: staj.ogrenci.sinif,
        alan: staj.ogrenci.alan.ad,
        baslangic_tarihi: staj.baslangic_tarihi,
        bitis_tarihi: staj.bitis_tarihi
      }))
      setStajyerler(formattedStajyerler)
    }

    // Dekontları getir
    const { data: dekontData } = await supabase
      .from('dekontlar')
      .select(`
        id,
        miktar,
        odeme_tarihi,
        onay_durumu,
        staj:stajlar(
          ogrenci:ogrenciler(
            ad,
            soyad
          )
        )
      `)
      .eq('isletme_id', storedIsletme.id)
      .order('created_at', { ascending: false })

    if (dekontData) {
      const formattedDekontlar = dekontData.map((dekont: any) => ({
        id: dekont.id,
        ogrenci_adi: `${dekont.staj.ogrenci.ad} ${dekont.staj.ogrenci.soyad}`,
        miktar: dekont.miktar,
        odeme_tarihi: dekont.odeme_tarihi,
        onay_durumu: dekont.onay_durumu
      }))
      setDekontlar(formattedDekontlar)
    }

    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isletme')
    router.push('/')
  }

  if (!isletme) return null

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-[1200px] px-8 flex flex-col">
        {/* Header */}
        <header className="w-full bg-emerald-600 shadow-lg rounded-b-lg">
          <div className="py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-white">
                    {isletme.ad}
                  </h1>
                  <p className="text-sm text-emerald-100">İşletme Paneli</p>
                  <p className="text-xs text-emerald-200">{isletme.yetkili_kisi}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{okulAdi}</p>
                  <p className="text-xs text-emerald-100">{egitimYili} Eğitim-Öğretim Yılı</p>
                </div>
                <button className="p-2 text-emerald-200 hover:text-white">
                  <Bell className="h-6 w-6" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-emerald-100 hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8 flex-grow">
          <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex gap-6">
                <button
                  onClick={() => setActiveTab('stajyerler')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stajyerler'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Stajyerler</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('dekontlar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dekontlar'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>Dekontlar</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Content */}
            {loading ? (
              <div className="w-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Yükleniyor...</p>
              </div>
            ) : activeTab === 'stajyerler' ? (
              <>
                <div className="px-4 py-5 border-b border-gray-200 sm:px-0">
                  <h2 className="text-lg font-medium text-gray-900">Stajyer Öğrenciler</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Toplam {stajyerler.length} aktif stajyer
                  </p>
                </div>
                {stajyerler.length > 0 ? (
                  <div className="divide-y divide-gray-200 -mx-6 md:-mx-8">
                    {stajyerler.map((stajyer) => (
                      <div key={stajyer.id} className="px-6 md:px-8 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {stajyer.ad} {stajyer.soyad}
                            </h3>
                            <p className="text-sm text-gray-500">{stajyer.alan}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>Sınıf: {stajyer.sinif}</p>
                            <p className="mt-1">
                              {new Date(stajyer.baslangic_tarihi).toLocaleDateString('tr-TR')} -{' '}
                              {new Date(stajyer.bitis_tarihi).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Stajyer Bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">Henüz aktif stajyeriniz bulunmuyor.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-5 border-b border-gray-200 sm:px-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Dekont Geçmişi</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Toplam {dekontlar.length} dekont
                      </p>
                    </div>
                    {dekontlar.length > 0 && (
                      <button
                        onClick={() => router.push('/panel/dekont/yeni')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yeni Dekont Ekle
                      </button>
                    )}
                  </div>
                </div>
                {dekontlar.length > 0 ? (
                  <div className="divide-y divide-gray-200 -mx-6 md:-mx-8">
                    {dekontlar.map((dekont) => (
                      <div key={dekont.id} className="px-6 md:px-8 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{dekont.ogrenci_adi}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {dekont.miktar.toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                              })}
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dekont.onay_durumu === 'onaylandi'
                                  ? 'bg-green-100 text-green-800'
                                  : dekont.onay_durumu === 'reddedildi'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {dekont.onay_durumu.charAt(0).toUpperCase() + dekont.onay_durumu.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Dekont Bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">Sisteme henüz dekont yüklenmemiş.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => router.push('/panel/dekont/yeni')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yeni Dekont Ekle
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-emerald-600 shadow-lg rounded-t-lg">
          <div className="py-4 px-6 text-center text-sm text-emerald-100">
            &copy; {new Date().getFullYear()} {okulAdi} - Staj Dekont Sistemi. Tüm Hakları Saklıdır.
          </div>
        </footer>
      </div>
    </div>
  )
} 