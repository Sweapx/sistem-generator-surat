# PANDUAN LENGKAP STRUKTUR, POLA KALIMAT, TIPOLOGI, DAN OTOMATISASI DOKUMEN NOTA DINAS
> **Dokumen Acuan Arsitektur Template & Prompt Engineering Otomatisasi Nota Dinas**  
> Fokus Spesifik: **Naskah Dinas Intern — Nota Dinas**  
> Unit Kerja Acuan: Pusat Kebijakan Strategis (`SJ.9`), Sekretariat Jenderal, Kementerian Komunikasi dan Digital RI  
> Basis Analisis: 37 Dokumen Sampel Murni Nota Dinas (dari total 44 berkas sampel)

---

## 1. DEFINISI & KARAKTERISTIK UMUM NOTA DINAS

**Nota Dinas** adalah bentuk naskah dinas intern yang dibuat oleh pejabat dalam melaksanakan tugas dan fungsinya guna menyampaikan laporan, pemberitahuan, pernyataan, permintaan, atau penyampaian pendapat kepada pejabat lain di dalam lingkungan instansi/kementerian yang sama.

### Karakteristik Utama Nota Dinas:
1. **Lingkup Internal**: Hanya digunakan antar-pejabat/unit kerja di dalam satu instansi (tidak boleh ditujukan kepada pihak eksternal di luar kementerian).
2. **Arah Komunikasi Fleksibel**:
   * **Vertikal ke Atas**: Kepala Pusat (`SJ.9`) kepada Sekretaris Jenderal (`SJ`).
   * **Horizontal**: Kepala Pusat (`SJ.9`) kepada Kepala Biro (`SJ.2`, `SJ.3`, `SJ.1`, `SJ.5`), Sekretaris Ditjen, Kepala Pusdatin, atau Inspektur.
   * **Vertikal ke Bawah / Lintas Unit**: Kepala Pusat kepada Ketua Tim Kerja / Daftar Pejabat Terlampir.
3. **Gaya Bahasa**:
   * Menggunakan sudut pandang institusional kata ganti jamak (**"kami"**), bukan personal (*"saya"*).
   * Lugas, objektif, santun, dan selalu diawali dengan dasar pijakan hukum/administratif (*legal/administrative ground*).
4. **Pengesahan**: Ditandatangani oleh pejabat yang berwenang (Kepala Pusat) menggunakan Tanda Tangan Elektronik (TTE BSrE) tanpa cap/stempel dinas basah.

---

## 2. ANATOMI & STRUKTUR FISIK NOTA DINAS

Setiap dokumen Nota Dinas wajib mengikuti tata letak (layout) 5 blok struktural berikut secara berurutan:

```text
================================================================================
[BLOK 1: KOP NASKAH DINAS / HEADER]
KEMENTERIAN KOMUNIKASI DAN DIGITAL RI
SEKRETARIAT JENDERAL
PUSAT KEBIJAKAN STRATEGIS
Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735 www.komdigi.go.id
--------------------------------------------------------------------------------

[BLOK 2: JUDUL & NOMOR NASKAH DINAS]
                                  NOTA DINAS
                  Nomor: {No_Urut}/SJ.9/{Kode_Klasifikasi}/{Bulan}/{Tahun}

[BLOK 3: METADATA TUJUAN & ATRIBUT SURAT]
Kepada Yth. : {Jabatan_Penerima}
Dari        : Kepala Pusat Kebijakan Strategis
Hal         : {Perihal_Pokok_Nota_Dinas}
Sifat       : {Biasa / Segera / Rahasia}
Lampiran    : {- / Jumlah_Berkas_atau_Halaman}
Tanggal     : {Tanggal_Bulan_Tahun}
--------------------------------------------------------------------------------

[BLOK 4: BATANG TUBUH / ISI NOTA DINAS]
1. Paragraf Pembuka (Dasar Rujukan / Latar Belakang + Kalimat Inti Tindakan)
2. Paragraf Isi / Substansi (Rincian Data / Blok Pegawai / Tabel / Poin Capaian)
3. Paragraf Informasi Tambahan (Tautan Google Drive / Shortlink / Alamat Email)
4. Paragraf Penutup (Kalimat Penutup Baku + Ucapan Terima Kasih)

[BLOK 5: KAKI SURAT / PENGESAHAN & CATATAN TTE]
                                                    {Jabatan_Penandatangan_Opsional}
                                                    [ Ruang TTE / Barcode BSrE ]
                                                    {Nama_Lengkap_Pejabat}

Tembusan: (Jika ada)
1. {Jabatan_Tembusan_1}

Catatan:
- UU ITE No 11 Tahun 2008 Pasal 5 ayat 1 "Informasi Elektronik dan/atau Dokumen
  Elektronik dan/atau hasil cetaknya merupakan alat bukti hukum yang sah."
- Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat
  elektronik yang diterbitkan BSrE.
================================================================================
```

### Aturan Detail Blok Metadata:
* **Format Nomor**: `{Nomor_Urut}/SJ.9/{Kode_Klasifikasi}/{Bulan}/{Tahun}`  
  Contoh: `862/SJ.9/KP.01.06/09/2026`
* **Kepada Yth.**: Selalu menulis **Nama Jabatan** (contoh: `Sekretaris Jenderal` atau `Kepala Biro Sumber Daya Manusia dan Organisasi`), **bukan nama pribadi pejabatnya**. Jika penerima lebih dari 3 jabatan, ditulis `(Daftar Terlampir)`.
* **Dari**: Selalu `Kepala Pusat Kebijakan Strategis`.
* **Hal**: Ringkas, padat, diawali kata benda verbal seperti `Penyampaian ...`, `Permohonan ...`, `Pengajuan ...`, atau `Usulan ...`.
* **Sifat / Klasifikasi**: Umumnya `Biasa`. Gunakan `Segera` untuk tanggapan audit BPK/reviu anggaran mendesak, dan `Rahasia` untuk laporan capaian strategis tertentu atau dokumen evaluasi SDM (IDP).

---

## 3. POLA PARAGRAF PEMBUKA (6 FORMULA BAKU)

Paragraf pembuka Nota Dinas selalu terdiri dari **satu kalimat majemuk lengkap** yang menggabungkan **Anak Kalimat (Dasar/Alasan)** dan **Induk Kalimat (Pernyataan Penyampaian/Permohonan)**:

$$\underbrace{\text{[Anak Kalimat: Dasar Rujukan / Konteks]}}_{\text{Menindaklanjuti / Berdasarkan / Sehubungan / Dalam rangka...}} + \text{", "} + \underbrace{\text{[Induk Kalimat: Tindakan Utama]}}_{\text{bersama ini kami sampaikan / mengajukan permohonan...}}$$

Berikut adalah **6 Pola Baku Paragraf Pembuka** beserta variabel dan contoh riilnya:

---

### Pola Pembuka 1: Tindak Lanjut Nota Dinas / Surat Masuk *(Frekuensi: ~42%)*
Digunakan ketika Nota Dinas dibuat sebagai balasan atau pemenuhan atas permintaan dari unit kerja lain (Biro SDM, Biro Umum, Biro Keuangan, Inspektorat Jenderal).

* **Rumus Template**:
  > *"Menindaklanjuti Nota Dinas `{Jabatan_Pengirim_Asal}` Nomor: `{Nomor_ND_Asal}` tanggal `{Tanggal_ND_Asal}` perihal `{Perihal_ND_Asal}`, bersama ini kami `{sampaikan / mengajukan permohonan}` `{Objek_Utama_Surat}`..."*
* **Variasi Awalan**: `"Menindaklanjuti Nota Dinas..."` atau `"Dalam rangka menindaklanjuti Nota Dinas..."`
* **Contoh Riil Dokumen**:
  1. **Penyampaian Data Sertifikat PPK (ND 43)**:
     *"Menindaklanjuti Nota Dinas Plh. Kepala Biro Umum Nomor: 22/SJ.5/UP.01.06/01/2026 tanggal 6 Januari 2026 perihal Permohonan Data Pegawai yang telah Memiliki Sertifikat PPK Level A, B, dan C, bersama ini kami sampaikan telah mengisi data pegawai pada tautan https://s.komdigi.go.id/EzysJ sebagaimana dalam instruksi dan berkas terlampir."*
  2. **Penyampaian Pakta Integritas (ND 862)**:
     *"Dalam rangka menindaklanjuti Nota Dinas Kepala Biro Sumber Daya Manusia dan Organisasi Nomor 5044/SJ.2/KP.01.06/09/2026 tanggal 15 September 2026 tentang Pembuatan Pakta Integritas Pencegahan dan Pemberantasan Aktivitas Judi Online dan/atau Judi Slot Bagi ASN (PNS dan PPPK) Formasi Tahun 2024, bersama ini kami sampaikan bahwa Pakta Integritas pegawai Pusat Kebijakan Strategis yang telah ditandatangani akan kami sampaikan..."*
  3. **Tindak Lanjut Hasil Reviu Anggaran (ND 601)**:
     *"Menindaklanjuti Nota Dinas Inspektur IV Nomor 283/IJ.5/PW.04.04/07/2026 tanggal 17 Juli 2026 dan Laporan Hasil Reviu Nomor T-282/IJ.5/PW.04.04/07/2026, bersama ini kami sampaikan tindak lanjut Pusat Kebijakan Strategis atas catatan hasil reviu terhadap usulan tambahan anggaran PNBP Tahun Anggaran 2026."*

---

### Pola Pembuka 2: Tindak Lanjut Keputusan Menteri (SK) / Regulasi *(Frekuensi: ~14%)*
Digunakan saat mengajukan penyesuaian hak keuangan atau administrasi kepegawaian setelah terbitnya SK pengangkatan/mutasi/tugas belajar.

* **Rumus Template**:
  > *"Menindaklanjuti `{Keputusan Menteri / Surat}` `{Pejabat_Penerbit_SK}` Nomor `{Nomor_SK}` tanggal `{Tanggal_SK}` tentang `{Judul_SK}`, bersama ini kami mengajukan permohonan untuk dilakukan `{Nama_Tindakan}` TMT `{Tanggal_TMT}` bagi pegawai yang telah ditetapkan dalam jabatan `{Nama_Jabatan}`, dengan informasi pegawai sebagai berikut:"*
* **Contoh Riil Dokumen**:
  1. **Penyesuaian Gaji & Tukin Jabatan Fungsional (ND 31 & ND 370)**:
     *"Menindaklanjuti Keputusan Menteri Komunikasi dan Digital Republik Indonesia Nomor: 3296/KP.04.07 Tahun 2026 tanggal 20 April 2026 tentang 'Pengangkatan Melalui Perpindahan Dari Jabatan Lain Kedalam Jabatan Fungsional Analis Kebijakan Menteri Komunikasi dan Digital Republik Indonesia', bersama ini kami mengajukan permohonan untuk dilakukan penyesuaian Gaji Pokok dan Tunjangan Kinerja TMT 27 April 2026 bagi pegawai yang telah ditetapkan dalam jabatan Analis Kebijakan Ahli Pertama, dengan informasi pegawai sebagai berikut:"*
  2. **Pemberhentian JF karena Tugas Belajar (ND 330)**:
     *"Menindaklanjuti Surat Kepala Biro Sumber Daya Manusia dan Organisasi Nomor: 2395/SJ.2/KP.01.11/04/2026 tentang Surat Tugas Belajar, bersama dengan ini kami ajukan permohonan untuk Pemberhentian Jabatan Fungsional Penata Kelola Spektrum Frekuensi Radio Ahli Pertama sesuai dengan peraturan yang berlaku dikarenakan mengikuti Tugas Belajar, dengan informasi pegawai sebagai berikut:"*

---

### Pola Pembuka 3: Mandat Arahan Pimpinan / Disposisi / Hasil Rapat *(Frekuensi: ~16%)*
Digunakan khusus untuk Nota Dinas strategis (umumnya ditujukan kepada Sekretaris Jenderal atau Kepala Biro Perencanaan) yang melaporkan hasil kajian, konsep jawaban Menteri, laporan *Quickwin*, atau usulan anggaran hasil rapat.

* **Rumus Template**:
  > *"Berdasarkan `{arahan / disposisi / hasil Rapat Pimpinan (RAPIM) / Hasil Rapat Koordinasi}` `{Jabatan_Pimpinan_atau_Nama_Rapat}` pada tanggal `{Tanggal_Rapat_Arahan}` terkait `{Topik_Bahasan}`, bersama ini dengan hormat kami sampaikan `{Dokumen_Output_atau_Usulan}` sebagai berikut:"*
* **Contoh Riil Dokumen**:
  1. **Laporan Progres Quickwin (ND 03)**:
     *"Menindaklanjuti hasil Rapat Pimpinan (RAPIM) pada tanggal 28 Februari 2025 serta sebagai bagian dari monitoring pelaksanaan program prioritas nasional, bersama ini kami sampaikan laporan perkembangan quickwin periode 24 - 31 Desember 2025 dengan highlight capaian yang paling berdampak, visible secara publik dan sinergis lintas sektor sebagai berikut:"*
  2. **Telaah Isu Strategis atas Arahan Menteri (ND 30 & ND 32)**:
     *"Berdasarkan arahan Ibu Menteri pada tanggal 13 Januari 2026 terkait analisis isu dugaan Data Breach Instagram, serta penyiapan bahan Tapping Wawancara POVGOV (Narasi) mengenai Isu Kecerdasan Artifisial, bersama ini kami sampaikan hasil telaah dari isu dimaksud dan draft jawaban sebagai acuan yang telah disusun oleh Pusat Kebijakan Strategis."*
  3. **Usulan Tambahan Anggaran Pasca Rapat Koordinasi (ND 861)**:
     *"Menindaklanjuti Rapat Koordinasi Usulan Tambahan Setjen TA 2026 yang dilaksanakan pada tanggal 18 September 2026, bersama ini dengan hormat kami sampaikan kepada Bapak Sekjen usulan penambahan anggaran TA 2026 di lingkungan Pusat Kebijakan Strategis melalui skema pendanaan dari satuan kerja penghasil Pendapatan Negara Bukan Pajak (PNBP)..."*

---

### Pola Pembuka 4: Pemenuhan Syarat Administratif Berkala ("Sehubungan dengan..." / "Dengan telah...") *(Frekuensi: ~14%)*
Digunakan ketika satuan kerja berinisiatif mengusulkan hak kepegawaian periodik (Kenaikan Pangkat, Kenaikan Gaji Berkala/KGB, Pembaruan SK) atau merespons perkembangan isu kebijakan/perubahan anggaran.

* **Rumus Template (Varian SDM)**:
  > *"Dengan telah terpenuhinya syarat `{kenaikan gaji berkala / administratif dan kinerja pegawai}`, bersama ini kami `{sampaikan informasi untuk dilakukan proses / mengusulkan pengajuan}` `{Jenis_Layanan_SDM}` TMT `{Tanggal_TMT}` untuk pegawai atas nama sebagai berikut:"*
* **Rumus Template (Varian Kebijakan/Anggaran)**:
  > *"Sehubungan dengan `{Kondisi_Aktual_atau_Kewajiban_Regulasi}`, bersama ini kami sampaikan `{Usulan_atau_Hasil_Analisis}`..."*
* **Contoh Riil Dokumen**:
  1. **Pengajuan KGB Berkala (ND 44, ND 48, ND 69)**:
     *"Dengan telah terpenuhinya syarat kenaikan gaji berkala bersama ini kami sampaikan informasi untuk dilakukan proses Kenaikan Gaji Berkala (KGB) TMT 01 Maret 2026 untuk pegawai atas nama sebagai berikut:"*
  2. **Pengajuan Kenaikan Pangkat (ND 16 & ND 46)**:
     *"Sehubungan dengan telah dipenuhinya persyaratan administratif dan kinerja pegawai di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengusulkan pengajuan Kenaikan Pangkat Pegawai Pusat Kebijakan Strategis TMT 01 Maret 2026 dengan informasi sebagai berikut:"*
  3. **Revisi Pergeseran Anggaran (ND 671)**:
     *"Sehubungan dengan terdapatnya beberapa pergeseran output kegiatan serta perubahan skala prioritas pemenuhan target kinerja di lingkungan Pusat Kebijakan Strategis, bersama ini kami sampaikan Usulan Revisi Anggaran pada Pusat Kebijakan Strategis TA 2026."*

---

### Pola Pembuka 5: Tujuan Fungsional & Tata Kelola ("Dalam rangka...") *(Frekuensi: ~11%)*
Digunakan ketika unit kerja mengajukan inisiatif kegiatan baru, permohonan fasilitas kerja, pembentukan tim koordinasi, atau tertib administrasi aset.

* **Rumus Template**:
  > *"Dalam rangka `{Tujuan_Kedinasan_atau_Kepatuhan_Regulasi}`, bersama ini kami `{mengajukan permohonan / mengusulkan}` `{Bentuk_Permohonan}` dengan rincian sebagai berikut:"*
* **Contoh Riil Dokumen**:
  1. **Pengajuan Uji Kompetensi (ND 15)**:
     *"Dalam rangka penguatan pelaksanaan tugas dan fungsi di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengusulkan pengajuan uji kompetensi Pegawai Pusat Kebijakan Strategis melalui Jalur Perpindahan Jabatan, dengan informasi pegawai sebagai berikut:"*
  2. **Permohonan Pelaksanaan MCU (ND 52)**:
     *"Dalam rangka menjamin kesehatan dan keselamatan kerja serta meningkatkan produktivitas pegawai di lingkungan Pusat Kebijakan Strategis, dengan ini kami mengajukan permohonan Pemanfaatan Anggaran di satuan kerja Pusat Kebijakan Strategis untuk pelaksanaan kegiatan medical check-up (MCU), dengan pertimbangan urgensi sebagai berikut:"*
  3. **Penetapan Status Penggunaan BMN (ND 39)**:
     *"Dalam rangka tertib administrasi pengelolaan Barang Milik Negara berdasarkan Peraturan Menteri Keuangan Republik Indonesia Nomor 246/PMK.06/2014, bersama ini kami sampaikan permohonan Penetapan Status Penggunaan Barang Milik Negara di Lingkungan Pusat Kebijakan Strategis..."*

---

### Pola Pembuka 6: Permohonan Teknis Langsung ("Bersama ini...") *(Frekuensi: ~3%)*
Digunakan untuk urusan teknis operasional singkat dan langsung ke sasaran (seperti pembukaan akses aplikasi kepegawaian).

* **Rumus Template**:
  > *"Bersama ini kami mengajukan permohonan `{Bentuk_Permohonan_Teknis}` dikarenakan `{Alasan_Teknis}` bagi pegawai atas nama:"*
* **Contoh Riil Dokumen (ND 403)**:
  *"Bersama ini kami mengajukan permohonan pembukaan kembali akses aplikasi E-Kinerja dikarenakan belum dilakukannya proses penilaian Sasaran Kinerja Pegawai (SKP) bagi pegawai atas nama:"*

---

## 4. POLA PARAGRAF ISI / SUBSTANSI (5 FORMAT PENYAJIAN)

Bagian batang tubuh (isi utama) Nota Dinas disusun menggunakan salah satu atau kombinasi dari **5 Format Struktur Isi** berikut:

---

### Format Isi 1: Blok Atribut Identitas Pegawai (*Key-Value Block*)
Digunakan apabila Nota Dinas hanya mengusulkan **1 (satu) orang pegawai**. Terdapat 4 variasi field sesuai perihal surat:

* **Varian A — Penyesuaian Gaji & Tukin / Buka Akses E-Kinerja (ND 31, 370, 403)**:
  ```text
  Nama         : {nama_lengkap}
  NIP          : {nip}
  Jabatan Baru : {nama_jabatan_fungsional_atau_struktural}
  Unit Kerja   : Pusat Kebijakan Strategis
  ```
* **Varian B — Kenaikan Gaji Berkala / KGB Individu (ND 44, 69)**:
  ```text
  Nama         : {nama_lengkap}
  NIP          : {nip}
  Pangkat/Gol  : {nama_pangkat} - {golongan_ruang}
  Satuan Kerja : Pusat Kebijakan Strategis
  ```
* **Varian C — Kenaikan Pangkat Individu (ND 16, 46)**:
  ```text
  Nama                : {nama_lengkap}
  NIP                 : {nip}
  Pangkat saat ini    : {pangkat_lama} ({gol_lama})
  Pangkat yang dituju : {pangkat_baru} ({gol_baru})
  ```
* **Varian D — Pengajuan Uji Kompetensi Perpindahan Jabatan (ND 15)**:
  ```text
  Nama                : {nama_lengkap}
  NIP                 : {nip}
  Jabatan saat ini    : {jabatan_lama}
  Jabatan yang dituju : {jabatan_fungsional_tujuan}
  ```

---

### Format Isi 2: Tabel Rekapitulasi Terstruktur (*Structured Table*)
Digunakan apabila data yang disampaikan bersifat **kolektif (>1 pegawai)** atau berupa **rincian mata anggaran/reviu**.

* **Varian A — Tabel Daftar Pegawai Kolektif (ND 41 Bukti Potong Pajak, ND 48 KGB Kolektif, ND 11 Tim Pengawasan)**:
  | No | Nama | NIP | Pangkat/Gol | Jabatan / Satuan Kerja |
  | :---: | :--- | :--- | :--- | :--- |
  | 1 | `{nama_1}` | `{nip_1}` | `{pangkat_1}` | Pusat Kebijakan Strategis |
  | 2 | `{nama_2}` | `{nip_2}` | `{pangkat_2}` | Pusat Kebijakan Strategis |

* **Varian B — Tabel Rincian Kegiatan & Usulan Anggaran (ND 861)**:
  | No. | Nama Kegiatan | Usulan Anggaran (Rp) |
  | :---: | :--- | ---: |
  | 1. | `{nama_kegiatan_1}` | `{nominal_1}` |
  | 2. | `{nama_kegiatan_2}` | `{nominal_2}` |

* **Varian C — Tabel Ikhtisar Jenis Belanja (ND 568)**:
  | Jenis Belanja | Nilai (Rp) | Persentase (%) |
  | :--- | ---: | :---: |
  | Belanja Barang/Jasa (52) | `{nominal_52}` | `{persen_52}%` |
  | Belanja Modal (53) | `{nominal_53}` | `{persen_53}%` |
  | **Total Belanja** | **`{total_nominal}`** | **100%** |

* **Varian D — Tabel Matriks Rincian Output / Tindak Lanjut Reviu (ND 402 & ND 601)**:
  | No. | Nama RO / Pokok Catatan Reviu Itjen | Justifikasi / Tindak Lanjut Penyempurnaan |
  | :---: | :--- | :--- |
  | 1. | `{pokok_reviu_atau_ro}` | `{penjelasan_justifikasi_dan_tindak_lanjut}` |

---

### Format Isi 3: Poin Narasi Eksekutif (*Numbered Executive Highlights*)
Digunakan pada Nota Dinas yang bersumber dari **Laporan Capaian, Policy Brief, atau Kajian Regulasi** (contoh: ND 03, ND 27, ND 52, ND 54, ND 55).
* **Struktur Penulisan Tiap Poin**:
  `{Nomor}. {Judul_Aspek_Kajian_atau_Nama_Program}: {Narasi_Temuan_Utama_dan_Angka_Capaian_Kuantitatif}. {Dampak_atau_Rekomendasi_Tindak_Lanjut}.`
* **Contoh Pola (ND 03 & ND 54)**:
  1. **Capaian Penanganan Konten Negatif**: Hingga 31 Desember 2025, telah dilakukan penanganan terhadap `3.445.904` konten negatif yang terdiri dari `690.337` konten pornografi dan `2.755.567` konten perjudian online melalui kolaborasi lintas sektor.
  2. **Akselerasi Talenta Digital**: Tercatat `90.964` peserta lulus pelatihan *Digital Talent Scholarship* (melampaui target `44.250` peserta) dan `341.290` peserta lulus pelatihan *Microskill*.

---

### Format Isi 4: Narasi Tunggal + Klausul Tautan Digital (*Cloud Link / Email Clause*)
Digunakan ketika dokumen utama berada di lampiran atau folder cloud, sehingga batang tubuh Nota Dinas hanya berisi pengantar singkat yang diikuti klausa akses berkas:
* **Klausa Google Drive / Shortlink**:
  > *"Seluruh data dukung dan kelengkapan berkas sebagaimana dimaksud dapat diakses/diunduh melalui tautan berikut: `{url_tautan}`."*
* **Klausa Pengiriman Email**:
  > *"Adapun dokumen yang telah ditandatangani secara lengkap kami sampaikan melalui surat elektronik (email) ke alamat `{email_tujuan}`."*

---

### Format Isi 5: Narasi Permohonan Koordinasi Lintas Unit (ND 01)
Digunakan saat meminta satker lain mengirimkan nama perwakilan (PIC/Anggota Tim):
* **Paragraf 1 (Konteks)**: Menjelaskan urgensi program dan perlunya koordinasi lintas unit kerja.
* **Paragraf 2 (Instruksi/Permintaan)**: *"Untuk mendukung kelancaran proses koordinasi tersebut, mohon kiranya Saudara dapat menyampaikan usulan `{jumlah_orang}` nama sebagai Person in Charge (PIC) pada masing-masing unit kerja paling lambat pada `{batas_waktu}` melalui narahubung `{nama_dan_kontak_pic}`."*

---

## 5. POLA PARAGRAF PENUTUP (4 VARIASI BAKU NOTA DINAS)

Pemilihan kalimat penutup pada Nota Dinas ditentukan secara otomatis oleh **2 parameter**: (1) **Siapa Penerimanya (`Kepada Yth.`)** dan (2) **Apa Maksud Suratnya (`Penyampaian` vs `Permohonan`)**.

### 1. Penutup Standar Horizontal (Antar-Eselon II: Kepala Pusat ke Kepala Biro / Inspektur / Sesditjen)
Digunakan untuk 80% Nota Dinas rutin kepegawaian, keuangan, pengawasan, dan umum:
> *"Demikian kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."*  
> *(Variasi pasif: "Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.")*

### 2. Penutup Vertikal ke Atas (Kepala Pusat kepada Sekretaris Jenderal — Memohon Arahan)
Digunakan ketika Kepala Pusat menyampaikan hasil telaah kebijakan, konsep jawaban Menteri, atau laporan strategis kepada Sekretaris Jenderal (contoh: ND 30, ND 32, ND 50):
> *"Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian dan kerja sama Bapak Sekjen, kami ucapkan terima kasih."*

### 3. Penutup Permohonan Persetujuan / Fasilitasi Anggaran & Aset
Digunakan ketika memohon izin pemanfaatan anggaran (seperti MCU ke Sekjen pada ND 52), fasilitasi pembiayaan (ND 26), atau penetapan status BMN (ND 39):
> *"Demikian permohonan ini kami sampaikan. Atas perkenan dan arahan Bapak/Ibu, kami ucapkan terima kasih."*

### 4. Penutup Mendesak / Distribusi Cepat (Contoh: ND 41 Bukti Potong Pajak)
Digunakan ketika terdapat tenggat waktu eksternal yang ketat (seperti batas pelaporan pajak Coretax):
> *"Kami mohon agar dokumen tersebut dapat segera disampaikan kepada kami untuk selanjutnya didistribusikan kepada pegawai yang bersangkutan. Demikian kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih."*

---

## 6. LIMA (5) TIPOLOGI MURNI NOTA DINAS UNTUK OTOMATISASI

Setelah menyaring dokumen non-Nota Dinas, seluruh **37 dokumen Nota Dinas murni** terbagi habis ke dalam **5 Tipologi Master**. Sistem otomatisasi Anda cukup memilih salah satu dari 5 kerangka ini:

---

### TIPOLOGI 1: Nota Dinas Administrasi & Mutasi Kepegawaian (`ND_SDM`)
* **Cakupan Perihal**:
  1. Kenaikan Gaji Berkala / KGB (`KP.01.03` / `KP.01.04`)
  2. Penyesuaian Gaji Pokok dan Tunjangan Kinerja (`KP.01.03` / `KP.01.04`)
  3. Usulan Kenaikan Pangkat Reguler/Fungsional (`KP.04.04`)
  4. Pengajuan Uji Kompetensi & Fasilitasi Pembiayaan Ujikom JF (`KP.06.01` / `KP.01.04`)
  5. Pemberhentian Jabatan Fungsional karena Tugas Belajar (`KP.04.07`)
  6. Pembukaan Akses Aplikasi E-Kinerja SKP (`KP.06.06`)
  7. Pembuatan Surat Usulan Beasiswa LPDP & Pelatihan Internasional (`KP.01.06` / `KP.01.05`)
  8. Pembaruan Dokumen SK Kepegawaian (`KP.01.01`)
* **Penerima Default**:
  * Urusan Gaji, KGB, Tukin, SK Pembaruan Gaji $\rightarrow$ `Kepala Biro Keuangan dan Barang Milik Negara`
  * Urusan Pangkat, Ujikom, JF, E-Kinerja, LPDP, Diklat $\rightarrow$ `Kepala Biro Sumber Daya Manusia dan Organisasi`
* **Kombinasi Struktur**:
  `Pembuka Pola 2 atau 4` + `Format Isi 1 (Blok Pegawai) atau Format Isi 2A (Tabel Pegawai)` + `Format Isi 4 (Link GDrive Berkas)` + `Penutup Tipe 1`.

---

### TIPOLOGI 2: Nota Dinas Laporan Eksekutif, Telaah Kebijakan & Policy Brief (`ND_KEBIJAKAN`)
* **Cakupan Perihal**:
  1. Laporan Progres Berkala Program Prioritas / *Quickwin* (`PR.01.02`)
  2. Penyampaian Hasil Telaah Analisis Isu Strategis / UU ITE (`PR.02.01` / `PR.01.02`)
  3. Penyampaian Reviu Singkat Isu Publik / Kuota Internet Hangus (`PR.01.01`)
  4. Penyampaian Konsep Jawaban / Matriks Tanya Jawab Menteri (`PR.01.02`)
  5. Penyampaian *Policy Brief* atau Reviu Rancangan Peraturan / RPM (`PR.01.02` / `PR.02.01`)
* **Penerima Default**: `Sekretaris Jenderal`
* **Kombinasi Struktur**:
  `Pembuka Pola 3 (Arahan Menteri / Rapim / Konsultasi Publik)` + `Format Isi 3 (Poin Narasi Eksekutif / Ringkasan Kajian)` + `Penutup Tipe 2 (Mohon Arahan Bapak Sekjen)`.

---

### TIPOLOGI 3: Nota Dinas Perencanaan, Revisi & Pengawasan Anggaran (`ND_ANGGARAN`)
* **Cakupan Perihal**:
  1. Usulan Rincian Output (RO) Skema Pembiayaan PNBP (`KU.01.01`)
  2. Permohonan Usulan Penambahan Anggaran Tahun Berjalan (`PW.01.04`)
  3. Permohonan Reviu Usulan Tambahan Anggaran ke Itjen (`PW.01.04`)
  4. Penyampaian Tindak Lanjut Hasil Reviu Anggaran (`PW.04.04`)
  5. Usulan Revisi Anggaran / Pergeseran Belanja Perjalanan Dinas (`KU.01.02`)
  6. Penyampaian Tanggapan atas Konsep Temuan Pemeriksaan BPK (`KU.01.01`)
  7. Permohonan Bukti Potong Pajak PPh 21 Kolektif (`KU.01.01`)
* **Penerima Default**:
  * Usulan RO & Revisi POK/DIPA $\rightarrow$ `Kepala Biro Perencanaan`
  * Reviu Anggaran & Tindak Lanjut Reviu $\rightarrow$ `Inspektur IV` (Inspektorat Jenderal)
  * Persetujuan Tambahan Pagu Setjen $\rightarrow$ `Sekretaris Jenderal`
  * Temuan BPK & Bukti Potong Pajak $\rightarrow$ `Kepala Biro Keuangan dan Barang Milik Negara`
* **Kombinasi Struktur**:
  `Pembuka Pola 1 atau 3` + `Format Isi 2B/2C/2D (Tabel Rincian Anggaran / Matriks Reviu)` + `Format Isi 4 (Shortlink TOR/RAB)` + `Penutup Tipe 1`.

---

### TIPOLOGI 4: Nota Dinas Koordinasi Tim & Kepatuhan Organisasi (`ND_KOORDINASI`)
* **Cakupan Perihal**:
  1. Permohonan Usulan Nama PIC Tim Pemantauan Program Percepatan (`PR.01.02`)
  2. Usulan Nama Anggota Tim Penyusunan Laporan Strategis Hasil Pengawasan (`PW.02.01`)
  3. Penyampaian Dokumen *Individual Development Plan* / IDP Satker (`KP.05.01`)
  4. Penyampaian Pakta Integritas ASN (Pencegahan Judi Online) (`KP.01.06`)
  5. Penyampaian Data Pegawai Pemegang Sertifikat Kompetensi PPK (`KP.01.01`)
* **Penerima Default**: `Kepala Biro SDM dan Organisasi`, `Kepala Biro Umum`, `Inspektur IV`, atau `(Daftar Terlampir)`.
* **Kombinasi Struktur**:
  `Pembuka Pola 1 atau 5` + `Format Isi 4 atau 5 (Narasi Kepatuhan / Permintaan PIC + Link/Email)` + `Penutup Tipe 1`.

---

### TIPOLOGI 5: Nota Dinas Permohonan Fasilitas Kerja, TI & BMN (`ND_FASILITAS`)
* **Cakupan Perihal**:
  1. Permohonan Pembuatan Akun Email Official Satker (`DT.01.01`)
  2. Permohonan Pemanfaatan Anggaran untuk Pelaksanaan *Medical Check-Up* / MCU (`KP.07.01`)
  3. Permohonan Penetapan Status Penggunaan (PSP) BMN (`PL.01.02`)
* **Penerima Default**:
  * Fasilitas Email / Aplikasi / TI $\rightarrow$ `Kepala Pusat Data dan Sarana Informatika`
  * Pengelolaan Aset / PSP BMN $\rightarrow$ `Kepala Biro Umum`
  * Izin Pemanfaatan Anggaran Khusus (MCU) $\rightarrow$ `Sekretaris Jenderal`
* **Kombinasi Struktur**:
  `Pembuka Pola 5 ("Dalam rangka...")` + `Format Isi 3 (Poin Pertimbangan Urgensi / Spesifikasi Fasilitas)` + `Penutup Tipe 3`.

---

## 7. BLUEPRINT PROMPT & INTEGRASI OTOMATISASI SISTEM

Untuk mengotomatisasi pembuatan Nota Dinas dari **input laporan** maupun **input prompt bebas**, gunakan skema instruksi sistem (*System Prompt*) dan pemetaan variabel berikut pada aplikasi Anda:

### 7.1 Alur Transformasi Input ke Dokumen Nota Dinas

| Sumber Input Pengguna | Proses Ekstraksi Otomatis oleh Sistem AI | Hasil Rakitan Nota Dinas |
| :--- | :--- | :--- |
| **Mode A: Dari File Laporan** *(Contoh: Upload PDF/Excel Laporan Mingguan Quickwin atau Kajian Isu)* | 1. Deteksi tipe = **`ND_KEBIJAKAN`**<br>2. Set `Kepada Yth.` = `Sekretaris Jenderal`<br>3. Panggil *Classifier* $\rightarrow$ dapat kode `PR.01.02`<br>4. Ekstrak 3-5 *key highlights* & angka statistik dari laporan ke **Format Isi 3**<br>5. Gunakan **Pembuka Pola 3** & **Penutup Tipe 2**. | Draf Nota Dinas Pengantar Laporan Eksekutif ke Sekjen lengkap dengan ringkasan poin capaian kuantitatif. |
| **Mode B: Dari Prompt Singkat** *(Contoh: "Buatkan ND usulan kenaikan pangkat Astri Nur Afidah dari III/c ke III/d TMT 1 Maret 2026, link berkas bit.ly/kp-astri")* | 1. Deteksi tipe = **`ND_SDM`**<br>2. Set `Kepada Yth.` = `Kepala Biro SDM dan Organisasi`<br>3. Panggil *Classifier* $\rightarrow$ dapat kode `KP.04.04`<br>4. Ekstrak entitas pegawai ke **Format Isi 1C** + **Format Isi 4**<br>5. Gunakan **Pembuka Pola 4** & **Penutup Tipe 1**. | Draf Nota Dinas Pengajuan Kenaikan Pangkat yang rapi dan sesuai standar tata naskah Komdigi. |

---

### 7.2 Master Template Prompt (Siap Dipasang di Backend LLM Anda)

Anda dapat menyalin *System Prompt* berikut ke dalam modul AI generator Nota Dinas Anda:

```markdown
Anda adalah Asisten Pembuat Naskah Dinas Resmi pada Pusat Kebijakan Strategis (Kode Unit: SJ.9), Sekretariat Jenderal, Kementerian Komunikasi dan Digital RI.
Tugas Anda adalah menyusun draf **NOTA DINAS** yang 100% patuh pada tata naskah dinas pemerintah.

ATURAN STRUKTUR WAJIB:
1. KOP SURAT: Kementerian Komunikasi dan Digital RI - Sekretariat Jenderal - Pusat Kebijakan Strategis.
2. NOMOR: {nomor_urut}/SJ.9/{kode_klasifikasi}/{bulan_angka}/{tahun} (Gunakan kode klasifikasi dari kamus sistem).
3. METADATA:
   - Kepada Yth. : (Tulis nama jabatan resmi penerima, tanpa nama orang).
   - Dari        : Kepala Pusat Kebijakan Strategis
   - Hal         : (Awali dengan kata "Penyampaian...", "Permohonan...", "Pengajuan...", atau "Usulan...").
   - Sifat       : (Biasa / Segera / Rahasia).
   - Lampiran    : (- / 1 (satu) berkas / jumlah halaman).
   - Tanggal     : {tanggal_hari_ini}
4. PARAGRAF PEMBUKA:
   - Jika merespons surat/ND masuk: "Menindaklanjuti Nota Dinas [Jabatan] Nomor [X] tanggal [Y] perihal [Z], bersama ini kami sampaikan..."
   - Jika merespons SK: "Menindaklanjuti Keputusan Menteri Komunikasi dan Digital RI Nomor [X] tanggal [Y] tentang [Z], bersama ini kami mengajukan permohonan..."
   - Jika melaporkan kajian/arahan pimpinan: "Berdasarkan arahan [Menteri/Hasil Rapim] pada tanggal [Y] terkait [Z], bersama ini kami sampaikan..."
   - Jika pengajuan hak SDM berkala: "Sehubungan dengan telah terpenuhinya persyaratan [administratif/KGB], bersama ini kami mengusulkan..."
   - Jika inisiatif fasilitas/kegiatan baru: "Dalam rangka [tujuan kegiatan], dengan ini kami mengajukan permohonan..."
5. PARAGRAF ISI:
   - Gunakan sudut pandang "kami".
   - Jika data 1 pegawai: sajikan dalam blok titik dua (Nama, NIP, Pangkat/Gol, Jabatan, Unit Kerja).
   - Jika data >1 pegawai atau rincian anggaran: sajikan dalam Tabel Markdown yang rapi.
   - Jika laporan/kajian kebijakan: sajikan dalam poin bernomor (1, 2, 3) yang memuat capaian kuantitatif dan substansi utama.
   - Jika ada tautan berkas (Google Drive/shortlink), tambahkan kalimat: "Seluruh data dukung dan kelengkapan berkas dapat diakses melalui tautan berikut: [URL]."
6. PARAGRAF PENUTUP:
   - Jika ditujukan kepada Sekretaris Jenderal: "Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian Bapak Sekjen, kami ucapkan terima kasih."
   - Jika ditujukan kepada Kepala Biro / Inspektur / Sesditjen: "Demikian kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."
7. PENGESAHAN:
   - Nama Penandatangan: Oki Suryowahono (Kepala Pusat Kebijakan Strategis).
```

