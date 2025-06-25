'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Edit, Trash2, Loader, CheckCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EgitimYili {
    id: number;
    yil: string;
    aktif: boolean;
}

export default function EgitimYiliYonetimiPage() {
  const router = useRouter()
  const [yillar, setYillar] = useState<EgitimYili[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleSil = async (id: number) => {
    const yilToDelete = yillar.find(y => y.id === id);
    if (yilToDelete?.aktif) {
        alert('Aktif olan eğitim yılı silinemez. Lütfen önce başka bir yılı aktif edin.');
        return;
    }

    if (confirm(`'${yilToDelete?.yil}' eğitim yılını silmek istediğinizden emin misiniz?`)) {
        const { error } = await supabase.from('egitim_yillari').delete().match({ id });
        if(error) {
            console.error('Silme hatası:', error);
            alert('Eğitim yılı silinirken bir hata oluştu: ' + error.message);
        } else {
            fetchEgitimYillari();
        }
    }
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
            <Loader className="animate-spin h-8 w-8 text-emerald-600" />
        </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eğitim Yılı Yönetimi</h1>
          <p className="text-sm text-gray-500">Sistemde kullanılacak eğitim yıllarını yönetin.</p>
        </div>
        <button
          onClick={() => router.push('/admin/egitim-yili/yeni')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Yıl Ekle
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eğitim Yılı
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
              {yillar.map((yil) => (
                <tr key={yil.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{yil.yil}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {yil.aktif ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Aktif
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pasif
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!yil.aktif && (
                         <button 
                            onClick={() => handleActivate(yil.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 mr-3">
                           <ShieldCheck className="h-4 w-4 mr-1.5" />
                           Aktif Et
                         </button>
                    )}
                    <button onClick={() => handleSil(yil.id)} className="text-red-600 hover:text-red-900">
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