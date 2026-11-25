import React, { useState, useMemo } from 'react';
import {
  FileText,
  Mail,
  ScrollText,
  Sparkles,
  Plus,
  Edit3,
  Copy,
  ExternalLink,
  Search,
  Database,
  CheckCircle2,
  BookOpen,
  Layers,
  ShieldCheck,
  Clock,
  ArrowRight,
  Hash,
  Wifi,
  WifiOff,
  FileCheck2,
} from 'lucide-react';
import {
  JenisNaskah,
  NomorSuratRecord,
  Pegawai,
  Pejabat,
  SuratTugasFormState,
  User,
} from '../types';
import {
  formatTanggalIndonesia,
  stripAcademicTitles,
  cleanTempatField,
} from '../services/docxService';
import { getDefaultKlasifikasi, formatNomorNaskah } from '../services/nomorSuratService';
import { MarkupText } from './RichEditable';

interface HomeViewProps {
  currentUser: User;
  nomorSuratList: NomorSuratRecord[];
  pegawaiList: Pegawai[];
  pejabatList: Pejabat[];
  nextNomorUrut: number;
  nextNomorLengkap: string;
  simulatedMonth: string;
  simulatedYear: number;
  isSheetsConnected: boolean;
  activeFormDraft: SuratTugasFormState;
  isSavedToDB?: boolean;
  editingRecord?: NomorSuratRecord | null;
  onStartCreateNew: (jenis: JenisNaskah, openAiModal?: boolean) => void;
  onContinueDraft: (jenis: JenisNaskah) => void;
  onEditRecentRecord: (rec: NomorSuratRecord) => void;
  onDuplicateAsNewTemplate: (rec: NomorSuratRecord) => void;
  onOpenDatabase: () => void;
  onOpenSheetsConfig: () => void;
}

/**
 * Hitung sidik jari (fingerprint) isi pokok draf naskah untuk mendeteksi secara akurat
 * apakah draf yang tersimpan di perangkat sudah diterbitkan & disimpan ke database/Sheets.
 */
export function getDraftPublishFingerprint(f: SuratTugasFormState): string {
  const jenis = f.jenis_naskah || 'TUGAS';
  const kop = f.kop_tipe || 'pusaka';
  if (jenis === 'UNDANGAN') {
    return [
      'UND',
      kop,
      (f.undangan_hal || '').trim(),
      (f.undangan_kepada || '').trim(),
      (f.undangan_hari_tanggal || f.hari_tanggal_pelaksanaan || '').trim(),
      (f.undangan_waktu || '').trim(),
      (f.undangan_agenda || '').trim(),
      (f.undangan_tempat_offline || '').trim(),
      (f.undangan_tempat_online || '').trim(),
    ].join('||');
  }
  if (jenis === 'NOTA_DINAS') {
    return [
      'ND',
      kop,
      (f.nota_hal || '').trim(),
      (f.nota_kepada || '').trim(),
      (f.nota_dari || '').trim(),
      (f.nota_isi || '').trim(),
      (f.nota_pembuka || '').trim(),
    ].join('||');
  }
  return [
    'ST',
    kop,
    (f.nama_acara || '').trim(),
    (f.nomor_surat_undangan || '').trim(),
    (f.instansi_pengundang || '').trim(),
    (f.tanggal_mulai || '').trim(),
    (f.lokasi_kegiatan || '').trim(),
    (f.menimbang_custom || '').trim(),
    (f.dasar_custom || '').trim(),
    (f.untuk_custom || '').trim(),
    (f.selectedPegawaiIds || []).join(','),
  ].join('||');
}

/**
 * Rekonstruksi SuratTugasFormState lengkap dari NomorSuratRecord
 * agar preview dokumen di kartu Recent 100% sama persis dengan dokumen yang diterbitkan.
 */
export function buildFormStateFromRecord(
  rec: NomorSuratRecord,
  pegawaiList: Pegawai[],
  pejabatList: Pejabat[],
  simulatedMonth: string,
  simulatedYear: number
): SuratTugasFormState {
  if (rec.form_state) {
    return rec.form_state;
  }

  const defaultPejabat = pejabatList.find((p) => p.is_default) || pejabatList[0];
  const rawJenis = (rec.jenis_naskah || rec.jenis || 'TUGAS').toUpperCase();
  const jenisNaskah: JenisNaskah = rawJenis.includes('UND')
    ? 'UNDANGAN'
    : rawJenis.includes('ND') || rawJenis.includes('NOTA')
    ? 'NOTA_DINAS'
    : 'TUGAS';

  const defaultKlas = getDefaultKlasifikasi(jenisNaskah);
  const kodeKlas = rec.kode_klasifikasi || defaultKlas.kode_lengkap;
  const bulan = rec.bulan || simulatedMonth;
  const tahun = rec.tahun || simulatedYear;
  const nomorLengkap =
    rec.nomor_lengkap ||
    formatNomorNaskah(jenisNaskah, rec.nomor_urut || 1, kodeKlas, bulan, tahun);

  let matchedPegawaiIds: string[] = rec.pegawai_ids || [];
  if (matchedPegawaiIds.length === 0 && rec.kepada && rec.kepada !== 'Daftar Terlampir') {
    const names = rec.kepada
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    matchedPegawaiIds = pegawaiList
      .filter((p) =>
        names.some((n) => p.nama.toLowerCase().includes(n) || n.includes(p.nama.toLowerCase()))
      )
      .map((p) => p.id);
  }

  let matchedPejabatId = rec.pejabat_id || defaultPejabat?.id || 'pej-1';
  if (!rec.pejabat_id && rec.penandatangan_nama) {
    const pej = pejabatList.find((p) =>
      p.nama.toLowerCase().includes(rec.penandatangan_nama!.toLowerCase())
    );
    if (pej) matchedPejabatId = pej.id;
  }

  let tanggalSurat = rec.tanggal_dibuat || rec.tanggal || rec.tanggal_surat || new Date().toISOString().split('T')[0];
  if (tanggalSurat && !/^\d{4}-\d{2}-\d{2}$/.test(tanggalSurat)) {
    const d = new Date(tanggalSurat);
    if (!isNaN(d.getTime())) {
      tanggalSurat = d.toISOString().split('T')[0];
    }
  }

  const perihal = rec.perihal || '';

  return {
    jenis_naskah: jenisNaskah,
    kop_tipe: 'pusaka',
    kode_klasifikasi: kodeKlas,
    kategori_klasifikasi: rec.kategori_klasifikasi || defaultKlas.kategori_utama,
    uraian_klasifikasi: defaultKlas.uraian,
    nomor_urut: rec.nomor_urut || 1,
    tahun,
    bulan,
    nomor_lengkap: nomorLengkap,
    tanggal_surat: tanggalSurat,
    kota_surat: 'Jakarta',

    // Surat Tugas fields
    nama_acara: perihal,
    nomor_surat_undangan: '',
    tanggal_surat_undangan: '',
    instansi_pengundang: rec.dasar_surat || 'Kementerian Komunikasi dan Digital',
    perihal_undangan: perihal,
    tanggal_mulai: tanggalSurat,
    tanggal_selesai: tanggalSurat,
    waktu_kegiatan: '09.00 WIB s.d. selesai',
    hari_tanggal_pelaksanaan: '',
    lokasi_kegiatan: rec.tujuan_lokasi || 'Jakarta',
    kota_kegiatan: 'Jakarta',
    tujuan_tugas: perihal,
    sertakan_beban_anggaran: true,
    pembebanan_anggaran:
      'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026',

    // Surat Undangan fields
    undangan_sifat: 'Biasa',
    undangan_lampiran: '-',
    undangan_hal: perihal,
    undangan_kepada: rec.kepada || '(Daftar Terlampir)\ndi Tempat',
    undangan_pembuka:
      'Dalam rangka pelaksanaan tugas dan fungsi di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengundang Bapak/Ibu untuk hadir pada kegiatan yang akan dilaksanakan pada:',
    undangan_tipe_tempat: 'offline',
    undangan_tempat_offline: rec.tujuan_lokasi || 'Ruang Rapat Pusat Kebijakan Strategis, Jakarta',
    undangan_waktu: '09.00 WIB s.d. selesai',
    undangan_agenda: perihal || 'Rapat Koordinasi Kebijakan Strategis',
    undangan_penutup:
      'Demikian kami sampaikan, atas perhatian dan kehadiran Bapak/Ibu diucapkan terima kasih.',

    // Nota Dinas fields
    nota_kepada: rec.kepada || 'Sekretaris Jenderal Kementerian Komunikasi dan Digital',
    nota_dari: 'Kepala Pusat Kebijakan Strategis',
    nota_hal: perihal,
    nota_sifat: 'Biasa',
    nota_lampiran: '-',
    nota_isi:
      rec.dasar_surat && rec.dasar_surat !== 'Nota Dinas'
        ? rec.dasar_surat
        : `Sehubungan dengan pelaksanaan ${perihal || 'kegiatan Pusat Kebijakan Strategis'}, bersama ini dengan hormat kami sampaikan laporan dan pokok telaah sebagai bahan pertimbangan pimpinan lebih lanjut.\n\nDemikian disampaikan, atas perhatian dan arahan Bapak/Ibu diucapkan terima kasih.`,

    selectedPegawaiIds: matchedPegawaiIds,
    selectedPejabatId: matchedPejabatId,
    kriteria_peserta: '',
    konseptor: rec.konseptor || '',
  };
}

/**
 * Komponen Miniatur Kertas A4 (794x1123px) yang diskalakan secara presisi
 * sehingga menampilkan isi surat beserta opsi Kop Surat sama persis seperti dokumen terbitan.
 */
const MiniA4Preview: React.FC<{
  form: SuratTugasFormState;
  pegawaiList: Pegawai[];
  pejabatList: Pejabat[];
  scale?: number;
}> = ({ form, pegawaiList, pejabatList, scale = 0.275 }) => {
  const jenis = form.jenis_naskah || 'TUGAS';
  const kopTipe = form.kop_tipe || 'pusaka';
  const selectedPegawai = useMemo(
    () => pegawaiList.filter((p) => (form.selectedPegawaiIds || []).includes(p.id)),
    [pegawaiList, form.selectedPegawaiIds]
  );
  const selectedPejabat = useMemo(
    () =>
      pejabatList.find((p) => p.id === form.selectedPejabatId) ||
      pejabatList.find((p) => p.is_default) ||
      pejabatList[0],
    [pejabatList, form.selectedPejabatId]
  );

  const count = selectedPegawai.length;
  const isLampiran = jenis === 'TUGAS' && count > 3;

  const tglSuratFormatted =
    form.custom_tanggal_surat_text ||
    (form.tanggal_surat ? formatTanggalIndonesia(form.tanggal_surat) : '');
  const kotaTanggalFormatted = `${form.kota_surat || 'Jakarta'}, ${tglSuratFormatted}`;

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
        ? `${form.instansi_pengundang}${form.nomor_surat_undangan ? ' Nomor : ' + form.nomor_surat_undangan : ''}${
            form.tanggal_surat_undangan
              ? ' tanggal ' + formatTanggalIndonesia(form.tanggal_surat_undangan)
              : ''
          }.`
        : `Nomor ${form.nomor_surat_undangan}.`
      : '-';

  const defaultMenimbang = form.nama_acara
    ? `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${form.nama_acara}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`
    : 'Bahwa dalam rangka mendukung kelancaran pelaksanaan tugas kedinasan, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.';

  const defaultUntuk =
    form.nama_acara || form.lokasi_kegiatan || form.tanggal_mulai
      ? `Mengikuti kegiatan ${form.nama_acara || '...'}${rentangTanggal ? ' yang dilaksanakan pada ' + rentangTanggal : ''}${
          form.lokasi_kegiatan ? ' di ' + form.lokasi_kegiatan : ''
        }${form.kota_kegiatan ? ', ' + form.kota_kegiatan : ''}.`
      : 'Mengikuti kegiatan kedinasan sesuai penugasan.';

  const menimbangText = form.menimbang_custom !== undefined ? form.menimbang_custom : defaultMenimbang;
  const dasarText = form.dasar_custom !== undefined ? form.dasar_custom : defaultDasar;
  const untukText = form.untuk_custom !== undefined ? form.untuk_custom : defaultUntuk;
  const sertakanBeban = form.sertakan_beban_anggaran !== false;
  const pembebanan =
    form.pembebanan_anggaran ||
    'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026';
  const defaultPenutup = sertakanBeban
    ? `Biaya yang timbul akibat Surat Tugas ini dibebankan pada ${pembebanan} sesuai ketentuan yang berlaku.`
    : '';
  const penutupText = form.penutup_custom !== undefined ? form.penutup_custom : defaultPenutup;

  const jabatanTTD =
    form.custom_jabatan_ttd ||
    (selectedPejabat?.is_default
      ? `${selectedPejabat.jabatan},`
      : `Plh. ${selectedPejabat?.jabatan || 'Kepala Pusat Kebijakan Strategis'},`);
  const namaPejabatClean = stripAcademicTitles(
    form.custom_nama_ttd || selectedPejabat?.nama || ''
  );

  const notaIsiCombined =
    form.nota_isi || [form.nota_pembuka, form.nota_penutup].filter(Boolean).join('\n\n') || '';
  const notaParagraphs = notaIsiCombined
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div
      className="relative overflow-hidden bg-white select-none pointer-events-none mx-auto"
      style={{
        width: `${Math.round(794 * scale)}px`,
        height: `${Math.round(920 * scale)}px`,
      }}
    >
      <div
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12pt',
          lineHeight: '1.28',
          padding: '24px 72px 64px 82px',
          boxSizing: 'border-box',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* KOP SURAT RESMI KOMDIGI (3 OPSI) */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '14px', marginBottom: '1px' }}>
          <img
            src="/komdigi_logo.png"
            alt="Logo Komdigi"
            style={{ width: '130px', height: 'auto', display: 'block', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {kopTipe === 'sekjen' ? (
              <div style={{ paddingTop: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15pt', lineHeight: '1.25', color: '#000' }}>
                  KEMENTERIAN KOMUNIKASI DAN DIGITAL RI
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '15pt', lineHeight: '1.25', marginTop: '4px', color: '#000' }}>
                  SEKRETARIAT JENDERAL
                </div>
              </div>
            ) : kopTipe === 'djed' ? (
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14.5pt', lineHeight: '1.22', color: '#000' }}>
                  KEMENTERIAN KOMUNIKASI DAN DIGITAL RI
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14pt', lineHeight: '1.22', color: '#000' }}>
                  DIREKTORAT JENDERAL EKOSISTEM DIGITAL
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '10.8pt', lineHeight: '1.25', whiteSpace: 'nowrap', color: '#000' }}>
                  SEKRETARIAT DIREKTORAT JENDERAL EKOSISTEM DIGITAL
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15pt', lineHeight: '1.2', color: '#000' }}>
                  KEMENTERIAN KOMUNIKASI DAN DIGITAL RI
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '15pt', lineHeight: '1.2', color: '#000' }}>
                  SEKRETARIAT JENDERAL
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14.5pt', lineHeight: '1.2', color: '#000' }}>
                  PUSAT KEBIJAKAN STRATEGIS
                </div>
              </div>
            )}
            <div style={{ fontSize: '8.6pt', lineHeight: '1.15', marginTop: '10px', color: '#000' }}>
              Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735{' '}
              <span style={{ textDecoration: 'underline' }}>www.komdigi.go.id</span>
            </div>
          </div>
        </div>

        {/* Garis Ganda Kop */}
        <div style={{ borderBottom: '2.5px solid #000', marginBottom: '1.5px' }} />
        <div style={{ borderBottom: '0.75px solid #000', marginBottom: '14px' }} />

        {/* ISI BERDASARKAN JENIS NASKAH */}
        {jenis === 'UNDANGAN' ? (
          <div style={{ fontSize: '12pt', lineHeight: '1.42' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '62%' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '85px', flexShrink: 0 }}>Nomor</div>
                  <div style={{ width: '14px', textAlign: 'center' }}>:</div>
                  <div style={{ flex: 1 }}>{form.nomor_lengkap || '-'}</div>
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
                  <div style={{ flex: 1, fontWeight: 600 }}>{form.undangan_hal || form.nama_acara || '-'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', width: '36%' }}>{kotaTanggalFormatted}</div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div>Kepada Yth.</div>
              <div style={{ whiteSpace: 'pre-line', fontWeight: 600 }}>
                {form.undangan_kepada || '(Daftar Terlampir)\ndi Tempat'}
              </div>
            </div>

            <div style={{ textAlign: 'justify', textIndent: '32px', marginBottom: '10px' }}>
              <MarkupText
                text={
                  form.undangan_pembuka ||
                  'Dalam rangka kelancaran pelaksanaan tugas dan fungsi di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengundang Bapak/Ibu untuk hadir pada kegiatan yang akan dilaksanakan pada:'
                }
              />
            </div>

            <div style={{ margin: '8px 0 12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '120px', flexShrink: 0 }}>Hari, Tanggal</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>
                  {form.undangan_hari_tanggal || form.hari_tanggal_pelaksanaan || tglSuratFormatted}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '120px', flexShrink: 0 }}>Waktu</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>{form.undangan_waktu || form.waktu_kegiatan || '09.00 WIB s.d. selesai'}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '120px', flexShrink: 0 }}>Tempat</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>
                  {form.undangan_tipe_tempat === 'online'
                    ? `Online via ${cleanTempatField(form.undangan_tempat_online, 'online')}`
                    : cleanTempatField(form.undangan_tempat_offline || form.lokasi_kegiatan, 'offline') || 'Jakarta'}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '120px', flexShrink: 0 }}>Agenda</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>{form.undangan_agenda || form.undangan_hal || '-'}</div>
              </div>
            </div>

            <div style={{ textAlign: 'justify', textIndent: '32px', marginBottom: '16px' }}>
              <MarkupText
                text={
                  form.undangan_penutup ||
                  'Demikian kami sampaikan, atas perhatian dan kehadiran Bapak/Ibu diucapkan terima kasih.'
                }
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px', textAlign: 'center' }}>
                <div>{jabatanTTD}</div>
                <div style={{ height: '65px' }} />
                <div>{namaPejabatClean}</div>
              </div>
            </div>
          </div>
        ) : jenis === 'NOTA_DINAS' ? (
          <div style={{ fontSize: '12pt', lineHeight: '1.42' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline', letterSpacing: '0.05em' }}>
                NOTA DINAS
              </div>
              <div>Nomor: {form.nomor_lengkap || '-'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0 10px 0' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '110px', flexShrink: 0 }}>Kepada Yth.</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>{form.nota_kepada || 'Sekretaris Jenderal'}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '110px', flexShrink: 0 }}>Dari</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1 }}>{form.nota_dari || 'Kepala Pusat Kebijakan Strategis'}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '110px', flexShrink: 0 }}>Hal</div>
                <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                <div style={{ flex: 1, fontWeight: 600 }}>{form.nota_hal || form.nama_acara || '-'}</div>
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

            <div style={{ borderBottom: '1px solid #000', margin: '6px 0 10px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'justify' }}>
              {notaParagraphs.map((line, i) => {
                const isNumbered = /^\d+[\.\)]\s+/.test(line);
                return (
                  <div
                    key={i}
                    style={{
                      textIndent: isNumbered ? '-22px' : '32px',
                      paddingLeft: isNumbered ? '22px' : '0px',
                      lineHeight: '1.4',
                    }}
                  >
                    <MarkupText text={line} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <div style={{ width: '260px', textAlign: 'center' }}>
                <div>{jabatanTTD}</div>
                <div style={{ height: '60px' }} />
                <div>{namaPejabatClean}</div>
              </div>
            </div>
          </div>
        ) : (
          /* SURAT TUGAS */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline', letterSpacing: '0.05em' }}>
                SURAT TUGAS
              </div>
              <div>Nomor: {form.nomor_lengkap || '-'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
              <div style={{ width: '84px', flexShrink: 0 }}>Menimbang</div>
              <div style={{ width: '16px', textAlign: 'center' }}>:</div>
              <div style={{ flex: 1, textAlign: 'justify' }}>
                <MarkupText text={menimbangText} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
              <div style={{ width: '84px', flexShrink: 0 }}>Dasar</div>
              <div style={{ width: '16px', textAlign: 'center' }}>:</div>
              <div style={{ flex: 1, textAlign: 'justify' }}>
                <MarkupText text={dasarText} />
              </div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '6px 0' }}>
              MEMBERI TUGAS:
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
              <div style={{ width: '84px', flexShrink: 0 }}>Kepada</div>
              <div style={{ width: '16px', textAlign: 'center' }}>:</div>
              <div style={{ flex: 1 }}>
                {count === 0 ? (
                  <div>{form.custom_kepada_tugas || '(Daftar Pegawai)'}</div>
                ) : isLampiran ? (
                  <div>{form.custom_kepada_tugas || '(Daftar Terlampir)'}</div>
                ) : count === 1 ? (
                  <div>
                    {[
                      ['Nama', stripAcademicTitles(selectedPegawai[0].nama)],
                      ['NIP', selectedPegawai[0].nip],
                      ['Pangkat, Gol/Ruang', selectedPegawai[0].pangkat_golongan],
                      ['Jabatan', selectedPegawai[0].jabatan],
                    ].map(([lbl, v]) => (
                      <div key={lbl} style={{ display: 'flex' }}>
                        <div style={{ width: '156px', flexShrink: 0 }}>{lbl}</div>
                        <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                        <div style={{ flex: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedPegawai.slice(0, 3).map((peg, idx) => (
                      <div key={peg.id} style={{ display: 'flex' }}>
                        <div style={{ width: '18px', flexShrink: 0 }}>{idx + 1}.</div>
                        <div style={{ flex: 1 }}>
                          {[
                            ['Nama', stripAcademicTitles(peg.nama)],
                            ['NIP', peg.nip],
                            ['Pangkat, Gol/Ruang', peg.pangkat_golongan],
                            ['Jabatan', peg.jabatan],
                          ].map(([lbl, v]) => (
                            <div key={lbl} style={{ display: 'flex' }}>
                              <div style={{ width: '156px', flexShrink: 0 }}>{lbl}</div>
                              <div style={{ width: '16px', textAlign: 'center' }}>:</div>
                              <div style={{ flex: 1 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
              <div style={{ width: '84px', flexShrink: 0 }}>Untuk</div>
              <div style={{ width: '16px', textAlign: 'center' }}>:</div>
              <div style={{ flex: 1, textAlign: 'justify' }}>
                <MarkupText text={untukText} />
              </div>
            </div>

            {penutupText && (
              <div style={{ textAlign: 'justify', marginBottom: '3px' }}>
                <MarkupText text={penutupText} />
              </div>
            )}
            <div style={{ textAlign: 'justify', marginBottom: '12px' }}>
              {form.custom_kalimat_penutup_tugas ||
                'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px', textAlign: 'center' }}>
                <div>{kotaTanggalFormatted}</div>
                <div>{jabatanTTD}</div>
                <div style={{ height: '65px' }} />
                <div>{namaPejabatClean}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom fade subtle indicator */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
    </div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  nomorSuratList,
  pegawaiList,
  pejabatList,
  nextNomorUrut,
  nextNomorLengkap,
  simulatedMonth,
  simulatedYear,
  isSheetsConnected,
  activeFormDraft,
  isSavedToDB = false,
  editingRecord = null,
  onStartCreateNew,
  onContinueDraft,
  onEditRecentRecord,
  onDuplicateAsNewTemplate,
  onOpenDatabase,
  onOpenSheetsConfig,
}) => {
  const [recentFilter, setRecentFilter] = useState<'ALL' | 'TUGAS' | 'UNDANGAN' | 'NOTA_DINAS'>('ALL');
  const [recentSearch, setRecentSearch] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Cek draf yang tersimpan di perangkat beserta status apakah draf tersebut SUDAH TERBIT atau BELUM TERBIT
  const savedDrafts = useMemo(() => {
    const drafts: Array<{
      jenis: JenisNaskah;
      form: SuratTugasFormState;
      title: string;
      isPublished: boolean;
      matchedRecord?: NomorSuratRecord;
    }> = [];
    const jenisList: JenisNaskah[] = ['TUGAS', 'UNDANGAN', 'NOTA_DINAS'];

    for (const j of jenisList) {
      let draftObj: SuratTugasFormState | null = null;
      if ((activeFormDraft.jenis_naskah || 'TUGAS') === j) {
        draftObj = activeFormDraft;
      } else {
        try {
          const raw = localStorage.getItem(`pusaka_draft_${j}`);
          if (raw) draftObj = JSON.parse(raw);
        } catch {}
      }

      if (draftObj) {
        const normalizedDraft: SuratTugasFormState = { ...draftObj, jenis_naskah: j };
        const hasContent =
          j === 'TUGAS'
            ? Boolean(
                normalizedDraft.nama_acara?.trim() ||
                  normalizedDraft.menimbang_custom?.trim() ||
                  (normalizedDraft.selectedPegawaiIds && normalizedDraft.selectedPegawaiIds.length > 0)
              )
            : j === 'UNDANGAN'
            ? Boolean(normalizedDraft.undangan_hal?.trim() || normalizedDraft.undangan_agenda?.trim())
            : Boolean(normalizedDraft.nota_hal?.trim() || normalizedDraft.nota_isi?.trim());

        if (hasContent) {
          const title =
            j === 'TUGAS'
              ? normalizedDraft.nama_acara || 'Draf Surat Tugas'
              : j === 'UNDANGAN'
              ? normalizedDraft.undangan_hal || 'Draf Surat Undangan'
              : normalizedDraft.nota_hal || 'Draf Nota Dinas';

          const draftFp = getDraftPublishFingerprint(normalizedDraft);
          const isCurrentActiveTab = (activeFormDraft.jenis_naskah || 'TUGAS') === j;

          // Cari apakah dokumen dengan sidik jari atau nomor_lengkap terbitan ini sudah ada di nomorSuratList
          const matchedRecord = nomorSuratList.find((rec) => {
            if (rec.form_state && getDraftPublishFingerprint(rec.form_state) === draftFp) {
              return true;
            }
            if (
              normalizedDraft.published_nomor_lengkap &&
              rec.nomor_lengkap === normalizedDraft.published_nomor_lengkap &&
              normalizedDraft.published_fingerprint === draftFp
            ) {
              return true;
            }
            // Cek kecocokan perihal & jenis jika dari data sinkronisasi
            const recJenisRaw = (rec.jenis_naskah || rec.jenis || 'TUGAS').toUpperCase();
            const recJenis: JenisNaskah = recJenisRaw.includes('UND')
              ? 'UNDANGAN'
              : recJenisRaw.includes('ND') || recJenisRaw.includes('NOTA')
              ? 'NOTA_DINAS'
              : 'TUGAS';
            if (
              recJenis === j &&
              rec.perihal &&
              title &&
              rec.perihal.trim().toLowerCase() === title.trim().toLowerCase() &&
              rec.nomor_lengkap === normalizedDraft.nomor_lengkap
            ) {
              return true;
            }
            return false;
          });

          const isPublished = Boolean(
            matchedRecord ||
              (normalizedDraft.published_fingerprint &&
                normalizedDraft.published_fingerprint === draftFp) ||
              (isCurrentActiveTab && isSavedToDB) ||
              (isCurrentActiveTab &&
                editingRecord &&
                getDraftPublishFingerprint(
                  buildFormStateFromRecord(
                    editingRecord,
                    pegawaiList,
                    pejabatList,
                    simulatedMonth,
                    simulatedYear
                  )
                ) === draftFp)
          );

          const effectiveDisplayForm: SuratTugasFormState = isPublished
            ? {
                ...normalizedDraft,
                nomor_lengkap:
                  normalizedDraft.published_nomor_lengkap ||
                  matchedRecord?.nomor_lengkap ||
                  normalizedDraft.nomor_lengkap,
              }
            : normalizedDraft;

          drafts.push({
            jenis: j,
            form: effectiveDisplayForm,
            title,
            isPublished,
            matchedRecord,
          });
        }
      }
    }
    return drafts;
  }, [
    activeFormDraft,
    nomorSuratList,
    isSavedToDB,
    editingRecord,
    pegawaiList,
    pejabatList,
    simulatedMonth,
    simulatedYear,
  ]);

  // Urutkan dokumen terbitan dari yang paling baru (nomor_urut terbesar di atas)
  const sortedRecentRecords = useMemo(() => {
    const getJenisFromRec = (rec: NomorSuratRecord): JenisNaskah => {
      const val = (rec.jenis_naskah || rec.jenis || '').toUpperCase();
      if (val.includes('UND')) return 'UNDANGAN';
      if (val.includes('ND') || val.includes('NOTA')) return 'NOTA_DINAS';
      return 'TUGAS';
    };

    return [...nomorSuratList]
      .filter((rec) => {
        const j = getJenisFromRec(rec);
        if (recentFilter !== 'ALL' && j !== recentFilter) return false;
        if (recentSearch.trim()) {
          const q = recentSearch.toLowerCase();
          const matchNo =
            String(rec.nomor_urut || '').includes(q) ||
            (rec.nomor_lengkap || '').toLowerCase().includes(q);
          const matchHal = (rec.perihal || '').toLowerCase().includes(q);
          const matchKepada = (rec.kepada || '').toLowerCase().includes(q);
          const matchKonseptor = (rec.konseptor || '').toLowerCase().includes(q);
          return matchNo || matchHal || matchKepada || matchKonseptor;
        }
        return true;
      })
      .sort((a, b) => {
        const noA =
          typeof a.nomor_urut === 'number'
            ? a.nomor_urut
            : parseInt(String(a.nomor_urut || '0').replace(/\D/g, ''), 10) || 0;
        const noB =
          typeof b.nomor_urut === 'number'
            ? b.nomor_urut
            : parseInt(String(b.nomor_urut || '0').replace(/\D/g, ''), 10) || 0;
        if (noA !== noB) return noB - noA;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [nomorSuratList, recentFilter, recentSearch]);

  const displayedRecords = useMemo(
    () => sortedRecentRecords.slice(0, visibleCount),
    [sortedRecentRecords, visibleCount]
  );

  // Statistik ringkas per jenis surat
  const stats = useMemo(() => {
    let st = 0;
    let und = 0;
    let nd = 0;
    nomorSuratList.forEach((rec) => {
      const val = (rec.jenis_naskah || rec.jenis || '').toUpperCase();
      if (val.includes('UND')) und++;
      else if (val.includes('ND') || val.includes('NOTA')) nd++;
      else st++;
    });
    return { total: nomorSuratList.length, st, und, nd };
  }, [nomorSuratList]);

  return (
    <div className="space-y-8 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════════
          ZONA 1: HERO BANNER & STATUS RINGKAS (NATURAL NEUTRAL GLASSMORPHISM)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="nn-card rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative glass glow inside Hero */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#2F6B57]/12 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-[#B07234]/10 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Kiri: Sapaan & Identitas Sistem */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-2 bg-[#DDF0E7]/90 border border-[#B2D8C5] px-3 py-1 rounded-full text-[11px] font-bold text-[#1F4A3A] shadow-2xs">
              <span>🏛️ Pusat Kebijakan Strategis &bull; Komdigi RI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#242320] tracking-tight">
              Selamat Bertugas, {currentUser.nama}
            </h1>
            <p className="text-xs sm:text-sm text-[#545049] font-normal max-w-2xl leading-relaxed">
              Pilih jenis naskah dinas yang ingin Anda susun hari ini, gunakan asisten{' '}
              <strong className="text-[#1F4A3A] font-semibold">Multimodal AI</strong> untuk menyusun surat dari berkas atau prompt, maupun lanjutkan pekerjaan terakhir dengan nyaman.
            </p>
          </div>

          {/* Kanan: Quick Stats Frosted Accent Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-gradient-to-br from-[#FDF4E3]/92 to-[#F7E6C8]/80 backdrop-blur-md border border-white/85 shadow-[0_4px_14px_rgba(168,106,45,0.10)] rounded-2xl p-3.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#825221] flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-[#A86A2D]" />
                <span>Nomor Berikutnya</span>
              </div>
              <div className="text-xl font-bold text-[#242320] font-mono mt-1">
                #{nextNomorUrut}
              </div>
              <div className="text-[10px] font-mono font-medium text-[#6E563B] truncate mt-0.5" title={nextNomorLengkap}>
                {nextNomorLengkap}
              </div>
            </div>

            <div
              onClick={onOpenDatabase}
              className="bg-gradient-to-br from-[#ECF1F8]/92 to-[#DDE6F2]/80 hover:from-[#E3ECF7] hover:to-[#D2DFEF] backdrop-blur-md border border-white/85 shadow-[0_4px_14px_rgba(61,82,117,0.10)] rounded-2xl p-3.5 cursor-pointer transition-all"
              title="Klik untuk membuka Buku Agenda & Database"
            >
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#35496B] flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-[#3D5275]" />
                <span>Total Arsip Naskah</span>
              </div>
              <div className="text-xl font-bold text-[#242320] font-mono mt-1">
                {stats.total} <span className="text-xs font-sans font-semibold text-[#4D5A70]">Surat</span>
              </div>
              <div className="text-[10px] font-semibold text-[#3D5275] mt-0.5">
                {stats.st} ST &bull; {stats.und} UND &bull; {stats.nd} ND
              </div>
            </div>

            <div
              onClick={onOpenSheetsConfig}
              className={`col-span-2 sm:col-span-1 backdrop-blur-md border border-white/85 rounded-2xl p-3.5 cursor-pointer transition-all ${
                isSheetsConnected
                  ? 'bg-gradient-to-br from-[#E2F3EB]/92 to-[#CDE8DB]/82 hover:from-[#D5EDE2] hover:to-[#C0E2D2] shadow-[0_4px_14px_rgba(47,107,87,0.11)]'
                  : 'bg-gradient-to-br from-[#FCEAD2]/92 to-[#F6DCBA]/82 hover:from-[#F9E1C2] hover:to-[#F1D1A8] shadow-[0_4px_14px_rgba(168,106,45,0.11)]'
              }`}
              title="Klik untuk konfigurasi Google Sheets & Google Drive"
            >
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#244E3E] flex items-center space-x-1">
                {isSheetsConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-[#2F6B57]" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#A86A2D]" />
                )}
                <span>Sinkronisasi Cloud</span>
              </div>
              <div className="text-sm font-bold text-[#242320] mt-1">
                {isSheetsConnected ? 'Sheets & Drive Aktif' : 'Cek Koneksi Cloud'}
              </div>
              <div className="text-[10px] font-medium text-[#4A5952] mt-0.5">
                {pegawaiList.length} Pegawai &bull; {pejabatList.length} Pejabat
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ZONA 2: CARD CHOICE JENIS SURAT ("MULAI BUAT NASKAH DINAS BARU")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#242320] flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-[#2F6B57] text-white shadow-[0_2px_6px_rgba(47,107,87,0.3)] flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Pilih Jenis Naskah Dinas yang Ingin Dibuat</span>
          </h2>
          <p className="text-xs text-[#524E46] font-medium mt-0.5 ml-8">
            Mulai dari formulir manual yang terstruktur, atau gunakan tombol AI untuk menyusun surat beserta lampirannya secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: SURAT TUGAS */}
          <div className="nn-card nn-card-interactive rounded-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div
                className="border-b border-white/75 px-5 py-4 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(47, 107, 87, 0.20) 0%, rgba(47, 107, 87, 0.07) 100%)',
                }}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#2F6B57] text-white shadow-[0_4px_12px_rgba(47,107,87,0.32)] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-white/85 border border-[#B2D8C5] rounded-md text-[#1F4A3A]">
                      KODE: KP.01.06
                    </span>
                    <h3 className="text-base font-bold text-[#242320] mt-0.5">Surat Tugas</h3>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs text-[#4F4B44]">
                <p className="leading-relaxed font-medium">
                  Naskah penugasan resmi pegawai untuk menghadiri rapat, dinas luar, forum koordinasi, atau kegiatan kedinasan.
                </p>
                <ul className="space-y-1.5 text-[11.5px] font-semibold text-[#2E2C28]">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6B57] shrink-0" />
                    <span>1–3 Pegawai otomatis proporsional 1 halaman A4</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6B57] shrink-0" />
                    <span>&gt;3 Pegawai otomatis membuat Tabel Lampiran</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6B57] shrink-0" />
                    <span>Ekstraksi surat undangan masuk via AI</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onStartCreateNew('TUGAS', false)}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-b from-[#367560] to-[#285A48] hover:from-[#2E6653] hover:to-[#204A3B] text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-[0_4px_12px_rgba(47,107,87,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Surat Tugas</span>
              </button>
              <button
                type="button"
                onClick={() => onStartCreateNew('TUGAS', true)}
                className="flex items-center justify-center space-x-1.5 bg-white/85 hover:bg-[#DDF0E7] text-[#1F4A3A] font-semibold text-xs py-2.5 px-3 rounded-xl border border-[#B2D8C5] shadow-2xs cursor-pointer"
                title="Langsung buka pemindai dokumen / prompt AI untuk Surat Tugas"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2F6B57]" />
                <span>Via AI</span>
              </button>
            </div>
          </div>

          {/* CARD 2: SURAT UNDANGAN */}
          <div className="nn-card nn-card-interactive rounded-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div
                className="border-b border-white/75 px-5 py-4 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 106, 45, 0.22) 0%, rgba(168, 106, 45, 0.07) 100%)',
                }}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#A86A2D] text-white shadow-[0_4px_12px_rgba(168,106,45,0.32)] flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-white/85 border border-[#E6C9A2] rounded-md text-[#7A4819]">
                      INTERNAL / EKSTERNAL
                    </span>
                    <h3 className="text-base font-bold text-[#242320] mt-0.5">Surat Undangan</h3>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs text-[#4F4B44]">
                <p className="leading-relaxed font-medium">
                  Naskah undangan rapat koordinasi, FGD, atau acara resmi yang diselenggarakan oleh unit kerja.
                </p>
                <ul className="space-y-1.5 text-[11.5px] font-semibold text-[#2E2C28]">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A86A2D] shrink-0" />
                    <span>Mode tempat Luring (Offline), Daring, &amp; Hybrid</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A86A2D] shrink-0" />
                    <span>Lampiran Daftar Pejabat/Tamu &amp; Rundown Acara</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A86A2D] shrink-0" />
                    <span>Susun undangan + rundown otomatis via Prompt AI</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onStartCreateNew('UNDANGAN', false)}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-b from-[#B37334] to-[#915A23] hover:from-[#9E642B] hover:to-[#7C4C1C] text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-[0_4px_12px_rgba(168,106,45,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Surat Undangan</span>
              </button>
              <button
                type="button"
                onClick={() => onStartCreateNew('UNDANGAN', true)}
                className="flex items-center justify-center space-x-1.5 bg-white/85 hover:bg-[#FCEAD2] text-[#7A4819] font-semibold text-xs py-2.5 px-3 rounded-xl border border-[#E6C9A2] shadow-2xs cursor-pointer"
                title="Langsung buka pemindai TOR / prompt AI untuk Surat Undangan"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A86A2D]" />
                <span>Via AI</span>
              </button>
            </div>
          </div>

          {/* CARD 3: NOTA DINAS */}
          <div className="nn-card nn-card-interactive rounded-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div
                className="border-b border-white/75 px-5 py-4 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(61, 82, 117, 0.22) 0%, rgba(61, 82, 117, 0.07) 100%)',
                }}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#3D5275] text-white shadow-[0_4px_12px_rgba(61,82,117,0.32)] flex items-center justify-center">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-white/85 border border-[#BCCAE0] rounded-md text-[#2D4263]">
                      KLASIFIKASI CERDAS
                    </span>
                    <h3 className="text-base font-bold text-[#242320] mt-0.5">Nota Dinas</h3>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs text-[#4F4B44]">
                <p className="leading-relaxed font-medium">
                  Naskah dinas internal untuk penyampaian laporan, telaah kebijakan, usulan, atau permohonan arahan pimpinan.
                </p>
                <ul className="space-y-1.5 text-[11.5px] font-semibold text-[#2E2C28]">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3D5275] shrink-0" />
                    <span>Rekomendasi kode klasifikasi Fasilitatif/Substantif</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3D5275] shrink-0" />
                    <span>Otomatisasi struktur Latar Belakang, Pokok &amp; Penutup</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3D5275] shrink-0" />
                    <span>Mendukung multi-halaman &amp; lampiran PDF merger</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onStartCreateNew('NOTA_DINAS', false)}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-b from-[#465E85] to-[#354868] hover:from-[#3C5175] hover:to-[#2B3B56] text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-[0_4px_12px_rgba(61,82,117,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Nota Dinas</span>
              </button>
              <button
                type="button"
                onClick={() => onStartCreateNew('NOTA_DINAS', true)}
                className="flex items-center justify-center space-x-1.5 bg-white/85 hover:bg-[#E4ECF7] text-[#2D4263] font-semibold text-xs py-2.5 px-3 rounded-xl border border-[#BCCAE0] shadow-2xs cursor-pointer"
                title="Langsung buka pemindai laporan / prompt AI untuk Nota Dinas"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3D5275]" />
                <span>Via AI</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ZONA 3: DOKUMEN TERAKHIR & DRAF (LIVE MINIATURE A4 PAPER PREVIEW)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#242320] flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-[#2F6B57] text-white shadow-[0_2px_6px_rgba(47,107,87,0.3)] flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Dokumen Terakhir &amp; Draf Tersimpan (Live Preview)</span>
            </h2>
            <p className="text-xs text-[#524E46] font-medium mt-0.5 ml-8">
              Pratinjau menampilkan wujud asli naskah dinas. Klik kartu untuk membuka &amp; mengedit isinya secara utuh, atau jadikan template surat baru.
            </p>
          </div>

          {/* Filter Tab & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/55 backdrop-blur-md p-1 rounded-xl border border-white/75 shadow-2xs">
              {(
                [
                  ['ALL', 'Semua'],
                  ['TUGAS', 'Surat Tugas'],
                  ['UNDANGAN', 'Undangan'],
                  ['NOTA_DINAS', 'Nota Dinas'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRecentFilter(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                    recentFilter === key
                      ? 'bg-[#2F6B57] text-white shadow-2xs'
                      : 'text-[#524E46] hover:text-[#242320] hover:bg-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#787268] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                placeholder="Cari nomor / perihal..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl w-48 sm:w-56 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SUB-SECTION: DRAF SEDANG DIKERJAKAN (AUTO-SAVED DI PERANGKAT ANDA) */}
        {savedDrafts.length > 0 && !recentSearch && (
          <div className="nn-card rounded-3xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#242320]">
                <Clock className="w-4 h-4 text-[#2F6B57]" />
                <span>Draf Sedang Dikerjakan (Auto-Saved di Perangkat Anda)</span>
              </div>
              <span className="text-[11px] font-medium text-[#5C5850]">
                Status terbit otomatis menyesuaikan saat dokumen disimpan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedDrafts
                .filter((d) => recentFilter === 'ALL' || d.jenis === recentFilter)
                .map((draft) => {
                  const badgePill =
                    draft.jenis === 'UNDANGAN'
                      ? 'bg-[#A86A2D] text-white'
                      : draft.jenis === 'NOTA_DINAS'
                      ? 'bg-[#3D5275] text-white'
                      : 'bg-[#2F6B57] text-white';
                  const jenisLabel =
                    draft.jenis === 'UNDANGAN'
                      ? 'Surat Undangan'
                      : draft.jenis === 'NOTA_DINAS'
                      ? 'Nota Dinas'
                      : 'Surat Tugas';

                  const handleOpenDraftItem = () => {
                    if (draft.isPublished && draft.matchedRecord) {
                      onEditRecentRecord(draft.matchedRecord);
                    } else {
                      onContinueDraft(draft.jenis);
                    }
                  };

                  return (
                    <div
                      key={`draft-${draft.jenis}`}
                      onClick={handleOpenDraftItem}
                      className="group bg-white/80 hover:bg-white/95 backdrop-blur-lg border border-white/85 rounded-2xl shadow-[0_6px_20px_-4px_rgba(34,31,26,0.10)] hover:shadow-[0_14px_30px_-6px_rgba(34,31,26,0.15)] transition-all overflow-hidden flex flex-col cursor-pointer"
                    >
                      {/* Thumbnail Kertas A4 Asli */}
                      <div className="bg-[#C8C0B1]/55 border-b border-white/75 p-3 flex justify-center items-start relative overflow-hidden">
                        <div className="border border-[#BFB7A8] rounded-xs shadow-[0_4px_14px_rgba(30,28,24,0.12)] bg-white overflow-hidden">
                          <MiniA4Preview
                            form={draft.form}
                            pegawaiList={pegawaiList}
                            pejabatList={pejabatList}
                            scale={0.26}
                          />
                        </div>
                        <span
                          className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${badgePill}`}
                        >
                          {jenisLabel}
                        </span>

                        {draft.isPublished ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF0E7] text-[#1B4938] border border-[#9ECDB6] shadow-sm flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Sudah Terbit</span>
                          </span>
                        ) : (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCEAD2] text-[#7A4819] border border-[#E3BE8E] shadow-sm">
                            Belum Terbit
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <div className="text-[11px] font-mono font-semibold text-[#66625B] truncate">
                            {draft.form.nomor_lengkap || nextNomorLengkap}
                          </div>
                          <h4 className="text-xs font-bold text-[#242320] line-clamp-2 mt-0.5 leading-snug">
                            {draft.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDraftItem();
                          }}
                          className={`w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                            draft.isPublished
                              ? 'bg-[#DDF0E7] hover:bg-[#CCE7DA] text-[#1F4A3A] border-[#A7D3BE]'
                              : 'bg-[#2F6B57] hover:bg-[#265847] text-white border-transparent shadow-2xs'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{draft.isPublished ? 'Buka Dokumen Terbit' : 'Lanjutkan Draf Ini'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* GRID DOKUMEN RECENT YANG SUDAH DITERBITKAN */}
        {displayedRecords.length === 0 ? (
          <div className="nn-card rounded-2xl p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#8A8479] mx-auto" />
            <div className="text-sm font-semibold text-[#242320]">
              Belum ada dokumen yang cocok dengan pencarian/filter
            </div>
            <p className="text-xs text-[#66625B]">
              Silakan pilih salah satu kartu di atas untuk membuat naskah dinas baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayedRecords.map((rec) => {
              const reconstructedForm = buildFormStateFromRecord(
                rec,
                pegawaiList,
                pejabatList,
                simulatedMonth,
                simulatedYear
              );
              const jenis = reconstructedForm.jenis_naskah || 'TUGAS';
              const badgePill =
                jenis === 'UNDANGAN'
                  ? 'bg-[#A86A2D] text-white'
                  : jenis === 'NOTA_DINAS'
                  ? 'bg-[#3D5275] text-white'
                  : 'bg-[#2F6B57] text-white';
              const badgeCode =
                jenis === 'UNDANGAN'
                  ? 'Surat Undangan'
                  : jenis === 'NOTA_DINAS'
                  ? 'Nota Dinas'
                  : 'Surat Tugas';

              const titleText =
                jenis === 'UNDANGAN'
                  ? reconstructedForm.undangan_hal || rec.perihal || 'Surat Undangan'
                  : jenis === 'NOTA_DINAS'
                  ? reconstructedForm.nota_hal || rec.perihal || 'Nota Dinas'
                  : reconstructedForm.nama_acara || rec.perihal || 'Surat Tugas';

              const tanggalLabel =
                rec.tanggal_dibuat ||
                rec.tanggal ||
                (reconstructedForm.tanggal_surat
                  ? formatTanggalIndonesia(reconstructedForm.tanggal_surat)
                  : '-');

              return (
                <div
                  key={rec.id}
                  onClick={() => onEditRecentRecord(rec)}
                  className="group nn-card nn-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer"
                >
                  {/* Atas: Live Miniature A4 Document */}
                  <div>
                    <div className="bg-[#C8C0B1]/55 border-b border-white/75 p-3 flex justify-center items-start relative overflow-hidden">
                      <div className="border border-[#BFB7A8] rounded-xs shadow-[0_6px_18px_rgba(30,28,24,0.13)] bg-white overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                        <MiniA4Preview
                          form={reconstructedForm}
                          pegawaiList={pegawaiList}
                          pejabatList={pejabatList}
                          scale={0.265}
                        />
                      </div>

                      {/* Badge Jenis Naskah */}
                      <span
                        className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${badgePill}`}
                      >
                        {badgeCode}
                      </span>

                      {/* Badge Nomor Urut */}
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/95 border border-white shadow-sm text-[#242320]">
                        #{rec.nomor_urut}
                      </span>

                      {/* Hover Overlay Quick Hint */}
                      <div className="absolute inset-0 bg-[#242320]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-white/95 backdrop-blur-md text-[#242320] text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-white shadow-lg">
                          Klik untuk Buka di Generator
                        </span>
                      </div>
                    </div>

                    {/* Tengah: Metadata Dokumen */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-semibold text-[#66625B]">
                        <span className="truncate" title={reconstructedForm.nomor_lengkap}>
                          {reconstructedForm.nomor_lengkap}
                        </span>
                      </div>

                      <h3
                        className="text-xs font-bold text-[#242320] line-clamp-2 leading-snug min-h-[32px]"
                        title={titleText}
                      >
                        {titleText}
                      </h3>

                      <div className="pt-1.5 flex items-center justify-between text-[10.5px] text-[#5C5850] border-t border-[#E2DDD2]/80">
                        <span className="truncate max-w-[125px]" title={rec.kepada || '-'}>
                          Kepada: <strong className="text-[#242320] font-semibold">{rec.kepada || '-'}</strong>
                        </span>
                        <span className="shrink-0 font-medium">{tanggalLabel}</span>
                      </div>
                      {rec.konseptor && (
                        <div className="text-[10px] text-[#757067] truncate">
                          Konseptor: {rec.konseptor}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bawah: Opsi B — 2 Tombol Aksi */}
                  <div className="px-4 pb-4 pt-0.5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecentRecord(rec);
                        }}
                        className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-[#2F6B57] hover:bg-[#255646] text-white shadow-2xs cursor-pointer"
                        title="Buka dokumen ini di Generator dengan seluruh isinya dan nomor urut aslinya"
                      >
                        <Edit3 className="w-3 h-3 shrink-0" />
                        <span>Buka / Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateAsNewTemplate(rec);
                        }}
                        className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-white/85 hover:bg-white text-[#2E2C28] border border-[#D4CEC2] shadow-2xs cursor-pointer"
                        title="Salin seluruh isi surat ini sebagai draf baru dengan Nomor Urut baru (#berikutnya)"
                      >
                        <Copy className="w-3 h-3 shrink-0" />
                        <span>Jadi Template</span>
                      </button>
                    </div>

                    {rec.drive_url && (
                      <a
                        href={rec.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-center space-x-1 py-1 px-2 rounded-lg text-[10.5px] font-semibold bg-[#DDF0E7]/90 hover:bg-[#CCE7DA] text-[#1F4A3A] border border-[#A8D4BF] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka Arsip Google Docs / Word</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tombol Muat Lebih Banyak / Lihat Semua di Buku Agenda */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {sortedRecentRecords.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 8)}
              className="px-4 py-2 bg-white/80 hover:bg-white text-[#242320] text-xs font-semibold rounded-xl border border-white/85 shadow-sm backdrop-blur-md cursor-pointer"
            >
              Tampilkan Lebih Banyak Dokumen ({sortedRecentRecords.length - visibleCount} lainnya)
            </button>
          )}
          <button
            type="button"
            onClick={onOpenDatabase}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#2F6B57] hover:bg-[#255646] text-white text-xs font-semibold rounded-xl shadow-[0_4px_12px_rgba(47,107,87,0.25)] cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Lihat Seluruh Tabel Buku Agenda ({nomorSuratList.length} Surat)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ZONA 4: TENTANG APLIKASI & PANDUAN PENGGUNAAN
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Kolom Kiri (5 Cols): Tentang Aplikasi PUSAKA */}
        <div className="lg:col-span-5 nn-card rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-1.5 bg-[#E4ECF7] border border-[#BCCAE0] px-3 py-1 rounded-full text-[11px] font-bold text-[#2D4263]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tentang Sistem PUSAKA</span>
            </div>

            <h2 className="text-lg font-bold text-[#242320]">
              Sistem Otomasi Tata Naskah Dinas &amp; Buku Agenda Elektronik
            </h2>

            <p className="text-xs text-[#4F4B44] leading-relaxed">
              <strong className="text-[#242320]">Sistem Generator Surat PUSAKA</strong> adalah platform kerja internal yang dirancang untuk mempermudah tata usaha dan penyusunan naskah dinas di lingkungan{' '}
              <strong className="text-[#242320]">Kementerian Komunikasi dan Digital RI</strong>.
            </p>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 bg-white/65 border border-white/85 rounded-2xl shadow-2xs flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2F6B57] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#242320] block font-semibold">Sesuai Standar Tata Naskah Dinas Komdigi</strong>
                  <span className="text-[#5C5850] text-[11px] leading-relaxed block mt-0.5">
                    Mendukung 3 varian kop unit kerja resmi, tipografi, margin kertas A4, kode klasifikasi Fasilitatif &amp; Substantif, serta tata letak tanda tangan pejabat.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/65 border border-white/85 rounded-2xl shadow-2xs flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-[#A86A2D] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#242320] block font-semibold">Didukung Gemini Multimodal AI</strong>
                  <span className="text-[#5C5850] text-[11px] leading-relaxed block mt-0.5">
                    Membaca dokumen PDF/Word/Gambar pindaian maupun perintah teks (*prompt-only*) untuk menyusun surat lengkap beserta tabel lampirannya.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/65 border border-white/85 rounded-2xl shadow-2xs flex items-start space-x-2.5">
                <FileCheck2 className="w-4 h-4 text-[#3D5275] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#242320] block font-semibold">Integrasi Satu Pintu (Sheets &amp; Google Drive)</strong>
                  <span className="text-[#5C5850] text-[11px] leading-relaxed block mt-0.5">
                    Penomoran surat tercatat otomatis ke Google Spreadsheet kantor sekaligus mengarsipkan berkas Word (`.docx` / Google Docs) ke folder bulanan Google Drive.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (7 Cols): Panduan & Cara Penggunaan (4 Langkah Mudah) */}
        <div className="lg:col-span-7 nn-card rounded-3xl p-6 space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-[#DDF0E7] border border-[#B2D8C5] px-3 py-1 rounded-full text-[11px] font-bold text-[#1F4A3A]">
              <Layers className="w-3.5 h-3.5" />
              <span>Panduan Penggunaan</span>
            </div>
            <h2 className="text-lg font-bold text-[#242320] pt-1">
              Cara Menggunakan Aplikasi dalam 4 Langkah
            </h2>
            <p className="text-xs text-[#5C5850]">
              Alur kerja tenang dan terstruktur untuk menerbitkan naskah dinas resmi tanpa mengatur format kertas secara manual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-white/65 border border-white/85 shadow-2xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#2F6B57] text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-[#242320]">
                  Pilih Naskah, Kop &amp; Prompt AI
                </h3>
              </div>
              <p className="text-[11.5px] text-[#5C5850] leading-relaxed">
                Pilih kartu <strong>Surat Tugas</strong>, <strong>Surat Undangan</strong>, atau <strong>Nota Dinas</strong>, sesuaikan unit Kop Surat bila diperlukan, atau klik <strong>&quot;Via AI&quot;</strong> untuk mengunggah acuan/prompt.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-white/65 border border-white/85 shadow-2xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#A86A2D] text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-[#242320]">
                  Edit Formulir &amp; Kertas A4 Dua Arah
                </h3>
              </div>
              <p className="text-[11.5px] text-[#5C5850] leading-relaxed">
                Lengkapi atribut surat di panel kiri atau klik &amp; ketik langsung di atas lembar <strong>Live Preview Kertas A4</strong> di sebelah kanan layaknya pengolah kata.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-white/65 border border-white/85 shadow-2xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#3D5275] text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-[#242320]">
                  Atur Klasifikasi &amp; Lampiran Merger
                </h3>
              </div>
              <p className="text-[11.5px] text-[#5C5850] leading-relaxed">
                Pilih <strong>Kode Klasifikasi</strong> (tersedia rekomendasi cerdas), lalu tambahkan lampiran Daftar Undangan, Tabel Rundown, atau PDF eksternal.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-white/65 border border-white/85 shadow-2xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#2F6B57] text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-xs font-bold text-[#242320]">
                  Terbitkan ke Cloud &amp; Unduh Dokumen
                </h3>
              </div>
              <p className="text-[11.5px] text-[#5C5850] leading-relaxed">
                Klik <strong>&quot;Terbitkan &amp; Simpan&quot;</strong> untuk mencatat nomor surat ke Google Sheets dan mengunggah arsip ke Google Drive, atau unduh sebagai <strong>PDF</strong> / <strong>Word (.docx)</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
