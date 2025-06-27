'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Edit, Trash2, Loader, CheckCircle, ShieldCheck, Save, AlertTriangle, Database, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface EgitimYili {
    id: number;
    yil: string;
    aktif: boolean;
}

export default function EgitimYiliYonetimiPage() {
  const router = useRouter()
  const [yillar, setYillar] = useState<EgitimYili[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [hardDeleteModal, setHardDeleteModal] = useState(false)
  const [selectedYil, setSelectedYil] = useState<EgitimYili | null>(null)
  const [formData, setFormData] = useState({
    yil: '',
    aktif: false
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteConfirmations, setDeleteConfirmations] = useState({
    step1: false,
    step2: false,
    step3: false,
    confirmText: ''
  })
  const [relatedDataCount, setRelatedDataCount] = useState({
    stajlar: 0,
    dekontlar: 0
  })

  async function fetchEgitimYillari() {
    setLoading(true)
    const { data, error } = await supabase.from('egitim_yillari').select('*').order('yil', { ascending: false });
    if (error) {
        console.error('Eğitim yılları çekilirken hata:', error)
        alert('Eğitim yılları yüklenirken bir hata oluştu.')
    } else {
        setYillar(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEgitimYillari()
  }, [])

  const handleAdd = () => {
    setFormData({ yil: '', aktif: false })
    setAddModal(true)
  }

  const handleEdit = (yil: EgitimYili) => {
    setSelectedYil(yil)
    setFormData({ yil: yil.yil, aktif: yil.aktif })
    setEditModal(true)
  }

  const handleSaveAdd = async () => {
    if (!formData.yil.trim()) {
      alert('Eğitim yılı boş olamaz.')
      return
    }
    
    setSubmitLoading(true)
    
    // Eğer aktif olarak işaretlendiyse, diğerlerini pasif yap
    if (formData.aktif) {
      await supabase
        .from('egitim_yillari')
        .update({ aktif: false })
        .eq('aktif', true)
    }
    
    const { error } = await supabase
      .from('egitim_yillari')
      .insert([{
        yil: formData.yil.trim(),
        aktif: formData.aktif
      }])

    if (error) {
      alert('Eğitim yılı eklenirken bir hata oluştu: ' + error.message)
    } else {
      setAddModal(false)
      fetchEgitimYillari()
    }
    setSubmitLoading(false)
  }

  const handleSaveEdit = async () => {
    if (!selectedYil || !formData.yil.trim()) {
      alert('Eğitim yılı boş olamaz.')
      return
    }
    
    setSubmitLoading(true)
    
    // Eğer aktif olarak işaretlendiyse, diğerlerini pasif yap
    if (formData.aktif && !selectedYil.aktif) {
      await supabase
        .from('egitim_yillari')
        .update({ aktif: false })
        .eq('aktif', true)
    }
    
    const { error } = await supabase
      .from('egitim_yillari')
      .update({
        yil: formData.yil.trim(),
        aktif: formData.aktif
      })
      .eq('id', selectedYil.id)

    if (error) {
      alert('Eğitim yılı güncellenirken bir hata oluştu: ' + error.message)
    } else {
      setEditModal(false)
      fetchEgitimYillari()
    }
    setSubmitLoading(false)
  }

  const handleDelete = async (yil: EgitimYili) => {
    setSelectedYil(yil)
    
    // Eğer aktif yılsa, direkt hard delete modal'ı aç
    if (yil.aktif) {
      await checkRelatedData(yil.id)
      setHardDeleteModal(true)
      return
    }
    
    // Pasif yıllar için normal delete modal
    setDeleteModal(true)
  }

  const checkRelatedData = async (egitimYiliId: number) => {
    try {
      // Stajlar kontrolü
      const { count: stajCount } = await supabase
        .from('stajlar')
        .select('*', { count: 'exact', head: true })
        .eq('egitim_yili_id', egitimYiliId)

      // Dekontlar kontrolü (eğer var olan bir tablo ise)
      const { count: dekontCount } = await supabase
        .from('dekontlar')
        .select('*', { count: 'exact', head: true })
        .eq('egitim_yili_id', egitimYiliId)

      setRelatedDataCount({
        stajlar: stajCount || 0,
        dekontlar: dekontCount || 0
      })
    } catch (error) {
      console.error('Veri kontrolü sırasında hata:', error)
      setRelatedDataCount({ stajlar: 0, dekontlar: 0 })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedYil) return
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('egitim_yillari')
      .delete()
      .eq('id', selectedYil.id)

    if (error) {
      alert('Eğitim yılı silinirken bir hata oluştu: ' + error.message)
    } else {
      setDeleteModal(false)
      fetchEgitimYillari()
    }
    setSubmitLoading(false)
  }

  const handleHardDelete = async () => {
    if (!selectedYil) return
    
    // Tüm adımların tamamlandığını kontrol et
    if (!deleteConfirmations.step1 || !deleteConfirmations.step2 || !deleteConfirmations.step3) {
      alert('Lütfen tüm onay adımlarını tamamlayın!')
      return
    }

    // Onay metnini kontrol et
    if (deleteConfirmations.confirmText !== selectedYil.yil) {
      alert('Onay metni eğitim yılı ile eşleşmiyor!')
      return
    }

    setSubmitLoading(true)
    
    try {
      // Önce bağlı verileri sil
      const totalData = relatedDataCount.stajlar + relatedDataCount.dekontlar
      if (totalData > 0) {
        // Stajları sil
        if (relatedDataCount.stajlar > 0) {
          const { error: stajError } = await supabase
            .from('stajlar')
            .delete()
            .eq('egitim_yili_id', selectedYil.id)
          
          if (stajError) {
            alert('Staj kayıtları silinirken hata: ' + stajError.message)
            setSubmitLoading(false)
            return
          }
        }

        // Dekontları sil (eğer var ise)
        if (relatedDataCount.dekontlar > 0) {
          const { error: dekontError } = await supabase
            .from('dekontlar')
            .delete()
            .eq('egitim_yili_id', selectedYil.id)
          
          if (dekontError) {
            console.warn('Dekont kayıtları silinirken hata:', dekontError.message)
          }
        }
      }

      // Son olarak eğitim yılını sil
      const { error } = await supabase
        .from('egitim_yillari')
        .delete()
        .eq('id', selectedYil.id)

      if (error) {
        alert('Eğitim yılı silinirken bir hata oluştu: ' + error.message)
      } else {
        alert('Eğitim yılı ve tüm bağlı veriler başarıyla silindi!')
        setHardDeleteModal(false)
        resetDeleteConfirmations()
        fetchEgitimYillari()
      }
    } catch (error) {
      console.error('Silme işlemi sırasında hata:', error)
      alert('Beklenmeyen bir hata oluştu!')
    }
    
    setSubmitLoading(false)
  }

  const resetDeleteConfirmations = () => {
    setDeleteConfirmations({
      step1: false,
      step2: false,
      step3: false,
      confirmText: ''
    })
  }

  const handleActivate = async (id: number) => {
    setLoading(true);
    // Önce mevcut aktif yılı pasif yap
    const { error: deactivateError } = await supabase
        .from('egitim_yillari')
        .update({ aktif: false })
        .eq('aktif', true);

    if (deactivateError) {
        alert('Mevcut yıl pasif hale getirilirken bir hata oluştu: ' + deactivateError.message);
        setLoading(false);
        return;
    }

    // Seçilen yılı aktif yap
    const { error: activateError } = await supabase
        .from('egitim_yillari')
        .update({ aktif: true })
        .match({ id });
    
    if (activateError) {
        alert('Yeni yıl aktif hale getirilirken bir hata oluştu: ' + activateError.message);
    }

    fetchEgitimYillari();
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
              Eğitim Yılı Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">Sistemde kullanılacak eğitim yıllarını yönetin.</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Yıl Ekle
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Eğitim Yılı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/60 divide-y divide-gray-200">
                {yillar.map((yil) => (
                  <tr key={yil.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{yil.yil}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yil.aktif ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Aktif
                          </span>
                      ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Pasif
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {!yil.aktif && (
                           <button 
                              onClick={() => handleActivate(yil.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                           >
                             <ShieldCheck className="h-4 w-4 mr-1" />
                             Aktif Et
                           </button>
                        )}
                        <button 
                          onClick={() => handleEdit(yil)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(yil)} 
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
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
        title="Yeni Eğitim Yılı Ekle"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eğitim Yılı *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.yil}
                onChange={(e) => setFormData(prev => ({ ...prev, yil: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Örn: 2024-2025"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durum
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aktif"
                  checked={!formData.aktif}
                  onChange={() => setFormData(prev => ({ ...prev, aktif: false }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Pasif</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aktif"
                  checked={formData.aktif}
                  onChange={() => setFormData(prev => ({ ...prev, aktif: true }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Aktif</span>
              </label>
            </div>
            {formData.aktif && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Bu yılı aktif yaparsanız, mevcut aktif yıl pasif hale gelecektir.
              </p>
            )}
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
              disabled={submitLoading || !formData.yil.trim()}
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
        title="Eğitim Yılını Düzenle"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eğitim Yılı *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.yil}
                onChange={(e) => setFormData(prev => ({ ...prev, yil: e.target.value }))}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Örn: 2024-2025"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durum
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aktif-edit"
                  checked={!formData.aktif}
                  onChange={() => setFormData(prev => ({ ...prev, aktif: false }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Pasif</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aktif-edit"
                  checked={formData.aktif}
                  onChange={() => setFormData(prev => ({ ...prev, aktif: true }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Aktif</span>
              </label>
            </div>
            {formData.aktif && selectedYil && !selectedYil.aktif && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Bu yılı aktif yaparsanız, mevcut aktif yıl pasif hale gelecektir.
              </p>
            )}
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
              disabled={submitLoading || !formData.yil.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Eğitim Yılını Sil"
        message={`"${selectedYil?.yil}" eğitim yılını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        loading={submitLoading}
      />

      {/* Hard Delete Modal (for active years) */}
      <Modal
        isOpen={hardDeleteModal}
        onClose={() => {
          setHardDeleteModal(false)
          resetDeleteConfirmations()
        }}
        title="⚠️ KRİTİK SİLME İŞLEMİ"
      >
        <div className="space-y-6">
          {/* Warning Header */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  AKTİF EĞİTİM YILI SİLME İŞLEMİ
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  <strong>"{selectedYil?.yil}"</strong> aktif eğitim yılını silmek üzeresiniz!
                </p>
              </div>
            </div>
          </div>

          {/* Data Impact */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Database className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">Etkilenecek Veriler</h4>
                <div className="mt-2 space-y-1 text-sm text-yellow-700">
                  <div className="flex justify-between">
                    <span>Staj Kayıtları:</span>
                    <span className="font-medium">{relatedDataCount.stajlar} kayıt</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dekont Kayıtları:</span>
                    <span className="font-medium">{relatedDataCount.dekontlar} kayıt</span>
                  </div>
                  <div className="border-t border-yellow-300 pt-1 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>TOPLAM:</span>
                      <span>{relatedDataCount.stajlar + relatedDataCount.dekontlar} kayıt SİLİNECEK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Steps */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Silme işlemini onaylamak için aşağıdaki adımları tamamlayın:</h4>
            
            {/* Step 1 */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmations.step1}
                onChange={(e) => setDeleteConfirmations(prev => ({ ...prev, step1: e.target.checked }))}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Bu eğitim yılının <strong>aktif</strong> olduğunu ve sistemdeki <strong>tek aktif yıl</strong> olabileceğini anlıyorum.
              </span>
            </label>

            {/* Step 2 */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmations.step2}
                onChange={(e) => setDeleteConfirmations(prev => ({ ...prev, step2: e.target.checked }))}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                <strong>{relatedDataCount.stajlar + relatedDataCount.dekontlar} adet</strong> veri kaydının kalıcı olarak silineceğini ve 
                bu işlemin <strong>GERİ ALINAMAYACAĞINI</strong> anlıyorum.
              </span>
            </label>

            {/* Step 3 */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmations.step3}
                onChange={(e) => setDeleteConfirmations(prev => ({ ...prev, step3: e.target.checked }))}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Bu işlemin <strong>tüm sorumluluğunu</strong> kendim alıyorum ve silme işlemini gerçekleştirmek istiyorum.
              </span>
            </label>

            {/* Confirmation Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Son onay için eğitim yılını yazın: <strong>{selectedYil?.yil}</strong>
              </label>
              <input
                type="text"
                value={deleteConfirmations.confirmText}
                onChange={(e) => setDeleteConfirmations(prev => ({ ...prev, confirmText: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={selectedYil?.yil}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setHardDeleteModal(false)
                resetDeleteConfirmations()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              disabled={submitLoading}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleHardDelete}
              disabled={
                submitLoading || 
                !deleteConfirmations.step1 || 
                !deleteConfirmations.step2 || 
                !deleteConfirmations.step3 || 
                deleteConfirmations.confirmText !== selectedYil?.yil
              }
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {submitLoading ? 'Siliniyor...' : 'KALICI OLARAK SİL'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 