export interface Dekont {
  id: number
  staj_id: number
  isletme_id: number
  tutar: number
  odeme_tarihi: string
  aciklama?: string
  dosya_url?: string
  onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
  stajlar?: {
    ogrenciler?: {
      ad: string
      soyad: string
      sinif: string
    }
  }
  ay: number
  yil: number
  created_at: string
  isletmeler: {
    ad: string
  }
  tarih?: string
  miktar?: number
  ogrenci_adi?: string
  odeme_son_tarihi?: string
  dekont_dosyasi?: string
}

export interface DekontFormData {
  staj_id: number
  tutar: number
  dosya?: File
  aciklama?: string
  ay: number
  yil: number
}

export interface DekontModalProps {
  isOpen: boolean
  onClose: () => void
  dekont: Dekont | null
  onDownload?: (url: string) => void
}

export interface DekontListProps {
  dekontlar: Dekont[]
  onDekontSelect: (dekont: Dekont) => void
  onDekontDelete?: (dekont: Dekont) => void
  isLoading?: boolean
} 