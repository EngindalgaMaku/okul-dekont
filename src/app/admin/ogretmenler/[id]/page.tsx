'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Building2, GraduationCap, Mail, Phone, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Ogretmen {
  id: number
  ad: string
  soyad: string
  email: string
  telefon?: string
  is_koordinator?: boolean
}

interface Isletme {
  id: number
  ad: string
  ogrenci_sayisi: number
}

interface Ogrenci {
  id: number
  ad: string
  soyad: string
  no: string
  sinif: string
  isletme_adi?: string
}

export default function OgretmenDetayPage() {
  const router = useRouter()
  const params = useParams()
  const ogretmenId = params.id as string

  const [ogretmen, setOgretmen] = useState<Ogretmen | null>(null)
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOgretmenDetay()
  }, [])

  const fetchOgretmenDetay = async () => {
    try {
      setLoading(true)

      // Öğretmen bilgilerini çek
      const { data: ogretmenData, error: ogretmenError } = await supabase
        .from('ogretmenler')
        .select('*')
        .eq('id', ogretmenId)
        .single()

      if (ogretmenError) throw ogretmenError
      setOgretmen(ogretmenData)

      if (ogretmenData.is_koordinator) {
        // Koordinatörlük yaptığı işletmeleri çek
        const { data: isletmeData, error: isletmeError } = await supabase
          .from('isletmeler')
          .select('id, ad, ogrenci_sayisi')
          .eq('koordinator_id', ogretmenId)

        if (isletmeError) throw isletmeError
        setIsletmeler(isletmeData || [])

        // İşletmelerdeki öğrencileri çek
        const { data: ogrenciData, error: ogrenciError } = await supabase
          .from('ogrenciler')
          .select('id, ad, soyad, no, sinif, isletme_adi')
          .in('isletme_id', isletmeData.map(i => i.id))

        if (ogrenciError) throw ogrenciError
        setOgrenciler(ogrenciData || [])
      }
    } catch (error) {
      console.error('Öğretmen detayları çekilirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !ogretmen) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Geri Dön
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {ogretmen.ad} {ogretmen.soyad}
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-2" />
                  {ogretmen.email}
                </div>
                {ogretmen.telefon && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-2" />
                    {ogretmen.telefon}
                  </div>
                )}
              </div>
            </div>
            {ogretmen.is_koordinator && (
              <div className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl">
                <UserCheck className="h-5 w-5 mr-2" />
                Koordinatör Öğretmen
              </div>
            )}
          </div>
        </div>

        {/* Koordinatörlük Bilgileri */}
        {ogretmen.is_koordinator && (
          <div className="space-y-6">
            {/* İşletmeler */}
            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-indigo-600" />
                  Koordinatörlük Yaptığı İşletmeler
                </div>
              </h2>

              {isletmeler.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isletmeler.map((isletme) => (
                    <div key={isletme.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow duration-200">
                      <h3 className="font-semibold text-gray-900">{isletme.ad}</h3>
                      <p className="text-sm text-gray-500 mt-1">{isletme.ogrenci_sayisi} öğrenci</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz işletme yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu öğretmene henüz işletme atanmamış.</p>
                </div>
              )}
            </div>

            {/* Öğrenciler */}
            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-indigo-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <div className="flex items-center">
                  <GraduationCap className="h-6 w-6 mr-2 text-indigo-600" />
                  Sorumlu Olduğu Öğrenciler
                </div>
              </h2>

              {ogrenciler.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Öğrenci
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Numara
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sınıf
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşletme
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ogrenciler.map((ogrenci) => (
                        <tr key={ogrenci.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                <UserCheck className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {ogrenci.ad} {ogrenci.soyad}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ogrenci.no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {ogrenci.sinif}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ogrenci.isletme_adi ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🏢 {ogrenci.isletme_adi}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                ❌ İşletmesi yok
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz öğrenci yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu öğretmenin sorumlu olduğu öğrenci bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 