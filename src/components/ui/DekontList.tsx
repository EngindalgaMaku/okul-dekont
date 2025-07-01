import { Eye, Trash2, Receipt } from 'lucide-react'
import { Dekont } from '@/types/dekont'

interface DekontListProps {
  dekontlar: Dekont[]
  onDekontSelect: (dekont: Dekont) => void
  onDekontDelete?: (dekont: Dekont) => void
  isLoading?: boolean
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)
}

const getOnayDurumuClass = (durum: string) => {
  switch (durum) {
    case 'bekliyor':
      return 'bg-yellow-100 text-yellow-800'
    case 'onaylandi':
      return 'bg-green-100 text-green-800'
    case 'reddedildi':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getOnayDurumuText = (durum: string) => {
  switch (durum) {
    case 'bekliyor':
      return 'Bekliyor'
    case 'onaylandi':
      return 'Onaylandı'
    case 'reddedildi':
      return 'Reddedildi'
    default:
      return 'Bilinmiyor'
  }
}

export default function DekontList({ dekontlar, onDekontSelect, onDekontDelete, isLoading }: DekontListProps) {
  if (isLoading) {
    return (
      <div className="w-full text-center py-16">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
      </div>
    )
  }

  if (dekontlar.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <Receipt className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Dekont Bulunamadı</h3>
        <p className="mt-2 text-sm text-gray-500">Henüz dekont yüklenmemiş.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Öğrenci
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dönem
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tutar
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dekontlar.map((dekont) => (
            <tr key={dekont.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {dekont.stajlar?.ogrenciler?.ad} {dekont.stajlar?.ogrenciler?.soyad}
                    </div>
                    <div className="text-sm text-gray-500">
                      {dekont.isletmeler?.ad}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {dekont.ay}/{dekont.yil}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(dekont.tutar)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onDekontSelect(dekont)}
                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-lg transition-colors"
                    title="Görüntüle"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {onDekontDelete && (
                    <button
                      onClick={() => onDekontDelete(dekont)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 