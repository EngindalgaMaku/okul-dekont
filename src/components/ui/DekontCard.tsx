import { Download } from 'lucide-react';

interface DekontCardProps {
  ogrenciAd: string;
  donem: string;
  dosyaUrl?: string;
  onIndir?: () => void;
}

export default function DekontCard({ ogrenciAd, donem, dosyaUrl, onIndir }: DekontCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{ogrenciAd}</h3>
          <p className="text-sm text-gray-500 mt-1">{donem}</p>
        </div>
        {dosyaUrl && (
          <button
            onClick={onIndir}
            className="ml-4 inline-flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            title="Dekontu İndir"
          >
            <Download className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
} 