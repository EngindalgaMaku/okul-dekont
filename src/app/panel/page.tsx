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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl rounded-b-2xl">
          <div className="py-6 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-white">
                    {isletme.ad}
                  </h1>
                  <p className="text-sm text-indigo-100 font-medium">İşletme Paneli</p>
                  <p className="text-xs text-indigo-200">{isletme.yetkili_kisi}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-sm font-medium text-white">{okulAdi}</p>
                  <p className="text-xs text-indigo-100">{egitimYili} Eğitim-Öğretim Yılı</p>
                </div>
                <button className="p-3 text-indigo-200 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200">
                  <Bell className="h-6 w-6" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-indigo-100 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200"
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
          <div className="w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex gap-8">
                <button
                  onClick={() => setActiveTab('stajyerler')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'stajyerler'
                      ? 'border-indigo-500 text-indigo-600'
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
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'dekontlar'
                      ? 'border-indigo-500 text-indigo-600'
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
              <div className="w-full text-center py-16">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
              </div>
            ) : activeTab === 'stajyerler' ? (
              <>
                <div className="px-4 py-6 border-b border-gray-200 sm:px-0">
                  <h2 className="text-xl font-semibold text-gray-900">Stajyer Öğrenciler</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Toplam <span className="font-semibold text-indigo-600">{stajyerler.length}</span> aktif stajyer
                  </p>
                </div>
                {stajyerler.length > 0 ? (
                  <div className="divide-y divide-gray-100 -mx-6 md:-mx-8">
                    {stajyerler.map((stajyer) => (
                      <div key={stajyer.id} className="px-6 md:px-8 py-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                              <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-base font-semibold text-gray-900">
                                {stajyer.ad} {stajyer.soyad}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{stajyer.alan}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Sınıf: {stajyer.sinif}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(stajyer.baslangic_tarihi).toLocaleDateString('tr-TR')} -{' '}
                              {new Date(stajyer.bitis_tarihi).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Stajyer Bulunamadı</h3>
                    <p className="mt-2 text-sm text-gray-500">Henüz aktif stajyeriniz bulunmuyor.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-6 border-b border-gray-200 sm:px-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Dekont Geçmişi</h2>
                      <p className="mt-2 text-sm text-gray-600">
                        Toplam <span className="font-semibold text-indigo-600">{dekontlar.length}</span> dekont
                      </p>
                    </div>
                    {dekontlar.length > 0 && (
                      <button
                        onClick={() => router.push('/panel/dekont/yeni')}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Yeni Dekont Ekle
                      </button>
                    )}
                  </div>
                </div>
                {dekontlar.length > 0 ? (
                  <div className="divide-y divide-gray-100 -mx-6 md:-mx-8">
                    {dekontlar.map((dekont) => (
                      <div key={dekont.id} className="px-6 md:px-8 py-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-xl">
                              <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-base font-semibold text-gray-900">{dekont.ogrenci_adi}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {dekont.miktar.toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                              })}
                            </p>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
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
                  <div className="py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Dekont Bulunamadı</h3>
                    <p className="mt-2 text-sm text-gray-500">Sisteme henüz dekont yüklenmemiş.</p>
                    <div className="mt-8">
                      <button
                        onClick={() => router.push('/panel/dekont/yeni')}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Upload className="h-5 w-5 mr-2" />
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
        <footer className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl rounded-t-2xl mt-8">
          <div className="py-4 px-6 text-center text-sm text-white">
            &copy; {new Date().getFullYear()} {okulAdi} - Staj Dekont Sistemi. Tüm Hakları Saklıdır.
          </div>
        </footer>
      </div>
    </div>
  )
} 