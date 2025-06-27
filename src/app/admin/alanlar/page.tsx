'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Edit, Trash2, Loader, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Alan {
    id: number;
    ad: string;
}

export default function AlanYonetimiPage() {
  const router = useRouter()
  const [alanlar, setAlanlar] = useState<Alan[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selectedAlan, setSelectedAlan] = useState<Alan | null>(null)
  const [editAlanAdi, setEditAlanAdi] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  async function fetchAlanlar() {
    setLoading(true)
    const { data, error } = await supabase.from('alanlar').select('*').order('ad', { ascending: true });
    if (error) {
        console.error('Alanlar çekilirken hata:', error)
        alert('Alanlar yüklenirken bir hata oluştu.')
    } else {
        setAlanlar(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAlanlar()
  }, [])

  const handleEdit = (alan: Alan) => {
    setSelectedAlan(alan)
    setEditAlanAdi(alan.ad)
    setEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedAlan || !editAlanAdi.trim()) return
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('alanlar')
      .update({ ad: editAlanAdi.trim() })
      .eq('id', selectedAlan.id)

    if (error) {
      alert('Alan güncellenirken bir hata oluştu: ' + error.message)
    } else {
      setEditModal(false)
      fetchAlanlar()
    }
    setSubmitLoading(false)
  }

  const handleDelete = (alan: Alan) => {
    setSelectedAlan(alan)
    setDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedAlan) return
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('alanlar')
      .delete()
      .eq('id', selectedAlan.id)

    if (error) {
      alert('Alan silinirken bir hata oluştu: ' + error.message)
    } else {
      setDeleteModal(false)
      fetchAlanlar()
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
              Alan Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">Yeni alanlar ekleyin, mevcutları düzenleyin veya silin.</p>
          </div>
          <button
            onClick={() => router.push('/admin/alanlar/yeni')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Alan Ekle
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Alan Adı
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/60 divide-y divide-gray-200">
                {alanlar.map((alan) => (
                  <tr key={alan.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-indigo-500 mr-3" />
                        <button
                          onClick={() => router.push(`/admin/alanlar/${alan.id}`)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                        >
                          {alan.ad}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(alan)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(alan)} 
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Alanı Düzenle"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="editAlanAdi" className="block text-sm font-medium text-gray-700 mb-2">
              Alan Adı
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="editAlanAdi"
                value={editAlanAdi}
                onChange={(e) => setEditAlanAdi(e.target.value)}
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Örn: Bilişim Teknolojileri"
              />
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
              disabled={submitLoading || !editAlanAdi.trim()}
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
        title="Alanı Sil"
        message={`"${selectedAlan?.ad}" alanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        loading={submitLoading}
      />
    </div>
  )
} 