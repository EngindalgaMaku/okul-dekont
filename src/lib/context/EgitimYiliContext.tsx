'use client'

import { createContext, useState, useContext, ReactNode } from 'react'

interface EgitimYiliContextType {
  okulAdi: string
  egitimYili: string
  setOkulAdi: (ad: string) => void
  setEgitimYili: (yil: string) => void
}

const EgitimYiliContext = createContext<EgitimYiliContextType | undefined>(undefined)

export function EgitimYiliProvider({ children }: { children: ReactNode }) {
  const [okulAdi, setOkulAdi] = useState('Okul Adı Yükleniyor...')
  const [egitimYili, setEgitimYili] = useState('Eğitim Yılı Yükleniyor...')

  const value = { okulAdi, egitimYili, setOkulAdi, setEgitimYili }

  return (
    <EgitimYiliContext.Provider value={value}>
      {children}
    </EgitimYiliContext.Provider>
  )
}

export function useEgitimYili() {
  const context = useContext(EgitimYiliContext)
  if (context === undefined) {
    throw new Error('useEgitimYili must be used within a EgitimYiliProvider')
  }
  return context
} 