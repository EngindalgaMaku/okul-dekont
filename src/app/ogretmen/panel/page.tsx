'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, LogOut, Loader, User, Phone, Mail, CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'

export default function OgretmenPanelPage() {
  const router = useRouter()
  const [session, setSession] = useState<OgretmenSession | null>(null)
  const [isletmeler, setIsletmeler] = useState<any[]>([])
  const [dekontlar, setDekontlar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDekont, setSelectedDekont] = useState<any>(null)
  const [dekontDetailModalOpen, setDekontDetailModalOpen] = useState(false)

  useEffect(() => {
    const storedSession = localStorage.getItem('ogretmen_session')
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession)
      setSession(parsedSession)
      fetchOgretmenData(parsedSession.ogretmen.id)
    } else {
      router.push('/ogretmen/login')
    }
  }, [])

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
            odeme_son_tarihi,
            ay,
            yil,
            onay_durumu,
            red_nedeni,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Hoş Geldiniz, {session.ogretmen.ad} {session.ogretmen.soyad}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              İşletme ve dekont bilgilerini buradan takip edebilirsiniz.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3 sm:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam İşletme</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{isletmeler.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-yellow-100 p-4 sm:p-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-3 sm:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Bekleyen Dekontlar</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {dekontlar.filter((d: any) => d.onay_durumu === 'bekliyor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-green-100 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-3 sm:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Onaylanan Dekontlar</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {dekontlar.filter((d: any) => d.onay_durumu === 'onaylandi').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">İşletme ve Dekont Listesi</h2>
            
            {isletmeler.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz atanmış işletmeniz bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {isletmeler.map((isletme: any) => (
                  <div key={isletme.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {isletme.ad}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {isletme.adres}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${isletme.telefon}`}
                          className="inline-flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                        <a
                          href={`mailto:${isletme.email}`}
                          className="inline-flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {dekontlar
                        .filter((d: any) => d.isletme_id === isletme.id)
                        .map((dekont: any) => (
                          <div
                            key={dekont.id}
                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              setSelectedDekont(dekont)
                              setDekontDetailModalOpen(true)
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 sm:mb-4">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Ödeme Tarihi: {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              <div className="flex flex-col sm:text-right">
                                <p className="text-lg sm:text-xl font-bold text-gray-900">
                                  ₺{dekont.miktar?.toLocaleString('tr-TR')}
                                </p>
                                <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border self-start sm:self-end ${
                                  dekont.onay_durumu === 'onaylandi' ? 'bg-green-100 text-green-800 border-green-200' :
                                  dekont.onay_durumu === 'reddedildi' ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>
                                  {dekont.onay_durumu === 'onaylandi' ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> :
                                   dekont.onay_durumu === 'reddedildi' ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> :
                                   <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                                  {dekont.onay_durumu === 'onaylandi' ? 'Onaylandı' :
                                   dekont.onay_durumu === 'reddedildi' ? 'Reddedildi' : 'Bekliyor'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dekont Detay Modalı */}
      <Modal
        isOpen={dekontDetailModalOpen}
        onClose={() => setDekontDetailModalOpen(false)}
        title="Dekont Detayları"
        size="lg"
      >
        {selectedDekont && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Öğrenci Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDekont.stajlar?.ogrenciler?.ad} {selectedDekont.stajlar?.ogrenciler?.soyad}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ödeme Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Miktar:</span>
                      <span className="text-sm font-medium text-gray-900">₺{selectedDekont.miktar?.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Ödeme Tarihi:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedDekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Son Ödeme Tarihi:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedDekont.odeme_son_tarihi).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Onay Durumu</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  {selectedDekont.onay_durumu === 'onaylandi' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : selectedDekont.onay_durumu === 'reddedildi' ? (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {selectedDekont.onay_durumu === 'onaylandi' ? 'Onaylandı' :
                     selectedDekont.onay_durumu === 'reddedildi' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                </div>
                {selectedDekont.onay_durumu === 'reddedildi' && selectedDekont.red_nedeni && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Red Nedeni:</span>
                    <p className="text-sm font-medium text-red-600 mt-1">{selectedDekont.red_nedeni}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
} 