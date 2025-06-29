import './globals.css'
import type { Metadata } from 'next'
import { EgitimYiliProvider } from '@/lib/context/EgitimYiliContext'

export const metadata: Metadata = {
  title: 'Hüsniye Özdilek MTAL - Staj Dekont Sistemi',
  description: 'Hüsniye Özdilek MTAL için staj ve dekont yönetim sistemi',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full">
        <EgitimYiliProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </EgitimYiliProvider>
      </body>
    </html>
  )
} 