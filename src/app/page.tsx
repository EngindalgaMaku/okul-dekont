'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEgitimYili } from '@/lib/context/EgitimYiliContext'

interface Isletme {
    id: number
    ad: string
    yetkili_kisi: string
    pin: string
}
  
interface Ogretmen {
    id: number
    ad: string
    soyad: string
    pin: string
}

export default function LoginPage() {
  const router = useRouter()
  const { setOkulAdi, setEgitimYili } = useEgitimYili()
  const [loginType, setLoginType] = useState<'isletme' | 'ogretmen'>('isletme')
  
  const [isletmeler, setIsletmeler] = useState<Isletme[]>([])
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([])
  
  const [selectedIsletme, setSelectedIsletme] = useState<Isletme | null>(null)
  const [selectedOgretmen, setSelectedOgretmen] = useState<Ogretmen | null>(null)
  
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [step, setStep] = useState(1) // 1: Seçim, 2: PIN Girişi

  useEffect(() => {
    const fetchInitialData = async () => {
        // İşletmeleri yükle
        const { data: isletmeData, error: isletmeError } = await supabase
            .from('isletmeler')
            .select('id, ad, yetkili_kisi, pin')
            .order('ad');
        if (isletmeData) setIsletmeler(isletmeData);

        // Öğretmenleri yükle
        const { data: ogretmenData, error: ogretmenError } = await supabase
            .from('ogretmenler')
            .select('id, ad, soyad, pin')
            .order('ad');
        if (ogretmenData) setOgretmenler(ogretmenData);

        // Aktif eğitim yılını yükle
        const { data: egitimYiliData, error: egitimYiliError } = await supabase
            .from('egitim_yillari')
            .select('*')
            .eq('aktif', true)
            .single();
        
        if(egitimYiliData) {
            setOkulAdi('Hüsniye Özdilek MTAL'); // Bu bilgi de DB'den gelebilir
            setEgitimYili(egitimYiliData.yil);
        }
    }
    fetchInitialData();
  }, [setEgitimYili, setOkulAdi]);

  const handleSelectAndProceed = () => {
    if (loginType === 'isletme' && !selectedIsletme) {
      setPinError('Lütfen bir işletme seçin.')
      return
    }
    if (loginType === 'ogretmen' && !selectedOgretmen) {
        setPinError('Lütfen bir öğretmen seçin.')
        return
    }
    setPinError('')
    setStep(2)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let pinValid = false;
    if (loginType === 'isletme' && selectedIsletme) {
        if (pinInput === selectedIsletme.pin) {
            pinValid = true;
            localStorage.setItem('isletme', JSON.stringify(selectedIsletme))
            router.push('/panel')
        }
    } else if (loginType === 'ogretmen' && selectedOgretmen) {
        if (pinInput === selectedOgretmen.pin) {
            pinValid = true;
            localStorage.setItem('ogretmen', JSON.stringify(selectedOgretmen))
            router.push('/ogretmen')
        }
    }

    if (!pinValid) {
        setPinError('PIN kodu hatalı. Lütfen tekrar deneyin.')
    }
  }

  const renderIsletmeLogin = () => (
    <>
      <h2 className="text-xl font-semibold text-center text-gray-800">İşletme Girişi</h2>
      {isletmeler.length > 0 ? (
        <select
          value={selectedIsletme?.id || ''}
          onChange={(e) => {
            const isletme = isletmeler.find(i => i.id === parseInt(e.target.value));
            setSelectedIsletme(isletme || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="" disabled>İşletme Seçiniz</option>
          {isletmeler.map((isletme) => (
            <option key={isletme.id} value={isletme.id}>{isletme.ad}</option>
          ))}
        </select>
      ) : <p>İşletmeler yükleniyor...</p>}
    </>
  );

  const renderOgretmenLogin = () => (
    <>
        <h2 className="text-xl font-semibold text-center text-gray-800">Öğretmen Girişi</h2>
        {ogretmenler.length > 0 ? (
            <select
            value={selectedOgretmen?.id || ''}
            onChange={(e) => {
                const ogretmen = ogretmenler.find(o => o.id === parseInt(e.target.value));
                setSelectedOgretmen(ogretmen || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
            <option value="" disabled>Öğretmen Seçiniz</option>
            {ogretmenler.map((ogretmen) => (
                <option key={ogretmen.id} value={ogretmen.id}>{ogretmen.ad} {ogretmen.soyad}</option>
            ))}
            </select>
        ) : <p>Öğretmenler yükleniyor...</p>}
    </>
  );


  const renderPinInput = () => (
    <form onSubmit={handlePinSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center text-gray-800">PIN Girişi</h2>
        <p className="text-center text-gray-600">
            {loginType === 'isletme' ? selectedIsletme?.ad : `${selectedOgretmen?.ad} ${selectedOgretmen?.soyad}`}
        </p>
        <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-3 py-2 text-center border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="PIN Kodunuzu Girin"
            maxLength={4}
        />
        {pinError && <p className="text-sm text-red-600 text-center">{pinError}</p>}
        <div className="flex justify-between">
            <button type="button" onClick={() => { setStep(1); setPinInput(''); setPinError(''); }} className="text-sm text-gray-600 hover:underline">Geri</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">Giriş Yap</button>
        </div>
    </form>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-xl">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Staj Takip Sistemi</h1>
                <p className="text-gray-600">Hüsniye Özdilek MTAL</p>
            </div>
            
            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setLoginType('isletme')}
                            className={`px-4 py-2 rounded-md font-medium ${loginType === 'isletme' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            İşletme
                        </button>
                        <button
                            onClick={() => setLoginType('ogretmen')}
                            className={`px-4 py-2 rounded-md font-medium ${loginType === 'ogretmen' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Öğretmen
                        </button>
                    </div>

                    {loginType === 'isletme' ? renderIsletmeLogin() : renderOgretmenLogin()}
                    {pinError && step === 1 && <p className="text-sm text-red-600 text-center">{pinError}</p>}
                    <button 
                        onClick={handleSelectAndProceed}
                        className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                        İlerle
                    </button>
                </div>
            )}
            
            {step === 2 && renderPinInput()}

        </div>
    </div>
  )
} 