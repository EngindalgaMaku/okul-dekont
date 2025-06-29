'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Loader, Monitor, Newspaper, Users, Calculator, Radio, Palette, Code, Mic, MessageCircle, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'


interface Alan {
    id: number;
    ad: string;
}

export default function AlanYonetimiPage() {
  const router = useRouter()
  const [alanlar, setAlanlar] = useState<Alan[]>([])
  const [loading, setLoading] = useState(true)

  const getAlanIcon = (alanAdi: string) => {
    const alanLower = alanAdi.toLowerCase()
    
    if (alanLower.includes('bilişim') || alanLower.includes('teknoloji') || alanLower.includes('bilgisayar')) {
      return <Monitor className="h-5 w-5 text-blue-500" />
    }
    if (alanLower.includes('gazete') || alanLower.includes('basın') || alanLower.includes('haber')) {
      return <Newspaper className="h-5 w-5 text-gray-600" />
    }
    if (alanLower.includes('halkla') || alanLower.includes('iletişim') || alanLower.includes('pr')) {
      return <Users className="h-5 w-5 text-green-500" />
    }
    if (alanLower.includes('muhasebe') || alanLower.includes('finans') || alanLower.includes('ekonomi')) {
      return <Calculator className="h-5 w-5 text-emerald-600" />
    }
    if (alanLower.includes('radyo') || alanLower.includes('televizyon') || alanLower.includes('medya')) {
      return <Radio className="h-5 w-5 text-purple-500" />
    }
    if (alanLower.includes('sanat') || alanLower.includes('tasarım') || alanLower.includes('grafik')) {
      return <Palette className="h-5 w-5 text-pink-500" />
    }
    if (alanLower.includes('yazılım') || alanLower.includes('program') || alanLower.includes('kod')) {
      return <Code className="h-5 w-5 text-indigo-500" />
    }
    if (alanLower.includes('ses') || alanLower.includes('müzik') || alanLower.includes('ses teknoloji')) {
      return <Mic className="h-5 w-5 text-orange-500" />
    }
    if (alanLower.includes('pazarlama') || alanLower.includes('reklam') || alanLower.includes('satış')) {
      return <MessageCircle className="h-5 w-5 text-cyan-500" />
    }
    if (alanLower.includes('ticaret') || alanLower.includes('işletme') || alanLower.includes('yönetim')) {
      return <DollarSign className="h-5 w-5 text-yellow-500" />
    }
    
    // Varsayılan simge
    return <Briefcase className="h-5 w-5 text-indigo-500" />
  }
  


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

              <tbody className="bg-white/60 divide-y divide-gray-200">
                {alanlar.map((alan) => (
                  <tr key={alan.id} className="group hover:bg-indigo-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getAlanIcon(alan.ad)}
                        </div>
                        <button
                          onClick={() => router.push(`/admin/alanlar/${alan.id}`)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                        >
                          {alan.ad}
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




    </div>
  )
} 