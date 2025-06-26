import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Tüm işlemler için standart, güvenli client'ı kullan
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      alanlar: {
        Row: {
          id: number
          ad: string
          aciklama: string | null
          created_at: string
        }
        Insert: {
          id?: number
          ad: string
          aciklama?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          ad?: string
          aciklama?: string | null
          created_at?: string
        }
      }
      ogretmenler: {
        Row: {
          id: number
          ad: string
          soyad: string
          email: string | null
          telefon: string | null
          alan_id: number | null
          aktif: boolean
          pin: string
          created_at: string
        }
        Insert: {
          id?: number
          ad: string
          soyad: string
          email?: string | null
          telefon?: string | null
          alan_id?: number | null
          aktif?: boolean
          pin: string
          created_at?: string
        }
        Update: {
          id?: number
          ad?: string
          soyad?: string
          email?: string | null
          telefon?: string | null
          alan_id?: number | null
          aktif?: boolean
          pin?: string
          created_at?: string
        }
      }
      isletmeler: {
        Row: {
          id: number
          ad: string
          yetkili_kisi: string
          telefon: string
          email: string
          adres: string
          vergi_no: string
          created_at: string
        }
        Insert: {
          id?: number
          ad: string
          yetkili_kisi: string
          telefon: string
          email: string
          adres: string
          vergi_no: string
          created_at?: string
        }
        Update: {
          id?: number
          ad?: string
          yetkili_kisi?: string
          telefon?: string
          email?: string
          adres?: string
          vergi_no?: string
          created_at?: string
        }
      }
      ogrenciler: {
        Row: {
          id: number
          ad: string
          soyad: string
          tc_no: string
          telefon: string | null
          email: string | null
          alan_id: number
          sinif: string
          veli_adi: string | null
          veli_telefon: string | null
          created_at: string
        }
        Insert: {
          id?: number
          ad: string
          soyad: string
          tc_no: string
          telefon?: string | null
          email?: string | null
          alan_id: number
          sinif: string
          veli_adi?: string | null
          veli_telefon?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          ad?: string
          soyad?: string
          tc_no?: string
          telefon?: string | null
          email?: string | null
          alan_id?: number
          sinif?: string
          veli_adi?: string | null
          veli_telefon?: string | null
          created_at?: string
        }
      }
      stajlar: {
        Row: {
          id: number
          ogrenci_id: number
          isletme_id: number
          baslangic_tarihi: string
          bitis_tarihi: string
          durum: 'aktif' | 'tamamlandi' | 'iptal'
          created_at: string
        }
        Insert: {
          id?: number
          ogrenci_id: number
          isletme_id: number
          baslangic_tarihi: string
          bitis_tarihi: string
          durum?: 'aktif' | 'tamamlandi' | 'iptal'
          created_at?: string
        }
        Update: {
          id?: number
          ogrenci_id?: number
          isletme_id?: number
          baslangic_tarihi?: string
          bitis_tarihi?: string
          durum?: 'aktif' | 'tamamlandi' | 'iptal'
          created_at?: string
        }
      }
      dekontlar: {
        Row: {
          id: number
          staj_id: number
          miktar: number
          odeme_tarihi: string
          dekont_dosyasi: string | null
          onay_durumu: 'bekliyor' | 'onaylandi' | 'reddedildi'
          created_at: string
        }
        Insert: {
          id?: number
          staj_id: number
          miktar: number
          odeme_tarihi: string
          dekont_dosyasi?: string | null
          onay_durumu?: 'bekliyor' | 'onaylandi' | 'reddedildi'
          created_at?: string
        }
        Update: {
          id?: number
          staj_id?: number
          miktar?: number
          odeme_tarihi?: string
          dekont_dosyasi?: string | null
          onay_durumu?: 'bekliyor' | 'onaylandi' | 'reddedildi'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 