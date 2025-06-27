'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit, Trash2, Loader, Save, User, Mail, Phone, Briefcase, ToggleLeft, ToggleRight, Key, Search, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Alan {
    id: number;
    ad: string;
}

interface Ogretmen {
    id: number;
    ad: string;
    soyad: string;
    email?: string;
    telefon?: string;
    alan_id?: number;
    aktif: boolean;
    pin?: string;
    alanlar?: { ad: string };
}

export default function OgretmenYonetimiPage() {
  const router = useRouter()
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([])
  const [filteredOgretmenler, setFilteredOgretmenler] = useState<Ogretmen[]>([])
  const [alanlar, setAlanlar] = useState<Alan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlan, setSelectedAlan] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [paginatedData, setPaginatedData] = useState<Ogretmen[]>([])
  const [totalPages, setTotalPages] = useState(0)
  
  // Modal states
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selectedOgretmen, setSelectedOgretmen] = useState<Ogretmen | null>(null)
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    alan_id: '',
    aktif: true,
    pin: ''
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  async function fetchOgretmenler() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ogretmenler')
      .select(`
        *,
        alanlar (ad)
      `)
      .order('ad', { ascending: true });
      
    if (error) {
        console.error('Öğretmenler çekilirken hata:', error)
        alert('Öğretmenler yüklenirken bir hata oluştu.')
    } else {
        setOgretmenler(data || [])
        setFilteredOgretmenler(data || [])
    }
    setLoading(false)
  }

  async function fetchAlanlar() {
    const { data, error } = await supabase.from('alanlar').select('*').order('ad', { ascending: true });
    if (error) {
        console.error('Alanlar çekilirken hata:', error)
    } else {
        setAlanlar(data || [])
    }
  }

  useEffect(() => {
    fetchOgretmenler()
    fetchAlanlar()
  }, [])

  // Filtreleme fonksiyonu
  useEffect(() => {
    let filtered = ogretmenler

    // Alan filtresi
    if (selectedAlan) {
      filtered = filtered.filter(ogretmen => 
        ogretmen.alan_id?.toString() === selectedAlan
      )
    }

    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(ogretmen =>
        ogretmen.ad.toLowerCase().includes(query) ||
        ogretmen.soyad.toLowerCase().includes(query) ||
        ogretmen.email?.toLowerCase().includes(query) ||
        ogretmen.telefon?.includes(query)
      )
    }

    setFilteredOgretmenler(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [ogretmenler, selectedAlan, searchQuery])

  // Sayfalama fonksiyonu
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredOgretmenler.slice(startIndex, endIndex)
    
    setPaginatedData(paginated)
    setTotalPages(Math.ceil(filteredOgretmenler.length / pageSize))
  }, [filteredOgretmenler, currentPage, pageSize])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleFirstPage = () => {
    setCurrentPage(1)
  }

  const handleLastPage = () => {
    setCurrentPage(totalPages)
  }

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleAdd = () => {
    setFormData({
      ad: '',
      soyad: '',
      email: '',
      telefon: '',
      alan_id: '',
      aktif: true,
      pin: generateRandomPin()
    })
    setAddModal(true)
  }

  const handleEdit = (ogretmen: Ogretmen) => {
    setSelectedOgretmen(ogretmen)
    setFormData({
      ad: ogretmen.ad,
      soyad: ogretmen.soyad,
      email: ogretmen.email || '',
      telefon: ogretmen.telefon || '',
      alan_id: ogretmen.alan_id?.toString() || '',
      aktif: ogretmen.aktif,
      pin: ogretmen.pin || ''
    })
    setEditModal(true)
  }

  const handleSaveAdd = async () => {
    if (!formData.ad.trim() || !formData.soyad.trim()) {
      alert('Ad ve soyad zorunludur.')
      return
    }

    if (!formData.pin.trim() || formData.pin.length !== 4) {
      alert('PIN kodu 4 haneli olmalıdır.')
      return
    }
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogretmenler')
      .insert([{
        ad: formData.ad.trim(),
        soyad: formData.soyad.trim(),
        email: formData.email.trim() || null,
        telefon: formData.telefon.trim() || null,
        alan_id: formData.alan_id ? parseInt(formData.alan_id) : null,
        aktif: formData.aktif,
        pin: formData.pin.trim()
      }])

    if (error) {
      alert('Öğretmen eklenirken bir hata oluştu: ' + error.message)
    } else {
      setAddModal(false)
      fetchOgretmenler()
    }
    setSubmitLoading(false)
  }

  const handleSaveEdit = async () => {
    if (!selectedOgretmen || !formData.ad.trim() || !formData.soyad.trim()) {
      alert('Ad ve soyad zorunludur.')
      return
    }

    if (!formData.pin.trim() || formData.pin.length !== 4) {
      alert('PIN kodu 4 haneli olmalıdır.')
      return
    }
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogretmenler')
      .update({
        ad: formData.ad.trim(),
        soyad: formData.soyad.trim(),
        email: formData.email.trim() || null,
        telefon: formData.telefon.trim() || null,
        alan_id: formData.alan_id ? parseInt(formData.alan_id) : null,
        aktif: formData.aktif,
        pin: formData.pin.trim()
      })
      .eq('id', selectedOgretmen.id)

    if (error) {
      alert('Öğretmen güncellenirken bir hata oluştu: ' + error.message)
    } else {
      setEditModal(false)
      fetchOgretmenler()
    }
    setSubmitLoading(false)
  }

  const handleDelete = (ogretmen: Ogretmen) => {
    setSelectedOgretmen(ogretmen)
    setDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedOgretmen) return
    
    setSubmitLoading(true)
    const { error } = await supabase
      .from('ogretmenler')
      .delete()
      .eq('id', selectedOgretmen.id)

    if (error) {
      alert('Öğretmen silinirken bir hata oluştu: ' + error.message)
    } else {
      setDeleteModal(false)
      fetchOgretmenler()
    }
    setSubmitLoading(false)
  }

  const handleToggleActive = async (ogretmen: Ogretmen) => {
    console.log('Durum güncelleniyor:', ogretmen.id, 'mevcut:', ogretmen.aktif, 'yeni:', !ogretmen.aktif)
    
    const { data, error } = await supabase
      .from('ogretmenler')
      .update({ aktif: !ogretmen.aktif })
      .eq('id', ogretmen.id)
      .select()

    console.log('Güncelleme sonucu:', { data, error })

    if (error) {
      alert('Durum güncellenirken bir hata oluştu: ' + error.message)
    } else {
      fetchOgretmenler()
    }
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
              Öğretmen Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">Öğretmenleri yönetin ve bilgilerini güncelleyin.</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Öğretmen Ekle
          </button>
        </div>

        {/* Filtre ve Arama Bölümü */}
        <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-indigo-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Öğretmen adı, soyadı, email veya telefon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Alan Filtresi */}
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedAlan}
                  onChange={(e) => setSelectedAlan(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">Tüm Alanlar</option>
                  {alanlar.map(alan => (
                    <option key={alan.id} value={alan.id}>{alan.ad}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtreleri Temizle */}
            {(selectedAlan || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedAlan('')
                  setSearchQuery('')
                }}
                className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Temizle
              </button>
            )}
          </div>

          {/* Filtre Sonuçları */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredOgretmenler.length} öğretmen gösteriliyor
              {(selectedAlan || searchQuery) && (
                <span className="text-indigo-600">
                  {' '}(toplam {ogretmenler.length} öğretmenden)
                </span>
              )}
            </p>
            
            {/* Aktif Filtreler */}
            <div className="flex gap-2">
              {selectedAlan && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Alan: {alanlar.find(a => a.id.toString() === selectedAlan)?.ad}
                  <button
                    onClick={() => setSelectedAlan('')}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Arama: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Öğretmen Bilgileri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Alan
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {filteredOgretmenler.length === 0 ? 'Henüz öğretmen eklenmemiş' : 'Filtre kriterlerinize uygun öğretmen bulunamadı'}
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                          {filteredOgretmenler.length === 0 
                            ? 'Sisteme ilk öğretmeninizi eklemek için "Yeni Öğretmen Ekle" butonunu kullanın.'
                            : 'Farklı arama terimleri deneyin veya filtreleri temizleyin.'
                          }
                        </p>
                        {(selectedAlan || searchQuery) && (
                          <button
                            onClick={() => {
                              setSelectedAlan('')
                              setSearchQuery('')
                            }}
                            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all duration-200"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Filtreleri Temizle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((ogretmen) => (
                  <tr key={ogretmen.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-indigo-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ogretmen.ad} {ogretmen.soyad}
                          </div>
                          {ogretmen.pin && (
                            <div className="text-xs font-mono text-indigo-600 flex items-center mt-1">
                              <Key className="h-3 w-3 mr-1 text-indigo-500" />
                              PIN: {ogretmen.pin}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {ogretmen.email && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {ogretmen.email}
                          </div>
                        )}
                        {ogretmen.telefon && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {ogretmen.telefon}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ogretmen.alanlar ? (
                        <div className="text-sm text-gray-600 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          {ogretmen.alanlar.ad}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Alan atanmamış</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(ogretmen)}
                        className="flex items-center transition-all duration-200"
                      >
                        {ogretmen.aktif ? (
                          <>
                            <ToggleRight className="h-6 w-6 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-green-600">Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-6 w-6 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">Pasif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(ogretmen)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(ogretmen)} 
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOgretmenler.length > 0 && totalPages > 1 && (
            <div className="bg-white/60 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                {/* Results Info */}
                <div className="text-sm text-gray-600">
                  Toplam <span className="font-medium text-gray-900">{filteredOgretmenler.length}</span> kayıttan{' '}
                  <span className="font-medium text-gray-900">
                    {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredOgretmenler.length)}
                  </span>{' '}
                  arası gösteriliyor
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1">
                  {/* First Page */}
                  <button
                    onClick={handleFirstPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="İlk sayfa"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Önceki sayfa"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1 mx-2">
                    {(() => {
                      const pages = []
                      const startPage = Math.max(1, currentPage - 2)
                      const endPage = Math.min(totalPages, currentPage + 2)

                      // First page if not in range
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
                          >
                            1
                          </button>
                        )
                        if (startPage > 2) {
                          pages.push(
                            <span key="start-ellipsis" className="px-2 text-gray-400">...</span>
                          )
                        }
                      }

                      // Current range
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                              i === currentPage
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }

                      // Last page if not in range
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="end-ellipsis" className="px-2 text-gray-400">...</span>
                          )
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
                          >
                            {totalPages}
                          </button>
                        )
                      }

                      return pages
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Sonraki sayfa"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={handleLastPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Son sayfa"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Yeni Öğretmen Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Öğretmen adı"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soyad *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.soyad}
                  onChange={(e) => setFormData(prev => ({ ...prev, soyad: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Öğretmen soyadı"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta <span className="text-gray-400 font-normal">(Opsiyonel)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="ornek@okul.edu.tr"
                />
              </div>
            </div>
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
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branş/Alan
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.alan_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, alan_id: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="">Alan seçiniz</option>
                  {alanlar.map(alan => (
                    <option key={alan.id} value={alan.id}>{alan.ad}</option>
                  ))}
                </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durum
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, aktif: true }))}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  formData.aktif 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                <ToggleRight className="h-5 w-5 mr-2" />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, aktif: false }))}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  !formData.aktif 
                    ? 'bg-gray-100 text-gray-700 border border-gray-300' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                <ToggleLeft className="h-5 w-5 mr-2" />
                Pasif
              </button>
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
              disabled={submitLoading || !formData.ad.trim() || !formData.soyad.trim() || !formData.pin.trim()}
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
        title="Öğretmeni Düzenle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Öğretmen adı"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soyad *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.soyad}
                  onChange={(e) => setFormData(prev => ({ ...prev, soyad: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Öğretmen soyadı"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="ornek@okul.edu.tr"
                />
              </div>
            </div>
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
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branş/Alan
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.alan_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, alan_id: e.target.value }))}
                  className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="">Alan seçiniz</option>
                  {alanlar.map(alan => (
                    <option key={alan.id} value={alan.id}>{alan.ad}</option>
                  ))}
                </select>
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
              <p className="text-xs text-gray-500 mt-1">PIN değiştirilirse öğretmene bilgi verilmeli</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durum
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, aktif: true }))}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  formData.aktif 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                <ToggleRight className="h-5 w-5 mr-2" />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, aktif: false }))}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  !formData.aktif 
                    ? 'bg-gray-100 text-gray-700 border border-gray-300' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                <ToggleLeft className="h-5 w-5 mr-2" />
                Pasif
              </button>
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
              disabled={submitLoading || !formData.ad.trim() || !formData.soyad.trim() || !formData.pin.trim()}
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
        title="Öğretmeni Sil"
        message={`"${selectedOgretmen?.ad} ${selectedOgretmen?.soyad}" öğretmenini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili veriler de silinecektir.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        loading={submitLoading}
      />
    </div>
  )
} 