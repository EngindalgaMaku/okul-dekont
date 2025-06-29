export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      siniflar: {
        Row: {
          id: string
          ad: string
          alan_id: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          ad: string
          alan_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ad?: string
          alan_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ogrenciler: {
        Row: {
          id: string
          ad: string
          soyad: string
          numara: string
          sinif: string
          alan_id: string
          isletme_id: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          ad: string
          soyad: string
          numara: string
          sinif: string
          alan_id: string
          isletme_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ad?: string
          soyad?: string
          numara?: string
          sinif?: string
          alan_id?: string
          isletme_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      isletmeler: {
        Row: {
          id: string
          ad: string
          koordinator_ogretmen_id: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          ad: string
          koordinator_ogretmen_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ad?: string
          koordinator_ogretmen_id?: string | null
          created_at?: string
          updated_at?: string
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