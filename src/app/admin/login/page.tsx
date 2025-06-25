'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Lock, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Geçici giriş kontrolü - Gerçek uygulamada API çağrısı yapılmalı
    if (email === 'admin@email.com' && password === 'admin') {
      // Giriş başarılı olursa, bir session bilgisi oluştur
      sessionStorage.setItem('admin-auth', 'true')
      router.push('/admin/dekontlar')
    } else {
      setError('Geçersiz e-posta veya şifre.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <FileText className="w-12 h-12 mx-auto text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Admin Paneli Girişi
            </h1>
            <p className="text-sm text-gray-600">Lütfen devam etmek için giriş yapın.</p>
        </div>
        
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800">
            <p><span className="font-semibold">Demo Giriş Bilgileri:</span></p>
            <p><strong>E-posta:</strong> admin@email.com</p>
            <p><strong>Şifre:</strong> admin</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              E-posta
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Şifre
            </label>
            <div className="mt-1 relative">
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 