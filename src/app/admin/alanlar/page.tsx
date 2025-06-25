'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Edit, Trash2, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Alan {
    id: number;
    ad: string;
}

export default function AlanYonetimiPage() {
  const router = useRouter()
  const [alanlar, setAlanlar] = useState<Alan[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleSil = async (id: number) => {
    if (confirm('Bu alanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        const { error } = await supabase.from('alanlar').delete().match({ id });
        if(error) {
            console.error('Silme hatası:', error);
            alert('Alan silinirken bir hata oluştu. Lütfen konsolu kontrol edin.');
        } else {
            // Listeyi yeniden yükle
            fetchAlanlar();
        }
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-32">
            <Loader className="animate-spin h-8 w-8 text-emerald-600" />
        </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alan Yönetimi</h1>
          <p className="text-sm text-gray-500">Yeni alanlar ekleyin, mevcutları düzenleyin veya silin.</p>
        </div>
        <button
          onClick={() => router.push('/admin/alanlar/yeni')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Alan Ekle
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alan Adı
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alanlar.map((alan) => (
                <tr key={alan.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{alan.ad}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => router.push(`/admin/alanlar/duzenle/${alan.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleSil(alan.id)} className="text-red-600 hover:text-red-900">
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
  )
} 