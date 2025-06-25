'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, FileText, LogOut, Building2, Bell, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'

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
    ad: string
    yetkili_kisi: string
  }
  baslangic_tarihi: string
  bitis_tarihi: string
}

interface Dekont {
  id: number
  ogrenci_adi: string
  isletme_adi: string
  miktar: number | null
  odeme_tarihi: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
}

export default function OgretmenPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [ogretmen, setOgretmen] = useState<Ogretmen | null>(null)
  const [activeTab, setActiveTab] = useState('isletmeler')
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [stajyerler, setStajyerler] = useState<Stajyer[]>([])
  const [dekontlar, setDekontlar] = useState<Dekont[]>([])
  const [loading, setLoading] = useState(true)

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
          ad: staj.isletmeler.ad,
          yetkili_kisi: staj.isletmeler.yetkili_kisi
        },
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
        stajlar (
          isletmeler (
            ad
          ),
          ogrenciler (
            ad,
            soyad
          )
        )
      `)
      .eq('ogretmen_id', storedOgretmen.id)
      .order('created_at', { ascending: false })

    if (dekontData) {
      const formattedDekontlar = dekontData.map((dekont: any) => ({
        id: dekont.id,
        ogrenci_adi: `${dekont.stajlar.ogrenciler.ad} ${dekont.stajlar.ogrenciler.soyad}`,
        isletme_adi: dekont.stajlar.isletmeler.ad,
        miktar: dekont.miktar,
        odeme_tarihi: dekont.odeme_tarihi,
        onay_durumu: dekont.onay_durumu
      }))
      setDekontlar(formattedDekontlar)
    }

    setLoading(false)
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
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('isletmeler')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'isletmeler'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>İşletmeler</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stajyerler')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stajyerler'
                  ? 'border-blue-500 text-blue-600'
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
                  ? 'border-blue-500 text-blue-600'
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Yükleniyor...</p>
          </div>
        ) : activeTab === 'isletmeler' ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Sorumlu İşletmeler</h2>
              <p className="mt-1 text-sm text-gray-500">
                Toplam {isletmeler.length} işletme
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {isletmeler.map((isletme) => (
                <div key={isletme.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{isletme.ad}</h3>
                      <p className="text-sm text-gray-500">{isletme.yetkili_kisi}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{isletme.ogrenci_sayisi} Öğrenci</p>
                    </div>
                  </div>
                </div>
              ))}

              {isletmeler.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">İşletme Bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">Henüz sorumlu olduğunuz işletme bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'stajyerler' ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Stajyer Öğrenciler</h2>
              <p className="mt-1 text-sm text-gray-500">
                Toplam {stajyerler.length} aktif stajyer
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {stajyerler.map((stajyer) => (
                <div key={stajyer.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {stajyer.ad} {stajyer.soyad}
                      </h3>
                      <p className="text-sm text-gray-500">{stajyer.alan}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stajyer.isletme.ad} - {stajyer.isletme.yetkili_kisi}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Sınıf: {stajyer.sinif}</p>
                      <p className="mt-1">
                        {new Date(stajyer.baslangic_tarihi).toLocaleDateString('tr-TR')} -{' '}
                        {new Date(stajyer.bitis_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {stajyerler.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Stajyer Bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">Henüz aktif stajyeriniz bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Dekont Geçmişi</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Toplam {dekontlar.length} dekont
                  </p>
                </div>
                <button
                  onClick={() => router.push('/ogretmen/dekont/yeni')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Yeni Dekont
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dekontlar.map((dekont) => (
                <div key={dekont.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {dekont.ogrenci_adi}
                      </h3>
                      <p className="text-sm text-gray-500">{dekont.isletme_adi}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {dekont.miktar && (
                        <div className="text-sm font-medium text-gray-900">
                          {dekont.miktar.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dekont.onay_durumu === 'onaylandi'
                            ? 'bg-green-100 text-green-800'
                            : dekont.onay_durumu === 'reddedildi'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {dekont.onay_durumu === 'onaylandi'
                          ? 'Onaylandı'
                          : dekont.onay_durumu === 'reddedildi'
                          ? 'Reddedildi'
                          : 'Bekliyor'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {dekontlar.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Dekont Bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">Henüz dekont yüklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 