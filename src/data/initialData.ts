import { Pegawai, Pejabat, NomorSuratRecord, SampleInvitation } from '../types';

export const INITIAL_PEGAWAI: Pegawai[] = [
  {
    "id": "peg-1",
    "nama": "Oki Suryowahono",
    "nip": "197909072008031001",
    "pangkat_golongan": "Pembina Tingkat I (IV/c)",
    "jabatan": "Kepala Pusat Kebijakan Strategis",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-2",
    "nama": "Asriani Sri Wahyuni",
    "nip": "197707312011012003",
    "pangkat_golongan": "Pembina (IV/a)",
    "jabatan": "Analis Kebijakan Ahli Muda",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-3",
    "nama": "Dyah Purwaningrum",
    "nip": "197711122006042032",
    "pangkat_golongan": "Pembina Tingkat I (IV/b)",
    "jabatan": "Analis Anggaran Ahli Madya",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-4",
    "nama": "Septa Dewi Anggraeni",
    "nip": "198109082009122001",
    "pangkat_golongan": "Pembina (IV/a)",
    "jabatan": "Pranata Hubungan Masyarakat Ahli Madya",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-5",
    "nama": "Achmad Yansyuru",
    "nip": "198504012011011011",
    "pangkat_golongan": "Penata Tingkat I (III/d)",
    "jabatan": "Analis Kebijakan Ahli Muda",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-6",
    "nama": "Anna Christina",
    "nip": "198204142008032002",
    "pangkat_golongan": "Pembina (IV/a)",
    "jabatan": "Kepala Subbagian Tata Usaha",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-7",
    "nama": "Doria Marselita",
    "nip": "198107012014032001",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-8",
    "nama": "Astri Nur Afidah",
    "nip": "198912272014032004",
    "pangkat_golongan": "Penata (III/d)",
    "jabatan": "Perencana Ahli Muda",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-9",
    "nama": "Priska Apnitami",
    "nip": "199004052015042001",
    "pangkat_golongan": "Penata (III/c)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-10",
    "nama": "Beatrik Dwi Septiana",
    "nip": "199109122019022004",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-11",
    "nama": "Yosika Dian Komala",
    "nip": "199208022015042001",
    "pangkat_golongan": "Penata (III/c)",
    "jabatan": "Penata Kelola Spektrum Frekuensi Radio Ahli Muda",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-12",
    "nama": "Harsatya Alif Adiguna",
    "nip": "199301022020121004",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Perencana Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-13",
    "nama": "Nindhitya Nurmalitasari",
    "nip": "199303052019022002",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-14",
    "nama": "Retno Utary Masruroh",
    "nip": "199604212020122013",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Perencana Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-15",
    "nama": "Esty Nadya Rafyanti",
    "nip": "199607272020122012",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-16",
    "nama": "Rilla Gusela Sumisra",
    "nip": "199608192020122018",
    "pangkat_golongan": "Penata Muda Tingkat I (III/b)",
    "jabatan": "Analis Kebijakan Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-17",
    "nama": "Randhika Rianza",
    "nip": "199903042022031003",
    "pangkat_golongan": "Penata Muda Tingkat I (III/a)",
    "jabatan": "Penata Kelola Spektrum Frekuensi Radio Ahli Pertama",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-18",
    "nama": "Hermond Bernard Roganda Tamba",
    "nip": "198507012014031003",
    "pangkat_golongan": "Penata (III/d)",
    "jabatan": "Penata Layanan Operasional",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-19",
    "nama": "Dyah Kartika Sari",
    "nip": "198608132025212019",
    "pangkat_golongan": "Penata Muda (PPPK) (IX)",
    "jabatan": "Penata Layanan Operasional",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-20",
    "nama": "Widya Siwi Lajuba",
    "nip": "199606262025212035",
    "pangkat_golongan": "Penata Muda (PPPK) (IX)",
    "jabatan": "Penata Layanan Operasional",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-21",
    "nama": "Rifqi Argya Gunawan",
    "nip": "393174051903021002",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Penelaah Teknis Kebijakan",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-22",
    "nama": "Irfan Maulana",
    "nip": "393174102612930005",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Penelaah Teknis Kebijakan",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-23",
    "nama": "Mohamad Alfin Jauhari",
    "nip": "393316091611990001",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Penata Kelola Sistem dan Teknologi Informasi",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-24",
    "nama": "Nurul Azizah",
    "nip": "393321045508930002",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Penelaah Teknis Kebijakan",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-25",
    "nama": "Fadhlan Irham Rinaldi",
    "nip": "391671090702040004",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Pengumpulan, Analisis Data, dan Perumusan Kebijakan",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-26",
    "nama": "Nurcahya Dwi Marssanty",
    "nip": "393506157008030002",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Ketatausahaan",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-27",
    "nama": "Khairun Nisa' Zuqri",
    "nip": "393372044411020005",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Pengolah Data dan Informasi ",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-28",
    "nama": "Rafly Rangghani Putra",
    "nip": "393276020903030008",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Konten dan Sistem Informasi",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-29",
    "nama": "Cholifah Sabrina",
    "nip": "393216054501030010",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Administrasi",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  },
  {
    "id": "peg-30",
    "nama": "Sharah Shabina",
    "nip": "393604075002030004",
    "pangkat_golongan": "Penyedia Jasa Lainnya Perorangan (PJLP)",
    "jabatan": "Pendukung Desain Grafis",
    "unit_kerja": "Pusat Kebijakan Strategis",
    "status": "Aktif"
  }
];

export const INITIAL_PEJABAT: Pejabat[] = [
  {
    "id": "pej-1",
    "nama": "Oki Suryowahono",
    "nip": "197909072008031001",
    "pangkat_golongan": "Pembina Tingkat I (IV/c)",
    "jabatan": "Kepala Pusat Kebijakan Strategis",
    "is_default": true,
    "sebagai": "Kepala Pusat Kebijakan Strategis (Definitif)"
  },
  {
    "id": "pej-2",
    "nama": "Septa Dewi Anggraeni",
    "nip": "198109082009122001",
    "pangkat_golongan": "Pembina (IV/a)",
    "jabatan": "Kepala Pusat Kebijakan Strategis",
    "is_default": false,
    "sebagai": "Plh. Kepala Pusat Kebijakan Strategis"
  },
  {
    "id": "pej-3",
    "nama": "Anna Christina",
    "nip": "198204142008032002",
    "pangkat_golongan": "Pembina (IV/a)",
    "jabatan": "Kepala Subbagian Tata Usaha",
    "is_default": false,
    "sebagai": "Kepala Subbagian Tata Usaha"
  }
];

export const INITIAL_NOMOR_SURAT: NomorSuratRecord[] = [
  {
    "id": "ns-850",
    "nomor_urut": 850,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "850/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "14 September 2026",
    "perihal": "Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi pada tanggal 17 September 2026 di Kab. Tangerang",
    "dibuat_oleh": "Rilla",
    "tujuan_lokasi": "Kabupaten Tangerang, Banten",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Surat Undangan Nomor B-850/SJ.9/KP.02.01/09/2026",
    "jenis": "UND",
    "kepada": "Terlampir",
    "status_ttd": "Kapus",
    "topik_tim": "BE",
    "konseptor": "Rilla",
    "status_surat": "OK",
    "link_pdf": "20290917 UND B-850 Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi.pdf"
  },
  {
    "id": "ns-851",
    "nomor_urut": 851,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "851/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "15 September 2026",
    "perihal": "Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi di Garuda Spark Innovation Hub - BSD City",
    "dibuat_oleh": "Azizah",
    "tujuan_lokasi": "Garuda Spark Innovation Hub – BSD City, Kab. Tangerang",
    "jumlah_pegawai": 20,
    "penandatangan_nama": "Septa Dewi Anggraeni",
    "dasar_surat": "Surat Undangan Kepala Pusat Kebijakan Strategis Nomor : B-850/SJ.9/KP.02.01/09/2026 tanggal 14 September 2026",
    "jenis": "ST",
    "kepada": "Terlampir",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Azizah",
    "status_surat": "OK",
    "link_pdf": "20290917 ST 851 Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi.pdf"
  },
  {
    "id": "ns-864",
    "nomor_urut": 864,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "864/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "22 September 2026",
    "perihal": "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
    "dibuat_oleh": "Aya",
    "tujuan_lokasi": "Jakarta",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Undangan Penyelenggaraan Digital Nasional",
    "jenis": "ST",
    "kepada": "Oki Suryowahono",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Aya",
    "status_surat": "OK",
    "link_pdf": "20260924 ST Oki Rapat Pembahasan Pemetaan Kebijakan dan Regukasi Penyelenggaraan Digital Nasional.pdf"
  },
  {
    "id": "ns-875",
    "nomor_urut": 875,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "875/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "28 September 2026",
    "perihal": "Policy Talks Forum Komunikasi Kebijakan dengan Isu Strategis Transformasi Digital Pemerintahan",
    "dibuat_oleh": "Aya",
    "tujuan_lokasi": "Jakarta",
    "jumlah_pegawai": 3,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Undangan FKK 2026",
    "jenis": "ST",
    "kepada": "Oki, Dita, Rilla",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Aya",
    "status_surat": "OK"
  },
  {
    "id": "ns-876",
    "nomor_urut": 876,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "876/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "29 September 2026",
    "perihal": "Perjalanan Dinas dalam rangka Rapat Koordinasi Terkait Verifikasi Capaian Kinerja BAKTI 2025 di BBPPT Kota Bekasi",
    "dibuat_oleh": "Azizah",
    "tujuan_lokasi": "Balai Besar Pengujian Perangkat Telekomunikasi (BBPPT) Kota Bekasi",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Undangan Verifikasi Capaian Kinerja BAKTI 2025",
    "jenis": "ST",
    "kepada": "Dyah Purwaningrum",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Azizah",
    "status_surat": "OK"
  },
  {
    "id": "ns-881",
    "nomor_urut": 881,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "881/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "30 September 2026",
    "perihal": "Penandatanganan Nota Kesepahaman SP4N-LAPOR!",
    "dibuat_oleh": "Aya",
    "tujuan_lokasi": "Jakarta",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Undangan Penandatanganan MoU SP4N-LAPOR!",
    "jenis": "ST",
    "kepada": "Terlampir",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Aya",
    "status_surat": "OK"
  },
  {
    "id": "ns-882",
    "nomor_urut": 882,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "882/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "30 September 2026",
    "perihal": "Penyampaian Usulan Peserta Pelatihan ITEC Periode November - Desember",
    "dibuat_oleh": "Aya",
    "tujuan_lokasi": "Kementerian Komunikasi dan Digital RI",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Surat Penawaran Pelatihan ITEC",
    "jenis": "ND",
    "kepada": "Karo SDMO",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Aya",
    "status_surat": "OK"
  },
  {
    "id": "ns-883",
    "nomor_urut": 883,
    "tahun": 2026,
    "bulan": "09",
    "nomor_lengkap": "883/SJ.9/KP.01.06/09/2026",
    "tanggal_dibuat": "30 September 2026",
    "perihal": "Policy Talks Forum Komunikasi Kebijakan dengan Isu Strategis Transformasi Digital Pemerintahan",
    "dibuat_oleh": "Aya",
    "tujuan_lokasi": "Jakarta",
    "jumlah_pegawai": 1,
    "penandatangan_nama": "Oki Suryowahono, S.T., M.T.",
    "dasar_surat": "Undangan Forum Komunikasi Kebijakan 2026",
    "jenis": "ST",
    "kepada": "Yaya",
    "status_ttd": "Kapus",
    "topik_tim": "TU",
    "konseptor": "Aya",
    "status_surat": "OK"
  }
];

export const SAMPLE_INVITATIONS: SampleInvitation[] = [
  {
    id: "inv-bappenas",
    title: "Undangan Rapat Pembahasan Pemetaan Kebijakan - Bappenas (Bandung)",
    instansi: "Menteri Perencanaan Pembangunan Nasional / Kepala Bappenas",
    category: "Rapat Antar-Kementerian",
    rawText: `KEMENTERIAN PERENCANAAN PEMBANGUNAN NASIONAL / BADAN PERENCANAAN PEMBANGUNAN NASIONAL
Jalan Proklamasi No. 70, Jakarta Pusat 10320

Nomor   : B-723/D.3/HM.01.01/07/2026
Hal     : Undangan Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional
Tanggal : 27 Juli 2026

Kepada Yth.
Menteri Komunikasi dan Digital RI
c.q. Kepala Pusat Kebijakan Strategis
di Jakarta

Dalam rangka mendukung penyusunan arah kebijakan dan regulasi transformasi digital nasional terpadu, bersama ini kami mengharapkan kehadiran Bapak/Ibu atau pejabat/pegawai yang membidangi regulasi dan arsitektur digital pada:

Hari/Tanggal : Rabu s.d. Jumat, 23 s.d. 25 September 2026
Waktu        : 09.00 WIB s.d. 17.00 WIB
Tempat       : Mercure Bandung Nexa Supratman, Jl. Supratman No. 66-68, Cihapit, Kota Bandung, Jawa Barat
Kriteria     : 1-3 orang Pegawai yang membidangi analisis kebijakan regulasi digital dan tata kelola data.

Demikian kami sampaikan, atas perhatian dan kerja sama yang baik diucapkan terima kasih.`,
    mockExtraction: {
      nama_acara: "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      nomor_surat_undangan: "B-723/D.3/HM.01.01/07/2026",
      instansi_pengundang: "Menteri Perencanaan Pembangunan Nasional / Kepala Bappenas",
      tanggal_surat_undangan: "2026-07-27",
      tanggal_mulai: "2026-09-23",
      tanggal_selesai: "2026-09-25",
      waktu_pelaksanaan: "09.00 WIB s.d. 17.00 WIB",
      hari_tanggal_pelaksanaan: "Rabu s.d. Jumat, 23 - 25 September 2026",
      lokasi: "Mercure Bandung Nexa Supratman, Jl. Supratman No. 66-68, Cihapit",
      kota_kegiatan: "Kota Bandung",
      topik: "Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      perihal_undangan: "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      kriteria_peserta: "1-3 orang Pegawai yang membidangi analisis kebijakan regulasi digital dan tata kelola data",
      narasi_menimbang: "Bahwa dalam rangka mendukung penyusunan arah kebijakan dan regulasi transformasi digital nasional terpadu, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.",
      narasi_dasar: "Surat Undangan Menteri Perencanaan Pembangunan Nasional / Kepala Bappenas Nomor B-723/D.3/HM.01.01/07/2026 tanggal 27 Juli 2026 hal Undangan Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional.",
      narasi_untuk: "Mengikuti Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional yang dilaksanakan pada tanggal 23 - 25 September 2026 di Mercure Bandung Nexa Supratman, Jl. Supratman No. 66-68, Kota Bandung.",
      keterangan_tambahan: "Penugasan Luar Kota (Bandung) — Sesuai Standar Biaya Masukan Perjalanan Dinas"
    }
  },
  {
    id: "inv-1",
    title: "Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi (ST 851)",
    instansi: "Pusat Kebijakan Strategis",
    category: "Rapat Kebijakan",
    rawText: `KEMENTERIAN KOMUNIKASI DAN DIGITAL RI\nSEKRETARIAT JENDERAL\nPUSAT KEBIJAKAN STRATEGIS\n\nNomor  : B-850/SJ.9/KP.02.01/09/2026\nHal    : Undangan Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi\nTanggal: 14 September 2026\n\nKepada Yth.\nDaftar Terlampir\n\nSehubungan dengan penyusunan rancangan Pedoman Penyusunan Rekomendasi Kebijakan di Lingkungan Kementerian Komunikasi dan Digital, bersama ini kami mengundang Bapak/Ibu untuk hadir pada:\nHari/Tanggal : Kamis, 17 September 2026\nWaktu        : 09.00 WIB s.d. selesai\nTempat       : Garuda Spark Innovation Hub – BSD, Kawasan Digital Hub, BSD City, Biomedical Campus BSD City, Jl. Damai Foresta, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten.\nKriteria Peserta: Tim Perumus Pedoman dan Analis Kebijakan TU PUSAKA.`,
    mockExtraction: {
      nama_acara: "Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi",
      nomor_surat_undangan: "B-850/SJ.9/KP.02.01/09/2026",
      instansi_pengundang: "Pusat Kebijakan Strategis",
      tanggal_surat_undangan: "2026-09-14",
      tanggal_mulai: "2026-09-17",
      tanggal_selesai: "2026-09-17",
      waktu_pelaksanaan: "09.00 WIB s.d. selesai",
      hari_tanggal_pelaksanaan: "Kamis, 17 September 2026",
      lokasi: "Garuda Spark Innovation Hub – BSD City, Biomedical Campus BSD City, Jl. Damai Foresta, Sampora, Kec. Cisauk",
      kota_kegiatan: "Kabupaten Tangerang",
      topik: "Pedoman Penyusunan Rekomendasi Kebijakan",
      perihal_undangan: "Undangan Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi",
      kriteria_peserta: "Tim Perumus Pedoman dan Analis Kebijakan TU PUSAKA",
      narasi_menimbang: "Bahwa dalam rangka mendukung kelancaran penyusunan rancangan Pedoman Penyusunan Rekomendasi Kebijakan di Lingkungan Kementerian Komunikasi dan Digital, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.",
      narasi_dasar: "Surat Undangan Pusat Kebijakan Strategis Nomor B-850/SJ.9/KP.02.01/09/2026 tanggal 14 September 2026 hal Undangan Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi.",
      narasi_untuk: "Mengikuti Rapat Pembahasan Pedoman Penyusunan Rekomendasi Kebijakan Komdigi yang dilaksanakan pada tanggal 17 September 2026 di Garuda Spark Innovation Hub – BSD City, Kabupaten Tangerang.",
      keterangan_tambahan: "Format resmi naskah dinas Komdigi ST 851"
    }
  },
  {
    id: "inv-2",
    title: "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional (ST 864)",
    instansi: "Pusat Kebijakan Strategis",
    category: "Rapat Koordinasi",
    rawText: `KEMENTERIAN KOMUNIKASI DAN DIGITAL RI\nSEKRETARIAT JENDERAL\nPUSAT KEBIJAKAN STRATEGIS\n\nNomor  : B-860/SJ.9/KP.02.01/09/2026\nHal    : Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional\nTanggal: 22 September 2026\n\nHari/Tanggal : Kamis, 24 September 2026\nWaktu        : 09.00 WIB s.d. selesai\nTempat       : Ruang Rapat PUSAKA Lt. 5, Gedung Sapta Pesona Jakarta\nKriteria     : Analis Kebijakan dan Tim Tata Usaha PUSAKA`,
    mockExtraction: {
      nama_acara: "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      nomor_surat_undangan: "B-860/SJ.9/KP.02.01/09/2026",
      instansi_pengundang: "Pusat Kebijakan Strategis",
      tanggal_surat_undangan: "2026-09-22",
      tanggal_mulai: "2026-09-24",
      tanggal_selesai: "2026-09-24",
      waktu_pelaksanaan: "09.00 WIB s.d. selesai",
      hari_tanggal_pelaksanaan: "Kamis, 24 September 2026",
      lokasi: "Ruang Rapat PUSAKA Lt. 5, Gedung Sapta Pesona",
      kota_kegiatan: "Jakarta Pusat",
      topik: "Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      perihal_undangan: "Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional",
      kriteria_peserta: "Analis Kebijakan dan Tim Tata Usaha PUSAKA",
      narasi_menimbang: "Bahwa dalam rangka mendukung efektivitas dan sinergi pemetaan kebijakan serta regulasi penyelenggaraan digital nasional, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.",
      narasi_dasar: "Surat Undangan Pusat Kebijakan Strategis Nomor B-860/SJ.9/KP.02.01/09/2026 tanggal 22 September 2026 hal Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional.",
      narasi_untuk: "Mengikuti Rapat Pembahasan Pemetaan Kebijakan dan Regulasi Penyelenggaraan Digital Nasional yang dilaksanakan pada tanggal 24 September 2026 bertempat di Ruang Rapat PUSAKA Lt. 5, Gedung Sapta Pesona, Jakarta Pusat.",
      keterangan_tambahan: "Format resmi naskah dinas Komdigi ST 864"
    }
  }
];

export const INITIAL_USERS = [
  {
    id: 'user-admin',
    username: 'admin_tu',
    password: 'pusaka2026',
    nama: 'Admin Tata Usaha PUSAKA',
    nip: '198204142008032002',
    role: 'admin' as const,
    unit_kerja: 'Bagian Tata Usaha PUSAKA',
    status: 'Aktif' as const,
    created_at: '2026-10-14',
  },
  {
    id: 'user-yuliano',
    username: 'yuliano',
    password: 'pusaka2026',
    nama: 'Yuliano Christoper',
    nip: '199501012022011001',
    role: 'admin' as const,
    unit_kerja: 'Pusat Kebijakan Strategis',
    status: 'Aktif' as const,
    created_at: '2026-10-14',
  },
  {
    id: 'user-staff',
    username: 'staf_pusaka',
    password: 'pusaka2026',
    nama: 'Staf Konseptor PUSAKA',
    nip: '199205122019031005',
    role: 'staff' as const,
    unit_kerja: 'Pusat Kebijakan Strategis',
    status: 'Aktif' as const,
    created_at: '2026-10-14',
  },
];


