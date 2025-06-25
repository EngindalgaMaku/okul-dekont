'use client'

import { Building2, GraduationCap, Lock, Search, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'
import { supabaseAdmin } from '@/lib/supabase'

interface Isletme {
  id: number
  ad: string
  yetkili_kisi: string
  pin: string
}

interface Ogretmen {
  id: number
  ad: string
  soyad: string
  pin: string
}

export default function LoginPage() {
  const router = useRouter()
  const { egitimYili, okulAdi } = useEgitimYili()
  const [loginType, setLoginType] = useState<'isletme' | 'ogretmen'>('isletme')
  
  // İşletme state'leri
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [filteredIsletmeler, setFilteredIsletmeler] = useState<Isletme[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIsletme, setSelectedIsletme] = useState<Isletme | null>(null)
  
  // Öğretmen state'leri
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([])
  const [filteredOgretmenler, setFilteredOgretmenler] = useState<Ogretmen[]>([])
  const [selectedOgretmen, setSelectedOgretmen] = useState<Ogretmen | null>(null)
  
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [step, setStep] = useState(1) // 1: Seçim, 2: PIN Girişi

  // İşletmeleri yükle
  const fetchIsletmeler = async () => {
    const { data, error } = await supabaseAdmin
      .from('isletmeler')
      .select('id, ad, yetkili_kisi, pin')
      .order('ad')

    if (data) {
      setIsletmeler(data)
    }
  }

  // Öğretmenleri yükle
  const fetchOgretmenler = async () => {
    const { data, error } = await supabaseAdmin
      .from('ogretmenler')
      .select('id, ad, soyad, pin')
      .order('ad')

    if (data) {
      setOgretmenler(data)
    }
  }

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchIsletmeler()
    fetchOgretmenler()
  }, [])

  // Arama filtresini uygula
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term === '') {
      setFilteredIsletmeler([])
      setFilteredOgretmenler([])
      return
    }
    
    if (loginType === 'isletme') {
      const filtered = isletmeler.filter(isletme => 
        isletme.ad.toLowerCase().includes(term.toLowerCase()) ||
        isletme.yetkili_kisi.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredIsletmeler(filtered)
    } else {
      const filtered = ogretmenler.filter(ogretmen => 
        `${ogretmen.ad} ${ogretmen.soyad}`.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredOgretmenler(filtered)
    }
    setIsDropdownOpen(true)
  }

  // Seçim işlemleri
  const handleIsletmeSelect = (isletme: Isletme) => {
    setSelectedIsletme(isletme)
    setSearchTerm(isletme.ad)
    setIsDropdownOpen(false)
    setStep(2)
    setPinInput('')
    setPinError('')
  }

  const handleOgretmenSelect = (ogretmen: Ogretmen) => {
    setSelectedOgretmen(ogretmen)
    setSearchTerm(`${ogretmen.ad} ${ogretmen.soyad}`)
    setIsDropdownOpen(false)
    setStep(2)
    setPinInput('')
    setPinError('')
  }

  // PIN doğrulama
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loginType === 'isletme' && selectedIsletme) {
      if (pinInput === selectedIsletme.pin) {
        localStorage.setItem('isletme', JSON.stringify(selectedIsletme))
        router.push('/panel')
      } else {
        setPinError('Yanlış PIN! Tekrar deneyin.')
        setPinInput('')
      }
    } else if (loginType === 'ogretmen' && selectedOgretmen) {
      if (pinInput === selectedOgretmen.pin) {
        localStorage.setItem('ogretmen', JSON.stringify(selectedOgretmen))
        router.push('/ogretmen')
      } else {
        setPinError('Yanlış PIN! Tekrar deneyin.')
        setPinInput('')
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Koordinatörlük Takip Sistemi</h1>
          <p className="text-gray-600">{okulAdi}</p>
          <p className="text-sm text-gray-500 mt-1">{egitimYili} Eğitim-Öğretim Yılı</p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {step === 1 ? (
            <>
              {/* Giriş Tipi Seçimi */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    setLoginType('isletme')
                    setSearchTerm('')
                    setFilteredIsletmeler([])
                    setFilteredOgretmenler([])
                    setIsDropdownOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    loginType === 'isletme'
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>İşletme</span>
                </button>
                <button
                  onClick={() => {
                    setLoginType('ogretmen')
                    setSearchTerm('')
                    setFilteredIsletmeler([])
                    setFilteredOgretmenler([])
                    setIsDropdownOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    loginType === 'ogretmen'
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Öğretmen</span>
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-4">
                {loginType === 'isletme' ? 'İşletme Girişi' : 'Öğretmen Girişi'}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={
                    loginType === 'isletme'
                      ? "İşletme adı veya yetkili kişi ara..."
                      : "Öğretmen adı ara..."
                  }
                  className="w-full p-4 border border-gray-200 rounded-lg pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />

                {isDropdownOpen && (
                  loginType === 'isletme' ? (
                    filteredIsletmeler.length > 0 && (
                      <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-10">
                        {filteredIsletmeler.map((isletme) => (
                          <div
                            key={isletme.id}
                            onClick={() => handleIsletmeSelect(isletme)}
                            className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div>
                              <h3 className="font-semibold text-gray-800">{isletme.ad}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {isletme.yetkili_kisi}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    filteredOgretmenler.length > 0 && (
                      <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-10">
                        {filteredOgretmenler.map((ogretmen) => (
                          <div
                            key={ogretmen.id}
                            onClick={() => handleOgretmenSelect(ogretmen)}
                            className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {ogretmen.ad} {ogretmen.soyad}
                              </h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {loginType === 'isletme' 
                    ? selectedIsletme?.ad 
                    : `${selectedOgretmen?.ad} ${selectedOgretmen?.soyad}`
                  }
                </h2>
                {loginType === 'isletme' && (
                  <p className="text-gray-600 flex items-center justify-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedIsletme?.yetkili_kisi}
                  </p>
                )}
              </div>

              <form onSubmit={handlePinSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    PIN Kodu
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="****"
                      className="w-full p-4 border border-gray-200 rounded-lg pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={4}
                    />
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  </div>
                  {pinError && (
                    <p className="text-red-500 text-sm mt-2">{pinError}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Giriş Yap
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setSelectedIsletme(null)
                      setSelectedOgretmen(null)
                      setSearchTerm('')
                      setPinInput('')
                      setPinError('')
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Geri Dön
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 