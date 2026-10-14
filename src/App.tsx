/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText,
  Sparkles,
  Layers,
  Search,
  Check,
  RefreshCw,
  Edit3,
  Upload,
  ExternalLink,
} from 'lucide-react';

import {
  Pegawai,
  Pejabat,
  NomorSuratRecord,
  EkstraksiUndangan,
  SuratTugasFormState,
} from './types';
import {
  INITIAL_PEGAWAI,
  INITIAL_PEJABAT,
  INITIAL_NOMOR_SURAT,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { InvitationUploadModal } from './components/InvitationUploadModal';
import { SuratPreview } from './components/SuratPreview';
import { DatabaseView } from './components/DatabaseView';
import { SheetsConfigModal } from './components/SheetsConfigModal';
import {
  isSheetsConfigured,
  fetchNomorSuratFromSheets,
  fetchPegawaiFromSheets,
  fetchPejabatFromSheets,
  appendNomorSuratToSheets,
  updateNomorSuratInSheets,
} from './services/sheetsService';

// ─── localStorage keys for data persistence ───────────────────────────────────
const LS_PEGAWAI = 'pusaka_pegawai_v2';
const LS_PEJABAT = 'pusaka_pejabat_v2';
const LS_NOMOR_SURAT = 'pusaka_nomor_surat_v2';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'database'>('generator');

  // Master Data State
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() =>
    loadFromStorage<Pegawai[]>(LS_PEGAWAI, INITIAL_PEGAWAI)
  );
  const [pejabatList, setPejabatList] = useState<Pejabat[]>(() =>
    loadFromStorage<Pejabat[]>(LS_PEJABAT, INITIAL_PEJABAT)
  );
  const [nomorSuratList, setNomorSuratList] = useState<NomorSuratRecord[]>(() =>
    loadFromStorage<NomorSuratRecord[]>(LS_NOMOR_SURAT, INITIAL_NOMOR_SURAT)
  );

  // Sheets sync state
  const [isSheetsConnected, setIsSheetsConnected] = useState(isSheetsConfigured());
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [lastSyncMsg, setLastSyncMsg] = useState<string>('');

  // System Date & Year State
  const [simulatedYear] = useState<number>(new Date().getFullYear());
  const simulatedMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  // Persist to localStorage whenever data changes
  useEffect(() => saveToStorage(LS_PEGAWAI, pegawaiList), [pegawaiList]);
  useEffect(() => saveToStorage(LS_PEJABAT, pejabatList), [pejabatList]);
  useEffect(() => saveToStorage(LS_NOMOR_SURAT, nomorSuratList), [nomorSuratList]);

  // ─── Sync from Google Sheets ─────────────────────────────────────────────────
  const syncFromSheets = useCallback(async () => {
    if (!isSheetsConfigured()) return;
    setIsSyncingSheets(true);
    try {
      const [pegawai, pejabat, nomorSurat] = await Promise.all([
        fetchPegawaiFromSheets(),
        fetchPejabatFromSheets(),
        fetchNomorSuratFromSheets(),
      ]);
      if (pegawai.length > 0) setPegawaiList(pegawai);
      if (pejabat.length > 0) setPejabatList(pejabat);
      if (nomorSurat.length > 0) {
        const withUnique = nomorSurat.map((item, idx) => ({
          ...item,
          id: `ns-${item.nomor_urut || idx}-${idx}`,
        }));
        setNomorSuratList(withUnique);
      }
      setIsSheetsConnected(true);
      setLastSyncMsg(`Tersinkronisasi (${nomorSurat.length} surat) ${new Date().toLocaleTimeString('id-ID')}`);
    } catch (err) {
      console.warn('Sheets sync failed, using local data:', err);
      setLastSyncMsg('Gagal sinkronisasi — memakai data lokal');
    } finally {
      setIsSyncingSheets(false);
    }
  }, []);

  // Sync on mount if already configured
  useEffect(() => {
    if (isSheetsConfigured()) {
      syncFromSheets();
    }
  }, [syncFromSheets]);

  // ─── Next Number Computation ─────────────────────────────────────────────────
  const nextNomorInfo = useMemo(() => {
    if (nomorSuratList.length === 0) {
      return {
        nomor_urut: 1,
        tahun: simulatedYear,
        bulan: simulatedMonth,
        nomor_lengkap: `1/SJ.9/KP.01.06/${simulatedMonth}/${simulatedYear}`,
      };
    }
    const yearRecords = nomorSuratList.filter(
      (r) => (r.tahun === simulatedYear || !r.tahun) && typeof r.nomor_urut === 'number' && !isNaN(r.nomor_urut)
    );
    let nextUrut = 1;
    if (yearRecords.length > 0) {
      const maxUrut = Math.max(...yearRecords.map((r) => r.nomor_urut));
      nextUrut = maxUrut > 0 ? maxUrut + 1 : 1;
    }
    return {
      nomor_urut: nextUrut,
      tahun: simulatedYear,
      bulan: simulatedMonth,
      nomor_lengkap: `${nextUrut}/SJ.9/KP.01.06/${simulatedMonth}/${simulatedYear}`,
    };
  }, [nomorSuratList, simulatedYear, simulatedMonth]);

  // ─── Form State ──────────────────────────────────────────────────────────────
  const defaultPejabat =
    pejabatList.find((p) => p.is_default) || pejabatList[0];

  const [form, setForm] = useState<SuratTugasFormState>({
    nomor_urut: nextNomorInfo.nomor_urut,
    tahun: nextNomorInfo.tahun,
    bulan: nextNomorInfo.bulan,
    nomor_lengkap: nextNomorInfo.nomor_lengkap,
    tanggal_surat: new Date().toISOString().split('T')[0],
    kota_surat: 'Jakarta',

    nama_acara: '',
    nomor_surat_undangan: '',
    tanggal_surat_undangan: '',
    instansi_pengundang: '',
    perihal_undangan: '',

    tanggal_mulai: '',
    tanggal_selesai: '',
    waktu_kegiatan: '',
    hari_tanggal_pelaksanaan: '',
    lokasi_kegiatan: '',
    kota_kegiatan: '',
    tujuan_tugas: '',
    pembebanan_anggaran:
      'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026',

    selectedPegawaiIds: [],
    selectedPejabatId: defaultPejabat.id,
    kriteria_peserta: '',
    konseptor: '',
    ttd_image: undefined,
  });

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<NomorSuratRecord | null>(null);

  // Always keep form synchronized with nextNomorInfo (kecuali sedang dalam mode edit surat)
  useEffect(() => {
    if (editingRecord) return;
    setForm((prev) => ({
      ...prev,
      nomor_urut: nextNomorInfo.nomor_urut,
      tahun: nextNomorInfo.tahun,
      bulan: nextNomorInfo.bulan,
      nomor_lengkap: nextNomorInfo.nomor_lengkap,
    }));
  }, [nextNomorInfo, editingRecord]);

  // ─── Modal & UI States ───────────────────────────────────────────────────────
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [isSavedToDB, setIsSavedToDB] = useState(false);
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);
  const [lastSavedDriveUrl, setLastSavedDriveUrl] = useState<string | null>(null);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ─── Derived State ───────────────────────────────────────────────────────────
  const selectedPegawaiList = useMemo(() => {
    return form.selectedPegawaiIds
      .map((id) => pegawaiList.find((p) => p.id === id))
      .filter(Boolean) as Pegawai[];
  }, [form.selectedPegawaiIds, pegawaiList]);

  const selectedPejabatObj = useMemo(() => {
    return (
      pejabatList.find((p) => p.id === form.selectedPejabatId) || defaultPejabat
    );
  }, [form.selectedPejabatId, pejabatList, defaultPejabat]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleApplyExtraction = (extracted: EkstraksiUndangan) => {
    setForm((prev) => ({
      ...prev,
      nama_acara: extracted.nama_acara,
      nomor_surat_undangan: extracted.nomor_surat_undangan,
      instansi_pengundang: extracted.instansi_pengundang,
      tanggal_surat_undangan:
        extracted.tanggal_surat_undangan || prev.tanggal_surat,
      tanggal_mulai: extracted.tanggal_mulai,
      tanggal_selesai: extracted.tanggal_selesai,
      waktu_kegiatan: extracted.waktu_pelaksanaan || prev.waktu_kegiatan,
      hari_tanggal_pelaksanaan: extracted.hari_tanggal_pelaksanaan,
      lokasi_kegiatan: extracted.lokasi,
      kota_kegiatan: extracted.kota_kegiatan,
      perihal_undangan: extracted.perihal_undangan || `Undangan ${extracted.nama_acara}`,
      kriteria_peserta: extracted.kriteria_peserta,
      // Terapkan formulasi klausul hasil analisa AI
      menimbang_custom: extracted.narasi_menimbang,
      dasar_custom: extracted.narasi_dasar,
      untuk_custom: extracted.narasi_untuk,
    }));
    setIsSavedToDB(false);
  };

  const handleTtdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, ttd_image: base64 }));
      setIsSavedToDB(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTtd = () => {
    setForm((prev) => ({ ...prev, ttd_image: undefined }));
    setIsSavedToDB(false);
  };

  const handleTogglePegawaiSelect = (id: string) => {
    setIsSavedToDB(false);
    setForm((prev) => {
      const exists = prev.selectedPegawaiIds.includes(id);
      return {
        ...prev,
        selectedPegawaiIds: exists
          ? prev.selectedPegawaiIds.filter((pId) => pId !== id)
          : [...prev.selectedPegawaiIds, id],
      };
    });
  };

  /**
   * Unduh dokumen langsung sebagai PDF resmi menggunakan html2pdf.js.
   */
  const handleDownloadPdf = async () => {
    const element = document.getElementById('surat-tugas-document');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const cleanNomor = (form.nomor_lengkap || 'Surat_Tugas').replace(/[\/\\:\*\?"<>\|]/g, '_');
      const opt = {
        margin: 0,
        filename: `Surat_Tugas_${cleanNomor}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          onclone: (clonedDoc: Document) => {
            // Hapus semua style tag & stylesheet eksternal Tailwind agar html2canvas bebas 100% dari error oklch
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach((s) => s.remove());

            // Sisipkan style minimalis khusus dokumen surat tugas
            const printStyle = clonedDoc.createElement('style');
            printStyle.textContent = `
              * { box-sizing: border-box; }
              body { background: #ffffff !important; color: #000000 !important; font-family: Arial, sans-serif !important; }
              #surat-tugas-document { background: #ffffff !important; color: #000000 !important; width: 794px !important; margin: 0 auto !important; }
              .print-page { background: #ffffff !important; color: #000000 !important; margin: 0 auto !important; }
            `;
            clonedDoc.head.appendChild(printStyle);
          },
        },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF via html2pdf, falling back to window.print():', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ─── Edit Surat Handlers ───────────────────────────────────────────────────
  const handleEditSurat = (rec: NomorSuratRecord) => {
    setEditingRecord(rec);
    setIsSavedToDB(false);
    setLastSavedDriveUrl(rec.drive_url || null);

    if (rec.form_state) {
      setForm(rec.form_state);
    } else {
      let matchedPegawaiIds: string[] = rec.pegawai_ids || [];
      if (matchedPegawaiIds.length === 0 && rec.kepada && rec.kepada !== 'Daftar Terlampir') {
        const names = rec.kepada.split(',').map((s) => s.trim().toLowerCase());
        matchedPegawaiIds = pegawaiList
          .filter((p) => names.some((n) => p.nama.toLowerCase().includes(n) || n.includes(p.nama.toLowerCase())))
          .map((p) => p.id);
      }

      let matchedPejabatId = rec.pejabat_id || defaultPejabat.id;
      if (!rec.pejabat_id && rec.penandatangan_nama) {
        const pej = pejabatList.find((p) =>
          p.nama.toLowerCase().includes(rec.penandatangan_nama!.toLowerCase())
        );
        if (pej) matchedPejabatId = pej.id;
      }

      let tanggalSurat = rec.tanggal || rec.tanggal_surat || new Date().toISOString().split('T')[0];
      if (tanggalSurat && !/^\d{4}-\d{2}-\d{2}$/.test(tanggalSurat)) {
        const d = new Date(tanggalSurat);
        if (!isNaN(d.getTime())) {
          tanggalSurat = d.toISOString().split('T')[0];
        }
      }

      setForm({
        nomor_urut: rec.nomor_urut,
        tahun: rec.tahun || simulatedYear,
        bulan: rec.bulan || simulatedMonth,
        nomor_lengkap: rec.nomor_lengkap || `${rec.nomor_urut}/SJ.9/KP.01.06/${simulatedMonth}/${simulatedYear}`,
        tanggal_surat: tanggalSurat,
        kota_surat: 'Jakarta',

        nama_acara: rec.perihal || '',
        nomor_surat_undangan: '',
        tanggal_surat_undangan: '',
        instansi_pengundang: '',
        perihal_undangan: rec.perihal || '',

        tanggal_mulai: '',
        tanggal_selesai: '',
        waktu_kegiatan: '',
        hari_tanggal_pelaksanaan: '',
        lokasi_kegiatan: rec.tujuan_lokasi || '',
        kota_kegiatan: '',
        tujuan_tugas: '',
        pembebanan_anggaran:
          'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026',

        selectedPegawaiIds: matchedPegawaiIds,
        selectedPejabatId: matchedPejabatId,
        kriteria_peserta: '',
        konseptor: rec.konseptor || '',
        ttd_image: undefined,
      });
    }

    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setIsSavedToDB(false);
    setLastSavedDriveUrl(null);
    setForm((prev) => ({
      ...prev,
      nomor_urut: nextNomorInfo.nomor_urut,
      tahun: nextNomorInfo.tahun,
      bulan: nextNomorInfo.bulan,
      nomor_lengkap: nextNomorInfo.nomor_lengkap,
    }));
  };

  /**
   * Simpan ke database lokal DAN ke Google Sheets kantor.
   */
  const handleSaveToDatabase = async () => {
    if (selectedPegawaiList.length === 0) {
      alert('Pilih minimal 1 orang pegawai sebelum menyimpan.');
      return;
    }

    const currentNomorLengkap = editingRecord
      ? (editingRecord.nomor_lengkap || form.nomor_lengkap)
      : (form.nomor_lengkap || nextNomorInfo.nomor_lengkap);
    const cleanNomor = currentNomorLengkap.replace(/[\/\\:\*\?"<>\|]/g, '_');
    const pdfFileName = `Surat_Tugas_${cleanNomor}.pdf`;

    setIsSavingToSheets(true);
    setLastSyncMsg('Mengonversi dokumen surat ke PDF untuk arsip Google Drive...');

    // Generate Base64 PDF secara otomatis di latar belakang untuk diupload ke Google Drive
    let pdfBase64: string | undefined = undefined;
    const element = document.getElementById('surat-tugas-document');
    if (element) {
      try {
        // @ts-ignore
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const opt = {
          margin: 0,
          image: { type: 'jpeg' as const, quality: 0.88 },
          html2canvas: {
            scale: 1.5,
            useCORS: true,
            logging: false,
            scrollY: 0,
            onclone: (clonedDoc: Document) => {
              // Hapus semua style tag & stylesheet eksternal Tailwind agar html2canvas bebas 100% dari error oklch
              const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
              styles.forEach((s) => s.remove());

              // Sisipkan style minimalis khusus dokumen surat tugas
              const printStyle = clonedDoc.createElement('style');
              printStyle.textContent = `
                * { box-sizing: border-box; }
                body { background: #ffffff !important; color: #000000 !important; font-family: Arial, sans-serif !important; }
                #surat-tugas-document { background: #ffffff !important; color: #000000 !important; width: 794px !important; margin: 0 auto !important; }
                .print-page { background: #ffffff !important; color: #000000 !important; margin: 0 auto !important; }
              `;
              clonedDoc.head.appendChild(printStyle);
            },
          },
          jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
          pagebreak: { mode: ['css', 'legacy'] },
        };
        const dataUri: string = await html2pdf().set(opt).from(element).outputPdf('datauristring');
        if (dataUri && dataUri.includes('base64,')) {
          pdfBase64 = dataUri.split('base64,')[1];
        }
      } catch (pdfErr) {
        console.warn('Gagal generate PDF Base64 untuk Drive:', pdfErr);
      }
    }

    if (editingRecord) {
      // ── MODE EDIT: Perbarui record yang ada tanpa membuat nomor baru ──
      const updatedRecord: NomorSuratRecord = {
        ...editingRecord,
        tanggal: form.tanggal_surat,
        tanggal_surat: form.tanggal_surat,
        perihal: form.nama_acara,
        tujuan_lokasi: `${form.lokasi_kegiatan}, ${form.kota_kegiatan}`,
        jumlah_pegawai: selectedPegawaiList.length,
        penandatangan_nama: selectedPejabatObj.nama,
        dasar_surat: `Surat Undangan ${form.instansi_pengundang} No. ${form.nomor_surat_undangan}`,
        jenis: 'ST',
        kepada:
          selectedPegawaiList.length > 3
            ? 'Daftar Terlampir'
            : selectedPegawaiList.map((p) => p.nama).join(', '),
        status_ttd: selectedPejabatObj.is_default ? 'Kapus' : 'Plh. Kapus',
        konseptor: form.konseptor || editingRecord.konseptor || 'TU Pusaka',
        link_pdf: pdfFileName,
        pdf_base64: pdfBase64,
        pdf_filename: pdfFileName,
        form_state: { ...form },
        pegawai_ids: form.selectedPegawaiIds,
        pejabat_id: form.selectedPejabatId,
      };

      setNomorSuratList((prev) =>
        prev.map((r) => (r.id === editingRecord.id ? updatedRecord : r))
      );
      setIsSavedToDB(true);

      if (isSheetsConnected) {
        try {
          setLastSyncMsg('Memperbarui perubahan surat di Google Sheets & Drive...');
          const result = await updateNomorSuratInSheets(updatedRecord);
          if (result && result.drive_url) {
            setLastSavedDriveUrl(result.drive_url);
            setLastSyncMsg(`✓ Surat ${updatedRecord.nomor_lengkap} berhasil diperbarui di Spreadsheet & Drive`);
            setNomorSuratList((prev) =>
              prev.map((rec) =>
                rec.id === updatedRecord.id
                  ? {
                      ...rec,
                      drive_url: result.drive_url,
                      drive_folder: result.drive_folder,
                    }
                  : rec
              )
            );
          } else {
            setLastSyncMsg(`✓ Surat ${updatedRecord.nomor_lengkap} berhasil diperbarui di Spreadsheet`);
          }
        } catch (err) {
          console.warn('Gagal update ke Sheets:', err);
          setLastSyncMsg('Tersimpan lokal — gagal memperbarui ke Google Sheets');
        } finally {
          setIsSavingToSheets(false);
        }
      } else {
        setIsSavingToSheets(false);
        setLastSyncMsg('Perubahan surat tersimpan di database lokal');
      }
    } else {
      // ── MODE BUAT BARU ──
      const newRecord: NomorSuratRecord = {
        id: `ns-${Date.now()}`,
        nomor_urut: nextNomorInfo.nomor_urut,
        tahun: nextNomorInfo.tahun,
        bulan: nextNomorInfo.bulan,
        nomor_lengkap: nextNomorInfo.nomor_lengkap,
        tanggal: form.tanggal_surat,
        tanggal_surat: form.tanggal_surat,
        tanggal_dibuat: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        perihal: form.nama_acara,
        dibuat_oleh: 'Tata Usaha PUSAKA',
        tujuan_lokasi: `${form.lokasi_kegiatan}, ${form.kota_kegiatan}`,
        jumlah_pegawai: selectedPegawaiList.length,
        penandatangan_nama: selectedPejabatObj.nama,
        dasar_surat: `Surat Undangan ${form.instansi_pengundang} No. ${form.nomor_surat_undangan}`,
        jenis: 'ST',
        kepada:
          selectedPegawaiList.length > 3
            ? 'Daftar Terlampir'
            : selectedPegawaiList.map((p) => p.nama).join(', '),
        status_ttd: selectedPejabatObj.is_default ? 'Kapus' : 'Plh. Kapus',
        topik_tim: 'TU',
        konseptor: form.konseptor || 'TU Pusaka',
        status_surat: 'OK',
        link_word: '-',
        link_pdf: pdfFileName,
        pdf_base64: pdfBase64,
        pdf_filename: pdfFileName,
        form_state: { ...form },
        pegawai_ids: form.selectedPegawaiIds,
        pejabat_id: form.selectedPejabatId,
      };

      setNomorSuratList((prev) => [...prev, newRecord]);
      setIsSavedToDB(true);

      if (isSheetsConnected) {
        try {
          setLastSyncMsg('Mengunggah ke Google Drive & mencatat ke Spreadsheet...');
          const savedResult = await appendNomorSuratToSheets(newRecord);
          if (savedResult && (savedResult as any).drive_error) {
            setLastSyncMsg(`⚠️ Tercatat di Sheets, namun Google Drive kendala: ${(savedResult as any).drive_error}`);
            alert(
              `⚠️ Nomor surat ${newRecord.nomor_lengkap} berhasil dicatat di Spreadsheet!\n\n` +
              `Namun arsip Google Drive belum berhasil dibuat karena kendala izin:\n` +
              `"${(savedResult as any).drive_error}"\n\n` +
              `Solusi Cepat:\n` +
              `1. Buka Google Spreadsheet kantor Anda di browser\n` +
              `2. Refresh halaman, lalu klik menu baru di toolbar atas: "📌 Pusaka Surat Tugas" -> "☁️ Otorisasi & Buat Folder Bulan Ini"\n` +
              `3. Klik Izinkan (Allow) saat Google meminta konfirmasi.`
            );
          } else if (savedResult && savedResult.drive_url) {
            setLastSavedDriveUrl(savedResult.drive_url);
            setLastSyncMsg(
              `✓ Surat ${newRecord.nomor_lengkap} berhasil diunggah ke Google Drive (${savedResult.drive_folder || 'Folder Bulan'}) & dicatat di Sheets`
            );
            setNomorSuratList((prev) =>
              prev.map((rec) =>
                rec.id === newRecord.id
                  ? {
                      ...rec,
                      drive_url: savedResult.drive_url,
                      drive_folder: savedResult.drive_folder,
                    }
                  : rec
              )
            );
          } else {
            setLastSyncMsg(`Nomor surat ${newRecord.nomor_lengkap} tersinkronisasi ke Sheets ✓`);
          }
        } catch (err) {
          console.warn('Failed to sync to Sheets & Drive:', err);
          setLastSyncMsg('Tersimpan lokal — gagal sinkronisasi ke Sheets/Drive');
        } finally {
          setIsSavingToSheets(false);
        }
      } else {
        setIsSavingToSheets(false);
        setLastSyncMsg('Tersimpan di database lokal browser');
      }
    }
  };

  // ─── CRUD Handlers Pegawai ───────────────────────────────────────────────────
  const handleAddPegawai = (newPeg: Pegawai) => {
    setPegawaiList((prev) => [...prev, newPeg]);
  };

  const handleUpdatePegawai = (updated: Pegawai) => {
    setPegawaiList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePegawai = (id: string) => {
    setPegawaiList((prev) => prev.filter((p) => p.id !== id));
    setForm((prev) => ({
      ...prev,
      selectedPegawaiIds: prev.selectedPegawaiIds.filter((pId) => pId !== id),
    }));
  };

  const handleToggleStatusPegawai = (id: string) => {
    setPegawaiList((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'Aktif' ? 'Cuti' : 'Aktif' }
          : p
      )
    );
  };

  // ─── CRUD Handlers Pejabat ───────────────────────────────────────────────────
  const handleAddPejabat = (newPej: Pejabat) => {
    setPejabatList((prev) => [...prev, newPej]);
  };

  const handleUpdatePejabat = (updated: Pejabat) => {
    setPejabatList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePejabat = (id: string) => {
    if (pejabatList.length <= 1) {
      alert('Minimal harus ada 1 pejabat penandatangan.');
      return;
    }
    setPejabatList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSetDefaultPejabat = (id: string) => {
    setPejabatList((prev) =>
      prev.map((p) => ({
        ...p,
        is_default: p.id === id,
      }))
    );
    setForm((prev) => ({ ...prev, selectedPejabatId: id }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nextNomorLengkap={nextNomorInfo.nomor_lengkap}
        isSheetsConnected={isSheetsConnected}
        onOpenSheetsConfig={() => setIsSheetsModalOpen(true)}
      />

      {/* Sync Status Bar */}
      {(isSyncingSheets || lastSyncMsg) && (
        <div
          className={`w-full text-center text-[11px] py-1 px-4 no-print print:hidden ${
            isSyncingSheets
              ? 'bg-teal-50 text-teal-700 border-b border-teal-200'
              : lastSyncMsg.includes('Gagal') || lastSyncMsg.includes('gagal')
              ? 'bg-amber-50 text-amber-700 border-b border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
          }`}
        >
          {isSyncingSheets ? (
            <span className="flex items-center justify-center space-x-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Menyinkronisasi data dari Google Sheets...</span>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center space-x-2">
              <span>{isSheetsConnected ? '☁️' : '💾'} {lastSyncMsg}</span>
              {lastSavedDriveUrl && (
                <a
                  href={lastSavedDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-teal-950 inline-flex items-center space-x-1 ml-1.5 cursor-pointer bg-white/70 px-2 py-0.5 rounded shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka di Google Drive</span>
                </a>
              )}
            </span>
          )}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* TAB 1: PEMBUATAN SURAT TUGAS */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:gap-0">
            {/* Left Column: Form & Selection (5 cols) */}
            <div className="lg:col-span-5 space-y-4 no-print print:hidden">
              {/* Banner Mode Edit di Kolom Form */}
              {editingRecord && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                  <div>
                    <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                      <Edit3 className="w-4 h-4 text-amber-700" />
                      <span>Mode Edit Surat Tugas #{editingRecord.nomor_urut}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      {editingRecord.nomor_lengkap} • Nomor urut tetap dipertahankan
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    Batal Edit
                  </button>
                </div>
              )}

              {/* Card 1: AI Undangan & Dasar Acara */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Dasar Undangan &amp; Acara
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsExtractionModalOpen(true)}
                    className="flex items-center space-x-1 bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-teal-300" />
                    <span>Pindai Undangan (AI)</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Kegiatan / Acara:
                    </label>
                    <input
                      type="text"
                      value={form.nama_acara}
                      onChange={(e) => {
                        setForm({ ...form, nama_acara: e.target.value, menimbang_custom: undefined, untuk_custom: undefined });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nomor Surat Undangan:
                      </label>
                      <input
                        type="text"
                        value={form.nomor_surat_undangan}
                        onChange={(e) => {
                          setForm({ ...form, nomor_surat_undangan: e.target.value, dasar_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Instansi Pengundang:
                      </label>
                      <input
                        type="text"
                        value={form.instansi_pengundang}
                        onChange={(e) => {
                          setForm({ ...form, instansi_pengundang: e.target.value, dasar_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tanggal Mulai:
                      </label>
                      <input
                        type="date"
                        value={form.tanggal_mulai}
                        onChange={(e) => {
                          setForm({ ...form, tanggal_mulai: e.target.value, untuk_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tanggal Selesai:
                      </label>
                      <input
                        type="date"
                        value={form.tanggal_selesai}
                        onChange={(e) => {
                          setForm({ ...form, tanggal_selesai: e.target.value, untuk_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Lokasi / Tempat:
                      </label>
                      <input
                        type="text"
                        value={form.lokasi_kegiatan}
                        onChange={(e) => {
                          setForm({ ...form, lokasi_kegiatan: e.target.value, untuk_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kota:
                      </label>
                      <input
                        type="text"
                        value={form.kota_kegiatan}
                        onChange={(e) => {
                          setForm({ ...form, kota_kegiatan: e.target.value, untuk_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Redaksi & Narasi Surat (Bisa Diedit / Ditambah Langsung) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Redaksi &amp; Isi Surat (Langsung Diedit)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Edit3 className="w-3 h-3 text-teal-600" />
                    <span>Bebas Diedit</span>
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">
                      Klausul Menimbang:
                    </label>
                    <textarea
                      rows={2}
                      value={
                        form.menimbang_custom !== undefined
                          ? form.menimbang_custom
                          : `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${form.nama_acara}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`
                      }
                      onChange={(e) => {
                        setForm({ ...form, menimbang_custom: e.target.value });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">
                      Klausul Dasar:
                    </label>
                    <textarea
                      rows={2}
                      value={
                        form.dasar_custom !== undefined
                          ? form.dasar_custom
                          : `${form.instansi_pengundang} Nomor : ${form.nomor_surat_undangan}.`
                      }
                      onChange={(e) => {
                        setForm({ ...form, dasar_custom: e.target.value });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">
                      Klausul Untuk (Rincian Tugas):
                    </label>
                    <textarea
                      rows={2}
                      value={
                        form.untuk_custom !== undefined
                          ? form.untuk_custom
                          : `Mengikuti kegiatan ${form.nama_acara} yang dilaksanakan di ${form.lokasi_kegiatan}, ${form.kota_kegiatan}.`
                      }
                      onChange={(e) => {
                        setForm({ ...form, untuk_custom: e.target.value });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">
                      Beban Anggaran (DIPA):
                    </label>
                    <input
                      type="text"
                      value={form.pembebanan_anggaran}
                      onChange={(e) => {
                        setForm({ ...form, pembebanan_anggaran: e.target.value, penutup_custom: undefined });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Pemilihan Pegawai */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pilih Pegawai yang Ditugaskan
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      form.selectedPegawaiIds.length > 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {form.selectedPegawaiIds.length} Terpilih{' '}
                    {form.selectedPegawaiIds.length > 3
                      ? '(Format Lampiran)'
                      : '(1 Halaman Pas)'}
                  </span>
                </div>

                {/* Explanation Banner */}
                <div
                  className={`p-2 rounded-lg border text-[11.5px] flex items-start space-x-2 ${
                    form.selectedPegawaiIds.length > 3
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-teal-50 border-teal-200 text-teal-900'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    {form.selectedPegawaiIds.length <= 3 ? (
                      <span>
                        <strong>Aturan 1–3 Orang:</strong> Surat otomatis diskalakan proporsional agar <strong>muat tepat 1 halaman</strong> tanpa meluber ke halaman berikutnya.
                      </span>
                    ) : (
                      <span>
                        <strong>Aturan &gt; 3 Orang:</strong> Otomatis dialihkan ke halaman kedua sebagai tabel Lampiran resmi.
                      </span>
                    )}
                  </div>
                </div>

                {/* Search Pegawai */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama pegawai, NIP, atau jabatan..."
                    value={pegawaiSearch}
                    onChange={(e) => setPegawaiSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Pegawai List Multi-select */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {pegawaiList
                    .filter(
                      (p) =>
                        p.nama.toLowerCase().includes(pegawaiSearch.toLowerCase()) ||
                        p.nip.includes(pegawaiSearch) ||
                        p.jabatan.toLowerCase().includes(pegawaiSearch.toLowerCase())
                    )
                    .map((peg) => {
                      const isSelected = form.selectedPegawaiIds.includes(peg.id);
                      return (
                        <div
                          key={peg.id}
                          onClick={() => handleTogglePegawaiSelect(peg.id)}
                          className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50/70 hover:bg-teal-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`font-semibold ${
                                  isSelected ? 'text-teal-950 font-bold' : 'text-slate-800'
                                }`}
                              >
                                {peg.nama}
                              </span>
                              {peg.status === 'Cuti' && (
                                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-medium">
                                  Cuti
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {peg.jabatan} &middot; <span className="font-mono">{peg.nip}</span>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Card 4: Penandatangan & Konseptor */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pejabat Penandatangan &amp; Konseptor
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Pilihan Pejabat */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih Pejabat Penandatangan:
                    </label>
                    <select
                      value={form.selectedPejabatId}
                      onChange={(e) => {
                        setForm({ ...form, selectedPejabatId: e.target.value });
                        setIsSavedToDB(false);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 font-medium"
                    >
                      {pejabatList.map((pej) => (
                        <option key={pej.id} value={pej.id}>
                          {pej.nama} &mdash; {pej.jabatan} ({pej.sebagai})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilih Konseptor dari Daftar Pegawai */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Konseptor Pembuat Surat Tugas:
                    </label>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {pegawaiList.map((peg) => {
                        const isSelected = form.konseptor === peg.nama;
                        return (
                          <div
                            key={peg.id}
                            onClick={() => {
                              setForm({ ...form, konseptor: isSelected ? '' : peg.nama });
                              setIsSavedToDB(false);
                            }}
                            className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-50/70 hover:bg-amber-50'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              <div
                                className={`font-semibold ${
                                  isSelected ? 'text-amber-900 font-bold' : 'text-slate-800'
                                }`}
                              >
                                {peg.nama}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {peg.jabatan}
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {form.konseptor && (
                      <p className="text-[10.5px] text-amber-700 mt-0.5 font-medium">
                        ✓ Konseptor: {form.konseptor}
                      </p>
                    )}
                  </div>

                  {/* Kota & Tanggal Surat */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kota Surat:
                      </label>
                      <input
                        type="text"
                        value={form.kota_surat}
                        onChange={(e) => {
                          setForm({ ...form, kota_surat: e.target.value });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tanggal Surat Dibuat:
                      </label>
                      <input
                        type="date"
                        value={form.tanggal_surat}
                        onChange={(e) => {
                          setForm({ ...form, tanggal_surat: e.target.value });
                          setIsSavedToDB(false);
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {isSavingToSheets && (
                  <div className="flex items-center space-x-2 text-xs text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Google Sheets kantor...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Official Document Preview (7 cols) */}
            <div className="lg:col-span-7 print:w-full print:m-0 print:p-0">
              <SuratPreview
                form={form}
                selectedPegawai={selectedPegawaiList}
                selectedPejabat={selectedPejabatObj}
                onDownloadPdf={handleDownloadPdf}
                isGeneratingPdf={isGeneratingPdf}
                onSaveToDatabase={handleSaveToDatabase}
                isSaved={isSavedToDB}
                isEditMode={!!editingRecord}
                onCancelEdit={handleCancelEdit}
                onUpdateForm={(updated) => {
                  setForm((prev) => ({ ...prev, ...updated }));
                  setIsSavedToDB(false);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BUKU AGENDA & DATABASE */}
        {activeTab === 'database' && (
          <DatabaseView
            pegawaiList={pegawaiList}
            pejabatList={pejabatList}
            nomorSuratList={nomorSuratList}
            onAddPegawai={handleAddPegawai}
            onUpdatePegawai={handleUpdatePegawai}
            onDeletePegawai={handleDeletePegawai}
            onToggleStatusPegawai={handleToggleStatusPegawai}
            onAddPejabat={handleAddPejabat}
            onUpdatePejabat={handleUpdatePejabat}
            onDeletePejabat={handleDeletePejabat}
            onSetDefaultPejabat={handleSetDefaultPejabat}
            onEditSurat={handleEditSurat}
            onUpdateNomorSurat={(updated) => {
              setNomorSuratList((prev) =>
                prev.map((rec) => (rec.id === updated.id ? updated : rec))
              );
            }}
          />
        )}
      </main>

      {/* Modals */}
      <InvitationUploadModal
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        onApplyExtraction={handleApplyExtraction}
      />

      <SheetsConfigModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        onConnected={() => {
          setIsSheetsConnected(true);
          syncFromSheets();
        }}
      />
    </div>
  );
}
export default App;
