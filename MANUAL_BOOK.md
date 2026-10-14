# 📖 BUKU PANDUAN PENGGUNAAN (MANUAL BOOK)
## SISTEM GENERATOR SURAT TUGAS & PENOMORAN OTOMATIS
**Pusat Kebijakan Strategis (PUSAKA) — Sekretariat Jenderal**  
**Kementerian Komunikasi dan Digital Republik Indonesia**

---

## 📌 DAFTAR ISI
1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Alur Kerja Sistem (Workflow)](#2-alur-kerja-sistem-workflow)
3. [Panduan Penggunaan Fitur Utama](#3-panduan-penggunaan-fitur-utama)
   - 3.1 [Pembuatan Surat Tugas Baru](#31-pembuatan-surat-tugas-baru)
   - 3.2 [Ekstraksi Undangan Otomatis Berbasis AI](#32-ekstraksi-undangan-otomatis-berbasis-ai)
   - 3.3 [Pemilihan Personil & Pejabat Penandatangan](#33-pemilihan-personil--pejabat-penandatangan)
   - 3.4 [Fitur Edit Langsung pada Lembar Pratinjau (ContentEditable)](#34-fitur-edit-langsung-pada-lembar-pratinjau)
   - 3.5 [Unduh PDF Resmi & Cetak Dokumen](#35-unduh-pdf-resmi--cetak-dokumen)
   - 3.6 [Penerbitan & Sinkronisasi ke Google Sheets + Google Drive](#36-penerbitan--sinkronisasi-ke-google-sheets--google-drive)
4. [Fitur Edit Naskah Surat yang Sudah Diterbitkan](#4-fitur-edit-naskah-surat-yang-sudah-diterbitkan)
5. [Pengelolaan Database & Buku Agenda Persuratan](#5-pengelolaan-database--buku-agenda-persuratan)
   - 5.1 [Arsip Register Surat Tugas (Kolom A s.d. K)](#51-arsip-register-surat-tugas)
   - 5.2 [Kelola Data Pegawai Pusaka](#52-kelola-data-pegawai-pusaka)
   - 5.3 [Kelola Pejabat Penandatangan](#53-kelola-pejabat-penandatangan)
6. [Integrasi & Pemeliharaan Google Apps Script](#6-integrasi--pemeliharaan-google-apps-script)
   - 6.1 [Cara Update Script di Google Spreadsheet](#61-cara-update-script-di-google-spreadsheet)
   - 6.2 [Fitur Menu Tambahan pada Google Sheets](#62-fitur-menu-tambahan-pada-google-sheets)
7. [Pusat Bantuan & Troubleshooting](#7-pusat-bantuan--troubleshooting)

---

## 1. Tentang Aplikasi

Aplikasi **Sistem Generator Surat Tugas & Penomoran Otomatis PUSAKA** dirancang khusus untuk mempermudah, mempercepat, dan menstandarkan tata kelola penerbitan Surat Tugas kedinasan di lingkungan Pusat Kebijakan Strategis, Kementerian Komunikasi dan Digital RI.

### Keunggulan Utama:
* **Penomoran Otomatis Anti-Duplikasi**: Menghitung nomor urut resmi berikutnya secara *real-time* langsung dari Google Spreadsheet register kantor dengan format resmi:  
  `[Nomor Urut]/SJ.9/KP.01.06/[Bulan]/[Tahun]`.
* **Ekstraksi Dokumen Undangan AI**: Menggunakan teknologi OCR canggih (Gemini AI) untuk membaca dokumen surat undangan (PDF/Gambar) dan otomatis mengisi formulir serta merumuskan klausul *Menimbang*, *Dasar*, dan *Untuk*.
* **Tata Naskah Standar Komdigi RI**: Menggunakan standar format resmi A4 (794 x 1123 px), Lambang Garuda Pancasila emas, font Arial 12pt, dan penskalaan adaptif 1 halaman pas untuk 1–3 pegawai, serta otomatis membuat halaman lampiran tersendiri jika personil > 3 orang.
* **Pengarsipan Cloud Otomatis**: Setiap surat yang diterbitkan langsung otomatis diarsipkan ke folder Google Drive sesuai bulan pelaksanaan (contoh: `10 - Oktober 2026`) dan tautan unduhnya disematkan pada **Kolom J** Google Spreadsheet.
* **Fitur Edit Naskah Penuh**: Memungkinkan revisi naskah dokumen yang telah terbit tanpa mengubah atau mengacak nomor urut surat yang sudah teregister.

---

## 2. Alur Kerja Sistem (Workflow)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOKUMEN UNDANGAN ACARA                         │
│             (File PDF / Foto / Scan Surat Masuk Dinas)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │     Pindai Undangan dengan AI (Otomatis) ATAU Manual     │
       │   - Mengekstrak Nama Kegiatan, Tanggal, Tempat, dll     │
       │   - Merumuskan narasi Menimbang, Dasar, dan Untuk        │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │           Pilih Pegawai & Pejabat Penandatangan          │
       │   - Pilih 1 s.d. banyak staf (Centang nama pegawai)     │
       │   - Pilih Pejabat (Kapus / Plh. Kapus)                  │
       │   - Tentukan Konseptor & Tanggal Surat                  │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Pratinjau Live Dokumen Resmi (A4)           │
       │   - Tinjau tata letak dan redaksi surat                 │
       │   - Edit langsung pada teks surat jika perlu perbaikan   │
       └────────────────────────────┬────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│         Unduh PDF Resmi           │ │       Terbitkan & Simpan          │
│   (Simpan ke komputer lokal)      │ │  - Catat nomor urut di Sheets     │
│                                   │ │  - Upload PDF ke Google Drive     │
│                                   │ │  - Tautkan link di Kolom J        │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 3. Panduan Penggunaan Fitur Utama

### 3.1 Pembuatan Surat Tugas Baru
1. Buka aplikasi di browser (akses menu tab **Generator** pada bagian atas).
2. Perhatikan bagian header Navbar: Nomor urut surat berikutnya akan ditampilkan otomatis (misal: `853/SJ.9/KP.01.06/10/2026`).

---

### 3.2 Ekstraksi Undangan Otomatis Berbasis AI
Jika Anda memiliki dokumen surat undangan acara (format PDF, JPG, atau PNG):
1. Pada **Kotak 1: Dasar Undangan & Acara**, klik tombol **"Pindai Undangan (AI)"** bertanda bintang ✨.
2. Unggah file dokumen undangan (bisa dengan *drag-and-drop* atau klik untuk memilih file).
3. Klik tombol **"Mulai Ekstraksi AI"**.
4. Dalam beberapa detik, AI akan membaca teks dokumen dan menampilkan ringkasan data acara.
5. Anda dapat mengoreksi data pada layar pratinjau AI jika diperlukan.
6. Klik **"Terapkan ke Formulir"**. Semua isian nama acara, instansi pengundang, tanggal pelaksanaan, lokasi, serta narasi formal *Menimbang*, *Dasar*, dan *Untuk* akan terisi secara otomatis!

---

### 3.3 Pemilihan Personil & Pejabat Penandatangan
1. **Waktu & Lokasi Kegiatan (Kotak 2)**: Pastikan rentang tanggal mulai s.d. selesai, jam pelaksanaan, dan kota tempat kegiatan sudah sesuai.
2. **Personil yang Ditugaskan (Kotak 3)**:
   - Gunakan kolom pencarian cepat untuk mencari staf berdasarkan Nama atau NIP.
   - Klik pada baris nama staf untuk memilih (nama yang terpilih akan ditandai dengan centang biru/hijau).
   - Anda dapat memilih 1 orang atau banyak pegawai.
   - *Catatan Penting*: Jika memilih **1 sampai 3 orang**, biodata lengkap personil akan tampil langsung di halaman utama surat. Jika memilih **lebih dari 3 orang**, sistem otomatis menyusun format *Daftar Terlampir* dan melampirkan tabel data di Halaman 2 secara rapi.
3. **Penandatangan & Pejabat (Kotak 4)**:
   - Pilih nama Pejabat Penandatangan (otomatis membedakan status jabatan **Kapus** atau **Plh. Kapus**).
   - Opsi: Anda dapat mengunggah tanda tangan basah (scan PNG transparan) atau membiarkan sistem menggunakan penanda TTE BSrE resmi.
   - Pilih staf **Konseptor** (staf TU yang menyusun surat).
   - Atur **Tanggal Surat Dibuat**.

---

### 3.4 Fitur Edit Langsung pada Lembar Pratinjau
Selain melalui formulir kiri, Anda dapat **mengklik langsung** pada teks dokumen di layar pratinjau sebelah kanan:
* Klik bagian teks narasi **Menimbang**, **Dasar**, **Untuk**, atau **Penutup**.
* Ketikkan perubahan kata/kalimat secara leluasa layaknya mengetik di Microsoft Word.
* Teks yang Anda ubah akan langsung diterapkan pada dokumen cetak dan PDF yang diunduh.

---

### 3.5 Unduh PDF Resmi & Cetak Dokumen
Pada toolbar di atas lembar pratinjau surat:
* **Tombol "Unduh PDF"**: Menghasilkan berkas PDF siap cetak dengan penamaan standar otomatis:  
  `Surat_Tugas_[Nomor]_[Bulan]_[Tahun].pdf`.
* **Tombol "Cetak"**: Membuka dialog pencetakan browser untuk mencetak langsung ke printer fisik kantor.

---

### 3.6 Penerbitan & Sinkronisasi ke Google Sheets + Google Drive
Setelah naskah surat dipastikan benar:
1. Klik tombol **"Terbitkan & Simpan"** (berwarna hijau).
2. Sistem akan bekerja otomatis di latar belakang:
   - Mengonversi dokumen surat menjadi file arsip PDF resolusi tinggi.
   - Mengunggah file PDF ke folder Google Drive kantor sesuai bulan berjalan (misal: folder `10 - Oktober 2026`).
   - Mencatatkan 1 baris register baru di Google Spreadsheet kantor Anda.
   - Menaruh tautan berkas PDF Google Drive langsung di **Kolom J (Kolom 10)**.
3. Muncul notifikasi sukses dan tautan langsung untuk membuka file di Google Drive.

---

## 4. Fitur Edit Naskah Surat yang Sudah Diterbitkan

Jika terdapat perubahan naskah pada surat tugas yang **sudah pernah dibuat dan dicatat di Spreadsheet** (misal ada penggantian personil, ralat tanggal kegiatan, atau perbaikan nomor surat undangan):

1. Masuk ke tab **Buku Agenda & Database** di bagian atas.
2. Pada tabel arsip surat, cari nomor surat yang ingin diperbaiki.
3. Pada kolom paling kanan (**AKSI**), klik tombol **"Edit"**.
4. Sistem otomatis berpindah ke halaman **Generator** dan mengaktifkan **Mode Edit**:
   - Ditandai dengan banner kuning:  
     `✏️ Mode Edit: Surat Tugas No. [Nomor Lengkap]. Nomor urut tetap dipertahankan.`
   - Semua data yang sebelumnya terdaftar akan dimuat kembali ke formulir dan lembar naskah surat.
5. Silakan lakukan perubahan yang diperlukan (tambah/kurang pegawai, edit klausul, dsb).
6. Pada toolbar pratinjau, klik tombol **"Perbarui Surat"**.
7. Sistem akan:
   - Memperbarui baris surat yang sama di Google Spreadsheet (tanpa membuat baris baru).
   - Mengunggah ulang berkas PDF yang sudah diperbaiki ke Google Drive.
   - Menjaga urutan nomor persuratan tetap konsisten dan tidak meloncat.
8. Jika batal mengedit, cukup klik tombol **"Batal Edit"** atau **"Kembali ke Surat Baru"**.

---

## 5. Pengelolaan Database & Buku Agenda Persuratan

Klik tab navigasi **Buku Agenda & Database** untuk mengakses seluruh basis data kantor:

### 5.1 Arsip Register Surat Tugas
Tabel ini menampilkan data persuratan persis seperti susunan Google Spreadsheet kantor:
* **Struktur Kolom**:
  * **Kolom A**: NOMOR (Nomor urut surat)
  * **Kolom B**: TANGGAL (Format `d MMMM`, misal: `13 Oktober`)
  * **Kolom C**: JENIS (`ST`)
  * **Kolom D**: KEPADA (Nama pegawai atau *Daftar Terlampir*)
  * **Kolom E**: HAL + TANGGAL UNDANGAN
  * **Kolom F**: STATUS TTD (`Kapus` / `Plh. Kapus`)
  * **Kolom G**: TOPIK TIM
  * **Kolom H**: KONSEPTOR
  * **Kolom I**: STATUS SURAT (`OK`)
  * **Kolom J**: **Link Berkas PDF** (Dilengkapi tombol pintas **PDF Drive** untuk membuka arsip)
  * **Kolom K**: Link TTE / Cadangan
  * **Kolom AKSI**: Tombol **Edit** untuk merevisi naskah surat.
* **Fitur Filter & Navigasi**:
  * Filter berdasarkan Tahun, Jenis Surat, Status TTD, Topik Tim, dan Status Surat.
  * Fitur pencarian instan (ketik nomor, perihal, atau nama staf).
  * Fitur pagination (25 data per halaman) dan kotak lompat halaman.

---

### 5.2 Kelola Data Pegawai Pusaka
Pilih sub-tab **Data Pegawai Pusaka**:
* **Tambah Pegawai Baru**: Klik tombol **"+ Tambah Pegawai"**, masukkan Nama, NIP, Pangkat/Golongan, Jabatan, dan Unit Kerja.
* **Ubah Data**: Klik ikon pensil pada baris pegawai untuk memperbarui data pegawai.
* **Hapus Pegawai**: Klik ikon tempat sampah jika pegawai sudah tidak bertugas.
* **Status Cuti / Aktif**: Klik tombol badge status untuk mengganti status pegawai (pegawai yang sedang cuti akan diberi label pengingat).

---

### 5.3 Kelola Pejabat Penandatangan
Pilih sub-tab **Pejabat Penandatangan**:
* Tambahkan pejabat definitif atau Pelaksana Harian (Plh).
* Tentukan pejabat *Default* (pejabat yang otomatis terpilih saat aplikasi dibuka).

---

## 6. Integrasi & Pemeliharaan Google Apps Script

Aplikasi terhubung dengan Google Sheets dan Google Drive menggunakan perantara skrip **Google Apps Script** yang tersimpan pada file `google-apps-script/Code.gs`.

### 6.1 Cara Update Script di Google Spreadsheet
Setiap kali ada pembaruan kode pada file `Code.gs`:
1. Buka file Google Spreadsheet database kantor Anda di browser.
2. Di bilah menu atas Google Sheets, klik menu **Ekstensi** (*Extensions*) → pilih **Apps Script**.
3. Di editor Apps Script, buka file `Code.gs`.
4. Hapus seluruh isi lama, lalu salin (*paste*) seluruh kode terbaru dari file `google-apps-script/Code.gs`.
5. Klik ikon **Simpan** (💾 disket) atau tekan `Ctrl + S`.
6. Klik tombol biru **Terapkan** (*Deploy*) di sudut kanan atas → pilih **Kelola Penerapan** (*Manage Deployments*).
7. Klik ikon **Pensil** (*Edit*) pada deployment aktif Anda.
8. Pada bagian **Versi** (*Version*), ubah dari versi lama menjadi **Versi Baru** (*New Version*).
9. Klik **Terapkan** (*Deploy*).
10. Selesai! Web App Anda telah menjalankan versi terbaru tanpa mengubah URL Web App.

---

### 6.2 Fitur Menu Tambahan pada Google Sheets
Saat Google Spreadsheet kantor Anda dibuka dan di-refresh, akan muncul menu khusus di bilah toolbar atas:
* **📌 Pusaka Surat Tugas**:
  * **☁️ Otorisasi & Buat Folder Bulan Ini**: Untuk melakukan otorisasi Google Drive pertama kali atau membuat folder arsip bulan baru secara manual.
  * **📅 Perbaiki Format Tanggal (d MMMM) & Link PDF**: Otomatis memindai seluruh baris tabel, membetulkan format tanggal menjadi bahasa Indonesia dengan kalender date-picker, serta memperbaiki jika ada sel formula PDF yang bertuliskan `#ERROR!`.

---

## 7. Pusat Bantuan & Troubleshooting

| Gejala / Kendala | Kemungkinan Penyebab | Solusi Penanganan |
| :--- | :--- | :--- |
| **Status bar bertuliskan "Akses dibatasi oleh Google (perlu login)"** | Pengaturan hak akses deployment Apps Script belum terbuka untuk umum. | Buka Apps Script → *Manage Deployments* → *Edit* → Pastikan pada bagian **"Who has access"** dipilih opsi **"Anyone"** (Siapa saja). |
| **Peringatan "Err Drive: Access denied" saat menyimpan surat** | Akun Google Anda belum memberikan izin ke folder Google Drive arsip. | Di Google Sheets, klik menu **"📌 Pusaka Surat Tugas"** → **"☁️ Otorisasi & Buat Folder Bulan Ini"**, lalu setujui izin akses Google. |
| **Double-click tanggal di Spreadsheet tidak memunculkan kalender** | Validasi tanggal belum terpasang pada baris bersangkutan. | Klik menu **"📌 Pusaka Surat Tugas"** → **"📅 Perbaiki Format Tanggal & Link PDF"** pada spreadsheet kantor Anda. |
| **Teks dokumen surat terpotong saat diekspor ke PDF** | Pengaturan skala printer browser tidak standar. | Gunakan tombol **"Unduh PDF"** bawaan aplikasi (tombol hijau tua) yang sudah diprogram otomatis mengunci skala kertas standar A4 100%. |
| **Nomor surat tidak sengaja meloncat** | Sebelumnya membuat surat tetapi tidak disimpan atau ada nomor yang terhapus manual di sheet. | Masuk ke Google Sheets kantor Anda, rapikan baris nomor pada Kolom A, lalu tekan tombol **Refresh Sinkronisasi** di pojok kanan atas aplikasi. |

---

*Manual Book ini disusun untuk kelancaran operasional Tata Usaha Pusat Kebijakan Strategis, Kementerian Komunikasi dan Digital RI.*
