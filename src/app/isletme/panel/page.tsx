'use client';

import { useState, useEffect } from 'react';
import { Download, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Ogrenci {
  ad: string;
  soyad: string;
}

interface Staj {
  ogrenciler: Ogrenci;
}

interface DekontData {
  id: number;
  ay: number;
  yil: number;
  dosya_url?: string;
  stajlar: {
    ogrenciler: {
      ad: string;
      soyad: string;
    };
  };
}

interface Dekont {
  id: number;
  ogrenci_ad: string;
  ay: number;
  yil: number;
  dosya_url?: string;
}

export default function IsletmePanelPage() {
  const [dekontlar, setDekontlar] = useState<Dekont[]>([]);
  const [isletme, setIsletme] = useState<any>(null);

  useEffect(() => {
    const storedIsletme = localStorage.getItem('isletme');
    if (storedIsletme) {
      setIsletme(JSON.parse(storedIsletme));
      fetchDekontlar(JSON.parse(storedIsletme).id);
    }
  }, []);

  const fetchDekontlar = async (isletmeId: string) => {
    const { data, error } = await supabase
      .from('dekontlar')
      .select(`
        id,
        ay,
        yil,
        dosya_url,
        stajlar (
          ogrenciler (
            ad,
            soyad
          )
        )
      `)
      .eq('isletme_id', isletmeId)
      .order('yil', { ascending: false })
      .order('ay', { ascending: false });

    if (error) {
      console.error('Dekont yükleme hatası:', error);
      return;
    }

    if (data) {
      const formattedDekontlar = (data as unknown as DekontData[]).map(d => ({
        id: d.id,
        ogrenci_ad: `${d.stajlar.ogrenciler.ad} ${d.stajlar.ogrenciler.soyad}`,
        ay: d.ay,
        yil: d.yil,
        dosya_url: d.dosya_url
      }));
      setDekontlar(formattedDekontlar);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="h-8 w-8 text-white">📄</div>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">{isletme?.ad}</h1>
            <p className="text-indigo-200">İşletme Paneli</p>
          </div>
        </div>

        {/* Dekont Kartları */}
        <div className="bg-white rounded-t-2xl -mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button className="border-b-2 border-indigo-500 py-4 text-sm font-medium text-indigo-600">
                Dekontlar
              </button>
            </div>
          </div>

          <div className="p-8 space-y-4">
            {dekontlar.map(dekont => (
              <div key={dekont.id} className="bg-white rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{dekont.ogrenci_ad}</h3>
                    <p className="text-sm text-gray-500 mt-1">{dekont.ay}. Ay {dekont.yil}</p>
                  </div>
                  {dekont.dosya_url && (
                    <button
                      onClick={() => window.open(dekont.dosya_url, '_blank')}
                      className="inline-flex items-center text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-100 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      İndir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 