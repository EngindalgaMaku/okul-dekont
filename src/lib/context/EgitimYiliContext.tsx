'use client'

import { createContext, useContext, ReactNode } from 'react'

interface EgitimYiliContextType {
  egitimYili: string
  okulAdi: string
}

const EgitimYiliContext = createContext<EgitimYiliContextType>({
  egitimYili: '2025-2026',
  okulAdi: 'Hüsniye Özdilek Ticaret Mesleki ve Teknik Anadolu Lisesi'
})

export function useEgitimYili() {
  return useContext(EgitimYiliContext)
}

export function EgitimYiliProvider({ children }: { children: ReactNode }) {
  // Şimdilik sabit değerler kullanıyoruz, ileride yönetim panelinden değiştirilebilir
  const value = {
    egitimYili: '2025-2026',
    okulAdi: 'Hüsniye Özdilek Ticaret Mesleki ve Teknik Anadolu Lisesi'
  }

  return (
    <EgitimYiliContext.Provider value={value}>
      {children}
    </EgitimYiliContext.Provider>
  )
} 