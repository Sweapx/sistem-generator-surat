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
  kepada?: string;
  status_ttd?: string;
  topik_tim?: string;
  konseptor?: string;
  status_surat?: string;
  link_word?: string;
  link_pdf?: string;
  drive_url?: string;
  drive_folder?: string;
  pdf_base64?: string;
  pdf_filename?: string;
  form_state?: SuratTugasFormState;
  pegawai_ids?: string[];
  pejabat_id?: string;
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
}

export interface SuratTugasFormState {
  // Nomor & Tanggal
  nomor_urut?: number;
  tahun: number;
  bulan: string;
  nomor_lengkap: string;
  tanggal_surat: string;
  kota_surat: string;

  // Dasar Acara
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

  // Personil & Pejabat
  selectedPegawaiIds: string[];
  selectedPejabatId: string;
  kriteria_peserta?: string;

  // Konseptor & Tanda Tangan
  konseptor: string;
  ttd_image?: string;

  // Narasi Surat Langsung Diedit (Custom Narration)
  menimbang_custom?: string;
  dasar_custom?: string;
  untuk_custom?: string;
  penutup_custom?: string;
}

export interface SampleInvitation {
  id: string;
  title: string;
  instansi: string;
  category: string;
  rawText: string;
  mockExtraction: EkstraksiUndangan;
}
