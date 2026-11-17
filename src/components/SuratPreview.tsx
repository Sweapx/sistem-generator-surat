import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Download, Printer, FileCheck, Layers, Edit3, RotateCcw, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { SuratTugasFormState, Pegawai, Pejabat } from '../types';
import { formatTanggalIndonesia, stripAcademicTitles, normalizeTwoDigitDateText, cleanTempatField } from '../services/docxService';
import { splitNotaDinasPages, splitSuratUndanganPages, splitSuratTugasPages } from '../services/naskahFormatter';
import { RichEditable, MarkupText } from './RichEditable';
import { DocumentPreviewTable } from './InteractiveDocumentTable';
import { toRoman } from './LampiranManager';
import { visibleLength, isNotaKeyValueLine, setVisibleRange, visibleTotal } from '../services/richText';

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
      : { page1AgendaLines: [], page2AgendaLines: [], agendaPages: [], isMultiPage: false };
  }, [isUndangan, form.undangan_agenda, form.undangan_kepada, form.undangan_pembuka, form.undangan_penutup]);

  const undanganAgendaPages: string[][] =
    undanganSplit.agendaPages && undanganSplit.agendaPages.length > 0
      ? undanganSplit.agendaPages
      : [undanganSplit.page1AgendaLines];
  const undanganAgendaPageStarts = undanganAgendaPages.map((_, i) =>
    undanganAgendaPages.slice(0, i).reduce((a, pg) => a + visibleLength(pg), 0)
  );
  const commitUndanganAgendaPage = (idx: number, v: string) => {
    const pages = undanganAgendaPages.map((pg) => [...pg]);
    pages[idx] = v.split('\n');
    const combined = pages
      .flatMap((pg) => pg.filter((l) => l.trim() !== ''))
      .join('\n');
    onUpdateForm?.({ undangan_agenda: combined });
  };

  const notaPages: string[][] =
    notaSplit.pages && notaSplit.pages.length > 0 ? notaSplit.pages : [notaSplit.page1Lines];
  const notaPageStarts = notaPages.map((_, i) =>
    notaPages.slice(0, i).reduce((a, pg) => a + visibleLength(pg), 0)
  );
  const notaHasManualBreak = /^\s*(?:---|===|\[halaman baru\]|\[pagebreak\])\s*$/im.test(form.nota_isi || '');
  const joinNotaLinesSmart = (lines: string[]): string => {
    const cleaned = lines.filter((l) => l.trim() !== '');
    if (cleaned.length === 0) return '';
    let result = cleaned[0].trim();
    for (let i = 1; i < cleaned.length; i++) {
      const rawCurr = cleaned[i];
      const prev = cleaned[i - 1].trim();
      const curr = rawCurr.trim();
      const isSplitContinuation =
        /^ {2,}\S/.test(rawCurr) &&
        !/^\s*(?:\d+[.)]|[a-zA-Z][.)]|\([0-9a-zA-Z]\)|[-*•#])\s+/.test(rawCurr);
      if (isSplitContinuation) {
        result += ' ' + curr;
        continue;
      }
      const bothKv = isNotaKeyValueLine(prev) && isNotaKeyValueLine(curr);
      const currIsSub = /^([a-zA-Z][\.\)]|\([0-9a-zA-Z]\)|[\-\*•])\s+/.test(curr);
      result += (bothKv || currIsSub ? '\n' : '\n\n') + rawCurr;
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

  const tglSuratFormatted =
    form.custom_tanggal_surat_text ||
    (form.tanggal_surat ? formatTanggalIndonesia(form.tanggal_surat) : '');
  const kotaTanggalFormatted = `${form.kota_surat || 'Jakarta'}, ${tglSuratFormatted}`;
  const handleCommitKotaTanggal = (val: string) => {
    const idx = val.indexOf(',');
    if (idx !== -1) {
      const kota = val.slice(0, idx).trim();
      const tgl = normalizeTwoDigitDateText(val.slice(idx + 1).trim());
      onUpdateForm?.({ kota_surat: kota, custom_tanggal_surat_text: tgl });
    } else {
      onUpdateForm?.({ custom_tanggal_surat_text: normalizeTwoDigitDateText(val.trim()) });
    }
  };

  /**
   * Saat pengguna mengklik area kosong / label di atas kertas A4,
   * otomatis arahkan kursor ketik ke baris teks terdekat layaknya MS Word / Google Docs.
   */
  const handlePaperCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[contenteditable="true"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('table[data-lampiran-table="true"]')
    ) {
      return;
    }
    const pageEl = e.currentTarget;
    const editables = Array.from(
      pageEl.querySelectorAll<HTMLElement>('.editable-text-field[contenteditable="true"]')
    );
    if (editables.length === 0) return;

    const clickY = e.clientY;
    const clickX = e.clientX;
    let closestEl = editables[0];
    let minDistance = Infinity;

    for (const el of editables) {
      const rect = el.getBoundingClientRect();
      const dy =
        clickY < rect.top
          ? rect.top - clickY
          : clickY > rect.bottom
          ? clickY - rect.bottom
          : 0;
      const dx =
        clickX < rect.left
          ? rect.left - clickX
          : clickX > rect.right
          ? clickX - rect.right
          : 0;
      const dist = dy * 3 + dx * 0.25;
      if (dist < minDistance) {
        minDistance = dist;
        closestEl = el;
      }
    }

    closestEl.focus();
    const rect = closestEl.getBoundingClientRect();
    const total = visibleTotal(closestEl);
    const pos = clickX < rect.left + 12 ? 0 : total;
    setVisibleRange(closestEl, pos, pos);
  };
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
  const jabatanTTD =
    form.custom_jabatan_ttd ||
    (selectedPejabat.is_default
      ? `${selectedPejabat.jabatan},`
      : `Plh. ${selectedPejabat.jabatan},`);
  const namaPejabatClean = stripAcademicTitles(form.custom_nama_ttd || selectedPejabat.nama);

  const tugasSplit = useMemo(() => {
    if (!isTugas) {
      return { page1UntukLines: [untukText || ''], page2UntukLines: [], untukPages: [[untukText || '']], isMultiPage: false };
    }
    return splitSuratTugasPages(
      untukText || '',
      menimbangText || '',
      dasarText || '',
      count,
      form.custom_kepada_tugas,
      penutupText
    );
  }, [isTugas, count, dasarText, menimbangText, untukText, form.custom_kepada_tugas, penutupText]);

  const tugasUntukPages: string[][] =
    tugasSplit.untukPages && tugasSplit.untukPages.length > 0
      ? tugasSplit.untukPages
      : [tugasSplit.page1UntukLines];
  const tugasUntukPageStarts = tugasUntukPages.map((_, i) =>
    tugasUntukPages.slice(0, i).reduce((a, pg) => a + visibleLength(pg), 0)
  );
  const commitTugasUntukPage = (idx: number, v: string) => {
    const pages = tugasUntukPages.map((pg) => [...pg]);
    pages[idx] = v.split('\n');
    const combined = pages
      .flatMap((pg) => pg.filter((l) => l.trim() !== ''))
      .join('\n');
    onUpdateForm?.({ untuk_custom: combined });
  };

  const isTugasMultiPage = tugasSplit.isMultiPage;

  const hasContinuationPage =
    (isNotaDinas && notaSplit.isMultiPage) ||
    (isUndangan && undanganSplit.isMultiPage) ||
    isTugasMultiPage;

  const isMultiPageDoc = isLampiran || hasContinuationPage;

  // ─── Penskalaan Adaptif 1 Halaman A4 (Font Isi Tetap 12pt Sesuai Ketentuan) ───
  const bodyFontSize = '12pt';
  let bodyLineHeight = '1.28';
  let pagePadding = hasContinuationPage ? '24px 72px 40px 82px' : '24px 72px 64px 82px';
  const continuationPagePadding = '40px 72px 52px 82px';
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
    form.undangan_kepada,
    form.undangan_pembuka,
    form.undangan_penutup,
    form.untuk_custom,
    form.menimbang_custom,
    form.dasar_custom,
    form.custom_kepada_tugas,
    notaPages.length,
    undanganAgendaPages.length,
    tugasUntukPages.length,
    isMultiPageDoc,
  ]);

  const activeScale = fitScale;
  const isScaled = activeScale < 0.999;

  return (
    <div className="flex flex-col space-y-2.5 h-[calc(100vh-120px)] print:h-auto print:block print:space-y-0">
      {/* ─── BILAH TOMBOL AKSI (NON-SCROLLABLE / TETAP DI ATAS) ─────── */}
      <div className="action-bar-print-hide shrink-0 space-y-2">
        {/* ─── Action Bar ─────────────────────────────────────────── */}
        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          {/* Kelompok Kiri: Utilitas Form & Pindai AI */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isEditMode && onCancelEdit && (
              <button
                onClick={onCancelEdit}
                className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                title="Batalkan pengeditan dan kembali ke formulir surat baru"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Batal Edit</span>
              </button>
            )}

            {onResetIsiPembuatan && (
              <button
                type="button"
                onClick={onResetIsiPembuatan}
                className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  form.jenis_naskah === 'NOTA_DINAS'
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    : form.jenis_naskah === 'UNDANGAN'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                }`}
                title="Hapus semua isi form untuk memulai dari awal"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset Isi</span>
              </button>
            )}

            {onGenerateGeneralTemplate && (
              <button
                type="button"
                onClick={onGenerateGeneralTemplate}
                className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  form.jenis_naskah === 'NOTA_DINAS'
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    : form.jenis_naskah === 'UNDANGAN'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                }`}
                title="Isi otomatis dengan template general sesuai jenis surat"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Template general</span>
              </button>
            )}

            {onOpenAiScanner && (
              <button
                type="button"
                onClick={onOpenAiScanner}
                className={`flex items-center space-x-1.5 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xs transition-all cursor-pointer whitespace-nowrap ${
                  isNotaDinas
                    ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700'
                    : form.jenis_naskah === 'UNDANGAN'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
                    : 'bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800'
                }`}
                title={
                  isNotaDinas
                    ? 'Pindai dokumen laporan atau ketik prompt AI untuk menyusun Nota Dinas otomatis'
                    : form.jenis_naskah === 'UNDANGAN'
                    ? 'Pindai dokumen acuan atau ketik prompt AI untuk menyusun Surat Undangan beserta lampirannya'
                    : 'Pindai surat undangan atau ketik prompt AI untuk menyusun Surat Tugas otomatis'
                }
              >
                <Sparkles
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isNotaDinas
                      ? 'text-indigo-200'
                      : form.jenis_naskah === 'UNDANGAN'
                      ? 'text-amber-100'
                      : 'text-teal-300'
                  }`}
                />
                <span>
                  {isNotaDinas
                    ? 'Pindai Laporan (AI)'
                    : form.jenis_naskah === 'UNDANGAN'
                    ? 'Analisa / Buat Undangan (AI)'
                    : 'Pindai Undangan (AI)'}
                </span>
              </button>
            )}
          </div>

          {/* Kelompok Kanan: Cetak, Unduh & Simpan */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              title="Cetak langsung ke printer atau Simpan sebagai PDF dari browser"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Unduh dokumen langsung dalam format file PDF resmi"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>
            {onDownloadDocx && (
              <button
                onClick={onDownloadDocx}
                className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                title="Unduh dokumen dalam format Microsoft Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Unduh Word</span>
              </button>
            )}
            <button
              onClick={onSaveToDatabase}
              disabled={isSaved}
              className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                isSaved
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : isEditMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
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
          onClick={handlePaperCanvasClick}
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
          {/* ── KOP SURAT RESMI KOMDIGI (Baris alamat dibuat ke bawah mepet garis) ── */}
          <div className="kop-container" style={{ display: 'flex', alignItems: 'stretch', gap: '14px', marginBottom: '1px' }}>
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

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
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
              </div>
              <div
                className="kop-alamat-line"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: count === 3 ? '8.2pt' : '8.6pt',
                  lineHeight: '1.15',
                  marginTop: '12px',
                  marginBottom: '0px',
                  paddingBottom: '0px',
                  color: '#000',
                }}
              >
                Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735{' '}
                <span style={{ textDecoration: 'underline' }}>www.komdigi.go.id</span>
              </div>
            </div>
          </div>

          {/* Garis pemisah kop — garis ganda resmi tepat di bawah baris alamat */}
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
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Nomor</div>
                    <div style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>:</div>
                    <RichEditable
                      rich={false}
                      singleLine
                      value={form.nomor_lengkap || ''}
                      onCommit={(v) => onUpdateForm?.({ nomor_lengkap: v })}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Sifat</div>
                    <div style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>:</div>
                    <RichEditable
                      rich={false}
                      singleLine
                      value={form.undangan_sifat || 'Biasa'}
                      onCommit={(v) => onUpdateForm?.({ undangan_sifat: v })}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Lampiran</div>
                    <div style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>:</div>
                    <RichEditable
                      rich={false}
                      singleLine
                      value={form.undangan_lampiran || '-'}
                      onCommit={(v) => onUpdateForm?.({ undangan_lampiran: v })}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '85px', flexShrink: 0 }}>Hal</div>
                    <div style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>:</div>
                    <RichEditable
                      rich={false}
                      value={form.undangan_hal || ''}
                      onCommit={(v) => onUpdateForm?.({ undangan_hal: v })}
                      placeholder="(Ketik perihal surat undangan di sini)"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right', width: '38%' }}>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={kotaTanggalFormatted}
                    onCommit={handleCommitKotaTanggal}
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </div>

              {/* Penerima / Kepada Yth */}
              <div style={{ marginBottom: '14px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '3px' }}>Kepada Yth.</div>
                <RichEditable
                  value={form.undangan_kepada || ''}
                  onCommit={(v) => onUpdateForm?.({ undangan_kepada: v })}
                  placeholder="(Ketik penerima undangan atau (Daftar Terlampir))"
                  style={{ lineHeight: '1.4', minHeight: '22px' }}
                />
              </div>

              {/* Paragraf Pembuka */}
              <div style={{ marginBottom: '14px' }}>
                <RichEditable
                  value={form.undangan_pembuka || ''}
                  onCommit={(v) => onUpdateForm?.({ undangan_pembuka: v })}
                  placeholder="(Ketik paragraf pembuka surat undangan di sini...)"
                  style={{ textAlign: 'justify', lineHeight: '1.5', textIndent: '32px', minHeight: '24px' }}
                />
              </div>

              {/* Rincian Acara */}
              <div style={{ margin: '10px 0 14px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Hari, Tanggal</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={normalizeTwoDigitDateText(
                      form.undangan_hari_tanggal || form.hari_tanggal_pelaksanaan || tglSuratFormatted || ''
                    )}
                    onCommit={(v) => onUpdateForm?.({ undangan_hari_tanggal: normalizeTwoDigitDateText(v) })}
                    placeholder="(Ketik hari dan tanggal pelaksanaan)"
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Waktu</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.undangan_waktu || form.waktu_kegiatan || ''}
                    onCommit={(v) => onUpdateForm?.({ undangan_waktu: v })}
                    placeholder="(Ketik waktu pelaksanaan, misal: 09.00 WIB s.d. selesai)"
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Tempat</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <div style={{ flex: 1 }}>
                    {form.undangan_tipe_tempat === 'online' ? (
                      <RichEditable
                        value={
                          form.undangan_tempat_online_custom !== undefined
                            ? form.undangan_tempat_online_custom.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**')
                            : `**online** via tautan ${cleanTempatField(form.undangan_tempat_online, 'online')}`
                        }
                        onCommit={(v) => {
                          const normalized = v.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');
                          const cleanedLink = cleanTempatField(normalized, 'online');
                          onUpdateForm?.({
                            undangan_tempat_online_custom: normalized,
                            undangan_tempat_online: cleanedLink,
                          });
                        }}
                        placeholder="(Ketik tautan rapat online)"
                        style={{ flex: 1 }}
                      />
                    ) : form.undangan_tipe_tempat === 'hybrid' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <RichEditable
                          value={
                            form.undangan_tempat_online_custom !== undefined
                              ? form.undangan_tempat_online_custom.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**')
                              : `**online** via tautan ${cleanTempatField(form.undangan_tempat_online, 'online')}`
                          }
                          onCommit={(v) => {
                            const normalized = v.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');
                            const cleanedLink = cleanTempatField(normalized, 'online');
                            onUpdateForm?.({
                              undangan_tempat_online_custom: normalized,
                              undangan_tempat_online: cleanedLink,
                            });
                          }}
                          placeholder="(Ketik tautan rapat online)"
                          style={{ flex: 1 }}
                        />
                        <RichEditable
                          value={
                            form.undangan_tempat_offline_custom !== undefined
                              ? form.undangan_tempat_offline_custom.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**')
                              : `**offline** di ${cleanTempatField(form.undangan_tempat_offline || form.lokasi_kegiatan, 'offline')}`
                          }
                          onCommit={(v) => {
                            const normalized = v.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');
                            const cleanedRoom = cleanTempatField(normalized, 'offline');
                            onUpdateForm?.({
                              undangan_tempat_offline_custom: normalized,
                              undangan_tempat_offline: cleanedRoom,
                              lokasi_kegiatan: cleanedRoom,
                            });
                          }}
                          placeholder="(Ketik tempat/lokasi rapat offline)"
                          style={{ flex: 1 }}
                        />
                      </div>
                    ) : (
                      <RichEditable
                        rich={false}
                        value={cleanTempatField(form.undangan_tempat_offline || form.lokasi_kegiatan, 'offline')}
                        onCommit={(v) =>
                          onUpdateForm?.({
                            undangan_tempat_offline: v,
                            lokasi_kegiatan: v,
                            undangan_tempat_offline_custom: undefined,
                          })
                        }
                        placeholder="(Ketik tempat/lokasi pelaksanaan)"
                      />
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>Agenda</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <div style={{ flex: 1 }}>
                    <RichEditable
                      groupId="undangan-agenda"
                      groupStart={0}
                      value={
                        undanganSplit.isMultiPage
                          ? (undanganAgendaPages[0] || []).join('\n')
                          : form.undangan_agenda || ''
                      }
                      onCommit={(v) => {
                        if (undanganSplit.isMultiPage) {
                          commitUndanganAgendaPage(0, v);
                        } else {
                          onUpdateForm?.({ undangan_agenda: v });
                        }
                      }}
                      placeholder="(Ketik agenda acara di sini)"
                      style={{ lineHeight: '1.45' }}
                    />
                  </div>
                </div>
              </div>

              {/* Jika 1 Halaman Saja (Muat): Tampilkan Penutup & TTD di Halaman 1 */}
              {!undanganSplit.isMultiPage && (
                <>
                  {/* Paragraf Penutup */}
                  <RichEditable
                    value={form.undangan_penutup || ''}
                    onCommit={(v) => onUpdateForm?.({ undangan_penutup: v })}
                    placeholder="(Ketik paragraf penutup surat undangan di sini...)"
                    style={{ textAlign: 'justify', lineHeight: '1.5', marginBottom: ttdMargin, textIndent: '32px', minHeight: '24px' }}
                  />

                  {/* Tanda Tangan (Nama tidak di-bold & tanpa gelar) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={jabatanTTD}
                        onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                        style={{ marginTop: '2px', textAlign: 'center' }}
                      />
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                      <RichEditable
                        rich={false}
                        singleLine
                        value={namaPejabatClean}
                        onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                        style={{ fontWeight: 'normal', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Tembusan jika ada */}
                  {form.undangan_tembusan !== undefined && form.undangan_tembusan !== '' && (
                    <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                      <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                      <RichEditable
                        value={form.undangan_tembusan}
                        onCommit={(v) => onUpdateForm?.({ undangan_tembusan: v })}
                        style={{ lineHeight: '1.3' }}
                      />
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
              {/* Judul Tengah — Arial 14pt */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14pt',
                    textDecoration: 'underline',
                    letterSpacing: '0.05em',
                  }}
                >
                  NOTA DINAS
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: bodyFontSize, marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Nomor:</span>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nomor_lengkap || ''}
                    onCommit={(v) => onUpdateForm?.({ nomor_lengkap: v })}
                    style={{ display: 'inline-grid' }}
                  />
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
                    placeholder="(Ketik tujuan penerima Nota Dinas)"
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
                    placeholder="(Ketik pengirim Nota Dinas)"
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Hal</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    value={form.nota_hal || ''}
                    onCommit={(v) => onUpdateForm?.({ nota_hal: v })}
                    placeholder="(Ketik perihal Nota Dinas)"
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Sifat</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nota_sifat || 'Biasa'}
                    onCommit={(v) => onUpdateForm?.({ nota_sifat: v })}
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Lampiran</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nota_lampiran || '-'}
                    onCommit={(v) => onUpdateForm?.({ nota_lampiran: v })}
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ width: '110px', flexShrink: 0 }}>Tanggal</div>
                  <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={tglSuratFormatted}
                    onCommit={(v) => onUpdateForm?.({ custom_tanggal_surat_text: normalizeTwoDigitDateText(v) })}
                    style={{ flex: 1, lineHeight: '1.4' }}
                  />
                </div>
              </div>

              {/* Garis batas tipis di bawah atribut */}
              <div style={{ borderBottom: '1px solid #000', margin: '8px 0 14px 0' }} />

              {/* Isi / Badan Surat Nota Dinas (satu kanvas teks kontinu) */}
              <RichEditable
                variant="nota"
                groupId="nota-body"
                groupStart={0}
                value={(notaPages[0] || []).join('\n')}
                onCommit={(v) => commitNotaPage(0, v)}
                placeholder="(Ketik isi Nota Dinas di sini...)"
                style={{ marginBottom: notaSplit.isMultiPage ? '0px' : '12px', minHeight: '160px' }}
              />

              {/* Jika 1 Halaman Saja (Muat): Tampilkan TTD di Halaman 1 */}
              {!notaSplit.isMultiPage && (
                <>
                  {/* Tanda Tangan (Nama tidak di-bold & tanpa gelar) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', marginTop: '16px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={jabatanTTD}
                        onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                        style={{ marginTop: '2px', textAlign: 'center' }}
                      />
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                      <RichEditable
                        rich={false}
                        singleLine
                        value={namaPejabatClean}
                        onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                        style={{ fontWeight: 'normal', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Tembusan jika ada */}
                  {form.nota_tembusan && (
                    <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                      <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                      <RichEditable
                        value={form.nota_tembusan}
                        onCommit={(v) => onUpdateForm?.({ nota_tembusan: v })}
                        style={{ lineHeight: '1.3' }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════
                CABANG 3: SURAT TUGAS
            ══════════════════════════════════════════════════════════ */
            <div>
              {/* ── JUDUL — Arial 14pt ─────────────────────────────────── */}
              <div style={{ textAlign: 'center', marginBottom: count === 3 ? '4px' : '6px' }}>
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14pt',
                    textDecoration: 'underline',
                    letterSpacing: '0.05em',
                  }}
                >
                  SURAT TUGAS
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: bodyFontSize, marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Nomor:</span>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nomor_lengkap || ''}
                    onCommit={(v) => onUpdateForm?.({ nomor_lengkap: v })}
                    style={{ display: 'inline-grid' }}
                  />
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
                  placeholder="(Ketik klausul Menimbang di sini)"
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
                  placeholder="(Ketik dasar hukum / surat undangan di sini)"
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

              {/* ── KEPADA (Nama yang ditugaskan tidak di-bold & dapat langsung diedit di kertas) ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: sectionMargin }}>
                <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Kepada</div>
                <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
                <div style={{ flex: 1, lineHeight: bodyLineHeight, minHeight: '22px' }}>
                  {count === 0 ? (
                    <RichEditable
                      value={form.custom_kepada_tugas || ''}
                      onCommit={(v) => onUpdateForm?.({ custom_kepada_tugas: v })}
                      placeholder="(Pilih pegawai di panel kiri atau ketik langsung di sini)"
                      style={{ lineHeight: bodyLineHeight, minHeight: '22px' }}
                    />
                  ) : isLampiran ? (
                    <RichEditable
                      rich={false}
                      singleLine
                      value={form.custom_kepada_tugas || '(Daftar Terlampir)'}
                      onCommit={(v) => onUpdateForm?.({ custom_kepada_tugas: v })}
                    />
                  ) : count === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {([
                        ['Nama', 'nama', stripAcademicTitles(form.custom_pegawai_overrides?.[selectedPegawai[0].id]?.nama ?? selectedPegawai[0].nama)],
                        ['NIP', 'nip', form.custom_pegawai_overrides?.[selectedPegawai[0].id]?.nip ?? selectedPegawai[0].nip],
                        ['Pangkat, Gol/Ruang', 'pangkat_golongan', form.custom_pegawai_overrides?.[selectedPegawai[0].id]?.pangkat_golongan ?? selectedPegawai[0].pangkat_golongan],
                        ['Jabatan', 'jabatan', form.custom_pegawai_overrides?.[selectedPegawai[0].id]?.jabatan ?? selectedPegawai[0].jabatan],
                      ] as const).map(([label, fieldKey, val]) => (
                        <div
                          key={label}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            lineHeight: employeeInnerLineHeight,
                          }}
                        >
                          <div style={{ width: '156px', flexShrink: 0, whiteSpace: 'nowrap' }}>{label}</div>
                          <div style={{ width: '16px', flexShrink: 0, textAlign: 'center' }}>:</div>
                          <RichEditable
                            rich={false}
                            singleLine
                            value={String(val)}
                            onCommit={(v) => {
                              const pid = selectedPegawai[0].id;
                              const prevOverrides = form.custom_pegawai_overrides || {};
                              onUpdateForm?.({
                                custom_pegawai_overrides: {
                                  ...prevOverrides,
                                  [pid]: { ...(prevOverrides[pid] || {}), [fieldKey]: v },
                                },
                              });
                            }}
                            style={{ flex: 1, fontWeight: 'normal' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: pegawaiGap }}>
                      {selectedPegawai.map((peg, idx) => (
                        <div key={peg.id} style={{ display: 'flex', alignItems: 'flex-start', lineHeight: employeeInnerLineHeight }}>
                          <div style={{ width: '18px', flexShrink: 0, fontWeight: 'normal' }}>{idx + 1}.</div>
                          <div style={{ flex: 1 }}>
                            {([
                              ['Nama', 'nama', stripAcademicTitles(form.custom_pegawai_overrides?.[peg.id]?.nama ?? peg.nama)],
                              ['NIP', 'nip', form.custom_pegawai_overrides?.[peg.id]?.nip ?? peg.nip],
                              ['Pangkat, Gol/Ruang', 'pangkat_golongan', form.custom_pegawai_overrides?.[peg.id]?.pangkat_golongan ?? peg.pangkat_golongan],
                              ['Jabatan', 'jabatan', form.custom_pegawai_overrides?.[peg.id]?.jabatan ?? peg.jabatan],
                            ] as const).map(([label, fieldKey, val]) => (
                              <div
                                key={label}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  lineHeight: employeeInnerLineHeight,
                                }}
                              >
                                <div style={{ width: '156px', flexShrink: 0, whiteSpace: 'nowrap' }}>{label}</div>
                                <div style={{ width: '16px', flexShrink: 0, textAlign: 'center' }}>:</div>
                                <RichEditable
                                  rich={false}
                                  singleLine
                                  value={String(val)}
                                  onCommit={(v) => {
                                    const prevOverrides = form.custom_pegawai_overrides || {};
                                    onUpdateForm?.({
                                      custom_pegawai_overrides: {
                                        ...prevOverrides,
                                        [peg.id]: { ...(prevOverrides[peg.id] || {}), [fieldKey]: v },
                                      },
                                    });
                                  }}
                                  style={{ flex: 1, fontWeight: 'normal' }}
                                />
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
                  value={isTugasMultiPage ? (tugasUntukPages[0] || []).join('\n') : untukText || ''}
                  onCommit={(v) => {
                    if (isTugasMultiPage) {
                      commitTugasUntukPage(0, v);
                    } else {
                      onUpdateForm?.({ untuk_custom: v });
                    }
                  }}
                  placeholder="(Ketik rincian tugas / kegiatan di sini)"
                  style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight, minHeight: '20px' }}
                />
              </div>

              {/* Jika 1 Halaman: Tampilkan Penutup & TTD di Halaman 1 */}
              {!isTugasMultiPage && (
                <>
                  {/* ── PENUTUP ────────────────────────────────────────────── */}
                  {penutupText && penutupText.trim() ? (
                    <RichEditable
                      value={penutupText}
                      onCommit={(v) => onUpdateForm?.({ penutup_custom: v })}
                      style={{ textAlign: 'justify', lineHeight: bodyLineHeight, marginBottom: '3px' }}
                    />
                  ) : null}
                  <RichEditable
                    value={
                      form.custom_kalimat_penutup_tugas ||
                      'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.'
                    }
                    onCommit={(v) => onUpdateForm?.({ custom_kalimat_penutup_tugas: v })}
                    style={{
                      textAlign: 'justify',
                      lineHeight: bodyLineHeight,
                      marginBottom: ttdMargin,
                    }}
                  />

                  {/* ── TANDA TANGAN (Nama tidak di-bold & tanpa gelar) ────── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={kotaTanggalFormatted}
                        onCommit={handleCommitKotaTanggal}
                        style={{ textAlign: 'center' }}
                      />
                      <RichEditable
                        rich={false}
                        singleLine
                        value={jabatanTTD}
                        onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                        style={{ marginTop: '2px', textAlign: 'center' }}
                      />

                      {/* Space kosong lebar dan tinggi untuk tanda tangan manual */}
                      <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />

                      <RichEditable
                        rich={false}
                        singleLine
                        value={namaPejabatClean}
                        onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                        style={{ fontWeight: 'normal', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── HALAMAN LANJUTAN — NOTA DINAS (Halaman 2, 3, dst. tanpa nomor halaman & tanpa teks bersambung) ── */}
        {isNotaDinas && notaSplit.isMultiPage && (
          (notaSplit.pages && notaSplit.pages.length > 1 ? notaSplit.pages.slice(1) : [notaSplit.page2Lines]).map((pageLines, pageIdx, arr) => {
            const pageNum = pageIdx + 2;
            const isLastPage = pageIdx === arr.length - 1;

            return (
              <div
                key={`nota-page-${pageNum}`}
                onClick={handlePaperCanvasClick}
                className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
                style={{
                  ...baseStyle,
                  width: '794px',
                  minHeight: '1123px',
                  height: '1123px',
                  maxHeight: '1123px',
                  overflow: 'hidden',
                  padding: continuationPagePadding,
                  boxSizing: 'border-box',
                  position: 'relative',
                  marginTop: '12px',
                }}
              >
                {/* Lanjutan isi nota dinas langsung mengalir rapi dari atas halaman */}
                <RichEditable
                  variant="nota"
                  groupId="nota-body"
                  groupStart={notaPageStarts[pageIdx + 1] || 0}
                  value={pageLines.join('\n')}
                  onCommit={(v) => commitNotaPage(pageIdx + 1, v)}
                  style={{ marginBottom: isLastPage ? '14px' : '0px' }}
                />

                {/* Jika halaman terakhir: Tampilkan Tanda Tangan dan Tembusan tepat setelah paragraf penutup */}
                {isLastPage && (
                  <>
                    {/* Tanda Tangan (Nama tidak di-bold & tanpa gelar) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', marginTop: '20px' }}>
                      <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                        <RichEditable
                          rich={false}
                          singleLine
                          value={jabatanTTD}
                          onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                          style={{ marginTop: '2px', textAlign: 'center' }}
                        />
                        <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                        <RichEditable
                          rich={false}
                          singleLine
                          value={namaPejabatClean}
                          onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                          style={{ fontWeight: 'normal', textAlign: 'center' }}
                        />
                      </div>
                    </div>

                    {/* Tembusan jika ada */}
                    {form.nota_tembusan && (
                      <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                        <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                        <RichEditable
                          value={form.nota_tembusan}
                          onCommit={(v) => onUpdateForm?.({ nota_tembusan: v })}
                          style={{ lineHeight: '1.3' }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* ── HALAMAN LANJUTAN — SURAT UNDANGAN (Halaman 2, 3, dst. tanpa nomor halaman & tanpa teks bersambung) ── */}
        {isUndangan && undanganSplit.isMultiPage && (
          (undanganAgendaPages.length > 1 ? undanganAgendaPages.slice(1) : [[]]).map((pageLines, pageIdx, arr) => {
            const pageNum = pageIdx + 2;
            const isLastPage = pageIdx === arr.length - 1;

            return (
              <div
                key={`undangan-page-${pageNum}`}
                onClick={handlePaperCanvasClick}
                className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
                style={{
                  ...baseStyle,
                  width: '794px',
                  minHeight: '1123px',
                  height: '1123px',
                  maxHeight: '1123px',
                  overflow: 'hidden',
                  padding: continuationPagePadding,
                  boxSizing: 'border-box',
                  position: 'relative',
                  marginTop: '12px',
                }}
              >
                {/* Lanjutan Agenda langsung mengalir sejajar kolom Agenda */}
                {pageLines.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginLeft: '32px', marginBottom: '12px', lineHeight: '1.45' }}>
                    <div style={{ width: '120px', flexShrink: 0 }} />
                    <div style={{ width: '16px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <RichEditable
                        groupId="undangan-agenda"
                        groupStart={undanganAgendaPageStarts[pageIdx + 1] || 0}
                        value={pageLines.join('\n')}
                        onCommit={(v) => commitUndanganAgendaPage(pageIdx + 1, v)}
                        style={{ textAlign: 'justify', lineHeight: '1.45' }}
                      />
                    </div>
                  </div>
                )}

                {isLastPage && (
                  <>
                    {/* Paragraf Penutup */}
                    <RichEditable
                      value={form.undangan_penutup || 'Demikian kami sampaikan, atas perhatian dan kehadirannya diucapkan terima kasih.'}
                      onCommit={(v) => onUpdateForm?.({ undangan_penutup: v })}
                      style={{ textAlign: 'justify', lineHeight: '1.5', marginBottom: ttdMargin, textIndent: '32px' }}
                    />

                    {/* Tanda Tangan (Nama tidak di-bold & tanpa gelar) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                      <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                        <RichEditable
                          rich={false}
                          singleLine
                          value={jabatanTTD}
                          onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                          style={{ marginTop: '2px', textAlign: 'center' }}
                        />
                        <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                        <RichEditable
                          rich={false}
                          singleLine
                          value={namaPejabatClean}
                          onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                          style={{ fontWeight: 'normal', textAlign: 'center' }}
                        />
                      </div>
                    </div>

                    {/* Tembusan jika ada */}
                    {form.undangan_tembusan && (
                      <div style={{ fontSize: '9pt', marginTop: '14px', lineHeight: '1.3' }}>
                        <div style={{ fontWeight: 'bold' }}>Tembusan disampaikan kepada Yth.</div>
                        <RichEditable
                          value={form.undangan_tembusan}
                          onCommit={(v) => onUpdateForm?.({ undangan_tembusan: v })}
                          style={{ lineHeight: '1.3' }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* ── HALAMAN LANJUTAN — SURAT TUGAS (Halaman 2, 3, dst. tanpa nomor halaman & tanpa teks bersambung) ── */}
        {isTugas && isTugasMultiPage && (
          (tugasUntukPages.length > 1 ? tugasUntukPages.slice(1) : [[]]).map((pageLines, pageIdx, arr) => {
            const pageNum = pageIdx + 2;
            const isLastPage = pageIdx === arr.length - 1;

            return (
              <div
                key={`tugas-page-${pageNum}`}
                onClick={handlePaperCanvasClick}
                className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none is-lampiran"
                style={{
                  ...baseStyle,
                  width: '794px',
                  minHeight: '1123px',
                  height: '1123px',
                  maxHeight: '1123px',
                  overflow: 'hidden',
                  padding: continuationPagePadding,
                  boxSizing: 'border-box',
                  position: 'relative',
                  marginTop: '12px',
                }}
              >
                {/* Lanjutan Diktum Untuk langsung mengalir sejajar kolom Untuk */}
                {pageLines.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ width: LABEL_W, flexShrink: 0 }} />
                    <div style={{ width: COLON_W, flexShrink: 0 }} />
                    <RichEditable
                      groupId="tugas-untuk"
                      groupStart={tugasUntukPageStarts[pageIdx + 1] || 0}
                      value={pageLines.join('\n')}
                      onCommit={(v) => commitTugasUntukPage(pageIdx + 1, v)}
                      style={{ flex: 1, textAlign: 'justify', lineHeight: bodyLineHeight }}
                    />
                  </div>
                )}

                {isLastPage && (
                  <>
                    {/* Paragraf Penutup Pembebanan Anggaran */}
                    {penutupText && penutupText.trim() ? (
                      <RichEditable
                        value={penutupText}
                        onCommit={(v) => onUpdateForm?.({ penutup_custom: v })}
                        style={{ textAlign: 'justify', lineHeight: bodyLineHeight, marginBottom: '10px' }}
                      />
                    ) : null}
                    <RichEditable
                      value={
                        form.custom_kalimat_penutup_tugas ||
                        'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.'
                      }
                      onCommit={(v) => onUpdateForm?.({ custom_kalimat_penutup_tugas: v })}
                      style={{
                        textAlign: 'justify',
                        lineHeight: bodyLineHeight,
                        marginBottom: ttdMargin,
                      }}
                    />

                    {/* Tanda Tangan (Nama tidak di-bold & tanpa gelar) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                      <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center' }}>
                        <RichEditable
                          rich={false}
                          singleLine
                          value={kotaTanggalFormatted}
                          onCommit={handleCommitKotaTanggal}
                          style={{ textAlign: 'center' }}
                        />
                        <RichEditable
                          rich={false}
                          singleLine
                          value={jabatanTTD}
                          onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                          style={{ marginTop: '2px', textAlign: 'center' }}
                        />
                        <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                        <RichEditable
                          rich={false}
                          singleLine
                          value={namaPejabatClean}
                          onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                          style={{ fontWeight: 'normal', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* ── HALAMAN LAMPIRAN SURAT TUGAS (Hanya untuk Surat Tugas jika pegawai > 3) ─────── */}
        {isTugas && isLampiran && (
          <div
            onClick={handlePaperCanvasClick}
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
                <div style={{ fontWeight: 'normal', marginBottom: '2px' }}>
                  Lampiran I Surat Tugas
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '60px', flexShrink: 0 }}>Nomor</div>
                  <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={form.nomor_lengkap || ''}
                    onCommit={(v) => onUpdateForm?.({ nomor_lengkap: v })}
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '60px', flexShrink: 0 }}>Tanggal</div>
                  <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={tglSuratFormatted}
                    onCommit={(v) => onUpdateForm?.({ custom_tanggal_surat_text: normalizeTwoDigitDateText(v) })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Tabel Daftar Pegawai: Kolom judul di-bold & center, Nama pegawai tidak di-bold & dapat langsung diedit */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10pt',
                marginBottom: '28px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '36px', textAlign: 'center', fontWeight: 'bold' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Nama</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', width: '160px', fontWeight: 'bold' }}>NIP</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', width: '140px', fontWeight: 'bold' }}>Pangkat, Gol/Ruang</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {selectedPegawai.map((peg, idx) => (
                  <tr key={peg.id}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center', fontWeight: 'normal' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'normal' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={stripAcademicTitles(form.custom_pegawai_overrides?.[peg.id]?.nama ?? peg.nama)}
                        onCommit={(v) => {
                          const prevOverrides = form.custom_pegawai_overrides || {};
                          onUpdateForm?.({
                            custom_pegawai_overrides: {
                              ...prevOverrides,
                              [peg.id]: { ...(prevOverrides[peg.id] || {}), nama: v },
                            },
                          });
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'normal' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={form.custom_pegawai_overrides?.[peg.id]?.nip ?? peg.nip}
                        onCommit={(v) => {
                          const prevOverrides = form.custom_pegawai_overrides || {};
                          onUpdateForm?.({
                            custom_pegawai_overrides: {
                              ...prevOverrides,
                              [peg.id]: { ...(prevOverrides[peg.id] || {}), nip: v },
                            },
                          });
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'normal' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={form.custom_pegawai_overrides?.[peg.id]?.pangkat_golongan ?? peg.pangkat_golongan}
                        onCommit={(v) => {
                          const prevOverrides = form.custom_pegawai_overrides || {};
                          onUpdateForm?.({
                            custom_pegawai_overrides: {
                              ...prevOverrides,
                              [peg.id]: { ...(prevOverrides[peg.id] || {}), pangkat_golongan: v },
                            },
                          });
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'normal' }}>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={form.custom_pegawai_overrides?.[peg.id]?.jabatan ?? peg.jabatan}
                        onCommit={(v) => {
                          const prevOverrides = form.custom_pegawai_overrides || {};
                          onUpdateForm?.({
                            custom_pegawai_overrides: {
                              ...prevOverrides,
                              [peg.id]: { ...(prevOverrides[peg.id] || {}), jabatan: v },
                            },
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Blok Penandatangan pada Lampiran Pegawai yang Ditugaskan (Sama seperti halaman Surat Tugas untuk TTE) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', marginTop: '16px' }}>
              <div style={{ width: '280px', minWidth: '280px', lineHeight: '1.35', textAlign: 'center', fontSize: '12pt' }}>
                <RichEditable
                  rich={false}
                  singleLine
                  value={kotaTanggalFormatted}
                  onCommit={handleCommitKotaTanggal}
                  style={{ textAlign: 'center' }}
                />
                <RichEditable
                  rich={false}
                  singleLine
                  value={jabatanTTD}
                  onCommit={(v) => onUpdateForm?.({ custom_jabatan_ttd: v })}
                  style={{ marginTop: '2px', textAlign: 'center' }}
                />
                <div style={{ height: ttdImgHeight, width: '100%', margin: '8px 0' }} />
                <RichEditable
                  rich={false}
                  singleLine
                  value={namaPejabatClean}
                  onCommit={(v) => onUpdateForm?.({ custom_nama_ttd: stripAcademicTitles(v) })}
                  style={{ fontWeight: 'normal', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── HALAMAN LAMPIRAN DOKUMEN & TEKS (MASING-MASING TAB TERPISAH, LANGSUNG DIEDIT DI KERTAS) ─────── */}
        {(form.jenis_naskah === 'UNDANGAN'
          ? (form.undangan_lampiran_items || [])
          : form.jenis_naskah === 'NOTA_DINAS'
          ? (form.nota_lampiran_items || [])
          : (form.lampiran_items || [])
        ).map((item, idx, effectiveLampiran) => {
          const romanOffset = (!form.jenis_naskah || form.jenis_naskah === 'TUGAS') && isLampiran ? 1 : 0;
          const autoRomanMark = `Lampiran ${toRoman(idx + 1 + romanOffset)}`;
          const effectiveLabelMark =
            !item.label_mark || /^Lampiran\s+[IVXLCDM\d]+$/i.test(item.label_mark.trim())
              ? autoRomanMark
              : item.label_mark;

          const updateLampiranField = (patch: Partial<typeof item>) => {
            const nextLampiran = [...effectiveLampiran];
            nextLampiran[idx] = { ...nextLampiran[idx], ...patch };
            if (form.jenis_naskah === 'UNDANGAN') {
              onUpdateForm?.({ undangan_lampiran_items: nextLampiran });
            } else if (form.jenis_naskah === 'NOTA_DINAS') {
              onUpdateForm?.({ nota_lampiran_items: nextLampiran });
            } else {
              onUpdateForm?.({ lampiran_items: nextLampiran });
            }
          };

          const isUploadedDoc = item.tipe === 'upload' || (item.pdf_pages_images && item.pdf_pages_images.length > 0);
          const isPdfUpload =
            item.tipe === 'upload' &&
            (item.file_type === 'application/pdf' || item.file_name?.toLowerCase().endsWith('.pdf'));

          // Gabungkan halaman gambar dari PDF multi-halaman maupun unggahan gambar tunggal agar tampil hampir full kertas A4
          const effectivePageImages =
            item.pdf_pages_images && item.pdf_pages_images.length > 0
              ? item.pdf_pages_images
              : item.file_type?.startsWith('image/') && item.file_data
              ? [item.file_data]
              : [];

          // Jika lampiran berupa dokumen PDF multi-halaman atau gambar terunggah:
          // Tampilkan seluruh halaman dokumen hampir full kertas A4, TANPA judul lampiran dan TANPA footer halaman!
          if (effectivePageImages.length > 0) {
            return (
              <React.Fragment key={item.id || idx}>
                {effectivePageImages.map((pageImg, pIdx) => (
                  <div
                    key={`${item.id || idx}-page-${pIdx}`}
                    className="print-page bg-white shadow-md mx-auto print:shadow-none print:border-none"
                    style={{
                      ...baseStyle,
                      width: '794px',
                      minHeight: '1123px',
                      height: '1123px',
                      padding: item.tanpa_mark ? '14px 20px' : pIdx === 0 ? '32px 36px 16px 36px' : '16px 22px',
                      boxSizing: 'border-box',
                      position: 'relative',
                      marginTop: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header Mark hanya di halaman 1 dan hanya jika BUKAN tanpa_mark (Tanpa Judul Lampiran & Tanpa Footer Halaman) */}
                    {pIdx === 0 && !item.tanpa_mark && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', width: '100%', paddingRight: '16px' }}>
                        <div style={{ minWidth: '240px', maxWidth: '300px', fontSize: '9.5pt', lineHeight: '1.4', fontFamily: 'Arial, sans-serif', textAlign: 'left' }}>
                          <div style={{ fontWeight: 'normal', marginBottom: '1px' }}>
                            {effectiveLabelMark}
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

                    {/* Render Gambar Halaman PDF / Dokumen Hampir Full Kertas A4 */}
                    <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <img
                        src={pageImg}
                        alt={`Lampiran Halaman ${pIdx + 1}`}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          maxHeight: pIdx === 0 && !item.tanpa_mark ? '995px' : '1085px',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          }

          // Jika item adalah PDF terunggah dari sesi lama yang belum memiliki render halaman gambar, jangan tampilkan teks mentahnya
          if (isPdfUpload) {
            return null;
          }

          // Lampiran Berupa Teks (Daftar Undangan / Teks Bebas), Tabel Interaktif, atau Gambar Tunggal
          return (
            <div
              key={item.id || idx}
              onClick={handlePaperCanvasClick}
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
                    <RichEditable
                      rich={false}
                      singleLine
                      value={effectiveLabelMark}
                      onCommit={(v) => updateLampiranField({ label_mark: v })}
                      style={{ fontWeight: 'normal', marginBottom: '2px' }}
                    />
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '56px', flexShrink: 0 }}>Nomor</div>
                      <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={form.nomor_lengkap || '-'}
                        onCommit={(v) => onUpdateForm?.({ nomor_lengkap: v })}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '56px', flexShrink: 0 }}>Tanggal</div>
                      <div style={{ width: '12px', textAlign: 'center', flexShrink: 0 }}>:</div>
                      <RichEditable
                        rich={false}
                        singleLine
                        value={tglSuratFormatted}
                        onCommit={(v) => onUpdateForm?.({ custom_tanggal_surat_text: normalizeTwoDigitDateText(v) })}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Judul & Sub Judul Lampiran (HANYA untuk lampiran Buat Teks/Tabel, BUKAN unggah dokumen, dan dapat langsung diedit di kertas!) */}
              {!isUploadedDoc && !item.tanpa_mark && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <RichEditable
                    rich={false}
                    singleLine
                    value={item.judul || ''}
                    onCommit={(v) => updateLampiranField({ judul: v })}
                    style={{
                      fontWeight: 'bold',
                      fontSize: '11pt',
                      textTransform: 'uppercase',
                      lineHeight: '1.4',
                      textAlign: 'center',
                    }}
                  />
                  {(item.sub_judul !== undefined && item.sub_judul !== '') && (
                    <RichEditable
                      rich={false}
                      singleLine
                      value={item.sub_judul || ''}
                      onCommit={(v) => updateLampiranField({ sub_judul: v })}
                      style={{
                        fontWeight: 'bold',
                        fontSize: '10.5pt',
                        marginTop: '4px',
                        color: '#1e293b',
                        lineHeight: '1.4',
                        textAlign: 'center',
                      }}
                    />
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
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>
              )}

              {/* Isi Lampiran Teks (Daftar Undangan / Bebas) atau Tabel Rundown — Dapat Langsung Diedit di Kertas! */}
              {!item.file_type?.startsWith('image/') && (() => {
                const textContent = (item.isi || item.extracted_text || '').trim();
                const lines = textContent.split('\n');
                const isTable = textContent.includes('<table') || lines.some((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));

                if (isTable) {
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <DocumentPreviewTable
                        key={item.id || `lamp-table-${idx}`}
                        initialContent={textContent}
                        onChangeContent={(newHtml) => updateLampiranField({ isi: newHtml })}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      fontSize: '10.5pt',
                      lineHeight: '1.55',
                      color: '#000000',
                      marginTop: '10px',
                    }}
                  >
                    <RichEditable
                      value={item.isi || item.extracted_text || ''}
                      onCommit={(v) => updateLampiranField({ isi: v })}
                      style={{
                        minHeight: '300px',
                        lineHeight: '1.55',
                      }}
                    />
                  </div>
                );
              })()}
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
