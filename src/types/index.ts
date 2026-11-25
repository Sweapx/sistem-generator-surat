export type StatusPegawai = 'Aktif' | 'Cuti';

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  pangkat_golongan: string;
  jabatan: string;
  unit_kerja: string;
  status: StatusPegawai;
}

export interface Pejabat {
  id: string;
  nama: string;
  nip: string;
  pangkat_golongan: string;
  jabatan: string;
  is_default: boolean;
  sebagai: string; // e.g. "Kepala Pusat" atau "Ketua Tim ..."
}

export interface NomorSuratRecord {
  id: string;
  nomor_urut: number;
  tahun: number;
  bulan: string;
  nomor_lengkap: string;
  tanggal_dibuat: string;
  tanggal?: string;
  tanggal_surat?: string;
  perihal: string;
  dibuat_oleh: string;
  tujuan_lokasi: string;
  jumlah_pegawai: number;
  penandatangan_nama: string;
  dasar_surat: string;
  // Kolom register spreadsheet kantor:
  jenis?: string;
  jenis_naskah?: JenisNaskah;
  kode_klasifikasi?: string;
  kategori_klasifikasi?: 'FASILITATIF' | 'SUBSTANTIF';
  kepada?: string;
  status_ttd?: string;
  topik_tim?: string;
  konseptor?: string;
  status_surat?: string;
  link_word?: string;
  link_pdf?: string;
  drive_url?: string;
  drive_file_id?: string;
  drive_folder?: string;
  pdf_base64?: string;
  pdf_filename?: string;
  docx_base64?: string;
  docx_filename?: string;
  file_mime_type?: string;
  form_state?: SuratTugasFormState;
  pegawai_ids?: string[];
  pejabat_id?: string;
}

export interface GeneratedLampiranDraft {
  judul: string;
  sub_judul?: string;
  tipe_konten?: 'daftar_undangan' | 'tabel' | 'teks';
  isi: string;
  include_internal_pusaka?: boolean;
}

export interface EkstraksiUndangan {
  nama_acara: string;
  nomor_surat_undangan: string;
  instansi_pengundang: string;
  tanggal_surat_undangan?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  waktu_pelaksanaan?: string;
  hari_tanggal_pelaksanaan?: string;
  lokasi: string;
  kota_kegiatan: string;
  topik: string;
  perihal_undangan?: string;
  kriteria_peserta?: string;
  narasi_menimbang?: string;
  narasi_dasar?: string;
  narasi_untuk?: string;
  keterangan_tambahan?: string;
  pegawai_nama_list?: string[];
  lampiran_generated?: GeneratedLampiranDraft[];
}

export interface EkstraksiSuratUndangan {
  undangan_hal: string;
  undangan_agenda: string;
  hari_tanggal_pelaksanaan: string;
  undangan_waktu: string;
  undangan_tipe_tempat: 'hybrid' | 'offline' | 'online';
  undangan_tempat_offline?: string;
  undangan_tempat_online?: string;
  undangan_pembuka: string;
  undangan_kepada: string;
  undangan_sifat?: string;
  undangan_lampiran?: string;
  rekomendasi_kode_klasifikasi?: string;
  lampiran_generated?: GeneratedLampiranDraft[];
}

export interface EkstraksiNotaDinas {
  nota_hal: string;
  nota_kepada: string;
  nota_dari: string;
  nota_sifat: string;
  nota_lampiran?: string;
  nota_pembuka: string;
  nota_isi: string;
  nota_penutup: string;
  rekomendasi_kode_klasifikasi?: string;
  tipologi?: 'ND_SDM' | 'ND_KEBIJAKAN' | 'ND_ANGGARAN' | 'ND_KOORDINASI' | 'ND_FASILITAS';
  lampiran_generated?: GeneratedLampiranDraft[];
}

export type JenisNaskah = 'TUGAS' | 'UNDANGAN' | 'NOTA_DINAS';

export type KopSuratTipe = 'pusaka' | 'sekjen' | 'djed';

export interface KlasifikasiItem {
  kategori_utama: 'FASILITATIF' | 'SUBSTANTIF';
  kode_huruf: string;
  nama_kategori: string;
  kode_angka: string;
  nama_sub: string;
  sub_kode: string;
  kode_lengkap: string;
  uraian: string;
}

export interface SuratTugasFormState {
  // Jenis Naskah & Judul Kop Surat
  jenis_naskah?: JenisNaskah;
  kop_tipe?: KopSuratTipe;
  published_fingerprint?: string;
  published_nomor_lengkap?: string;

  // Klasifikasi Nomor Surat
  kode_klasifikasi?: string;
  kategori_klasifikasi?: 'FASILITATIF' | 'SUBSTANTIF';
  uraian_klasifikasi?: string;

  // Nomor & Tanggal
  nomor_urut?: number;
  tahun: number;
  bulan: string;
  nomor_lengkap: string;
  tanggal_surat: string;
  kota_surat: string;

  // ─── Bidang Khusus SURAT TUGAS ─────────────────────────────────────────
  nama_acara: string;
  nomor_surat_undangan: string;
  tanggal_surat_undangan: string;
  instansi_pengundang: string;
  perihal_undangan: string;

  // Waktu & Tempat Tugas
  tanggal_mulai: string;
  tanggal_selesai: string;
  waktu_kegiatan: string;
  hari_tanggal_pelaksanaan?: string;
  lokasi_kegiatan: string;
  kota_kegiatan: string;
  tujuan_tugas: string;
  pembebanan_anggaran: string;
  sertakan_beban_anggaran?: boolean; // opsi mencantumkan klausul pembebanan anggaran

  // Personil & Pejabat
  selectedPegawaiIds: string[];
  selectedPejabatId: string;
  kriteria_peserta?: string;

  // Narasi Surat Langsung Diedit (Custom Narration Surat Tugas)
  menimbang_custom?: string;
  dasar_custom?: string;
  untuk_custom?: string;
  penutup_custom?: string;

  // ─── Bidang Khusus SURAT UNDANGAN ──────────────────────────────────────
  undangan_sifat?: string; // 'Biasa' | 'Segera' | 'Penting'
  undangan_lampiran?: string; // '1 (satu) berkas' | '-'
  undangan_hal?: string; // 'Undangan'
  undangan_kepada?: string; // '(Daftar Terlampir)\ndi Jakarta'
  undangan_pembuka?: string; // Paragraf pembuka
  undangan_hari_tanggal?: string; // 'Rabu, 18 Februari 2026'
  undangan_waktu?: string; // '09.30 WIB s.d. selesai'
  undangan_tipe_tempat?: 'offline' | 'online' | 'hybrid';
  undangan_tempat_offline?: string; // 'Ruang Rapat Pusat Kebijakan Strategis...'
  undangan_tempat_online?: string; // 'https://s.komdigi.go.id/...'
  undangan_tempat_online_custom?: string; // Teks baris tempat online hasil edit langsung di kanvas kertas
  undangan_tempat_offline_custom?: string; // Teks baris tempat offline hasil edit langsung di kanvas kertas
  undangan_agenda?: string; // 'Pembahasan dan Asistensi...'
  undangan_penutup?: string; // Paragraf penutup
  undangan_meeting_id?: string; // '890 1234 5678'
  undangan_passcode?: string; // 'KOMDIGI2026'
  undangan_tembusan?: string; // Tembusan jika ada

  // ─── Bidang Khusus NOTA DINAS ──────────────────────────────────────────
  nota_kepada?: string; // 'Sekretaris Jenderal'
  nota_dari?: string; // 'Kepala Pusat Kebijakan Strategis'
  nota_hal?: string; // 'Penyampaian Usulan ...'
  nota_sifat?: string; // 'Biasa' | 'Segera'
  nota_lampiran?: string; // '-' | '1 Berkas'
  nota_pembuka?: string; // Paragraf pembuka tindak lanjut
  nota_isi?: string; // Substansi poin / narasi
  nota_penutup?: string; // Paragraf penutup ucapan terima kasih
  nota_tembusan?: string; // Catatan tembusan jika ada

  // Konseptor & Tanda Tangan
  konseptor: string;
  ttd_image?: string;
  custom_jabatan_ttd?: string;
  custom_nama_ttd?: string;
  custom_tanggal_surat_text?: string;
  custom_kalimat_penutup_tugas?: string;
  custom_kepada_tugas?: string;
  custom_pegawai_overrides?: Record<string, Partial<Pegawai>>;

  // Lampiran Tambahan per jenis naskah (terpisah agar tidak saling kontaminasi antar tab)
  lampiran_items?: LampiranItem[];          // backward compat / Surat Tugas
  undangan_lampiran_items?: LampiranItem[]; // khusus Surat Undangan
  nota_lampiran_items?: LampiranItem[];     // khusus Nota Dinas
}

export interface LampiranItem {
  id: string;
  tipe: 'buat' | 'upload';
  label_mark?: string; // e.g. "Lampiran I", "Lampiran II", "Lampiran III", dst.
  judul?: string; // e.g. "DAFTAR UNDANGAN", "SUSUNAN ACARA / RUNDOWN"
  sub_judul?: string; // Sub judul persis di bawah judul lampiran
  isi?: string; // Isi lampiran (daftar nama, tabel, atau narasi)
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_data?: string; // Base64 data URL
  pdf_pages_images?: string[]; // rendered PDF page images (Data URL)
  extracted_text?: string; // extracted text from docx/pdf
  tanpa_mark?: boolean; // opsi tanpa watermark / mark lampiran (khusus upload dokumen)
}

export interface SampleInvitation {
  id: string;
  title: string;
  instansi: string;
  category: string;
  rawText: string;
  mockExtraction: EkstraksiUndangan;
}

// ─── Authentication & User Management ───────────────────────────────
export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  nip?: string;
  role: UserRole;
  unit_kerja?: string;
  status: 'Aktif' | 'Nonaktif';
  created_at?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}
