import React from 'react';
import { Download, Printer, FileCheck, Layers, Edit3, RotateCcw } from 'lucide-react';
import { SuratTugasFormState, Pegawai, Pejabat } from '../types';
import { formatTanggalIndonesia } from '../services/docxService';

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
  isGeneratingPdf?: boolean;
  onSaveToDatabase: () => void;
  isSaved: boolean;
  onUpdateForm?: (updated: Partial<SuratTugasFormState>) => void;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
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
  isGeneratingPdf = false,
  onSaveToDatabase,
  isSaved,
  onUpdateForm,
  isEditMode = false,
  onCancelEdit,
}) => {
  const count = selectedPegawai.length;
  const isLampiran = count > 3;

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

  const pembebanan =
    form.pembebanan_anggaran ||
    'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026';
  const defaultPenutup = `Biaya yang timbul akibat Surat Tugas ini dibebankan pada ${pembebanan} sesuai ketentuan yang berlaku.`;

  const menimbangText = form.menimbang_custom !== undefined ? form.menimbang_custom : defaultMenimbang;
  const dasarText = form.dasar_custom !== undefined ? form.dasar_custom : defaultDasar;
  const untukText = form.untuk_custom !== undefined ? form.untuk_custom : defaultUntuk;
  const penutupText = form.penutup_custom !== undefined ? form.penutup_custom : defaultPenutup;

  const jabatanTTD = selectedPejabat.is_default
    ? `${selectedPejabat.jabatan},`
    : `Plh. ${selectedPejabat.jabatan},`;

  // ─── Penskalaan Adaptif 1 Halaman A4 (Font Isi Tetap 12pt Sesuai Ketentuan) ───
  // Ruang tanda tangan manual diperlebar dan dipertinggi agar sangat leluasa untuk ttd basah & cap dinas
  const bodyFontSize = '12pt';
  let bodyLineHeight = '1.28';
  let pagePadding = '24px 72px 20px 82px';
  let sectionMargin = '5px';
  let pegawaiGap = '6px';
  let ttdMargin = '16px';
  let ttdImgHeight = '115px';
  let employeeInnerLineHeight = '1.22';

  if (!isLampiran) {
    if (count === 2) {
      pagePadding = '22px 70px 18px 80px';
      bodyLineHeight = '1.24';
      sectionMargin = '4.5px';
      pegawaiGap = '4px';
      ttdMargin = '14px';
      ttdImgHeight = '105px';
      employeeInnerLineHeight = '1.2';
    } else if (count === 3) {
      pagePadding = '18px 68px 16px 78px';
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

  return (
    <div className="space-y-3">
      {/* ─── Action Bar ─────────────────────────────────────────── */}
      <div className="action-bar-print-hide bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700">Tampilan:</span>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center space-x-1 ${
              isLampiran
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {isLampiran
                ? `Format Lampiran (${count} pegawai > 3)`
                : `A4 1 Halaman Pas (Font 12pt, ${count} Pegawai)`}
            </span>
          </span>

          {hasCustomNarasi && (
            <button
              onClick={handleResetNarasi}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
              title="Reset teks surat ke redaksi otomatis"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Redaksi</span>
            </button>
          )}
        </div>

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
            className="flex items-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Unduh dokumen langsung dalam format file PDF resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
          </button>
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

      {/* Petunjuk Edit Langsung */}
      <div className="action-bar-print-hide flex items-center space-x-1.5 text-[11px] text-teal-800 bg-teal-50/80 px-3 py-1.5 rounded border border-teal-200">
        <Edit3 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span>
          <strong>Fitur Edit Langsung:</strong> Anda dapat mengklik dan mengedit teks <em>Menimbang</em>, <em>Dasar</em>, <em>Untuk</em>, dan <em>Penutup</em> langsung pada lembar surat di bawah ini.
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════
          AREA CETAK & DOKUMEN RESMI (A4)
      ══════════════════════════════════════════════════════ */}
      <div id="surat-tugas-document">
        {/* ── HALAMAN 1 — SURAT TUGAS ──────────────────────────── */}
        <div
          className={`print-page bg-white shadow-md mx-auto print:shadow-none print:border-none ${
            isLampiran ? 'is-lampiran' : 'single-page-locked'
          }`}
          style={{
            ...baseStyle,
            width: '794px',
            height: isLampiran ? 'auto' : '1123px',
            maxHeight: isLampiran ? 'none' : '1123px',
            minHeight: '1123px',
            overflow: isLampiran ? 'visible' : 'hidden',
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
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateForm?.({ menimbang_custom: e.currentTarget.innerText })}
              title="Klik untuk langsung mengedit teks Menimbang"
              className="editable-text-field"
              style={{
                flex: 1,
                textAlign: 'justify',
                lineHeight: bodyLineHeight,
                outline: 'none',
                minHeight: '20px',
              }}
            >
              {menimbangText || (
                <span className="text-slate-300 italic no-print select-none">
                  (Belum ada redaksi Menimbang &mdash; isi nama kegiatan atau gunakan Pindai Undangan AI)
                </span>
              )}
            </div>
          </div>

          {/* ── DASAR ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: sectionMargin }}>
            <div style={{ width: LABEL_W, flexShrink: 0, fontWeight: 'normal' }}>Dasar</div>
            <div style={{ width: COLON_W, flexShrink: 0, textAlign: 'center' }}>:</div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateForm?.({ dasar_custom: e.currentTarget.innerText })}
              title="Klik untuk langsung mengedit teks Dasar"
              className="editable-text-field"
              style={{
                flex: 1,
                textAlign: 'justify',
                lineHeight: bodyLineHeight,
                outline: 'none',
                minHeight: '20px',
              }}
            >
              {dasarText || (
                <span className="text-slate-300 italic no-print select-none">
                  (Belum ada dasar surat undangan &mdash; isi nomor/instansi undangan atau gunakan Pindai Undangan AI)
                </span>
              )}
            </div>
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
            <div style={{ flex: 1, lineHeight: bodyLineHeight }}>
              {count === 0 ? (
                <span className="text-slate-300 italic no-print select-none">
                  (Belum ada pegawai yang dipilih &mdash; silakan pilih pegawai pada daftar formulir)
                </span>
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
                      <div style={{ width: '135px', flexShrink: 0 }}>{String(label)}</div>
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
                            <div style={{ width: '130px', flexShrink: 0 }}>{String(label)}</div>
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
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateForm?.({ untuk_custom: e.currentTarget.innerText })}
              title="Klik untuk langsung mengedit teks Untuk"
              className="editable-text-field"
              style={{
                flex: 1,
                textAlign: 'justify',
                lineHeight: bodyLineHeight,
                outline: 'none',
                minHeight: '20px',
              }}
            >
              {untukText || (
                <span className="text-slate-300 italic no-print select-none">
                  (Belum ada diktum Untuk &mdash; isi kegiatan, waktu, dan lokasi pelaksanaan)
                </span>
              )}
            </div>
          </div>

          {/* ── PENUTUP ────────────────────────────────────────────── */}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateForm?.({ penutup_custom: e.currentTarget.innerText })}
            title="Klik untuk langsung mengedit klausul pembebanan anggaran"
            className="editable-text-field"
            style={{
              textAlign: 'justify',
              lineHeight: bodyLineHeight,
              marginBottom: '3px',
              outline: 'none',
            }}
          >
            {penutupText}
          </div>
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

        </div>

        {/* ── HALAMAN 2 — LAMPIRAN (Hanya jika pegawai > 3) ─────── */}
        {isLampiran && (
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
            {/* Header Lampiran */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '380px', fontSize: '10pt', lineHeight: '1.4' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '80px' }}>Lampiran</div>
                  <div style={{ width: '12px' }}>:</div>
                  <div style={{ flex: 1 }}>Surat Tugas Kepala Pusat Kebijakan Strategis</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '80px' }}>Nomor</div>
                  <div style={{ width: '12px' }}>:</div>
                  <div style={{ flex: 1 }}>{form.nomor_lengkap}</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '80px' }}>Tanggal</div>
                  <div style={{ width: '12px' }}>:</div>
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
      </div>
    </div>
  );
};
