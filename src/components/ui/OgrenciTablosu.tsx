'use client'

import { Building2, GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface Ogrenci {
  id: string
  ad: string
  soyad: string
  no: string
  sinif: string
  isletme: {
    id: string
    ad: string
  } | null
}

export default function OgrenciTablosu({
  ogrenciler,
  baslik = "Öğrenciler",
  bosVeriMesaji = "Henüz öğrenci bulunmuyor.",
}: {
  ogrenciler: Ogrenci[]
  baslik?: string
  bosVeriMesaji?: string
}) {
  if (!ogrenciler?.length) {
    return (
      <div className="text-center py-8">
        <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Öğrenci Yok</h3>
        <p className="mt-1 text-sm text-gray-500">{bosVeriMesaji}</p>
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
              Numara
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sınıf
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşletme
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ogrenciler.map((ogrenci) => (
            <tr key={ogrenci.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {ogrenci.ad} {ogrenci.soyad}
                    </div>
                  </div>
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
                {ogrenci.isletme ? (
                  <Link
                    href={`/admin/isletmeler/${ogrenci.isletme.id}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {ogrenci.isletme.ad}
                  </Link>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    İşletme atanmamış
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/admin/ogrenciler/${ogrenci.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Detay
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 