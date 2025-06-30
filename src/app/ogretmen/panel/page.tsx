'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, LogOut, Loader, User, Phone, Mail, CheckCircle, Clock, XCircle, Upload, Plus, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'

interface OgretmenSession {
  ogretmen: {
    id: number;
    ad: string;
    soyad: string;
    email?: string;
    telefon?: string;
    alan_id?: number;
  }
}

interface Belge {
  id: number;
  isletme_id: number;
  ad: string;
  tur: string;
  dosya_url?: string;
  yukleme_tarihi: string;
}

export default function OgretmenPanelPage() {
  const router = useRouter()
  const [session, setSession] = useState<OgretmenSession | null>(null)
  const [isletmeler, setIsletmeler] = useState<any[]>([])
  const [dekontlar, setDekontlar] = useState<any[]>([])
  const [belgeler, setBelgeler] = useState<Belge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDekont, setSelectedDekont] = useState<any>(null)
  const [dekontDetailModalOpen, setDekontDetailModalOpen] = useState(false)

  const [belgeModalOpen, setBelgeModalOpen] = useState(false)
  const [selectedIsletme, setSelectedIsletme] = useState<any>(null)
  const [belgeFormData, setBelgeFormData] = useState({
    ad: '',
    tur: 'sozlesme',
    dosya: null as File | null,
  });

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
            isletme_id,
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

        const { data: belgelerData, error: belgelerError } = await supabase
          .from('belgeler')
          .select('*')
          .in('isletme_id', isletmeIds);

        if (belgelerError) {
          console.error('Belgeler getirme hatası:', belgelerError);
        } else {
          setBelgeler(belgelerData || []);
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

  const handleBelgeUpload = async () => {
    if (!selectedIsletme || !belgeFormData.dosya || !belgeFormData.ad.trim()) {
      alert('Lütfen belge adını girin ve bir dosya seçin.');
      return;
    }

    const file = belgeFormData.dosya;
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `belgeler/${selectedIsletme.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('belgeler')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Dosya yükleme hatası:', uploadError);
      alert('Dosya yüklenirken bir hata oluştu.');
      return;
    }

    const { data: urlData } = supabase.storage
      .from('belgeler')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('belgeler').insert({
      isletme_id: selectedIsletme.id,
      ad: belgeFormData.ad,
      tur: belgeFormData.tur,
      dosya_url: urlData.publicUrl,
      yukleme_tarihi: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Belge veritabanına kaydetme hatası:', dbError);
      alert('Belge bilgileri kaydedilirken bir hata oluştu.');
      return;
    }

    alert('Belge başarıyla yüklendi!');
    setBelgeModalOpen(false);
    setBelgeFormData({ ad: '', tur: 'sozlesme', dosya: null });
    fetchOgretmenData(session!.ogretmen.id); // Verileri yenile
  };
  
  const formatBelgeTur = (tur: string) => {
    switch (tur) {
      case 'sozlesme': return 'Sözleşme'
      case 'fesih_belgesi': return 'Fesih Belgesi'
      case 'usta_ogretici_belgesi': 'Usta Öğretici Belgesi'
      default: return tur.charAt(0).toUpperCase() + tur.slice(1);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 shadow-xl rounded-2xl mx-6 mt-6 mb-8 overflow-hidden">
        <div className="py-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">
                  Hoş Geldiniz, {session.ogretmen.ad} {session.ogretmen.soyad}
                </h1>
                <p className="text-sm text-blue-100 font-medium">Öğretmen Paneli</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 h-10 w-10 rounded-full transition-all duration-200"
              title="Çıkış Yap"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full mr-4 backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">Toplam İşletme</p>
                <p className="text-2xl font-bold text-white">{isletmeler.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full mr-4 backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-100">Bekleyen Dekontlar</p>
                <p className="text-2xl font-bold text-white">
                  {dekontlar.filter((d: any) => d.onay_durumu === 'bekliyor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-full mr-4 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-100">Onaylanan Dekontlar</p>
                <p className="text-2xl font-bold text-white">
                  {dekontlar.filter((d: any) => d.onay_durumu === 'onaylandi').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">İşletmeler ve Dekontlar</h2>
            
            {isletmeler.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz size atanmış bir işletme bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {isletmeler.map((isletme: any) => {
                  const isletmeDekontlari = dekontlar.filter((d: any) => d.isletme_id === isletme.id);
                  
                  return (
                    <div key={isletme.id}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">{isletme.ad}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedIsletme(isletme);
                              setBelgeModalOpen(true);
                            }}
                            title="Belgeleri Görüntüle"
                            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          {isletme.telefon &&
                            <a href={`tel:${isletme.telefon}`} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100">
                              <Phone className="h-5 w-5" />
                            </a>
                          }
                          {isletme.email &&
                            <a href={`mailto:${isletme.email}`} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100">
                              <Mail className="h-5 w-5" />
                            </a>
                          }
                        </div>
                      </div>

                      <div className="space-y-3">
                        {isletmeDekontlari.length > 0 ? (
                          isletmeDekontlari.map((dekont: any) => (
                                <div
                                  key={dekont.id}
                                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 cursor-pointer flex items-center justify-between"
                                  onClick={() => {
                                    setSelectedDekont(dekont)
                                    setDekontDetailModalOpen(true)
                                  }}
                                >
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Ödeme Tarihi: {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <p className="text-lg font-bold text-gray-900">
                                      ₺{dekont.miktar?.toLocaleString('tr-TR')}
                                    </p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      dekont.onay_durumu === 'onaylandi' ? 'bg-green-100 text-green-800' :
                                      dekont.onay_durumu === 'reddedildi' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {dekont.onay_durumu === 'onaylandi' ? 'Onaylandı' :
                                      dekont.onay_durumu === 'reddedildi' ? 'Reddedildi' : 'Bekliyor'}
                                    </span>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-center text-gray-500 py-4">Bu işletmeye ait dekont bulunmamaktadır.</p>
                          )
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12 py-4 text-center text-sm text-gray-500">
        © 2025 Hüsniye Özdilek MTAL - Koordinatörlük Yönetim Sistemi. Tüm Hakları Saklıdır.
      </footer>

      {selectedDekont && (
        <Modal
          isOpen={dekontDetailModalOpen}
          onClose={() => setDekontDetailModalOpen(false)}
          title="Dekont Detayları"
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
      )}

      {selectedIsletme && (
        <Modal
          isOpen={belgeModalOpen}
          onClose={() => {
            setBelgeModalOpen(false);
            setSelectedIsletme(null);
          }}
          title={`${selectedIsletme.ad} - Belgeler`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Yüklenen Belgeler</h3>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {belgeler.filter(b => b.isletme_id === selectedIsletme.id).length > 0 ? (
                belgeler.filter(b => b.isletme_id === selectedIsletme.id).map(belge => (
                  <div key={belge.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100">
                    <div>
                      <p className="font-semibold text-gray-700">{belge.ad}</p>
                      <p className="text-sm text-gray-500">{formatBelgeTur(belge.tur)}</p>
                    </div>
                    <a href={belge.dosya_url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Henüz belge yüklenmemiş.</p>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Yeni Belge Yükle</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Belge Adı"
                  value={belgeFormData.ad}
                  onChange={(e) => setBelgeFormData({ ...belgeFormData, ad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={belgeFormData.tur}
                  onChange={(e) => setBelgeFormData({ ...belgeFormData, tur: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sozlesme">Sözleşme</option>
                  <option value="fesih_belgesi">Fesih Belgesi</option>
                  <option value="usta_ogretici_belgesi">Usta Öğretici Belgesi</option>
                  <option value="diger">Diğer</option>
                </select>
                <input
                  type="file"
                  onChange={(e) => setBelgeFormData({ ...belgeFormData, dosya: e.target.files ? e.target.files[0] : null })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                 <button
                  onClick={handleBelgeUpload}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-5 w-5 mr-2" /> Yükle
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
} 