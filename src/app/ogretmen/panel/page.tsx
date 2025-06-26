'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, LogOut, Loader, User, Phone, Mail, CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function OgretmenPanelPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isletmeler, setIsletmeler] = useState<any[]>([])
  const [dekontlar, setDekontlar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'isletmeler' | 'dekontlar'>('isletmeler')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem('ogretmen_session')
      if (!sessionData) {
        router.push('/ogretmen/login')
        return
      }

      const parsedSession = JSON.parse(sessionData)
      
      if (new Date() > new Date(parsedSession.expires_at)) {
        localStorage.removeItem('ogretmen_session')
        router.push('/ogretmen/login')
        return
      }

      setSession(parsedSession)
      await fetchOgretmenData(parsedSession.ogretmen.id)
    } catch (error) {
      console.error('Session kontrol hatası:', error)
      router.push('/ogretmen/login')
    }
  }

  const fetchOgretmenData = async (ogretmenId: number) => {
    setLoading(true)
    try {
      const { data: isletmelerData, error: isletmelerError } = await supabase
        .from('isletmeler')
        .select('*')
        .eq('ogretmen_id', ogretmenId)

      if (isletmelerError) {
        console.error('İşletmeler getirme hatası:', isletmelerError)
      } else {
        setIsletmeler(isletmelerData || [])
      }

      if (isletmelerData && isletmelerData.length > 0) {
        const isletmeIds = isletmelerData.map((i: any) => i.id)
        
        const { data: dekontlarData, error: dekontlarError } = await supabase
          .from('dekontlar')
          .select(`
            id,
            miktar,
            odeme_tarihi,
            onay_durumu,
            stajlar (
              ogrenciler (
                ad,
                soyad
              )
            )
          `)
          .in('isletme_id', isletmeIds)
          .order('created_at', { ascending: false })

        if (dekontlarError) {
          console.error('Dekontlar getirme hatası:', dekontlarError)
        } else {
          setDekontlar(dekontlarData || [])
        }
      }
    } catch (error) {
      console.error('Veri getirme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ogretmen_session')
    router.push('/ogretmen/login')
  }

  const handleDekontAction = async (dekontId: number, action: 'onaylandi' | 'reddedildi') => {
    try {
      const { error } = await supabase
        .from('dekontlar')
        .update({ onay_durumu: action })
        .eq('id', dekontId)

      if (error) {
        alert('Dekont güncellenirken bir hata oluştu: ' + error.message)
      } else {
        if (session) {
          await fetchOgretmenData(session.ogretmen.id)
        }
      }
    } catch (error) {
      console.error('Dekont güncelleme hatası:', error)
      alert('Bir hata oluştu.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mr-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {session.ogretmen.ad} {session.ogretmen.soyad}
                </h1>
                <p className="text-sm text-gray-600">Koordinatör Öğretmen</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Koordinatörlük Yaptığım İşletmeler</p>
                <p className="text-2xl font-bold text-gray-900">{isletmeler.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Dekont</p>
                <p className="text-2xl font-bold text-gray-900">{dekontlar.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-green-100 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Onaylanan Dekontlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dekontlar.filter((d: any) => d.onay_durumu === 'onaylandi').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setSelectedTab('isletmeler')}
                className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  selectedTab === 'isletmeler'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4 mr-2 inline" />
                İşletmelerim
              </button>
              <button
                onClick={() => setSelectedTab('dekontlar')}
                className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  selectedTab === 'dekontlar'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 mr-2 inline" />
                Dekontlar ({dekontlar.filter((d: any) => d.onay_durumu === 'bekliyor').length} bekliyor)
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'isletmeler' ? (
              <div className="space-y-4">
                {isletmeler.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Henüz koordinatörlük yaptığınız işletme yok
                    </h3>
                    <p className="text-gray-500">
                      Okul yönetimi size işletme atadığında burada görünecek.
                    </p>
                  </div>
                ) : (
                  isletmeler.map((isletme: any) => (
                    <div key={isletme.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {isletme.ad}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center text-gray-600">
                              <User className="w-4 h-4 mr-2" />
                              <span className="text-sm">Yetkili: {isletme.yetkili_kisi}</span>
                            </div>
                            {isletme.telefon && (
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span className="text-sm">{isletme.telefon}</span>
                              </div>
                            )}
                            {isletme.email && (
                              <div className="flex items-center text-gray-600">
                                <Mail className="w-4 h-4 mr-2" />
                                <span className="text-sm">{isletme.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                            <p className="text-xs text-gray-500">PIN Kodu</p>
                            <p className="font-mono font-bold text-blue-600">{isletme.pin}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {dekontlar.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Henüz dekont bulunmuyor
                    </h3>
                    <p className="text-gray-500">
                      İşletmeler dekont gönderdiğinde burada görünecek.
                    </p>
                  </div>
                ) : (
                  dekontlar.map((dekont: any) => (
                    <div key={dekont.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ödeme Tarihi: {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ₺{dekont.miktar?.toLocaleString('tr-TR')}
                          </p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            dekont.onay_durumu === 'onaylandi' ? 'bg-green-100 text-green-800 border-green-200' :
                            dekont.onay_durumu === 'reddedildi' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {dekont.onay_durumu === 'onaylandi' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                             dekont.onay_durumu === 'reddedildi' ? <XCircle className="w-4 h-4 mr-1" /> :
                             <Clock className="w-4 h-4 mr-1" />}
                            {dekont.onay_durumu === 'onaylandi' ? 'Onaylandı' :
                             dekont.onay_durumu === 'reddedildi' ? 'Reddedildi' : 'Bekliyor'}
                          </div>
                        </div>
                      </div>
                      
                      {dekont.onay_durumu === 'bekliyor' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDekontAction(dekont.id, 'onaylandi')}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Onayla
                          </button>
                          <button
                            onClick={() => handleDekontAction(dekont.id, 'reddedildi')}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-all duration-200"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 