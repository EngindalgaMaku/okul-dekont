'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Save, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function YeniEgitimYiliPage() {
  const router = useRouter()
  const [yil, setYil] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const yilPattern = /^\d{4}-\d{4}$/
    if (!yil.trim() || !yilPattern.test(yil.trim())) {
      alert('Lütfen geçerli bir eğitim yılı formatı girin (örn: 2024-2025).')
      return
    }
    setLoading(true)
    
    // Yeni yıl varsayılan olarak pasif eklenir
    const { error } = await supabase.from('egitim_yillari').insert({ yil: yil.trim(), aktif: false });

    if (error) {
        console.error('Ekleme hatası:', error)
        // Hata kodunu kontrol et (23505: unique_violation)
        if (error.code === '23505') {
            alert(`'${yil.trim()}' eğitim yılı zaten mevcut. Lütfen farklı bir yıl girin.`);
        } else {
            alert('Eğitim yılı eklenirken bir hata oluştu: ' + error.message);
        }
        setLoading(false)
    } else {
        router.push('/admin/egitim-yili')
        router.refresh(); 
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Eğitim Yılı Ekle</h1>
          <p className="text-sm text-gray-500">Yeni bir eğitim dönemi oluşturun.</p>
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
              <label htmlFor="yil" className="block text-sm font-medium text-gray-700">
                Eğitim Yılı
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="yil"
                  id="yil"
                  value={yil}
                  onChange={(e) => setYil(e.target.value)}
                  className="pl-10 pr-4 py-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="2024-2025"
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
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 