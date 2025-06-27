'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, User, Key, Loader, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function OgretmenLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    pin: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Önce öğretmeni adı ve soyadı ile bul
      const { data: ogretmen, error: ogretmenError } = await supabase
        .from('ogretmenler')
        .select(`
          id,
          ad,
          soyad,
          pin,
          aktif,
          hesap_kilitli,
          yanlis_pin_sayisi,
          kilitlenme_tarihi,
          isletmeler (
            id,
            ad,
            yetkili_kisi
          )
        `)
        .eq('ad', formData.ad.trim())
        .eq('soyad', formData.soyad.trim())
        .eq('aktif', true)
        .single()

      if (ogretmenError || !ogretmen) {
        setError('Öğretmen bilgileri hatalı veya hesap aktif değil!')
        setLoading(false)
        return
      }

      // Pin kontrolü için veritabanı fonksiyonunu kullan
      const { data: pinResult, error: pinError } = await supabase
        .rpc('check_ogretmen_pin_giris', {
          p_ogretmen_id: ogretmen.id,
          p_girilen_pin: formData.pin.trim(),
          p_ip_adresi: window.location.hostname,
          p_user_agent: navigator.userAgent
        })

      if (pinError) {
        console.error('Pin kontrol hatası:', pinError)
        setError('Bir hata oluştu. Lütfen tekrar deneyin.')
        setLoading(false)
        return
      }

      if (!pinResult.basarili) {
        if (pinResult.kilitli) {
          setError(pinResult.mesaj + (pinResult.kilitlenme_tarihi ? 
            ` (${new Date(pinResult.kilitlenme_tarihi).toLocaleString('tr-TR')})` : ''))
        } else {
          setError(pinResult.mesaj)
        }
        setLoading(false)
        return
      }

      // Session token oluştur
      const sessionToken = `ogr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 8) // 8 saat geçerli

      // Session kaydet
      const { error: sessionError } = await supabase
        .from('ogretmen_sessions')
        .insert([{
          ogretmen_id: ogretmen.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        }])

      if (sessionError) {
        console.error('Session oluşturma hatası:', sessionError)
      }

      // Local storage'a kaydet
      localStorage.setItem('ogretmen_session', JSON.stringify({
        token: sessionToken,
        ogretmen: {
          id: ogretmen.id,
          ad: ogretmen.ad,
          soyad: ogretmen.soyad,
          isletmeler: ogretmen.isletmeler || []
        },
        expires_at: expiresAt.toISOString()
      }))

      // Öğretmen paneline yönlendir
      router.push('/ogretmen/panel')
      
    } catch (error) {
      console.error('Giriş hatası:', error)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Öğretmen Girişi
          </h1>
          <p className="text-gray-600 mt-2">
            Koordinatörlük yaptığınız işletmeleri yönetmek için giriş yapın
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-blue-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adınız
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Adınızı girin"
                  required
                />
              </div>
            </div>

            {/* Soyad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soyadınız
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.soyad}
                  onChange={(e) => setFormData(prev => ({ ...prev, soyad: e.target.value }))}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Soyadınızı girin"
                  required
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Kodunuz
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPin ? "text" : "password"}
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData(prev => ({ ...prev, pin: value }))
                  }}
                  className="pl-10 pr-12 py-3 w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                4 haneli PIN kodunuzu girin
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.ad.trim() || !formData.soyad.trim() || !formData.pin.trim()}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Giriş sorunları için okul yönetimi ile iletişime geçin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 