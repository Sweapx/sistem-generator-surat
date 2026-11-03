# DICTIONARY & KNOWLEDGE BASE KLASIFIKASI NOMOR SURAT / NOTA DINAS
> **Dokumen Acuan Sistem Rekomendasi Otomatis Klasifikasi Nota Dinas**  
> Standar Klasifikasi Arsip dan Naskah Dinas Kementerian Komunikasi dan Digital RI  
> Sumber Basis Data: `Klasifikasi Fasilitatif` & `Klasifikasi Substantif` (Terkini)

---
## 1. PANDUAN INTEGRASI & ARSITEKTUR SISTEM REKOMENDASI

### 1.1 Konsep Kerja Fitur Saran Klasifikasi
Ketika pengguna (pegawai/konseptor surat) mengetik atau mengisi formulir Nota Dinas (khususnya field **Perihal/Hal** dan **Isi Dokumen**), sistem secara otomatis menjalankan analisis pencocokan teks (*content analysis & keyword matching*) terhadap dictionary ini untuk menyarankan **Top 3 Kode Klasifikasi** yang paling relevan.

Pengguna tetap memiliki wewenang penuh untuk menerima saran atau memilih nomor klasifikasi lain secara manual (fitur ini bersifat *smart-assistant / advisory*).

### 1.2 Formula Pembobotan (*Scoring Algorithm*) Berjenjang
Untuk menghasilkan akurasi yang optimal, sistem disarankan menggunakan formula pembobotan berjenjang:
$$\text{Skor Total}(K) = \left(3.0 \times \sum_{w \in \text{Keywords}(K)} \text{Len}(w) \times \text{Count}(w, \text{Perihal})\right) + \left(1.0 \times \sum_{w \in \text{Keywords}(K)} \text{Len}(w) \times \text{Count}(w, \text{Isi})\right)$$

* **Bobot Perihal ($3.0\times$)**: Kata yang muncul di perihal/judul nota dinas memiliki signifikansi subjek tertinggi.
* **Bobot Isi Dokumen ($1.0\times$)**: Kata yang muncul di paragraf isi/penjelas.
* **Bobot Panjang Kata Kunci ($\text{Len}(w)$)**: Frasa majemuk (misal: `"pakta integritas"` [2 kata]) diberikan bobot perkalian lebih tinggi daripada kata tunggal (misal: `"pegawai"`), sehingga pencocokan spesifik selalu mengalahkan pencocokan umum.
* **Karakteristik Satuan Kerja**: Karena Pusat Kebijakan Strategis (`SJ.9`) berada di bawah Sekretariat Jenderal, dokumen nota dinas internalnya didominasi oleh urusan fasilitatif (`KP`, `PR`, `KU`, `PW`, `PL`, `DT`).

### 1.3 Format Respon Rekomendasi (Payload JSON)
Sistem backend disarankan mengembalikan struktur respon sebagai berikut ke UI frontend:

```json
{
  "status": "success",
  "input_analysis": {
    "detected_perihal": "Penyampaian Pakta Integritas ASN Formasi 2024",
    "word_count": 85
  },
  "recommendations": [
    {
      "rank": 1,
      "kode": "KP.01.06",
      "kategori": "FASILITATIF",
      "nama_klasifikasi": "Penugasan / Penunjukan / Surat Perintah / SPMT / SPMJ / Surat Pernyataan",
      "hirarki": "KEPEGAWAIAN > TATA USAHA KEPEGAWAIAN",
      "confidence_score": 0.94,
      "alasan_saran": "Ditemukan kata kunci kuat: 'pakta integritas', 'surat pernyataan' yang merupakan urusan tata usaha kepegawaian.",
      "contoh_kasus": "Penyampaian pakta integritas pegawai, surat pernyataan menduduki jabatan, surat tugas/rekomendasi dinas."
    },
    {
      "rank": 2,
      "kode": "KP.01.01",
      "kategori": "FASILITATIF",
      "nama_klasifikasi": "Data Perorangan / DRH",
      "hirarki": "KEPEGAWAIAN > TATA USAHA KEPEGAWAIAN",
      "confidence_score": 0.42,
      "alasan_saran": "Terkait pengelolaan berkas dan data administrasi perorangan pegawai ASN.",
      "contoh_kasus": "Pembaruan data pegawai, sertifikat kompetensi pegawai."
    }
  ]
}
```

---

## 2. KAMUS KLASIFIKASI FASILITATIF (URUSAN PENUNJANG & MANAJERIAL)

Klasifikasi Fasilitatif mencakup fungsi-fungsi penunjang operasional kantor yang berlaku umum pada seluruh unit kerja di instansi pemerintah.

### 2.PR [PR] - PERENCANAAN
Urusan pokok terkait tata kelola **perencanaan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`PR.01.01`** | **RENCANA DAN PROGRAM**<br>↳ Rencana Strategis Kementerian | `rencana strategis kementerian`, `program prioritas kementerian`, `linimasa program prioritas`, `timeline program prioritas`, `indikator kinerja utama`, `rencana dan program`, `penyusunan timeline`, `rencana strategis`, `internet prabayar`, `rapat penyusunan` | Undangan Rapat Penyusunan Timeline; Reviu Singkat Isu Kuota Internet Prabayar |
| **`PR.01.02`** | **RENCANA DAN PROGRAM**<br>↳ Rencana Kerja Kementerian | `laporan perkembangan quickwin`, `rencana kerja kementerian`, `konsep jawaban menteri`, `rencana dan program`, `quickwin kementerian`, `percepatan quickwin`, `monitoring quickwin`, `kementerian komdigi`, `program percepatan`, `terkait registrasi` | Usulan Nama Untuk Tim Pemantauan Program Percepatan (Quickwin) Kementerian Komdigi; Progress Quickwin Komdigi per 31 Desember 2025 |
| **`PR.01.03`** | **RENCANA DAN PROGRAM**<br>↳ Pinjaman dan Hibah Luar Negeri | `rencana dan program` | Penyusunan atau evaluasi terkait pinjaman dan hibah luar negeri |
| **`PR.02.01`** | **PENYUSUNAN ANGGARAN**<br>↳ Penyusunan RKA-K/L Kementerian | `telaah analisis regulasi`, `rencana kerja anggaran`, `penyusunan rka k`, `penyusunan anggaran`, `rancangan peraturan`, `pelanggaran konten`, `terhadap rancangan`, `dugaan pelanggaran`, `penyusunan rka-kl`, `peraturan menteri` | Hasil Telaah Analisis Isu dan Potensi Dugaan Pelanggaran Konten Mens Rea dengan UU ITE; Reviu terhadap Rancangan Peraturan Menteri |
| **`PR.02.02`** | **PENYUSUNAN ANGGARAN**<br>↳ Penyusunan Revisi RKA-K/L | `penyusunan revisi rka k`, `usulan pergeseran rka-kl`, `penyusunan anggaran`, `perubahan rka-kl`, `revisi rka-k/l` | Penyusunan atau evaluasi terkait penyusunan revisi rka-k/l |
| **`PR.03.01`** | **KERJASAMA LINTAS SEKTORAL DAN DAERAH**<br>↳ Penyusunan Program Kerjasama Lintas Sektoral |  | Penyusunan atau evaluasi terkait penyusunan program kerjasama lintas sektoral |
| **`PR.03.02`** | **KERJASAMA LINTAS SEKTORAL DAN DAERAH**<br>↳ Penyusunan Program Kerjasama Lintas Daerah |  | Penyusunan atau evaluasi terkait penyusunan program kerjasama lintas daerah |
| **`PR.04.01`** | **EVALUASI DAN PELAPORAN**<br>↳ Kinerja Kementerian | `laporan kinerja instansi pemerintah`, `evaluasi kinerja kementerian`, `capaian perjanjian kinerja`, `evaluasi dan pelaporan`, `kinerja kementerian`, `laporan tahunan`, `laptah`, `lakip`, `lkjip` | Penyusunan atau evaluasi terkait kinerja kementerian |
| **`PR.04.02`** | **EVALUASI DAN PELAPORAN**<br>↳ LAKIP Kementerian | `evaluasi dan pelaporan`, `lakip kementerian` | Penyusunan atau evaluasi terkait lakip kementerian |
| **`PR.04.03`** | **EVALUASI DAN PELAPORAN**<br>↳ LAPTAH Kementerian | `evaluasi dan pelaporan`, `laptah kementerian` | Penyusunan atau evaluasi terkait laptah kementerian |
| **`PR.04.04`** | **EVALUASI DAN PELAPORAN**<br>↳ Laporan Monitoring dan Evaluasi PP.39 Tahun 2006 | `evaluasi dan pelaporan` | Penyusunan atau evaluasi terkait laporan monitoring dan evaluasi pp.39 tahun 2006 |
| **`PR.04.05`** | **EVALUASI DAN PELAPORAN**<br>↳ Laporan Monitoring dan Evaluasi Capaian Kantor Staf Presiden (KSP) | `evaluasi dan pelaporan`, `ksp` | Penyusunan atau evaluasi terkait laporan monitoring dan evaluasi capaian kantor staf presiden (ksp) |
| **`PR.04.06`** | **EVALUASI DAN PELAPORAN**<br>↳ Laporan Monitoring dan Evaluasi Pinjaman dan Hibah Luar Negeri (PHLN) | `evaluasi dan pelaporan`, `phln` | Penyusunan atau evaluasi terkait laporan monitoring dan evaluasi pinjaman dan hibah luar negeri (phln) |
| **`PR.04.07`** | **EVALUASI DAN PELAPORAN**<br>↳ Laporan Monitoring dan Evaluasi Kinerja (PK) | `evaluasi dan pelaporan` | Penyusunan atau evaluasi terkait laporan monitoring dan evaluasi kinerja (pk) |
| **`PR.04.08`** | **EVALUASI DAN PELAPORAN**<br>↳ Laporan Monitoring dan Evaluasi Capaian Rencana Kerja Pemerintah (RKP) | `evaluasi dan pelaporan`, `rkp` | Penyusunan atau evaluasi terkait laporan monitoring dan evaluasi capaian rencana kerja pemerintah (rkp) |
| **`PR.04.09`** | **EVALUASI DAN PELAPORAN**<br>↳ Penyusunan Bahan DPR/DPD | `evaluasi dan pelaporan`, `penyusunan bahan dpr`, `dpd` | Penyusunan atau evaluasi terkait penyusunan bahan dpr/dpd |
| **`PR.04.10`** | **EVALUASI DAN PELAPORAN**<br>↳ Penyusunan Bahan Sidang Kabinet | `penyusunan bahan sidang kabinet`, `evaluasi dan pelaporan` | Penyusunan atau evaluasi terkait penyusunan bahan sidang kabinet |
| **`PR.04.11`** | **EVALUASI DAN PELAPORAN**<br>↳ Penyusunan Bahan Rapim/Rakorses | `evaluasi dan pelaporan`, `penyusunan bahan rapim`, `rakorses` | Penyusunan atau evaluasi terkait penyusunan bahan rapim/rakorses |


### 2.KP [KP] - KEPEGAWAIAN
Urusan pokok terkait tata kelola **kepegawaian**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`KP.01.01`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Data Perorangan/DRH | `pembaruan data kepegawaian`, `tata usaha kepegawaian`, `daftar riwayat hidup`, `dokumen kepegawaian`, `portofolio pegawai`, `memiliki serifikat`, `pembaruan dokumen`, `biodata pegawai`, `data perorangan`, `berkas pegawai` | Data Pegawai yang telah memiliki Serifikat PPK; Pembaruan dokumen kepegawaian |
| **`KP.01.02`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Database/Statistik | `tata usaha kepegawaian`, `analisis beban kerja`, `usulan formasi pns`, `kebutuhan pegawai`, `perencanaan sdm`, `formasi pegawai`, `formasi pppk`, `statistik`, `database`, `anjab` | Administrasi atau permohonan terkait database/statistik |
| **`KP.01.03`** | **TATA USAHA KEPEGAWAIAN**<br>↳ NIP/Kartu Pegawai/Kartu PPNS | `tata usaha kepegawaian`, `penyesuaian gaji pokok`, `dilakukan penyesuaian`, `informasi kenaikan`, `data kepegawaian`, `penyesuaian gaji`, `administrasi pns`, `di lingkungan`, `kenaikan gaji`, `kartu pegawai` | untuk dilakukan penyesuaian Gaji Pokok; Informasi Kenaikan Gaji Berkala atas nama Hermond |
| **`KP.01.04`** | **TATA USAHA KEPEGAWAIAN**<br>↳ KGB/Tunjangan Kinerja | `tata usaha kepegawaian`, `kenaikan gaji berkala`, `gaji berkala pns`, `penyesuaian tunjangan`, `fasilitasi pembiayaan`, `bantuan fasilitasi`, `tunjangan jabatan`, `tunjangan kinerja`, `rapel tunjangan`, `uji kompetensi` | bantuan fasilitasi pembiayaan Uji Kompetensi JF |
| **`KP.01.05`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Pendaftaran/Keluarga/Perkawinan/Anak | `tata usaha kepegawaian`, `surat nikah pegawai`, `pelatihan multilateral`, `mengikuti pelatihan`, `tunjangan keluarga`, `peserta pelatihan`, `keluarga pegawai`, `tunjangan anak`, `pendaftaran`, `perkawinan` | Peserta untuk mengikuti Pelatihan |
| **`KP.01.06`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Penugasan / Penunjukan/ Surat Perintah / Pemanggilan / PLH / PLT / Surat Pernyataan/ Surat Keterangan / SPMT / SPMJ / SPP | `pencegahan judi online`, `tata usaha kepegawaian`, `surat izin pimpinan`, `integritas pencegahan`, `surat pernyataan`, `rekomendasi lpdp`, `pakta integritas`, `surat keterangan`, `surat penugasan`, `surat perintah` | Pembuatan Surat Usulan Untuk Mengikuti; Pakta Integritas Pencegahan dan |
| **`KP.01.07`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Penghargaan/Sertifikat/Piala/Piagam/Tanda Kehormatan | `tata usaha kepegawaian`, `tanda kehormatan`, `penghargaan`, `sertifikat`, `piagam`, `piala` | Administrasi atau permohonan terkait penghargaan/sertifikat/piala/piagam/tanda kehormatan |
| **`KP.01.08`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Sumpah Pegawai | `tata usaha kepegawaian`, `sumpah pegawai` | Administrasi atau permohonan terkait sumpah pegawai |
| **`KP.01.09`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Daftar Urut Kepangkatan (DUK) | `daftar urut kepangkatan`, `tata usaha kepegawaian`, `duk` | Administrasi atau permohonan terkait daftar urut kepangkatan (duk) |
| **`KP.01.10`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Cuti | `tata usaha kepegawaian`, `cuti` | Administrasi atau permohonan terkait cuti |
| **`KP.01.11`** | **TATA USAHA KEPEGAWAIAN**<br>↳ Izin Kerja / Izin Belajar / Izin Dispensasi / Izin Penelitian PKL / Izin PKL / Tugas Belajar | `tata usaha kepegawaian`, `izin penelitian pkl`, `izin dispensasi`, `tugas belajar`, `izin belajar`, `izin kerja`, `izin pkl` | Administrasi atau permohonan terkait izin kerja / izin belajar / izin dispensasi / izin penelitian pkl / izin pkl / tugas belajar |
| **`KP.02.01`** | **PERENCANAAN PEGAWAI**<br>↳ Analisis Jabatan /Analisis Beban Kerja / Evaluasi Jabatan / Kelas Jabatan / Peta Jabatan | `analisis beban kerja`, `panitia seleksi casn`, `perencanaan pegawai`, `evaluasi jabatan`, `analisis jabatan`, `penerimaan cpns`, `rekrutmen pppk`, `kelas jabatan`, `pengadaan asn`, `peta jabatan` | Administrasi atau permohonan terkait analisis jabatan /analisis beban kerja / evaluasi jabatan / kelas jabatan / peta jabatan |
| **`KP.02.02`** | **PERENCANAAN PEGAWAI**<br>↳ Formasi Pegawai / e-Formasi Pegawai | `e formasi pegawai`, `perencanaan pegawai`, `formasi pegawai` | Administrasi atau permohonan terkait formasi pegawai / e-formasi pegawai |
| **`KP.03.01`** | **PENGADAAN PEGAWAI**<br>↳ Seleksi Pegawai / Penempatan Pegawai | `pelatihan dasar cpns`, `penempatan pegawai`, `pengadaan pegawai`, `diklat prajabatan`, `pengangkatan pns`, `seleksi pegawai`, `sumpah pns`, `janji pns`, `latsar` | Administrasi atau permohonan terkait seleksi pegawai / penempatan pegawai |
| **`KP.03.02`** | **PENGADAAN PEGAWAI**<br>↳ Pengangkatan dan Pengunduran Diri PNS / CPNS | `pengadaan pegawai`, `cpns` | Administrasi atau permohonan terkait pengangkatan dan pengunduran diri pns / cpns |
| **`KP.03.03`** | **PENGADAAN PEGAWAI**<br>↳ Non PNS | `pengadaan pegawai`, `non pns` | Administrasi atau permohonan terkait non pns |
| **`KP.04.01`** | **MUTASI PEGAWAI**<br>↳ Pemindahan PNS Antar Unit | `pemindahan pns antar unit`, `nota persetujuan bkn`, `kenaikan pangkat`, `mutasi pegawai`, `golongan ruang`, `kp reguler`, `usulan kp` | Administrasi atau permohonan terkait pemindahan pns antar unit |
| **`KP.04.02`** | **MUTASI PEGAWAI**<br>↳ Pemindahan PNS Antar Instansi | `pemindahan pns antar instansi`, `mutasi pegawai` | Administrasi atau permohonan terkait pemindahan pns antar instansi |
| **`KP.04.03`** | **MUTASI PEGAWAI**<br>↳ Pemindahan PNS Dengan Status Dipekerjakan/ Diperbantukan | `mutasi pegawai`, `diperbantukan` | Administrasi atau permohonan terkait pemindahan pns dengan status dipekerjakan/ diperbantukan |
| **`KP.04.04`** | **MUTASI PEGAWAI**<br>↳ Kenaikan Pangkat Struktural dan Fungsional | `kenaikan pangkat fungsional`, `kenaikan pangkat struktural`, `periode kenaikan pangkat`, `usulan kenaikan pangkat`, `kebijakan strategis`, `kenaikan pangkat`, `pangkat pegawai`, `pusat kebijakan`, `mutasi pegawai`, `pegawai pusat` | Kenaikan Pangkat Pegawai Pusat Kebijakan Strategis |
| **`KP.04.05`** | **MUTASI PEGAWAI**<br>↳ Peninjauan Masa Jabatan/Masa Kerja | `peninjauan masa jabatan`, `mutasi pegawai`, `masa kerja` | Administrasi atau permohonan terkait peninjauan masa jabatan/masa kerja |
| **`KP.04.06`** | **MUTASI PEGAWAI**<br>↳ Pengangkatan, Pemindahan, dan Pemberhentian dalam Jabatan Struktural | `pemberhentian jabatan struktural`, `pengangkatan jabatan struktural`, `mutasi jabatan struktural`, `pelantikan eselon`, `fungsional analis`, `rilla fungsional`, `analis kebijakan`, `spmj struktural`, `kebijakan ahli`, `mutasi pegawai` | SPMJ Rilla (Fungsional Analis Kebijakan Ahli Pertama) |
| **`KP.04.07`** | **MUTASI PEGAWAI**<br>↳ Pengangkatan, Pemindahan, Pemberhentian dan Pembebasan Sementara dalam Jabatan Fungsional | `pengangkatan jabatan fungsional`, `penurunan jabatan teknis`, `pembebasan sementara jf`, `tugas belajar jf`, `pemberhentian jabatan`, `jabatan fungsional`, `fungsional penata`, `analis kebijakan`, `pemberhentian jf`, `mutasi pegawai` | Pemberhentian Jabatan Fungsional Penata Kelola |
| **`KP.04.08`** | **MUTASI PEGAWAI**<br>↳ Impassing / Mutasi Jabatan | `mutasi pegawai`, `mutasi jabatan`, `impassing` | Administrasi atau permohonan terkait impassing / mutasi jabatan |
| **`KP.04.09`** | **MUTASI PEGAWAI**<br>↳ Baperjakat / Pelantikan /Serah Terima Jabatan | `serah terima jabatan`, `mutasi pegawai`, `pelantikan`, `baperjakat` | Administrasi atau permohonan terkait baperjakat / pelantikan /serah terima jabatan |
| **`KP.05.01`** | **PEMBINAAN KARIR PEGAWAI**<br>↳ Analisis Kebutuhan Diklat (Perencanaan dan Monev) | `individual development plan`, `analisis kebutuhan diklat`, `pembinaan karir pegawai`, `rencana diklat tahunan`, `perencanaan dan monev`, `pengembangan kompetensi`, `individual development`, `development plan`, `monev diklat`, `satuan kerja` | Individual Development Plan (IDP) di satuan kerja |
| **`KP.05.02`** | **PEMBINAAN KARIR PEGAWAI**<br>↳ Pembinaan Mental Pegawai | `pembinaan mental pegawai`, `pembinaan karir pegawai` | Administrasi atau permohonan terkait pembinaan mental pegawai |
| **`KP.06.01`** | **PENILAIAN PEGAWAI**<br>↳ Assesment Pegawai / Kompetensi / Seleksi Jabatan | `fit and proper test`, `kebijakan strategis`, `pemetaan kompetensi`, `assessment pegawai`, `kompetensi pegawai`, `assesment pegawai`, `penilaian pegawai`, `pusat kebijakan`, `seleksi jabatan`, `uji kompetensi` | Pengajuan Uji Kompetensi Pegawai Pusat Kebijakan Strategis |
| **`KP.06.02`** | **PENILAIAN PEGAWAI**<br>↳ Ujian Dinas, Ujian Penyesuaian Ijazah | `ujian penyesuaian ijazah`, `penilaian pegawai`, `ujian dinas` | Administrasi atau permohonan terkait ujian dinas, ujian penyesuaian ijazah |
| **`KP.06.03`** | **PENILAIAN PEGAWAI**<br>↳ Disiplin / Teguran / Peringatan / Penundaan Gaji dan Pangkat / Penurunan Pangkat / Skorsing / Hukuman Jabatan | `penundaan gaji dan pangkat`, `penilaian pegawai`, `penurunan pangkat`, `hukuman jabatan`, `peringatan`, `skorsing`, `disiplin`, `teguran` | Administrasi atau permohonan terkait disiplin / teguran / peringatan / penundaan gaji dan pangkat / penurunan pangkat / skorsing / hukuman jabatan |
| **`KP.06.04`** | **PENILAIAN PEGAWAI**<br>↳ Rehabilitasi / Permohonan Kerja Kembali | `permohonan kerja kembali`, `penilaian pegawai`, `rehabilitasi` | Administrasi atau permohonan terkait rehabilitasi / permohonan kerja kembali |
| **`KP.06.05`** | **PENILAIAN PEGAWAI**<br>↳ Absensi / Jam Kerja | `penilaian pegawai`, `jam kerja`, `absensi` | Administrasi atau permohonan terkait absensi / jam kerja |
| **`KP.06.06`** | **PENILAIAN PEGAWAI**<br>↳ SKP / DP3 | `evaluasi kinerja pegawai`, `penilaian prestasi kerja`, `sasaran kinerja pegawai`, `buka akses e-kinerja`, `penilaian pegawai`, `pembukaan akses`, `kinerja bkn`, `e kinerja`, `akses e`, `e-kinerja` | Pembukaan Akses E-Kinerja untuk Pegawai atas nama |
| **`KP.06.07`** | **PENILAIAN PEGAWAI**<br>↳ Angka Kredit Jabatan Fungsional | `angka kredit jabatan fungsional`, `penilaian pegawai` | Administrasi atau permohonan terkait angka kredit jabatan fungsional |
| **`KP.07.01`** | **KESEJAHTERAAN PEGAWAI**<br>↳ Kesehatan / Uji Kesehatan / Medical Check Up/ Klinik | `medical check up`, `kesejahteraan pegawai`, `pemeriksaan kesehatan`, `pelaksanaan medical`, `kesehatan kerja`, `klinik komdigi`, `uji kesehatan`, `medical check`, `check up`, `pelaksanaan` | pelaksanaan medical check-up (MCU) untuk |
| **`KP.07.02`** | **KESEJAHTERAAN PEGAWAI**<br>↳ Taspen / Askes / BPJS / Bapertarum / Kartu Pegawai / Kartu Istri / Kartu Suami | `kesejahteraan pegawai`, `kartu pegawai`, `kartu istri`, `kartu suami`, `bapertarum`, `taspen`, `askes`, `bpjs` | Administrasi atau permohonan terkait taspen / askes / bpjs / bapertarum / kartu pegawai / kartu istri / kartu suami |
| **`KP.07.03`** | **KESEJAHTERAAN PEGAWAI**<br>↳ Olahraga / Kesenian dan Budaya | `kesenian dan budaya`, `kesejahteraan pegawai`, `olahraga` | Administrasi atau permohonan terkait olahraga / kesenian dan budaya |
| **`KP.08.01`** | **PEMBERHENTIAN DAN PENSIUN**<br>↳ Pemberhentian Dengan Hormat / Pensiun Atas Permintaan Sendiri (APS) / Batas Usia Pensiun (BUP) | `pensiun atas permintaan sendiri`, `pemberhentian dengan hormat`, `pemberhentian dan pensiun`, `cuti alasan penting`, `batas usia pensiun`, `cuti melahirkan`, `cuti tahunan`, `cuti sakit`, `cuti besar`, `izin cuti` | Administrasi atau permohonan terkait pemberhentian dengan hormat / pensiun atas permintaan sendiri (aps) / batas usia pensiun (bup) |
| **`KP.08.02`** | **PEMBERHENTIAN DAN PENSIUN**<br>↳ Pemberhentian Dengan Tidak Hormat | `pemberhentian dengan tidak hormat`, `pemberhentian dan pensiun` | Administrasi atau permohonan terkait pemberhentian dengan tidak hormat |
| **`KP.08.03`** | **PEMBERHENTIAN DAN PENSIUN**<br>↳ Pensiun Janda / Duda / Anak / Tewas | `pemberhentian dan pensiun`, `pensiun janda`, `tewas`, `anak`, `duda` | Administrasi atau permohonan terkait pensiun janda / duda / anak / tewas |
| **`KP.09.01`** | **PERKUMPULAN PEGAWAI / NON PEGAWAI**<br>↳ KORPRI | `pelanggaran disiplin`, `perkumpulan pegawai`, `hukuman disiplin`, `panggilan riksa`, `disiplin pns`, `bap disiplin`, `non pegawai`, `hukdis`, `korpri` | Administrasi atau permohonan terkait korpri |
| **`KP.09.02`** | **PERKUMPULAN PEGAWAI / NON PEGAWAI**<br>↳ Dharma Wanita | `perkumpulan pegawai`, `dharma wanita`, `non pegawai` | Administrasi atau permohonan terkait dharma wanita |
| **`KP.09.03`** | **PERKUMPULAN PEGAWAI / NON PEGAWAI**<br>↳ Koperasi | `perkumpulan pegawai`, `non pegawai`, `koperasi` | Administrasi atau permohonan terkait koperasi |
| **`KP.09.04`** | **PERKUMPULAN PEGAWAI / NON PEGAWAI**<br>↳ Organisasi Lainnya | `perkumpulan pegawai`, `organisasi lainnya`, `non pegawai` | Administrasi atau permohonan terkait organisasi lainnya |


### 2.OT [OT] - ORGANISASI DAN TATA LAKSANA
Urusan pokok terkait tata kelola **organisasi dan tata laksana**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`OT.01.01`** | **ORGANISASI**<br>↳ Struktur Organisasi | `evaluasi kelembagaan komdigi`, `penataan kelembagaan`, `struktur organisasi`, `analisis jabatan`, `organisasi`, `sotk` | Pengelolaan terkait struktur organisasi |
| **`OT.01.02`** | **ORGANISASI**<br>↳ Evaluasi Organisasi | `evaluasi organisasi`, `organisasi` | Pengelolaan terkait evaluasi organisasi |
| **`OT.01.03`** | **ORGANISASI**<br>↳ Penataan Organisasi | `penataan organisasi`, `organisasi` | Pengelolaan terkait penataan organisasi |
| **`OT.01.04`** | **ORGANISASI**<br>↳ Monitoring Organisasi | `monitoring organisasi`, `organisasi` | Pengelolaan terkait monitoring organisasi |
| **`OT.02.01`** | **TATA LAKSANA**<br>↳ Proses Bisnis | `standar operasional prosedur`, `peta proses bisnis`, `tata laksana kerja`, `probis kementerian`, `proses bisnis`, `tata laksana`, `sop ap`, `sop` | Pengelolaan terkait proses bisnis |
| **`OT.02.02`** | **TATA LAKSANA**<br>↳ Standar Operational Procedure (SOP) | `standar operational procedure`, `tata laksana`, `sop` | Pengelolaan terkait standar operational procedure (sop) |
| **`OT.02.03`** | **TATA LAKSANA**<br>↳ Budaya Organisasi | `budaya organisasi`, `tata laksana` | Pengelolaan terkait budaya organisasi |
| **`OT.02.04`** | **TATA LAKSANA**<br>↳ International Organization for Standardization (ISO) | `tata laksana`, `iso` | Pengelolaan terkait international organization for standardization (iso) |
| **`OT.03.01`** | **REFORMASI BIROKRASI (RB)**<br>↳ Implementasi RB | `reformasi birokrasi`, `implementasi rb`, `zona integritas`, `rb tematik`, `pmprb`, `wbk`, `wbm` | Pengelolaan terkait implementasi rb |
| **`OT.03.02`** | **REFORMASI BIROKRASI (RB)**<br>↳ Monitoring dan Evaluasi RB | `monitoring dan evaluasi rb`, `reformasi birokrasi` | Pengelolaan terkait monitoring dan evaluasi rb |


### 2.KU [KU] - KEUANGAN
Urusan pokok terkait tata kelola **keuangan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`KU.01.01`** | **ANGGARAN**<br>↳ RAPBN/ APBN (Rencana Kerja Pemerintah, Rencana Kerja Kementerian, Rencana Kerja Anggaran Kementerian, Rencana Anggaran Belanja, Rencana Penyerapan Anggaran, Rencana Penarikan Dana) | `rencana kerja anggaran kementerian`, `rencana penyerapan anggaran`, `tanggapan pemeriksaan bpk`, `rencana kerja kementerian`, `rencana kerja pemerintah`, `rencana anggaran belanja`, `rencana penarikan dana`, `bukti potong pajak`, `usulan ro pnbp`, `kebijakan strategis` | Permintaan Bukti Potong PPh 21 Tahun Pajak; Tanggapan Pusat Kebijakan Strategis |
| **`KU.01.02`** | **ANGGARAN**<br>↳ DIPA (Rincian RKA-KL, Petunjuk Operasional Kegiatan (POK), Pergeseran/ Perubahan/ Revisi DIPA / POK DIPA, APBN, Pagu DIPA, Pagu Minus, Penyerapan/Realisasi Anggaran, UP, TUP, Dispensasi, Penyelesaian Tagihan, Penyelesaian Uang Muka, dan Pengembalian SPM) | `pergeseran belanja perjalanan dinas`, `petunjuk operasional kegiatan`, `penyelesaian uang muka`, `dan pengembalian spm`, `rincian rka kl`, `penyelesaian tagihan`, `penyerapan anggaran`, `pergeseran anggaran`, `realisasi anggaran`, `revisi anggaran` | Usulan Revisi Anggaran pada Pusat |
| **`KU.01.03`** | **ANGGARAN**<br>↳ ABT (Anggaran Belanja Tambahan) | `anggaran belanja tambahan`, `anggaran`, `abt` | Penyampaian dokumen/laporan terkait abt (anggaran belanja tambahan) |
| **`KU.01.04`** | **ANGGARAN**<br>↳ Berita Acara / Berita Acara Serah Terima | `berita acara serah terima`, `berita acara`, `anggaran` | Penyampaian dokumen/laporan terkait berita acara / berita acara serah terima |
| **`KU.01.05`** | **ANGGARAN**<br>↳ Surat Perintah Perjalanan Dinas (SPPD) | `surat perintah perjalanan dinas`, `anggaran`, `sppd` | Penyampaian dokumen/laporan terkait surat perintah perjalanan dinas (sppd) |
| **`KU.01.06`** | **ANGGARAN**<br>↳ SPP / Surat Permintaan Pembayaran (Belanja Pegawai, Belanja Barang, Belanja Modal, Belanja lain-lain) | `surat permintaan pembayaran`, `belanja lain lain`, `belanja pegawai`, `belanja barang`, `belanja modal`, `anggaran`, `spp` | Penyampaian dokumen/laporan terkait spp / surat permintaan pembayaran (belanja pegawai, belanja barang, belanja modal, belanja lain-lain) |
| **`KU.01.07`** | **ANGGARAN**<br>↳ SPM / Surat Perintah Membayar (Belanja Pegawai, Belanja Barang, Belanja Modal, Belanja lain-lain) | `surat perintah membayar`, `belanja lain lain`, `belanja pegawai`, `belanja barang`, `belanja modal`, `anggaran`, `spm` | Penyampaian dokumen/laporan terkait spm / surat perintah membayar (belanja pegawai, belanja barang, belanja modal, belanja lain-lain) |
| **`KU.01.08`** | **ANGGARAN**<br>↳ SP2D (Surat Perintah Pencairan Dana) | `surat perintah pencairan dana`, `anggaran`, `sp2d` | Penyampaian dokumen/laporan terkait sp2d (surat perintah pencairan dana) |
| **`KU.01.09`** | **ANGGARAN**<br>↳ Laporan Keuangan / Rekonsiliasi / Neraca (Triwulan, Semester, Tahunan) | `laporan keuangan`, `rekonsiliasi`, `semester`, `triwulan`, `anggaran`, `tahunan`, `neraca` | Penyampaian dokumen/laporan terkait laporan keuangan / rekonsiliasi / neraca (triwulan, semester, tahunan) |
| **`KU.01.10`** | **ANGGARAN**<br>↳ Daftar Uang Makan/Uang Lembur/Honorarium/ Tunjangan Kinerja | `daftar uang makan`, `tunjangan kinerja`, `uang lembur`, `honorarium`, `anggaran` | Penyampaian dokumen/laporan terkait daftar uang makan/uang lembur/honorarium/ tunjangan kinerja |
| **`KU.01.11`** | **ANGGARAN**<br>↳ Tanda Bukti Perjanjian (Bukti Pembelian, Kuitansi, SPK, Surat Perjanjian dan Surat Tagihan), Laporan Pertanggungjawaban Anggaran | `laporan pertanggungjawaban anggaran`, `tanda bukti perjanjian`, `bukti pembelian`, `kuitansi`, `anggaran`, `spk` | Penyampaian dokumen/laporan terkait tanda bukti perjanjian (bukti pembelian, kuitansi, spk, surat perjanjian dan surat tagihan), laporan pertanggungjawaban anggaran |
| **`KU.01.12`** | **ANGGARAN**<br>↳ Dana Operasional Menteri (DOM) | `dana operasional menteri`, `anggaran`, `dom` | Penyampaian dokumen/laporan terkait dana operasional menteri (dom) |
| **`KU.01.13`** | **ANGGARAN**<br>↳ SP3 (Surat Perintah Pengesahan Pendapatan) | `anggaran`, `sp3` | Penyampaian dokumen/laporan terkait sp3 (surat perintah pengesahan pendapatan) |
| **`KU.01.14`** | **ANGGARAN**<br>↳ Laporan TEPRA (Tim Evaluasi dan Pengawasan Realisasi Anggaran) | `laporan tepra`, `anggaran` | Penyampaian dokumen/laporan terkait laporan tepra (tim evaluasi dan pengawasan realisasi anggaran) |
| **`KU.01.15`** | **ANGGARAN**<br>↳ Sistem Perbendaharaan dan Anggaran Negara (SPAN) | `anggaran`, `span` | Penyampaian dokumen/laporan terkait sistem perbendaharaan dan anggaran negara (span) |
| **`KU.01.16`** | **ANGGARAN**<br>↳ Monev Pelaksanaan Anggaran | `monev pelaksanaan anggaran`, `anggaran` | Penyampaian dokumen/laporan terkait monev pelaksanaan anggaran |
| **`KU.02.01`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Loan Agreement / Hibah Luar Negeri | `hibah luar negeri`, `kekurangan gaji`, `pembayaran gaji`, `loan agreement`, `potongan gaji`, `daftar gaji`, `gaji induk` | Penyampaian dokumen/laporan terkait loan agreement / hibah luar negeri |
| **`KU.02.02`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Ikhtisar Kegiatan | `ikhtisar kegiatan` | Penyampaian dokumen/laporan terkait ikhtisar kegiatan |
| **`KU.02.03`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Kerangka Acuan Kerja | `kerangka acuan kerja` | Penyampaian dokumen/laporan terkait kerangka acuan kerja |
| **`KU.02.04`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Studi Kelayakan | `studi kelayakan` | Penyampaian dokumen/laporan terkait studi kelayakan |
| **`KU.02.05`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Rincian Anggaran Biaya | `rincian anggaran biaya` | Penyampaian dokumen/laporan terkait rincian anggaran biaya |
| **`KU.02.06`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Dokumen Kontrak | `dokumen kontrak` | Penyampaian dokumen/laporan terkait dokumen kontrak |
| **`KU.02.07`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Reimburstment Kepada Negara / Badan Pemberian Bantuan | `reimburstment kepada negara`, `badan pemberian bantuan` | Penyampaian dokumen/laporan terkait reimburstment kepada negara / badan pemberian bantuan |
| **`KU.02.08`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ SPP/SPM | `spm`, `spp` | Penyampaian dokumen/laporan terkait spp/spm |
| **`KU.02.09`** | **BANTUAN DAN PINJAMAN LUAR NEGERI**<br>↳ Pembukaan LC (Letter of Credit) / Valuta Asing / Penerbitan / Obligasi | `letter of credit`, `valuta asing`, `pembukaan lc`, `penerbitan`, `obligasi` | Penyampaian dokumen/laporan terkait pembukaan lc (letter of credit) / valuta asing / penerbitan / obligasi |
| **`KU.03.01`** | **PENDAPATAN/PENERIMAAN**<br>↳ Pajak | `penerimaan negara bukan pajak`, `piutang pnbp`, `setoran pnbp`, `tarif pnbp`, `pendapatan`, `penerimaan`, `pajak`, `pnbp` | Penyampaian dokumen/laporan terkait pajak |
| **`KU.03.02`** | **PENDAPATAN/PENERIMAAN**<br>↳ Penerimaan Negara Bukan Pajak (PNBP) | `penerimaan negara bukan pajak`, `pendapatan`, `penerimaan`, `pnbp` | Penyampaian dokumen/laporan terkait penerimaan negara bukan pajak (pnbp) |
| **`KU.03.03`** | **PENDAPATAN/PENERIMAAN**<br>↳ Sewa Pemanfaatan Aset / Barang Milik Negara | `pemanfaatan aset negara`, `sewa pemanfaatan aset`, `gedung sapta pesona`, `barang milik negara`, `pemeliharaan gedung`, `renovasi ruangan`, `room renovation`, `pesona building`, `renovation on`, `sapta pesona` | Notice of Room Renovation on the 13th Floor of Sapta Pesona Building |
| **`KU.04.01`** | **PERBENDAHARAAN / Verifikasi**<br>↳ Tuntutan Perbendaharaan/Tuntutan Ganti Rugi (TP/TGR) | `laporan realisasi anggaran`, `tuntutan ganti rugi`, `tuntutan perbendaharaan`, `rekonsiliasi keuangan`, `laporan keuangan`, `rekomendasi bpk`, `tanggapan bpk`, `perbendaharaan`, `verifikasi`, `neraca` | Penyampaian dokumen/laporan terkait tuntutan perbendaharaan/tuntutan ganti rugi (tp/tgr) |
| **`KU.04.02`** | **PERBENDAHARAAN / Verifikasi**<br>↳ Rencana Kerja Anggaran (RKA) | `rencana kerja anggaran`, `perbendaharaan`, `verifikasi`, `rka` | Penyampaian dokumen/laporan terkait rencana kerja anggaran (rka) |
| **`KU.04.03`** | **PERBENDAHARAAN / Verifikasi**<br>↳ Pertanggungjawaban Keuangan (SPP, SPM, SP2D, SP3, GU, LS, BKU, LPJ) | `pertanggungjawaban keuangan`, `perbendaharaan`, `verifikasi`, `sp2d`, `bku`, `sp3`, `spm`, `lpj`, `spp` | Penyampaian dokumen/laporan terkait pertanggungjawaban keuangan (spp, spm, sp2d, sp3, gu, ls, bku, lpj) |
| **`KU.05.01`** | **PENGELOLA KEUANGAN**<br>↳ Pejabat Perbendaharaan/Pengelola Anggaran (Kuasa Penggunaan Anggaran/ KPA, Pejabat Pembuat Komitmen/ PPK, Pejabat Penandatangan Surat Perintah Membayar / PPSPM, Pejabat Penguji, Bendahara Pengeluaran, Bendahara Penerima, Bendahara Pembantu Pengeluaran, Pejabat Pengadaan, Pajabat/Panitia Penerima Hasil Pekerjaan/ PPHP, Petugas Pengelola Administrasi Belanja Pegawai, Staf KPA, Staf PPK, dan Staf Bendahara) | `panitia penerima hasil pekerjaan`, `bendahara pembantu pengeluaran`, `kuasa penggunaan anggaran`, `pejabat pembuat komitmen`, `dan staf bendahara`, `pejabat perbendaharaan`, `bendahara pengeluaran`, `pengelola keuangan`, `bendahara penerima`, `pengelola anggaran` | Penyampaian dokumen/laporan terkait pejabat perbendaharaan/pengelola anggaran (kuasa penggunaan anggaran/ kpa, pejabat pembuat komitmen/ ppk, pejabat penandatangan surat perintah membayar / ppspm, pejabat penguji, bendahara pengeluaran, bendahara penerima, bendahara pembantu pengeluaran, pejabat pengadaan, pajabat/panitia penerima hasil pekerjaan/ pphp, petugas pengelola administrasi belanja pegawai, staf kpa, staf ppk, dan staf bendahara) |


### 2.HK [HK] - HUKUM
Urusan pokok terkait tata kelola **hukum**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`HK.01.01`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Undang-Undang Dasar | `program penyusunan undang-undang`, `undang undang dasar`, `rancangan undang-undang`, `prolegnas`, `lembaga`, `ruu` | Pengelolaan terkait undang-undang dasar |
| **`HK.01.02`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Ketetapan MPR | `ketetapan mpr`, `lembaga` | Pengelolaan terkait ketetapan mpr |
| **`HK.01.03`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Undang-Undang | `undang undang`, `lembaga` | Pengelolaan terkait undang-undang |
| **`HK.01.04`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Peraturan Pemerintah Pengganti Undang Undang | `lembaga` | Pengelolaan terkait peraturan pemerintah pengganti undang undang |
| **`HK.01.05`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Peraturan Pemerintah | `peraturan pemerintah`, `lembaga` | Pengelolaan terkait peraturan pemerintah |
| **`HK.01.06`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Peraturan Presiden | `peraturan presiden`, `lembaga` | Pengelolaan terkait peraturan presiden |
| **`HK.01.07`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Keputusan Presiden | `keputusan presiden`, `lembaga` | Pengelolaan terkait keputusan presiden |
| **`HK.01.08`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Instruksi Presiden | `instruksi presiden`, `lembaga` | Pengelolaan terkait instruksi presiden |
| **`HK.01.09`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Peraturan Daerah | `peraturan daerah`, `lembaga` | Pengelolaan terkait peraturan daerah |
| **`HK.01.10`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Keputusan / Peraturan Lembaga / Badan | `peraturan lembaga`, `keputusan`, `lembaga`, `badan` | Pengelolaan terkait keputusan / peraturan lembaga / badan |
| **`HK.01.11`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN / LEMBAGA**<br>↳ Peraturan Lainnya | `peraturan lainnya`, `lembaga` | Pengelolaan terkait peraturan lainnya |
| **`HK.02.01`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Peraturan Menteri | `rancangan peraturan menteri`, `telaah hukum regulasi`, `uji publik rpm`, `peraturan menkomdigi`, `harmonisasi permen`, `peraturan menteri`, `rpm` | Pengelolaan terkait peraturan menteri |
| **`HK.02.02`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Menteri | `keputusan menteri` | Pengelolaan terkait keputusan menteri |
| **`HK.02.03`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Instruksi Menteri | `instruksi menteri` | Pengelolaan terkait instruksi menteri |
| **`HK.02.04`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Sekretaris Jenderal | `keputusan sekretaris jenderal` | Pengelolaan terkait keputusan sekretaris jenderal |
| **`HK.02.05`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Inspektur Jenderal | `keputusan inspektur jenderal` | Pengelolaan terkait keputusan inspektur jenderal |
| **`HK.02.06`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan / Peraturan Direktur Jenderal | `peraturan direktur jenderal`, `keputusan` | Pengelolaan terkait keputusan / peraturan direktur jenderal |
| **`HK.02.07`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Kepala Badan | `keputusan kepala badan` | Pengelolaan terkait keputusan kepala badan |
| **`HK.02.08`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Surat Edaran Menteri | `surat edaran menteri` | Pengelolaan terkait surat edaran menteri |
| **`HK.02.09`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Surat Edaran Eselon I | `surat edaran eselon i` | Pengelolaan terkait surat edaran eselon i |
| **`HK.02.10`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Pedoman | `pedoman` | Pengelolaan terkait pedoman |
| **`HK.03.01`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Peraturan Menteri | `judicial review mahkamah agung`, `bantuan hukum asn`, `sengketa informasi`, `peraturan menteri`, `gugatan perdata`, `advokasi hukum`, `ptun` | Pengelolaan terkait peraturan menteri |
| **`HK.03.02`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Menteri | `keputusan menteri` | Pengelolaan terkait keputusan menteri |
| **`HK.03.03`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Instruksi Menteri | `instruksi menteri` | Pengelolaan terkait instruksi menteri |
| **`HK.03.04`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Sekretaris Jenderal | `keputusan sekretaris jenderal` | Pengelolaan terkait keputusan sekretaris jenderal |
| **`HK.03.05`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Inspektur Jenderal | `keputusan inspektur jenderal` | Pengelolaan terkait keputusan inspektur jenderal |
| **`HK.03.06`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan / Peraturan Direktur Jenderal | `peraturan direktur jenderal`, `keputusan` | Pengelolaan terkait keputusan / peraturan direktur jenderal |
| **`HK.03.07`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan / Peraturan Gubernur, Perda, KPU | `peraturan gubernur`, `keputusan`, `perda`, `kpu` | Pengelolaan terkait keputusan / peraturan gubernur, perda, kpu |
| **`HK.03.08`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Keputusan Lembaga/Badan | `keputusan lembaga`, `badan` | Pengelolaan terkait keputusan lembaga/badan |
| **`HK.03.09`** | **PERATURAN PERUNDANG-UNDANGAN PRODUK DI LUAR KEMENTERIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Surat Edaran (Surat Edaran Menteri, Surat Edaran Eselon I) | `surat edaran eselon i`, `surat edaran menteri`, `surat edaran` | Pengelolaan terkait surat edaran (surat edaran menteri, surat edaran eselon i) |
| **`HK.04.01`** | **PERATURAN BERSAMA / SURAT EDARAN BERSAMA DAN KESEPAKATAN BERSAMA (MoU) / KERJASAMA/ PERJANJIAN**<br>↳ Luar Negeri | `penandatanganan kesepakatan bersama`, `perjanjian kerja sama`, `peraturan bersama`, `nota kesepahaman`, `luar negeri`, `perjanjian`, `kerjasama`, `mou`, `pks` | Pengelolaan terkait luar negeri |
| **`HK.04.02`** | **PERATURAN BERSAMA / SURAT EDARAN BERSAMA DAN KESEPAKATAN BERSAMA (MoU) / KERJASAMA/ PERJANJIAN**<br>↳ Dalam Negeri | `peraturan bersama`, `dalam negeri`, `perjanjian`, `kerjasama` | Pengelolaan terkait dalam negeri |
| **`HK.05.01`** | **PERDATA**<br>↳ Perdata Umum (Tentang Orang / Pengaduan / Somasi / Sengketa / Perlindungan Hukum) | `perlindungan hukum`, `tentang orang`, `perdata umum`, `pengaduan`, `sengketa`, `perdata`, `somasi` | Pengelolaan terkait perdata umum (tentang orang / pengaduan / somasi / sengketa / perlindungan hukum) |
| **`HK.05.02`** | **PERDATA**<br>↳ Perdata Khusus (Niaga / Pajak) | `perdata khusus`, `perdata`, `pajak`, `niaga` | Pengelolaan terkait perdata khusus (niaga / pajak) |
| **`HK.05.03`** | **PERDATA**<br>↳ Berkas Proses Persidangan di Peradilan / Gugatan / Jawaban / Replik / Duplik / Kesimpulan / Putusan | `kesimpulan`, `perdata`, `gugatan`, `jawaban`, `putusan`, `replik`, `duplik` | Pengelolaan terkait berkas proses persidangan di peradilan / gugatan / jawaban / replik / duplik / kesimpulan / putusan |
| **`HK.05.04`** | **PERDATA**<br>↳ Pelaksanaan Putusan Peradilan | `pelaksanaan putusan peradilan`, `perdata` | Pengelolaan terkait pelaksanaan putusan peradilan |
| **`HK.06.01`** | **PIDANA**<br>↳ Pidana Umum | `pidana umum`, `pidana` | Pengelolaan terkait pidana umum |
| **`HK.06.02`** | **PIDANA**<br>↳ Pidana Khusus | `pidana khusus`, `pidana` | Pengelolaan terkait pidana khusus |
| **`HK.06.03`** | **PIDANA**<br>↳ Berkas Proses persidangan di Peradilan / Tuntutan / Jawaban / Saksi / Kesimpulan / Putusan | `kesimpulan`, `tuntutan`, `jawaban`, `putusan`, `pidana`, `saksi` | Pengelolaan terkait berkas proses persidangan di peradilan / tuntutan / jawaban / saksi / kesimpulan / putusan |
| **`HK.07.01`** | **TATA USAHA / ADMINISTRASI NEGARA**<br>↳ Banding Administrasi | `banding administrasi`, `administrasi negara`, `tata usaha` | Pengelolaan terkait banding administrasi |
| **`HK.07.02`** | **TATA USAHA / ADMINISTRASI NEGARA**<br>↳ Berkas Proses persidangan di Peradilan / Gugatan / Jawaban / Replik / Duplik / Kesimpulan / Putusan | `administrasi negara`, `tata usaha`, `kesimpulan`, `gugatan`, `jawaban`, `putusan`, `replik`, `duplik` | Pengelolaan terkait berkas proses persidangan di peradilan / gugatan / jawaban / replik / duplik / kesimpulan / putusan |
| **`HK.08.01`** | **JUDISIAL REVIU PERUNDANG-UNDANGAN**<br>↳ Judisial Reviu Undang-Undang terhadap Undang-Undang Dasar | `judisial reviu perundang undangan` | Pengelolaan terkait judisial reviu undang-undang terhadap undang-undang dasar |
| **`HK.08.02`** | **JUDISIAL REVIU PERUNDANG-UNDANGAN**<br>↳ Judisial Reviu Perundang-Undangan di bawah Undang-Undang terhadap Undang-Undang | `judisial reviu perundang undangan` | Pengelolaan terkait judisial reviu perundang-undangan di bawah undang-undang terhadap undang-undang |
| **`HK.09.01`** | **PERIZINAN**<br>↳ Pemberian / Persetujuan / Kewenangan / Rekomendasi | `rekomendasi`, `persetujuan`, `kewenangan`, `pemberian`, `perizinan` | Pengelolaan terkait pemberian / persetujuan / kewenangan / rekomendasi |
| **`HK.09.02`** | **PERIZINAN**<br>↳ Penolakan | `perizinan`, `penolakan` | Pengelolaan terkait penolakan |
| **`HK.09.03`** | **PERIZINAN**<br>↳ Peringatan | `peringatan`, `perizinan` | Pengelolaan terkait peringatan |
| **`HK.09.04`** | **PERIZINAN**<br>↳ Pencabutan | `pencabutan`, `perizinan` | Pengelolaan terkait pencabutan |
| **`HK.09.05`** | **PERIZINAN**<br>↳ Perpanjangan Izin | `perpanjangan izin`, `perizinan` | Pengelolaan terkait perpanjangan izin |
| **`HK.09.06`** | **PERIZINAN**<br>↳ Dispensasi | `dispensasi`, `perizinan` | Pengelolaan terkait dispensasi |
| **`HK.10.01`** | **SURAT KUASA**<br>↳ Surat Kuasa Khusus | `surat kuasa khusus`, `surat kuasa` | Pengelolaan terkait surat kuasa khusus |
| **`HK.10.02`** | **SURAT KUASA**<br>↳ Surat Kuasa Subtitusi | `surat kuasa subtitusi`, `surat kuasa` | Pengelolaan terkait surat kuasa subtitusi |
| **`HK.10.03`** | **SURAT KUASA**<br>↳ Surat Kuasa Lainnya | `surat kuasa lainnya`, `surat kuasa` | Pengelolaan terkait surat kuasa lainnya |


### 2.UM [UM] - UMUM
Urusan pokok terkait tata kelola **umum**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`UM.01.01`** | **TATA USAHA**<br>↳ Pendistribusian Surat | `pendistribusian surat`, `tata usaha` | Pengelolaan terkait pendistribusian surat |
| **`UM.01.02`** | **TATA USAHA**<br>↳ Pengiriman Surat/Barang Tercetak dan Terekam | `barang tercetak dan terekam`, `pengiriman surat`, `tata usaha` | Pengelolaan terkait pengiriman surat/barang tercetak dan terekam |
| **`UM.01.03`** | **TATA USAHA**<br>↳ Rapat Pimpinan | `rapat pimpinan`, `tata usaha` | Pengelolaan terkait rapat pimpinan |
| **`UM.02.01`** | **RUMAH TANGGA**<br>↳ Kebersihan, Ketertiban dan Keamanan | `ketertiban dan keamanan`, `rumah tangga`, `kebersihan` | Pengelolaan terkait kebersihan, ketertiban dan keamanan |
| **`UM.02.02`** | **RUMAH TANGGA**<br>↳ Izin peminjaman (Alat-alat, Ruangan, Lapangan, dll) | `izin peminjaman`, `rumah tangga`, `alat alat`, `lapangan`, `ruangan`, `dll` | Pengelolaan terkait izin peminjaman (alat-alat, ruangan, lapangan, dll) |
| **`UM.02.03`** | **RUMAH TANGGA**<br>↳ Rumah Dinas/Kendaraan Dinas | `kendaraan dinas`, `rumah tangga`, `rumah dinas` | Pengelolaan terkait rumah dinas/kendaraan dinas |
| **`UM.02.04`** | **RUMAH TANGGA**<br>↳ Gedung/Perkantoran/Gudang | `rumah tangga`, `perkantoran`, `gedung`, `gudang` | Pengelolaan terkait gedung/perkantoran/gudang |
| **`UM.02.05`** | **RUMAH TANGGA**<br>↳ Pakaian Dinas | `pakaian dinas`, `rumah tangga` | Pengelolaan terkait pakaian dinas |
| **`UM.02.06`** | **RUMAH TANGGA**<br>↳ Listrik/PAM/Telepon/AC/Lift, dll. | `rumah tangga`, `listrik`, `telepon`, `lift`, `dll.`, `pam` | Pengelolaan terkait listrik/pam/telepon/ac/lift, dll. |
| **`UM.02.07`** | **RUMAH TANGGA**<br>↳ Sumbangan / Bantuan | `rumah tangga`, `sumbangan`, `bantuan` | Pengelolaan terkait sumbangan / bantuan |
| **`UM.03.01`** | **KEARSIPAN**<br>↳ Pembinaan Kearsipan | `pembinaan kearsipan`, `kearsipan` | Pengelolaan terkait pembinaan kearsipan |
| **`UM.03.02`** | **KEARSIPAN**<br>↳ Penyusunan Sistem Kearsipan | `penyusunan sistem kearsipan`, `kearsipan` | Pengelolaan terkait penyusunan sistem kearsipan |
| **`UM.03.03`** | **KEARSIPAN**<br>↳ Pemindahan | `pemindahan`, `kearsipan` | Pengelolaan terkait pemindahan |
| **`UM.03.04`** | **KEARSIPAN**<br>↳ Pemusnahan | `pemusnahan`, `kearsipan` | Pengelolaan terkait pemusnahan |
| **`UM.03.05`** | **KEARSIPAN**<br>↳ Penyerahan | `penyerahan`, `kearsipan` | Pengelolaan terkait penyerahan |
| **`UM.03.06`** | **KEARSIPAN**<br>↳ Pemeliharaan | `pemeliharaan`, `kearsipan` | Pengelolaan terkait pemeliharaan |
| **`UM.03.07`** | **KEARSIPAN**<br>↳ Berkas Proses Alih Media Arsip/Arsip Elektronik | `arsip elektronik`, `kearsipan` | Pengelolaan terkait berkas proses alih media arsip/arsip elektronik |
| **`UM.03.08`** | **KEARSIPAN**<br>↳ Berita Acara (Pemusnahan, Pemindahan, dan Penyerahan) | `dan penyerahan`, `berita acara`, `pemusnahan`, `pemindahan`, `kearsipan` | Pengelolaan terkait berita acara (pemusnahan, pemindahan, dan penyerahan) |
| **`UM.03.09`** | **KEARSIPAN**<br>↳ Layanan Kearsipan (Peminjaman dan Penggunaan Arsip) | `peminjaman dan penggunaan arsip`, `layanan kearsipan`, `kearsipan` | Pengelolaan terkait layanan kearsipan (peminjaman dan penggunaan arsip) |
| **`UM.03.10`** | **KEARSIPAN**<br>↳ Audit Kearsipan | `audit kearsipan`, `kearsipan` | Pengelolaan terkait audit kearsipan |


### 2.PL [PL] - PERLENGKAPAN
Urusan pokok terkait tata kelola **perlengkapan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`PL.01.01`** | **PENGGUNAAN BARANG MILIK NEGARA**<br>↳ Alih Status penggunaan Barang Milik Negara | `penggunaan barang milik negara`, `usulan kebutuhan aset`, `rkbmn pengadaan` | Pengelolaan aset atau usulan alih status penggunaan barang milik negara |
| **`PL.01.02`** | **PENGGUNAAN BARANG MILIK NEGARA**<br>↳ Penetapan status penggunaan Barang Milik Negara | `penggunaan barang milik negara`, `penetapan status penggunaan`, `status penggunaan aset`, `penetapan status bmn`, `status penggunaan`, `penetapan status`, `penggunaan bmn`, `di lingkunga`, `lingkunga n`, `bmn satker` | Penetapan Status Penggunaan BMN di Lingkunga n |
| **`PL.01.03`** | **PENGGUNAAN BARANG MILIK NEGARA**<br>↳ Penggunaan sementara Barang Milik Negara | `penggunaan barang milik negara` | Pengelolaan aset atau usulan penggunaan sementara barang milik negara |
| **`PL.01.04`** | **PENGGUNAAN BARANG MILIK NEGARA**<br>↳ Laporan Penggunaan Barang Milik Negara | `penggunaan barang milik negara` | Pengelolaan aset atau usulan laporan penggunaan barang milik negara |
| **`PL.02.01`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Sewa Barang Milik Negara | `pemanfaatan barang milik negara`, `sewa barang milik negara`, `pengeluaran barang persediaan`, `penyimpanan bmn`, `stok opname`, `gudang bmn` | Pengelolaan aset atau usulan sewa barang milik negara |
| **`PL.02.02`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Pinjam Pakai Barang Milik Negara | `pemanfaatan barang milik negara` | Pengelolaan aset atau usulan pinjam pakai barang milik negara |
| **`PL.02.03`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Kerjasama Pemanfaatan Barang Milik Negara | `pemanfaatan barang milik negara` | Pengelolaan aset atau usulan kerjasama pemanfaatan barang milik negara |
| **`PL.02.04`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Bangun Guna Serah/Bangun Serah Guna | `pemanfaatan barang milik negara`, `bangun serah guna`, `bangun guna serah` | Pengelolaan aset atau usulan bangun guna serah/bangun serah guna |
| **`PL.02.05`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Kerjasama Penyediaan Infrastruktur | `pemanfaatan barang milik negara`, `kerjasama penyediaan infrastruktur` | Pengelolaan aset atau usulan kerjasama penyediaan infrastruktur |
| **`PL.02.06`** | **PEMANFAATAN BARANG MILIK NEGARA (BMN)**<br>↳ Laporan Pemanfaatan Barang Milik Negara | `pemanfaatan barang milik negara` | Pengelolaan aset atau usulan laporan pemanfaatan barang milik negara |
| **`PL.03.01`** | **PENGAMANAN DAN PEMELIHARAAN BARANG MILIK NEGARA**<br>↳ Sertifikasi / Penyimpanan / Pergudangan Barang Milik Negara | `pergudangan barang milik negara`, `pemeliharaan gedung kantor`, `servis kendaraan dinas`, `pemeliharaan bmn`, `perbaikan ac`, `penyimpanan`, `sertifikasi` | Pengelolaan aset atau usulan sertifikasi / penyimpanan / pergudangan barang milik negara |
| **`PL.03.02`** | **PENGAMANAN DAN PEMELIHARAAN BARANG MILIK NEGARA**<br>↳ Pemeliharaan Barang Milik Negara | `pemeliharaan barang milik negara` | Pengelolaan aset atau usulan pemeliharaan barang milik negara |
| **`PL.03.03`** | **PENGAMANAN DAN PEMELIHARAAN BARANG MILIK NEGARA**<br>↳ Laporan Pengamanan dan/atau Pemeliharaan Barang Milik Negara | `laporan pengamanan dan` | Pengelolaan aset atau usulan laporan pengamanan dan/atau pemeliharaan barang milik negara |
| **`PL.04.01`** | **PEMINDAHTANGANAN BARANG MILIK NEGARA**<br>↳ Penjualan Barang Milik Negara | `penjualan barang milik negara` | Pengelolaan aset atau usulan penjualan barang milik negara |
| **`PL.04.02`** | **PEMINDAHTANGANAN BARANG MILIK NEGARA**<br>↳ Tukar Menukar Barang Milik Negara |  | Pengelolaan aset atau usulan tukar menukar barang milik negara |
| **`PL.04.03`** | **PEMINDAHTANGANAN BARANG MILIK NEGARA**<br>↳ Hibah Barang Milik Negara | `hibah barang milik negara` | Pengelolaan aset atau usulan hibah barang milik negara |
| **`PL.04.04`** | **PEMINDAHTANGANAN BARANG MILIK NEGARA**<br>↳ Penyertaan Modal Pemerintah Pusat/Daerah | `penyertaan modal pemerintah pusat`, `daerah` | Pengelolaan aset atau usulan penyertaan modal pemerintah pusat/daerah |
| **`PL.04.05`** | **PEMINDAHTANGANAN BARANG MILIK NEGARA**<br>↳ Laporan Pemindahtanganan Barang Milik Negara |  | Pengelolaan aset atau usulan laporan pemindahtanganan barang milik negara |
| **`PL.05.01`** | **PENGHAPUSAN BARANG MILIK NEGARA**<br>↳ Pemusnahan Barang Milik Negara | `penghapusan barang milik negara`, `pemusnahan barang milik negara` | Pengelolaan aset atau usulan pemusnahan barang milik negara |
| **`PL.05.02`** | **PENGHAPUSAN BARANG MILIK NEGARA**<br>↳ Penghapusan Barang Milik Negara | `penghapusan barang milik negara` | Pengelolaan aset atau usulan penghapusan barang milik negara |
| **`PL.05.03`** | **PENGHAPUSAN BARANG MILIK NEGARA**<br>↳ Laporan Penghapusan Barang Milik Negara | `penghapusan barang milik negara` | Pengelolaan aset atau usulan laporan penghapusan barang milik negara |
| **`PL.06.01`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Inventarisasi Barang Milik Negara | `inventarisasi barang milik negara`, `inventarisasi aset`, `pembukuan bmn`, `sensus bmn`, `sakti bmn`, `siman` | Pengelolaan aset atau usulan inventarisasi barang milik negara |
| **`PL.06.02`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Tukar Menukar Barang Milik Negara |  | Pengelolaan aset atau usulan tukar menukar barang milik negara |
| **`PL.06.03`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Penilaian Barang Milik Negara | `penilaian barang milik negara` | Pengelolaan aset atau usulan penilaian barang milik negara |
| **`PL.06.04`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Laporan Hasil Inventariasi Barang Milik Negara |  | Pengelolaan aset atau usulan laporan hasil inventariasi barang milik negara |
| **`PL.06.05`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Pencatatan Barang Milik Negara | `pencatatan barang milik negara`, `surat pemindahtanganan rkbmn`, `surat pemanfaatan rkbmn`, `surat penghapusan rkbmn`, `surat penggunaan rkbmn`, `rencana kebutuhan bmn`, `pemindahtanganan rkbmn`, `pemindahtanganan aset`, `penghapusan rkbmn`, `pemanfaatan rkbmn` | Surat Pemindahtanganan RKBMN Pusaka; Surat Penggunaan RKBMN Pusaka |
| **`PL.06.06`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Laporan Barang Milik Negara | `laporan barang milik negara` | Pengelolaan aset atau usulan laporan barang milik negara |
| **`PL.06.07`** | **INVENTARISASI DAN PELAPORAN BARANG MILIK NEGARA**<br>↳ Barang Milik Negara Berupa Rumah Negara |  | Pengelolaan aset atau usulan barang milik negara berupa rumah negara |
| **`PL.07.01`** | **PEMBINAAN, PENGAWASAN DAN PENGENDALIAN BARANG MILIK NEGARA**<br>↳ Pembinaan Pengelolaan Barang Milik Negara | `pembinaan` | Pengelolaan aset atau usulan pembinaan pengelolaan barang milik negara |
| **`PL.07.02`** | **PEMBINAAN, PENGAWASAN DAN PENGENDALIAN BARANG MILIK NEGARA**<br>↳ Pemantauan dan Penertiban Barang Milik Negara | `pembinaan` | Pengelolaan aset atau usulan pemantauan dan penertiban barang milik negara |
| **`PL.07.03`** | **PEMBINAAN, PENGAWASAN DAN PENGENDALIAN BARANG MILIK NEGARA**<br>↳ Laporan Pembinaan Pengelolaan Barang Milik Negara | `pembinaan` | Pengelolaan aset atau usulan laporan pembinaan pengelolaan barang milik negara |
| **`PL.07.04`** | **PEMBINAAN, PENGAWASAN DAN PENGENDALIAN BARANG MILIK NEGARA**<br>↳ Laporan Pengawasan dan pengendalian Barang Milik Negara | `pembinaan` | Pengelolaan aset atau usulan laporan pengawasan dan pengendalian barang milik negara |


### 2.UP [UP] - UNIT PENGADAAN
Urusan pokok terkait tata kelola **unit pengadaan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`UP.01.01`** | **PENGADAAN**<br>↳ Rencana Umum Pengadaan (RUP) | `rencana umum pengadaan`, `pengadaan`, `rup` | Pengelolaan terkait rencana umum pengadaan (rup) |
| **`UP.01.02`** | **PENGADAAN**<br>↳ Rekanan / Penawaran / Proposal / Brosur | `penawaran`, `pengadaan`, `proposal`, `rekanan`, `brosur` | Pengelolaan terkait rekanan / penawaran / proposal / brosur |
| **`UP.01.03`** | **PENGADAAN**<br>↳ Swakelola | `swakelola`, `pengadaan` | Pengelolaan terkait swakelola |
| **`UP.01.04`** | **PENGADAAN**<br>↳ Penyedia | `pengadaan`, `penyedia` | Pengelolaan terkait penyedia |
| **`UP.01.05`** | **PENGADAAN**<br>↳ Monev | `pengadaan`, `monev` | Pengelolaan terkait monev |
| **`UP.01.06`** | **PENGADAAN**<br>↳ Pembinaan Barang dan Jasa | `pembinaan barang dan jasa`, `pengadaan` | Pengelolaan terkait pembinaan barang dan jasa |


### 2.HM [HM] - INFORMASI DAN HUBUNGAN MASYARAKAT
Urusan pokok terkait tata kelola **informasi dan hubungan masyarakat**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`HM.01.01`** | **PELAYANAN MEDIA ONLINE**<br>↳ Layanan Permohonan Informasi | `layanan permohonan informasi`, `pelayanan media online`, `klarifikasi berita`, `peliputan berita`, `media relations`, `konferensi pers`, `press release`, `siaran pers` | Pengelolaan terkait layanan permohonan informasi |
| **`HM.01.02`** | **PELAYANAN MEDIA ONLINE**<br>↳ Layanan Keberatan Informasi | `layanan keberatan informasi`, `pelayanan media online` | Pengelolaan terkait layanan keberatan informasi |
| **`HM.01.03`** | **PELAYANAN MEDIA ONLINE**<br>↳ Layanan Penyelesaian Sengketa Informasi | `pelayanan media online` | Pengelolaan terkait layanan penyelesaian sengketa informasi |
| **`HM.01.04`** | **PELAYANAN MEDIA ONLINE**<br>↳ Monitoring Layanan Informasi | `monitoring layanan informasi`, `pelayanan media online` | Pengelolaan terkait monitoring layanan informasi |
| **`HM.01.05`** | **PELAYANAN MEDIA ONLINE**<br>↳ Laporan Layanan Informasi: Bulanan dan Tahunan | `pelayanan media online` | Pengelolaan terkait laporan layanan informasi: bulanan dan tahunan |
| **`HM.01.06`** | **PELAYANAN MEDIA ONLINE**<br>↳ Layanan Informasi Media Call Center | `pelayanan media online` | Pengelolaan terkait layanan informasi media call center |
| **`HM.02.01`** | **PELAYANAN MEDIA KONVENSIONAL (PAMERAN)**<br>↳ Layanan Informasi Media Tercetak | `layanan informasi media tercetak`, `keterbukaan informasi publik`, `pelayanan media konvensional`, `permohonan informasi publik`, `komisi informasi`, `sengketa ppid`, `pameran`, `ppid` | Pengelolaan terkait layanan informasi media tercetak |
| **`HM.02.02`** | **PELAYANAN MEDIA KONVENSIONAL (PAMERAN)**<br>↳ Layanan Informasi Media Elektronik | `layanan informasi media elektronik`, `pelayanan media konvensional`, `pameran` | Pengelolaan terkait layanan informasi media elektronik |
| **`HM.02.03`** | **PELAYANAN MEDIA KONVENSIONAL (PAMERAN)**<br>↳ Layanan Informasi Media Langsung | `layanan informasi media langsung`, `pelayanan media konvensional`, `pameran` | Pengelolaan terkait layanan informasi media langsung |
| **`HM.03.01`** | **HUBUNGAN MASYARAKAT**<br>↳ Dengar Pendapat/Hearing DPR | `hubungan masyarakat`, `dengar pendapat`, `hearing dpr` | Pengelolaan terkait dengar pendapat/hearing dpr |
| **`HM.03.02`** | **HUBUNGAN MASYARAKAT**<br>↳ Bakohumas | `hubungan masyarakat`, `bakohumas` | Pengelolaan terkait bakohumas |
| **`HM.03.03`** | **HUBUNGAN MASYARAKAT**<br>↳ Ucapan: Terimakasih, Selamat, dll | `ucapan: terimakasih`, `hubungan masyarakat`, `selamat`, `dll` | Pengelolaan terkait ucapan: terimakasih, selamat, dll |
| **`HM.03.04`** | **HUBUNGAN MASYARAKAT**<br>↳ Hubungan dengan Organisasi Kemasyarakatan: KIM | `hubungan masyarakat` | Pengelolaan terkait hubungan dengan organisasi kemasyarakatan: kim |
| **`HM.03.05`** | **HUBUNGAN MASYARAKAT**<br>↳ Hubungan dengan Komunikasi Internal | `hubungan dengan komunikasi internal`, `hubungan masyarakat` | Pengelolaan terkait hubungan dengan komunikasi internal |
| **`HM.03.06`** | **HUBUNGAN MASYARAKAT**<br>↳ Hubungan Komunikasi Eksternal: Dialog Interaktif TV, Radio, dan SMS Blast | `dan sms blast`, `hubungan masyarakat`, `radio` | Pengelolaan terkait hubungan komunikasi eksternal: dialog interaktif tv, radio, dan sms blast |
| **`HM.04.01`** | **KEPROTOKOLAN**<br>↳ Upacara | `keprotokolan`, `upacara` | Pengelolaan terkait upacara |
| **`HM.04.02`** | **KEPROTOKOLAN**<br>↳ Acara Kedinasan | `acara kedinasan`, `keprotokolan` | Pengelolaan terkait acara kedinasan |
| **`HM.04.03`** | **KEPROTOKOLAN**<br>↳ Kunjungan | `keprotokolan`, `kunjungan` | Pengelolaan terkait kunjungan |
| **`HM.04.04`** | **KEPROTOKOLAN**<br>↳ Agenda Pimpinan | `agenda pimpinan`, `keprotokolan` | Pengelolaan terkait agenda pimpinan |
| **`HM.05.01`** | **PUBLIKASI**<br>↳ Liputan/Pemberitaan | `pemberitaan`, `publikasi`, `liputan` | Pengelolaan terkait liputan/pemberitaan |
| **`HM.05.02`** | **PUBLIKASI**<br>↳ Jumpa Pers | `jumpa pers`, `publikasi` | Pengelolaan terkait jumpa pers |
| **`HM.05.03`** | **PUBLIKASI**<br>↳ Wawancara | `wawancara`, `publikasi` | Pengelolaan terkait wawancara |
| **`HM.05.04`** | **PUBLIKASI**<br>↳ Kliping | `publikasi`, `kliping` | Pengelolaan terkait kliping |
| **`HM.05.05`** | **PUBLIKASI**<br>↳ Majalah / Tabloid / Jurnal / Booklet / Leaflet | `publikasi`, `tabloid`, `majalah`, `leaflet`, `booklet`, `jurnal` | Pengelolaan terkait majalah / tabloid / jurnal / booklet / leaflet |
| **`HM.05.06`** | **PUBLIKASI**<br>↳ Press Release | `press release`, `publikasi` | Pengelolaan terkait press release |
| **`HM.05.07`** | **PUBLIKASI**<br>↳ Advetorial | `advetorial`, `publikasi` | Pengelolaan terkait advetorial |
| **`HM.05.08`** | **PUBLIKASI**<br>↳ Televisi / Radio | `publikasi`, `televisi`, `radio` | Pengelolaan terkait televisi / radio |
| **`HM.06.01`** | **DOKUMENTASI**<br>↳ Foto | `dokumentasi`, `foto` | Pengelolaan terkait foto |
| **`HM.06.02`** | **DOKUMENTASI**<br>↳ Cetak | `dokumentasi`, `cetak` | Pengelolaan terkait cetak |
| **`HM.06.03`** | **DOKUMENTASI**<br>↳ Audio Visual | `audio visual`, `dokumentasi` | Pengelolaan terkait audio visual |
| **`HM.06.04`** | **DOKUMENTASI**<br>↳ Audio Video | `audio video`, `dokumentasi` | Pengelolaan terkait audio video |
| **`HM.07.01`** | **PERPUSTAKAAN**<br>↳ Layanan Pustaka | `layanan pustaka`, `perpustakaan` | Pengelolaan terkait layanan pustaka |
| **`HM.07.02`** | **PERPUSTAKAAN**<br>↳ Pengelolaan Pustaka | `pengelolaan pustaka`, `perpustakaan` | Pengelolaan terkait pengelolaan pustaka |
| **`HM.07.03`** | **PERPUSTAKAAN**<br>↳ Pengadaan Bahan Pustaka | `pengadaan bahan pustaka`, `perpustakaan` | Pengelolaan terkait pengadaan bahan pustaka |


### 2.PW [PW] - PENGAWASAN
Urusan pokok terkait tata kelola **pengawasan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`PW.01.01`** | **PROGRAM**<br>↳ Program Audit Kinerja | `program kerja pengawasan tahunan`, `program audit kinerja`, `rencana audit tahunan`, `program`, `pkpt` | Pengawasan, reviu, atau audit program audit kinerja |
| **`PW.01.02`** | **PROGRAM**<br>↳ Program Pemeriksaan dengan Tujuan Tertentu (Investigasi) | `investigasi`, `program` | Pengawasan, reviu, atau audit program pemeriksaan dengan tujuan tertentu (investigasi) |
| **`PW.01.03`** | **PROGRAM**<br>↳ Program Kegiatan Monitoring | `program kegiatan monitoring`, `program` | Pengawasan, reviu, atau audit program kegiatan monitoring |
| **`PW.01.04`** | **PROGRAM**<br>↳ Program Kegiatan Reviu | `usulan penambahan anggaran`, `usulan tambahan anggaran`, `program kegiatan reviu`, `permohonan reviu itjen`, `penambahan anggaran`, `tambahan anggaran`, `usulan penambahan`, `usulan tambahan`, `tahun anggaran`, `anggaran tahun` | Reviu Usulan Tambahan Anggaran pada Pusat; Usulan Penambahan Anggaran Tahun Anggaran |
| **`PW.01.05`** | **PROGRAM**<br>↳ Program Kegiatan Evaluasi | `program kegiatan evaluasi`, `program` | Pengawasan, reviu, atau audit program kegiatan evaluasi |
| **`PW.01.06`** | **PROGRAM**<br>↳ Program Kegiatan Pengawasan lainnya | `program kegiatan pengawasan lainnya`, `program` | Pengawasan, reviu, atau audit program kegiatan pengawasan lainnya |
| **`PW.02.01`** | **PELAKSANAAN**<br>↳ Audit Kinerja | `tim penyusunan laporan strategis`, `laporan strategis pengawasan`, `evaluasi kinerja satker`, `tim audit kinerja`, `pemeriksaan kinerja`, `penyusunan laporan`, `laporan strategis`, `tim penyusunan`, `audit kinerja`, `nama anggota` | Nama Anggota Tim Penyusunan Laporan Strategis |
| **`PW.02.02`** | **PELAKSANAAN**<br>↳ Audit Investigasi | `audit investigasi`, `pelaksanaan` | Pengawasan, reviu, atau audit audit investigasi |
| **`PW.02.03`** | **PELAKSANAAN**<br>↳ Monitoring | `pelaksanaan`, `monitoring` | Pengawasan, reviu, atau audit monitoring |
| **`PW.02.04`** | **PELAKSANAAN**<br>↳ Pelaksanaan Reviu | `pelaksanaan reviu`, `pelaksanaan` | Pengawasan, reviu, atau audit pelaksanaan reviu |
| **`PW.02.05`** | **PELAKSANAAN**<br>↳ Pelaksanaan Evaluasi | `pelaksanaan evaluasi`, `pelaksanaan` | Pengawasan, reviu, atau audit pelaksanaan evaluasi |
| **`PW.02.06`** | **PELAKSANAAN**<br>↳ Pengawasan Lainnya | `pengawasan lainnya`, `pelaksanaan` | Pengawasan, reviu, atau audit pengawasan lainnya |
| **`PW.03.01`** | **PELAPORAN**<br>↳ Gratifikasi | `gratifikasi`, `pelaporan` | Pengawasan, reviu, atau audit gratifikasi |
| **`PW.03.02`** | **PELAPORAN**<br>↳ LHKPN / LHK-ASN | `lhk asn`, `pelaporan`, `lhkpn` | Pengawasan, reviu, atau audit lhkpn / lhk-asn |
| **`PW.03.03`** | **PELAPORAN**<br>↳ Benturan Kepentingan | `benturan kepentingan`, `pelaporan` | Pengawasan, reviu, atau audit benturan kepentingan |
| **`PW.03.04`** | **PELAPORAN**<br>↳ Zona Integritas | `zona integritas`, `pelaporan` | Pengawasan, reviu, atau audit zona integritas |
| **`PW.03.05`** | **PELAPORAN**<br>↳ Whistle Blowing System (WBS) | `whistle blowing system`, `pelaporan`, `wbs` | Pengawasan, reviu, atau audit whistle blowing system (wbs) |
| **`PW.04.01`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Audit | `laporan hasil pemeriksaan`, `laporan hasil audit`, `rekomendasi itjen`, `pelaporan audit`, `temuan audit`, `lhp` | Pengawasan, reviu, atau audit laporan hasil audit |
| **`PW.04.02`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Pemeriksaan dengan Tujuan Tertentu (Audit Investigasi) | `audit investigasi`, `pelaporan audit` | Pengawasan, reviu, atau audit laporan hasil pemeriksaan dengan tujuan tertentu (audit investigasi) |
| **`PW.04.03`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Kegiatan Monitoring | `laporan hasil kegiatan monitoring`, `pelaporan audit` | Pengawasan, reviu, atau audit laporan hasil kegiatan monitoring |
| **`PW.04.04`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Reviu | `tindak lanjut rekomendasi bpk/itjen`, `matriks tindak lanjut pengawasan`, `tindak lanjut hasil reviu`, `laporan hasil reviu`, `pelaporan audit`, `tindak lanjut`, `lanjut hasil`, `reviu usulan`, `hasil reviu`, `lanjut` | Tindak Lanjut Hasil Reviu Usulan |
| **`PW.04.05`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Kegiatan Evaluasi | `laporan hasil kegiatan evaluasi`, `pelaporan audit` | Pengawasan, reviu, atau audit laporan hasil kegiatan evaluasi |
| **`PW.04.06`** | **PELAPORAN AUDIT**<br>↳ Laporan Hasil Pengawasan Lainnya | `laporan hasil pengawasan lainnya`, `pelaporan audit` | Pengawasan, reviu, atau audit laporan hasil pengawasan lainnya |
| **`PW.05.01`** | **TINDAK LANJUT HASIL PENGAWASAN**<br>↳ Tindak Lanjut Pemeriksaan Internal | `tindak lanjut pemeriksaan internal`, `tindak lanjut hasil pengawasan` | Pengawasan, reviu, atau audit tindak lanjut pemeriksaan internal |
| **`PW.05.02`** | **TINDAK LANJUT HASIL PENGAWASAN**<br>↳ Tindak Lanjut Pemeriksaan Eksternal | `tindak lanjut pemeriksaan eksternal`, `tindak lanjut hasil pengawasan` | Pengawasan, reviu, atau audit tindak lanjut pemeriksaan eksternal |
| **`PW.05.03`** | **TINDAK LANJUT HASIL PENGAWASAN**<br>↳ Tindak Lanjut Pengaduan Masyarakat | `tindak lanjut pengaduan masyarakat`, `tindak lanjut hasil pengawasan` | Pengawasan, reviu, atau audit tindak lanjut pengaduan masyarakat |


### 2.LT [LT] - PENELITIAN DAN PENGEMBANGAN SDM
Urusan pokok terkait tata kelola **penelitian dan pengembangan sdm**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`LT.01.01`** | **PENELITIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Administrasi Penelitian | `administrasi penelitian` | Pengelolaan terkait administrasi penelitian |
| **`LT.01.02`** | **PENELITIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Pengolahan/Pengumpulan Data Penelitian | `pengumpulan data penelitian`, `pengolahan` | Pengelolaan terkait pengolahan/pengumpulan data penelitian |
| **`LT.01.03`** | **PENELITIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ FGD / Seminar Penelitian | `seminar penelitian`, `fgd` | Pengelolaan terkait fgd / seminar penelitian |
| **`LT.01.04`** | **PENELITIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Laporan Hasil Penelitian | `laporan hasil penelitian` | Pengelolaan terkait laporan hasil penelitian |
| **`LT.01.05`** | **PENELITIAN KOMUNIKASI DAN INFORMATIKA**<br>↳ Penjaminan Mutu dan Pendayagunaan Hasil Penelitian |  | Pengelolaan terkait penjaminan mutu dan pendayagunaan hasil penelitian |
| **`LT.02.01`** | **PENGEMBANGAN SDM BIDANG KOMINFO**<br>↳ Penyusunan Bidang Teknis Standarisasi Kompetensi, Pengembangan Profesi dan Pengembagan Sistem Sertifikasi Kominfo | `pengembangan sdm bidang kominfo` | Pengelolaan terkait penyusunan bidang teknis standarisasi kompetensi, pengembangan profesi dan pengembagan sistem sertifikasi kominfo |
| **`LT.02.02`** | **PENGEMBANGAN SDM BIDANG KOMINFO**<br>↳ Pelaksanaan Standarisasi Kompetensi, Pengembangan Profesi dan Pengembangan Sistem Sertifikasi Kominfo, Pelatihan dan Fasilitasi Sertifikasi SKKNI | `pengembangan sdm bidang kominfo`, `pelaksanaan standarisasi kompetensi` | Pengelolaan terkait pelaksanaan standarisasi kompetensi, pengembangan profesi dan pengembangan sistem sertifikasi kominfo, pelatihan dan fasilitasi sertifikasi skkni |
| **`LT.02.03`** | **PENGEMBANGAN SDM BIDANG KOMINFO**<br>↳ Program Beasiswa S2/S3 Dalam Negeri dan Luar Negeri | `pengembangan sdm bidang kominfo`, `program beasiswa s2` | Pengelolaan terkait program beasiswa s2/s3 dalam negeri dan luar negeri |
| **`LT.03.01`** | **SEKOLAH TINGGI MULTI MEDIA**<br>↳ Penyelenggaraan Pendidikan dan pengajaran | `sekolah tinggi multi media` | Pengelolaan terkait penyelenggaraan pendidikan dan pengajaran |
| **`LT.03.02`** | **SEKOLAH TINGGI MULTI MEDIA**<br>↳ Penelitian | `sekolah tinggi multi media`, `penelitian` | Pengelolaan terkait penelitian |
| **`LT.03.03`** | **SEKOLAH TINGGI MULTI MEDIA**<br>↳ Pengabdian Masyarakat/Kerjasama | `sekolah tinggi multi media`, `pengabdian masyarakat`, `kerjasama` | Pengelolaan terkait pengabdian masyarakat/kerjasama |
| **`LT.03.04`** | **SEKOLAH TINGGI MULTI MEDIA**<br>↳ Ujian Kompetensi / Lembaga Sertifikasi Profesi (LSP) | `sekolah tinggi multi media`, `lembaga sertifikasi profesi`, `ujian kompetensi`, `lsp` | Pengelolaan terkait ujian kompetensi / lembaga sertifikasi profesi (lsp) |


### 2.DL [DL] - PENDIDIKAN DAN PELATIHAN
Urusan pokok terkait tata kelola **pendidikan dan pelatihan**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`DL.01.01`** | **PERENCANAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Kurikulum, Modul, Metode, Standar / Mutu, Pedoman Diklat, Dokumen Akademik, Sertifikat/STTPL | `dokumen akademik`, `pedoman diklat`, `sertifikat`, `kurikulum`, `standar`, `metode`, `sttpl`, `modul`, `mutu` | Pengelolaan terkait kurikulum, modul, metode, standar / mutu, pedoman diklat, dokumen akademik, sertifikat/sttpl |
| **`DL.01.02`** | **PERENCANAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Program Diklat | `program diklat` | Pengelolaan terkait program diklat |
| **`DL.02.01`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Ikatan Dinas | `ikatan dinas` | Pengelolaan terkait ikatan dinas |
| **`DL.02.02`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Kerjasama dengan Instansi Pemerintah/Non Pemerintah/Perguruan Tinggi | `perguruan tinggi`, `non pemerintah` | Pengelolaan terkait kerjasama dengan instansi pemerintah/non pemerintah/perguruan tinggi |
| **`DL.02.03`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Pra Jabatan | `pra jabatan` | Pengelolaan terkait pra jabatan |
| **`DL.02.04`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Penjenjangan Struktural | `penjenjangan struktural` | Pengelolaan terkait penjenjangan struktural |
| **`DL.02.05`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Fungsional | `fungsional` | Pengelolaan terkait fungsional |
| **`DL.02.06`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Teknis | `teknis` | Pengelolaan terkait teknis |
| **`DL.02.07`** | **PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Bimbingan Teknis | `bimbingan teknis` | Pengelolaan terkait bimbingan teknis |
| **`DL.03.01`** | **EVALUASI DAN PELAPORAN PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Evaluasi Materi Penyelenggaraan | `evaluasi materi penyelenggaraan` | Pengelolaan terkait evaluasi materi penyelenggaraan |
| **`DL.03.02`** | **EVALUASI DAN PELAPORAN PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Evaluasi Pengajar/Instruktur/Fasilitator | `evaluasi pengajar`, `fasilitator`, `instruktur` | Pengelolaan terkait evaluasi pengajar/instruktur/fasilitator |
| **`DL.03.03`** | **EVALUASI DAN PELAPORAN PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Evaluasi Sarana dan Prasarana | `evaluasi sarana dan prasarana` | Pengelolaan terkait evaluasi sarana dan prasarana |
| **`DL.03.04`** | **EVALUASI DAN PELAPORAN PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Evaluasi Kurikulum, Metode, dan Standarisasi | `evaluasi kurikulum`, `dan standarisasi`, `metode` | Pengelolaan terkait evaluasi kurikulum, metode, dan standarisasi |
| **`DL.03.05`** | **EVALUASI DAN PELAPORAN PENYELENGGARAAN PENDIDIKAN DAN PELATIHAN**<br>↳ Evaluasi dan Laporan Penyelenggaraan |  | Pengelolaan terkait evaluasi dan laporan penyelenggaraan |


### 2.DT [DT] - DATA DAN SARANA INFORMATIKA
Urusan pokok terkait tata kelola **data dan sarana informatika**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`DT.01.01`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Tata Kelola TI | `pengelolaan tata kelola ti`, `akun email resmi pusaka`, `akses sistem informasi`, `tata kelola ti`, `perencanaan strategis`, `kebijakan strategis`, `email kedinasan`, `pembuatan email`, `pusat kebijakan`, `domain komdigi` | Pembuatan Email Official Pusat Kebijakan Strategis |
| **`DT.01.02`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Rencana Strategis TI | `pengelolaan rencana strategis ti`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan rencana strategis ti |
| **`DT.01.03`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Arsitektur TI Kementerian | `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan arsitektur ti kementerian |
| **`DT.01.04`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Inovasi-inovasi TI | `pengelolaan inovasi inovasi ti`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan inovasi-inovasi ti |
| **`DT.01.05`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Portofolio Strategis dan Investasi TI | `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan portofolio strategis dan investasi ti |
| **`DT.01.06`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan SDM TI | `pengelolaan sdm ti`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan sdm ti |
| **`DT.01.07`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Hubungan Antara Stakeholder Perusahaan dengan Stakeholder TI | `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan hubungan antara stakeholder perusahaan dengan stakeholder ti |
| **`DT.01.08`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Perjanjian/Kontrak Tingkat Layanan (SLA & KPI) | `kontrak tingkat layanan`, `sla & kpi`, `pengelolaan perjanjian`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan perjanjian/kontrak tingkat layanan (sla & kpi) |
| **`DT.01.09`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Pemasok Layanan TI | `pengelolaan pemasok layanan ti`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan pemasok layanan ti |
| **`DT.01.10`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Kualitas Layanan dan Solusi (ISO 9001) | `perencanaan strategis`, `iso 9001`, `plan` | Pengelolaan terkait pengelolaan kualitas layanan dan solusi (iso 9001) |
| **`DT.01.11`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Risiko TI | `pengelolaan risiko ti`, `perencanaan strategis`, `plan` | Pengelolaan terkait pengelolaan risiko ti |
| **`DT.01.12`** | **PERENCANAAN STRATEGIS, TATA KELOLA DAN KEBIJAKAN TI (PLAN**<br>↳ Pengelolaan Keamanan Informasi (ISO 27001) | `pengelolaan keamanan informasi`, `perencanaan strategis`, `iso 27001`, `plan` | Pengelolaan terkait pengelolaan keamanan informasi (iso 27001) |
| **`DT.02.01`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Program dan Proyek | `pengelolaan program dan proyek`, `sistem elektronik dinas`, `pengembangan aplikasi`, `maintenance aplikasi`, `arsitektur spbe`, `aplikasi web`, `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan program dan proyek |
| **`DT.02.02`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Permintaan Layanan dan Insiden Layanan | `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan permintaan layanan dan insiden layanan |
| **`DT.02.03`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Permasalahan Layanan TI (Database permasalahan) | `pengelolaan permasalahan layanan ti`, `database permasalahan`, `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan permasalahan layanan ti (database permasalahan) |
| **`DT.02.04`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelola Ketersediaan dan Kapasitas Layanan | `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelola ketersediaan dan kapasitas layanan |
| **`DT.02.05`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Perubahan Organisasi | `pengelolaan perubahan organisasi`, `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan perubahan organisasi |
| **`DT.02.06`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Permintaan Perubahan | `pengelolaan permintaan perubahan`, `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan permintaan perubahan |
| **`DT.02.07`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Permintaan Perubahan dan Transisi Penerimaan Hal yang Baru | `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan permintaan perubahan dan transisi penerimaan hal yang baru |
| **`DT.02.08`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Pengetahuan | `pengelolaan pengetahuan`, `pengembangan`, `pembangunan`, `perancangan` | Pengelolaan terkait pengelolaan pengetahuan |
| **`DT.02.09`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Semua Aset TI | `pengelolaan semua aset ti`, `pengembangan`, `pembangunan`, `perancangan` | Pengelolaan terkait pengelolaan semua aset ti |
| **`DT.02.10`** | **PERANCANGAN, PEMBANGUNAN, PENGEMBANGAN, PENGUJIAN DAN PENJAMINAN KUALITAS LAYANAN TI**<br>↳ Pengelolaan Konfigurasi Layanan | `pengelolaan konfigurasi layanan`, `pengembangan`, `perancangan`, `pembangunan` | Pengelolaan terkait pengelolaan konfigurasi layanan |
| **`DT.03.01`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Operasional Layanan TI | `pengelolaan operasional layanan ti`, `jaringan internet kantor`, `keamanan informasi`, `cloud komdigi`, `data center`, `pengelolaan`, `perencanaan`, `pengawasan`, `hosting`, `server` | Pengelolaan terkait pengelolaan operasional layanan ti |
| **`DT.03.02`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Permintaan Layanan dan Insiden Layanan | `perencanaan`, `pengelolaan`, `pengawasan` | Pengelolaan terkait pengelolaan permintaan layanan dan insiden layanan |
| **`DT.03.03`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Permasalahan Layanan TI (Database permasalahan) | `pengelolaan permasalahan layanan ti`, `database permasalahan`, `pengelolaan`, `perencanaan`, `pengawasan` | Pengelolaan terkait pengelolaan permasalahan layanan ti (database permasalahan) |
| **`DT.03.04`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Kontinuitas / keberlangsungan Layanan | `keberlangsungan layanan`, `pengelolaan kontinuitas`, `pengelolaan`, `perencanaan`, `pengawasan` | Pengelolaan terkait pengelolaan kontinuitas / keberlangsungan layanan |
| **`DT.03.05`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Layanan untuk Layanan TI | `perencanaan`, `pengelolaan`, `pengawasan` | Pengelolaan terkait pengelolaan layanan untuk layanan ti |
| **`DT.03.06`** | **PERENCANAAN, PENGELOLAAN, PENGAWASAN, DAN PENGOPERASIAN LAYANAN TI SERTA LAYANAN HELPDESK ATAU PERMINTAAN LAYANAN TI**<br>↳ Pengelolaan Pengontrolan Proses Bisnis (ISO 27001 : Keamanan Informasi) | `perencanaan`, `pengelolaan`, `pengawasan` | Pengelolaan terkait pengelolaan pengontrolan proses bisnis (iso 27001 : keamanan informasi) |
| **`DT.04.01`** | **PENGELOLAAN KINERJA LAYANAN TI ATAS HASIL MONITOR DAN EVALUASI KINERJA LAYANAN TI**<br>↳ Monitor, Evaluasi dan Penilaian Kinerja dan Kesesuaian dengan Tujuan Pencapaian | `monitor` | Pengelolaan terkait monitor, evaluasi dan penilaian kinerja dan kesesuaian dengan tujuan pencapaian |
| **`DT.04.02`** | **PENGELOLAAN KINERJA LAYANAN TI ATAS HASIL MONITOR DAN EVALUASI KINERJA LAYANAN TI**<br>↳ Monitor, Evaluasi dan Penilaian Sistem Pengontrolan Internal | `monitor` | Pengelolaan terkait monitor, evaluasi dan penilaian sistem pengontrolan internal |
| **`DT.04.03`** | **PENGELOLAAN KINERJA LAYANAN TI ATAS HASIL MONITOR DAN EVALUASI KINERJA LAYANAN TI**<br>↳ Monitor, Evaluasi dan Penilaian Kepatuhan dengan Persyaratan Eksternal | `monitor` | Pengelolaan terkait monitor, evaluasi dan penilaian kepatuhan dengan persyaratan eksternal |
| **`DT.05.01`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Administrasi LPSE | `layanan pengadaan secara elektronik`, `administrasi lpse`, `lpse` | Pengelolaan terkait administrasi lpse |
| **`DT.05.02`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Aplikasi SPSE (Sistem Pengadaan Secara Elektronik) | `layanan pengadaan secara elektronik`, `sistem pengadaan secara elektronik`, `aplikasi spse`, `lpse` | Pengelolaan terkait aplikasi spse (sistem pengadaan secara elektronik) |
| **`DT.05.03`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Verifikasi Penyedia | `layanan pengadaan secara elektronik`, `verifikasi penyedia`, `lpse` | Pengelolaan terkait verifikasi penyedia |
| **`DT.05.04`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Akun (Pejabat Pengadaan, Panitia Pengadaan / ULP, Penyedia, Auditor, Helpdesk) | `layanan pengadaan secara elektronik`, `panitia pengadaan`, `pejabat pengadaan`, `penyedia`, `helpdesk`, `auditor`, `lpse`, `akun`, `ulp` | Pengelolaan terkait akun (pejabat pengadaan, panitia pengadaan / ulp, penyedia, auditor, helpdesk) |
| **`DT.05.05`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Pelatihan SPSE (Sistem Pengadaan Secara Elektronik) | `layanan pengadaan secara elektronik`, `sistem pengadaan secara elektronik`, `pelatihan spse`, `lpse` | Pengelolaan terkait pelatihan spse (sistem pengadaan secara elektronik) |
| **`DT.05.06`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Standard LPSE | `layanan pengadaan secara elektronik`, `standard lpse`, `lpse` | Pengelolaan terkait standard lpse |
| **`DT.05.07`** | **LPSE (LAYANAN PENGADAAN SECARA ELEKTRONIK)**<br>↳ Laporan | `layanan pengadaan secara elektronik`, `laporan`, `lpse` | Pengelolaan terkait laporan |


### 2.KI [KI] - KELEMBAGAAN INTERNASIONAL
Urusan pokok terkait tata kelola **kelembagaan internasional**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`KI.01.01`** | **MULTILATERAL**<br>↳ International Telecommunication Union (ITU) | `multilateral`, `itu` | Pengelolaan terkait international telecommunication union (itu) |
| **`KI.01.02`** | **MULTILATERAL**<br>↳ Universal Postal Union (UPU) | `universal postal union`, `multilateral`, `upu` | Pengelolaan terkait universal postal union (upu) |
| **`KI.01.03`** | **MULTILATERAL**<br>↳ World Summit On Information Society (WSIS) | `multilateral`, `wsis` | Pengelolaan terkait world summit on information society (wsis) |
| **`KI.01.04`** | **MULTILATERAL**<br>↳ World Trade Organization (WTO) | `world trade organization`, `multilateral`, `wto` | Pengelolaan terkait world trade organization (wto) |
| **`KI.01.05`** | **MULTILATERAL**<br>↳ European Telecommunication Standardization Institute (ETSI) | `multilateral`, `etsi` | Pengelolaan terkait european telecommunication standardization institute (etsi) |
| **`KI.01.06`** | **MULTILATERAL**<br>↳ United Nations (UN) | `united nations`, `multilateral` | Pengelolaan terkait united nations (un) |
| **`KI.01.07`** | **MULTILATERAL**<br>↳ Organisasi Internasional Lainnya | `organisasi internasional lainnya`, `multilateral` | Pengelolaan terkait organisasi internasional lainnya |
| **`KI.02.01`** | **REGIONAL**<br>↳ Asia Pasific Telecommunity (APT) | `asia pasific telecommunity`, `regional`, `apt` | Pengelolaan terkait asia pasific telecommunity (apt) |
| **`KI.02.02`** | **REGIONAL**<br>↳ Association of South East Asian Nation (ASEAN) | `regional`, `asean` | Pengelolaan terkait association of south east asian nation (asean) |
| **`KI.02.03`** | **REGIONAL**<br>↳ Asia Pasific Economic Coorperation on Telecommunications (APECTEL) | `regional`, `apectel` | Pengelolaan terkait asia pasific economic coorperation on telecommunications (apectel) |
| **`KI.02.04`** | **REGIONAL**<br>↳ Asian Pasific Postal Union (APPU) | `asian pasific postal union`, `regional`, `appu` | Pengelolaan terkait asian pasific postal union (appu) |
| **`KI.02.05`** | **REGIONAL**<br>↳ Organisasi Regional lainnya | `organisasi regional lainnya`, `regional` | Pengelolaan terkait organisasi regional lainnya |
| **`KI.03.01`** | **BILATERAL**<br>↳ Information And Communication Joint Committee (ICJC) | `bilateral`, `icjc` | Pengelolaan terkait information and communication joint committee (icjc) |
| **`KI.03.02`** | **BILATERAL**<br>↳ Border Communication Coordination Meeting (BCCM) | `bilateral`, `bccm` | Pengelolaan terkait border communication coordination meeting (bccm) |
| **`KI.03.03`** | **BILATERAL**<br>↳ Joint Committee On Communication (JCC) | `joint committee on communication`, `bilateral`, `jcc` | Pengelolaan terkait joint committee on communication (jcc) |
| **`KI.03.04`** | **BILATERAL**<br>↳ Trilateral Meeting | `trilateral meeting`, `bilateral` | Pengelolaan terkait trilateral meeting |
| **`KI.03.05`** | **BILATERAL**<br>↳ Brunei Indonesia Malaysia Phillipine East Asean Growth Area (BIMP-EAGA) ICT Cluster Meeting | `ict cluster meeting`, `bimp eaga`, `bilateral` | Pengelolaan terkait brunei indonesia malaysia phillipine east asean growth area (bimp-eaga) ict cluster meeting |
| **`KI.03.06`** | **BILATERAL**<br>↳ Indonesia Malaysia Thailand Growth Triangle (IMT-GT) | `imt gt`, `bilateral` | Pengelolaan terkait indonesia malaysia thailand growth triangle (imt-gt) |
| **`KI.03.07`** | **BILATERAL**<br>↳ Sidang Komisi Bersama (SKB) Dengan Negara Mitra | `sidang komisi bersama`, `dengan negara mitra`, `bilateral`, `skb` | Pengelolaan terkait sidang komisi bersama (skb) dengan negara mitra |
| **`KI.03.08`** | **BILATERAL**<br>↳ Economic Partnership Agreement | `economic partnership agreement`, `bilateral` | Pengelolaan terkait economic partnership agreement |
| **`KI.03.09`** | **BILATERAL**<br>↳ Expert | `bilateral`, `expert` | Pengelolaan terkait expert |
| **`KI.03.10`** | **BILATERAL**<br>↳ Perjanjian Internasional | `perjanjian internasional`, `bilateral` | Pengelolaan terkait perjanjian internasional |
| **`KI.03.11`** | **BILATERAL**<br>↳ Korean Agency | `korean agency`, `bilateral` | Pengelolaan terkait korean agency |
| **`KI.03.12`** | **BILATERAL**<br>↳ Japan Agency | `japan agency`, `bilateral` | Pengelolaan terkait japan agency |
| **`KI.03.13`** | **BILATERAL**<br>↳ Kerjasama Capacity Building dengan Negara Mitra | `bilateral` | Pengelolaan terkait kerjasama capacity building dengan negara mitra |


---

## 3. KAMUS KLASIFIKASI SUBSTANTIF (TUGAS POKOK & TEKNIS SEKTORAL)

Klasifikasi Substantif mencakup fungsi teknis spesifik mandat Kementerian Komunikasi dan Digital RI.

### 3.SP [SP] - SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA
Urusan mandat teknis spesifik bidang **sumber daya dan perangkat pos dan informatika**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`SP.01.01`** | **PENATAAN SUMBER DAYA**<br>↳ Penataan Alokasi Spektrum Dinas Tetap, Bergerak Darat | `frekuensi radio dinas tetap`, `alokasi spektrum frekuensi`, `penataan sumber daya`, `pita frekuensi 5g`, `refarming frekuensi`, `bergerak darat` | Pelaksanaan teknis atau kebijakan penataan alokasi spektrum dinas tetap, bergerak darat |
| **`SP.01.02`** | **PENATAAN SUMBER DAYA**<br>↳ Penataan Alokasi Spektrum Non Dinas Tetap, Bergerak Darat | `penataan sumber daya`, `bergerak darat` | Pelaksanaan teknis atau kebijakan penataan alokasi spektrum non dinas tetap, bergerak darat |
| **`SP.01.03`** | **PENATAAN SUMBER DAYA**<br>↳ Pengelolaan Orbit Satelit | `pengelolaan orbit satelit`, `penataan sumber daya`, `slot orbit indonesia`, `filing satelit`, `orbit satelit` | Pelaksanaan teknis atau kebijakan pengelolaan orbit satelit |
| **`SP.01.04`** | **PENATAAN SUMBER DAYA**<br>↳ Ekonomi Sumber Daya | `penataan sumber daya`, `ekonomi sumber daya` | Pelaksanaan teknis atau kebijakan ekonomi sumber daya |
| **`SP.01.05`** | **PENATAAN SUMBER DAYA**<br>↳ Harmonisasi Teknik Spektrum | `harmonisasi teknik spektrum`, `penataan sumber daya` | Pelaksanaan teknis atau kebijakan harmonisasi teknik spektrum |
| **`SP.02.01`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Spektrum Dinas Tetap | `pelayanan spektrum dinas tetap`, `stasiun radio microwave link`, `operasi sumber daya`, `izin stasiun radio`, `isr dinas tetap`, `pelayanan spektrum` | Pelaksanaan teknis atau kebijakan pelayanan spektrum dinas tetap |
| **`SP.02.02`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Spektrum Dinas Bergerak Darat | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan pelayanan spektrum dinas bergerak darat |
| **`SP.02.03`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Spektrum Dinas Penyiaran | `pelayanan spektrum dinas penyiaran`, `operasi sumber daya` | Pelaksanaan teknis atau kebijakan pelayanan spektrum dinas penyiaran |
| **`SP.02.04`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Spektrum Dinas Penerbangan, Maritim dan Satelit | `operasi sumber daya`, `maritim dan satelit` | Pelaksanaan teknis atau kebijakan pelayanan spektrum dinas penerbangan, maritim dan satelit |
| **`SP.02.05`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Amatir Radio dan Komunikasi Radio Antar Penduduk | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan pelayanan amatir radio dan komunikasi radio antar penduduk |
| **`SP.02.06`** | **OPERASI SUMBER DAYA**<br>↳ Pelayanan Operator Radio | `pelayanan operator radio`, `operasi sumber daya` | Pelaksanaan teknis atau kebijakan pelayanan operator radio |
| **`SP.02.07`** | **OPERASI SUMBER DAYA**<br>↳ Penanganan Piutang Biaya Hak Penggunaan Frekuensi Radio | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan penanganan piutang biaya hak penggunaan frekuensi radio |
| **`SP.02.08`** | **OPERASI SUMBER DAYA**<br>↳ Analisa dan Evaluasi Biaya Hak Penggunaan Frekuensi Radio | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan analisa dan evaluasi biaya hak penggunaan frekuensi radio |
| **`SP.02.09`** | **OPERASI SUMBER DAYA**<br>↳ Konsultasi dan Informasi Sumber Daya | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan konsultasi dan informasi sumber daya |
| **`SP.02.10`** | **OPERASI SUMBER DAYA**<br>↳ Pengelolaan Data Operasi Sumber Daya | `operasi sumber daya` | Pelaksanaan teknis atau kebijakan pengelolaan data operasi sumber daya |
| **`SP.03.01`** | **PENGENDALIAN SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA**<br>↳ Pengelolaan Sistem Monitoring Spektrum | `monitoring spektrum frekuensi radio`, `interferensi sinyal radio`, `penertiban frekuensi`, `loka monitor`, `balmon` | Pelaksanaan teknis atau kebijakan pengelolaan sistem monitoring spektrum |
| **`SP.03.02`** | **PENGENDALIAN SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA**<br>↳ Pengelolaan Sistem Informasi Manajemen Spektrum |  | Pelaksanaan teknis atau kebijakan pengelolaan sistem informasi manajemen spektrum |
| **`SP.03.03`** | **PENGENDALIAN SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA**<br>↳ Monitoring dan Penertiban Spektrum Frekuensi Radio |  | Pelaksanaan teknis atau kebijakan monitoring dan penertiban spektrum frekuensi radio |
| **`SP.03.04`** | **PENGENDALIAN SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA**<br>↳ Monitoring dan Penertiban Perangkat Pos Dan Informatika |  | Pelaksanaan teknis atau kebijakan monitoring dan penertiban perangkat pos dan informatika |
| **`SP.03.05`** | **PENGENDALIAN SUMBER DAYA DAN PERANGKAT POS DAN INFORMATIKA**<br>↳ Penanganan Gangguan Spektrum Frekuensi Radio |  | Pelaksanaan teknis atau kebijakan penanganan gangguan spektrum frekuensi radio |
| **`SP.04.01`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standar Perangkat Telekomunikasi Radio | `alat dan perangkat telekomunikasi`, `uji laboratorium perangkat`, `label sertifikasi sdppi` | Pelaksanaan teknis atau kebijakan standar perangkat telekomunikasi radio |
| **`SP.04.02`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standar Infrastruktur Telekomunikasi Radio |  | Pelaksanaan teknis atau kebijakan standar infrastruktur telekomunikasi radio |
| **`SP.04.03`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standar Perangkat Pos dan Telekomunikasi Non Radio |  | Pelaksanaan teknis atau kebijakan standar perangkat pos dan telekomunikasi non radio |
| **`SP.04.04`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standar Infrastruktur Pos dan Telekomunikasi Non Radio |  | Pelaksanaan teknis atau kebijakan standar infrastruktur pos dan telekomunikasi non radio |
| **`SP.04.05`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standar Kualitas Layanan | `standar kualitas layanan` | Pelaksanaan teknis atau kebijakan standar kualitas layanan |
| **`SP.04.06`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Harmonisasi Standar Perangkat | `harmonisasi standar perangkat` | Pelaksanaan teknis atau kebijakan harmonisasi standar perangkat |
| **`SP.04.07`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standardisasi Perangkat dan Infrastruktur Teknologi Informasi |  | Pelaksanaan teknis atau kebijakan standardisasi perangkat dan infrastruktur teknologi informasi |
| **`SP.04.08`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Standardisasi Manajemen dan Tata Kelola Teknologi Informasi |  | Pelaksanaan teknis atau kebijakan standardisasi manajemen dan tata kelola teknologi informasi |
| **`SP.04.09`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Sertifikasi perangkat Pos, Telekomukasi, dan Informatika | `sertifikasi perangkat pos`, `dan informatika`, `telekomukasi` | Pelaksanaan teknis atau kebijakan sertifikasi perangkat pos, telekomukasi, dan informatika |
| **`SP.04.10`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Data dan Informasi Perangkat Pos, Telekomunikasi dan Informatika | `telekomunikasi dan informatika` | Pelaksanaan teknis atau kebijakan data dan informasi perangkat pos, telekomunikasi dan informatika |
| **`SP.04.11`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Rekomendasi Alat dan Perangkat Telekomunikasi |  | Pelaksanaan teknis atau kebijakan rekomendasi alat dan perangkat telekomunikasi |
| **`SP.04.12`** | **STANDARDISASI PERANGKAT POS DAN INFORMATIKA**<br>↳ Penolakan Tidak Memenuhi Persyaratan Teknis |  | Pelaksanaan teknis atau kebijakan penolakan tidak memenuhi persyaratan teknis |
| **`SP.05.01`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Pelayanan Pengujian Perangkat Telekomunikasi | `pengujian perangkat telekomunikasi` | Pelaksanaan teknis atau kebijakan pelayanan pengujian perangkat telekomunikasi |
| **`SP.05.02`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Pelayanan / Laporan Kalibrasi Alat ukur | `laporan kalibrasi alat ukur`, `pengujian perangkat telekomunikasi`, `pelayanan` | Pelaksanaan teknis atau kebijakan pelayanan / laporan kalibrasi alat ukur |
| **`SP.05.03`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Dokumen Mutu | `pengujian perangkat telekomunikasi`, `dokumen mutu` | Pelaksanaan teknis atau kebijakan dokumen mutu |
| **`SP.05.04`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Audit Internal dan Ekternal Pengujian | `pengujian perangkat telekomunikasi` | Pelaksanaan teknis atau kebijakan audit internal dan ekternal pengujian |
| **`SP.05.05`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Uji Banding Mandatory KAN | `uji banding mandatory kan`, `pengujian perangkat telekomunikasi` | Pelaksanaan teknis atau kebijakan uji banding mandatory kan |
| **`SP.05.06`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Metode Penyusunan Pengujian | `pengujian perangkat telekomunikasi`, `metode penyusunan pengujian` | Pelaksanaan teknis atau kebijakan metode penyusunan pengujian |
| **`SP.05.07`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Rekapitulasi Hasil Uji (RHU) | `pengujian perangkat telekomunikasi`, `rekapitulasi hasil uji`, `rhu` | Pelaksanaan teknis atau kebijakan rekapitulasi hasil uji (rhu) |
| **`SP.05.08`** | **PENGUJIAN PERANGKAT TELEKOMUNIKASI**<br>↳ Perbaikan dan Pemeliharaan Alat Ukur | `pengujian perangkat telekomunikasi` | Pelaksanaan teknis atau kebijakan perbaikan dan pemeliharaan alat ukur |


### 3.PI [PI] - PENYELENGGARAAN POS DAN INFORMATIKA
Urusan mandat teknis spesifik bidang **penyelenggaraan pos dan informatika**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`PI.01.01`** | **POS**<br>↳ Layanan Pos Universal | `izin penyelenggaraan pos`, `layanan kurir logistik`, `layanan pos universal`, `jasa pos komersial`, `pos universal`, `lpu` | Pelaksanaan teknis atau kebijakan layanan pos universal |
| **`PI.01.02`** | **POS**<br>↳ Layanan Pos Komersial | `layanan pos komersial` | Pelaksanaan teknis atau kebijakan layanan pos komersial |
| **`PI.01.03`** | **POS**<br>↳ Pentarifan Pos | `pentarifan pos` | Pelaksanaan teknis atau kebijakan pentarifan pos |
| **`PI.01.04`** | **POS**<br>↳ Perangko dan Filateli | `perangko dan filateli` | Pelaksanaan teknis atau kebijakan perangko dan filateli |
| **`PI.01.05`** | **POS**<br>↳ Kerjasama dan Pengembangan Industri Pos |  | Pelaksanaan teknis atau kebijakan kerjasama dan pengembangan industri pos |
| **`PI.02.01`** | **TELEKOMUNIKASI**<br>↳ Jaringan Telekomunikasi | `bts 4g daerah 3t`, `jaringan telekomunikasi`, `palapa ring`, `fiber optik`, `telekomunikasi`, `broadband` | Pelaksanaan teknis atau kebijakan jaringan telekomunikasi |
| **`PI.02.02`** | **TELEKOMUNIKASI**<br>↳ Jasa Telekomunikasi | `jasa telekomunikasi`, `telekomunikasi` | Pelaksanaan teknis atau kebijakan jasa telekomunikasi |
| **`PI.02.03`** | **TELEKOMUNIKASI**<br>↳ Penomoran Telekomunikasi dan Informatika | `telekomunikasi` | Pelaksanaan teknis atau kebijakan penomoran telekomunikasi dan informatika |
| **`PI.02.04`** | **TELEKOMUNIKASI**<br>↳ Tarif, Interkoneksi dan Iklim Usaha | `interkoneksi dan iklim usaha`, `telekomunikasi`, `tarif` | Pelaksanaan teknis atau kebijakan tarif, interkoneksi dan iklim usaha |
| **`PI.02.05`** | **TELEKOMUNIKASI**<br>↳ Telekomunikasi Khusus dan Kelayakan Penyelenggaraan Telekomunikasi | `telekomunikasi` | Pelaksanaan teknis atau kebijakan telekomunikasi khusus dan kelayakan penyelenggaraan telekomunikasi |
| **`PI.03.01`** | **PENYIARAN**<br>↳ Layanan Radio | `alokasi blok nomor telepon`, `kode akses konten`, `penomoran telekomunikasi`, `shortcode sms`, `layanan radio`, `penyiaran` | Pelaksanaan teknis atau kebijakan layanan radio |
| **`PI.03.02`** | **PENYIARAN**<br>↳ Layanan Televisi | `layanan televisi`, `penyiaran` | Pelaksanaan teknis atau kebijakan layanan televisi |
| **`PI.03.03`** | **PENYIARAN**<br>↳ Verifikasi dan Uji Coba Siaran | `penyiaran` | Pelaksanaan teknis atau kebijakan verifikasi dan uji coba siaran |
| **`PI.03.04`** | **PENYIARAN**<br>↳ Iklim Usaha Penyiaran dan Kelayakan Teknologi | `penyiaran` | Pelaksanaan teknis atau kebijakan iklim usaha penyiaran dan kelayakan teknologi |
| **`PI.03.05`** | **PENYIARAN**<br>↳ Pengelolaan Sistem Informasi Manajemen Penyiaran dan Sarana Pendukung Pengelolaan Data Penyiaran | `penyiaran` | Pelaksanaan teknis atau kebijakan pengelolaan sistem informasi manajemen penyiaran dan sarana pendukung pengelolaan data penyiaran |
| **`PI.04.01`** | **PENGEMBANGAN PITALEBAR**<br>↳ Infrastruktur Telekomunikasi Pitalebar | `izin penyelenggaraan penyiaran`, `ipp tv radio`, `pengembangan pitalebar`, `penyiaran digital`, `mux penyiaran`, `tv digital`, `multiplexing` | Pelaksanaan teknis atau kebijakan infrastruktur telekomunikasi pitalebar |
| **`PI.04.02`** | **PENGEMBANGAN PITALEBAR**<br>↳ Ekosistem Pitalebar | `pengembangan pitalebar`, `ekosistem pitalebar` | Pelaksanaan teknis atau kebijakan ekosistem pitalebar |
| **`PI.04.03`** | **PENGEMBANGAN PITALEBAR**<br>↳ Infrastruktur Penyiaran Pitalebar | `infrastruktur penyiaran pitalebar`, `pengembangan pitalebar` | Pelaksanaan teknis atau kebijakan infrastruktur penyiaran pitalebar |
| **`PI.04.04`** | **PENGEMBANGAN PITALEBAR**<br>↳ Infrastruktur Keperluan Khusus Pitalebar | `pengembangan pitalebar` | Pelaksanaan teknis atau kebijakan infrastruktur keperluan khusus pitalebar |
| **`PI.04.05`** | **PENGEMBANGAN PITALEBAR**<br>↳ Tata Kelola Pitalebar | `tata kelola pitalebar`, `pengembangan pitalebar` | Pelaksanaan teknis atau kebijakan tata kelola pitalebar |
| **`PI.05.01`** | **PENGENDALIAN POS DAN INFORMATIKA**<br>↳ Monitoring dan Evaluasi Pos | `pengendalian pos dan informatika`, `monitoring dan evaluasi pos` | Pelaksanaan teknis atau kebijakan monitoring dan evaluasi pos |
| **`PI.05.02`** | **PENGENDALIAN POS DAN INFORMATIKA**<br>↳ Monitoring dan Evaluasi Telekomunikasi Khusus dan Jaringan Telekomunikasi | `pengendalian pos dan informatika` | Pelaksanaan teknis atau kebijakan monitoring dan evaluasi telekomunikasi khusus dan jaringan telekomunikasi |
| **`PI.05.03`** | **PENGENDALIAN POS DAN INFORMATIKA**<br>↳ Monitoring dan Evaluasi Jasa Telekomunikasi | `pengendalian pos dan informatika` | Pelaksanaan teknis atau kebijakan monitoring dan evaluasi jasa telekomunikasi |
| **`PI.05.04`** | **PENGENDALIAN POS DAN INFORMATIKA**<br>↳ Monitoring dan Evaluasi Penyiaran | `monitoring dan evaluasi penyiaran`, `pengendalian pos dan informatika` | Pelaksanaan teknis atau kebijakan monitoring dan evaluasi penyiaran |
| **`PI.05.05`** | **PENGENDALIAN POS DAN INFORMATIKA**<br>↳ Pencegahan dan Penertiban | `pengendalian pos dan informatika`, `pencegahan dan penertiban` | Pelaksanaan teknis atau kebijakan pencegahan dan penertiban |


### 3.AI [AI] - APLIKASI INFORMATIKA
Urusan mandat teknis spesifik bidang **aplikasi informatika**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`AI.01.01`** | **LAYANAN APLIKASI INFORMATIKA PEMERINTAHAN**<br>↳ Layanan Infrastruktur dan Teknologi Interopabilitas Pemerintahan | `penyelenggara sistem elektronik`, `pendaftaran sistem elektronik`, `tanda daftar pse`, `pse domestik`, `pse asing` | Pelaksanaan teknis atau kebijakan layanan infrastruktur dan teknologi interopabilitas pemerintahan |
| **`AI.01.02`** | **LAYANAN APLIKASI INFORMATIKA PEMERINTAHAN**<br>↳ Layanan Aplikasi Informatika Pemerintahan Daerah |  | Pelaksanaan teknis atau kebijakan layanan aplikasi informatika pemerintahan daerah |
| **`AI.01.03`** | **LAYANAN APLIKASI INFORMATIKA PEMERINTAHAN**<br>↳ Layanan Aplikasi Informatika Politik, Hukum, dan Keamanan | `dan keamanan`, `hukum` | Pelaksanaan teknis atau kebijakan layanan aplikasi informatika politik, hukum, dan keamanan |
| **`AI.01.04`** | **LAYANAN APLIKASI INFORMATIKA PEMERINTAHAN**<br>↳ Layanan Aplikasi Informatika Kemaritiman dan Pembangunan Manusia dan Kebudayaan |  | Pelaksanaan teknis atau kebijakan layanan aplikasi informatika kemaritiman dan pembangunan manusia dan kebudayaan |
| **`AI.01.05`** | **LAYANAN APLIKASI INFORMATIKA PEMERINTAHAN**<br>↳ Layanan Aplikasi Informatika Perekonomian |  | Pelaksanaan teknis atau kebijakan layanan aplikasi informatika perekonomian |
| **`AI.02.01`** | **TATA KELOLA APLIKASI INFORMATIKA**<br>↳ Tata Kelola Sistem Elektronik dan Ekonomi Digital | `tata kelola aplikasi informatika`, `kebijakan etika ai`, `tata kelola ai`, `kecerdasan artifisial`, `spbe nasional`, `smart city` | Pelaksanaan teknis atau kebijakan tata kelola sistem elektronik dan ekonomi digital |
| **`AI.02.02`** | **TATA KELOLA APLIKASI INFORMATIKA**<br>↳ Tata Kelola Sistem Elektronik Pemerintahan | `tata kelola aplikasi informatika` | Pelaksanaan teknis atau kebijakan tata kelola sistem elektronik pemerintahan |
| **`AI.02.03`** | **TATA KELOLA APLIKASI INFORMATIKA**<br>↳ Tata Kelola Perlindungan Data Pribadi | `tata kelola aplikasi informatika` | Pelaksanaan teknis atau kebijakan tata kelola perlindungan data pribadi |
| **`AI.02.04`** | **TATA KELOLA APLIKASI INFORMATIKA**<br>↳ Tata Kelola Sertifikasi Elektronik | `tata kelola sertifikasi elektronik`, `tata kelola aplikasi informatika` | Pelaksanaan teknis atau kebijakan tata kelola sertifikasi elektronik |
| **`AI.03.01`** | **PEMBERDAYAAN INFORMATIKA**<br>↳ Literasi Digital | `take down konten pornografi`, `penanganan konten terlarang`, `pemberantasan judi online`, `blokir situs negatif`, `patroli siber ais`, `pemberdayaan informatika`, `literasi digital`, `judol` | Pelaksanaan teknis atau kebijakan literasi digital |
| **`AI.03.02`** | **PEMBERDAYAAN INFORMATIKA**<br>↳ Pemberdayaan Komunitas TIK | `pemberdayaan komunitas tik`, `pemberdayaan informatika` | Pelaksanaan teknis atau kebijakan pemberdayaan komunitas tik |
| **`AI.03.03`** | **PEMBERDAYAAN INFORMATIKA**<br>↳ Pemberdayaan Kapasitas TIK | `pemberdayaan kapasitas tik`, `pemberdayaan informatika` | Pelaksanaan teknis atau kebijakan pemberdayaan kapasitas tik |
| **`AI.03.04`** | **PEMBERDAYAAN INFORMATIKA**<br>↳ Pemberdayaan Kreativitas TIK | `pemberdayaan kreativitas tik`, `pemberdayaan informatika` | Pelaksanaan teknis atau kebijakan pemberdayaan kreativitas tik |
| **`AI.04.01`** | **EKONOMI DIGITAL**<br>↳ Pengembangan Ekonomi Digital pendidikan dan kesehatan | `gerakan nasional literasi digital`, `edukasi keamanan internet`, `literasi digital`, `ekonomi digital`, `pandu digital`, `gnld` | Pelaksanaan teknis atau kebijakan pengembangan ekonomi digital pendidikan dan kesehatan |
| **`AI.04.02`** | **EKONOMI DIGITAL**<br>↳ Pengembangan Ekonomi Digital Pertanian dan Perikanan | `ekonomi digital` | Pelaksanaan teknis atau kebijakan pengembangan ekonomi digital pertanian dan perikanan |
| **`AI.04.03`** | **EKONOMI DIGITAL**<br>↳ Pengembangan Ekonomi Digital Pariwisata, transportasi dan perdagangan | `transportasi dan perdagangan`, `ekonomi digital` | Pelaksanaan teknis atau kebijakan pengembangan ekonomi digital pariwisata, transportasi dan perdagangan |
| **`AI.04.04`** | **EKONOMI DIGITAL**<br>↳ Pengembangan Ekosistem Ekonomi Digital | `ekonomi digital` | Pelaksanaan teknis atau kebijakan pengembangan ekosistem ekonomi digital |
| **`AI.05.01`** | **PENGENDALIAN APLIKASI INFORMATIKA**<br>↳ Sistem Elektronik, Ekonomi dan Perlindungan Data Pribadi | `beasiswa pelatihan talenta digital`, `pengendalian aplikasi informatika`, `digital talent scholarship`, `fresh graduate academy`, `sistem elektronik`, `microskill`, `dts` | Pelaksanaan teknis atau kebijakan sistem elektronik, ekonomi dan perlindungan data pribadi |
| **`AI.05.02`** | **PENGENDALIAN APLIKASI INFORMATIKA**<br>↳ Pengendalian Konten Internet | `pengendalian aplikasi informatika`, `pengendalian konten internet` | Pelaksanaan teknis atau kebijakan pengendalian konten internet |
| **`AI.05.03`** | **PENGENDALIAN APLIKASI INFORMATIKA**<br>↳ Pengendalian Penyelenggara Sertifikasi Elektronik | `pengendalian aplikasi informatika` | Pelaksanaan teknis atau kebijakan pengendalian penyelenggara sertifikasi elektronik |
| **`AI.05.04`** | **PENGENDALIAN APLIKASI INFORMATIKA**<br>↳ Penyidikan Dan Penindakan | `pengendalian aplikasi informatika`, `penyidikan dan penindakan` | Pelaksanaan teknis atau kebijakan penyidikan dan penindakan |


### 3.IK [IK] - INFORMASI DAN KOMUNIKASI PUBLIK
Urusan mandat teknis spesifik bidang **informasi dan komunikasi publik**.

| Kode | Sub Urusan & Uraian Masalah | Kata Kunci Pencocokan (Keywords) | Contoh Kasus / Konteks Nota Dinas |
| :--- | :--- | :--- | :--- |
| **`IK.01.01`** | **KOMUNIKASI PUBLIK**<br>↳ Tata Kelola Komunikasi Publik | `tata kelola komunikasi publik`, `strategi komunikasi publik`, `narasi tunggal pemerintah`, `diseminasi informasi`, `komunikasi publik` | Pelaksanaan teknis atau kebijakan tata kelola komunikasi publik |
| **`IK.01.02`** | **KOMUNIKASI PUBLIK**<br>↳ Layanan Komunikasi Publik | `layanan komunikasi publik`, `komunikasi publik` | Pelaksanaan teknis atau kebijakan layanan komunikasi publik |
| **`IK.01.03`** | **KOMUNIKASI PUBLIK**<br>↳ Pembinaan Profesi Komunikasi Publik | `pembinaan profesi komunikasi publik`, `komunikasi publik` | Pelaksanaan teknis atau kebijakan pembinaan profesi komunikasi publik |
| **`IK.02.01`** | **PENGOLAHAN DAN PENYEDIAAN INFORMASI**<br>↳ Pengolahan Isu Publik | `pengolahan dan penyediaan informasi`, `konten media sosial kementerian`, `portal indonesia go id`, `pengelolaan media daring`, `pengolahan isu publik`, `infopublik` | Pelaksanaan teknis atau kebijakan pengolahan isu publik |
| **`IK.02.02`** | **PENGOLAHAN DAN PENYEDIAAN INFORMASI**<br>↳ Pengolahan Informasi | `pengolahan dan penyediaan informasi`, `pengolahan informasi` | Pelaksanaan teknis atau kebijakan pengolahan informasi |
| **`IK.02.03`** | **PENGOLAHAN DAN PENYEDIAAN INFORMASI**<br>↳ Penyediaan Informasi | `pengolahan dan penyediaan informasi`, `penyediaan informasi` | Pelaksanaan teknis atau kebijakan penyediaan informasi |
| **`IK.03.01`** | **PENGELOLAAN MEDIA PUBLIK**<br>↳ Media Cetak | `pengelolaan media publik`, `analisis sentimen media`, `media monitoring harian`, `monitoring opini publik`, `isu strategis publik`, `media cetak` | Pelaksanaan teknis atau kebijakan media cetak |
| **`IK.03.02`** | **PENGELOLAAN MEDIA PUBLIK**<br>↳ Media Online | `pengelolaan media publik`, `media online` | Pelaksanaan teknis atau kebijakan media online |
| **`IK.03.03`** | **PENGELOLAAN MEDIA PUBLIK**<br>↳ Media Luar Ruang dan Audio Visual | `pengelolaan media publik` | Pelaksanaan teknis atau kebijakan media luar ruang dan audio visual |
| **`IK.04.01`** | **KEMITRAAN KOMUNIKASI**<br>↳ Kemitraan Pemerintah, Lembaga Negara, dan Pemerintah Daerah | `pelayanan informasi publik`, `dan pemerintah daerah`, `ppid utama komdigi`, `lapor go id`, `kemitraan pemerintah`, `kemitraan komunikasi`, `aduan masyarakat`, `lembaga negara` | Pelaksanaan teknis atau kebijakan kemitraan pemerintah, lembaga negara, dan pemerintah daerah |
| **`IK.04.02`** | **KEMITRAAN KOMUNIKASI**<br>↳ Kemitraan Lembaga Media | `kemitraan lembaga media`, `kemitraan komunikasi` | Pelaksanaan teknis atau kebijakan kemitraan lembaga media |
| **`IK.04.03`** | **KEMITRAAN KOMUNIKASI**<br>↳ Kemitraan Lembaga Komunikasi Sosial | `kemitraan lembaga komunikasi sosial`, `kemitraan komunikasi` | Pelaksanaan teknis atau kebijakan kemitraan lembaga komunikasi sosial |
| **`IK.05.01`** | **LAYANAN INFORMASI INTERNASIONAL**<br>↳ Layanan Informasi Media Internasional | `layanan informasi internasional` | Pelaksanaan teknis atau kebijakan layanan informasi media internasional |
| **`IK.05.02`** | **LAYANAN INFORMASI INTERNASIONAL**<br>↳ Layanan Informasi Perwakilan Negara Asing dan Lembaga Internasional | `layanan informasi internasional` | Pelaksanaan teknis atau kebijakan layanan informasi perwakilan negara asing dan lembaga internasional |
| **`IK.05.03`** | **LAYANAN INFORMASI INTERNASIONAL**<br>↳ Layanan Informasi Masyarakat Internasional | `layanan informasi internasional` | Pelaksanaan teknis atau kebijakan layanan informasi masyarakat internasional |
| **`IK.06.01`** | **MUSEUM PENERANGAN DAN MONUMEN PERS**<br>↳ Penataan Koleksi Benda-Benda Bersejarah |  | Pelaksanaan teknis atau kebijakan penataan koleksi benda-benda bersejarah |
| **`IK.06.02`** | **MUSEUM PENERANGAN DAN MONUMEN PERS**<br>↳ Penambahan Koleksi Benda-Benda Bersejarah |  | Pelaksanaan teknis atau kebijakan penambahan koleksi benda-benda bersejarah |
| **`IK.06.03`** | **MUSEUM PENERANGAN DAN MONUMEN PERS**<br>↳ Pelestarian Koleksi Benda-Benda Bersejarah |  | Pelaksanaan teknis atau kebijakan pelestarian koleksi benda-benda bersejarah |
| **`IK.06.04`** | **MUSEUM PENERANGAN DAN MONUMEN PERS**<br>↳ Promosi Museum Penerangan dan Monumen Pers |  | Pelaksanaan teknis atau kebijakan promosi museum penerangan dan monumen pers |


---

## 4. CONTOH IMPLEMENTASI CODE ENGINE (PYTHON & JAVASCRIPT)

Berikut adalah contoh script algoritma siap pakai yang dapat langsung dipasang ke backend aplikasi Anda untuk membaca dictionary dan menghasilkan rekomendasi nomor klasifikasi secara otomatis.

### 4.1 Implementasi Python (`classifier_engine.py`)

```python
import re

class NotaDinasClassifier:
    def __init__(self, dictionary_db):
        self.db = dictionary_db

    def normalize(self, text):
        return re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())

    def suggest(self, perihal, isi_dokumen="", top_n=3):
        norm_perihal = self.normalize(perihal)
        norm_isi = self.normalize(isi_dokumen)
        
        scores = []
        for entry in self.db:
            score = 0.0
            matched = []
            
            for kw in entry['keywords']:
                kw_norm = self.normalize(kw).strip()
                if not kw_norm:
                    continue
                
                pattern = r'\b' + re.escape(kw_norm) + r'\b'
                matches_p = len(re.findall(pattern, norm_perihal))
                if matches_p > 0:
                    word_len = len(kw_norm.split())
                    score += matches_p * 3.0 * word_len
                    matched.append(kw)
                else:
                    matches_i = len(re.findall(pattern, norm_isi))
                    if matches_i > 0:
                        word_len = len(kw_norm.split())
                        score += matches_i * 1.0 * word_len
                        matched.append(kw)

            if score > 0:
                scores.append({
                    'kode': entry['kode'],
                    'kategori': entry['kategori'],
                    'uraian': entry['tersier_nama'],
                    'hirarki': entry['hirarki'],
                    'score': score,
                    'matched_keywords': list(set(matched)),
                    'contoh_kasus': entry.get('contoh_kasus', '')
                })

        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores[:top_n]
```

### 4.2 Implementasi JavaScript / Node.js (`classifierEngine.js`)

```javascript
function suggestClassification(perihal, isiDokumen, dictionaryDB, topN = 3) {
  const normPerihal = perihal.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const normIsi = (isiDokumen || '').toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');

  const results = [];

  for (const entry of dictionaryDB) {
    let score = 0;
    const matched = [];

    for (const kw of entry.keywords) {
      const kwClean = kw.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
      if (!kwClean) continue;

      const regex = new RegExp(`\\b${kwClean}\\b`, 'gi');
      const matchesP = (normPerihal.match(regex) || []).length;

      if (matchesP > 0) {
        const wordLen = kwClean.split(/\s+/).length;
        score += matchesP * 3.0 * wordLen;
        matched.push(kw);
      } else {
        const matchesI = (normIsi.match(regex) || []).length;
        if (matchesI > 0) {
          const wordLen = kwClean.split(/\s+/).length;
          score += matchesI * 1.0 * wordLen;
          matched.push(kw);
        }
      }
    }

    if (score > 0) {
      results.push({
        kode: entry.kode,
        kategori: entry.kategori,
        uraian: entry.tersier_nama,
        hirarki: entry.hirarki,
        score: score,
        matchedKeywords: Array.from(new Set(matched)),
        contohKasus: entry.contohKasus || ''
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

module.exports = { suggestClassification };
```

---

## 5. HASIL TELAAH & STATISTIK 44 SAMPEL NOTA DINAS (KODE SERING DIGUNAKAN & ALASANNYA)

> **Ringkasan Hasil Analisis Data Lapangan (Empirical Evidence)**  
> Bagian ini mendokumentasikan hasil telaah mendalam terhadap **44 berkas sampel dokumen** naskah dinas (Nota Dinas dan Undangan) yang diterbitkan oleh **Pusat Kebijakan Strategis (PUSAKA / SJ.9)**, Sekretariat Jenderal Kementerian Komunikasi dan Digital RI.

### 5.1 Karakteristik Unit Kerja & Dominasi Klasifikasi Fasilitatif
Dari total 44 dokumen sampel yang dianalisis:
* **100% (44 Dokumen) menggunakan Klasifikasi FASILITATIF**.
* **0% menggunakan Klasifikasi Substantif**.

**Alasan Mengapa Didominasi Fasilitatif:**
Pusat Kebijakan Strategis berkedudukan di bawah **Sekretariat Jenderal (`SJ`)**, yang secara kelembagaan berfungsi sebagai unsur penunjang dan koordinasi manajerial. Oleh karena itu, naskah dinas keluar sehari-hari sebagian besar merupakan nota dinas internal antarsatker di lingkungan kementerian untuk mengurus hal-hal fasilitatif/administrasi, seperti:
1. **Tata Usaha & Manajemen Staf Internal**: Kenaikan gaji berkala (KGB), penyesuaian gaji/tukin, kenaikan pangkat, uji kompetensi analis kebijakan, pakta integritas ASN, MCU, dan SKP.
2. **Perencanaan & Kebijakan Internal**: Penyusunan linimasa program prioritas menteri, laporan berkala monitoring *Quickwin*, penyiapan materi telaahan rapim/menteri, serta usulan nama tim kerja.
3. **Pengelolaan Aset & Anggaran**: Pengusulan Rencana Kebutuhan BMN (RKBMN), revisi DIPA/anggaran, usulan penambahan anggaran belanja, serta tindak lanjut hasil reviu pengawasan Itjen/BPK.

### 5.2 Distribusi Berdasarkan Bidang Urusan Pokok (Primer)

| Kode Primer | Nama Urusan Pokok | Jumlah Dokumen | Persentase | Fokus Isi Dokumen |
| :---: | :--- | :---: | :---: | :--- |
| **`KP`** | **KEPEGAWAIAN** | **19** | **43.2%** | Kenaikan gaji berkala, penyesuaian gaji & tukin, kenaikan pangkat, uji kompetensi JF, pakta integritas, MCU, e-kinerja. |
| **`PR`** | **PERENCANAAN** | **9** | **20.5%** | Laporan berkala progres Quickwin, policy brief, telaahan jawaban menteri, rapat koordinasi linimasa prioritas. |
| **`PL`** | **PERLENGKAPAN (BMN)** | **5** | **11.4%** | Siklus RKBMN (pemindahtanganan, penggunaan, penghapusan, pemanfaatan) dan penetapan status penggunaan aset. |
| **`KU`** | **KEUANGAN** | **5** | **11.4%** | Tanggapan temuan BPK atas lapkeu, usulan RO PNBP, revisi pergeseran DIPA, bukti potong pajak PPh 21. |
| **`PW`** | **PENGAWASAN** | **5** | **11.4%** | Usulan reviu tambahan anggaran ke Itjen, tim laporan strategis pengawasan, tindak lanjut reviu anggaran PNBP. |
| **`DT`** | **DATA DAN SARANA TI** | **1** | **2.3%** | Permohonan fasilitas akun email dinas official (`@komdigi.go.id`) untuk satuan kerja. |
| **TOTAL** | | **44** | **100.0%** | |


### 5.3 Peringkat Kode Klasifikasi Spesifik (Tersier) Paling Sering Digunakan & Alasannya

#### 1. `PR.01.02` — Rencana Kerja Kementerian (Frekuensi: 5 Dokumen)
* **Hirarki**: `PERENCANAAN > RENCANA DAN PROGRAM > Rencana Kerja Kementerian`
* **Alasan & Konteks Penggunaan**:
  Sebagai unit perumusan kebijakan, PUSAKA rutin menyampaikan dokumen monitoring dan akselerasi rencana kerja menteri. Dokumen sampel meliputi:
  - Laporan berkala perkembangan *Quickwin* program prioritas kementerian (penanganan konten judi online, pelatihan Digital Talent Scholarship, dsb.).
  - Usulan pembentukan Tim Pemantauan Program Percepatan (Quickwin).
  - Penyampaian materi strategis pimpinan: telaah konsep jawaban menteri (isu data breach, AI) dan policy brief registrasi kartu SIM dengan biometrik.

#### 2. `KP.01.03` — NIP / Kartu Pegawai / Kartu PPNS (Frekuensi: 5 Dokumen)
* **Hirarki**: `KEPEGAWAIAN > TATA USAHA KEPEGAWAIAN > NIP/Kartu Pegawai/Kartu PPNS`
* **Alasan & Konteks Penggunaan**:
  Digunakan secara masif sebagai kode administrasi periodik hak-hak finansial dan kepegawaian staf satuan kerja, antara lain:
  - Permohonan dan penyampaian Surat Kenaikan Gaji Berkala (KGB) pegawai PNS.
  - Permohonan penyesuaian gaji pokok dan tunjangan kinerja pegawai pasca perubahan jabatan/pangkat.

#### 3. `PL.06.05` — Pencatatan Barang Milik Negara (Frekuensi: 4 Dokumen)
* **Hirarki**: `PERLENGKAPAN > INVENTARISASI DAN PELAPORAN BMN > Pencatatan Barang Milik Negara`
* **Alasan & Konteks Penggunaan**:
  Digunakan dalam satu paket pelaporan siklus tahunan Rencana Kebutuhan BMN (RKBMN) unit kerja ke Biro Keuangan/Umum, terdiri dari:
  - Surat Pengusulan Pemindahtanganan RKBMN Pusaka.
  - Surat Pengusulan Penggunaan RKBMN Pusaka.
  - Surat Pengusulan Penghapusan RKBMN Pusaka.
  - Surat Pengusulan Pemanfaatan RKBMN Pusaka.

#### 4. `KU.01.01` — RAPBN / APBN (Frekuensi: 3 Dokumen)
* **Hirarki**: `KEUANGAN > ANGGARAN > RAPBN/ APBN`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk urusan siklus makro anggaran dan pertanggungjawaban fiskal, yaitu:
  - Usulan Rincian Output (RO) PNBP Pusat Kebijakan Strategis.
  - Penyampaian tanggapan resmi satker terhadap konsep temuan pemeriksaan BPK RI atas Laporan Keuangan Kementerian.
  - Permohonan penerbitan bukti potong PPh 21 tahun pajak pegawai.

#### 5. `KP.01.06` — Penugasan / Penunjukan / SPMT / SPMJ / Surat Pernyataan (Frekuensi: 2 Dokumen)
* **Hirarki**: `KEPEGAWAIAN > TATA USAHA KEPEGAWAIAN > Penugasan / Penunjukan / Surat Perintah / SPMT / SPMJ / Surat Pernyataan`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk penerbitan surat rekomendasi resmi dan penyampaian surat pernyataan kepatuhan:
  - Permohonan pembuatan Surat Usulan / Rekomendasi Pimpinan bagi pegawai untuk mengikuti seleksi beasiswa LPDP.
  - Penyampaian dokumen Surat Pernyataan / Pakta Integritas Pencegahan dan Pemberantasan Judi Online bagi ASN Formasi 2024.

#### 6. `PR.02.01` — Penyusunan RKA-K/L Kementerian (Frekuensi: 2 Dokumen)
* **Hirarki**: `PERENCANAAN > PENYUSUNAN ANGGARAN > Penyusunan RKA-K/L Kementerian`
* **Alasan & Konteks Penggunaan**:
  Digunakan saat menyampaikan hasil telaahan kebijakan dan regulasi yang berkaitan dengan alokasi output kementerian:
  - Telaah analisis isu dan potensi dugaan pelanggaran konten *mens rea* dengan UU ITE.
  - Penyampaian reviu terhadap Rancangan Peraturan Menteri (RPM PP Tunas).

#### 7. `PW.01.04` — Program Kegiatan Reviu (Frekuensi: 2 Dokumen)
* **Hirarki**: `PENGAWASAN > PROGRAM > Program Kegiatan Reviu`
* **Alasan & Konteks Penggunaan**:
  Digunakan saat unit kerja memohon pelaksanaan reviu kepatuhan oleh Inspektorat Jenderal (APIP) atas dokumen usulan penambahan anggaran belanja sebelum diajukan ke kementerian keuangan.

#### 8. `PW.02.01` — Audit Kinerja (Frekuensi: 2 Dokumen)
* **Hirarki**: `PENGAWASAN > PELAKSANAAN > Audit Kinerja`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk nota dinas pengusulan nama perwakilan pegawai satker yang ditugaskan masuk ke dalam Tim Penyusunan Laporan Strategis Hasil Pengawasan.

#### 9. `PR.01.01` — Rencana Strategis Kementerian (Frekuensi: 2 Dokumen)
* **Hirarki**: `PERENCANAAN > RENCANA DAN PROGRAM > Rencana Strategis Kementerian`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk undangan rapat perumusan linimasa program prioritas menteri dan penyampaian kajian isu kuota internet prabayar.

#### 10. `KP.04.04` — Kenaikan Pangkat Struktural dan Fungsional (Frekuensi: 2 Dokumen)
* **Hirarki**: `KEPEGAWAIAN > MUTASI PEGAWAI > Kenaikan Pangkat Struktural dan Fungsional`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk pengajuan berkas usulan kenaikan pangkat reguler dan fungsional pegawai unit kerja pada periode kenaikan pangkat ASN.

#### 11. `KP.01.01` — Data Perorangan / DRH (Frekuensi: 2 Dokumen)
* **Hirarki**: `KEPEGAWAIAN > TATA USAHA KEPEGAWAIAN > Data Perorangan/DRH`
* **Alasan & Konteks Penggunaan**:
  Digunakan untuk penyampaian data sertifikasi pegawai (pemegang sertifikat PPK) dan pemutakhiran portofolio kepegawaian berkala.

#### 12. Kode-kode Lain yang Muncul Masing-masing 1 Dokumen
| Kode | Uraian Masalah | Contoh Dokumen Sampel & Konteks Alasan |
| :--- | :--- | :--- |
| **`KP.01.04`** | KGB / Tunjangan Kinerja | Permohonan fasilitasi pembiayaan Uji Kompetensi Jabatan Fungsional Analis Kebijakan. |
| **`KP.01.05`** | Pendaftaran/Keluarga/Anak | Penyampaian peserta pelatihan internasional multilateral (RRT). |
| **`KP.04.06`** | Pengangkatan/Pemindahan Jabatan Struktural | Penyampaian Surat Pernyataan Menduduki Jabatan (SPMJ) pejabat fungsional. |
| **`KP.04.07`** | Pemberhentian Jabatan Fungsional | Permohonan penurunan jabatan fungsional menjadi umum karena menjalani Tugas Belajar. |
| **`KP.05.01`** | Analisis Kebutuhan Diklat (Monev) | Penyampaian dokumen *Individual Development Plan* (IDP) kompetensi pegawai. |
| **`KP.06.01`** | Assessment Pegawai / Seleksi Jabatan | Pengajuan Uji Kompetensi (Ujikom) pada Jabatan Analis Kebijakan. |
| **`KP.06.06`** | SKP / DP3 | Permohonan pembukaan akses aplikasi penilaian kinerja ASN (*E-Kinerja BKN*). |
| **`KP.07.01`** | Kesehatan / MCU / Klinik | Permohonan pelaksanaan pemeriksaan kesehatan berkala (*Medical Check Up*) pegawai. |
| **`KU.01.02`** | DIPA / Revisi Anggaran | Usulan pergeseran alokasi belanja perjalanan dinas dalam DIPA. |
| **`KU.03.03`** | Sewa Pemanfaatan Aset BMN | Pemberitahuan perbaikan ruangan (*Notice of Room Renovation* Gedung Sapta Pesona). |
| **`PL.01.02`** | Penetapan Status Penggunaan BMN | Permohonan penetapan status penggunaan (PSP) aset peralatan kerja/laptop. |
| **`PW.04.04`** | Laporan Hasil Reviu | Penyampaian tindak lanjut hasil reviu usulan tambahan anggaran PNBP. |
| **`DT.01.01`** | Pengelolaan Tata Kelola TI | Permohonan pembuatan akun email dinas official Pusaka (`@komdigi.go.id`). |


### 5.4 Matriks Rekapitulasi Lengkap 44 Dokumen Sampel

| No | Nomor Nota Dinas / Dokumen | Kode | Kategori | Perihal / Isi Ringkas | Alasan Penggunaan Kode |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | `38/SJ.9/DT.01.01/03/2025` | **`DT.01.01`** | FASILITATIF | Permohonan Pembuatan Email Official Pusat Kebij... | Pengelolaan Tata Kelola TI |
| 2 | `43/SJ.9/KP.01.01/1/2026` | **`KP.01.01`** | FASILITATIF | Penyampaian Data Pegawai yang telah memiliki Se... | Data Perorangan/DRH |
| 3 | `104/SJ.9/KP. 01.01/2/2026` | **`KP.01.01`** | FASILITATIF | Penyampaian Pembaruan dokumen kepegawaian | Data Perorangan/DRH |
| 4 | `31/SJ.9/KP.01.03/1/2026` | **`KP.01.03`** | FASILITATIF | Permohonan untuk dilakukan penyesuaian Gaji Pokok | NIP/Kartu Pegawai/Kartu PPNS |
| 5 | `44/SJ.9/KP.01.03/1/2026` | **`KP.01.03`** | FASILITATIF | Penyampaian Informasi Kenaikan Gaji Berkala ata... | NIP/Kartu Pegawai/Kartu PPNS |
| 6 | `48/SJ.9/KP.01.03/1/2026` | **`KP.01.03`** | FASILITATIF | Penyampaian Surat Kenaikan Gaji Berkala (KGB) P... | NIP/Kartu Pegawai/Kartu PPNS |
| 7 | `69/SJ.9/KP.01.03/1/2026` | **`KP.01.03`** | FASILITATIF | Penyampaian Surat Kenaikan Gaji Berkala (KGB) P... | NIP/Kartu Pegawai/Kartu PPNS |
| 8 | `370/SJ.9/KP.01.03/04/2026` | **`KP.01.03`** | FASILITATIF | Permohonan untuk dilakukan penyesuaian Gaji Pokok | NIP/Kartu Pegawai/Kartu PPNS |
| 9 | `26/SJ.9/KP.01.04/1/2026` | **`KP.01.04`** | FASILITATIF | Permohonan bantuan fasilitasi pembiayaan Uji Ko... | KGB/Tunjangan Kinerja |
| 10 | `444/SJ.9/KP.01.05/05/2026` | **`KP.01.05`** | FASILITATIF | Penyampaian Peserta untuk mengikuti Pelatihan | Pendaftaran/Keluarga/Perkawinan/Anak |
| 11 | `600/SJ.9/KP.01.06/07/2026` | **`KP.01.06`** | FASILITATIF | Permohonan Pembuatan Surat Usulan Untuk Mengikuti | Penugasan / Penunjukan/ Surat Perintah / P... |
| 12 | `862/SJ.9/KP.01.06/09/2026` | **`KP.01.06`** | FASILITATIF | Penyampaian Pakta Integritas Pencegahan dan | Penugasan / Penunjukan/ Surat Perintah / P... |
| 13 | `16/SJ.9/KP.04.04/1/2026` | **`KP.04.04`** | FASILITATIF | Kenaikan Pangkat Pegawai Pusat Kebijakan Strategis | Kenaikan Pangkat Struktural dan Fungsional |
| 14 | `46/SJ.9/KP.04.04/1/2026` | **`KP.04.04`** | FASILITATIF | Permohonan Kenaikan Pangkat Pegawai Pusat Kebij... | Kenaikan Pangkat Struktural dan Fungsional |
| 15 | `100/SJ/KP.04.06/02/2026` | **`KP.04.06`** | FASILITATIF | SPMJ Rilla (Fungsional Analis Kebijakan Ahli Pe... | Pengangkatan, Pemindahan, dan Pemberhentia... |
| 16 | `330/SJ.9/KP.04.07/4/2026` | **`KP.04.07`** | FASILITATIF | Permohonan Pemberhentian Jabatan Fungsional Pen... | Pengangkatan, Pemindahan, Pemberhentian da... |
| 17 | `17/SJ.9/KP.05.01/1/2026` | **`KP.05.01`** | FASILITATIF | Penyampaian Individual Development Plan (IDP)  ... | Analisis Kebutuhan Diklat (Perencanaan dan... |
| 18 | `15/SJ.9/KP.06.01/1/2026` | **`KP.06.01`** | FASILITATIF | Pengajuan Uji Kompetensi  Pegawai Pusat Kebijak... | Assesment Pegawai / Kompetensi / Seleksi J... |
| 19 | `403/SJ.9/KP.06.06/5/2026` | **`KP.06.06`** | FASILITATIF | Permohonan  Pembukaan Akses E-Kinerja untuk Peg... | SKP / DP3 |
| 20 | `52/SJ.9/KP.07.01/1/2026` | **`KP.07.01`** | FASILITATIF | Permohonan pelaksanaan medical check-up (MCU) u... | Kesehatan / Uji Kesehatan / Medical Check ... |
| 21 | `41/SJ.9/KU.01.01/1/2026` | **`KU.01.01`** | FASILITATIF | Permohonan Permintaan Bukti Potong PPh 21 Tahun... | RAPBN/ APBN (Rencana Kerja Pemerintah, Ren... |
| 22 | `383/SJ.9/KU.01.01/05/2026` | **`KU.01.01`** | FASILITATIF | Penyampaian Tanggapan Pusat Kebijakan Strategis | RAPBN/ APBN (Rencana Kerja Pemerintah, Ren... |
| 23 | `402/SJ.9/KU.01.01/05/2026` | **`KU.01.01`** | FASILITATIF | Usulan Rincian Output (RO) Pusat Kebijakan Stra... | RAPBN/ APBN (Rencana Kerja Pemerintah, Ren... |
| 24 | `671/SJ.9/KU.01.02/07/2026` | **`KU.01.02`** | FASILITATIF | Penyampaian Usulan Revisi Anggaran pada Pusat | DIPA (Rincian RKA-KL, Petunjuk Operasional... |
| 25 | `477/SJ.9/KU.03.03/06/2026    Jakart...` | **`KU.03.03`** | FASILITATIF | Notice of Room Renovation on the 13th Floor of ... | Sewa Pemanfaatan Aset / Barang Milik Negara |
| 26 | `39/SJ.9/PL.01.02/01/2026` | **`PL.01.02`** | FASILITATIF | Permohonan Penetapan Status Penggunaan BMN di L... | Penetapan status penggunaan Barang Milik N... |
| 27 | `708/SJ.9/PL.06.05/08/2026` | **`PL.06.05`** | FASILITATIF | Surat Pemindahtanganan RKBMN Pusaka | Pencatatan Barang Milik Negara |
| 28 | `709/SJ.9/PL.06.05/08/2026` | **`PL.06.05`** | FASILITATIF | Surat Penggunaan RKBMN Pusaka | Pencatatan Barang Milik Negara |
| 29 | `710/SJ.9/PL.06.05/08/2026` | **`PL.06.05`** | FASILITATIF | Surat Penghapusan RKBMN Pusaka | Pencatatan Barang Milik Negara |
| 30 | `711/SJ.9/PL.06.05/08/2026` | **`PL.06.05`** | FASILITATIF | Surat Pemanfaatan RKBMN Pusaka | Pencatatan Barang Milik Negara |
| 31 | `B-09/SJ.9/PR.01.01/01/2026     Jaka...` | **`PR.01.01`** | FASILITATIF | Undangan Rapat Penyusunan Timeline | Rencana Strategis Kementerian |
| 32 | `27/SJ.9/PR.01.01/01/2026` | **`PR.01.01`** | FASILITATIF | Penyampaian Reviu Singkat Isu Kuota Internet Pr... | Rencana Strategis Kementerian |
| 33 | `01/SJ.9/PR.01.02/01/2026 Kepada Yth...` | **`PR.01.02`** | FASILITATIF | Permohonan Usulan Nama Untuk Tim Pemantauan Pro... | Rencana Kerja Kementerian |
| 34 | `03/SJ.9/PR.01.02/01/2026 Kepada Yth...` | **`PR.01.02`** | FASILITATIF | Progress Quickwin Komdigi per 31 Desember 2025 | Rencana Kerja Kementerian |
| 35 | `30/SJ.9/PR.01.02/01/2026` | **`PR.01.02`** | FASILITATIF | Penyampaian Konsep Jawaban Menkomdigi Perihal Data | Rencana Kerja Kementerian |
| 36 | `50/SJ.9/PR.01.02/01/2026` | **`PR.01.02`** | FASILITATIF | Penyampaian Matriks Potensi Pertanyaan dan Jawaban | Rencana Kerja Kementerian |
| 37 | `54/SJ.9/PR.01.02/01/2026` | **`PR.01.02`** | FASILITATIF | Penyampaian Policy Brief  terkait Registrasi Kartu | Rencana Kerja Kementerian |
| 38 | `32/SJ.9/PR.02.01/1/2026` | **`PR.02.01`** | FASILITATIF | Penyampaian  Hasil  Telaah  Analisis  Isu  dan ... | Penyusunan RKA-K/L Kementerian |
| 39 | `55/SJ.9/PR.02.01/01/2026` | **`PR.02.01`** | FASILITATIF | Penyampaian Reviu terhadap Rancangan Peraturan ... | Penyusunan RKA-K/L Kementerian |
| 40 | `568/SJ.9/PW.01.04/07/2026` | **`PW.01.04`** | FASILITATIF | Permohonan Reviu Usulan Tambahan Anggaran pada ... | Program Kegiatan Reviu |
| 41 | `861/SJ.9/PW.01.04/09/2026` | **`PW.01.04`** | FASILITATIF | Penyampaian Usulan Penambahan Anggaran Tahun An... | Program Kegiatan Reviu |
| 42 | `11/SJ.9/PW.02.01/01/2026` | **`PW.02.01`** | FASILITATIF | Usulan Nama Anggota Tim Penyusunan Laporan Stra... | Audit Kinerja |
| 43 | `11/SJ.9/PW.02.01/01/2026` | **`PW.02.01`** | FASILITATIF | Usulan Nama Anggota Tim Penyusunan Laporan Stra... | Audit Kinerja |
| 44 | `601/SJ.9/PW.04.04/07/2026` | **`PW.04.04`** | FASILITATIF | Penyampaian Tindak Lanjut Hasil Reviu Usulan | Laporan Hasil Reviu |


### 5.5 Catatan Evaluasi & Rekomendasi Perbaikan Sistem
Berdasarkan perbandingan antara isi riil dokumen sampel dengan kamus klasifikasi arsip, ditemukan beberapa catatan penting untuk optimasi sistem:
1. **Koreksi Kode Kenaikan Gaji Berkala (KGB)**: Dalam praktik sampel, pengajuan KGB sering kali diberi kode `KP.01.03` (*NIP/Kartu Pegawai*). Padahal di master klasifikasi telah disediakan kode khusus yang lebih presisi yaitu **`KP.01.04` (*KGB/Tunjangan Kinerja*)**. Fitur saran sistem harus memprioritaskan `KP.01.04` jika terdeteksi kata `'kgb'` atau `'gaji berkala'`.
2. **Penulisan Format Titik**: Ditemukan naskah yang menggunakan spasi pada kode (contoh: `KP. 01.01`). Sistem aplikasi perlu menerapkan *auto-formatting* otomatis menjadi standar 3 blok tanpa spasi (misal: `KP.01.01`).
3. **Kombinasi Rekomendasi**: Untuk naskah dinas terkait telaah substansi kebijakan (misal telaah UU ITE atau Regulasi), sistem disarankan memberikan 2 alternatif: `PR.01.02` (Rencana Kerja jika bersifat internal kementerian) atau `HK.02.01` (jika berupa telaah formal rancangan regulasi/RPM).

