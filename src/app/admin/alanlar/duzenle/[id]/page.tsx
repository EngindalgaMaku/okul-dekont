'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Briefcase, Save, ArrowLeft, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DuzenleAlanPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  
  const [alanAdi, setAlanAdi] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isNaN(id)) {
        setNotFound(true);
        setLoading(false);
        return;
    }
    const fetchAlan = async () => {
        const { data, error } = await supabase.from('alanlar').select('ad').eq('id', id).single()
        if (error || !data) {
          setNotFound(true)
          console.error("Alan getirilirken hata:", error)
        } else {
          setAlanAdi(data.ad)
        }
        setLoading(false)
    }
    fetchAlan()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alanAdi.trim()) {
      alert('Alan adı boş olamaz.')
      return
    }
    setLoading(true)
    
    const { error } = await supabase.from('alanlar').update({ ad: alanAdi.trim() }).match({ id })

    if(error) {
        alert('Alan güncellenirken bir hata oluştu: ' + error.message)
        setLoading(false)
    } else {
        router.push('/admin/alanlar')
        router.refresh()
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-32">
            <Loader className="animate-spin h-8 w-8 text-emerald-600" />
        </div>
    )
  }

  if (notFound) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-red-600">Alan Bulunamadı</h1>
            <p className="text-gray-500">Aradığınız alan mevcut değil veya silinmiş olabilir.</p>
            <button
                onClick={() => router.push('/admin/alanlar')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Alan Listesine Geri Dön
            </button>
        </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alanı Düzenle</h1>
          <p className="text-sm text-gray-500">Mevcut alanı güncelleyin.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Geri Dön
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="alanAdi" className="block text-sm font-medium text-gray-700">
                Alan Adı
              </label>
              <div className="mt-1 relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="alanAdi"
                  id="alanAdi"
                  value={alanAdi}
                  onChange={(e) => setAlanAdi(e.target.value)}
                  className="pl-10 pr-4 py-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Örn: Bilişim Teknolojileri"
                  required
                />
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 