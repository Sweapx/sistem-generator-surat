import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Download, Printer, FileCheck, Layers, Edit3, RotateCcw, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { SuratTugasFormState, Pegawai, Pejabat } from '../types';
import { formatTanggalIndonesia } from '../services/docxService';
import { splitNotaDinasPages, splitSuratUndanganPages, splitSuratTugasPages } from '../services/naskahFormatter';
import { RichEditable, MarkupText } from './RichEditable';
import { DocumentPreviewTable } from './InteractiveDocumentTable';
import { visibleLength, isNotaKeyValueLine } from '../services/richText';

export const BsreQrCode: React.FC<{ size?: string | number; className?: string }> = ({
  size = '76px',
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <div
      style={{
        width: pixelSize,
        height: pixelSize,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '2px',
        boxSizing: 'border-box',
      }}
      className={className}
      title="Tanda Tangan Elektronik Tersertifikasi BSrE BSSN"
    >
      <svg
        viewBox="0 0 120 120"
        style={{ width: '100%', height: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="120" height="120" fill="#ffffff" />

        {/* Position Detection Patterns - Top Left */}
        <rect x="6" y="6" width="30" height="30" fill="#000000" />
        <rect x="10" y="10" width="22" height="22" fill="#ffffff" />
        <rect x="14" y="14" width="14" height="14" fill="#000000" />

        {/* Position Detection Patterns - Top Right */}
        <rect x="84" y="6" width="30" height="30" fill="#000000" />
        <rect x="88" y="10" width="22" height="22" fill="#ffffff" />
        <rect x="92" y="14" width="14" height="14" fill="#000000" />

        {/* Position Detection Patterns - Bottom Left */}
        <rect x="6" y="84" width="30" height="30" fill="#000000" />
        <rect x="10" y="88" width="22" height="22" fill="#ffffff" />
        <rect x="14" y="92" width="14" height="14" fill="#000000" />

        {/* Timing Patterns */}
        <g fill="#000000">
          <rect x="40" y="18" width="4" height="4" />
          <rect x="48" y="18" width="4" height="4" />
          <rect x="56" y="18" width="4" height="4" />
          <rect x="64" y="18" width="4" height="4" />
          <rect x="72" y="18" width="4" height="4" />

          <rect x="18" y="40" width="4" height="4" />
          <rect x="18" y="48" width="4" height="4" />
          <rect x="18" y="56" width="4" height="4" />
          <rect x="18" y="64" width="4" height="4" />
          <rect x="18" y="72" width="4" height="4" />
        </g>

        {/* Authentic Data Matrix Modules */}
        <g fill="#000000">
          <rect x="42" y="8" width="5" height="5" />
          <rect x="52" y="8" width="5" height="5" />
          <rect x="62" y="8" width="5" height="5" />
          <rect x="72" y="8" width="5" height="5" />
          <rect x="46" y="24" width="5" height="5" />
          <rect x="68" y="24" width="5" height="5" />
          <rect x="56" y="28" width="5" height="5" />

          <rect x="8" y="42" width="5" height="5" />
          <rect x="8" y="52" width="5" height="5" />
          <rect x="8" y="62" width="5" height="5" />
          <rect x="8" y="72" width="5" height="5" />
          <rect x="24" y="46" width="5" height="5" />
          <rect x="24" y="68" width="5" height="5" />
          <rect x="28" y="56" width="5" height="5" />

          <rect x="88" y="42" width="5" height="5" />
          <rect x="98" y="42" width="5" height="5" />
          <rect x="108" y="42" width="5" height="5" />
          <rect x="88" y="52" width="5" height="5" />
          <rect x="108" y="52" width="5" height="5" />
          <rect x="92" y="62" width="5" height="5" />
          <rect x="102" y="62" width="5" height="5" />
          <rect x="88" y="72" width="5" height="5" />
          <rect x="98" y="72" width="5" height="5" />
          <rect x="108" y="72" width="5" height="5" />

          <rect x="44" y="86" width="5" height="5" />
          <rect x="54" y="86" width="5" height="5" />
          <rect x="64" y="86" width="5" height="5" />
          <rect x="74" y="86" width="5" height="5" />
          <rect x="88" y="86" width="5" height="5" />
          <rect x="98" y="86" width="5" height="5" />
          <rect x="108" y="86" width="5" height="5" />

          <rect x="44" y="96" width="5" height="5" />
          <rect x="64" y="96" width="5" height="5" />
          <rect x="84" y="96" width="5" height="5" />
          <rect x="104" y="96" width="5" height="5" />

          <rect x="52" y="106" width="5" height="5" />
          <rect x="72" y="106" width="5" height="5" />
          <rect x="92" y="106" width="5" height="5" />
          <rect x="102" y="106" width="5" height="5" />
        </g>

        {/* Center BSrE Emblem Background */}
        <circle cx="60" cy="60" r="19" fill="#ffffff" />
        <circle cx="60" cy="60" r="17.5" fill="#0070ba" />

        {/* BSrE Flower / Rosette Dots Motif */}
        <circle cx="60" cy="60" r="3.2" fill="#ffffff" />
        <circle cx="60" cy="51.5" r="2.2" fill="#ffffff" />
        <circle cx="60" cy="68.5" r="2.2" fill="#ffffff" />
        <circle cx="51.5" cy="60" r="2.2" fill="#ffffff" />
        <circle cx="68.5" cy="60" r="2.2" fill="#ffffff" />
        <circle cx="54" cy="54" r="2" fill="#ffffff" />
        <circle cx="66" cy="54" r="2" fill="#ffffff" />
        <circle cx="54" cy="66" r="2" fill="#ffffff" />
        <circle cx="66" cy="66" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
};

interface SuratPreviewProps {
  form: SuratTugasFormState;
  selectedPegawai: Pegawai[];
  selectedPejabat: Pejabat;
  onDownloadPdf: () => void;
  onDownloadDocx?: () => void;
  isGeneratingPdf?: boolean;
  onSaveToDatabase: () => void;
  isSaved: boolean;
  onUpdateForm?: (updated: Partial<SuratTugasFormState>) => void;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onResetIsiPembuatan?: () => void;
  onGenerateGeneralTemplate?: () => void;
  onOpenAiScanner?: () => void;
}

/**
 * Render preview surat tugas resmi Pusaka Komdigi.
 * - Format: A4 (794 x 1123 px standard 96 DPI).
 * - Muat tepat 1 halaman untuk 1-3 pegawai dengan penskalaan dinamis & padding adaptif.
 * - Teks narasi (Menimbang, Dasar, Untuk, Penutup) dapat langsung diedit (contentEditable).
 */
export const SuratPreview: React.FC<SuratPreviewProps> = ({
  form,
  selectedPegawai,
  selectedPejabat,
  onDownloadPdf,
  onDownloadDocx,
  isGeneratingPdf = false,
  onSaveToDatabase,
  isSaved,
  onUpdateForm,
  isEditMode = false,
  onCancelEdit,
  onResetIsiPembuatan,
  onGenerateGeneralTemplate,
  onOpenAiScanner,
}) => {
  const count = selectedPegawai.length;
  const isTugas = !form.jenis_naskah || form.jenis_naskah === 'TUGAS';
  const isLampiran = isTugas && count > 3;

  const isNotaDinas = form.jenis_naskah === 'NOTA_DINAS';
  const notaSplit = useMemo(() => {
    return isNotaDinas
      ? splitNotaDinasPages(form.nota_isi || '', form.nota_pembuka, form.nota_penutup)
      : { page1Lines: [], page2Lines: [], pages: [], isMultiPage: false };
  }, [isNotaDinas, form.nota_isi, form.nota_pembuka, form.nota_penutup]);

  const isUndangan = form.jenis_naskah === 'UNDANGAN';
  const undanganSplit = useMemo(() => {
    return isUndangan
      ? splitSuratUndanganPages(
          form.undangan_agenda || '',
          form.undangan_kepada,
          form.undangan_pembuka,
          form.undangan_penutup
        )
      : { page1AgendaLines: [], page2AgendaLines: [], isMultiPage: false };
  }, [isUndangan, form.undangan_agenda, form.undangan_kepada, form.undangan_pembuka, form.undangan_penutup]);

  const notaPages: string[][] =
    notaSplit.pages && notaSplit.pages.length > 0 ? notaSplit.pages : [notaSplit.page1Lines];
  const notaPageStarts = notaPages.map((_, i) =>
    notaPages.slice(0, i).reduce((a, pg) => a + visibleLength(pg), 0)
  );
  const notaHasManualBreak = /^\s*(?:---|===|\[halaman baru\]|\[pagebreak\])\s*$/im.test(form.nota_isi || '');
  const joinNotaLinesSmart = (lines: string[]): string => {
    const cleaned = lines.filter((l) => l.trim() !== '');
    if (cleaned.length === 0) return '';
    let result = cleaned[0];
    for (let i = 1; i < cleaned.length; i++) {
      const prev = cleaned[i - 1].trim();
      const curr = cleaned[i].trim();
      const bothKv = isNotaKeyValueLine(prev) && isNotaKeyValueLine(curr);
      const currIsSub = /^([a-zA-Z][\.\)]|\([0-9a-zA-Z]\)|[\-\*•])\s+/.test(curr);
      result += (bothKv || currIsSub ? '\n' : '\n\n') + cleaned[i];
    }
    return result;
  };
  const commitNotaPage = (idx: number, v: string) => {
    const pages = notaPages.map((pg) => [...pg]);
    pages[idx] = v.split('\n');
    const clean = (pg: string[]) => pg.filter((l) => l.trim() !== '');
    const body = notaHasManualBreak
      ? pages.map((pg) => joinNotaLinesSmart(clean(pg))).join('\n\n---\n\n')
      : joinNotaLinesSmart(pages.flatMap(clean));
    onUpdateForm?.({ nota_isi: body, nota_pembuka: '', nota_penutup: '' });
  };

  const renderNotaLine = (line: string, idx: number) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} style={{ height: '6px' }} />;
    }
    const isMainNum = /^\d+[\.\)]\s+/.test(trimmed);
    const isSubPoint = /^([a-zA-Z][\.\)]|\([0-9a-zA-Z]\))\s+/.test(trimmed);
    const isDash = /^[\-\*•]\s+/.test(trimmed);
    const isNormalText = !isMainNum && !isSubPoint && !isDash;

    return (
      <div
        key={idx}
        style={{
          marginTop: isMainNum ? '8px' : isNormalText ? '6px' : '2px',
          marginBottom: isMainNum ? '4px' : isNormalText ? '6px' : '3px',
          paddingLeft: isSubPoint ? '38px' : isDash ? '34px' : isMainNum ? '24px' : '0',
          textIndent: isSubPoint ? '-18px' : isDash ? '-16px' : isMainNum ? '-24px' : isNormalText ? '32px' : '0',
          lineHeight: '1.5',
          textAlign: 'justify',
          fontWeight: isMainNum && trimmed.length < 60 ? '600' : 'normal',
        }}
      >
        {trimmed}
      </div>
    );
  };

  const tglSuratFormatted = form.tanggal_surat ? formatTanggalIndonesia(form.tanggal_surat) : '';
  const tglMulaiFormatted = form.tanggal_mulai ? formatTanggalIndonesia(form.tanggal_mulai) : '';
  const tglSelesaiFormatted = form.tanggal_selesai ? formatTanggalIndonesia(form.tanggal_selesai) : '';
  const rentangTanggal =
    !form.tanggal_mulai && !form.tanggal_selesai
      ? ''
      : form.tanggal_mulai === form.tanggal_selesai
      ? tglMulaiFormatted
      : `${tglMulaiFormatted} s.d. ${tglSelesaiFormatted}`;

  const defaultDasar =
    form.instansi_pengundang || form.nomor_surat_undangan
      ? form.instansi_pengundang
        ? `${form.instansi_pengundang} Nomor : ${form.nomor_surat_undangan || '-'}${
            form.tanggal_surat_undangan
              ? ' tanggal ' + formatTanggalIndonesia(form.tanggal_surat_undangan)
              : ''
          }.`
        : `Nomor ${form.nomor_surat_undangan}.`
      : '';

  const defaultMenimbang = form.nama_acara
    ? `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${form.nama_acara}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`
    : '';

  const defaultUntuk =
    form.nama_acara || form.lokasi_kegiatan || form.tanggal_mulai
      ? `Mengikuti kegiatan ${form.nama_acara || '...'} yang dilaksanakan pada ${rentangTanggal || '...'} di ${form.lokasi_kegiatan || '...'}${
          form.kota_kegiatan ? ', ' + form.kota_kegiatan : ''
        }.`
      : '';

  const sertakanBeban = form.sertakan_beban_anggaran !== false;
  const pembebanan =
    form.pembebanan_anggaran ||
    'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026';
  const defaultPenutup = sertakanBeban
    ? `Biaya yang timbul akibat Surat Tugas ini dibebankan pada ${pembebanan} sesuai ketentuan yang berlaku.`
    : '';

  const menimbangText = form.menimbang_custom !== undefined ? form.menimbang_custom : defaultMenimbang;
  const dasarText = form.dasar_custom !== undefined ? form.dasar_custom : defaultDasar;
  const untukText = form.untuk_custom !== undefined ? form.untuk_custom : defaultUntuk;
  const penutupText = form.penutup_custom !== undefined ? form.penutup_custom : defaultPenutup;
  const jabatanTTD = selectedPejabat.is_default
    ? `${selectedPejabat.jabatan},`
    : `Plh. ${selectedPejabat.jabatan},`;

  const tugasSplit = useMemo(() => {
    if (!isTugas || isLampiran) {
      return { page1UntukLines: [untukText || ''], page2UntukLines: [], isMultiPage: false };
    }
    return splitSuratTugasPages(untukText || '', menimbangText || '', dasarText || '', count);
  }, [isTugas, isLampiran, count, dasarText, menimbangText, untukText]);

  const isTugasMultiPage = tugasSplit.isMultiPage;

  const isMultiPageDoc =
    isLampiran ||
    (isNotaDinas && notaSplit.isMultiPage) ||
    (isUndangan && undanganSplit.isMultiPage) ||
    isTugasMultiPage;

  // ─── Penskalaan Adaptif 1 Halaman A4 (Font Isi Tetap 12pt Sesuai Ketentuan) ───
  // Ruang tanda tangan manual diperlebar dan dipertinggi agar sangat leluasa untuk ttd basah & cap dinas
  // Ruang bawah disisakan 2 cm (80px) untuk stempel/catatan UU ITE & Sertifikat Elektronik
  const bodyFontSize = '12pt';
  let bodyLineHeight = '1.28';
  let pagePadding = '24px 72px 80px 82px';
  let sectionMargin = '5px';
  let pegawaiGap = '6px';
  let ttdMargin = '16px';
  let ttdImgHeight = '115px';
  let employeeInnerLineHeight = '1.22';

  if (isTugas && !isLampiran) {
    if (count === 2) {
      pagePadding = '22px 70px 80px 80px';
      bodyLineHeight = '1.24';
      sectionMargin = '4.5px';
      pegawaiGap = '4px';
      ttdMargin = '14px';
      ttdImgHeight = '105px';
      employeeInnerLineHeight = '1.2';
    } else if (count === 3) {
      pagePadding = '18px 68px 80px 78px';
      bodyLineHeight = '1.2';
      sectionMargin = '3.5px';
      pegawaiGap = '3px';
      ttdMargin = '10px';
      ttdImgHeight = '95px';
      employeeInnerLineHeight = '1.16';
    }
  }

  const baseStyle: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontSize: bodyFontSize,
    lineHeight: bodyLineHeight,
    color: '#000',
  };

  const LABEL_W = '84px';
  const COLON_W = '16px';

  const handleResetNarasi = () => {
    if (confirm('Kembalikan narasi Menimbang, Dasar, Untuk, dan Penutup ke format standar otomatis?')) {
      onUpdateForm?.({
        menimbang_custom: undefined,
        dasar_custom: undefined,
        untuk_custom: undefined,
        penutup_custom: undefined,
      });
    }
  };

  const hasCustomNarasi =
    form.menimbang_custom !== undefined ||
    form.dasar_custom !== undefined ||
    form.untuk_custom !== undefined ||
    form.penutup_custom !== undefined;

  // ─── Referensi & State Skala Fit Dokumen ───────────────────────
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number>(1);
  const [docHeight, setDocHeight] = useState<number>(1123);

  useEffect(() => {
    const updateDimensions = () => {
      if (docRef.current) {
        const h = docRef.current.offsetHeight;
        if (h && h > 100) {
          setDocHeight(h);
        }
      }
      if (previewContainerRef.current) {
        const containerW = previewContainerRef.current.clientWidth;
        // Padding horizontal (16px kiri + 16px kanan) + margin scrollbar aman = ~36px
        const availableW = containerW - 36;
        if (availableW > 0) {
          const calculatedScale = Math.min(1, Math.max(0.35, availableW / 794));
          setFitScale(calculatedScale);
        }
      }
    };

    updateDimensions();

    const containerEl = previewContainerRef.current;
    const docEl = docRef.current;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window && containerEl) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerEl);
      if (docEl) {
        resizeObserver.observe(docEl);
      }
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [
    form.jenis_naskah,
    selectedPegawai.length,
    form.nota_isi,
    form.undangan_agenda,
    isMultiPageDoc,
  ]);

  const activeScale = fitScale;
  const isScaled = activeScale < 0.999;

  return (
    <div className="flex flex-col space-y-2.5 h-[calc(100vh-120px)] print:h-auto print:block print:space-y-0">
      {/* ─── BILAH TOMBOL & INFO (NON-SCROLLABLE / TETAP DI ATAS) ─────── */}
      <div className="action-bar-print-hide shrink-0 space-y-2">
        {/* ─── Action Bar ─────────────────────────────────────────── */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
          {isEditMode && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              title="Batalkan pengeditan dan kembali ke formulir surat baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
          {/* Tombol Reset Isi & Tamplate General — tampil untuk semua jenis naskah */}
          {(onResetIsiPembuatan || onGenerateGeneralTemplate) && (
            <>
              <div className="w-px h-5 bg-slate-200" />
              {onResetIsiPembuatan && (
                <button
                  type="button"
                  onClick={onResetIsiPembuatan}
                  className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    form.jenis_naskah === 'NOTA_DINAS'
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : form.jenis_naskah === 'UNDANGAN'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                  }`}
                  title="Hapus semua isi form untuk memulai dari awal"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Isi</span>
                </button>
              )}
              {onGenerateGeneralTemplate && (
                <button
                  type="button"
                  onClick={onGenerateGeneralTemplate}
                  className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    form.jenis_naskah === 'NOTA_DINAS'
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : form.jenis_naskah === 'UNDANGAN'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                  }`}
                  title="Isi otomatis dengan tamplate general sesuai jenis surat"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tamplate general</span>
                </button>
              )}
              <div className="w-px h-5 bg-slate-200" />
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Cetak langsung ke printer atau Simpan sebagai PDF dari browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Unduh dokumen langsung dalam format file PDF resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
          </button>
          {onDownloadDocx && (
            <button
              onClick={onDownloadDocx}
              className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
              title="Unduh dokumen dalam format Microsoft Word (.docx)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>
          )}
          <button
            onClick={onSaveToDatabase}
            disabled={isSaved}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer ${
              isSaved
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isEditMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              {isSaved
                ? isEditMode
                  ? 'Perubahan Tersimpan'
                  : 'Tersimpan di Sheets'
                : isEditMode
                ? 'Perbarui Surat'
                : 'Terbitkan & Simpan'}
            </span>
          </button>
        </div>

        {/* Tombol Fitur Pindai AI — diletakkan paling kanan dengan jarak pemisah untuk Surat Tugas & Nota Dinas */}
        {onOpenAiScanner && (isTugas || isNotaDinas) && (
          <div className="flex items-center pl-3 ml-auto border-l border-slate-200">
            <button
              type="button"
              onClick={onOpenAiScanner}
              className={`flex items-center space-x-1.5 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-xs transition-all cursor-pointer ${
                isNotaDinas
                  ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800'
              }`}
              title={
                isNotaDinas
                  ? 'Pindai dokumen laporan atau ketik prompt AI untuk menyusun Nota Dinas otomatis'
                  : 'Pindai surat undangan atau ketik prompt AI untuk menyusun Surat Tugas otomatis'
              }
            >
              <Sparkles className={`w-3.5 h-3.5 ${isNotaDinas ? 'text-indigo-200' : 'text-teal-300'}`} />
              <span>{isNotaDinas ? 'Pindai Laporan / Telaah (AI)' : 'Pindai Undangan (AI)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner Mode Edit Dokumen */}
      {isEditMode && (
        <div className="action-bar-print-hide flex items-center justify-between bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-lg text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-800 uppercase tracking-wide">✏️ Mode Edit:</span>
            <span>
              Anda sedang mengedit naskah <strong>{form.nomor_lengkap}</strong>. Nomor urut surat tetap dipertahankan.
            </span>
          </div>
          {onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline ml-2 cursor-pointer"
            >
              Kembali ke Surat Baru
            </button>
          )}
        </div>
      )}

        {/* Petunjuk Edit Langsung — disesuaikan per jenis naskah */}
        <div className={`flex items-center space-x-1.5 text-[11px] px-3 py-1.5 rounded border ${
          isNotaDinas
            ? 'text-indigo-800 bg-indigo-50/80 border-indigo-200'
            : isUndangan
            ? 'text-amber-800 bg-amber-50/80 border-amber-200'
            : 'text-teal-800 bg-teal-50/80 border-teal-200'
        }`}>
          <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isNotaDinas ? 'text-indigo-600' : isUndangan ? 'text-amber-600' : 'text-teal-600'}`} />
          <span>
            {isNotaDinas ? (
              <><strong>Edit Langsung:</strong> Klik teks <em>Kepada Yth.</em>, <em>Dari</em>, <em>Hal</em>, <em>Isi</em>, dan <em>Penutup</em> pada lembar pratinjau untuk mengedit langsung.</>
            ) : isUndangan ? (
              <><strong>Edit Langsung:</strong> Klik teks <em>Kepada Yth.</em>, <em>Pembuka</em>, <em>Agenda</em>, dan <em>Penutup</em> pada lembar pratinjau untuk mengedit langsung.</>
            ) : (
              <><strong>Edit Langsung:</strong> Klik teks <em>Menimbang</em>, <em>Dasar</em>, <em>Untuk</em>, dan <em>Penutup</em> pada lembar pratinjau untuk mengedit langsung.</>
            )}
          </span>
        </div>
      </div>

      {/* ─── AREA PREVIEW DOKUMEN (HANYA INI YANG SCROLLABLE VERTIKAL & AUTO-FIT) ─── */}
      <div
        ref={previewContainerRef}
        className="preview-scroll-container flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-slate-200/70 rounded-xl border border-slate-300/80 custom-scrollbar flex flex-col items-center"
      >
        <div
          className="preview-doc-wrapper print:block print:w-full print:m-0"
          style={{
            width: isScaled ? `${Math.round(794 * activeScale)}px` : '794px',
            height: isScaled ? `${Math.round(docHeight * activeScale)}px` : 'auto',
            position: 'relative',
            transition: 'width 0.12s ease-out, height 0.12s ease-out',
          }}
        >
          <div
            className="preview-doc-inner print:block print:w-full print:m-0"
            style={{
              width: '794px',
              transform: isScaled ? `scale(${activeScale})` : 'none',
              transformOrigin: 'top left',
              position: isScaled ? 'absolute' : 'relative',
              top: 0,
              left: 0,
            }}
          >
            {/* ═══════════════════════════════════════════════════════
                AREA CETAK & DOKUMEN RESMI (A4)
            ══════════════════════════════════════════════════════ */}
            <div id="surat-tugas-document" ref={docRef}>
        {/* ── HALAMAN 1 (SURAT / NOTA DINAS) ──────────────────────────── */}
        <div
          className={`print-page bg-white shadow-md mx-auto print:shadow-none print:border-none ${
            isMultiPageDoc ? 'is-lampiran' : 'single-page-locked'
          }`}
          style={{
            ...baseStyle,
            width: '794px',
            height: isMultiPageDoc ? 'auto' : '1123px',
            maxHeight: isMultiPageDoc ? 'none' : '1123px',
            minHeight: '1123px',
            overflow: isMultiPageDoc ? 'visible' : 'hidden',
            padding: pagePadding,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* ── KOP SURAT RESMI KOMDIGI ──────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '5px' }}>
            <img
              src="/komdigi_logo.png"
              alt="Logo Komdigi"
              style={{
                width: count === 3 ? '124px' : '134px',
                height: 'auto',
                display: 'block',
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: count === 3 ? '14pt' : '15pt',
                  lineHeight: '1.2',
                  color: '#000',
                  letterSpacing: '0.01em',
                }}
              >
                KEMENTERIAN KOMUNIKASI DAN DIGITAL RI
              </div>
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: count === 3 ? '14pt' : '15pt',
                  lineHeight: '1.2',
                  color: '#000',
                }}
              >
                SEKRETARIAT JENDERAL
              </div>
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: count === 3 ? '13.5pt' : '14.5pt',
                  lineHeight: '1.2',
                  color: '#000',
                }}
              >
                PUSAT KEBIJAKAN STRATEGIS
              </div>
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: count === 3 ? '8.2pt' : '8.6pt',
                  lineHeight: '1.3',
                  marginTop: '3px',
                  color: '#000',
                }}
              >
                Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735{' '}
                <span style={{ textDecoration: 'underline' }}>www.komdigi.go.id</span>
              </div>
            </div>
          </div>

          {/* Garis pemisah kop — garis ganda resmi */}
          <div style={{ borderBottom: '2.5px solid #000', marginBottom: '1.5px' }} />
          <div style={{ borderBottom: '0.75px solid #000', marginBottom: count === 3 ? '12px' : '16px' }} />

          {/* ═════════════════════════════════════════════════════════
              CABANG 1: SURAT UNDANGAN
          ══════════════════════════════════════════════════════════ */}
          {form.jenis_naskah === 'UNDANGAN' ? (
            <div style={{ fontSize: bodyFontSize, lineHeight: '1.45' }}>
              {/* Header 2 Kolom: Kiri (Nomor/Sifat/Lampiran/Hal), Kanan (Jakarta, Tanggal) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '60%' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Nomor</div>
                    <div style={{ width: '14px', textAlign: 'center' }}>:</div>
                    <div style={{ flex: 1, fontWeight: '500' }}>{form.nomor_lengkap}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Sifat</div>
                    <div style={{ width: '14px', textAlign: 'center' }}>:</div>
                    <div style={{ flex: 1 }}>{form.undangan_sifat || 'Biasa'}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Lampiran</div>
                    <div style={{ width: '14px', textAlign: 'center' }}>:</div>
                    <div style={{ flex: 1 }}>{form.undangan_lampiran || '-'}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Hal</div>
                    <div style={{ width: '14px', textAlign: 'center' }}>:</div>
                    <div style={{ flex: 1, fontWeight: '500' }}>
                      {form.undangan_hal || (
                        <span className="text-slate-300 italic no-print select-none" style={{ fontWeight: 'normal' }}>
                          (Belum ada perihal undangan &mdash; isi perihal pada formulir atau gunakan Pindai Acara AI)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', width: '38%' }}>
                  <div>{form.kota_surat || 'Jakarta'}, {tglSuratFormatted}</div>
                </div>
              </div>

              {/* Penerima / Kepada Yth */}
              <div style={{ marginBottom: '14px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '3px' }}>Kepada Yth.</div>
                <RichEditable
                  rich={false}
                  value={form.undangan_kepada || ''}
                  onCommit={(v) => onUpdateForm?.({ undangan_kepada: v })}
                  placeholder="(Belum ada penerima undangan — ketik nama pejabat/instansi atau gunakan Lampiran Daftar Undangan)"
                  title="Klik untuk mengedit penerima undangan"
                  style={{ lineHeight: '1.4' }}
                />
              </div>

              {/* Paragraf Pembuka */}
              <div style={{ marginBottom: '14px' }}>
                <RichEditable
                  value={form.undangan_pembuka || ''}
                  onCommit={(v) => onUpdateForm?.({ undangan_pembuka: v })}
                  placeholder="(Paragraf pembuka belum diisi — ketik pembuka surat undangan pada formulir atau langsung di sini)"
                  title="Klik untuk mengedit narasi pembuka undangan"
                  style={{ textAlign: 'justify', lineHeight: '1.5', textIndent: '32px' }}
                />
              </div>

              {/* Rincian Acara */}
              <div style={{ margin: '10px 0 14px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Hari, Tanggal</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1, fontWeight: '500' }}>
                    {form.undangan_hari_tanggal || form.hari_tanggal_pelaksanaan || tglSuratFormatted || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Waktu</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>{form.undangan_waktu || form.waktu_kegiatan || '-'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Tempat</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>
                    {form.undangan_tipe_tempat === 'online' ? (
                      <div>
                        <em>online</em> via tautan{' '}
                        {form.undangan_tempat_online ? (
                          <a href={form.undangan_tempat_online} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {form.undangan_tempat_online}
                          </a>
                        ) : (
                          '-'
                        )}
                      </div>
                    ) : form.undangan_tipe_tempat === 'hybrid' ? (
                      <div>
                        <div>
                          <em>online</em> via tautan{' '}
                          <span className="text-blue-600 underline">{form.undangan_tempat_online || '-'}</span>
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <em>offline</em> di {form.undangan_tempat_offline || form.lokasi_kegiatan || '-'}
                        </div>
                      </div>
                    ) : (
                      <div>{form.undangan_tempat_offline || form.lokasi_kegiatan || '-'}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Agenda</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1, fontWeight: '500' }}>
                    <RichEditable
                      groupId="undangan-agenda"
                      groupStart={0}
                      value={
                        undanganSplit.isMultiPage
                          ? undanganSplit.page1AgendaLines.join('\n')
                          : form.undangan_agenda || ''
                      }
                      onCommit={(v) => {
                        if (undanganSplit.isMultiPage) {
                          const combined = [v, ...undanganSplit.page2AgendaLines]
                            .filter((s) => s.trim() !== '')
                            .join('\n');
                          onUpdateForm?.({ undangan_agenda: combined });
                        } else {
                          onUpdateForm?.({ undangan_agenda: v });
                        }
                      }}
                      placeholder="(Belum ada agenda pembahasan — ketik rincian agenda pada formulir atau langsung di sini)"
                      title="Klik untuk mengedit agenda pembahasan"
                      style={{ lineHeight: '1.45' }}
                    />
                  </div>
                </div>
              </div>

              {/* Jika Multi-Halaman: Tampilkan penanda bersambung di kanan bawah Halaman 1 */}
              {undanganSplit.isMultiPage && (
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b', marginTop: '16px', fontStyle: 'italic' }}>
                  (bersambung ke halaman 2)
                </div>
              )}

              {/* Jika 1 Halaman Saja (Muat): Tampilkan Penutup & TTD di Halaman 1 */}
              {!undanganSplit.isMultiPage && (
                <>
                  {/* Paragraf Penutup */}
                  <RichEditable
                    value={form.undangan_penutup || ''}
                    onCommit={(v) => onUpdateForm?.({ undangan_penutup: v })}
                    placeholder="(Paragraf penutup belum diisi — ketik penutup surat undangan pada formulir atau langsung di sini)"
                    title="Klik untuk mengedit narasi penutup undangan"
                    style={{ textAlign: 'justify', lineHeight: '1.5', marginBottom: form.undangan_penutup ? ttdMargin : '0px', textIndent: '32px' }}
                  />

                  {/* Tanda Tangan */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                      <div style={{ fontWeight: 'bold' }}>{selectedPejabat.nama}</div>
                    </div>
                  </div>

                  {/* Tembusan jika ada */}
                  {form.undangan_tembusan && (
                    <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                      <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{form.undangan_tembusan}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : form.jenis_naskah === 'NOTA_DINAS' ? (
            /* ═════════════════════════════════════════════════════════
                CABANG 2: NOTA DINAS
            ══════════════════════════════════════════════════════════ */
            <div style={{ fontSize: bodyFontSize, lineHeight: '1.45' }}>
              {/* Judul Tengah */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: bodyFontSize,
                    textDecoration: 'underline',
                    letterSpacing: '0.05em',
                  }}
                >
                  NOTA DINAS
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: bodyFontSize, marginTop: '2px' }}>
                  Nomor: {form.nomor_lengkap}
                </div>
              </div>

              {/* Tabel Atribut Nota Dinas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Kepada Yth.</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nota_kepada || ''}
                    onCommit={(v) => onUpdateForm?.({ nota_kepada: v })}
                    placeholder="(Belum ada penerima nota dinas — ketik nama/jabatan penerima pada formulir)"
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Dari</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nota_dari || ''}
                    onCommit={(v) => onUpdateForm?.({ nota_dari: v })}
                    placeholder="(Belum ada pengirim nota dinas — ketik jabatan pengirim pada formulir)"
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Hal</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nota_hal || ''}
                    onCommit={(v) => onUpdateForm?.({ nota_hal: v })}
                    placeholder="(Belum ada perihal nota dinas — ketik pokok telaah pada formulir)"
                    style={{ flex: 1, fontWeight: '500', lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Sifat</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>{form.nota_sifat || 'Biasa'}</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Lampiran</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>{form.nota_lampiran || '-'}</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Tanggal</div>
                  <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>{tglSuratFormatted}</div>
                </div>
              </div>

              {/* Garis batas tipis di bawah atribut */}
              <div style={{ borderBottom: '1px solid #000', margin: '8px 0 14px 0' }} />

              {/* Isi / Badan Surat Nota Dinas (satu kotak teks kontinu) */}
              <RichEditable
                variant="nota"
                groupId="nota-body"
                groupStart={0}
                value={(notaPages[0] || []).join('\n')}
                onCommit={(v) => commitNotaPage(0, v)}
                placeholder="(Belum ada isi nota dinas — ketik paragraf pembuka, isi, dan penutup pada formulir atau langsung di sini)"
                title="Klik untuk langsung mengedit isi badan nota dinas"
                style={{ marginBottom: '12px', minHeight: '140px' }}
              />

              {/* Jika Multi-Halaman: Tampilkan penanda bersambung di kanan bawah Halaman 1 */}
              {notaSplit.isMultiPage && (
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b', marginTop: '16px', fontStyle: 'italic' }}>
                  (bersambung ke halaman 2)
                </div>
              )}

              {/* Jika 1 Halaman Saja (Muat): Tampilkan TTD di Halaman 1 */}
              {!notaSplit.isMultiPage && (
                <>
                  {/* Tanda Tangan */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', marginTop: '16px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                      <div style={{ fontWeight: 'bold' }}>{selectedPejabat.nama}</div>
                    </div>
                  </div>

                  {/* Tembusan jika ada */}
                  {form.nota_tembusan && (
                    <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                      <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{form.nota_tembusan}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════
                CABANG 3: SURAT TUGAS (FORMAT ASLI DIJAGA PERSIS)
            ══════════════════════════════════════════════════════════ */
            <div>
              {/* ── JUDUL ──────────────────────────────────────────────── */}
              <div style={{ textAlign: 'center', marginBottom: count === 3 ? '4px' : '6px' }}>
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: bodyFontSize,
                    textDecoration: 'underline',
                    letterSpacing: '0.05em',
                  }}
                >
                  SURAT TUGAS
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: bodyFontSize, marginTop: '2px' }}>
                  Nomor: {form.nomor_lengkap}
                </div>
              </div>

              <div style={{ marginBottom: sectionMargin }} />

              {/* ── MENIMBANG ──────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: sectionMargin }}>
                <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Menimbang</div>
                <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
                <RichEditable
                  value={menimbangText || ''}
                  onCommit={(v) => onUpdateForm?.({ menimbang_custom: v })}
                  placeholder="(Belum ada redaksi Menimbang — isi nama kegiatan atau gunakan Pindai Undangan AI)"
                  title="Klik untuk langsung mengedit teks Menimbang"
                  style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight, minHeight: '20px' }}
                />
              </div>

              {/* ── DASAR ──────────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: sectionMargin }}>
                <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Dasar</div>
                <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
                <RichEditable
                  value={dasarText || ''}
                  onCommit={(v) => onUpdateForm?.({ dasar_custom: v })}
                  placeholder="(Belum ada dasar surat undangan — isi nomor/instansi undangan atau gunakan Pindai Undangan AI)"
                  title="Klik untuk langsung mengedit teks Dasar"
                  style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight, minHeight: '20px' }}
                />
              </div>

              {/* ── MEMBERI TUGAS ──────────────────────────────────────── */}
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  marginBottom: sectionMargin,
                  marginTop: sectionMargin,
                }}
              >
                MEMBERI TUGAS:
              </div>

              {/* ── KEPADA ─────────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: sectionMargin }}>
                <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Kepada</div>
                <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
                <div style={{ flex: 1, lineHeight: bodyLineHeight, minHeight: '22px' }}>
                  {count === 0 ? (
                    <div className="text-slate-400 italic no-print select-none" style={{ lineHeight: bodyLineHeight }}>
                      (Belum ada pegawai yang dipilih &mdash; silakan pilih pegawai pada daftar formulir)
                    </div>
                  ) : isLampiran ? (
                    <span>(Daftar Terlampir)</span>
                  ) : count === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        ['Nama', selectedPegawai[0].nama, true],
                        ['NIP', selectedPegawai[0].nip, false],
                        ['Pangkat, Gol/Ruang', selectedPegawai[0].pangkat_golongan, false],
                        ['Jabatan', selectedPegawai[0].jabatan, false],
                      ].map(([label, value, bold]) => (
                        <div
                          key={String(label)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            lineHeight: employeeInnerLineHeight,
                          }}
                        >
                          <div style={{ width: '156px', flexShrink: 0, whiteSpace: 'nowrap' }}>{String(label)}</div>
                          <div style={{ width: '16px', flexShrink: 0, textAlign: 'center' }}>:</div>
                          <div style={{ flex: 1, fontWeight: bold ? 'bold' : 'normal' }}>
                            {String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: pegawaiGap }}>
                      {selectedPegawai.map((peg, idx) => (
                        <div key={peg.id} style={{ display: 'flex', alignItems: 'flex-start', lineHeight: employeeInnerLineHeight }}>
                          <div style={{ width: '18px', flexShrink: 0, fontWeight: 'bold' }}>{idx + 1}.</div>
                          <div style={{ flex: 1 }}>
                            {[
                              ['Nama', peg.nama, true],
                              ['NIP', peg.nip, false],
                              ['Pangkat, Gol/Ruang', peg.pangkat_golongan, false],
                              ['Jabatan', peg.jabatan, false],
                            ].map(([label, value, bold]) => (
                              <div
                                key={String(label)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  lineHeight: employeeInnerLineHeight,
                                }}
                              >
                                <div style={{ width: '156px', flexShrink: 0, whiteSpace: 'nowrap' }}>{String(label)}</div>
                                <div style={{ width: '16px', flexShrink: 0, textAlign: 'center' }}>:</div>
                                <div style={{ flex: 1, fontWeight: bold ? 'bold' : 'normal' }}>
                                  {String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── UNTUK ──────────────────────────────────────────────── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: sectionMargin,
                  marginTop: isLampiran ? '2px' : '4px',
                }}
              >
                <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Untuk</div>
                <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
                <RichEditable
                  groupId="tugas-untuk"
                  groupStart={0}
                  value={isTugasMultiPage ? tugasSplit.page1UntukLines.join('\n') : untukText || ''}
                  onCommit={(v) => {
                    if (isTugasMultiPage && tugasSplit.page2UntukLines.length > 0) {
                      const combined = [v, ...tugasSplit.page2UntukLines]
                        .filter((s) => s.trim() !== '')
                        .join('\n');
                      onUpdateForm?.({ untuk_custom: combined });
                    } else {
                      onUpdateForm?.({ untuk_custom: v });
                    }
                  }}
                  placeholder="(Belum ada diktum Untuk — isi kegiatan, waktu, dan lokasi pelaksanaan)"
                  title="Klik untuk langsung mengedit teks Untuk"
                  style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight, minHeight: '20px' }}
                />
              </div>

              {/* Jika Multi-Halaman pada Surat Tugas: Tampilkan penanda bersambung di kanan bawah Halaman 1 */}
              {isTugasMultiPage && (
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b', marginTop: '16px', fontStyle: 'italic' }}>
                  (bersambung ke halaman 2)
                </div>
              )}

              {/* Jika 1 Halaman: Tampilkan Penutup & TTD di Halaman 1 */}
              {!isTugasMultiPage && (
                <>
                  {/* ── PENUTUP ────────────────────────────────────────────── */}
                  {penutupText && penutupText.trim() ? (
                    <RichEditable
                      value={penutupText}
                      onCommit={(v) => onUpdateForm?.({ penutup_custom: v })}
                      title="Klik untuk langsung mengedit klausul pembebanan anggaran"
                      style={{ textAlign: 'justify', lineHeight: bodyLineHeight, marginBottom: '3px' }}
                    />
                  ) : null}
                  <div
                    style={{
                      textAlign: 'justify',
                      lineHeight: bodyLineHeight,
                      marginBottom: ttdMargin,
                    }}
                  >
                    Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.
                  </div>

                  {/* ── TANDA TANGAN ───────────────────────────────────────── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <div>{form.kota_surat || 'Jakarta'}, {tglSuratFormatted}</div>
                      <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>

                      {/* Space kosong lebar dan tinggi untuk tanda tangan manual */}
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />

                      <div style={{ fontWeight: 'bold' }}>
                        {selectedPejabat.nama}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── HALAMAN LANJUTAN — NOTA DINAS (Halaman 2, 3, dst.) ── */}
        {isNotaDinas && notaSplit.isMultiPage && (
          (notaSplit.pages && notaSplit.pages.length > 1 ? notaSplit.pages.slice(1) : [notaSplit.page2Lines]).map((pageLines, pageIdx, arr) => {
            const pageNum = pageIdx + 2;
            const isLastPage = pageIdx === arr.length - 1;

            return (
              <div
                key={`nota-page-${pageNum}`}
                className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
                style={{
                  ...baseStyle,
                  width: '794px',
                  minHeight: '1123px',
                  height: '1123px',
                  maxHeight: '1123px',
                  overflow: 'hidden',
                  padding: pagePadding,
                  boxSizing: 'border-box',
                  position: 'relative',
                  marginTop: '24px',
                }}
              >
                {/* Header Nomor Halaman Resmi Tata Naskah Dinas */}
                <div style={{ textAlign: 'center', fontSize: '11pt', color: '#000', marginBottom: '20px', fontWeight: 'bold' }}>
                  - {pageNum} -
                </div>

                {/* Lanjutan isi nota dinas */}
                <RichEditable
                  variant="nota"
                  groupId="nota-body"
                  groupStart={notaPageStarts[pageIdx + 1] || 0}
                  value={pageLines.join('\n')}
                  onCommit={(v) => commitNotaPage(pageIdx + 1, v)}
                  title="Klik untuk mengedit isi nota dinas"
                  style={{ marginBottom: '14px' }}
                />

                {/* Jika belum halaman terakhir, tampilkan bersambung ke halaman berikutnya */}
                {!isLastPage && (
                  <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b', marginTop: '16px', marginBottom: '16px', fontStyle: 'italic' }}>
                    (bersambung ke halaman {pageNum + 1})
                  </div>
                )}

                {/* Jika halaman terakhir: Tampilkan Tanda Tangan dan Tembusan tepat setelah paragraf penutup */}
                {isLastPage && (
                  <>
                    {/* Tanda Tangan */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', marginTop: '22px' }}>
                      <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                        <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>
                        <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                        <div style={{ fontWeight: 'bold' }}>{selectedPejabat.nama}</div>
                      </div>
                    </div>

                    {/* Tembusan jika ada */}
                    {form.nota_tembusan && (
                      <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                        <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                        <div style={{ whiteSpace: 'pre-line' }}>{form.nota_tembusan}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* ── HALAMAN 2 — SURAT UNDANGAN (Lanjutan Agenda, Penutup & Tanda Tangan) ── */}
        {isUndangan && undanganSplit.isMultiPage && (
          <div
            className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
            style={{
              ...baseStyle,
              width: '794px',
              minHeight: '1123px',
              height: '1123px',
              maxHeight: '1123px',
              overflow: 'hidden',
              padding: pagePadding,
              boxSizing: 'border-box',
              position: 'relative',
              marginTop: '24px',
            }}
          >
            {/* Header Nomor Halaman Resmi Tata Naskah Dinas */}
            <div style={{ textAlign: 'center', fontSize: '11pt', color: '#000', marginBottom: '22px', fontWeight: 'bold' }}>
              - 2 -
            </div>

            {/* Lanjutan Agenda */}
            {undanganSplit.page2AgendaLines.length > 0 && (
              <div style={{ marginBottom: '18px', lineHeight: '1.55' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Lanjutan Rincian Agenda &amp; Pembahasan:</div>
                <RichEditable
                  groupId="undangan-agenda"
                  groupStart={visibleLength(undanganSplit.page1AgendaLines)}
                  value={undanganSplit.page2AgendaLines.join('\n')}
                  onCommit={(v) =>
                    onUpdateForm?.({
                      undangan_agenda: [...undanganSplit.page1AgendaLines, v]
                        .filter((s) => s.trim() !== '')
                        .join('\n'),
                    })
                  }
                  style={{ textAlign: 'justify' }}
                />
              </div>
            )}

            {/* Paragraf Penutup */}
            <RichEditable
              value={form.undangan_penutup || 'Demikian kami sampaikan, atas perhatian dan kehadirannya diucapkan terima kasih.'}
              onCommit={(v) => onUpdateForm?.({ undangan_penutup: v })}
              title="Klik untuk mengedit narasi penutup undangan"
              style={{ textAlign: 'justify', lineHeight: '1.5', marginBottom: ttdMargin, textIndent: '32px' }}
            />

            {/* Tanda Tangan */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>
                <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                <div style={{ fontWeight: 'bold' }}>{selectedPejabat.nama}</div>
              </div>
            </div>

            {/* Tembusan jika ada */}
            {form.undangan_tembusan && (
              <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                <div style={{ whiteSpace: 'pre-line' }}>{form.undangan_tembusan}</div>
              </div>
            )}
          </div>
        )}

        {/* ── HALAMAN 2 — SURAT TUGAS (Lanjutan Untuk, Penutup & Tanda Tangan jika Diktum Panjang) ── */}
        {isTugas && isTugasMultiPage && (
          <div
            className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
            style={{
              ...baseStyle,
              width: '794px',
              minHeight: '1123px',
              height: '1123px',
              maxHeight: '1123px',
              overflow: 'hidden',
              padding: pagePadding,
              boxSizing: 'border-box',
              position: 'relative',
              marginTop: '24px',
            }}
          >
            <div style={{ textAlign: 'center', fontSize: '11pt', color: '#000', marginBottom: '22px', fontWeight: 'bold' }}>
              - 2 -
            </div>

            {/* Lanjutan Diktum Untuk jika meluber dari Halaman 1 */}
            {tugasSplit.page2UntukLines.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: LABEL_W, flexShrink: 0 }} />
                <div style={{ width: COLON_W, flexShrink: 0 }} />
                <RichEditable
                  groupId="tugas-untuk"
                  groupStart={visibleLength(tugasSplit.page1UntukLines)}
                  value={tugasSplit.page2UntukLines.join('\n')}
                  onCommit={(v) => {
                    const combined = [...tugasSplit.page1UntukLines, v]
                      .filter((s) => s.trim() !== '')
                      .join('\n');
                    onUpdateForm?.({ untuk_custom: combined });
                  }}
                  title="Klik untuk mengedit lanjutan diktum Untuk"
                  style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight }}
                />
              </div>
            )}

            {/* Paragraf Penutup Pembebanan Anggaran */}
            {penutupText && penutupText.trim() ? (
                    <RichEditable
                      value={penutupText}
                      onCommit={(v) => onUpdateForm?.({ penutup_custom: v })}
                      title="Klik untuk langsung mengedit klausul pembebanan anggaran"
                      style={{ textAlign: 'justify', lineHeight: bodyLineHeight, marginBottom: '10px' }}
                    />
                  ) : null}
            <div
              style={{
                textAlign: 'justify',
                lineHeight: bodyLineHeight,
                marginBottom: ttdMargin,
              }}
            >
              Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.
            </div>

            {/* Tanda Tangan */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                <div>{form.kota_surat || 'Jakarta'}, {tglSuratFormatted}</div>
                <div style={{ marginTop: '2px' }}>{jabatanTTD}</div>
                <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                <div style={{ fontWeight: 'bold' }}>{selectedPejabat.nama}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── HALAMAN LAMPIRAN SURAT TUGAS (Hanya untuk Surat Tugas jika pegawai > 3) ─────── */}
        {isTugas && isLampiran && (
          <div
            className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none"
            style={{
              ...baseStyle,
              width: '794px',
              minHeight: '1123px',
              padding: '60px 72px 50px 90px',
              boxSizing: 'border-box',
              position: 'relative',
              marginTop: '20px',
            }}
          >
            {/* Header Lampiran - Pojok Kanan Atas Resmi */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', width: '100%' }}>
              <div style={{ minWidth: '240px', maxWidth: '320px', fontSize: '10pt', lineHeight: '1.4', textAlign: 'left' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '60px', flexShrink: 0 }}>Lampiran</div>
                  <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <div style={{ flex: 1 }}>Surat Tugas Kepala Pusat Kebijakan Strategis</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '60px', flexShrink: 0 }}>Nomor</div>
                  <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <div style={{ flex: 1 }}>{form.nomor_lengkap}</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '60px', flexShrink: 0 }}>Tanggal</div>
                  <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <div style={{ flex: 1 }}>{tglSuratFormatted}</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', marginBottom: '16px' }}>
              DAFTAR PEGAWAI YANG DITUGASKAN
            </div>

            {/* Tabel Daftar Pegawai */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10pt',
                marginBottom: '24px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '36px', textAlign: 'center' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Nama</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', width: '160px' }}>NIP</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', width: '140px' }}>Pangkat, Gol/Ruang</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {selectedPegawai.map((peg, idx) => (
                  <tr key={peg.id}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>{peg.nama}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{peg.nip}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{peg.pangkat_golongan}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{peg.jabatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── HALAMAN LAMPIRAN DOKUMEN & TEKS (MASING-MASING TAB TERPISAH) ─────── */}
        {(form.jenis_naskah === 'UNDANGAN'
          ? (form.undangan_lampiran_items || [])
          : form.jenis_naskah === 'NOTA_DINAS'
          ? (form.nota_lampiran_items || [])
          : (form.lampiran_items || [])
        ).map((item, idx, effectiveLampiran) => {
          // Jika lampiran berupa dokumen PDF multi-halaman, pisahkan menjadi lembar A4 masing-masing
          if (item.pdf_pages_images && item.pdf_pages_images.length > 0) {
            return (
              <React.Fragment key={item.id || idx}>
                {item.pdf_pages_images.map((pageImg, pIdx) => (
                  <div
                    key={`${item.id || idx}-page-${pIdx}`}
                    className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none"
                    style={{
                      ...baseStyle,
                      width: '794px',
                      minHeight: '1123px',
                      height: '1123px',
                      padding: item.tanpa_mark ? '24px 32px' : pIdx === 0 ? '45px 60px 35px 70px' : '30px 40px',
                      boxSizing: 'border-box',
                      position: 'relative',
                      marginTop: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                    }}
                  >
                    <div>
                      {/* Header Mark hanya di halaman 1 dan hanya jika BUKAN tanpa_mark */}
                      {pIdx === 0 && !item.tanpa_mark && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px', width: '100%' }}>
                          <div style={{ minWidth: '240px', maxWidth: '300px', fontSize: '9.5pt', lineHeight: '1.4', fontFamily: 'Arial, sans-serif', textAlign: 'left' }}>
                            <div style={{ fontWeight: 'normal', marginBottom: '1px' }}>
                              {item.label_mark || `Lampiran ${idx + 1}`}
                            </div>
                            <div style={{ display: 'flex' }}>
                              <div style={{ width: '54px', flexShrink: 0 }}>Nomor</div>
                              <div style={{ width: '10px', textAlign: 'center', flexShrink: 0 }}>:</div>
                              <div style={{ flex: 1 }}>{form.nomor_lengkap || '-'}</div>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <div style={{ width: '54px', flexShrink: 0 }}>Tanggal</div>
                              <div style={{ width: '10px', textAlign: 'center', flexShrink: 0 }}>:</div>
                              <div style={{ flex: 1 }}>{tglSuratFormatted}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Judul Lampiran hanya di halaman 1 dan jika bukan tanpa_mark */}
                      {pIdx === 0 && !item.tanpa_mark && item.judul && (
                        <div
                          style={{
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '11pt',
                            marginBottom: '14px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.judul}
                        </div>
                      )}

                      {/* Render Gambar Halaman PDF */}
                      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                          src={pageImg}
                          alt={`Halaman ${pIdx + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: pIdx === 0 && !item.tanpa_mark ? '890px' : '1020px',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Penanda Nomor Halaman di bawah */}
                    <div style={{ textAlign: 'center', fontSize: '8pt', color: '#64748b', paddingTop: '4px' }}>
                      {item.file_name} &bull; Halaman {pIdx + 1} dari {item.pdf_pages_images?.length || 1}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          }

          // Lampiran Berupa Teks, Gambar Tunggal, atau Berkas Lain
          return (
            <div
              key={item.id || idx}
              className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none"
              style={{
                ...baseStyle,
                width: '794px',
                minHeight: '1123px',
                padding: item.tanpa_mark ? '36px 45px 80px 45px' : '55px 72px 80px 90px',
                boxSizing: 'border-box',
                position: 'relative',
                marginTop: '20px',
              }}
            >
              {/* Header Lampiran - Di Pojok Kanan Atas (jika bukan tanpa_mark) */}
              {!item.tanpa_mark && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '22px', width: '100%' }}>
                  <div style={{ minWidth: '240px', maxWidth: '300px', fontSize: '10pt', lineHeight: '1.45', fontFamily: 'Arial, sans-serif', textAlign: 'left' }}>
                    <div style={{ fontWeight: 'normal', marginBottom: '2px' }}>
                      {item.label_mark || `Lampiran ${idx + 1}`}
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '56px', flexShrink: 0 }}>Nomor</div>
                      <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                      <div style={{ flex: 1 }}>{form.nomor_lengkap || '-'}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '56px', flexShrink: 0 }}>Tanggal</div>
                      <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                      <div style={{ flex: 1 }}>{tglSuratFormatted}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Judul & Sub Judul Lampiran */}
              {!item.tanpa_mark && (item.judul || item.sub_judul) && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  {item.judul && (
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '11pt',
                        textTransform: 'uppercase',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.judul}
                    </div>
                  )}
                  {item.sub_judul && (
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '10.5pt',
                        marginTop: '4px',
                        color: '#1e293b',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.sub_judul}
                    </div>
                  )}
                </div>
              )}

              {/* Isi Lampiran Gambar Tunggal */}
              {item.file_type?.startsWith('image/') && item.file_data && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <img
                    src={item.file_data}
                    alt={item.file_name || 'Lampiran'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: item.tanpa_mark ? '1020px' : '860px',
                      objectFit: 'contain',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>
              )}

              {/* Isi Lampiran Teks atau Tabel Rundown */}
              {!item.file_type?.startsWith('image/') && (item.isi || item.extracted_text) && (() => {
                const textContent = (item.isi || item.extracted_text || '').trim();

                const lines = textContent.split('\n');
                const isTable = textContent.includes('<table') || lines.some((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));

                if (isTable) {
                  return (
                    <DocumentPreviewTable
                      key={item.id || `lamp-table-${idx}`}
                      initialContent={textContent}
                      onChangeContent={(newHtml) => {
                        const nextLampiran = [...effectiveLampiran];
                        nextLampiran[idx] = { ...nextLampiran[idx], isi: newHtml };
                        if (form.jenis_naskah === 'UNDANGAN') {
                          onUpdateForm?.({ undangan_lampiran_items: nextLampiran });
                        } else if (form.jenis_naskah === 'NOTA_DINAS') {
                          onUpdateForm?.({ nota_lampiran_items: nextLampiran });
                        } else {
                          onUpdateForm?.({ lampiran_items: nextLampiran });
                        }
                      }}
                    />
                  );
                }

                return (
                  <div
                    style={{
                      fontSize: '10pt',
                      lineHeight: '1.6',
                      textAlign: 'justify',
                      whiteSpace: 'pre-line',
                      color: '#000000',
                      marginTop: '10px',
                    }}
                  >
                    <MarkupText text={textContent} />
                  </div>
                );
              })()}

              {/* Fallback Jika Tidak Ada Teks/Halaman yang Terbaca */}
              {!item.file_type?.startsWith('image/') && !item.isi && !item.extracted_text && (
                <div
                  style={{
                    border: '1px dashed #94a3b8',
                    borderRadius: '8px',
                    padding: '32px 20px',
                    backgroundColor: '#f8fafc',
                    textAlign: 'center',
                    marginTop: '20px',
                  }}
                >
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Dokumen Terlampir: {item.file_name || 'Berkas Lampiran'}
                  </div>
                  <div style={{ fontSize: '9.5pt', color: '#64748b', marginBottom: '16px' }}>
                    Ukuran Berkas: {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Dokumen Digital'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
