import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Paperclip,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  FileUp,
  Sparkles,
  Loader2,
  Search,
  Building,
  UserPlus,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { LampiranItem, JenisNaskah, Pegawai } from '../types';
import {
  extractTextFromDocxBuffer,
  extractTextFromPdfBuffer,
  renderPdfPagesToImages,
} from '../services/documentExtractor';
import {
  InteractiveDocumentTable,
} from './InteractiveDocumentTable';
import {
  createBlankTable,
  serializeTableToHtml,
} from '../services/tableService';

interface LampiranManagerProps {
  jenisNaskah: JenisNaskah;
  items: LampiranItem[];
  onChange: (items: LampiranItem[]) => void;
  nomorSurat: string;
  tanggalSurat: string;
  pegawaiList?: Pegawai[];
  romanOffset?: number;
}

export function toRoman(num: number): string {
  const n = Math.max(1, Math.floor(num));
  const romanMap: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let res = '';
  let cur = n;
  for (const [val, sym] of romanMap) {
    while (cur >= val) {
      res += sym;
      cur -= val;
    }
  }
  return res || 'I';
}

interface ExternalMember {
  id: string;
  nama: string;
}

interface ExternalSatker {
  id: string;
  kode?: string;
  namaSatker: string;
  members: ExternalMember[];
}

// ─── DAFTAR 59 SATKER RESMI KEMENTERIAN KOMUNIKASI DAN DIGITAL RI ────────────
export const KOMDIGI_SATKERS_DATA: Array<{ kode: string; nama: string }> = [
  { kode: 'KMD', nama: 'Kementerian Komunikasi dan Digital' },
  { kode: 'SJ', nama: 'Sekretariat Jenderal' },
  { kode: 'SJ-BP', nama: 'Biro Perencanaan' },
  { kode: 'SJ-BSDMO', nama: 'Biro Sumber Daya Manusia dan Organisasi' },
  { kode: 'SJ-BKBMN', nama: 'Biro Keuangan dan Barang Milik Negara' },
  { kode: 'SJ-BH', nama: 'Biro Hukum' },
  { kode: 'SJ-BU', nama: 'Biro Umum' },
  { kode: 'SJ-BHUMAS', nama: 'Biro Hubungan Masyarakat' },
  { kode: 'SJ-PDSI', nama: 'Pusat Data dan Sarana Informatika' },
  { kode: 'SJ-PKI', nama: 'Pusat Kelembagaan Internasional' },
  { kode: 'SJ-PKS', nama: 'Pusat Kebijakan Strategis' },
  { kode: 'DJID', nama: 'Direktorat Jenderal Infrastruktur Digital' },
  { kode: 'DJID-SET', nama: 'Sekretariat Direktorat Jenderal Infrastruktur Digital' },
  { kode: 'DJID-DSK', nama: 'Direktorat Strategi dan Kebijakan Infrastruktur Digital' },
  { kode: 'DJID-DPS', nama: 'Direktorat Penataan Spektrum Frekuensi Radio, Orbit Satelit, dan Standardisasi Infrastruktur Digital' },
  { kode: 'DJID-DLI', nama: 'Direktorat Layanan Infrastruktur Digital' },
  { kode: 'DJID-DAI', nama: 'Direktorat Akselerasi Infrastruktur Digital' },
  { kode: 'DJID-DPI', nama: 'Direktorat Pengendalian Infrastruktur Digital' },
  { kode: 'DJTPD', nama: 'Direktorat Jenderal Teknologi Pemerintah Digital' },
  { kode: 'DJTPD-SET', nama: 'Sekretariat Direktorat Jenderal Teknologi Pemerintah Digital' },
  { kode: 'DJTPD-DSK', nama: 'Direktorat Strategi dan Kebijakan Teknologi Pemerintah Digital' },
  { kode: 'DJTPD-DIP', nama: 'Direktorat Infrastruktur Pemerintah Digital' },
  { kode: 'DJTPD-DAP', nama: 'Direktorat Aplikasi Pemerintah Digital' },
  { kode: 'DJTPD-DAT', nama: 'Direktorat Akselerasi Teknologi Pemerintah Digital Daerah' },
  { kode: 'DJED', nama: 'Direktorat Jenderal Ekosistem Digital' },
  { kode: 'DJED-SET', nama: 'Sekretariat Direktorat Jenderal Ekosistem Digital' },
  { kode: 'DJED-DPE', nama: 'Direktorat Pengembangan Ekosistem Digital' },
  { kode: 'DJED-DKA', nama: 'Direktorat Kecerdasan Artifisial dan Ekosistem Teknologi Baru' },
  { kode: 'DJED-DPP', nama: 'Direktorat Pos dan Penyiaran' },
  { kode: 'DJED-DLE', nama: 'Direktorat Layanan Ekosistem Digital' },
  { kode: 'DJED-DPE2', nama: 'Direktorat Pengendalian Ekosistem Digital' },
  { kode: 'DJPRD', nama: 'Direktorat Jenderal Pengawasan Ruang Digital' },
  { kode: 'DJPRD-SET', nama: 'Sekretariat Direktorat Jenderal Pengawasan Ruang Digital' },
  { kode: 'DJPRD-DSK', nama: 'Direktorat Strategi dan Kebijakan Pengawasan Ruang Digital' },
  { kode: 'DJPRD-DPST', nama: 'Direktorat Pengawasan Sertifikasi dan Transaksi Elektronik' },
  { kode: 'DJPRD-DPD', nama: 'Direktorat Penyidikan Digital' },
  { kode: 'DJPRD-DPR', nama: 'Direktorat Pengendalian Ruang Digital' },
  { kode: 'DJKPM', nama: 'Direktorat Jenderal Komunikasi Publik dan Media' },
  { kode: 'DJKPM-SET', nama: 'Sekretariat Direktorat Jenderal Komunikasi Publik dan Media' },
  { kode: 'DJKPM-DIP', nama: 'Direktorat Informasi Publik' },
  { kode: 'DJKPM-DKP', nama: 'Direktorat Komunikasi Publik' },
  { kode: 'DJKPM-DKK', nama: 'Direktorat Kemitraan Komunikasi Lembaga dan Kehumasan' },
  { kode: 'DJKPM-DEM', nama: 'Direktorat Ekosistem Media' },
  { kode: 'ITJEN', nama: 'Inspektorat Jenderal' },
  { kode: 'ITJEN-SET', nama: 'Sekretariat Inspektorat Jenderal' },
  { kode: 'ITJEN-I', nama: 'Inspektorat I' },
  { kode: 'ITJEN-II', nama: 'Inspektorat II' },
  { kode: 'ITJEN-III', nama: 'Inspektorat III' },
  { kode: 'ITJEN-IV', nama: 'Inspektorat IV' },
  { kode: 'BPSDM', nama: 'Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital' },
  { kode: 'BPSDM-SET', nama: 'Sekretariat Badan' },
  { kode: 'BPSDM-PPE', nama: 'Pusat Pengembangan Ekosistem Sumber Daya Manusia Komunikasi dan Digital' },
  { kode: 'BPSDM-PPT', nama: 'Pusat Pengembangan Talenta Digital' },
  { kode: 'BPSDM-PPL', nama: 'Pusat Pengembangan Literasi Digital' },
  { kode: 'BPSDM-PPA', nama: 'Pusat Pengembangan Aparatur Komunikasi dan Digital' },
  { kode: 'SA-HUK', nama: 'Staf Ahli Bidang Hukum' },
  { kode: 'SA-SEB', nama: 'Staf Ahli Bidang Sosial, Ekonomi, dan Budaya' },
  { kode: 'SA-KMM', nama: 'Staf Ahli Bidang Komunikasi dan Media Massa' },
  { kode: 'SA-TEK', nama: 'Staf Ahli Bidang Teknologi' },
];

export const INITIAL_EXTERNAL_SATKERS: ExternalSatker[] = KOMDIGI_SATKERS_DATA.map((item, idx) => {
  const isPimpinan = item.kode.includes('SA-')
    ? item.nama
    : item.kode.includes('SET')
    ? item.nama
    : `Kepala / Pimpinan ${item.nama}`;

  return {
    id: `satker-${item.kode.toLowerCase()}-${idx}`,
    kode: item.kode,
    namaSatker: `${item.kode} - ${item.nama}`,
    members: [
      { id: `mem-${item.kode.toLowerCase()}-1`, nama: isPimpinan },
      { id: `mem-${item.kode.toLowerCase()}-2`, nama: 'Staf terkait' },
    ],
  };
});

// ─── MODEL TABEL SPREADSHEET INTERAKTIF ──────────────────────────────────────
export interface SpreadsheetColumn {
  id: string;
  label: string;
}

export interface SpreadsheetCell {
  value: string;
  colSpan?: number;
  rowSpan?: number;
  isHidden?: boolean; // Tersembunyi karena di-merge dari sel kiri atau atas
}

export interface SpreadsheetRow {
  id: string;
  cells: SpreadsheetCell[];
}

export const INITIAL_SPREADSHEET_COLUMNS: SpreadsheetColumn[] = [
  { id: 'col-0', label: 'No' },
  { id: 'col-1', label: 'Kolom 1' },
  { id: 'col-2', label: 'Kolom 2' },
  { id: 'col-3', label: 'Kolom 3' },
];

export const INITIAL_SPREADSHEET_ROWS: SpreadsheetRow[] = [
  {
    id: 'row-1',
    cells: [{ value: '1' }, { value: '' }, { value: '' }, { value: '' }],
  },
  {
    id: 'row-2',
    cells: [{ value: '2' }, { value: '' }, { value: '' }, { value: '' }],
  },
  {
    id: 'row-3',
    cells: [{ value: '3' }, { value: '' }, { value: '' }, { value: '' }],
  },
];

export function getInternalPusakaJabatanKhusus(nama: string): string | null {
  const n = (nama || '').toLowerCase().trim();
  if (n.includes('oki suryowahono') || n.includes('oki suryowano')) {
    return 'Kepala Pusat Kebijakan Strategis';
  }
  if (n.includes('septa dewi anggraeni')) {
    return 'Ketua Tim Harmonisasi';
  }
  if (n.includes('dyah purwaningrum')) {
    return 'Ketua Tim Analisis Kebijakan';
  }
  if (n.includes('asriani sri wahyuni')) {
    return 'Ketua Tim Kualitas Kebijakan';
  }
  if (n.includes('achmad yansyuru')) {
    return 'Ketua Tim DTO';
  }
  if (n.includes('anna christina')) {
    return 'Kepala Subbagian Tata Usaha';
  }
  return null;
}

export const LampiranManager: React.FC<LampiranManagerProps> = ({
  jenisNaskah,
  items = [],
  onChange,
  pegawaiList = [],
  romanOffset = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'buat' | 'upload'>('buat');
  const [buatSubTab, setBuatSubTab] = useState<'daftar_undangan' | 'rundown' | 'teks_bebas'>('daftar_undangan');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [processingMsg, setProcessingMsg] = useState<string>('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Form Fields State
  const [newJudul, setNewJudul] = useState<string>('');
  const [newSubJudul, setNewSubJudul] = useState<string>('');
  const [newIsi, setNewIsi] = useState<string>('');
  const [tanpaMark, setTanpaMark] = useState<boolean>(false);
  const [pdfPageImages, setPdfPageImages] = useState<string[]>([]);
  const [extractedDocText, setExtractedDocText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    data: string;
  } | null>(null);

  const lastLocalEmitRef = useRef<{ judul: string; sub_judul: string; isi: string }>({
    judul: '',
    sub_judul: '',
    isi: '',
  });
  const savedUndanganTextRef = useRef<string>('');
  const savedManualTextRef = useRef<string>('');
  const savedTableHtmlRef = useRef<string>('');

  // ─── STATE DAFTAR UNDANGAN INTERAKTIF ──────────────────────────────────────
  const [searchSatker, setSearchSatker] = useState<string>('');
  const [externalSatkersList, setExternalSatkersList] = useState<ExternalSatker[]>(INITIAL_EXTERNAL_SATKERS);
  const [selectedSatkerIds, setSelectedSatkerIds] = useState<Record<string, boolean>>({});
  const [selectedExternalMembers, setSelectedExternalMembers] = useState<Record<string, Record<string, boolean>>>({});
  const [newMemberInputs, setNewMemberInputs] = useState<Record<string, string>>({});
  const [newSatkerInput, setNewSatkerInput] = useState<string>('');
  const [showAddSatkerModal, setShowAddSatkerModal] = useState<boolean>(false);

  // Anggota Internal: Pusat Kebijakan Strategis (tidak langsung dicentang secara default)
  const [selectedInternalIds, setSelectedInternalIds] = useState<Record<string, boolean>>({});

  // ─── STATE TABEL SPREADSHEET / RUNDOWN INTERAKTIF ──────────────────────────
  const [tableColumns, setTableColumns] = useState<SpreadsheetColumn[]>(INITIAL_SPREADSHEET_COLUMNS);
  const [tableRows, setTableRows] = useState<SpreadsheetRow[]>(INITIAL_SPREADSHEET_ROWS);

  // Label mark otomatis menggunakan Romawi murni (menyesuaikan urutan dan offset)
  const getAutoLabelMark = (index: number) => {
    return `Lampiran ${toRoman(Math.max(0, index) + 1 + romanOffset)}`;
  };

  const getDefaultJudul = () => {
    if (jenisNaskah === 'UNDANGAN') return 'DAFTAR UNDANGAN';
    if (jenisNaskah === 'NOTA_DINAS') return 'MATRIKS / SUSUNAN KEGIATAN';
    return 'DAFTAR LAMPIRAN';
  };

  // Pastikan saat berpindah tab utama (jenisNaskah berubah), editor lampiran dari tab sebelumnya ditutup dengan bersih
  const prevJenisNaskahRef = useRef<string>(jenisNaskah);
  useEffect(() => {
    if (prevJenisNaskahRef.current !== jenisNaskah) {
      prevJenisNaskahRef.current = jenisNaskah;
      setIsAdding(false);
      setEditingItemId(null);
      setBuatSubTab(jenisNaskah === 'UNDANGAN' ? 'daftar_undangan' : 'rundown');
    } else if (jenisNaskah !== 'UNDANGAN' && buatSubTab === 'daftar_undangan') {
      setBuatSubTab('rundown');
    }
  }, [jenisNaskah, buatSubTab]);

  // Compile teks Daftar Undangan (Nama Satker bold, nama anggota tidak bold, Internal Pusaka hanya 6 nama yang diberi jabatan)
  const generateDaftarUndanganText = useMemo(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lines: string[] = [];
    let sectionIdx = 0;

    // 1. Satker Eksternal Terpilih (A, B, ...)
    externalSatkersList.forEach((satker) => {
      if (selectedSatkerIds[satker.id]) {
        const letter = letters[sectionIdx % letters.length];
        const cleanSatkerName =
          satker.kode && satker.kode !== 'LAINNYA' && satker.namaSatker.startsWith(`${satker.kode} - `)
            ? satker.namaSatker.slice(`${satker.kode} - `.length)
            : satker.namaSatker;
        lines.push(`**${letter}. ${cleanSatkerName}**`);

        const activeMembers = satker.members.filter(
          (m) => selectedExternalMembers[satker.id]?.[m.id] !== false
        );

        if (activeMembers.length > 0) {
          activeMembers.forEach((m, mIdx) => {
            lines.push(`  ${mIdx + 1}. ${m.nama}`);
          });
        } else {
          lines.push(`  1. Kepala / Pimpinan Satuan Kerja`);
          lines.push(`  2. Staf terkait`);
        }
        lines.push('');
        sectionIdx++;
      }
    });

    // 2. Satker Internal: Pusat Kebijakan Strategis (Di urutan paling akhir)
    const activeInternal = pegawaiList.filter((p) => selectedInternalIds[p.id]);
    if (activeInternal.length > 0) {
      const letter = letters[sectionIdx % letters.length];
      lines.push(`**${letter}. Pusat Kebijakan Strategis**`);
      activeInternal.forEach((p, pIdx) => {
        const jabatanKhusus = getInternalPusakaJabatanKhusus(p.nama);
        const detail = jabatanKhusus ? `${p.nama}, ${jabatanKhusus}` : p.nama;
        lines.push(`  ${pIdx + 1}. ${detail}`);
      });
      lines.push('');
    }

    return lines.join('\n').trim();
  }, [
    externalSatkersList,
    selectedSatkerIds,
    selectedExternalMembers,
    pegawaiList,
    selectedInternalIds,
  ]);

  // Compile Tabel Spreadsheet ke HTML resmi (Mendukung Colspan / Merge Sel)
  const generateTableHtml = useMemo(() => {
    let html = '<table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 10px; border: 1px solid #000;">\n';
    html += '  <thead>\n    <tr style="background-color: #f8fafc;">\n';
    tableColumns.forEach((col) => {
      html += `      <th style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: center;">${col.label}</th>\n`;
    });
    html += '  </thead>\n  <tbody>\n';
    tableRows.forEach((row) => {
      html += '    <tr>\n';
      row.cells.forEach((cell) => {
        if (cell.isHidden) return;
        const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
        const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
        html += `      <td${colSpanAttr}${rowSpanAttr} style="border: 1px solid #000; padding: 5px 8px; text-align: center; vertical-align: middle;">${
          cell.value || ''
        }</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n</table>';
    return html;
  }, [tableColumns, tableRows]);

  const itemsRef = useRef<LampiranItem[]>(items);
  itemsRef.current = items;

  const syncToParent = (patch: Partial<LampiranItem>, targetId = editingItemId) => {
    if (!targetId) return;
    const curItems = itemsRef.current;
    const currentIdx = curItems.findIndex((it) => it.id === targetId);
    if (currentIdx < 0) return;

    const existing = curItems[currentIdx];
    const updatedItem: LampiranItem = {
      ...existing,
      ...patch,
      label_mark: getAutoLabelMark(currentIdx),
    };

    lastLocalEmitRef.current = {
      judul: updatedItem.judul || '',
      sub_judul: updatedItem.sub_judul || '',
      isi: updatedItem.isi || '',
    };

    const isSame =
      existing.tipe === updatedItem.tipe &&
      existing.label_mark === updatedItem.label_mark &&
      existing.judul === updatedItem.judul &&
      existing.sub_judul === updatedItem.sub_judul &&
      existing.isi === updatedItem.isi &&
      existing.tanpa_mark === updatedItem.tanpa_mark &&
      existing.file_name === updatedItem.file_name &&
      existing.file_data === updatedItem.file_data &&
      existing.pdf_pages_images === updatedItem.pdf_pages_images;

    if (!isSame) {
      const next = [...curItems];
      next[currentIdx] = updatedItem;
      itemsRef.current = next;
      onChange(next);
    }
  };

  // Sync hanya ketika pilihan checklist satker/internal berubah saat berada di sub-tab "daftar_undangan"
  const prevGeneratedUndanganRef = useRef<string>(generateDaftarUndanganText);
  useEffect(() => {
    if (prevGeneratedUndanganRef.current !== generateDaftarUndanganText) {
      prevGeneratedUndanganRef.current = generateDaftarUndanganText;
      if (activeTab === 'buat' && isAdding && buatSubTab === 'daftar_undangan') {
        savedUndanganTextRef.current = generateDaftarUndanganText;
        setNewIsi(generateDaftarUndanganText);
        syncToParent({ isi: generateDaftarUndanganText });
      }
    }
  }, [generateDaftarUndanganText, activeTab, isAdding, buatSubTab]);

  // Sinkronisasi 1 arah dari Panel Kanan (ketika pengguna mengetik langsung di kertas Lampiran pada SuratPreview) -> update state lokal LampiranManager
  useEffect(() => {
    if (!isAdding || !editingItemId) return;
    const ext = items.find((it) => it.id === editingItemId);
    if (!ext) return;

    if ((ext.isi || '') !== lastLocalEmitRef.current.isi) {
      const nextIsi = ext.isi || '';
      lastLocalEmitRef.current.isi = nextIsi;
      if (nextIsi.includes('<table')) {
        savedTableHtmlRef.current = nextIsi;
      } else if (buatSubTab === 'teks_bebas') {
        savedManualTextRef.current = nextIsi;
      } else if (buatSubTab === 'daftar_undangan') {
        savedUndanganTextRef.current = nextIsi;
      }
      setNewIsi((prev) => (prev === nextIsi ? prev : nextIsi));
    }
    if ((ext.judul || '') !== lastLocalEmitRef.current.judul) {
      const nextJudul = ext.judul || '';
      lastLocalEmitRef.current.judul = nextJudul;
      setNewJudul((prev) => (prev === nextJudul ? prev : nextJudul));
    }
    if ((ext.sub_judul || '') !== lastLocalEmitRef.current.sub_judul) {
      const nextSub = ext.sub_judul || '';
      lastLocalEmitRef.current.sub_judul = nextSub;
      setNewSubJudul((prev) => (prev === nextSub ? prev : nextSub));
    }
  }, [items, isAdding, editingItemId]);

  const handleStartAdd = () => {
    const newId = `lamp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const defaultJudul = getDefaultJudul();
    const defaultSub = jenisNaskah === 'UNDANGAN' ? 'daftar_undangan' : 'rundown';
    const initialIsi = defaultSub === 'daftar_undangan' ? generateDaftarUndanganText : generateTableHtml;

    savedUndanganTextRef.current = defaultSub === 'daftar_undangan' ? initialIsi : '';
    savedManualTextRef.current = '';
    savedTableHtmlRef.current = defaultSub === 'rundown' ? initialIsi : '';

    setEditingItemId(newId);
    setActiveTab('buat');
    setNewJudul(defaultJudul);
    setNewSubJudul('');
    setBuatSubTab(defaultSub);
    setNewIsi(initialIsi);
    setTanpaMark(false);
    setPdfPageImages([]);
    setExtractedDocText('');
    setUploadedFile(null);
    setIsAdding(true);

    const newItem: LampiranItem = {
      id: newId,
      tipe: 'buat',
      label_mark: getAutoLabelMark(items.length),
      judul: defaultJudul,
      isi: initialIsi,
    };
    lastLocalEmitRef.current = { judul: defaultJudul, sub_judul: '', isi: initialIsi };
    onChange([...items, newItem]);
  };

  const handleStartEdit = (item: LampiranItem) => {
    const rawContent = item.isi || item.extracted_text || '';
    const isTableContent = rawContent.includes('<table') || !!item.isi?.includes('| Waktu');
    const isUndanganContent = !isTableContent && !!item.judul?.toUpperCase().includes('UNDANGAN');

    savedTableHtmlRef.current = isTableContent ? rawContent : '';
    savedUndanganTextRef.current = isUndanganContent ? rawContent : '';
    savedManualTextRef.current = !isTableContent && !isUndanganContent ? rawContent : '';

    setEditingItemId(item.id);
    setActiveTab(item.tipe);
    setNewJudul(item.judul || '');
    setNewSubJudul(item.sub_judul || '');
    setNewIsi(rawContent);
    setTanpaMark(!!item.tanpa_mark);
    setPdfPageImages(item.pdf_pages_images || []);
    setExtractedDocText(item.extracted_text || '');
    lastLocalEmitRef.current = {
      judul: item.judul || '',
      sub_judul: item.sub_judul || '',
      isi: rawContent,
    };
    setBuatSubTab(
      isTableContent
        ? 'rundown'
        : isUndanganContent
        ? 'daftar_undangan'
        : 'teks_bebas'
    );
    if (item.file_name) {
      setUploadedFile({
        name: item.file_name,
        size: item.file_size || 0,
        type: item.file_type || '',
        data: item.file_data || '',
      });
    } else {
      setUploadedFile(null);
    }
    setIsAdding(true);
  };

  // Toggle checklist Satker Eksternal
  const handleToggleSatker = (satkerId: string) => {
    setSelectedSatkerIds((prev) => ({
      ...prev,
      [satkerId]: !prev[satkerId],
    }));
  };

  // Toggle checklist anggota di Satker Eksternal
  const handleToggleMember = (satkerId: string, memberId: string) => {
    setSelectedExternalMembers((prev) => ({
      ...prev,
      [satkerId]: {
        ...prev[satkerId],
        [memberId]: prev[satkerId]?.[memberId] === false ? true : false,
      },
    }));
  };

  // Tambah anggota kustom di satker tertentu
  const handleAddCustomMember = (satkerId: string) => {
    const inputVal = (newMemberInputs[satkerId] || '').trim();
    if (!inputVal) return;

    setExternalSatkersList((prev) =>
      prev.map((s) => {
        if (s.id === satkerId) {
          const newMemId = `custom-mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          return {
            ...s,
            members: [...s.members, { id: newMemId, nama: inputVal }],
          };
        }
        return s;
      })
    );

    setNewMemberInputs((prev) => ({ ...prev, [satkerId]: '' }));
  };

  // Hapus anggota kustom dari satker
  const handleDeleteCustomMember = (satkerId: string, memberId: string) => {
    setExternalSatkersList((prev) =>
      prev.map((s) => {
        if (s.id === satkerId) {
          return {
            ...s,
            members: s.members.filter((m) => m.id !== memberId),
          };
        }
        return s;
      })
    );

    setSelectedExternalMembers((prev) => {
      const copy = { ...prev };
      if (copy[satkerId]) {
        const satkerCopy = { ...copy[satkerId] };
        delete satkerCopy[memberId];
        copy[satkerId] = satkerCopy;
      }
      return copy;
    });
  };

  // Tombol "Tambah Lainnya" untuk Satker Eksternal Baru
  const handleAddCustomSatker = () => {
    const name = newSatkerInput.trim();
    if (!name) return;

    const newId = `satker-custom-${Date.now()}`;
    const newSatker: ExternalSatker = {
      id: newId,
      kode: 'LAINNYA',
      namaSatker: name,
      members: [
        { id: `custom-mem-${newId}-1`, nama: `Pimpinan / Kepala ${name}` },
        { id: `custom-mem-${newId}-2`, nama: 'Staf Terkait' },
      ],
    };

    setExternalSatkersList((prev) => [newSatker, ...prev]);
    setSelectedSatkerIds((prev) => ({ ...prev, [newId]: true }));
    setSelectedExternalMembers((prev) => ({
      ...prev,
      [newId]: { [`custom-mem-${newId}-1`]: true, [`custom-mem-${newId}-2`]: true },
    }));
    setNewSatkerInput('');
    setSearchSatker('');
  };

  // Hapus Satker Kustom yang ditambahkan
  const handleDeleteCustomSatker = (satkerId: string) => {
    if (!confirm('Hapus satuan kerja / lembaga ini dari daftar?')) return;
    setExternalSatkersList((prev) => prev.filter((s) => s.id !== satkerId));
    setSelectedSatkerIds((prev) => {
      const next = { ...prev };
      delete next[satkerId];
      return next;
    });
    setSelectedExternalMembers((prev) => {
      const next = { ...prev };
      delete next[satkerId];
      return next;
    });
  };

  // Toggle anggota internal (Pusat Kebijakan Strategis)
  const handleToggleInternal = (id: string) => {
    setSelectedInternalIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAllInternal = () => {
    const allSelected = pegawaiList.every((p) => selectedInternalIds[p.id]);
    const next: Record<string, boolean> = {};
    if (!allSelected) {
      pegawaiList.forEach((p) => {
        next[p.id] = true;
      });
    }
    setSelectedInternalIds(next);
  };

  // ─── OPERASI TABEL SPREADSHEET ─────────────────────────────────────────────
  // Tambah Kolom di sebelah kanan
  const handleAddColumn = () => {
    const newColId = `col-${Date.now()}`;
    const label = prompt('Masukkan nama kolom baru:', `Kolom ${tableColumns.length + 1}`);
    if (!label) return;

    setTableColumns((prev) => [...prev, { id: newColId, label: label.trim() }]);
    setTableRows((prev) =>
      prev.map((row) => ({
        ...row,
        cells: [...row.cells, { value: '' }],
      }))
    );
  };

  // Hapus Kolom
  const handleDeleteColumn = (colIdx: number) => {
    if (tableColumns.length <= 1) {
      alert('Tabel minimal harus memiliki 1 kolom.');
      return;
    }
    if (!confirm(`Hapus kolom "${tableColumns[colIdx].label}"?`)) return;

    setTableColumns((prev) => prev.filter((_, i) => i !== colIdx));
    setTableRows((prev) =>
      prev.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== colIdx),
      }))
    );
  };

  // Ubah Nama Kolom
  const handleRenameColumn = (colIdx: number, newLabel: string) => {
    setTableColumns((prev) =>
      prev.map((col, i) => (i === colIdx ? { ...col, label: newLabel } : col))
    );
  };

  // Tambah Baris di Bawah
  const handleAddRow = () => {
    const newRowId = `row-${Date.now()}`;
    const cells: SpreadsheetCell[] = tableColumns.map((col, idx) => {
      if (idx === 0 && col.label.toLowerCase() === 'no') {
        return { value: String(tableRows.length + 1) };
      }
      return { value: '' };
    });
    setTableRows((prev) => [...prev, { id: newRowId, cells }]);
  };

  // Hapus Baris
  const handleDeleteRow = (rowIdx: number) => {
    if (tableRows.length <= 1) {
      alert('Tabel minimal harus memiliki 1 baris.');
      return;
    }
    setTableRows((prev) => {
      const filtered = prev.filter((_, i) => i !== rowIdx);
      // Re-number kolom No jika ada
      if (tableColumns[0]?.label.toLowerCase() === 'no') {
        return filtered.map((r, i) => {
          const cells = [...r.cells];
          if (cells[0] && !cells[0].isHidden) {
            cells[0] = { ...cells[0], value: String(i + 1) };
          }
          return { ...r, cells };
        });
      }
      return filtered;
    });
  };

  // Update Nilai Sel
  const handleUpdateCell = (rowIdx: number, colIdx: number, val: string) => {
    setTableRows((prev) =>
      prev.map((row, rI) => {
        if (rI !== rowIdx) return row;
        const newCells = [...row.cells];
        newCells[colIdx] = { ...newCells[colIdx], value: val };
        return { ...row, cells: newCells };
      })
    );
  };

  // Gabung Sel ke Kanan (Merge Colspan)
  const handleMergeRight = (rowIdx: number, colIdx: number) => {
    if (colIdx >= tableColumns.length - 1) {
      alert('Tidak ada sel lagi di sebelah kanan untuk digabungkan.');
      return;
    }
    setTableRows((prev) =>
      prev.map((row, rI) => {
        if (rI !== rowIdx) return row;
        const cells = [...row.cells];
        const cur = cells[colIdx];
        const next = cells[colIdx + 1];
        if (!cur || !next || next.isHidden) return row;

        const curSpan = cur.colSpan || 1;
        const nextSpan = next.colSpan || 1;
        const combinedText = [cur.value, next.value].filter(Boolean).join(' ');

        cells[colIdx] = { ...cur, value: combinedText, colSpan: curSpan + nextSpan };
        cells[colIdx + 1] = { ...next, isHidden: true };
        return { ...row, cells };
      })
    );
  };

  // Pisahkan Sel (Unmerge Colspan & Rowspan)
  const handleUnmerge = (rowIdx: number, colIdx: number) => {
    setTableRows((prev) => {
      const rows = prev.map((row) => ({ ...row, cells: [...row.cells] }));
      const cur = rows[rowIdx]?.cells[colIdx];
      if (!cur || ((cur.colSpan || 1) <= 1 && (cur.rowSpan || 1) <= 1)) return prev;

      const colSpan = cur.colSpan || 1;
      const rowSpan = cur.rowSpan || 1;

      for (let r = rowIdx; r < rowIdx + rowSpan; r++) {
        if (!rows[r]) continue;
        for (let c = colIdx; c < colIdx + colSpan; c++) {
          if (rows[r].cells[c]) {
            rows[r].cells[c] = {
              ...rows[r].cells[c],
              isHidden: false,
              colSpan: 1,
              rowSpan: 1,
            };
          }
        }
      }
      return rows;
    });
  };

  // File Upload Handler (Mendukung Seluruh Halaman PDF/Dokumen Tanpa Batas 1 Halaman)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran file maksimal 25MB.');
      return;
    }

    setIsProcessingFile(true);
    setProcessingMsg(`Membaca seluruh halaman "${file.name}"...`);

    try {
      const arrayBuffer = await file.arrayBuffer();

      let extractedText = '';
      let renderedImages: string[] = [];

      if (file.name.toLowerCase().endsWith('.docx')) {
        setProcessingMsg('Mengekstrak teks dari Word (.docx)...');
        const res = await extractTextFromDocxBuffer(arrayBuffer);
        const text = typeof res === 'string' ? res : res.text;
        extractedText = text;
        setExtractedDocText(text);
        setNewIsi(text);
        setNewJudul('');
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        setProcessingMsg('Merender seluruh halaman PDF ke lembar lampiran...');
        try {
          const images = await renderPdfPagesToImages(arrayBuffer, 1.6, 100);
          renderedImages = images;
          setPdfPageImages(images);
        } catch (e) {
          console.warn('PDF render to image fallback:', e);
        }
        setExtractedDocText('');
        setNewIsi('');
        setNewJudul('');
      } else {
        setNewIsi('');
        setNewJudul('');
      }

      const reader = new FileReader();
      reader.onload = () => {
        const fileDataUrl = reader.result as string;
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          data: fileDataUrl,
        };
        setUploadedFile(fileObj);
        syncToParent({
          tipe: 'upload',
          judul: '',
          sub_judul: undefined,
          isi: extractedText,
          file_name: fileObj.name,
          file_size: fileObj.size,
          file_type: fileObj.type,
          file_data: fileObj.data,
          pdf_pages_images: renderedImages.length > 0 ? renderedImages : undefined,
          extracted_text: extractedText || undefined,
          tanpa_mark: tanpaMark,
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error memproses file lampiran:', err);
      alert('Gagal memproses dokumen: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsProcessingFile(false);
      setProcessingMsg('');
    }
  };

  const handleSaveItem = () => {
    setIsAdding(false);
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Hapus lampiran ini?')) {
      const remaining = items.filter((item) => item.id !== id);
      // Re-assign Romawi otomatis agar urutan I, II, III selalu konsisten
      const renumbered = remaining.map((item, idx) => ({
        ...item,
        label_mark: getAutoLabelMark(idx),
      }));
      onChange(renumbered);
      if (editingItemId === id) {
        setIsAdding(false);
        setEditingItemId(null);
      }
    }
  };

  // Ubah urutan lampiran (via Grab Drag-and-Drop maupun tombol Geser Naik/Turun) & otomatis sesuaikan mark kanan atas
  const handleReorderItems = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= items.length ||
      toIdx >= items.length
    ) {
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const renumbered = reordered.map((item, idx) => ({
      ...item,
      label_mark: getAutoLabelMark(idx),
    }));
    onChange(renumbered);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter satker eksternal realtime (berdasarkan kode atau nama)
  const filteredExternalSatkers = useMemo(() => {
    if (!searchSatker.trim()) return externalSatkersList;
    const q = searchSatker.toLowerCase().trim();
    return externalSatkersList.filter((s) => {
      const matchKode = s.kode ? s.kode.toLowerCase().includes(q) : false;
      const matchNama = s.namaSatker.toLowerCase().includes(q);
      const matchMember = s.members.some((m) => m.nama.toLowerCase().includes(q));
      return matchKode || matchNama || matchMember;
    });
  }, [externalSatkersList, searchSatker]);

  const activeColor =
    jenisNaskah === 'UNDANGAN'
      ? 'amber'
      : jenisNaskah === 'NOTA_DINAS'
      ? 'indigo'
      : 'teal';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              activeColor === 'amber'
                ? 'bg-amber-100 text-amber-800'
                : activeColor === 'indigo'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Lampiran Dokumen</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {items.length} Berkas
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {jenisNaskah === 'UNDANGAN'
                ? 'Kelola lembar daftar undangan (eksternal/internal), rundown acara (spreadsheet), atau berkas PDF/Word'
                : 'Buat lembar lampiran resmi atau unggah berkas PDF/Word untuk ditampilkan'}
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={handleStartAdd}
            className={`flex items-center space-x-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer ${
              activeColor === 'amber'
                ? 'bg-amber-600 hover:bg-amber-700'
                : activeColor === 'indigo'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Lampiran</span>
          </button>
        )}
      </div>

      {/* List Existing Lampiran (Dapat Di-Grab / Drag-and-Drop Pindah Barisan) */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.length > 1 && (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                <span>Tahan &amp; geser (grab) barisan untuk mengubah urutan lampiran</span>
              </span>
              <span className="font-medium text-slate-400">Penanda otomatis menyesuaikan urutan</span>
            </div>
          )}
          {items.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isCurrentlyEditing = editingItemId === item.id;
            const romanLabel = getAutoLabelMark(idx);
            const isDragged = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = 'move';
                  try {
                    e.dataTransfer.setData('text/plain', String(idx));
                  } catch {}
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIdx !== idx) {
                    setDragOverIdx(idx);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIdx === idx) {
                    setDragOverIdx(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = draggedIdx !== null ? draggedIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                  if (!isNaN(from) && from !== idx) {
                    handleReorderItems(from, idx);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isDragged
                    ? 'opacity-50 scale-[0.99] border-dashed border-slate-400 bg-slate-100'
                    : isDragOver
                    ? activeColor === 'amber'
                      ? 'border-2 border-amber-500 bg-amber-50/60 shadow-sm'
                      : activeColor === 'indigo'
                      ? 'border-2 border-indigo-500 bg-indigo-50/60 shadow-sm'
                      : 'border-2 border-teal-500 bg-teal-50/60 shadow-sm'
                    : isCurrentlyEditing
                    ? activeColor === 'amber'
                      ? 'border-amber-500 bg-amber-50/30'
                      : activeColor === 'indigo'
                      ? 'border-indigo-500 bg-indigo-50/30'
                      : 'border-teal-500 bg-teal-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Handle Grab Drag-and-Drop */}
                    <div
                      className="p-1 -ml-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded hover:bg-slate-200/60 shrink-0 transition-colors"
                      title="Tahan dan geser (drag) untuk memindahkan urutan lampiran"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      className="flex items-center space-x-2.5 flex-1 min-w-0 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-2xs shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {romanLabel}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${
                              item.tipe === 'buat'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.tipe === 'buat' ? 'Teks Dokumen' : 'File Terunggah'}
                          </span>
                          {item.pdf_pages_images && item.pdf_pages_images.length > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                              PDF ({item.pdf_pages_images.length} Hal)
                            </span>
                          )}
                          {item.tanpa_mark && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Tanpa Mark
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-700 font-semibold truncate max-w-[240px] sm:max-w-md mt-0.5">
                          {item.judul || (item.file_name ? item.file_name : 'Tanpa Judul')}
                        </div>
                        {item.sub_judul && (
                          <div className="text-[10.5px] text-slate-500 italic truncate max-w-[240px] sm:max-w-md">
                            {item.sub_judul}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {items.length > 1 && (
                      <div className="flex items-center mr-1 bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorderItems(idx, idx - 1)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                          title="Geser urutan ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => handleReorderItems(idx, idx + 1)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border-l border-slate-200 cursor-pointer transition-colors"
                          title="Geser urutan ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer shadow-2xs ${
                        activeColor === 'amber'
                          ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300'
                          : activeColor === 'indigo'
                          ? 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-300'
                          : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-300'
                      }`}
                      title="Edit isi, judul, atau tabel lampiran ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus lampiran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detail View jika di-expand */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 bg-white text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Penanda Resmi: <strong>{romanLabel}</strong></span>
                      <span>Jenis: {item.tipe === 'buat' ? 'Teks Dokumen' : 'File Terunggah'}</span>
                    </div>
                    {item.sub_judul && (
                      <div className="text-[11px] text-slate-600">
                        Sub Judul: <strong>{item.sub_judul}</strong>
                      </div>
                    )}
                    {item.isi && !item.isi.includes('<table') && (
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-36 overflow-y-auto text-[11px] font-mono whitespace-pre-wrap">
                        {item.isi.slice(0, 300)}
                        {item.isi.length > 300 && '...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Tambah / Edit Lampiran */}
      {isAdding && (
        <div
          className={`border-2 rounded-xl p-3.5 space-y-3.5 animate-fade-in ${
            activeColor === 'amber'
              ? 'border-amber-400/50 bg-amber-50/20'
              : activeColor === 'indigo'
              ? 'border-indigo-400/50 bg-indigo-50/20'
              : 'border-teal-400/50 bg-teal-50/20'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2 border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {editingItemId
                  ? `Edit ${getAutoLabelMark(items.findIndex((it) => it.id === editingItemId))}`
                  : `Formulir ${getAutoLabelMark(items.length)}`}
              </span>
            </h4>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('buat');
                  const effJudul = newJudul.trim() || getDefaultJudul();
                  if (!newJudul.trim()) setNewJudul(effJudul);
                  syncToParent({
                    tipe: 'buat',
                    judul: effJudul,
                    sub_judul: newSubJudul.trim() || undefined,
                    isi: newIsi,
                    tanpa_mark: undefined,
                  });
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'buat'
                    ? activeColor === 'amber'
                      ? 'bg-amber-600 text-white font-bold'
                      : activeColor === 'indigo'
                      ? 'bg-indigo-700 text-white font-bold'
                      : 'bg-teal-700 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Buat Lembar Teks / Tabel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  syncToParent({
                    tipe: 'upload',
                    judul: '',
                    sub_judul: undefined,
                    isi: newIsi || extractedDocText,
                    file_name: uploadedFile?.name,
                    file_size: uploadedFile?.size,
                    file_type: uploadedFile?.type,
                    file_data: uploadedFile?.data,
                    pdf_pages_images: pdfPageImages.length > 0 ? pdfPageImages : undefined,
                    extracted_text: extractedDocText || undefined,
                    tanpa_mark: tanpaMark,
                  });
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? activeColor === 'amber'
                      ? 'bg-amber-600 text-white font-bold'
                      : activeColor === 'indigo'
                      ? 'bg-indigo-700 text-white font-bold'
                      : 'bg-teal-700 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File / Dokumen
              </button>
            </div>
          </div>

          {/* Form Fields: Judul Lampiran & Sub Judul Lampiran (Hanya untuk Buat Lembar Teks/Tabel, BUKAN Upload Dokumen) */}
          {activeTab === 'buat' && (
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Judul Lampiran:
                </label>
                <input
                  type="text"
                  value={newJudul}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewJudul(val);
                    syncToParent({ judul: val.trim() || getDefaultJudul() });
                  }}
                  placeholder="Contoh: DAFTAR UNDANGAN / SUSUNAN ACARA / PEDOMAN TEKNIS"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sub Judul Lampiran:
                </label>
                <input
                  type="text"
                  value={newSubJudul}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewSubJudul(val);
                    syncToParent({ sub_judul: val.trim() || undefined });
                  }}
                  placeholder="Contoh: Rapat Koordinasi Pembahasan Kebijakan Strategis Penyelenggaraan Digital"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Sub-Tabs Khusus Mode "Buat Lembar Teks / Tabel" */}
          {activeTab === 'buat' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                {jenisNaskah === 'UNDANGAN' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (buatSubTab === 'rundown' || newIsi.includes('<table')) {
                        savedTableHtmlRef.current = newIsi;
                      } else if (buatSubTab === 'teks_bebas') {
                        savedManualTextRef.current = newIsi;
                      }
                      const nextJudul =
                        !newJudul || newJudul.includes('RUNDOWN') || newJudul.includes('MATRIKS')
                          ? 'DAFTAR UNDANGAN'
                          : newJudul;
                      const nextUndangan = generateDaftarUndanganText || savedUndanganTextRef.current || '';
                      savedUndanganTextRef.current = nextUndangan;
                      setNewJudul(nextJudul);
                      setNewIsi(nextUndangan);
                      setBuatSubTab('daftar_undangan');
                      syncToParent({ judul: nextJudul, isi: nextUndangan });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      buatSubTab === 'daftar_undangan'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pilih Satker yang Diundang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    let nextTable = newIsi;
                    if (!newIsi.includes('<table')) {
                      if (buatSubTab === 'teks_bebas') {
                        savedManualTextRef.current = newIsi;
                      } else if (buatSubTab === 'daftar_undangan') {
                        savedUndanganTextRef.current = newIsi;
                      }
                      nextTable = savedTableHtmlRef.current || generateTableHtml;
                      setNewIsi(nextTable);
                    }
                    const nextJudul =
                      !newJudul || newJudul.includes('UNDANGAN')
                        ? jenisNaskah === 'NOTA_DINAS'
                          ? 'MATRIKS / SUSUNAN KEGIATAN'
                          : 'SUSUNAN ACARA / RUNDOWN KEGIATAN'
                        : newJudul;
                    setNewJudul(nextJudul);
                    setBuatSubTab('rundown');
                    syncToParent({ judul: nextJudul, isi: nextTable });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    buatSubTab === 'rundown'
                      ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tabel / Matriks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (buatSubTab === 'rundown' || newIsi.includes('<table')) {
                      savedTableHtmlRef.current = newIsi;
                    } else if (buatSubTab === 'daftar_undangan') {
                      savedUndanganTextRef.current = newIsi;
                    }
                    const nextManual = savedManualTextRef.current || '';
                    setNewIsi(nextManual);
                    setBuatSubTab('teks_bebas');
                    syncToParent({ isi: nextManual });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    buatSubTab === 'teks_bebas'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Teks Bebas / Manual</span>
                </button>
              </div>

              {/* ── SUB-TAB 1: PILIH SATKER YANG DIUNDANG ───────────────────── */}
              {buatSubTab === 'daftar_undangan' && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                  {/* Satker Eksternal (Prioritas Pertama: A, B, C...) */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-600" />
                          <span>1. Satker yang Diundang (59 Satker Komdigi &amp; Eksternal)</span>
                        </span>
                      </div>

                      {/* Search Box Realtime & Tombol Tambah Lainnya */}
                      <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Cari Satker (misal: DJID, Humas)..."
                            value={searchSatker}
                            onChange={(e) => setSearchSatker(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault(); // Mencegah submit atau penambahan satker otomatis saat Enter!
                              }
                            }}
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                          />
                          {searchSatker && (
                            <button
                              type="button"
                              onClick={() => setSearchSatker('')}
                              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAddSatkerModal(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs transition-colors"
                          title="Klik untuk membuat satker/lembaga baru di luar daftar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Lainnya</span>
                        </button>
                      </div>
                    </div>

                    {/* Modal / Form Tambah Satker Baru (Hanya Muncul saat Pengguna Mengklik Tombol 'Tambah Lainnya') */}
                    {showAddSatkerModal && (
                      <div className="p-3 mb-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2.5 animate-fade-in shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-700" />
                            <span>Buat &amp; Tambahkan Satker / Lembaga Lainnya:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddSatkerModal(false);
                              setNewSatkerInput('');
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ketik nama Satker / Lembaga baru (misal: Institut Teknologi Bandung, Kemenkeu)..."
                            value={newSatkerInput}
                            onChange={(e) => setNewSatkerInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSatker();
                                setShowAddSatkerModal(false);
                              }
                            }}
                            autoFocus
                            className="flex-1 p-2 bg-white border border-amber-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleAddCustomSatker();
                              setShowAddSatkerModal(false);
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                          >
                            Tambahkan
                          </button>
                        </div>
                        <p className="text-[10.5px] text-amber-800">
                          Satker yang ditambahkan akan otomatis terpilih di urutan teratas daftar undangan.
                        </p>
                      </div>
                    )}

                    {/* List Satker Eksternal */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                      {filteredExternalSatkers.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Search className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">Tidak ada satker yang dicari</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tidak ditemukan satker dengan kata kunci &quot;{searchSatker}&quot;. Silakan gunakan tombol &quot;+ Tambah Lainnya&quot; jika ingin mengundang lembaga di luar daftar.
                          </p>
                        </div>
                      ) : (
                        filteredExternalSatkers.map((satker) => {
                          const isChecked = !!selectedSatkerIds[satker.id];
                          return (
                            <div
                              key={satker.id}
                              className={`p-2.5 rounded-lg border transition-all ${
                                isChecked
                                  ? 'bg-amber-50/40 border-amber-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label className="flex items-center space-x-2 cursor-pointer select-none flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleSatker(satker.id)}
                                    className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span className={`font-bold text-xs ${isChecked ? 'text-amber-950' : 'text-slate-800'}`}>
                                    {satker.namaSatker}
                                  </span>
                                </label>

                                {/* Tombol Hapus Satker Kustom / Lembaga Lainnya */}
                                {(satker.kode === 'LAINNYA' || satker.id.startsWith('satker-custom')) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomSatker(satker.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Hapus lembaga / satker ini dari daftar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Daftar Anggota Satker Eksternal jika Satker Dicentang */}
                              {isChecked && (
                                <div className="mt-2 pl-5 space-y-1.5 border-t border-amber-100/60 pt-2">
                                  <div className="text-[10.5px] font-semibold text-slate-600 mb-1">
                                    Pilih Anggota yang Diundang:
                                  </div>
                                  {satker.members.map((m) => {
                                    const isMemberChecked = selectedExternalMembers[satker.id]?.[m.id] !== false;
                                    const isCustomMember = m.id.includes('custom') || satker.kode === 'LAINNYA';

                                    return (
                                      <div
                                        key={m.id}
                                        className="flex items-center justify-between group/mem py-0.5 hover:bg-amber-50/50 rounded px-1"
                                      >
                                        <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer select-none flex-1">
                                          <input
                                            type="checkbox"
                                            checked={isMemberChecked}
                                            onChange={() => handleToggleMember(satker.id, m.id)}
                                            className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                                          />
                                          <span>{m.nama}</span>
                                        </label>

                                        {/* Tombol Hapus Anggota Kustom */}
                                        {isCustomMember && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCustomMember(satker.id, m.id)}
                                            className="opacity-0 group-hover/mem:opacity-100 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-opacity cursor-pointer ml-1"
                                            title="Hapus nama anggota ini"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Input Tambah Anggota Sendiri */}
                                  <div className="flex items-center gap-1.5 pt-1.5">
                                    <input
                                      type="text"
                                      placeholder="Tambah nama anggota / staf kustom..."
                                      value={newMemberInputs[satker.id] || ''}
                                      onChange={(e) =>
                                        setNewMemberInputs({
                                          ...newMemberInputs,
                                          [satker.id]: e.target.value,
                                        })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomMember(satker.id);
                                        }
                                      }}
                                      className="flex-1 p-1 bg-white border border-slate-200 rounded text-[11px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddCustomMember(satker.id)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                      <span>Tambah</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Satker Internal: Pusat Kebijakan Strategis */}
                  <div className="border-t border-slate-200/80 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-teal-600" />
                          <span>2. Pihak Internal: Pusat Kebijakan Strategis</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllInternal}
                        className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
                      >
                        {pegawaiList.every((p) => selectedInternalIds[p.id]) ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {pegawaiList.map((p) => {
                        const isChecked = !!selectedInternalIds[p.id];
                        const jabatanKhusus = getInternalPusakaJabatanKhusus(p.nama);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center space-x-2 p-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-teal-50 border-teal-200 text-teal-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleInternal(p.id)}
                              className="rounded text-teal-600 focus:ring-teal-500 w-3 h-3 cursor-pointer"
                            />
                            <div className="truncate">
                              <span className="font-semibold">{p.nama}</span>
                              {jabatanKhusus && (
                                <span className="text-[10px] text-teal-700 font-medium block truncate">
                                  {jabatanKhusus}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUB-TAB 2: TABEL / MATRIKS INTERAKTIF ────── */}
              {buatSubTab === 'rundown' && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                      <span>Pembuat Tabel Lampiran</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Atur ukuran tabel dengan tombol Buat Ukuran Tabel, klik tombol (+) di perbatasan kolom &amp; baris untuk menyisipkan, atau blok (drag) beberapa sel untuk Merge &amp; Split.
                    </p>
                  </div>

                  {/* Editor Tabel Interaktif Visual (Tanpa Kodingan HTML Mentah) */}
                  <InteractiveDocumentTable
                    initialContent={newIsi.includes('<table') ? newIsi : (savedTableHtmlRef.current || generateTableHtml)}
                    onChangeContent={(html) => {
                      savedTableHtmlRef.current = html;
                      setNewIsi(html);
                      syncToParent({ isi: html });
                    }}
                  />
                </div>
              )}

              {/* ── AREA PRATINJAU DAFTAR UNDANGAN / TEKS BEBAS ───────────────────────── */}
              {(buatSubTab === 'daftar_undangan' || buatSubTab === 'teks_bebas') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      {buatSubTab === 'daftar_undangan'
                        ? 'Preview Daftar Undangan yang Akan Muncul di Lampiran:'
                        : 'Isi Teks / Dokumen Lampiran:'}
                    </label>
                  </div>

                  <textarea
                    rows={8}
                    data-rich="true"
                    value={buatSubTab === 'teks_bebas' && newIsi.includes('<table') ? '' : newIsi}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (buatSubTab === 'teks_bebas') {
                        savedManualTextRef.current = val;
                      } else if (buatSubTab === 'daftar_undangan') {
                        savedUndanganTextRef.current = val;
                      }
                      setNewIsi(val);
                      syncToParent({ isi: val });
                    }}
                    placeholder="Ketik atau edit daftar nama undangan, susunan acara, pedoman, atau materi lampiran di sini..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-amber-500 font-sans"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Pilih Dokumen Lampiran (PDF, Word DOCX, Gambar):
              </label>

              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white rounded-xl cursor-pointer transition-all">
                {isProcessingFile ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="w-7 h-7 text-teal-600 animate-spin mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">{processingMsg}</span>
                  </div>
                ) : (
                  <>
                    <FileUp className="w-8 h-8 text-teal-600 mb-1.5" />
                    <span className="text-xs font-bold text-slate-800">
                      Klik untuk Memilih File atau Seret ke Sini
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PDF (halaman akan dirender langsung), Word (.docx), atau Gambar
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessingFile}
                />
              </label>

              {uploadedFile && (
                <div className="p-3 bg-white rounded-lg border border-teal-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{uploadedFile.name}</div>
                        <div className="text-[10px] text-slate-500">{formatFileSize(uploadedFile.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setPdfPageImages([]);
                        setExtractedDocText('');
                        syncToParent({
                          file_name: undefined,
                          file_size: undefined,
                          file_type: undefined,
                          file_data: undefined,
                          pdf_pages_images: undefined,
                          extracted_text: undefined,
                        });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  {pdfPageImages.length > 0 && (
                    <div className="text-[11px] text-teal-800 bg-teal-50 p-2 rounded border border-teal-200">
                      ✓ Berhasil merender <strong>{pdfPageImages.length} halaman PDF</strong>. Halaman ini akan tampil nyata di lembar lampiran surat.
                    </div>
                  )}

                  {/* Opsi Tanpa Watermark / Tanda Mark Lampiran */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tanpaMark}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTanpaMark(checked);
                          syncToParent({ tanpa_mark: checked });
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Tanpa Watermark / Mark Lampiran
                        </span>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Centang opsi ini jika dokumen lampiran tidak perlu dibubuhi label Nomor &amp; Tanggal di pojok kanan atas.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tombol Hapus & Tutup Panel */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
            <div className="flex items-center space-x-2">
              {editingItemId && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItemId)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Hapus Lampiran
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={isProcessingFile}
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  activeColor === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : activeColor === 'indigo'
                    ? 'bg-indigo-700 hover:bg-indigo-800'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                Selesai / Tutup Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !isAdding && (
        <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
          <Paperclip className="w-6 h-6 mx-auto mb-1.5 opacity-60" />
          <p className="text-xs font-medium text-slate-600">Belum ada lampiran ditambahkan</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Klik tombol &quot;Tambah Lampiran&quot; untuk menyusun daftar undangan atau mengunggah berkas.
          </p>
        </div>
      )}
    </div>
  );
};
