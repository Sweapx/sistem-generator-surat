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
  Tag,
  Mail,
  ScrollText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import {
  Pegawai,
  Pejabat,
  NomorSuratRecord,
  EkstraksiUndangan,
  EkstraksiSuratUndangan,
  EkstraksiNotaDinas,
  GeneratedLampiranDraft,
  LampiranItem,
  SuratTugasFormState,
  AuthState,
  User,
  JenisNaskah,
  KlasifikasiItem,
} from './types';
import {
  INITIAL_PEGAWAI,
  INITIAL_PEJABAT,
  INITIAL_NOMOR_SURAT,
  INITIAL_USERS,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { HomeView, buildFormStateFromRecord } from './components/HomeView';
import { InvitationUploadModal } from './components/InvitationUploadModal';
import { SuratPreview } from './components/SuratPreview';
import { DatabaseView } from './components/DatabaseView';
import { SheetsConfigModal } from './components/SheetsConfigModal';
import { KlasifikasiPickerModal } from './components/KlasifikasiPickerModal';
import { FloatingToolbar } from './components/FloatingToolbar';
import { LampiranManager, toRoman, getInternalPusakaJabatanKhusus } from './components/LampiranManager';
import { KLASIFIKASI_SURAT } from './data/klasifikasiData';
import {
  formatNomorNaskah,
  getDefaultKlasifikasi,
  getJenisNaskahLabel,
  getJenisNaskahCode,
} from './services/nomorSuratService';
import { exportNaskahDinasDocx, formatTanggalIndonesia, stripAcademicTitles, cleanTempatField } from './services/docxService';
import { formatNumberedPoints, combineNotaDinasSections } from './services/naskahFormatter';
import {
  setMemoryDraft,
  getMemoryDraft,
  saveDraftToIndexedDB,
  loadDraftFromIndexedDB,
  removeDraftFromIndexedDB,
} from './services/draftStorage';
import {
  isSheetsConfigured,
  fetchNomorSuratFromSheets,
  fetchPegawaiFromSheets,
  fetchPejabatFromSheets,
  appendNomorSuratToSheets,
  updateNomorSuratInSheets,
} from './services/sheetsService';
import {
  getCurrentAuth,
  clearAuthSession,
  getStoredUsers,
  fetchUsersList,
  saveUserAccount,
  deleteUserAccount,
} from './services/authService';

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

function stripHeavyLampiran(items?: any[]) {
  if (!Array.isArray(items)) return items;
  return items.map((it) => ({
    ...it,
    file_data: undefined,
    pdf_pages_images: undefined,
  }));
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    if (key === LS_NOMOR_SURAT && Array.isArray(value)) {
      const compactList = value.map((rec: any) => ({
        ...rec,
        pdf_base64: undefined,
        docx_base64: undefined,
        form_state: rec.form_state
          ? {
              ...rec.form_state,
              lampiran_items: stripHeavyLampiran(rec.form_state.lampiran_items),
              undangan_lampiran_items: stripHeavyLampiran(rec.form_state.undangan_lampiran_items),
              nota_lampiran_items: stripHeavyLampiran(rec.form_state.nota_lampiran_items),
            }
          : undefined,
      }));
      localStorage.setItem(key, JSON.stringify(compactList));
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'database'>('home');

  // ─── Authentication & User State ───────────────────────────────────────────
  const [auth, setAuth] = useState<AuthState>(() => getCurrentAuth());
  const [usersList, setUsersList] = useState<User[]>(() => getStoredUsers());

  // Master Data State
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() =>
    loadFromStorage<Pegawai[]>(LS_PEGAWAI, INITIAL_PEGAWAI)
  );
  const [pejabatList, setPejabatList] = useState<Pejabat[]>(() =>
    loadFromStorage<Pejabat[]>(LS_PEJABAT, INITIAL_PEJABAT).map((p) => ({
      ...p,
      nama: stripAcademicTitles(p.nama) || p.nama,
    }))
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
      const [pegawai, pejabat, nomorSurat, users] = await Promise.all([
        fetchPegawaiFromSheets(),
        fetchPejabatFromSheets(),
        fetchNomorSuratFromSheets(),
        fetchUsersList().catch(() => [] as User[]),
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
      if (users && users.length > 0) {
        setUsersList(users);
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

  // ─── Next Number Urut Computation ──────────────────────────────────────────
  const nextNomorUrut = useMemo(() => {
    if (nomorSuratList.length === 0) return 1;
    const yearRecords = nomorSuratList.filter(
      (r) => (r.tahun === simulatedYear || !r.tahun) && typeof r.nomor_urut === 'number' && !isNaN(r.nomor_urut)
    );
    if (yearRecords.length === 0) return 1;
    const maxUrut = Math.max(...yearRecords.map((r) => r.nomor_urut));
    return maxUrut > 0 ? maxUrut + 1 : 1;
  }, [nomorSuratList, simulatedYear]);

  // ─── Form State ──────────────────────────────────────────────────────────────
  const defaultPejabat =
    pejabatList.find((p) => p.is_default) || pejabatList[0];

  const [form, setForm] = useState<SuratTugasFormState>(() => {
    const defaultKlas = getDefaultKlasifikasi('TUGAS');
    const initialNomor = formatNomorNaskah('TUGAS', 1, defaultKlas.kode_lengkap, simulatedMonth, simulatedYear);
    const baseDefault: SuratTugasFormState = {
      jenis_naskah: 'TUGAS',
      kode_klasifikasi: defaultKlas.kode_lengkap,
      kategori_klasifikasi: defaultKlas.kategori_utama,
      uraian_klasifikasi: defaultKlas.uraian,
      nomor_urut: 1,
      tahun: simulatedYear,
      bulan: simulatedMonth,
      nomor_lengkap: initialNomor,
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
      sertakan_beban_anggaran: true,

      selectedPegawaiIds: [],
      selectedPejabatId: defaultPejabat.id,
      kriteria_peserta: '',
      konseptor: '',
      ttd_image: undefined,

      // Default Undangan
      undangan_sifat: 'Biasa',
      undangan_lampiran: '',
      undangan_hal: '',
      undangan_kepada: '',
      undangan_pembuka: '',
      undangan_tipe_tempat: 'offline',
      undangan_tempat_offline: '',
      undangan_tempat_online: '',
      undangan_waktu: '',
      undangan_penutup: '',
      undangan_lampiran_items: [],

      // Default Nota Dinas
      nota_kepada: '',
      nota_dari: '',
      nota_hal: '',
      nota_sifat: 'Biasa',
      nota_lampiran: '',
      nota_pembuka: '',
      nota_isi: '',
      nota_penutup: '',
      nota_lampiran_items: [],
      lampiran_items: [],
    };

    try {
      const activeJenis = (localStorage.getItem('pusaka_active_naskah') as JenisNaskah) || 'TUGAS';
      const savedDraft = localStorage.getItem(`pusaka_draft_${activeJenis}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return {
          ...baseDefault,
          ...parsed,
          jenis_naskah: activeJenis,
          selectedPegawaiIds: Array.isArray(parsed.selectedPegawaiIds) ? parsed.selectedPegawaiIds : [],
          undangan_lampiran_items: Array.isArray(parsed.undangan_lampiran_items) ? parsed.undangan_lampiran_items : [],
          nota_lampiran_items: Array.isArray(parsed.nota_lampiran_items) ? parsed.nota_lampiran_items : [],
          lampiran_items: Array.isArray(parsed.lampiran_items) ? parsed.lampiran_items : [],
        };
      }
    } catch {}

    return baseDefault;
  });

  // Saat aplikasi pertama kali dimuat (termasuk setelah refresh F5), pulihkan draft penuh (termasuk gambar PDF lampiran) dari IndexedDB
  useEffect(() => {
    const activeJenis = (localStorage.getItem('pusaka_active_naskah') as JenisNaskah) || 'TUGAS';
    loadDraftFromIndexedDB(activeJenis).then((idbDraft) => {
      if (idbDraft) {
        setForm((prev) => {
          if (prev.jenis_naskah !== activeJenis) return prev;
          return {
            ...prev,
            ...idbDraft,
            jenis_naskah: activeJenis,
            selectedPegawaiIds: Array.isArray(idbDraft.selectedPegawaiIds) ? idbDraft.selectedPegawaiIds : prev.selectedPegawaiIds,
            undangan_lampiran_items: Array.isArray(idbDraft.undangan_lampiran_items) ? idbDraft.undangan_lampiran_items : prev.undangan_lampiran_items,
            nota_lampiran_items: Array.isArray(idbDraft.nota_lampiran_items) ? idbDraft.nota_lampiran_items : prev.nota_lampiran_items,
            lampiran_items: Array.isArray(idbDraft.lampiran_items) ? idbDraft.lampiran_items : prev.lampiran_items,
          };
        });
      }
    });
  }, []);

  // Auto-Save Draft per tab surat ke IndexedDB, Memory, dan localStorage setiap kali form berubah
  useEffect(() => {
    if (form && form.jenis_naskah) {
      setMemoryDraft(form.jenis_naskah, form);
      saveDraftToIndexedDB(form.jenis_naskah, form);
      localStorage.setItem('pusaka_active_naskah', form.jenis_naskah);
      try {
        localStorage.setItem(`pusaka_draft_${form.jenis_naskah}`, JSON.stringify(form));
      } catch {
        // Jika lampiran melebihi kuota localStorage (5MB), IndexedDB sudah menyimpan versi penuhnya (termasuk pdf_pages_images)
        try {
          const lightDraft = {
            ...form,
            lampiran_items: stripHeavyLampiran(form.lampiran_items),
            undangan_lampiran_items: stripHeavyLampiran(form.undangan_lampiran_items),
            nota_lampiran_items: stripHeavyLampiran(form.nota_lampiran_items),
          };
          localStorage.setItem(`pusaka_draft_${form.jenis_naskah}`, JSON.stringify(lightDraft));
        } catch {}
      }
    }
  }, [form]);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<NomorSuratRecord | null>(null);

  // Computed next nomor info based on current form
  const nextNomorInfo = useMemo(() => {
    const currentJenis = form.jenis_naskah || 'TUGAS';
    const currentKode = form.kode_klasifikasi || (currentJenis === 'UNDANGAN' ? 'PR.01.01' : currentJenis === 'NOTA_DINAS' ? 'KP.01.01' : 'KP.01.06');
    return {
      nomor_urut: nextNomorUrut,
      tahun: simulatedYear,
      bulan: simulatedMonth,
      nomor_lengkap: formatNomorNaskah(currentJenis, nextNomorUrut, currentKode, simulatedMonth, simulatedYear),
    };
  }, [nextNomorUrut, simulatedYear, simulatedMonth, form.jenis_naskah, form.kode_klasifikasi]);

  // Always keep form synchronized with nextNomorUrut (kecuali sedang dalam mode edit surat)
  useEffect(() => {
    if (editingRecord) return;
    const computed = formatNomorNaskah(
      form.jenis_naskah || 'TUGAS',
      nextNomorUrut,
      form.kode_klasifikasi || 'KP.01.06',
      simulatedMonth,
      simulatedYear
    );
    setForm((prev) => {
      if (
        prev.nomor_urut === nextNomorUrut &&
        prev.tahun === simulatedYear &&
        prev.bulan === simulatedMonth &&
        prev.nomor_lengkap === computed
      ) {
        return prev;
      }
      return {
        ...prev,
        nomor_urut: nextNomorUrut,
        tahun: simulatedYear,
        bulan: simulatedMonth,
        nomor_lengkap: computed,
      };
    });
  }, [nextNomorUrut, simulatedMonth, simulatedYear, editingRecord, form.jenis_naskah, form.kode_klasifikasi]);

  // ─── Modal & UI States ───────────────────────────────────────────────────────
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionModalMode, setExtractionModalMode] = useState<JenisNaskah>('TUGAS');
  const [isKlasifikasiModalOpen, setIsKlasifikasiModalOpen] = useState(false);
  const [isSavedToDB, setIsSavedToDB] = useState(false);
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);
  const [lastSavedDriveUrl, setLastSavedDriveUrl] = useState<string | null>(null);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ─── Collapsible Form Sections (Persisted in localStorage) ──────────────────
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('pusaka_collapsed_sections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionKey]: !prev[sectionKey] };
      try {
        localStorage.setItem('pusaka_collapsed_sections', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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
  const buildLampiranItemsFromAi = (
    drafts: GeneratedLampiranDraft[] | undefined,
    romanOffset = 0
  ): LampiranItem[] | undefined => {
    if (!drafts || drafts.length === 0) return undefined;
    return drafts.map((d, idx) => {
      let isiFinal = d.isi || '';
      if (d.include_internal_pusaka && pegawaiList.length > 0) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const sectionMatches = isiFinal.match(/^\*\*[A-Z]\.\s+/gm) || [];
        const nextLetter = letters[sectionMatches.length % letters.length];
        const internalLines = [
          `**${nextLetter}. Pusat Kebijakan Strategis**`,
          ...pegawaiList.map((p, pIdx) => {
            const jbt = getInternalPusakaJabatanKhusus(p.nama);
            return `  ${pIdx + 1}. ${jbt ? `${p.nama}, ${jbt}` : p.nama}`;
          }),
        ].join('\n');
        isiFinal = isiFinal ? `${isiFinal.trim()}\n\n${internalLines}` : internalLines;
      }
      return {
        id: `lamp-ai-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        tipe: 'buat' as const,
        label_mark: `Lampiran ${toRoman(idx + 1 + romanOffset)}`,
        judul: d.judul || 'LAMPIRAN',
        sub_judul: d.sub_judul,
        isi: isiFinal,
      };
    });
  };

  const handleApplyExtraction = (extracted: EkstraksiUndangan) => {
    let nextSelectedPegawaiIds: string[] | undefined = undefined;
    if (extracted.pegawai_nama_list && extracted.pegawai_nama_list.length > 0) {
      const matchedIds: string[] = [];
      const newPegawaiToAdd: Pegawai[] = [];
      extracted.pegawai_nama_list.forEach((rawName, idx) => {
        const cleanName = rawName.trim();
        if (!cleanName) return;
        const lower = cleanName.toLowerCase();
        const found = pegawaiList.find(
          (p) =>
            p.nama.toLowerCase() === lower ||
            p.nama.toLowerCase().includes(lower) ||
            lower.includes(p.nama.toLowerCase())
        );
        if (found) {
          if (!matchedIds.includes(found.id)) matchedIds.push(found.id);
        } else {
          const newId = `peg-ai-${Date.now()}-${idx}`;
          newPegawaiToAdd.push({
            id: newId,
            nama: cleanName,
            nip: '-',
            pangkat_golongan: '-',
            jabatan: 'Pegawai Pusat Kebijakan Strategis',
            unit_kerja: 'Pusat Kebijakan Strategis',
            status: 'Aktif',
          });
          matchedIds.push(newId);
        }
      });
      if (newPegawaiToAdd.length > 0) {
        setPegawaiList((prev) => [...prev, ...newPegawaiToAdd]);
      }
      if (matchedIds.length > 0) {
        nextSelectedPegawaiIds = matchedIds;
      }
    }

    setForm((prev) => {
      const effectivePegawaiIds = nextSelectedPegawaiIds ?? prev.selectedPegawaiIds;
      const aiLampiran = buildLampiranItemsFromAi(
        extracted.lampiran_generated,
        effectivePegawaiIds.length > 3 ? 1 : 0
      );
      return {
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
        selectedPegawaiIds: effectivePegawaiIds,
        ...(aiLampiran ? { lampiran_items: aiLampiran } : {}),
        // Terapkan formulasi klausul hasil analisa AI
        menimbang_custom: extracted.narasi_menimbang,
        dasar_custom: extracted.narasi_dasar,
        untuk_custom: extracted.narasi_untuk,
      };
    });
    setIsSavedToDB(false);
  };

  const handleApplyUndanganExtraction = (data: EkstraksiSuratUndangan) => {
    const aiLampiran = buildLampiranItemsFromAi(data.lampiran_generated, 0);
    setForm((prev) => {
      const finalLampiranItems = aiLampiran ?? prev.undangan_lampiran_items ?? [];
      const lCount = finalLampiranItems.length;
      const computedLampStr =
        lCount === 0
          ? data.undangan_lampiran || '-'
          : `${lCount} (${lCount === 1 ? 'satu' : lCount === 2 ? 'dua' : lCount}) berkas`;

      const matchedKlas = data.rekomendasi_kode_klasifikasi
        ? KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === data.rekomendasi_kode_klasifikasi)
        : undefined;
      const nextKode = matchedKlas?.kode_lengkap || prev.kode_klasifikasi || 'PR.01.01';
      const nextNomor = formatNomorNaskah(
        'UNDANGAN',
        prev.nomor_urut || nextNomorUrut,
        nextKode,
        prev.bulan || simulatedMonth,
        prev.tahun || simulatedYear
      );

      return {
        ...prev,
        undangan_hal: data.undangan_hal,
        undangan_agenda: data.undangan_agenda,
        hari_tanggal_pelaksanaan: data.hari_tanggal_pelaksanaan,
        undangan_waktu: data.undangan_waktu,
        undangan_tipe_tempat: data.undangan_tipe_tempat,
        undangan_tempat_offline: data.undangan_tempat_offline || prev.undangan_tempat_offline,
        undangan_tempat_online: data.undangan_tempat_online || prev.undangan_tempat_online,
        undangan_pembuka: data.undangan_pembuka || prev.undangan_pembuka,
        undangan_kepada: data.undangan_kepada || prev.undangan_kepada,
        undangan_sifat: data.undangan_sifat || prev.undangan_sifat || 'Biasa',
        undangan_lampiran: computedLampStr,
        undangan_lampiran_items: finalLampiranItems,
        ...(matchedKlas
          ? {
              kode_klasifikasi: matchedKlas.kode_lengkap,
              kategori_klasifikasi: matchedKlas.kategori_utama,
              uraian_klasifikasi: matchedKlas.uraian,
              nomor_lengkap: nextNomor,
            }
          : {}),
      };
    });
    setIsSavedToDB(false);
  };

  const handleApplyNotaDinasExtraction = (data: EkstraksiNotaDinas) => {
    const aiLampiran = buildLampiranItemsFromAi(data.lampiran_generated, 0);
    setForm((prev) => {
      const unifiedBody = combineNotaDinasSections(
        data.nota_pembuka,
        data.nota_isi,
        data.nota_penutup
      );
      const matchedKlas = data.rekomendasi_kode_klasifikasi
        ? KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === data.rekomendasi_kode_klasifikasi)
        : undefined;
      const nextKode = matchedKlas?.kode_lengkap || prev.kode_klasifikasi || 'KP.01.01';
      const nextNomor = formatNomorNaskah(
        'NOTA_DINAS',
        prev.nomor_urut || nextNomorUrut,
        nextKode,
        prev.bulan || simulatedMonth,
        prev.tahun || simulatedYear
      );
      const finalLampiranItems = aiLampiran ?? prev.nota_lampiran_items ?? [];
      const lCount = finalLampiranItems.length;

      return {
        ...prev,
        nota_hal: data.nota_hal,
        nota_kepada: data.nota_kepada,
        nota_dari: data.nota_dari || 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: data.nota_sifat || 'Biasa',
        nota_lampiran:
          lCount > 0
            ? `${lCount === 1 ? 'Satu' : lCount} berkas`
            : data.nota_lampiran || prev.nota_lampiran || '-',
        nota_pembuka: '',
        nota_isi: unifiedBody,
        nota_penutup: '',
        nota_lampiran_items: finalLampiranItems,
        ...(matchedKlas
          ? {
              kode_klasifikasi: matchedKlas.kode_lengkap,
              kategori_klasifikasi: matchedKlas.kategori_utama,
              uraian_klasifikasi: matchedKlas.uraian,
              nomor_lengkap: nextNomor,
            }
          : {}),
      };
    });
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
      const cleanNomor = (form.nomor_lengkap || 'Dokumen').replace(/[\/\\:\*\?"<>\|]/g, '_');
      const prefix = form.jenis_naskah === 'UNDANGAN' ? 'Surat_Undangan' : form.jenis_naskah === 'NOTA_DINAS' ? 'Nota_Dinas' : 'Surat_Tugas';
      const opt = {
        margin: 0,
        filename: `${prefix}_${cleanNomor}.pdf`,
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

            // Sisipkan style lengkap khusus dokumen agar hasil PDF 100% identik dengan preview web
            const printStyle = clonedDoc.createElement('style');
            printStyle.textContent = `
              * { box-sizing: border-box; }
              body { background: #ffffff !important; color: #000000 !important; font-family: Arial, sans-serif !important; margin: 0 !important; padding: 0 !important; }
              .no-print, [data-no-print], .print\\:hidden, .action-bar-print-hide { display: none !important; }
              .preview-scroll-container { overflow: visible !important; max-height: none !important; height: auto !important; padding: 0 !important; background: #ffffff !important; border: none !important; }
              .preview-doc-wrapper { width: 794px !important; height: auto !important; margin: 0 auto !important; position: static !important; }
              .preview-doc-inner { position: static !important; transform: none !important; width: 794px !important; }
              #surat-tugas-document { background: #ffffff !important; color: #000000 !important; width: 794px !important; margin: 0 auto !important; padding: 0 !important; }
              .print-page {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 auto !important;
                width: 794px !important;
                height: 1122px !important;
                min-height: 1122px !important;
                max-height: 1122px !important;
                overflow: hidden !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
              }
              .print-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .kop-container { margin-bottom: 4px !important; }
              .kop-alamat-line { margin-top: 6px !important; padding-bottom: 3px !important; }
              .editable-text-field { background: transparent !important; border: none !important; outline: none !important; box-shadow: none !important; }
              .rt-line { min-height: 1em; }
              .rt-line[data-list='b'] { position: relative; padding-left: 20px; }
              .rt-line[data-list='b']::before { content: '\\2022'; position: absolute; left: 6px; }
              .rt-h1 { font-weight: 700; font-size: 1.17em; text-indent: 0 !important; margin: 5px 0 3px; }
              .rt-h2 { font-weight: 700; font-size: 1.08em; text-indent: 0 !important; margin: 4px 0 3px; }
              .rt-nota .rt-p { text-indent: 32px; margin: 4px 0; line-height: 1.42; text-align: justify; }
              .rt-nota .rt-p[data-indent] { text-indent: 0 !important; }
              .rt-nota .rt-num { padding-left: 24px; text-indent: -24px; margin: 5px 0 3px; line-height: 1.42; text-align: justify; }
              .rt-nota .rt-sub { padding-left: 38px; text-indent: -18px; margin: 2px 0 2px; line-height: 1.42; text-align: justify; }
              .rt-nota .rt-b { margin: 2px 0 2px; line-height: 1.42; text-align: justify; }
              .rt-nota .rt-kv { display: flex; align-items: flex-start; padding-left: 32px; text-indent: 0 !important; margin: 2px 0; line-height: 1.4; text-align: left; }
              .rt-nota .rt-kv-key { width: 155px; flex-shrink: 0; }
              .rt-nota .rt-kv-sep { width: 16px; flex-shrink: 0; text-align: center; }
              .rt-nota .rt-kv-val { flex: 1; min-width: 0; }
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

  /**
   * Unduh dokumen sebagai Microsoft Word (.docx) resmi sesuai template naskah
   */
  const handleDownloadDocx = async () => {
    try {
      const blob = await exportNaskahDinasDocx(form, selectedPegawaiList, selectedPejabatObj);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanNomor = (form.nomor_lengkap || 'Dokumen').replace(/[\/\\:\*\?"<>\|]/g, '_');
      const prefix = form.jenis_naskah === 'UNDANGAN' ? 'Surat_Undangan' : form.jenis_naskah === 'NOTA_DINAS' ? 'Nota_Dinas' : 'Surat_Tugas';
      a.download = `${prefix}_${cleanNomor}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      alert('Gagal mengunduh file DOCX: ' + (err as any)?.message);
    }
  };

  /**
   * Ganti jenis naskah (Tugas, Undangan, Nota Dinas) dengan Auto-Save Draft
   */
  const handleChangeJenisNaskah = (newJenis: JenisNaskah) => {
    const currentJenis = form.jenis_naskah || 'TUGAS';
    if (newJenis === currentJenis) return;

    // 1. Simpan draft naskah saat ini ke Memory, IndexedDB, dan localStorage
    setMemoryDraft(currentJenis, form);
    saveDraftToIndexedDB(currentJenis, form);
    try {
      localStorage.setItem(`pusaka_draft_${currentJenis}`, JSON.stringify(form));
    } catch {
      try {
        const lightDraft = {
          ...form,
          lampiran_items: stripHeavyLampiran(form.lampiran_items),
          undangan_lampiran_items: stripHeavyLampiran(form.undangan_lampiran_items),
          nota_lampiran_items: stripHeavyLampiran(form.nota_lampiran_items),
        };
        localStorage.setItem(`pusaka_draft_${currentJenis}`, JSON.stringify(lightDraft));
      } catch {}
    }

    // 2. Cek apakah ada draft naskah tersimpan di Memory atau localStorage untuk newJenis
    const defaultKlas = getDefaultKlasifikasi(newJenis);
    const applyLoadedDraft = (parsed: any) => {
      const kode = parsed.kode_klasifikasi || defaultKlas.kode_lengkap;
      const computedNomor = formatNomorNaskah(
        newJenis,
        form.nomor_urut || nextNomorUrut,
        kode,
        form.bulan || simulatedMonth,
        form.tahun || simulatedYear
      );
      setForm((prev) => ({
        ...prev,
        ...parsed,
        jenis_naskah: newJenis,
        kode_klasifikasi: kode,
        kategori_klasifikasi: parsed.kategori_klasifikasi || defaultKlas.kategori_utama,
        uraian_klasifikasi: parsed.uraian_klasifikasi || defaultKlas.uraian,
        nomor_lengkap: computedNomor,
        selectedPegawaiIds: Array.isArray(parsed.selectedPegawaiIds) ? parsed.selectedPegawaiIds : prev.selectedPegawaiIds || [],
        undangan_lampiran_items: Array.isArray(parsed.undangan_lampiran_items) ? parsed.undangan_lampiran_items : [],
        nota_lampiran_items: Array.isArray(parsed.nota_lampiran_items) ? parsed.nota_lampiran_items : [],
        lampiran_items: Array.isArray(parsed.lampiran_items) ? parsed.lampiran_items : [],
      }));
      setIsSavedToDB(false);
    };

    const memDraft = getMemoryDraft(newJenis);
    if (memDraft) {
      applyLoadedDraft(memDraft);
      return;
    }

    try {
      const savedDraft = localStorage.getItem(`pusaka_draft_${newJenis}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        applyLoadedDraft(parsed);
        // Pulihkan juga versi penuh dari IndexedDB jika ada lampiran PDF besar
        loadDraftFromIndexedDB(newJenis).then((idbDraft) => {
          if (idbDraft) applyLoadedDraft(idbDraft);
        });
        return;
      }
    } catch {}

    loadDraftFromIndexedDB(newJenis).then((idbDraft) => {
      if (idbDraft) applyLoadedDraft(idbDraft);
    });
    const newNomor = formatNomorNaskah(
      newJenis,
      form.nomor_urut || nextNomorUrut,
      defaultKlas.kode_lengkap,
      form.bulan || simulatedMonth,
      form.tahun || simulatedYear
    );
    setForm((prev) => ({
      ...prev,
      jenis_naskah: newJenis,
      kode_klasifikasi: defaultKlas.kode_lengkap,
      kategori_klasifikasi: defaultKlas.kategori_utama,
      uraian_klasifikasi: defaultKlas.uraian,
      nomor_lengkap: newNomor,
    }));
    setIsSavedToDB(false);
  };

  /**
   * Pilih klasifikasi dari Smart Picker (Fasilitatif / Substantif)
   */
  const handleSelectKlasifikasi = (item: KlasifikasiItem) => {
    const newNomor = formatNomorNaskah(
      form.jenis_naskah || 'TUGAS',
      form.nomor_urut || nextNomorUrut,
      item.kode_lengkap,
      form.bulan || simulatedMonth,
      form.tahun || simulatedYear
    );
    setForm((prev) => ({
      ...prev,
      kode_klasifikasi: item.kode_lengkap,
      kategori_klasifikasi: item.kategori_utama,
      uraian_klasifikasi: item.uraian,
      nomor_lengkap: newNomor,
    }));
    setIsSavedToDB(false);
  };

  // ─── Edit Surat & Home Navigation Handlers ─────────────────────────────────
  const handleEditSurat = (rec: NomorSuratRecord) => {
    setEditingRecord(rec);
    setIsSavedToDB(false);
    setLastSavedDriveUrl(rec.drive_url || null);

    const reconstructed = buildFormStateFromRecord(
      rec,
      pegawaiList,
      pejabatList,
      simulatedMonth,
      simulatedYear
    );
    setForm(reconstructed);

    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Opsi B pada kartu Recent di Beranda:
   * Gunakan seluruh isi dokumen yang sudah diterbitkan sebagai Template Surat Baru
   * (isi sama persis 100%, namun mendapat Nomor Urut berikutnya sebagai surat baru).
   */
  const handleDuplicateAsNewTemplate = (rec: NomorSuratRecord) => {
    setEditingRecord(null);
    setIsSavedToDB(false);
    setLastSavedDriveUrl(null);

    const reconstructed = buildFormStateFromRecord(
      rec,
      pegawaiList,
      pejabatList,
      simulatedMonth,
      simulatedYear
    );
    const jenis = reconstructed.jenis_naskah || 'TUGAS';
    const defaultKlas = getDefaultKlasifikasi(jenis);
    const kode = reconstructed.kode_klasifikasi || defaultKlas.kode_lengkap;
    const newNomorLengkap = formatNomorNaskah(
      jenis,
      nextNomorUrut,
      kode,
      simulatedMonth,
      simulatedYear
    );

    setForm({
      ...reconstructed,
      nomor_urut: nextNomorUrut,
      bulan: simulatedMonth,
      tahun: simulatedYear,
      nomor_lengkap: newNomorLengkap,
      tanggal_surat: new Date().toISOString().split('T')[0],
      custom_tanggal_surat_text: undefined,
    });

    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Mulai buat naskah dari Card Choice di Beranda (Manual atau langsung buka Modal AI)
   */
  const handleStartCreateFromHome = (jenis: JenisNaskah, openAiModal = false) => {
    setEditingRecord(null);
    setIsSavedToDB(false);
    setLastSavedDriveUrl(null);
    handleChangeJenisNaskah(jenis);
    setActiveTab('generator');
    if (openAiModal) {
      setExtractionModalMode(jenis);
      setIsExtractionModalOpen(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueDraftFromHome = (jenis: JenisNaskah) => {
    setEditingRecord(null);
    setIsSavedToDB(false);
    handleChangeJenisNaskah(jenis);
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
    if (form.jenis_naskah === 'TUGAS' && selectedPegawaiList.length === 0) {
      alert('Pilih minimal 1 orang pegawai sebelum menyimpan Surat Tugas.');
      return;
    }

    const currentJenis = form.jenis_naskah || 'TUGAS';
    const currentNomorLengkap = editingRecord
      ? (editingRecord.nomor_lengkap || form.nomor_lengkap)
      : (form.nomor_lengkap || nextNomorInfo.nomor_lengkap);
    const cleanNomor = currentNomorLengkap.replace(/[\/\\:\*\?"<>\|]/g, '_');
    const filePrefix = currentJenis === 'UNDANGAN' ? 'Surat_Undangan' : currentJenis === 'NOTA_DINAS' ? 'Nota_Dinas' : 'Surat_Tugas';
    const docFileName = `${filePrefix}_${cleanNomor}.docx`;
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const perihalStr =
      currentJenis === 'UNDANGAN'
        ? (form.undangan_hal || form.nama_acara || 'Undangan')
        : currentJenis === 'NOTA_DINAS'
        ? (form.nota_hal || form.nama_acara || 'Nota Dinas')
        : (form.nama_acara || 'Kegiatan Surat Tugas');

    const tujuanStr =
      currentJenis === 'UNDANGAN'
        ? (form.undangan_tipe_tempat === 'online' ? (form.undangan_tempat_online || 'Online') : (form.undangan_tempat_offline || form.lokasi_kegiatan || 'Jakarta'))
        : currentJenis === 'NOTA_DINAS'
        ? 'Pusat Kebijakan Strategis'
        : `${form.lokasi_kegiatan || '-'}, ${form.kota_kegiatan || '-'}`;

    const dasarStr =
      currentJenis === 'UNDANGAN'
        ? (form.undangan_hal || 'Undangan')
        : currentJenis === 'NOTA_DINAS'
        ? (form.nota_pembuka || 'Nota Dinas')
        : `Surat Undangan ${form.instansi_pengundang} No. ${form.nomor_surat_undangan}`;

    const kepadaStr =
      currentJenis === 'UNDANGAN'
        ? (form.undangan_kepada || 'Daftar Terlampir')
        : currentJenis === 'NOTA_DINAS'
        ? (form.nota_kepada || 'Sekretaris Jenderal')
        : selectedPegawaiList.length > 3
        ? 'Daftar Terlampir'
        : selectedPegawaiList.map((p) => p.nama).join(', ');

    setIsSavingToSheets(true);
    setLastSyncMsg('Menyiapkan dokumen Word (.docx / Google Docs) untuk arsip Google Drive...');

    // Generate Base64 Word (.docx) secara otomatis dengan format resmi 100% utuh untuk diupload ke Google Drive / Google Docs
    let docxBase64: string | undefined = undefined;
    try {
      const docxBlob = await exportNaskahDinasDocx(form, selectedPegawaiList, selectedPejabatObj);
      docxBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          if (dataUrl.includes('base64,')) {
            resolve(dataUrl.split('base64,')[1]);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(docxBlob);
      });
    } catch (docxErr) {
      console.warn('Gagal generate DOCX Base64 untuk Drive:', docxErr);
    }

    const resolveGoogleDocsUrl = (rawUrl?: string, fileId?: string): string | undefined => {
      if (fileId) {
        return `https://docs.google.com/document/d/${fileId}/edit`;
      }
      if (!rawUrl) return undefined;
      if (rawUrl.includes('docs.google.com/document/d/')) return rawUrl;
      const m = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m && m[1]) {
        return `https://docs.google.com/document/d/${m[1]}/edit`;
      }
      return rawUrl;
    };

    if (editingRecord) {
      // ── MODE EDIT: Perbarui record yang ada tanpa membuat nomor baru ──
      const updatedRecord: NomorSuratRecord = {
        ...editingRecord,
        tanggal: form.tanggal_surat,
        tanggal_surat: form.tanggal_surat,
        perihal: perihalStr,
        tujuan_lokasi: tujuanStr,
        jumlah_pegawai: selectedPegawaiList.length,
        penandatangan_nama: selectedPejabatObj.nama,
        dasar_surat: dasarStr,
        jenis: getJenisNaskahCode(currentJenis),
        jenis_naskah: currentJenis,
        kode_klasifikasi: form.kode_klasifikasi,
        kategori_klasifikasi: form.kategori_klasifikasi,
        kepada: kepadaStr,
        status_ttd: selectedPejabatObj.is_default ? 'Kapus' : 'Plh. Kapus',
        konseptor: form.konseptor || editingRecord.konseptor || 'TU Pusaka',
        link_word: ' ',
        link_pdf: docFileName,
        pdf_base64: docxBase64,
        pdf_filename: docFileName,
        docx_base64: docxBase64,
        docx_filename: docFileName,
        file_mime_type: docxMimeType,
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
          setLastSyncMsg('Memperbarui berkas Word (.docx / Google Docs) di Google Sheets & Drive...');
          const result = await updateNomorSuratInSheets(updatedRecord);
          if (result && (result.drive_url || result.drive_file_id)) {
            const finalDocUrl = resolveGoogleDocsUrl(result.drive_url, result.drive_file_id) || result.drive_url!;
            setLastSavedDriveUrl(finalDocUrl);
            setLastSyncMsg(`✓ Dokumen Word/GDocs ${updatedRecord.nomor_lengkap} berhasil diperbarui di Spreadsheet & Drive`);
            setNomorSuratList((prev) =>
              prev.map((rec) =>
                rec.id === updatedRecord.id
                  ? {
                      ...rec,
                      drive_url: finalDocUrl,
                      drive_file_id: result.drive_file_id,
                      drive_folder: result.drive_folder,
                    }
                  : rec
              )
            );
            if ((result as any).code_version !== 'v2_docx') {
              setIsSheetsModalOpen(true);
            }
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
        perihal: perihalStr,
        dibuat_oleh: 'Tata Usaha PUSAKA',
        tujuan_lokasi: tujuanStr,
        jumlah_pegawai: selectedPegawaiList.length,
        penandatangan_nama: selectedPejabatObj.nama,
        dasar_surat: dasarStr,
        jenis: getJenisNaskahCode(currentJenis),
        jenis_naskah: currentJenis,
        kode_klasifikasi: form.kode_klasifikasi,
        kategori_klasifikasi: form.kategori_klasifikasi,
        kepada: kepadaStr,
        status_ttd: selectedPejabatObj.is_default ? 'Kapus' : 'Plh. Kapus',
        topik_tim: 'TU',
        konseptor: form.konseptor || 'TU Pusaka',
        status_surat: 'OK',
        link_word: ' ',
        link_pdf: docFileName,
        pdf_base64: docxBase64,
        pdf_filename: docFileName,
        docx_base64: docxBase64,
        docx_filename: docFileName,
        file_mime_type: docxMimeType,
        form_state: { ...form },
        pegawai_ids: form.selectedPegawaiIds,
        pejabat_id: form.selectedPejabatId,
      };

      setNomorSuratList((prev) => [...prev, newRecord]);
      setIsSavedToDB(true);
      // Hapus draft tersimpan dari localStorage & IndexedDB setelah berhasil diterbitkan & disimpan
      removeDraftFromIndexedDB(currentJenis);
      try {
        localStorage.removeItem(`pusaka_draft_${currentJenis}`);
      } catch {}

      if (isSheetsConnected) {
        try {
          setLastSyncMsg('Mengunggah dokumen Word (.docx / Google Docs) ke Google Drive & mencatat ke Spreadsheet...');
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
          } else if (savedResult && (savedResult.drive_url || savedResult.drive_file_id)) {
            const finalDocUrl = resolveGoogleDocsUrl(savedResult.drive_url, savedResult.drive_file_id) || savedResult.drive_url!;
            setLastSavedDriveUrl(finalDocUrl);
            setLastSyncMsg(
              `✓ Dokumen Word/GDocs ${newRecord.nomor_lengkap} berhasil diunggah ke Google Drive (${savedResult.drive_folder || 'Folder Bulan'}) & dicatat di Sheets`
            );
            setNomorSuratList((prev) =>
              prev.map((rec) =>
                rec.id === newRecord.id
                  ? {
                      ...rec,
                      drive_url: finalDocUrl,
                      drive_file_id: savedResult.drive_file_id,
                      drive_folder: savedResult.drive_folder,
                    }
                  : rec
              )
            );
            if ((savedResult as any).code_version !== 'v2_docx') {
              setIsSheetsModalOpen(true);
            }
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

  // ─── Authentication & User Handlers ─────────────────────────────────────────
  const refreshUsers = useCallback(async () => {
    try {
      const users = await fetchUsersList();
      if (users && users.length > 0) {
        setUsersList(users);
      }
    } catch (e) {
      console.warn('Failed to load users:', e);
    }
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      refreshUsers();
    }
  }, [auth.isAuthenticated, refreshUsers]);

  // Otomatis isi nama konseptor dengan nama akun staf/admin yang sedang aktif
  useEffect(() => {
    if (auth.user?.nama && !form.konseptor && !editingRecord) {
      setForm((prev) => ({
        ...prev,
        konseptor: auth.user!.nama,
      }));
    }
  }, [auth.user, editingRecord]);

  const handleLoginSuccess = (user: User) => {
    setAuth({
      isAuthenticated: true,
      user,
    });
    setActiveTab('home');
    if (user.nama && !form.konseptor) {
      setForm((prev) => ({
        ...prev,
        konseptor: user.nama,
      }));
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuth({
      isAuthenticated: false,
      user: null,
    });
  };

  const handleAddUser = async (userData: Partial<User>) => {
    const saved = await saveUserAccount(userData);
    setUsersList((prev) => {
      const exists = prev.some((u) => u.id === saved.id || u.username === saved.username);
      if (exists) {
        return prev.map((u) => (u.id === saved.id || u.username === saved.username ? saved : u));
      }
      return [...prev, saved];
    });
    alert(`Akun pengguna "${saved.username}" berhasil dibuat!`);
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    const saved = await saveUserAccount(userData);
    setUsersList((prev) =>
      prev.map((u) => (u.id === saved.id ? saved : u))
    );
    if (auth.user?.id === saved.id) {
      setAuth((prev) => ({
        ...prev,
        user: saved,
      }));
    }
    alert(`Data akun pengguna "${saved.username}" berhasil diperbarui!`);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUserAccount(id);
    setUsersList((prev) => prev.filter((u) => u.id !== id));
    alert('Akun pengguna berhasil dihapus.');
  };

  // ─── Gatekeeper Login Screen ───────────────────────────────────────────────
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        isSheetsConnected={isSheetsConnected}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nextNomorLengkap={nextNomorInfo.nomor_lengkap}
        isSheetsConnected={isSheetsConnected}
        onOpenSheetsConfig={() => setIsSheetsModalOpen(true)}
        currentUser={auth.user}
        onLogout={handleLogout}
      />

      {/* Sync Status Bar */}
      {(isSyncingSheets || lastSyncMsg) && (
        <div
          className={`w-full text-center text-[11px] font-bold py-1.5 px-4 no-print print:hidden border-b-2 border-[#1E293B] ${
            isSyncingSheets
              ? 'bg-[#99F6E4] text-[#1E293B]'
              : lastSyncMsg.includes('Gagal') || lastSyncMsg.includes('gagal')
              ? 'bg-[#FEF08A] text-[#1E293B]'
              : 'bg-[#A7F3D0] text-[#1E293B]'
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
                  className="font-bold underline hover:bg-[#1E293B] hover:text-white inline-flex items-center space-x-1 ml-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-[#1E293B] shadow-[2px_2px_0px_#1E293B]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Dokumen (GDocs / Word)</span>
                </a>
              )}
            </span>
          )}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* TAB 0: BERANDA (HOME WORKSPACE HUB) */}
        {activeTab === 'home' && (
          <HomeView
            currentUser={auth.user}
            nomorSuratList={nomorSuratList}
            pegawaiList={pegawaiList}
            pejabatList={pejabatList}
            nextNomorUrut={nextNomorInfo.nomor_urut}
            nextNomorLengkap={nextNomorInfo.nomor_lengkap}
            simulatedMonth={simulatedMonth}
            simulatedYear={simulatedYear}
            isSheetsConnected={isSheetsConnected}
            activeFormDraft={form}
            onStartCreateNew={handleStartCreateFromHome}
            onContinueDraft={handleContinueDraftFromHome}
            onEditRecentRecord={handleEditSurat}
            onDuplicateAsNewTemplate={handleDuplicateAsNewTemplate}
            onOpenDatabase={() => {
              setActiveTab('database');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSheetsConfig={() => setIsSheetsModalOpen(true)}
          />
        )}

        {/* TAB 1: PEMBUATAN SURAT TUGAS */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:gap-0">
            {/* Left Column: Form & Selection (5 cols) */}
            <div className="lg:col-span-5 space-y-4 no-print print:hidden" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '6px', paddingBottom: '8px' }}>
              {/* Banner Mode Edit di Kolom Form */}
              {editingRecord && (
                <div className="bg-[#FEF08A] border-2 border-[#1E293B] rounded-lg p-3.5 flex items-center justify-between text-xs text-[#1E293B] shadow-[4px_4px_0px_#1E293B]">
                  <div>
                    <div className="font-bold flex items-center space-x-1.5 text-[#1E293B]">
                      <Edit3 className="w-4 h-4 text-[#1E293B]" />
                      <span>Mode Edit Surat Tugas #{editingRecord.nomor_urut}</span>
                    </div>
                    <div className="text-[11px] text-slate-800 mt-0.5 font-medium">
                      {editingRecord.nomor_lengkap} • Nomor urut tetap dipertahankan
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 bg-white hover:bg-[#FFE4E6] text-[#1E293B] border-[1.5px] border-[#1E293B] rounded-md text-xs font-bold cursor-pointer transition-colors shadow-[2px_2px_0px_#1E293B]"
                  >
                    Batal Edit
                  </button>
                </div>
              )}

              {/* Selector Jenis Naskah Dinas */}
              <div className="bg-white rounded-lg border-2 border-[#1E293B] shadow-[4px_4px_0px_#1E293B] p-2.5">
                <div className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider px-1 pb-2 flex items-center justify-between" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span>Pilih Jenis Naskah Dinas:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangeJenisNaskah('TUGAS')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer border-[1.5px] border-[#1E293B] ${
                      (form.jenis_naskah || 'TUGAS') === 'TUGAS'
                        ? 'bg-[#99F6E4] text-[#1E293B] shadow-[2px_2px_0px_#1E293B]'
                        : 'bg-[#F8F9FA] text-slate-700 hover:bg-slate-200/70 hover:text-[#1E293B]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Surat Tugas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeJenisNaskah('UNDANGAN')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer border-[1.5px] border-[#1E293B] ${
                      form.jenis_naskah === 'UNDANGAN'
                        ? 'bg-[#FDE68A] text-[#1E293B] shadow-[2px_2px_0px_#1E293B]'
                        : 'bg-[#F8F9FA] text-slate-700 hover:bg-slate-200/70 hover:text-[#1E293B]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Surat Undangan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeJenisNaskah('NOTA_DINAS')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer border-[1.5px] border-[#1E293B] ${
                      form.jenis_naskah === 'NOTA_DINAS'
                        ? 'bg-[#C7D2FE] text-[#1E293B] shadow-[2px_2px_0px_#1E293B]'
                        : 'bg-[#F8F9FA] text-slate-700 hover:bg-slate-200/70 hover:text-[#1E293B]'
                    }`}
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>Nota Dinas</span>
                  </button>
                </div>
              </div>

              {/* Card Klasifikasi & Nomor Surat (Disembunyikan untuk Surat Tugas karena kode tetap KP.01.06) */}
              {form.jenis_naskah && form.jenis_naskah !== 'TUGAS' && (
                <div className="bg-white rounded-lg border-2 border-[#1E293B] shadow-[4px_4px_0px_#1E293B] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-[#1E293B]/15 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-md border-[1.5px] border-[#1E293B] shadow-[2px_2px_0px_#1E293B] flex items-center justify-center font-bold text-xs text-[#1E293B] ${
                          form.jenis_naskah === 'NOTA_DINAS'
                            ? 'bg-[#C7D2FE]'
                            : 'bg-[#FDE68A]'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                      </span>
                      <h3 className="text-sm font-bold text-[#1E293B]">
                        Penomoran &amp; Klasifikasi Surat
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsKlasifikasiModalOpen(true)}
                      className={`flex items-center space-x-1 text-[#1E293B] text-xs font-bold px-2.5 py-1 rounded-md border-[1.5px] border-[#1E293B] shadow-[2px_2px_0px_#1E293B] transition-all cursor-pointer ${
                        form.jenis_naskah === 'NOTA_DINAS'
                          ? 'bg-[#C7D2FE] hover:bg-[#A5B4FC]'
                          : 'bg-[#FDE68A] hover:bg-[#FCD34D]'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>Cari / Ubah Kode</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Nomor Naskah Resmi:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11.5px] border ${
                          form.jenis_naskah === 'NOTA_DINAS'
                            ? 'text-indigo-900 bg-indigo-50 border-indigo-200'
                            : 'text-amber-900 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {form.nomor_lengkap || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Kategori Klasifikasi:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10.5px] uppercase ${
                          form.kategori_klasifikasi === 'SUBSTANTIF'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {form.kategori_klasifikasi || 'FASILITATIF'}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Kode Klasifikasi:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {form.kode_klasifikasi || 'KP.01.06'}
                        </span>
                      </div>
                      {form.uraian_klasifikasi && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5 leading-snug">
                          {form.uraian_klasifikasi}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FORM KHUSUS: SURAT TUGAS */}
              {(!form.jenis_naskah || form.jenis_naskah === 'TUGAS') && (
                <>
                  {/* Card 1: AI Undangan & Dasar Acara */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('tugas_1')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          Dasar Undangan &amp; Acara
                        </h3>
                        {collapsedSections['tugas_1'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['tugas_1'] && (
                      <div className="space-y-3 text-xs pt-1">
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
              )}
            </div>

                  {/* Card 2: Redaksi & Narasi Surat (Bisa Diedit / Ditambah Langsung) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('tugas_2')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          Redaksi &amp; Isi Surat (Langsung Diedit)
                        </h3>
                        {collapsedSections['tugas_2'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Edit3 className="w-3 h-3 text-teal-600" />
                        <span>Bebas Diedit</span>
                      </span>
                    </div>

                    {!collapsedSections['tugas_2'] && (
                      <div className="space-y-2.5 text-xs pt-1">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Klausul Beban Anggaran:
                      </label>
                      <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none text-[11px] text-slate-600 font-medium">
                        <input
                          type="checkbox"
                          checked={form.sertakan_beban_anggaran !== false}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              sertakan_beban_anggaran: e.target.checked,
                              penutup_custom: undefined,
                            });
                            setIsSavedToDB(false);
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                        />
                        <span>Sertakan Beban Anggaran</span>
                      </label>
                    </div>
                    {form.sertakan_beban_anggaran !== false && (
                      <input
                        type="text"
                        value={form.pembebanan_anggaran}
                        onChange={(e) => {
                          setForm({ ...form, pembebanan_anggaran: e.target.value, penutup_custom: undefined });
                          setIsSavedToDB(false);
                        }}
                        placeholder="DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital..."
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    )}
                  </div>
                  </div>
                )}
              </div>

              {/* Card 3: Pemilihan Pegawai */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div
                    onClick={() => toggleSection('tugas_3')}
                    className="flex items-center space-x-2 cursor-pointer select-none group"
                    title="Klik untuk membuka/menutup bagian ini"
                  >
                    <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      Pilih Pegawai yang Ditugaskan
                    </h3>
                    {collapsedSections['tugas_3'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      form.selectedPegawaiIds.length > 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {form.selectedPegawaiIds.length} Terpilih{' '}
                    {form.selectedPegawaiIds.length > 3
                      ? '(Format Lampiran)'
                      : ''}
                  </span>
                </div>

                {!collapsedSections['tugas_3'] && (
                  <div className="space-y-3 pt-1">

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
            )}
          </div>

          {/* Card 4: Penandatangan & Konseptor */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div
                onClick={() => toggleSection('tugas_4')}
                className="flex items-center space-x-2 cursor-pointer select-none group"
                title="Klik untuk membuka/menutup bagian ini"
              >
                <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Pejabat Penandatangan &amp; Konseptor
                </h3>
                {collapsedSections['tugas_4'] ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </div>
            </div>

            {!collapsedSections['tugas_4'] && (
              <div className="space-y-3 text-xs pt-1">
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
                )}
              </div>

              {/* Card 5: Lampiran Dokumen Tambahan (opsional) pada Surat Tugas */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div
                    onClick={() => toggleSection('tugas_5')}
                    className="flex items-center space-x-2 cursor-pointer select-none group"
                    title="Klik untuk membuka/menutup bagian ini"
                  >
                    <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      5
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      Lampiran Dokumen Tambahan (opsional)
                    </h3>
                    {collapsedSections['tugas_5'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {(form.lampiran_items || []).length} lampiran
                  </span>
                </div>

                {!collapsedSections['tugas_5'] && (
                  <div className="pt-1">
                    <LampiranManager
                      jenisNaskah="TUGAS"
                      items={form.lampiran_items || []}
                      romanOffset={form.selectedPegawaiIds.length > 3 ? 1 : 0}
                      onChange={(newItems) => {
                        setForm((prev) => ({
                          ...prev,
                          lampiran_items: newItems,
                        }));
                        setIsSavedToDB(false);
                      }}
                      nomorSurat={form.nomor_lengkap}
                      tanggalSurat={formatTanggalIndonesia(form.tanggal_surat)}
                      pegawaiList={pegawaiList}
                    />
                  </div>
                )}
              </div>
            </>
          )}

              {/* FORM KHUSUS: SURAT UNDANGAN */}
              {form.jenis_naskah === 'UNDANGAN' && (
                <>
                  {/* Card 1: Data Pokok Undangan */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('undangan_1')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          Atribut &amp; Tujuan Surat Undangan
                        </h3>
                        {collapsedSections['undangan_1'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['undangan_1'] && (
                      <div className="space-y-3 text-xs pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Sifat Surat:
                          </label>
                          <select
                            value={form.undangan_sifat || 'Biasa'}
                            onChange={(e) => {
                              setForm({ ...form, undangan_sifat: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                          >
                            <option value="Sangat Segera">Sangat Segera</option>
                            <option value="Segera">Segera</option>
                            <option value="Biasa">Biasa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Lampiran:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 1 (satu) Berkas / -"
                            value={form.undangan_lampiran || ''}
                            onChange={(e) => {
                              setForm({ ...form, undangan_lampiran: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Hal / Perihal Undangan:
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Undangan Rapat Evaluasi Capaian Kebijakan"
                          value={form.undangan_hal || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_hal: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kepada Yth. (Tujuan Penerima):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: (Daftar Terlampir)&#10;di Tempat"
                          value={form.undangan_kepada || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_kepada: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed font-medium"
                        />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Waktu, Lokasi & Rincian Rapat */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('undangan_2')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          Waktu, Tempat &amp; Agenda Acara
                        </h3>
                        {collapsedSections['undangan_2'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['undangan_2'] && (
                      <div className="space-y-3 text-xs pt-1">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Format Penyelenggaraan:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['hybrid', 'offline', 'online'] as const).map((tipe) => (
                            <button
                              key={tipe}
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  undangan_tipe_tempat: tipe,
                                  undangan_tempat_online: cleanTempatField(form.undangan_tempat_online, 'online'),
                                  undangan_tempat_offline: cleanTempatField(form.undangan_tempat_offline, 'offline'),
                                  undangan_tempat_online_custom: undefined,
                                  undangan_tempat_offline_custom: undefined,
                                });
                                setIsSavedToDB(false);
                              }}
                              className={`py-1.5 px-2 rounded-md font-bold text-xs capitalize transition-all cursor-pointer ${
                                (form.undangan_tipe_tempat || 'hybrid') === tipe
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {tipe}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Hari, Tanggal Pelaksanaan:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Senin, 20 Oktober 2026"
                            value={form.hari_tanggal_pelaksanaan || ''}
                            onChange={(e) => {
                              setForm({ ...form, hari_tanggal_pelaksanaan: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Waktu / Jam:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 09.00 WIB s.d. selesai"
                            value={form.undangan_waktu || ''}
                            onChange={(e) => {
                              setForm({ ...form, undangan_waktu: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Lokasi Fisik / Offline */}
                      {(form.undangan_tipe_tempat === 'offline' || form.undangan_tipe_tempat === 'hybrid' || !form.undangan_tipe_tempat) && (
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Tempat / Ruang Fisik:
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Contoh: Ruang Rapat Lt. 5 Gd Sapta Pesona..."
                            value={cleanTempatField(form.undangan_tempat_offline, 'offline')}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                undangan_tempat_offline: e.target.value,
                                undangan_tempat_offline_custom: undefined,
                              });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed"
                          />
                        </div>
                      )}

                      {/* Tautan Virtual / Online */}
                      {(form.undangan_tipe_tempat === 'online' || form.undangan_tipe_tempat === 'hybrid') && (
                        <div className="space-y-2 p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                          <div>
                            <label className="block font-semibold text-amber-900 mb-1">
                              Tautan Virtual (Zoom / Teams / Meet):
                            </label>
                            <input
                              type="text"
                              placeholder="https://s.komdigi.go.id/zoom-meeting"
                              value={cleanTempatField(form.undangan_tempat_online, 'online')}
                              onChange={(e) => {
                                setForm({
                                  ...form,
                                  undangan_tempat_online: e.target.value,
                                  undangan_tempat_online_custom: undefined,
                                });
                                setIsSavedToDB(false);
                              }}
                              className="w-full p-2 bg-white border border-amber-200 rounded-md focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Paragraf Pengantar / Dasar:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Dalam rangka kelancaran pelaksanaan tugas dan fungsi..."
                          value={form.undangan_pembuka || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_pembuka: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Agenda Rapat / Pembahasan:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Pembahasan Rancangan Peraturan Menteri..."
                          value={form.undangan_agenda || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_agenda: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Paragraf Penutup:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Demikian kami sampaikan, atas perhatian dan kehadirannya diucapkan terima kasih."
                          value={form.undangan_penutup || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_penutup: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed"
                        />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Penandatangan & Tembusan Undangan */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('undangan_3')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          Pejabat Penandatangan &amp; Konseptor
                        </h3>
                        {collapsedSections['undangan_3'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['undangan_3'] && (
                      <div className="space-y-3 text-xs pt-1">
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
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                        >
                          {pejabatList.map((pej) => (
                            <option key={pej.id} value={pej.id}>
                              {pej.nama} - {pej.jabatan}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pilih Konseptor dari Daftar Pegawai */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Konseptor Pembuat Undangan:
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
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Tanggal Surat:
                          </label>
                          <input
                            type="date"
                            value={form.tanggal_surat}
                            onChange={(e) => {
                              setForm({ ...form, tanggal_surat: e.target.value, custom_tanggal_surat_text: undefined });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Daftar Tembusan (opsional):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh:&#10;1. Sekretaris Jenderal Kementerian Komunikasi dan Digital&#10;2. Para Pejabat Terkait"
                          value={form.undangan_tembusan || ''}
                          onChange={(e) => {
                            setForm({ ...form, undangan_tembusan: e.target.value });
                            setIsSavedToDB(false);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-amber-500 leading-relaxed font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                  {/* Card 4: Lampiran Surat Undangan */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('undangan_4')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          4
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          Lampiran Dokumen Tambahan (opsional)
                        </h3>
                        {collapsedSections['undangan_4'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {(form.undangan_lampiran_items || []).length} lampiran
                      </span>
                    </div>

                    {!collapsedSections['undangan_4'] && (
                      <div className="pt-1">
                        <LampiranManager
                          jenisNaskah="UNDANGAN"
                          items={form.undangan_lampiran_items || []}
                          onChange={(newItems) => {
                            const count = newItems.length;
                            setForm((prev) => ({
                              ...prev,
                              undangan_lampiran_items: newItems,
                              undangan_lampiran:
                                count === 0
                                  ? '-'
                                  : `${count} (${count === 1 ? 'satu' : count === 2 ? 'dua' : count}) berkas`,
                            }));
                            setIsSavedToDB(false);
                          }}
                          nomorSurat={form.nomor_lengkap}
                          tanggalSurat={formatTanggalIndonesia(form.tanggal_surat)}
                          pegawaiList={pegawaiList}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* FORM KHUSUS: NOTA DINAS */}
              {form.jenis_naskah === 'NOTA_DINAS' && (
                <>
                  {/* Card 1: Header Nota Dinas */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('nota_1')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          Atribut Kepala Nota Dinas
                        </h3>
                        {collapsedSections['nota_1'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['nota_1'] && (
                      <div className="space-y-3 text-xs pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Yth. (Penerima Nota Dinas):
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Sekretaris Jenderal Kementerian Komunikasi dan Digital"
                            value={form.nota_kepada || ''}
                            onChange={(e) => {
                              setForm({ ...form, nota_kepada: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Dari (Pengirim Nota Dinas):
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Kepala Pusat Kebijakan Strategis"
                            value={form.nota_dari || ''}
                            onChange={(e) => {
                              setForm({ ...form, nota_dari: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Hal / Perihal:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Laporan Pelaksanaan Evaluasi Kebijakan..."
                            value={form.nota_hal || ''}
                            onChange={(e) => {
                              setForm({ ...form, nota_hal: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Tanggal:
                            </label>
                            <input
                              type="date"
                              value={form.tanggal_surat}
                              onChange={(e) => {
                                setForm({ ...form, tanggal_surat: e.target.value });
                                setIsSavedToDB(false);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Sifat:
                            </label>
                            <select
                              value={form.nota_sifat || 'Biasa'}
                              onChange={(e) => {
                                setForm({ ...form, nota_sifat: e.target.value });
                                setIsSavedToDB(false);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Biasa">Biasa</option>
                              <option value="Segera">Segera</option>
                              <option value="Sangat Segera">Sangat Segera</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Lampiran:
                            </label>
                            <input
                              type="text"
                              placeholder="-"
                              value={form.nota_lampiran ?? ''}
                              onChange={(e) => {
                                setForm({ ...form, nota_lampiran: e.target.value });
                                setIsSavedToDB(false);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Pokok Pikiran / Isi Nota Dinas */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('nota_2')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          Pokok Pikiran &amp; Telaah Nota Dinas
                        </h3>
                        {collapsedSections['nota_2'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['nota_2'] && (
                      <div className="space-y-3 text-xs pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block font-semibold text-slate-700">
                              Isi Badan Nota Dinas (Pembuka, Telaah / Substansi, &amp; Penutup):
                            </label>
                            <span className="text-[11px] text-indigo-600 font-medium">
                              Satu Form Terpadu &bull; Sinkron Otomatis
                            </span>
                          </div>
                          <textarea
                            rows={10}
                            data-rich="true"
                            placeholder="Ketik atau tempel isi nota dinas lengkap di sini...&#10;&#10;Paragraf Pembuka / Latar Belakang:&#10;Merujuk pada rencana kerja bidang kebijakan strategis, bersama ini kami sampaikan telaah terkait...&#10;&#10;Substansi Isi / Telaah:&#10;1. Berdasarkan hasil analisis data...&#10;2. Terdapat poin-poin krusial yang memerlukan tindak lanjut...&#10;&#10;Paragraf Penutup:&#10;Demikian kami sampaikan untuk menjadi bahan pertimbangan. Atas perhatian Bapak/Ibu, diucapkan terima kasih."
                            value={form.nota_isi || [form.nota_pembuka, form.nota_penutup].filter(Boolean).join('\n\n')}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                nota_isi: e.target.value,
                                nota_pembuka: '',
                                nota_penutup: '',
                              });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans text-xs"
                          />
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Pisahkan paragraf pembuka, butir telaah, dan penutup dengan menekan <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">Enter 2x</kbd>. Teks ini tersinkronisasi 2 arah langsung dengan text box di lembar preview.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Penandatangan & Tembusan Nota Dinas */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('nota_3')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          Pejabat Penandatangan &amp; Konseptor
                        </h3>
                        {collapsedSections['nota_3'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>

                    {!collapsedSections['nota_3'] && (
                      <div className="space-y-3 text-xs pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Pilih Pejabat Penandatangan:
                          </label>
                          <select
                            value={form.selectedPejabatId}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                selectedPejabatId: e.target.value,
                                custom_jabatan_ttd: undefined,
                                custom_nama_ttd: undefined,
                              });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
                          >
                            {pejabatList.map((pej) => (
                              <option key={pej.id} value={pej.id}>
                                {pej.nama} - {pej.jabatan}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Pilih Konseptor dari Daftar Pegawai */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Konseptor Pembuat Nota Dinas:
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
                                      ? 'bg-indigo-50/70 hover:bg-indigo-50'
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex-1 pr-2">
                                    <div
                                      className={`font-semibold ${
                                        isSelected ? 'text-indigo-900 font-bold' : 'text-slate-800'
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
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
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
                            <p className="text-[10.5px] text-indigo-700 mt-0.5 font-medium">
                              ✓ Konseptor: {form.konseptor}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Daftar Tembusan (opsional):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Contoh:&#10;1. Arsip"
                            value={form.nota_tembusan || ''}
                            onChange={(e) => {
                              setForm({ ...form, nota_tembusan: e.target.value });
                              setIsSavedToDB(false);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 leading-relaxed font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 4: Lampiran Nota Dinas */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div
                        onClick={() => toggleSection('nota_4')}
                        className="flex items-center space-x-2 cursor-pointer select-none group"
                        title="Klik untuk membuka/menutup bagian ini"
                      >
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          4
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          Lampiran Dokumen Tambahan (opsional)
                        </h3>
                        {collapsedSections['nota_4'] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {(form.nota_lampiran_items || []).length} lampiran
                      </span>
                    </div>

                    {!collapsedSections['nota_4'] && (
                      <div className="pt-1">
                        <LampiranManager
                          jenisNaskah="NOTA_DINAS"
                          items={form.nota_lampiran_items || []}
                          onChange={(newItems) => {
                            const count = newItems.length;
                            setForm((prev) => ({
                              ...prev,
                              nota_lampiran_items: newItems,
                              nota_lampiran:
                                count === 0
                                  ? '-'
                                  : `${count} (${count === 1 ? 'satu' : count === 2 ? 'dua' : count}) berkas`,
                            }));
                            setIsSavedToDB(false);
                          }}
                          nomorSurat={form.nomor_lengkap}
                          tanggalSurat={formatTanggalIndonesia(form.tanggal_surat)}
                          pegawaiList={pegawaiList}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Status Saving to Sheets */}
              {isSavingToSheets && (
                <div className="flex items-center space-x-2 text-xs text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Google Sheets kantor...</span>
                </div>
              )}
            </div>

            {/* Right Column: Live Official Document Preview (7 cols) */}
            <div className="lg:col-span-7 print:w-full print:m-0 print:p-0" style={{ position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 120px)' }}>
              <SuratPreview
                form={form}
                selectedPegawai={selectedPegawaiList}
                selectedPejabat={selectedPejabatObj}
                onDownloadPdf={handleDownloadPdf}
                onDownloadDocx={handleDownloadDocx}
                isGeneratingPdf={isGeneratingPdf}
                onSaveToDatabase={handleSaveToDatabase}
                isSaved={isSavedToDB}
                isEditMode={!!editingRecord}
                onCancelEdit={handleCancelEdit}
                onUpdateForm={(updated) => {
                  setForm((prev) => ({ ...prev, ...updated }));
                  setIsSavedToDB(false);
                }}
                onOpenAiScanner={() => {
                  const jenis = form.jenis_naskah || 'TUGAS';
                  setExtractionModalMode(jenis);
                  setIsExtractionModalOpen(true);
                }}
                onGenerateGeneralTemplate={() => {
                  const jenis = form.jenis_naskah || 'TUGAS';
                  const todayIso = form.tanggal_surat || new Date().toISOString().split('T')[0];
                  const todayFormatted = formatTanggalIndonesia(todayIso);

                  if (jenis === 'TUGAS') {
                    const defaultPegIds =
                      form.selectedPegawaiIds && form.selectedPegawaiIds.length > 0
                        ? form.selectedPegawaiIds
                        : pegawaiList
                            .filter((p) => p.status !== 'Cuti')
                            .slice(0, 2)
                            .map((p) => p.id);

                    setForm((prev) => ({
                      ...prev,
                      nama_acara: 'Rapat Koordinasi Penyusunan Kebijakan Strategis Kementerian Komunikasi dan Digital',
                      nomor_surat_undangan: 'B-102/SJ/PR.01.01/11/2026',
                      tanggal_surat_undangan: todayIso,
                      instansi_pengundang: 'Sekretariat Jenderal Kementerian Komunikasi dan Digital',
                      perihal_undangan: 'Undangan Rapat Koordinasi Penyusunan Kebijakan Strategis',
                      tanggal_mulai: todayIso,
                      tanggal_selesai: todayIso,
                      waktu_kegiatan: '09.00 WIB s.d. selesai',
                      hari_tanggal_pelaksanaan: `Senin, ${todayFormatted}`,
                      lokasi_kegiatan: 'Ruang Rapat Utama Lantai 7, Gedung Kementerian Komunikasi dan Digital',
                      kota_kegiatan: 'Jakarta',
                      tujuan_tugas: 'Mengikuti Rapat Koordinasi Penyusunan Kebijakan Strategis',
                      sertakan_beban_anggaran: true,
                      pembebanan_anggaran:
                        'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026',
                      selectedPegawaiIds: defaultPegIds,
                      menimbang_custom:
                        'Bahwa dalam rangka mendukung kelancaran pelaksanaan Rapat Koordinasi Penyusunan Kebijakan Strategis Kementerian Komunikasi dan Digital, perlu menugaskan pegawai di lingkungan Pusat Kebijakan Strategis untuk mengikuti kegiatan dimaksud.',
                      dasar_custom:
                        `Nota Dinas Sekretaris Jenderal Kementerian Komunikasi dan Digital Nomor : B-102/SJ/PR.01.01/11/2026 tanggal ${todayFormatted} perihal Undangan Rapat Koordinasi Penyusunan Kebijakan Strategis.`,
                      untuk_custom:
                        `Mengikuti kegiatan Rapat Koordinasi Penyusunan Kebijakan Strategis Kementerian Komunikasi dan Digital yang dilaksanakan pada tanggal ${todayFormatted} di Ruang Rapat Utama Lantai 7, Gedung Kementerian Komunikasi dan Digital, Jakarta.`,
                      penutup_custom: undefined,
                    }));
                    setIsSavedToDB(false);
                  } else if (jenis === 'UNDANGAN') {
                    setForm((prev) => ({
                      ...prev,
                      undangan_sifat: 'Biasa',
                      undangan_lampiran: '-',
                      undangan_hal: 'Undangan Rapat Koordinasi Pembahasan Kebijakan Strategis',
                      undangan_kepada:
                        'Para Ketua Tim Kerja dan Pejabat Fungsional di Lingkungan Pusat Kebijakan Strategis\ndi Tempat',
                      undangan_pembuka:
                        'Dalam rangka pelaksanaan program kerja dan penyelarasan penyusunan rekomendasi kebijakan di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengundang Bapak/Ibu untuk hadir pada rapat koordinasi yang akan diselenggarakan pada:',
                      undangan_tipe_tempat: 'offline',
                      hari_tanggal_pelaksanaan: `Senin, ${todayFormatted}`,
                      undangan_waktu: '09.00 WIB s.d. selesai',
                      undangan_tempat_offline:
                        'Ruang Rapat Pusat Kebijakan Strategis, Gedung Kementerian Komunikasi dan Digital, Jl. Medan Merdeka Barat No. 9, Jakarta Pusat',
                      undangan_tempat_online: '',
                      undangan_agenda: 'Pembahasan dan Penyelarasan Penyusunan Rekomendasi Kebijakan Strategis',
                      undangan_penutup:
                        'Mengingat pentingnya agenda rapat tersebut, dimohon kehadiran Bapak/Ibu tepat pada waktunya. Demikian kami sampaikan, atas perhatian dan kerja sama Bapak/Ibu diucapkan terima kasih.',
                      undangan_tembusan: 'Sekretaris Jenderal Kementerian Komunikasi dan Digital',
                    }));
                    setIsSavedToDB(false);
                  } else if (jenis === 'NOTA_DINAS') {
                    const generalNotaIsi = [
                      'Sehubungan dengan pelaksanaan tugas dan fungsi Pusat Kebijakan Strategis dalam perumusan analisis serta rekomendasi kebijakan di lingkungan Kementerian Komunikasi dan Digital, bersama ini dengan hormat kami sampaikan hal-hal sebagai berikut:',
                      '1. Latar Belakang: Penyusunan telaah kebijakan strategis dilaksanakan guna memastikan keselarasan program kerja dengan arah kebijakan nasional di bidang komunikasi dan transformasi digital.',
                      '2. Pokok Permasalahan dan Analisis: Berdasarkan hasil pemantauan dan evaluasi terhadap pelaksanaan program berjalan, diperlukan penguatan koordinasi lintas satuan kerja serta sinkronisasi indikator kinerja utama agar target capaian strategis dapat terpenuhi secara efektif dan akuntabel.',
                      '3. Tindak Lanjut dan Rekomendasi: Sebagai langkah tindak lanjut, Pusat Kebijakan Strategis telah menyusun rumusan rekomendasi kebijakan beserta rencana aksi pelaksanaan yang siap dikoordinasikan bersama unit kerja terkait di lingkungan Kementerian Komunikasi dan Digital.',
                      'Demikian disampaikan, mohon arahan Bapak Sekretaris Jenderal lebih lanjut. Atas perhatian dan kerja sama Bapak Sekretaris Jenderal, kami ucapkan terima kasih.',
                    ].join('\n\n');

                    setForm((prev) => ({
                      ...prev,
                      nota_kepada: 'Sekretaris Jenderal Kementerian Komunikasi dan Digital',
                      nota_dari: 'Kepala Pusat Kebijakan Strategis',
                      nota_hal: 'Penyampaian Laporan Hasil Telaah dan Rekomendasi Kebijakan Strategis',
                      nota_sifat: 'Biasa',
                      nota_lampiran: 'Satu berkas',
                      nota_pembuka: '',
                      nota_isi: generalNotaIsi,
                      nota_penutup: '',
                      nota_tembusan: '',
                    }));
                    setIsSavedToDB(false);
                  }
                }}
                onResetIsiPembuatan={() => {
                  const jenis = form.jenis_naskah;
                  if (jenis === 'TUGAS' || !jenis) {
                    if (confirm('Reset semua isi Surat Tugas yang sedang dibuat?')) {
                      try {
                        localStorage.removeItem('pusaka_draft_TUGAS');
                      } catch {}
                      setForm((prev) => ({
                        ...prev,
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
                        kriteria_peserta: '',
                        selectedPegawaiIds: [],
                        menimbang_custom: undefined,
                        dasar_custom: undefined,
                        untuk_custom: undefined,
                        penutup_custom: undefined,
                        custom_jabatan_ttd: undefined,
                        custom_nama_ttd: undefined,
                        custom_tanggal_surat_text: undefined,
                        custom_kalimat_penutup_tugas: undefined,
                        custom_kepada_tugas: undefined,
                        custom_pegawai_overrides: undefined,
                        lampiran_items: [],
                      }));
                      setIsSavedToDB(false);
                    }
                  } else if (jenis === 'UNDANGAN') {
                    if (confirm('Reset semua isi Surat Undangan yang sedang dibuat?')) {
                      try {
                        localStorage.removeItem('pusaka_draft_UNDANGAN');
                      } catch {}
                      setForm((prev) => ({
                        ...prev,
                        undangan_sifat: 'Biasa',
                        undangan_lampiran: '',
                        undangan_hal: '',
                        undangan_kepada: '',
                        undangan_pembuka: '',
                        undangan_tipe_tempat: 'offline',
                        undangan_tempat_offline: '',
                        undangan_tempat_online: '',
                        undangan_waktu: '',
                        undangan_penutup: '',
                        undangan_agenda: '',
                        undangan_tembusan: '',
                        undangan_lampiran_items: [],
                        custom_jabatan_ttd: undefined,
                        custom_nama_ttd: undefined,
                        custom_tanggal_surat_text: undefined,
                      }));
                      setIsSavedToDB(false);
                    }
                  } else if (jenis === 'NOTA_DINAS') {
                    if (confirm('Reset semua isi Nota Dinas yang sedang dibuat?')) {
                      try {
                        localStorage.removeItem('pusaka_draft_NOTA_DINAS');
                      } catch {}
                      setForm((prev) => ({
                        ...prev,
                        nota_kepada: '',
                        nota_dari: '',
                        nota_hal: '',
                        nota_sifat: 'Biasa',
                        nota_lampiran: '',
                        nota_pembuka: '',
                        nota_isi: '',
                        nota_penutup: '',
                        nota_tembusan: '',
                        nota_lampiran_items: [],
                        custom_jabatan_ttd: undefined,
                        custom_nama_ttd: undefined,
                        custom_tanggal_surat_text: undefined,
                      }));
                      setIsSavedToDB(false);
                    }
                  }
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
            currentUser={auth.user}
            usersList={usersList}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Modals */}
      <KlasifikasiPickerModal
        isOpen={isKlasifikasiModalOpen}
        onClose={() => setIsKlasifikasiModalOpen(false)}
        onSelect={handleSelectKlasifikasi}
        selectedKode={form.kode_klasifikasi}
        jenisNaskah={form.jenis_naskah || 'TUGAS'}
        nomorUrut={form.nomor_urut || nextNomorUrut}
        bulan={form.bulan || simulatedMonth}
        tahun={form.tahun || simulatedYear}
        perihal={form.jenis_naskah === 'NOTA_DINAS' ? form.nota_hal : form.perihal_undangan}
        isiDokumen={
          form.jenis_naskah === 'NOTA_DINAS'
            ? (form.nota_isi || [form.nota_pembuka, form.nota_penutup].filter(Boolean).join('\n'))
            : form.tujuan_tugas
        }
      />

      <FloatingToolbar />

      <InvitationUploadModal
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        mode={extractionModalMode}
        onApplyExtraction={handleApplyExtraction}
        onApplyUndanganExtraction={handleApplyUndanganExtraction}
        onApplyNotaDinasExtraction={handleApplyNotaDinasExtraction}
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
