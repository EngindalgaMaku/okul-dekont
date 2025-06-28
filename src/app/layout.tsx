import './globals.css'
import type { Metadata } from 'next'
import { EgitimYiliProvider } from '@/lib/context/EgitimYiliContext'

export const metadata: Metadata = {
  title: 'Hüsniye Özdilek MTAL - Staj Dekont Sistemi',
  description: 'Hüsniye Özdilek MTAL için staj ve dekont yönetim sistemi',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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