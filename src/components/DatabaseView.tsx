import React, { useState, useMemo } from 'react';
import {
  Hash,
  Users,
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  UserPlus,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Globe,
  FileDown,
} from 'lucide-react';
import { Pegawai, Pejabat, NomorSuratRecord, StatusPegawai, User } from '../types';

interface DatabaseViewProps {
  pegawaiList: Pegawai[];
  pejabatList: Pejabat[];
  nomorSuratList: NomorSuratRecord[];
  onAddPegawai: (pegawai: Pegawai) => void;
  onUpdatePegawai: (pegawai: Pegawai) => void;
  onDeletePegawai: (id: string) => void;
  onToggleStatusPegawai: (id: string) => void;
  onAddPejabat: (pejabat: Pejabat) => void;
  onUpdatePejabat: (pejabat: Pejabat) => void;
  onDeletePejabat: (id: string) => void;
  onSetDefaultPejabat: (id: string) => void;
  onUpdateNomorSurat?: (record: NomorSuratRecord) => void;
  onEditSurat?: (record: NomorSuratRecord) => void;
  currentUser?: User | null;
  usersList?: User[];
  onAddUser?: (user: Partial<User>) => void;
  onUpdateUser?: (user: Partial<User>) => void;
  onDeleteUser?: (id: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  pegawaiList,
  pejabatList,
  nomorSuratList,
  onAddPegawai,
  onUpdatePegawai,
  onDeletePegawai,
  onToggleStatusPegawai,
  onAddPejabat,
  onUpdatePejabat,
  onDeletePejabat,
  onSetDefaultPejabat,
  onUpdateNomorSurat,
  onEditSurat,
  currentUser,
  usersList = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [subTab, setSubTab] = useState<'nomor' | 'kepegawaian' | 'pejabat' | 'pengguna'>('nomor');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Akses Berkas TTE PDF ───────────────────────────────────────────
  const [selectedPdfRecord, setSelectedPdfRecord] = useState<NomorSuratRecord | null>(null);
  const [editingPdfUrl, setEditingPdfUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleOpenPdfModal = (rec: NomorSuratRecord) => {
    setSelectedPdfRecord(rec);
    setEditingPdfUrl(rec.link_pdf || '');
    setCopiedLink(false);
  };

  const handleSavePdfUrl = () => {
    if (selectedPdfRecord && onUpdateNomorSurat) {
      const updated = { ...selectedPdfRecord, link_pdf: editingPdfUrl.trim() };
      onUpdateNomorSurat(updated);
      setSelectedPdfRecord(updated);
      alert('Tautan berkas TTE PDF berhasil disimpan!');
    }
  };

  const handleCopyLink = () => {
    if (editingPdfUrl) {
      navigator.clipboard.writeText(editingPdfUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatDisplayDate = (val?: string) => {
    if (!val || val.trim() === '') return '-';
    const trimmed = val.trim();
    // Jika sudah berupa tanggal dan bulan saja (misal: "29 September")
    if (/^\d{1,2}\s+[a-zA-Z]+$/.test(trimmed)) return trimmed;
    // Jika format memiliki tahun (misal: "13 Oktober 2026")
    const matchIndo = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)(?:\s+\d{4})?$/);
    if (matchIndo) return `${matchIndo[1]} ${matchIndo[2]}`;

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const bulanIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${d.getDate()} ${bulanIndo[d.getMonth()]}`;
    }
    return trimmed;
  };

  // ─── Filter States untuk Arsip Nomor Surat ─────────────────────────────────
  const [filterTahun, setFilterTahun] = useState<string>('Semua');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [filterStatusTTD, setFilterStatusTTD] = useState<string>('Semua');
  const [filterTopik, setFilterTopik] = useState<string>('Semua');
  const [filterStatusSurat, setFilterStatusSurat] = useState<string>('Semua');

  // Pagination Arsip
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const rowsPerPage = 25;

  React.useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);

  // ─── Modal States CRUD Pegawai ─────────────────────────────────────────────
  const [isAddPegawaiOpen, setIsAddPegawaiOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [pegForm, setPegForm] = useState<Omit<Pegawai, 'id'>>({
    nama: '',
    nip: '',
    pangkat_golongan: 'Penata Muda / III/a',
    jabatan: 'Analis Kebijakan Ahli Pertama',
    unit_kerja: 'Pusat Kebijakan Strategis',
    status: 'Aktif',
  });

  // ─── Modal States CRUD Pejabat ─────────────────────────────────────────────
  const [isAddPejabatOpen, setIsAddPejabatOpen] = useState(false);
  const [editingPejabat, setEditingPejabat] = useState<Pejabat | null>(null);
  const [pejForm, setPejForm] = useState<Omit<Pejabat, 'id'>>({
    nama: '',
    nip: '',
    pangkat_golongan: 'Pembina Utama Muda / IV/c',
    jabatan: 'Kepala Pusat Kebijakan Strategis',
    sebagai: 'Kepala Pusat',
    is_default: false,
  });

  // ─── Modal States CRUD Pengguna ───────────────────────────────────────────
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    username: string;
    password: string;
    nama: string;
    nip: string;
    role: 'admin' | 'staff';
    unit_kerja: string;
    status: 'Aktif' | 'Nonaktif';
  }>({
    username: '',
    password: '',
    nama: '',
    nip: '',
    role: 'staff',
    unit_kerja: 'Pusat Kebijakan Strategis',
    status: 'Aktif',
  });

  const handleOpenAddUser = () => {
    setUserForm({
      username: '',
      password: '',
      nama: '',
      nip: '',
      role: 'staff',
      unit_kerja: 'Pusat Kebijakan Strategis',
      status: 'Aktif',
    });
    setEditingUser(null);
    setIsAddUserOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: u.password || '',
      nama: u.nama,
      nip: u.nip || '',
      role: u.role,
      unit_kerja: u.unit_kerja || 'Pusat Kebijakan Strategis',
      status: u.status,
    });
    setIsAddUserOpen(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && onUpdateUser) {
      onUpdateUser({
        ...editingUser,
        ...userForm,
      });
      setEditingUser(null);
    } else if (onAddUser) {
      onAddUser({
        ...userForm,
        id: `user-${Date.now()}`,
      });
      setIsAddUserOpen(false);
    }
  };

  const handleDeleteUserConfirm = (id: string, username: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${username}"?`)) {
      if (onDeleteUser) onDeleteUser(id);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return usersList;
    const q = searchQuery.toLowerCase();
    return usersList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nama.toLowerCase().includes(q) ||
        (u.nip && u.nip.includes(q)) ||
        (u.unit_kerja && u.unit_kerja.toLowerCase().includes(q))
    );
  }, [usersList, searchQuery]);

  // ─── Options Filter Unik dari Data ─────────────────────────────────────────
  const tahunOptions = useMemo(() => {
    const set = new Set<string>();
    nomorSuratList.forEach((n) => {
      if (n.tahun) set.add(String(n.tahun));
    });
    return ['Semua', ...Array.from(set).sort().reverse()];
  }, [nomorSuratList]);

  const jenisOptions = useMemo(() => {
    const set = new Set<string>();
    nomorSuratList.forEach((n) => {
      if (n.jenis && n.jenis.trim()) set.add(n.jenis.trim().toUpperCase());
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [nomorSuratList]);

  const statusTTDOptions = useMemo(() => {
    const set = new Set<string>();
    nomorSuratList.forEach((n) => {
      if (n.status_ttd && n.status_ttd.trim()) set.add(n.status_ttd.trim());
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [nomorSuratList]);

  const topikOptions = useMemo(() => {
    const set = new Set<string>();
    nomorSuratList.forEach((n) => {
      if (n.topik_tim && n.topik_tim.trim()) set.add(n.topik_tim.trim().toUpperCase());
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [nomorSuratList]);

  const statusSuratOptions = useMemo(() => {
    const set = new Set<string>();
    nomorSuratList.forEach((n) => {
      if (n.status_surat && n.status_surat.trim()) set.add(n.status_surat.trim().toUpperCase());
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [nomorSuratList]);

  // ─── Filtered Data Arsip Nomor Surat ───────────────────────────────────────
  const filteredNomor = useMemo(() => {
    const filtered = nomorSuratList.filter((rec) => {
      // Filter Tahun
      if (filterTahun !== 'Semua' && String(rec.tahun) !== filterTahun) return false;

      // Filter Jenis
      if (
        filterJenis !== 'Semua' &&
        (rec.jenis || '').trim().toUpperCase() !== filterJenis.toUpperCase()
      )
        return false;

      // Filter Status TTD
      if (
        filterStatusTTD !== 'Semua' &&
        (rec.status_ttd || '').trim().toLowerCase() !== filterStatusTTD.toLowerCase()
      )
        return false;

      // Filter Topik Tim
      if (
        filterTopik !== 'Semua' &&
        (rec.topik_tim || '').trim().toUpperCase() !== filterTopik.toUpperCase()
      )
        return false;

      // Filter Status Surat
      if (
        filterStatusSurat !== 'Semua' &&
        (rec.status_surat || '').trim().toUpperCase() !== filterStatusSurat.toUpperCase()
      )
        return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = String(rec.nomor_urut).includes(q) || (rec.nomor_lengkap || '').toLowerCase().includes(q);
        const matchPerihal = (rec.perihal || '').toLowerCase().includes(q);
        const matchKepada = (rec.kepada || '').toLowerCase().includes(q);
        const matchKonseptor = (rec.konseptor || '').toLowerCase().includes(q);
        return matchNo || matchPerihal || matchKepada || matchKonseptor;
      }

      return true;
    });

    // Urutkan selalu dari data / nomor surat terbaru (list terbaru di urutan teratas)
    return filtered.sort((a: NomorSuratRecord, b: NomorSuratRecord) => {
      const noA = typeof a.nomor_urut === 'number' ? a.nomor_urut : parseInt(String(a.nomor_urut || '0').replace(/\D/g, ''), 10) || 0;
      const noB = typeof b.nomor_urut === 'number' ? b.nomor_urut : parseInt(String(b.nomor_urut || '0').replace(/\D/g, ''), 10) || 0;
      if (noA !== noB) {
        return noB - noA; // Nomor terbesar / terbaru di atas
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [
    nomorSuratList,
    filterTahun,
    filterJenis,
    filterStatusTTD,
    filterTopik,
    filterStatusSurat,
    searchQuery,
  ]);

  // Paginated Nomor
  const totalPages = Math.ceil(filteredNomor.length / rowsPerPage) || 1;
  const paginatedNomor = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredNomor.slice(start, start + rowsPerPage);
  }, [filteredNomor, currentPage, rowsPerPage]);

  // ─── Filtered Pegawai ──────────────────────────────────────────────────────
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.nama.toLowerCase().includes(q) ||
        p.nip.includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.pangkat_golongan.toLowerCase().includes(q)
      );
    });
  }, [pegawaiList, searchQuery]);

  // ─── Filtered Pejabat ──────────────────────────────────────────────────────
  const filteredPejabat = useMemo(() => {
    return pejabatList.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.nama.toLowerCase().includes(q) ||
        p.nip.includes(q) ||
        p.jabatan.toLowerCase().includes(q)
      );
    });
  }, [pejabatList, searchQuery]);

  // ─── Handlers CRUD Pegawai ─────────────────────────────────────────────────
  const handleOpenAddPegawai = () => {
    setPegForm({
      nama: '',
      nip: '',
      pangkat_golongan: 'Penata Muda / III/a',
      jabatan: 'Analis Kebijakan Ahli Pertama',
      unit_kerja: 'Pusat Kebijakan Strategis',
      status: 'Aktif',
    });
    setIsAddPegawaiOpen(true);
  };

  const handleOpenEditPegawai = (peg: Pegawai) => {
    setEditingPegawai(peg);
    setPegForm({
      nama: peg.nama,
      nip: peg.nip,
      pangkat_golongan: peg.pangkat_golongan,
      jabatan: peg.jabatan,
      unit_kerja: peg.unit_kerja,
      status: peg.status,
    });
  };

  const handleSavePegawai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pegForm.nama.trim() || !pegForm.nip.trim()) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }

    if (editingPegawai) {
      onUpdatePegawai({
        ...editingPegawai,
        ...pegForm,
      });
      setEditingPegawai(null);
    } else {
      const newPeg: Pegawai = {
        id: `peg-${Date.now()}`,
        ...pegForm,
      };
      onAddPegawai(newPeg);
      setIsAddPegawaiOpen(false);
    }
  };

  const handleDeletePegawaiConfirm = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pegawai "${nama}"?`)) {
      onDeletePegawai(id);
    }
  };

  // ─── Handlers CRUD Pejabat ─────────────────────────────────────────────────
  const handleOpenAddPejabat = () => {
    setPejForm({
      nama: '',
      nip: '',
      pangkat_golongan: 'Pembina Tk. I / IV/b',
      jabatan: 'Plh. Kepala Pusat Kebijakan Strategis',
      sebagai: 'Plh. Kapus',
      is_default: false,
    });
    setIsAddPejabatOpen(true);
  };

  const handleOpenEditPejabat = (pej: Pejabat) => {
    setEditingPejabat(pej);
    setPejForm({
      nama: pej.nama,
      nip: pej.nip,
      pangkat_golongan: pej.pangkat_golongan,
      jabatan: pej.jabatan,
      sebagai: pej.sebagai,
      is_default: pej.is_default,
    });
  };

  const handleSavePejabat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pejForm.nama.trim()) {
      alert('Nama pejabat wajib diisi.');
      return;
    }

    if (editingPejabat) {
      onUpdatePejabat({
        ...editingPejabat,
        ...pejForm,
      });
      setEditingPejabat(null);
    } else {
      const newPej: Pejabat = {
        id: `pej-${Date.now()}`,
        ...pejForm,
      };
      onAddPejabat(newPej);
      setIsAddPejabatOpen(false);
    }
  };

  const handleDeletePejabatConfirm = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pejabat "${nama}"?`)) {
      onDeletePejabat(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Sub-Tab Navigation & Search ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setSubTab('nomor');
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'nomor'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-teal-700" />
            <span>Arsip Nomor Surat (Sheets)</span>
            <span className="text-[11px] text-slate-500 font-mono font-semibold ml-1">
              ({nomorSuratList.length})
            </span>
          </button>

          <button
            onClick={() => setSubTab('kepegawaian')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'kepegawaian'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>Data Pegawai Pusaka</span>
            <span className="text-[11px] text-slate-500 font-mono font-semibold ml-1">
              ({pegawaiList.length})
            </span>
          </button>

          <button
            onClick={() => setSubTab('pejabat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'pejabat'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Pejabat Penandatangan</span>
            <span className="text-[11px] text-slate-500 font-mono font-semibold ml-1">
              ({pejabatList.length})
            </span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setSubTab('pengguna')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                subTab === 'pengguna'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kelola Akun Pengguna</span>
              <span className="text-[11px] text-slate-500 font-mono font-semibold ml-1">
                ({usersList.length})
              </span>
            </button>
          )}
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              subTab === 'nomor'
                ? 'Cari nomor, perihal, kepada, konseptor...'
                : subTab === 'pengguna'
                ? 'Cari nama, username, NIP...'
                : 'Cari nama, NIP, jabatan...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          1. SUBTAB: ARSIP NOMOR SURAT (SESUAI SPREADSHEET KANTOR)
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'nomor' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-2">
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              <span>Filter Data Arsip:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {/* Filter Tahun */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Tahun:
                </label>
                <select
                  value={filterTahun}
                  onChange={(e) => {
                    setFilterTahun(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {tahunOptions.map((th) => (
                    <option key={th} value={th}>
                      {th}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Jenis Surat:
                </label>
                <select
                  value={filterJenis}
                  onChange={(e) => {
                    setFilterJenis(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {jenisOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status TTD */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Status TTD:
                </label>
                <select
                  value={filterStatusTTD}
                  onChange={(e) => {
                    setFilterStatusTTD(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {statusTTDOptions.map((ttd) => (
                    <option key={ttd} value={ttd}>
                      {ttd}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Topik Tim */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Topik Tim:
                </label>
                <select
                  value={filterTopik}
                  onChange={(e) => {
                    setFilterTopik(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {topikOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status Surat */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Status Surat:
                </label>
                <select
                  value={filterStatusSurat}
                  onChange={(e) => {
                    setFilterStatusSurat(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {statusSuratOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info Jumlah Hasil */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div>
              Menampilkan <strong>{filteredNomor.length}</strong> data surat
              {(filterTahun !== 'Semua' || filterJenis !== 'Semua' || filterStatusTTD !== 'Semua' || filterTopik !== 'Semua' || filterStatusSurat !== 'Semua' || searchQuery) && (
                <span className="text-teal-700 ml-1.5 font-medium">(Terfilter)</span>
              )}
            </div>
            <div className="text-[11px]">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>

          {/* Tabel Register Spreadsheet Kantor */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">NOMOR</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">TANGGAL</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">JENIS</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">KEPADA</th>
                    <th className="py-2.5 px-3 min-w-[240px]">HAL + TANGGAL UNDANGAN</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">STATUS TTD</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">TOPIK TIM</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">KONSEPTOR</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">STATUS SURAT</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {paginatedNomor.map((rec: NomorSuratRecord) => (
                    <tr key={rec.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rec.nomor_urut || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {formatDisplayDate(rec.tanggal_dibuat || rec.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          rec.jenis === 'ST'
                            ? 'bg-teal-100 text-teal-800'
                            : rec.jenis === 'ND'
                            ? 'bg-blue-100 text-blue-800'
                            : rec.jenis === 'UND'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.jenis || 'ST'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate" title={rec.kepada || ''}>
                        {rec.kepada || '-'}
                      </td>
                      <td className="py-2.5 px-3 max-w-[300px] text-slate-800 font-medium" title={rec.perihal}>
                        {rec.perihal || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {rec.status_ttd || 'Kapus'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {rec.topik_tim || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {rec.konseptor || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                            (rec.status_surat || '').toUpperCase() === 'OK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rec.status_surat || 'OK'}
                          </span>
                          {rec.drive_url && (
                            <a
                              href={rec.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-semibold inline-flex items-center space-x-1 transition-colors"
                              title="Buka berkas PDF di Google Drive"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>PDF Drive</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        {onEditSurat && (
                          <button
                            onClick={() => onEditSurat(rec)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer shadow-xs"
                            title="Edit dokumen surat tugas ini di Generator"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedNomor.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada data surat yang sesuai dengan filter atau kata kunci pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded font-medium disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center space-x-2 text-slate-700">
                  <span className="text-slate-500 font-medium">Halaman</span>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const p = parseInt(jumpPageInput, 10);
                          if (!isNaN(p) && p >= 1 && p <= totalPages) {
                            setCurrentPage(p);
                          } else {
                            setJumpPageInput(String(currentPage));
                          }
                        }
                      }}
                      onBlur={() => {
                        const p = parseInt(jumpPageInput, 10);
                        if (!isNaN(p) && p >= 1 && p <= totalPages) {
                          setCurrentPage(p);
                        } else {
                          setJumpPageInput(String(currentPage));
                        }
                      }}
                      className="w-16 text-center py-1 px-2 bg-white border border-teal-500 rounded font-bold text-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 text-xs shadow-2xs"
                      title="Ketik nomor halaman lalu tekan Enter atau klik Buka"
                    />
                    <span className="text-slate-500 font-medium">dari <strong>{totalPages}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const p = parseInt(jumpPageInput, 10);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                      } else {
                        setJumpPageInput(String(currentPage));
                      }
                    }}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    Buka
                  </button>
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded font-medium disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. SUBTAB: DATA KEPEGAWAIAN (FULL CRUD)
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'kepegawaian' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Database Pegawai Pusat Kebijakan Strategis (PUSAKA)</h4>
              <p className="text-[11px] text-slate-500">
                Data pegawai digunakan untuk pemilihan personil Surat Tugas secara otomatis.
              </p>
            </div>
            <button
              onClick={handleOpenAddPegawai}
              className="flex items-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Pegawai Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-3">NO</th>
                    <th className="py-2.5 px-3">NAMA LENGKAP</th>
                    <th className="py-2.5 px-3">NIP</th>
                    <th className="py-2.5 px-3">PANGKAT, GOL/RUANG</th>
                    <th className="py-2.5 px-3">JABATAN</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredPegawai.map((peg, index) => (
                    <tr key={peg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{peg.nama}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{peg.nip}</td>
                      <td className="py-2.5 px-3">{peg.pangkat_golongan}</td>
                      <td className="py-2.5 px-3">{peg.jabatan}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onToggleStatusPegawai(peg.id)}
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold cursor-pointer ${
                            peg.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Klik untuk ubah status Aktif / Cuti"
                        >
                          {peg.status}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditPegawai(peg)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                            title="Edit Data Pegawai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePegawaiConfirm(peg.id, peg.nama)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPegawai.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data pegawai yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3. SUBTAB: PEJABAT PENANDATANGAN (FULL CRUD)
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'pejabat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Pejabat Penandatangan Surat Tugas</h4>
              <p className="text-[11px] text-slate-500">
                Pilih atau kelola pejabat penandatangan utama (Kapus / Plh. Kapus / Kasubag TU).
              </p>
            </div>
            <button
              onClick={handleOpenAddPejabat}
              className="flex items-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pejabat</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-3">STATUS DEFAULT</th>
                    <th className="py-2.5 px-3">NAMA PEJABAT</th>
                    <th className="py-2.5 px-3">NIP</th>
                    <th className="py-2.5 px-3">PANGKAT, GOL/RUANG</th>
                    <th className="py-2.5 px-3">JABATAN</th>
                    <th className="py-2.5 px-3">SEBAGAI</th>
                    <th className="py-2.5 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredPejabat.map((pej) => (
                    <tr key={pej.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {pej.is_default ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Utama (Default)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onSetDefaultPejabat(pej.id)}
                            className="text-[11px] text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                          >
                            Set Jadi Utama
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{pej.nama}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{pej.nip}</td>
                      <td className="py-2.5 px-3">{pej.pangkat_golongan}</td>
                      <td className="py-2.5 px-3">{pej.jabatan}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {pej.sebagai || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditPejabat(pej)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                            title="Edit Pejabat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePejabatConfirm(pej.id, pej.nama)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Pejabat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. SUBTAB: KELOLA AKUN PENGGUNA (HANYA ADMIN TU)
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'pengguna' && currentUser?.role === 'admin' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Daftar Akun Pengguna Sistem</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun staf Tata Usaha dan konseptor yang berwenang mengakses aplikasi di Vercel.
              </p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-3">USERNAME</th>
                    <th className="py-2.5 px-3">NAMA LENGKAP</th>
                    <th className="py-2.5 px-3">NIP</th>
                    <th className="py-2.5 px-3">ROLE (PERAN)</th>
                    <th className="py-2.5 px-3">UNIT KERJA</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                        @{u.username}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{u.nama}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{u.nip || '-'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin TU' : 'Staf Konseptor'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{u.unit_kerja || 'Pusat Kebijakan Strategis'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Aktif'
                              ? 'bg-teal-50 text-teal-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                            title="Edit Akun & Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'admin_tu' && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUserConfirm(u.id, u.username)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data akun pengguna yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL TAMBAH / EDIT PEGAWAI
      ══════════════════════════════════════════════════════════════════════ */}
      {(isAddPegawaiOpen || editingPegawai) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddPegawaiOpen(false);
                  setEditingPegawai(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePegawai} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap (beserta gelar):</label>
                <input
                  type="text"
                  required
                  value={pegForm.nama}
                  onChange={(e) => setPegForm({ ...pegForm, nama: e.target.value })}
                  placeholder="Contoh: Dr. Budi Santoso, S.Kom., M.T."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP (Nomor Induk Pegawai):</label>
                <input
                  type="text"
                  required
                  value={pegForm.nip}
                  onChange={(e) => setPegForm({ ...pegForm, nip: e.target.value })}
                  placeholder="Contoh: 19850101 201001 1 001"
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pangkat, Golongan/Ruang:</label>
                <input
                  type="text"
                  required
                  value={pegForm.pangkat_golongan}
                  onChange={(e) => setPegForm({ ...pegForm, pangkat_golongan: e.target.value })}
                  placeholder="Contoh: Penata Tingkat I / III/d"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan:</label>
                <input
                  type="text"
                  required
                  value={pegForm.jabatan}
                  onChange={(e) => setPegForm({ ...pegForm, jabatan: e.target.value })}
                  placeholder="Contoh: Analis Kebijakan Ahli Muda"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Kerja:</label>
                <input
                  type="text"
                  value={pegForm.unit_kerja}
                  onChange={(e) => setPegForm({ ...pegForm, unit_kerja: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status:</label>
                <select
                  value={pegForm.status}
                  onChange={(e) => setPegForm({ ...pegForm, status: e.target.value as StatusPegawai })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPegawaiOpen(false);
                    setEditingPegawai(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded font-semibold shadow-xs cursor-pointer"
                >
                  {editingPegawai ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL TAMBAH / EDIT PEJABAT
      ══════════════════════════════════════════════════════════════════════ */}
      {(isAddPejabatOpen || editingPejabat) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPejabat ? 'Edit Data Pejabat' : 'Tambah Pejabat Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddPejabatOpen(false);
                  setEditingPejabat(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePejabat} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pejabat:</label>
                <input
                  type="text"
                  required
                  value={pejForm.nama}
                  onChange={(e) => setPejForm({ ...pejForm, nama: e.target.value })}
                  placeholder="Contoh: Oki Suryowahono, S.Kom., M.T."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Pejabat:</label>
                <input
                  type="text"
                  required
                  value={pejForm.nip}
                  onChange={(e) => setPejForm({ ...pejForm, nip: e.target.value })}
                  placeholder="Contoh: 19780512 200212 1 002"
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pangkat, Golongan/Ruang:</label>
                <input
                  type="text"
                  required
                  value={pejForm.pangkat_golongan}
                  onChange={(e) => setPejForm({ ...pejForm, pangkat_golongan: e.target.value })}
                  placeholder="Contoh: Pembina Utama Muda / IV/c"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan Tanda Tangan:</label>
                <input
                  type="text"
                  required
                  value={pejForm.jabatan}
                  onChange={(e) => setPejForm({ ...pejForm, jabatan: e.target.value })}
                  placeholder="Contoh: Kepala Pusat Kebijakan Strategis"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sebagai (Singkatan):</label>
                <input
                  type="text"
                  required
                  value={pejForm.sebagai}
                  onChange={(e) => setPejForm({ ...pejForm, sebagai: e.target.value })}
                  placeholder="Contoh: Kapus / Plh. Kapus / Kasubag TU"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={pejForm.is_default}
                  onChange={(e) => setPejForm({ ...pejForm, is_default: e.target.checked })}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <label htmlFor="chkDefault" className="text-slate-700 font-medium">
                  Jadikan Pejabat Utama Default
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPejabatOpen(false);
                    setEditingPejabat(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded font-semibold shadow-xs cursor-pointer"
                >
                  {editingPejabat ? 'Simpan Perubahan' : 'Tambah Pejabat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL TAMBAH / EDIT PENGGUNA
      ══════════════════════════════════════════════════════════════════════ */}
      {(isAddUserOpen || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUser ? `Edit Akun: ${editingUser.username}` : 'Tambah Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddUserOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    disabled={editingUser?.username === 'admin_tu'}
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="misal: nama_user"
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingUser ? 'Password Baru:' : 'Password:'}
                  </label>
                  <input
                    type="text"
                    required={!editingUser}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? 'Kosongkan jika tak diubah' : 'Password...'}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap &amp; Gelar:</label>
                <input
                  type="text"
                  required
                  value={userForm.nama}
                  onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })}
                  placeholder="Contoh: Yuliano Christoper, S.Tr.Kom."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP (Nomor Induk Pegawai):</label>
                <input
                  type="text"
                  value={userForm.nip}
                  onChange={(e) => setUserForm({ ...userForm, nip: e.target.value })}
                  placeholder="Contoh: 19980101 202201 1 001"
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran Akses:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'staff' })}
                    disabled={editingUser?.username === 'admin_tu'}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100"
                  >
                    <option value="staff">Staf Konseptor</option>
                    <option value="admin">Admin TU (Superuser)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun:</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                    disabled={editingUser?.username === 'admin_tu'}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Kerja:</label>
                <input
                  type="text"
                  value={userForm.unit_kerja}
                  onChange={(e) => setUserForm({ ...userForm, unit_kerja: e.target.value })}
                  placeholder="Pusat Kebijakan Strategis"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded font-semibold shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Akses Berkas TTE PDF ──────────────────────────────────────── */}
      {selectedPdfRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Akses Berkas TTE PDF &amp; Surat Tugas
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Nomor: {selectedPdfRecord.nomor_lengkap}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPdfRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Ringkasan Dokumen */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">Perihal / Kegiatan:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedPdfRecord.perihal}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 gap-2">
                  <span className="text-slate-500 shrink-0">Dasar Undangan:</span>
                  <span className="text-slate-800 text-right font-medium truncate">{selectedPdfRecord.dasar_surat}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Pegawai Ditugaskan:</span>
                  <span className="text-slate-800 font-semibold">{selectedPdfRecord.kepada} ({selectedPdfRecord.jumlah_pegawai} Orang)</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Pejabat Penandatangan:</span>
                  <span className="text-slate-800 font-medium">{selectedPdfRecord.penandatangan_nama} ({selectedPdfRecord.status_ttd || 'Kapus'})</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Konseptor:</span>
                  <span className="text-teal-800 font-semibold">{selectedPdfRecord.konseptor || selectedPdfRecord.dibuat_oleh || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Tanggal Dibuat:</span>
                  <span className="text-slate-800">{selectedPdfRecord.tanggal_dibuat}</span>
                </div>
              </div>

              {/* Status Tautan Berkas TTE */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Tautan / Nama Berkas TTE PDF:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingPdfUrl}
                    onChange={(e) => setEditingPdfUrl(e.target.value)}
                    placeholder="Masukkan URL Google Drive, Srikandi, atau nama berkas PDF..."
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 flex items-center space-x-1 cursor-pointer shrink-0"
                    title="Salin tautan berkas"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Anda dapat menempelkan link Google Drive berkas TTE yang sudah ditandatangani secara elektronik atau nama file PDF.
                </p>
              </div>

              {/* Tombol Aksi Tautan */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {(editingPdfUrl.startsWith('http://') || editingPdfUrl.startsWith('https://')) ? (
                  <a
                    href={editingPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-1.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2 px-3 rounded-md shadow-xs cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Tautan Berkas TTE (Tab Baru)</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Berkas PDF '${editingPdfUrl}' tersimpan di arsip digital Surat Tugas Pusaka.`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md shadow-xs cursor-pointer text-center"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Arsip Dokumen: {editingPdfUrl}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSavePdfUrl}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Link</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPdfRecord(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
