import React, { useState, useMemo } from 'react';
import { Search, X, Tag, Check, Filter, BookOpen, Layers, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { KlasifikasiItem, JenisNaskah } from '../types';
import { KLASIFIKASI_SURAT } from '../data/klasifikasiData';
import { formatNomorNaskah } from '../services/nomorSuratService';
import { suggestKlasifikasi, KlasifikasiSuggestion } from '../services/klasifikasiSuggester';

interface KlasifikasiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: KlasifikasiItem) => void;
  selectedKode?: string;
  jenisNaskah: JenisNaskah;
  nomorUrut?: number;
  bulan: string;
  tahun: number;
  perihal?: string;
  isiDokumen?: string;
}

export const KlasifikasiPickerModal: React.FC<KlasifikasiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedKode,
  jenisNaskah,
  nomorUrut = 1,
  bulan,
  tahun,
  perihal = '',
  isiDokumen = '',
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'FASILITATIF' | 'SUBSTANTIF'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategoriInduk, setSelectedKategoriInduk] = useState<string>('ALL');
  const [dismissSuggestions, setDismissSuggestions] = useState(false);

  // Peta cepat kode_lengkap -> KlasifikasiItem
  const klasifikasiMap = useMemo(() => {
    const map = new Map<string, KlasifikasiItem>();
    KLASIFIKASI_SURAT.forEach((item) => {
      if (!map.has(item.kode_lengkap)) {
        map.set(item.kode_lengkap, item);
      }
    });
    return map;
  }, []);

  // Hitung saran klasifikasi cerdas berbasis perihal dan isi dokumen
  const suggestions: Array<KlasifikasiSuggestion & { item?: KlasifikasiItem }> = useMemo(() => {
    const rawSuggestions = suggestKlasifikasi(perihal, isiDokumen, 3);
    return rawSuggestions.map((sug) => ({
      ...sug,
      item: klasifikasiMap.get(sug.kode),
    }));
  }, [perihal, isiDokumen, klasifikasiMap]);

  // Daftar kategori induk unik berdasarkan tab aktif
  const kategoriIndukList = useMemo(() => {
    let source = KLASIFIKASI_SURAT;
    if (activeTab !== 'ALL') {
      source = source.filter((item) => item.kategori_utama === activeTab);
    }
    const map = new Map<string, string>();
    source.forEach((item) => {
      if (!map.has(item.kode_huruf)) {
        map.set(item.kode_huruf, `${item.kode_huruf} - ${item.nama_kategori}`);
      }
    });
    return Array.from(map.entries()).map(([kode, label]) => ({ kode, label }));
  }, [activeTab]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return KLASIFIKASI_SURAT.filter((item) => {
      // Filter Tab
      if (activeTab !== 'ALL' && item.kategori_utama !== activeTab) {
        return false;
      }
      // Filter Kategori Induk
      if (selectedKategoriInduk !== 'ALL' && item.kode_huruf !== selectedKategoriInduk) {
        return false;
      }
      // Filter Search Query
      if (!q) return true;
      return (
        item.kode_lengkap.toLowerCase().includes(q) ||
        item.uraian.toLowerCase().includes(q) ||
        item.nama_kategori.toLowerCase().includes(q) ||
        item.nama_sub.toLowerCase().includes(q)
      );
    });
  }, [activeTab, selectedKategoriInduk, searchQuery]);

  // Count per tab
  const counts = useMemo(() => {
    let fas = 0;
    let sub = 0;
    KLASIFIKASI_SURAT.forEach((k) => {
      if (k.kategori_utama === 'FASILITATIF') fas++;
      else sub++;
    });
    return {
      all: KLASIFIKASI_SURAT.length,
      fasilitatif: fas,
      substantif: sub,
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2A27]/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FCFBF8] rounded-2xl shadow-[0_20px_50px_-10px_rgba(43,42,39,0.18)] border border-[#E6E2D8] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E6E2D8] bg-[#F6F4EF] text-[#2B2A27] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EDF0F4] rounded-xl border border-[#D3DAE5]">
              <Tag className="w-5 h-5 text-[#45546B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2B2A27]">Pilih Klasifikasi Nomor Surat</h2>
              <p className="text-xs text-[#66625B] font-medium">
                Tata Naskah Dinas Kementerian Komunikasi dan Digital RI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66625B] bg-[#FCFBF8] hover:bg-[#EAE6DD] hover:text-[#2B2A27] rounded-xl border border-[#E2DDD2] transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Fasilitatif vs Substantif */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 pt-3 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setSelectedKategoriInduk('ALL');
            }}
            className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Semua ({counts.all})
          </button>
          <button
            onClick={() => {
              setActiveTab('FASILITATIF');
              setSelectedKategoriInduk('ALL');
            }}
            className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FASILITATIF'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Fasilitatif ({counts.fasilitatif})
          </button>
          <button
            onClick={() => {
              setActiveTab('SUBSTANTIF');
              setSelectedKategoriInduk('ALL');
            }}
            className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SUBSTANTIF'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Substantif ({counts.substantif})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode (misal: KP.01.06, SP, KU) atau kata kunci (penugasan, rapat, anggaran, dll)..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedKategoriInduk}
              onChange={(e) => setSelectedKategoriInduk(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Semua Kategori Induk</option>
              {kategoriIndukList.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Saran Klasifikasi Cerdas di dalam Tab/Modal */}
        {suggestions.length > 0 && !dismissSuggestions && !searchQuery && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border-b border-indigo-100/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Rekomendasi Cerdas Berdasarkan Isi Nota Dinas</span>
                <span className="text-[10px] font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  Fitur Saran Otomatis
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissSuggestions(true)}
                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Sembunyikan saran"
              >
                Tutup Saran &times;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {suggestions.map((sug) => {
                const item = sug.item;
                const isSelected = selectedKode === sug.kode;
                const pct = Math.round(sug.confidence * 100);
                return (
                  <div
                    key={sug.kode}
                    onClick={() => {
                      if (item) {
                        onSelect(item);
                        onClose();
                      }
                    }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-100/80 border-blue-400 shadow-xs ring-1 ring-blue-400'
                        : 'bg-white border-indigo-200/70 hover:border-indigo-400 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                          {sug.kode}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {pct}% Cocok
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                        {item ? item.uraian : sug.uraian}
                      </div>
                      {sug.matched.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">
                          Kata kunci: {sug.matched.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-indigo-600 hover:text-indigo-800">
                      <span>{isSelected ? '✓ Terpilih' : 'Gunakan Saran'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>
                Saran ini bersifat rekomendasi. Anda tetap bebas mencari dan memilih kode lain dari daftar di bawah.
              </span>
            </div>
          </div>
        )}

        {/* Result List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Tidak ada kode klasifikasi yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">
                Coba gunakan kata kunci pencarian yang lebih umum
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedKode === item.kode_lengkap;
              const previewNomor = formatNomorNaskah(
                jenisNaskah,
                nomorUrut,
                item.kode_lengkap,
                bulan,
                tahun
              );

              return (
                <div
                  key={`${item.kategori_utama}-${item.kode_lengkap}-${item.sub_kode}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          item.kategori_utama === 'FASILITATIF'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.kategori_utama}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.kode_lengkap}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.kode_huruf} ({item.nama_kategori}) &rsaquo; {item.kode_angka}{' '}
                        ({item.nama_sub})
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {item.uraian}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 font-mono flex items-center gap-1.5">
                      <span className="text-slate-400 font-sans">Simulasi nomor:</span>
                      <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        {previewNomor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Pilih Kode
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 px-5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong>{filteredItems.length}</strong> kode klasifikasi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
