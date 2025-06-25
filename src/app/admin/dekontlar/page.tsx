'use client'

import { useState } from 'react'
import { FileText, CheckCircle, XCircle, Clock, Eye, Download, Filter, Search, User, Building2, Calendar } from 'lucide-react'

interface Dekont {
  id: number
  staj_id: number
  ogrenci_adi: string
  isletme_adi: string
  miktar: number
  odeme_tarihi: string
  dekont_dosyasi: string | null
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  created_at: string
}

export default function AdminDekontlarPage() {
  const [filter, setFilter] = useState<'all' | 'bekliyor' | 'onaylandi' | 'reddedildi'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDekont, setSelectedDekont] = useState<Dekont | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Örnek dekont verileri (gerçek uygulamada API'den gelecek)
  const dekontlar: Dekont[] = [
    {
      id: 1,
      staj_id: 1,
      ogrenci_adi: 'Ahmet Yılmaz',
      isletme_adi: 'ABC Teknoloji Ltd.',
      miktar: 2500,
      odeme_tarihi: '2024-01-15',
      dekont_dosyasi: 'dekont_001.pdf',
      onay_durumu: 'bekliyor',
      created_at: '2024-01-16T10:30:00'
    },
    {
      id: 2,
      staj_id: 2,
      ogrenci_adi: 'Fatma Demir',
      isletme_adi: 'XYZ İnşaat A.Ş.',
      miktar: 2200,
      odeme_tarihi: '2024-01-10',
      dekont_dosyasi: 'dekont_002.pdf',
      onay_durumu: 'onaylandi',
      created_at: '2024-01-11T14:20:00'
    },
    {
      id: 3,
      staj_id: 3,
      ogrenci_adi: 'Mehmet Kaya',
      isletme_adi: 'DEF Otomotiv Ltd.',
      miktar: 2800,
      odeme_tarihi: '2024-01-12',
      dekont_dosyasi: 'dekont_003.pdf',
      onay_durumu: 'reddedildi',
      created_at: '2024-01-13T09:15:00'
    },
    {
      id: 4,
      staj_id: 4,
      ogrenci_adi: 'Ayşe Özkan',
      isletme_adi: 'GHI Elektrik A.Ş.',
      miktar: 2300,
      odeme_tarihi: '2024-01-14',
      dekont_dosyasi: 'dekont_004.pdf',
      onay_durumu: 'bekliyor',
      created_at: '2024-01-15T11:45:00'
    }
  ]

  const filteredDekontlar = dekontlar.filter(dekont => {
    const matchesFilter = filter === 'all' || dekont.onay_durumu === filter
    const matchesSearch = 
      dekont.ogrenci_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dekont.isletme_adi.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleApprove = (dekontId: number) => {
    // API çağrısı simülasyonu
    console.log(`Dekont ${dekontId} onaylandı`)
    // Gerçek uygulamada state güncellenmeli
  }

  const handleReject = (dekontId: number) => {
    // API çağrısı simülasyonu
    console.log(`Dekont ${dekontId} reddedildi`)
    // Gerçek uygulamada state güncellenmeli
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'reddedildi':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return 'Onaylandı'
      case 'reddedildi':
        return 'Reddedildi'
      default:
        return 'Bekliyor'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'onaylandi':
        return 'bg-green-100 text-green-800'
      case 'reddedildi':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  Dekont Yönetimi
                </h1>
                <p className="text-sm text-gray-600">Hüsniye Özdilek MTAL - Admin Panel</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Dekont</p>
                <p className="text-2xl font-bold text-gray-900">{dekontlar.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dekontlar.filter(d => d.onay_durumu === 'bekliyor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Onaylanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dekontlar.filter(d => d.onay_durumu === 'onaylandi').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-lg p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reddedilen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dekontlar.filter(d => d.onay_durumu === 'reddedildi').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <label className="text-sm font-medium text-gray-700">Durum:</label>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tümü</option>
                <option value="bekliyor">Bekleyen</option>
                <option value="onaylandi">Onaylanan</option>
                <option value="reddedildi">Reddedilen</option>
              </select>
            </div>

            <div className="flex items-center">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Öğrenci veya işletme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dekontlar Tablosu */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşletme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödeme Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDekontlar.map((dekont) => (
                  <tr key={dekont.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {dekont.ogrenci_adi}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{dekont.isletme_adi}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₺{dekont.miktar.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {new Date(dekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dekont.onay_durumu)}`}>
                        {getStatusIcon(dekont.onay_durumu)}
                        <span className="ml-1">{getStatusText(dekont.onay_durumu)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDekont(dekont)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Detayları Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {dekont.dekont_dosyasi && (
                          <button
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Dosyayı İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}

                        {dekont.onay_durumu === 'bekliyor' && (
                          <>
                            <button
                              onClick={() => handleApprove(dekont.id)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Onayla"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(dekont.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Reddet"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredDekontlar.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dekont Bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinize uygun dekont bulunmuyor.</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && selectedDekont && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dekont Detayları</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Öğrenci:</label>
                <p className="text-gray-900">{selectedDekont.ogrenci_adi}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">İşletme:</label>
                <p className="text-gray-900">{selectedDekont.isletme_adi}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Miktar:</label>
                <p className="text-gray-900">₺{selectedDekont.miktar.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Ödeme Tarihi:</label>
                <p className="text-gray-900">
                  {new Date(selectedDekont.odeme_tarihi).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gönderilme Tarihi:</label>
                <p className="text-gray-900">
                  {new Date(selectedDekont.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            {selectedDekont.onay_durumu === 'bekliyor' && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    handleApprove(selectedDekont.id)
                    setShowModal(false)
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Onayla
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedDekont.id)
                    setShowModal(false)
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reddet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 