'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Plus, Edit, Trash2, Loader, Save, Phone, Mail, MapPin, User, Key, Users, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Isletme {
    id: number;
    ad: string;
    adres?: string;
    telefon?: string;
    email?: string;
    yetkili_kisi?: string;
    pin?: string;
    ogretmen_id?: number;
    ogretmenler?: {
        id: number;
        ad: string;
        soyad: string;
    };
}

interface Ogretmen {
    id: number;
    ad: string;
    soyad: string;
    aktif?: boolean;
    alan_id?: number;
}

interface Alan {
    id: number;
    ad: string;
}

interface IsletmeAlan {
    id: number;
    alan_id: number;
    koordinator_ogretmen_id?: number;
    alanlar: {
        id: number;
        ad: string;
    };
    ogretmenler?: {
        id: number;
        ad: string;
        soyad: string;
    } | null;
}

export default function IsletmeYonetimiPage() {
  const router = useRouter()
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([])
  const [alanlar, setAlanlar] = useState<Alan[]>([])
  const [isletmeAlanlar, setIsletmeAlanlar] = useState<IsletmeAlan[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [alanModal, setAlanModal] = useState(false)
  const [selectedIsletme, setSelectedIsletme] = useState<Isletme | null>(null)
  const [formData, setFormData] = useState({
    ad: '',
    adres: '',
    telefon: '',
    email: '',
    yetkili_kisi: '',
    pin: '',
    ogretmen_id: ''
  })
  const [alanFormData, setAlanFormData] = useState({
    alan_id: '',
    koordinator_ogretmen_id: ''
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [filteredOgretmenler, setFilteredOgretmenler] = useState<Ogretmen[]>([])

  async function fetchIsletmeler() {
    setLoading(true)
    
    try {
      // Önce işletmeleri al
      const { data: isletmelerData, error: isletmelerError } = await supabase
        .from('isletmeler')
        .select('*')
        .order('ad', { ascending: true });
      
      if (isletmelerError) {
        console.error('İşletmeler çekilirken hata:', isletmelerError)
        alert('İşletmeler yüklenirken bir hata oluştu: ' + isletmelerError.message)
        setLoading(false)
        return
      }

      // Sonra öğretmenleri al
      const { data: ogretmenlerData, error: ogretmenlerError } = await supabase
        .from('ogretmenler')
        .select('id, ad, soyad, alan_id')

      if (ogretmenlerError) {
        console.error('Öğretmenler çekilirken hata:', ogretmenlerError)
      }

      // İşletmelere koordinatör bilgilerini ekle
      const isletmelerWithKoordinator = isletmelerData?.map(isletme => {
        const koordinator = ogretmenlerData?.find(ogr => ogr.id === isletme.ogretmen_id)
        return {
          ...isletme,
          ogretmenler: koordinator || null
        }
      }) || []

      setIsletmeler(isletmelerWithKoordinator)
    } catch (error) {
      console.error('Genel hata:', error)
      alert('Veriler yüklenirken bir hata oluştu.')
    }
    
    setLoading(false)
  }

  async function fetchOgretmenler() {
    try {
      const { data, error } = await supabase
        .from('ogretmenler')
        .select('id, ad, soyad, alan_id')
        .order('ad', { ascending: true });
      
      if (error) {
        console.error('Öğretmenler çekilirken hata:', error)
      } else {
        setOgretmenler(data || [])
      }
    } catch (error) {
      console.error('Öğretmenler fetch hatası:', error)
    }
  }

  async function fetchAlanlar() {
    try {
      const { data, error } = await supabase
        .from('alanlar')
        .select('id, ad')
        .order('ad', { ascending: true });
      
      if (error) {
        console.error('Alanlar çekilirken hata:', error)
      } else {
        setAlanlar(data || [])
      }
    } catch (error) {
      console.error('Alanlar fetch hatası:', error)
    }
  }

  async function fetchIsletmeAlanlar(isletmeId: number) {
    try {
      const { data, error } = await supabase
        .from('isletme_alanlar')
        .select(`
          id,
          alan_id,
          koordinator_ogretmen_id,
          alanlar (id, ad),
          ogretmenler (id, ad, soyad)
        `)
        .eq('isletme_id', isletmeId)
      
      if (error) {
        console.error('İşletme alanları çekilirken hata:', error)
      } else {
        setIsletmeAlanlar(data as any || [])
      }
    } catch (error) {
      console.error('İşletme alanları fetch hatası:', error)
    }
  }

  // Alan seçildiğinde o alanın öğretmenlerini filtrele
  useEffect(() => {
    if (alanFormData.alan_id) {
      const secilenAlanId = parseInt(alanFormData.alan_id);
      const alanOgretmenleri = ogretmenler.filter(ogr => ogr.alan_id === secilenAlanId);
      setFilteredOgretmenler(alanOgretmenleri)
      setAlanFormData(prev => ({ ...prev, koordinator_ogretmen_id: '' }))
    } else {
      setFilteredOgretmenler([])
    }
  }, [alanFormData.alan_id, ogretmenler])

  useEffect(() => {
    fetchIsletmeler()
    fetchOgretmenler()
    fetchAlanlar()
  }, [])

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleAdd = () => {
    setFormData({
      ad: '',
      adres: '',
      telefon: '',
      email: '',
      yetkili_kisi: '',
      pin: generateRandomPin(),
      ogretmen_id: ''
    })
    setAddModal(true)
  }

  const handleEdit = (isletme: Isletme) => {
    setSelectedIsletme(isletme)
    setFormData({
      ad: isletme.ad,
      adres: isletme.adres || '',
      telefon: isletme.telefon || '',
      email: isletme.email || '',
      yetkili_kisi: isletme.yetkili_kisi || '',
      pin: isletme.pin || '',
      ogretmen_id: isletme.ogretmen_id?.toString() || ''
    })
    setEditModal(true)
  }

  const handleSaveAdd = async () => {
    if (!formData.ad.trim()) {
      alert('İşletme adı zorunludur.')
      return
    }
    
    if (!formData.pin.trim() || formData.pin.length !== 4) {
      alert('PIN kodu 4 haneli olmalıdır.')
      return
    }
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('isletmeler')
      .insert([{
        ad: formData.ad.trim(),
        adres: formData.adres.trim() || null,
        telefon: formData.telefon.trim() || null,
        email: formData.email.trim() || null,
        yetkili_kisi: formData.yetkili_kisi.trim() || null,
        pin: formData.pin.trim(),
        ogretmen_id: formData.ogretmen_id ? parseInt(formData.ogretmen_id) : null
      }])

    if (error) {
      alert('İşletme eklenirken bir hata oluştu: ' + error.message)
    } else {
      setAddModal(false)
      fetchIsletmeler()
    }
    setSubmitLoading(false)
  }

  const handleSaveEdit = async () => {
    if (!selectedIsletme || !formData.ad.trim()) {
      alert('İşletme adı zorunludur.')
      return
    }
    
    if (!formData.pin.trim() || formData.pin.length !== 4) {
      alert('PIN kodu 4 haneli olmalıdır.')
      return
    }
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('isletmeler')
      .update({
        ad: formData.ad.trim(),
        adres: formData.adres.trim() || null,
        telefon: formData.telefon.trim() || null,
        email: formData.email.trim() || null,
        yetkili_kisi: formData.yetkili_kisi.trim() || null,
        pin: formData.pin.trim(),
        ogretmen_id: formData.ogretmen_id ? parseInt(formData.ogretmen_id) : null
      })
      .eq('id', selectedIsletme.id)

    if (error) {
      alert('İşletme güncellenirken bir hata oluştu: ' + error.message)
    } else {
      setEditModal(false)
      fetchIsletmeler()
    }
    setSubmitLoading(false)
  }

  const handleDelete = (isletme: Isletme) => {
    setSelectedIsletme(isletme)
    setDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedIsletme) return
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('isletmeler')
      .delete()
      .eq('id', selectedIsletme.id)

    if (error) {
      alert('İşletme silinirken bir hata oluştu: ' + error.message)
    } else {
      setDeleteModal(false)
      fetchIsletmeler()
    }
    setSubmitLoading(false)
  }

  // Alan atama fonksiyonları
  const handleAlanYonetimi = (isletme: Isletme) => {
    setSelectedIsletme(isletme)
    setAlanFormData({ alan_id: '', koordinator_ogretmen_id: '' })
    fetchIsletmeAlanlar(isletme.id)
    fetchOgretmenler() // Öğretmenleri tekrar yükle
    setAlanModal(true)
  }

  const handleAlanEkle = async () => {
    if (!selectedIsletme || !alanFormData.alan_id) {
      alert('Alan seçimi zorunludur.')
      return
    }

    setSubmitLoading(true)
    try {
      const { error } = await supabase
        .from('isletme_alanlar')
        .insert([{
          isletme_id: selectedIsletme.id,
          alan_id: parseInt(alanFormData.alan_id),
          koordinator_ogretmen_id: alanFormData.koordinator_ogretmen_id ? 
            parseInt(alanFormData.koordinator_ogretmen_id) : null
        }])

      if (error) {
        console.error('Tam hata detayı:', error);
        if (error.code === '23505') {
          alert('Bu işletme zaten bu alana atanmış!')
        } else {
          alert('Alan eklenirken hata: ' + error.message + ' (Kod: ' + error.code + ')')
        }
      } else {
        setAlanFormData({ alan_id: '', koordinator_ogretmen_id: '' })
        fetchIsletmeAlanlar(selectedIsletme.id)
      }
    } catch (error) {
      console.error('Alan ekleme hatası:', error)
      alert('Bir hata oluştu.')
    }
    setSubmitLoading(false)
  }

  const handleAlanSil = async (alanId: number) => {
    if (!selectedIsletme) return

    setSubmitLoading(true)
    try {
      const { error } = await supabase
        .from('isletme_alanlar')
        .delete()
        .eq('id', alanId)

      if (error) {
        alert('Alan silinirken hata: ' + error.message)
      } else {
        fetchIsletmeAlanlar(selectedIsletme.id)
      }
    } catch (error) {
      console.error('Alan silme hatası:', error)
      alert('Bir hata oluştu.')
    }
    setSubmitLoading(false)
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-32">
            <Loader className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              İşletme Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">Staj yapacak işletmeleri yönetin ve bilgilerini güncelleyin.</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni İşletme Ekle
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İşletme Bilgileri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Koordinatör Öğretmen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Yetkili / PIN
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/60 divide-y divide-gray-200">
                {isletmeler.map((isletme) => (
                  <tr key={isletme.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-indigo-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {isletme.ad}
                          </div>
                          {isletme.adres && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {isletme.adres}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {isletme.telefon && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {isletme.telefon}
                          </div>
                        )}
                        {isletme.email && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {isletme.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {isletme.ogretmenler ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-indigo-500" />
                            <span className="text-indigo-700 font-medium">
                              {isletme.ogretmenler.ad} {isletme.ogretmenler.soyad}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Koordinatör atanmamış</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {isletme.yetkili_kisi && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {isletme.yetkili_kisi}
                          </div>
                        )}
                        {isletme.pin && (
                          <div className="text-sm font-mono text-indigo-600 flex items-center">
                            <Key className="h-4 w-4 mr-2 text-indigo-500" />
                            PIN: {isletme.pin}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAlanYonetimi(isletme)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-all duration-200"
                          title="Alan Yönetimi"
                        >
                          <Users className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(isletme)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                          title="Düzenle"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(isletme)} 
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                          title="Sil"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Yeni İşletme Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Adı *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.ad}
                onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="İşletme adını giriniz"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.adres}
                onChange={(e) => setFormData(prev => ({ ...prev, adres: e.target.value }))}
                rows={3}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="İşletme adresini giriniz"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="0212 123 45 67"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="ornek@isletme.com"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Koordinatör Öğretmen
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.ogretmen_id}
                onChange={(e) => setFormData(prev => ({ ...prev, ogretmen_id: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Koordinatör seçin (opsiyonel)</option>
                {ogretmenler.map(ogretmen => (
                  <option key={ogretmen.id} value={ogretmen.id}>
                    {ogretmen.ad} {ogretmen.soyad}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Bu işletmenin koordinatörlüğünü yapacak öğretmen</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yetkili Kişi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.yetkili_kisi}
                  onChange={(e) => setFormData(prev => ({ ...prev, yetkili_kisi: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Yetkili kişinin adı soyadı"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Kodu *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData(prev => ({ ...prev, pin: value }))
                  }}
                  className="pl-10 pr-20 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pin: generateRandomPin() }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  Yeni
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">4 haneli sayı (giriş için gerekli)</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
              disabled={submitLoading}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSaveAdd}
              disabled={submitLoading || !formData.ad.trim() || !formData.pin.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitLoading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="İşletmeyi Düzenle"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Adı *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.ad}
                onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="İşletme adını giriniz"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.adres}
                onChange={(e) => setFormData(prev => ({ ...prev, adres: e.target.value }))}
                rows={3}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="İşletme adresini giriniz"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="0212 123 45 67"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="ornek@isletme.com"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Koordinatör Öğretmen
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.ogretmen_id}
                onChange={(e) => setFormData(prev => ({ ...prev, ogretmen_id: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Koordinatör seçin (opsiyonel)</option>
                {ogretmenler.map(ogretmen => (
                  <option key={ogretmen.id} value={ogretmen.id}>
                    {ogretmen.ad} {ogretmen.soyad}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Bu işletmenin koordinatörlüğünü yapacak öğretmen</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yetkili Kişi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.yetkili_kisi}
                  onChange={(e) => setFormData(prev => ({ ...prev, yetkili_kisi: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Yetkili kişinin adı soyadı"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Kodu * 
                <span className="text-indigo-600 font-normal">(Giriş için gerekli)</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData(prev => ({ ...prev, pin: value }))
                  }}
                  className="pl-10 pr-20 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pin: generateRandomPin() }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  Yeni
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">PIN değiştirilirse işletmeye bilgi verilmeli</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
              disabled={submitLoading}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={submitLoading || !formData.ad.trim() || !formData.pin.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Alan Yönetimi Modal */}
      <Modal
        isOpen={alanModal}
        onClose={() => setAlanModal(false)}
        title={`${selectedIsletme?.ad} - Alan Yönetimi`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Mevcut Alanlar */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Atanmış Alanlar ({isletmeAlanlar.length})
            </h3>
            
            {isletmeAlanlar.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Bu işletme henüz hiçbir alana atanmamış</p>
                <p className="text-sm text-gray-400 mt-1">Aşağıdan yeni alan ekleyebilirsiniz</p>
              </div>
            ) : (
              <div className="space-y-3">
                {isletmeAlanlar.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.alanlar.ad}
                        </h4>
                        {item.ogretmenler ? (
                          <div className="flex items-center mt-1">
                            <UserCheck className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm text-green-700 font-medium">
                              {item.ogretmenler.ad} {item.ogretmenler.soyad}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            Koordinatör atanmamış
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAlanSil(item.id)}
                      disabled={submitLoading}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yeni Alan Ekleme */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              Yeni Alan Ekle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan Seçin *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={alanFormData.alan_id}
                    onChange={(e) => setAlanFormData(prev => ({ ...prev, alan_id: e.target.value }))}
                    className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  >
                    <option value="">Alan seçin...</option>
                    {alanlar
                      .filter(alan => !isletmeAlanlar.some(ia => ia.alan_id === alan.id))
                      .map(alan => (
                        <option key={alan.id} value={alan.id}>
                          {alan.ad}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {alanFormData.alan_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Koordinatör Öğretmen
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={alanFormData.koordinator_ogretmen_id}
                      onChange={(e) => setAlanFormData(prev => ({ ...prev, koordinator_ogretmen_id: e.target.value }))}
                      className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="">Koordinatör seçin (opsiyonel)</option>
                      {filteredOgretmenler.map(ogretmen => (
                        <option key={ogretmen.id} value={ogretmen.id}>
                          {ogretmen.ad} {ogretmen.soyad}
                        </option>
                      ))}
                    </select>
                  </div>
                                     <p className="text-xs text-gray-500 mt-1">
                     {filteredOgretmenler.length === 0 ? 
                       `Bu alanda öğretmen bulunamadı (Toplam: ${ogretmenler.length})` : 
                       `Bu alanda ${filteredOgretmenler.length} öğretmen mevcut`
                     }
                   </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleAlanEkle}
                disabled={submitLoading || !alanFormData.alan_id}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitLoading ? 'Ekleniyor...' : 'Alan Ekle'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setAlanModal(false)}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="İşletmeyi Sil"
        message={`"${selectedIsletme?.ad}" işletmesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili veriler de silinecektir.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        loading={submitLoading}
      />
    </div>
  )
} 