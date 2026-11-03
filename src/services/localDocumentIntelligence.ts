/**
 * Local Document Intelligence & NLP Semantic Parser (PUSAKA Komdigi)
 * Menganalisis dokumen kedinasan/laporan/kajian tanpa API Key secara cerdas dan mendalam.
 */

import { EkstraksiUndangan, EkstraksiSuratUndangan, EkstraksiNotaDinas } from '../types';
import { formatNumberedPoints } from './naskahFormatter';

// Peta nama bulan Indonesia & Inggris
const BULAN_MAP: Record<string, string> = {
  januari: '01', januari_: '01', january: '01', jan: '01',
  februari: '02', february: '02', feb: '02',
  maret: '03', march: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', june: '06', jun: '06',
  juli: '07', july: '07', jul: '07',
  agustus: '08', august: '08', agu: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', october: '10', okt: '10', oct: '10',
  november: '11', nov: '11',
  desember: '12', december: '12', des: '12', dec: '12',
};

export interface ExtractedEntities {
  nomorSurat: string;
  instansi: string;
  namaAcara: string;
  temaAcara: string;
  peran: string;
  narasumber: string;
  topikPaparan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  hariTanggalStr: string;
  waktu: string;
  lokasi: string;
  kota: string;
  isOnline: boolean;
  isHybrid: boolean;
  linkOnline: string;
  dokumenLampiran: string;
}

/**
 * Ekstraktor Entitas Semantik Multiguna dari Dokumen Naskah / Undangan
 */
export function extractEntitiesFromDocument(rawText: string, fileName?: string): ExtractedEntities {
  const text = (rawText || '')
    .replace(/^\[Dokumen terlampir:[^\]]*\]\s*/gi, '')
    .trim();

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. NOMOR SURAT RESMI
  let nomorSurat = '';
  const noMatch = text.match(/(?:Nomor|No\.?)\s*[:=]\s*([^\n\r]+)/i);
  if (noMatch) {
    const rawNo = noMatch[1]
      .split(/\s{2,}|\t|(?:\bSifat\b|\bLampiran\b|\bHal\b|\bPerihal\b|\bTanggal\b)/i)[0]
      .trim();
    if (rawNo && !rawNo.startsWith('-') && rawNo.length > 2) {
      nomorSurat = rawNo;
    }
  }
  if (!nomorSurat) {
    const patternMatch = text.match(/\b([A-Za-z0-9\.\-]+\/[A-Za-z0-9\.\-\/]+[0-9])\b/);
    if (patternMatch) nomorSurat = patternMatch[1];
  }

  // 2. INSTANSI / PENYELENGGARA
  let instansi = '';
  // Cek nama kampus / lembaga terkenal
  const instansiRegexes = [
    /(?:Institut Teknologi Bandung|ITB|AISX\s*team)/i,
    /(?:Universitas Indonesia|UI)/i,
    /(?:Universitas Gadjah Mada|UGM)/i,
    /(?:Institut Teknologi Sepuluh Nopember|ITS)/i,
    /(?:Kementerian Komunikasi dan Digital|Kementerian Kominfo|Komdigi)/i,
    /(?:Kementerian Perencanaan Pembangunan Nasional|Bappenas)/i,
    /(?:Badan Siber dan Sandi Negara|BSSN)/i,
    /(?:Badan Riset dan Inovasi Nasional|BRIN)/i,
    /(?:Sekretariat Jenderal Kementerian[^\n\r,]+)/i,
    /(?:Pemerintah Provinsi[^\n\r,]+|Pemerintah Kota[^\n\r,]+|Pemerintah Kabupaten[^\n\r,]+)/i,
    /(?:Masyarakat Telematika Indonesia|MASTEL|APJII)/i,
  ];

  for (const rx of instansiRegexes) {
    const m = text.match(rx);
    if (m) {
      if (/ITB|AISX|Suhono/i.test(m[0])) {
        instansi = 'Institut Teknologi Bandung (ITB)';
      } else {
        instansi = m[0].trim();
      }
      break;
    }
  }

  // Jika belum ketemu, cek baris-baris awal
  if (!instansi) {
    for (const l of lines.slice(0, 10)) {
      if (
        /(?:KEMENTERIAN|UNIVERSITAS|INSTITUT|POLITEKNIK|ASOSIASI|DEWAN|BADAN|SEKRETARIAT)/i.test(l) &&
        !/(?:Jalan|Jl\.|Telepon|Telp|Email|Fax|Website)/i.test(l)
      ) {
        instansi = l;
        break;
      }
    }
  }
  if (!instansi) instansi = 'Instansi Penyelenggara Kegiatan';

  // 3. NAMA ACARA / KONFERENSI
  let namaAcara = '';
  // Cek pola nama konferensi internasional/nasional
  const confMatch = text.match(
    /(?:The\s+\d+(?:st|nd|rd|th)?\s+International Conference[^\n\r\.\"]+|International Conference on[^\n\r\.\"]+|Konferensi Nasional[^\n\r\.\"]+|Seminar Nasional[^\n\r\.\"]+|Focus Group Discussion[^\n\r\.\"]+|Workshop[^\n\r\.\"]+|Rapat Koordinasi[^\n\r\.\"]+)/i
  );
  if (confMatch) {
    namaAcara = confMatch[0].trim();
  } else {
    // Cari dari Hal / Perihal
    const halMatch = text.match(/(?:Perihal|Hal)\s*[:=]\s*([^\n\r]+)/i);
    if (halMatch) {
      namaAcara = halMatch[1].replace(/^(?:Undangan|Permohonan)\s+/i, '').trim();
    }
  }

  if (!namaAcara && fileName) {
    namaAcara = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/^\d+[\s_-]*/, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }
  if (!namaAcara) {
    namaAcara = 'Kegiatan Rapat Koordinasi dan Telaah Kebijakan Strategis';
  }

  // 4. TEMA ACARA
  let temaAcara = '';
  const temaMatch = text.match(/(?:Tema|Theme)\s*(?:Umum)?\s*[:=]?\s*[\"“]?([^\n\r\"”]+)[\"”]?/i);
  if (temaMatch) {
    temaAcara = temaMatch[1].trim();
  }

  // 5. PERAN YANG DITAWARKAN / DIMINTA
  let peran = 'Peserta';
  if (/Keynote Speaker|Pembicara Utama/i.test(text)) {
    peran = 'Keynote Speaker (Pembicara Utama)';
  } else if (/Narasumber|Speaker/i.test(text)) {
    peran = 'Narasumber';
  } else if (/Panelis|Panelist/i.test(text)) {
    peran = 'Panelis';
  } else if (/Moderator/i.test(text)) {
    peran = 'Moderator';
  }

  // 6. NARASUMBER / PEJABAT YANG DIUNDANG
  let narasumber = 'Sekretaris Jenderal Kementerian Komunikasi dan Digital';
  const tokohMatch = text.match(
    /(?:Dr\.?\s*Ir\.?\s*Ismail[^\n\r,\)]*|Menteri Komunikasi dan Digital|Sekretaris Jenderal Kementerian Komunikasi dan Digital|Prof\.\s*[^\n\r,\)]+)/i
  );
  if (tokohMatch) {
    narasumber = tokohMatch[0].trim();
  }

  // 7. TOPIK PAPARAN
  let topikPaparan = '';
  const topikMatch = text.match(/(?:Topik|Materi|Judul\s*Paparan|Keynote\s*Topic)\s*[:=]?\s*[\"“]?([^\n\r\"”]+)[\"”]?/i);
  if (topikMatch) {
    topikPaparan = topikMatch[1].trim();
  } else if (temaAcara) {
    topikPaparan = temaAcara;
  } else {
    topikPaparan = `Arah Kebijakan dan Transformasi Digital Sektor Komunikasi dan Digital RI`;
  }

  // 8. HARI & TANGGAL PELAKSANAAN
  const today = new Date().toISOString().split('T')[0];
  let tanggalMulai = today;
  let tanggalSelesai = today;
  let hariTanggalStr = '';

  const dateMatch = text.match(
    /(?:Hari[\s/,\-]+Tanggal|Hari\s*,\s*Tanggal|Tanggal\s+Pelaksanaan|Waktu\s+Pelaksanaan|Date)\s*[:=]\s*([^\n\r]+)/i
  );
  if (dateMatch) {
    hariTanggalStr = dateMatch[1].trim();
  } else {
    // Cari tanggal Indonesia dalam teks
    const tglAnyMatch = text.match(
      /(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)?\s*,?\s*(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (tglAnyMatch) {
      hariTanggalStr = tglAnyMatch[0].trim();
    }
  }

  if (hariTanggalStr) {
    const rangeMatch = hariTanggalStr.match(/(\d{1,2})\s*(?:s\.?d\.?|-)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
    if (rangeMatch) {
      const m = BULAN_MAP[rangeMatch[3].toLowerCase()];
      if (m) {
        tanggalMulai = `${rangeMatch[4]}-${m}-${rangeMatch[1].padStart(2, '0')}`;
        tanggalSelesai = `${rangeMatch[4]}-${m}-${rangeMatch[2].padStart(2, '0')}`;
      }
    } else {
      const singleMatch = hariTanggalStr.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
      if (singleMatch) {
        const m = BULAN_MAP[singleMatch[2].toLowerCase()];
        if (m) {
          tanggalMulai = `${singleMatch[3]}-${m}-${singleMatch[1].padStart(2, '0')}`;
          tanggalSelesai = tanggalMulai;
        }
      }
    }
  }

  // 9. WAKTU / JAM
  let waktu = '09.00 WIB s.d. selesai';
  const waktuMatch = text.match(/(?:Waktu|Pukul|Jam|Time)\s*[:=]\s*([^\n\r]+)/i);
  if (waktuMatch) {
    waktu = waktuMatch[1].split(/\s{3,}|\t/)[0].trim();
  }

  // 10. TEMPAT & MEDIA (ONLINE / HYBRID)
  let lokasi = '';
  const tempatMatch = text.match(/(?:Tempat|Lokasi|Venue)\s*[:=]\s*([^\n\r]+)/i);
  if (tempatMatch) {
    lokasi = tempatMatch[1].trim();
  }

  const isOnline = /(?:Zoom|Teams|Google Meet|Daring|Online|Webinar)/i.test(text);
  const isHybrid = isOnline && (Boolean(lokasi) || /(?:Hybrid|Tatap Muka)/i.test(text));

  let linkOnline = '';
  const linkMatch = text.match(/https?:\/\/[^\s\)\"\']+/i);
  if (linkMatch) {
    linkOnline = linkMatch[0];
  } else if (isOnline) {
    linkOnline = 'https://s.komdigi.go.id/zoom-meeting';
  }

  if (!lokasi) {
    if (isOnline && !isHybrid) {
      lokasi = 'Media Daring (Zoom Cloud Meeting)';
    } else {
      lokasi = 'Aula / Ruang Rapat Instansi Penyelenggara';
    }
  }

  // 11. KOTA
  let kota = 'Jakarta Pusat';
  const searchCorpus = `${lokasi} ${text}`.toLowerCase();
  if (/bandung/i.test(searchCorpus)) kota = 'Kota Bandung';
  else if (/bogor/i.test(searchCorpus)) kota = 'Kota Bogor';
  else if (/depok/i.test(searchCorpus)) kota = 'Kota Depok';
  else if (/tangerang selatan/i.test(searchCorpus)) kota = 'Kota Tangerang Selatan';
  else if (/tangerang/i.test(searchCorpus)) kota = 'Kota Tangerang';
  else if (/bekasi/i.test(searchCorpus)) kota = 'Kota Bekasi';
  else if (/surabaya/i.test(searchCorpus)) kota = 'Kota Surabaya';
  else if (/semarang/i.test(searchCorpus)) kota = 'Kota Semarang';
  else if (/yogyakarta|jogja/i.test(searchCorpus)) kota = 'D.I. Yogyakarta';
  else if (/bali|denpasar/i.test(searchCorpus)) kota = 'Denpasar, Bali';
  else if (/makassar/i.test(searchCorpus)) kota = 'Kota Makassar';
  else if (/medan/i.test(searchCorpus)) kota = 'Kota Medan';
  else if (/ikn|nusantara/i.test(searchCorpus)) kota = 'Ibu Kota Nusantara (IKN)';

  // 12. DOKUMEN LAMPIRAN
  let dokumenLampiran = 'Proposal Kegiatan dan Kerangka Acuan Kerja (ToR)';
  if (/ToR|Terms of Reference/i.test(text)) {
    dokumenLampiran = 'Proposal dan Terms of Reference (ToR) Kegiatan';
  } else if (/Jadwal|Agenda/i.test(text)) {
    dokumenLampiran = 'Jadwal dan Rundown Acara';
  }

  return {
    nomorSurat,
    instansi,
    namaAcara,
    temaAcara,
    peran,
    narasumber,
    topikPaparan,
    tanggalMulai,
    tanggalSelesai,
    hariTanggalStr: hariTanggalStr || `${tanggalMulai} s.d. ${tanggalSelesai}`,
    waktu,
    lokasi,
    kota,
    isOnline,
    isHybrid,
    linkOnline,
    dokumenLampiran,
  };
}

/**
 * Helper Ekstraksi Data Pegawai & Dokumen Rujukan untuk Nota Dinas (Sesuai Panduan Struktur Nota Dinas PUSAKA)
 */
interface NotaDinasParsedContext {
  // Rujukan ND / Surat Masuk
  refNomorND: string;
  refTanggalND: string;
  refPengirimND: string;
  refPerihalND: string;
  // Rujukan SK Menteri / Regulasi
  refNomorSK: string;
  refTanggalSK: string;
  refJudulSK: string;
  refTMT: string;
  // Data Pegawai (Format 1 - Blok Atribut Identitas Pegawai)
  pegawaiNama: string;
  pegawaiNIP: string;
  pegawaiPangkat: string;
  pegawaiPangkatTujuan: string;
  pegawaiJabatan: string;
  pegawaiJabatanTujuan: string;
  pegawaiUnitKerja: string;
  // Tautan Digital / Email (Format 4)
  cloudUrl: string;
  emailAddr: string;
}

function parseNotaDinasContext(combinedInput: string): NotaDinasParsedContext {
  // 1. Deteksi Nomor & Tanggal ND / Surat Rujukan
  const ndNomorMatch = combinedInput.match(/(?:Nota Dinas|Surat)[^\n\r]*?Nomor\s*[:=]?\s*([A-Za-z0-9\.\-\/]+)/i)
    || combinedInput.match(/\b(\d+\/[A-Za-z0-9\.]+\/[A-Za-z]{2}\.\d{2}\.\d{2}\/\d{2}\/\d{4})\b/i);
  const refNomorND = ndNomorMatch ? ndNomorMatch[1].trim() : '';

  const tglRegex = /\b(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})\b/i;
  const ndTanggalMatch = combinedInput.match(/(?:tanggal|tgl\.?)\s*[:=]?\s*(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i)
    || combinedInput.match(tglRegex);
  const refTanggalND = ndTanggalMatch ? ndTanggalMatch[1].trim() : '';

  const pengirimMatch = combinedInput.match(/Nota Dinas\s+(Kepala\s+[^\n\r,]+?|Sekretaris\s+[^\n\r,]+?|Inspektur\s+[^\n\r,]+?)\s+Nomor/i);
  const refPengirimND = pengirimMatch ? pengirimMatch[1].trim() : '';

  const perihalMatch = combinedInput.match(/(?:perihal|hal|tentang)\s*[:=]?\s*([^\n\r,\.]+)/i);
  const refPerihalND = perihalMatch ? perihalMatch[1].trim() : '';

  // 2. Deteksi SK Menteri / Regulasi
  const skMatch = combinedInput.match(/Keputusan\s+Menteri[^\n\r]*?Nomor\s*[:=]?\s*([A-Za-z0-9\.\-\/\s]+?)(?:\s+tanggal|\s+tentang|\n|$)/i);
  const refNomorSK = skMatch ? skMatch[1].trim() : '';
  const skTentangMatch = combinedInput.match(/Keputusan\s+Menteri[^\n\r]*?tentang\s+([^\n\r\.]+)/i);
  const refJudulSK = skTentangMatch ? skTentangMatch[1].trim() : '';
  const tmtMatch = combinedInput.match(/TMT\s*[:=]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{2}[-/]\d{2}[-/]\d{4})/i);
  const refTMT = tmtMatch ? tmtMatch[1].trim() : '';

  // 3. Deteksi Atribut Pegawai (Nama, NIP, Pangkat/Gol, Jabatan, Unit Kerja)
  const namaMatch =
    combinedInput.match(/Nama(?:\s+Pegawai|\s+Lengkap)?\s*[:=]\s*([^\n\r]+)/i) ||
    combinedInput.match(/(?:atas\s+nama|a\.n\.?)\s+([A-Z][a-zA-Z\.\s',]{3,45}?)(?=\s+(?:NIP|dengan|pada|jabatan|pangkat|\n|$))/i);
  const pegawaiNama = namaMatch ? namaMatch[1].trim() : '';

  const nipMatch =
    combinedInput.match(/NIP\s*[:=]?\s*(\d{18}|\d{8}\s*\d{6}\s*\d\s*\d{3})/i) ||
    combinedInput.match(/\b(19\d{16}|20\d{16})\b/);
  const pegawaiNIP = nipMatch ? nipMatch[1].replace(/\s+/g, '').trim() : '';

  const pangkatMatch = combinedInput.match(/Pangkat(?:\s*\/\s*Gol(?:\.\s*Ruang|\s*Ruang)?|\s+saat\s+ini)?\s*[:=]\s*([^\n\r]+)/i);
  const pegawaiPangkat = pangkatMatch ? pangkatMatch[1].trim() : '';

  const pangkatTujuanMatch = combinedInput.match(/Pangkat\s+yang\s+dituju\s*[:=]\s*([^\n\r]+)/i);
  const pegawaiPangkatTujuan = pangkatTujuanMatch ? pangkatTujuanMatch[1].trim() : '';

  const jabatanMatch = combinedInput.match(/Jabatan(?:\s+Baru|\s+saat\s+ini)?\s*[:=]\s*([^\n\r]+)/i);
  const pegawaiJabatan = jabatanMatch ? jabatanMatch[1].trim() : '';

  const jabatanTujuanMatch = combinedInput.match(/Jabatan\s+yang\s+dituju\s*[:=]\s*([^\n\r]+)/i);
  const pegawaiJabatanTujuan = jabatanTujuanMatch ? jabatanTujuanMatch[1].trim() : '';

  const unitMatch = combinedInput.match(/Unit\s+Kerja\s*[:=]\s*([^\n\r]+)/i);
  const pegawaiUnitKerja = unitMatch ? unitMatch[1].trim() : 'Pusat Kebijakan Strategis';

  // 4. Deteksi Tautan Cloud / Email
  const urlMatch = combinedInput.match(/https?:\/\/[^\s\)\"\']+/i);
  const cloudUrl = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : '';

  const emailMatch = combinedInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const emailAddr = emailMatch ? emailMatch[0] : '';

  return {
    refNomorND,
    refTanggalND,
    refPengirimND,
    refPerihalND,
    refNomorSK,
    refTanggalSK: refTanggalND,
    refJudulSK,
    refTMT,
    pegawaiNama,
    pegawaiNIP,
    pegawaiPangkat,
    pegawaiPangkatTujuan,
    pegawaiJabatan,
    pegawaiJabatanTujuan,
    pegawaiUnitKerja,
    cloudUrl,
    emailAddr,
  };
}

/**
 * Memilih Variasi Paragraf Penutup Resmi (Variasi 1 s.d. 4) berdasarkan Hirarki Jabatan Penerima & Konteks
 */
function selectNotaDinasClosing(
  kepada: string,
  tipologi: 'ND_SDM' | 'ND_KEBIJAKAN' | 'ND_ANGGARAN' | 'ND_KOORDINASI' | 'ND_FASILITAS',
  lowerInput: string
): string {
  // Variasi 4: Permohonan Mendesak / Distribusi Cepat (Bukti Potong Pajak)
  if (/bukti potong|pajak|1721[\-\s]*a2|spt\s+tahunan/i.test(lowerInput)) {
    return 'Kami mohon agar dokumen tersebut dapat segera disampaikan kepada kami untuk selanjutnya didistribusikan kepada pegawai yang bersangkutan. Demikian kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.';
  }

  // Variasi Khusus Penandatanganan SK Sekretaris Jenderal
  if (/penandatanganan|tanda tangan/i.test(lowerInput) && /sekretaris jenderal|sekjen/i.test(kepada)) {
    return 'Demikian kami sampaikan. Apabila Bapak Sekretaris Jenderal tidak berpendapat lain, mohon perkenan Bapak Sekretaris Jenderal untuk menandatangani Keputusan Sekretaris Jenderal dimaksud. Atas perhatian dan perkenan Bapak Sekretaris Jenderal, kami ucapkan terima kasih.';
  }

  // Variasi 2: Korespondensi Vertikal ke Atas (Kepada Sekretaris Jenderal / Menteri / Wamen)
  if (/sekretaris jenderal|sekjen/i.test(kepada)) {
    return 'Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian dan kerja sama Bapak Sekjen, kami ucapkan terima kasih.';
  }
  if (/menteri/i.test(kepada)) {
    return `Demikian disampaikan, mohon arahan ${kepada} lebih lanjut. Atas perhatian dan perkenan ${kepada}, kami ucapkan terima kasih.`;
  }

  // Variasi 3: Permohonan Persetujuan / Fasilitasi Anggaran & Aset (MCU / PSP BMN)
  if (tipologi === 'ND_FASILITAS' && /medical check up|\bmcu\b|kesehatan|\bbmn\b|penetapan status penggunaan|\bpsp\b|pemindahan/i.test(lowerInput)) {
    return 'Demikian permohonan ini kami sampaikan. Atas perkenan dan arahan Bapak/Ibu, kami ucapkan terima kasih.';
  }

  // Variasi 1: Standar Korespondensi Horizontal (Antar-Eselon II: Kepala Biro / Inspektur / Sesditjen / Kapusdatin)
  return 'Demikian kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.';
}

/**
 * SMART NOTA DINAS EXTRACTOR (CLIENT-SIDE NLP & ADVANCED SYNTHESIS)
 * Mengimplementasikan secara utuh aturan dari `panduan_struktur_dan_otomatisasi_nota_dinas.md`:
 * - 5 Tipologi Master (`ND_SDM`, `ND_KEBIJAKAN`, `ND_ANGGARAN`, `ND_KOORDINASI`, `ND_FASILITAS`)
 * - Pemetaan Otomatis `Kepada Yth.` (Nama Jabatan Resmi tanpa nama orang) & `Dari: Kepala Pusat Kebijakan Strategis`
 * - 6 Formula Paragraf Pembuka
 * - 5 Format Penyajian Isi (Blok Identitas Pegawai 1 Orang, Rekapitulasi Multi-Pegawai/Anggaran, Poin Narasi Eksekutif 1. 2. 3., Klausul Tautan Digital, Koordinasi Lintas Unit)
 * - 4 Variasi Paragraf Penutup sesuai hirarki penerima
 */
export function smartLocalExtractNotaDinas(
  text: string,
  fileName?: string,
  userPrompt?: string
): EkstraksiNotaDinas {
  const combinedInput = `${userPrompt || ''}\n${text || ''}`.trim();
  const lowerInput = combinedInput.toLowerCase();
  const ctx = parseNotaDinasContext(combinedInput);
  const e = extractEntitiesFromDocument(text, fileName);

  // Deteksi Sifat Surat
  let sifat = 'Biasa';
  if (/rahasia|konfidensial/i.test(combinedInput)) {
    sifat = 'Rahasia';
  } else if (/segera|urgent|mendesak|prioritas|batas waktu/i.test(combinedInput)) {
    sifat = 'Segera';
  }

  // Klausul Tautan Digital / Email (Format 4) jika terdeteksi di teks/prompt
  const klausulTautan = ctx.cloudUrl
    ? `\n\nSeluruh data dukung dan kelengkapan berkas sebagaimana dimaksud dapat diakses/diunduh melalui tautan berikut: ${ctx.cloudUrl}.`
    : ctx.emailAddr
    ? `\n\nMohon kiranya dokumen tersebut dapat dikirimkan melalui alamat pos-el (email): ${ctx.emailAddr}.`
    : '';

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOLOGI 1: ND_SDM (KEPEGAWAIAN & PENGEMBANGAN SDM)
  // Tujuan: Kepala Biro Sumber Daya Manusia dan Organisasi
  // ═══════════════════════════════════════════════════════════════════════════
  const isSDM =
    /kenaikan gaji berkala|\bkgb\b|kenaikan pangkat|jenjang jabatan|uji kompetensi|\bujikom\b|\bspmt\b|surat pernyataan melaksanakan tugas|kelas jabatan|simpeg|jabatan fungsional|jabatan pelaksana|tugas belajar|cuti pegawai|mutasi pegawai/i.test(
      lowerInput
    );

  if (isSDM) {
    const kepada = 'Kepala Biro Sumber Daya Manusia dan Organisasi';
    const namaPeg = ctx.pegawaiNama || 'Pegawai Pusat Kebijakan Strategis';
    const nipPeg = ctx.pegawaiNIP || '199508192023212028';
    const pangkatPeg = ctx.pegawaiPangkat || 'Penata Muda Tingkat I (III/b)';
    const jabatanPeg = ctx.pegawaiJabatan || 'Analis Kebijakan Ahli Pertama';

    // 1A. Kenaikan Gaji Berkala (KGB) — Formula 4 (Variasi KGB) + Format 1
    if (/kenaikan gaji berkala|\bkgb\b/i.test(lowerInput)) {
      const pembuka =
        'Dengan telah terpenuhinya syarat kenaikan gaji berkala yaitu telah mencapai masa kerja golongan yang ditentukan, maka bersama ini kami sampaikan pengajuan kenaikan gaji berkala atas nama:';
      const blokPegawai = [
        `Nama : ${namaPeg}`,
        `NIP : ${nipPeg}`,
        `Pangkat/Gol : ${pangkatPeg}`,
        `Jabatan : ${jabatanPeg}`,
        `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
      ].join('\n');
      const kalimatBerkas = `Sebagai kelengkapan administrasi pengajuan kenaikan gaji berkala dimaksud, turut kami lampirkan berkas persyaratan yang dibutuhkan.${klausulTautan}`;
      const isi = `${blokPegawai}\n\n${kalimatBerkas}`;
      const penutup = selectNotaDinasClosing(kepada, 'ND_SDM', lowerInput);

      return {
        nota_hal: `Pengajuan Kenaikan Gaji Berkala a.n. ${namaPeg}`,
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'KP.05.01',
        tipologi: 'ND_SDM',
      };
    }

    // 1B. Kenaikan Pangkat / Kenaikan Jenjang JF / Uji Kompetensi — Formula 4 (Variasi KP/JF) + Format 1
    if (/kenaikan pangkat|kenaikan jenjang|uji kompetensi|\bujikom\b/i.test(lowerInput)) {
      const isUjikom = /uji kompetensi|\bujikom\b|kenaikan jenjang/i.test(lowerInput);
      const jenisUsulan = isUjikom
        ? 'Uji Kompetensi Kenaikan Jenjang Jabatan Fungsional'
        : 'Kenaikan Pangkat Pegawai Negeri Sipil';
      const pembuka = `Sehubungan dengan telah dipenuhinya persyaratan administratif dan kinerja pegawai dalam rangka pengusulan ${jenisUsulan} pada Pusat Kebijakan Strategis Sekretariat Jenderal, bersama ini kami mengusulkan ${jenisUsulan} bagi pegawai sebagai berikut:`;

      const blokPegawai = isUjikom
        ? [
            `Nama : ${namaPeg}`,
            `NIP : ${nipPeg}`,
            `Pangkat/Gol : ${pangkatPeg}`,
            `Jabatan saat ini : ${jabatanPeg}`,
            `Jabatan yang dituju : ${ctx.pegawaiJabatanTujuan || 'Analis Kebijakan Ahli Muda'}`,
            `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
          ].join('\n')
        : [
            `Nama : ${namaPeg}`,
            `NIP : ${nipPeg}`,
            `Pangkat saat ini : ${pangkatPeg}`,
            `Pangkat yang dituju : ${ctx.pegawaiPangkatTujuan || 'Penata (III/c)'}`,
            `Jabatan : ${jabatanPeg}`,
            `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
          ].join('\n');

      const kalimatBerkas = `Sebagai kelengkapan administrasi pengajuan ${jenisUsulan} dimaksud, turut kami lampirkan berkas persyaratan yang dibutuhkan.${klausulTautan}`;
      const isi = `${blokPegawai}\n\n${kalimatBerkas}`;
      const penutup = selectNotaDinasClosing(kepada, 'ND_SDM', lowerInput);

      return {
        nota_hal: `Usulan ${jenisUsulan} a.n. ${namaPeg}`,
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'KP.03.03',
        tipologi: 'ND_SDM',
      };
    }

    // 1C. Penerbitan SPMT / Tindak Lanjut SK Pengangkatan — Formula 1 atau Formula 2 + Format 1
    if (/\bspmt\b|surat pernyataan melaksanakan tugas|pengangkatan/i.test(lowerInput)) {
      const pembuka = ctx.refNomorSK
        ? `Menindaklanjuti Keputusan Menteri Komunikasi dan Digital Republik Indonesia Nomor ${ctx.refNomorSK}${ctx.refTanggalSK ? ` tanggal ${ctx.refTanggalSK}` : ''} tentang ${ctx.refJudulSK || 'Pengangkatan ke dalam Jabatan Fungsional'}, bersama ini kami mengajukan permohonan untuk dilakukan penerbitan Surat Pernyataan Melaksanakan Tugas (SPMT)${ctx.refTMT ? ` TMT ${ctx.refTMT}` : ''} bagi pegawai yang telah ditetapkan dalam jabatan ${jabatanPeg}, dengan informasi pegawai sebagai berikut:`
        : ctx.refNomorND
        ? `Menindaklanjuti Nota Dinas ${ctx.refPengirimND || 'Kepala Biro Sumber Daya Manusia dan Organisasi'} Nomor: ${ctx.refNomorND}${ctx.refTanggalND ? ` tanggal ${ctx.refTanggalND}` : ''} perihal ${ctx.refPerihalND || 'Penyampaian SK Jabatan Fungsional'}, bersama ini kami mengajukan permohonan penerbitan Surat Pernyataan Melaksanakan Tugas (SPMT) sebagai berikut:`
        : `Menindaklanjuti penetapan Keputusan pengangkatan dalam jabatan fungsional di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengajukan permohonan penerbitan Surat Pernyataan Melaksanakan Tugas (SPMT) bagi pegawai dengan rincian sebagai berikut:`;

      const blokPegawai = [
        `Nama : ${namaPeg}`,
        `NIP : ${nipPeg}`,
        `Pangkat/Gol : ${pangkatPeg}`,
        `Jabatan Baru : ${jabatanPeg}`,
        `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
      ].join('\n');
      const kalimatBerkas = `Sebagai kelengkapan administrasi penerbitan SPMT dimaksud, turut kami lampirkan salinan Keputusan dan berkas pendukung yang dibutuhkan.${klausulTautan}`;
      const isi = `${blokPegawai}\n\n${kalimatBerkas}`;
      const penutup = selectNotaDinasClosing(kepada, 'ND_SDM', lowerInput);

      return {
        nota_hal: `Permohonan Penerbitan Surat Pernyataan Melaksanakan Tugas (SPMT) a.n. ${namaPeg}`,
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'KP.01.01',
        tipologi: 'ND_SDM',
      };
    }

    // 1D. Pindah Kelas Jabatan / Penyesuaian Data SIMPEG / Urusan Kepegawaian Lainnya (Formula 5 atau Formula 6 + Format 1)
    const isSimpeg = /simpeg|penyesuaian data|perubahan data|nomenklatur/i.test(lowerInput);
    const pembuka = isSimpeg
      ? `Bersama ini kami mengajukan permohonan perubahan dan penyesuaian data kepegawaian pada aplikasi SIMPEG dikarenakan adanya pemutakhiran nomenklatur jabatan pelaksana bagi pegawai atas nama:`
      : `Dalam rangka pemenuhan kebutuhan organisasi dan penataan manajemen karier pegawai di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengajukan permohonan penyesuaian jabatan kepegawaian dengan rincian sebagai berikut:`;

    const blokPegawai = [
      `Nama : ${namaPeg}`,
      `NIP : ${nipPeg}`,
      `Pangkat/Gol : ${pangkatPeg}`,
      `Jabatan : ${jabatanPeg}`,
      `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
    ].join('\n');
    const kalimatBerkas = `Sebagai kelengkapan administrasi pengajuan dimaksud, turut kami lampirkan berkas persyaratan yang dibutuhkan.${klausulTautan}`;
    const isi = `${blokPegawai}\n\n${kalimatBerkas}`;
    const penutup = selectNotaDinasClosing(kepada, 'ND_SDM', lowerInput);

    return {
      nota_hal: isSimpeg
        ? `Permohonan Penyesuaian Data Jabatan pada Aplikasi SIMPEG a.n. ${namaPeg}`
        : `Permohonan Penyesuaian Kelas Jabatan Pegawai pada Pusat Kebijakan Strategis`,
      nota_kepada: kepada,
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: sifat,
      nota_lampiran: 'Satu berkas',
      nota_pembuka: pembuka,
      nota_isi: isi,
      nota_penutup: penutup,
      rekomendasi_kode_klasifikasi: 'KP.01.01',
      tipologi: 'ND_SDM',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOLOGI 3: ND_ANGGARAN (PERENCANAAN, ANGGARAN, AKUNTABILITAS & PAJAK)
  // ═══════════════════════════════════════════════════════════════════════════
  const isAnggaran =
    /revisi anggaran|\bdipa\b|rka[\-\s]*k\/l|pokok[\-\s]*pokok revisi|reviu apip|inspektorat|inspektur|laporan hasil pengawasan|\blhp\b|perjanjian kinerja|\brenja\b|kegiatan prioritas|bukti potong|1721[\-\s]*a2|pajak penghasilan/i.test(
      lowerInput
    );

  if (isAnggaran) {
    // 3A. Permohonan Bukti Potong Pajak 1721-A2 (Formula 6 + Format 1/4 + Variasi Penutup 4)
    if (/bukti potong|1721[\-\s]*a2|pajak penghasilan|spt tahunan/i.test(lowerInput)) {
      const kepada = 'Kepala Biro Keuangan dan Barang Milik Negara';
      const namaPeg = ctx.pegawaiNama || 'Pegawai Pusat Kebijakan Strategis';
      const nipPeg = ctx.pegawaiNIP || '199004152015031002';
      const pembuka =
        'Bersama ini kami mengajukan permohonan penerbitan Bukti Pemotongan Pajak Penghasilan Pasal 21 (Formulir 1721-A2) dikarenakan kebutuhan pelaporan SPT Tahunan Pajak Penghasilan bagi pegawai atas nama:';
      const blokPegawai = [
        `Nama : ${namaPeg}`,
        `NIP : ${nipPeg}`,
        `Jabatan : ${ctx.pegawaiJabatan || 'Analis Kebijakan Ahli Muda'}`,
        `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
      ].join('\n');
      const infoEmail = ctx.emailAddr
        ? `\n\nMohon kiranya dokumen bukti pemotongan pajak tersebut dapat dikirimkan melalui alamat pos-el (email): ${ctx.emailAddr}.`
        : '';
      const penutup = selectNotaDinasClosing(kepada, 'ND_ANGGARAN', lowerInput);

      return {
        nota_hal: 'Permohonan Penerbitan Bukti Pemotongan Pajak Penghasilan (Formulir 1721-A2)',
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: 'Segera',
        nota_lampiran: '-',
        nota_pembuka: pembuka,
        nota_isi: `${blokPegawai}${infoEmail}`,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'KU.03.01',
        tipologi: 'ND_ANGGARAN',
      };
    }

    // 3B. Tindak Lanjut Reviu APIP / Inspektorat (Formula 1 + Format 3/4 + Variasi Penutup 1)
    if (/reviu apip|inspektorat|inspektur|\blhp\b|pengawasan/i.test(lowerInput)) {
      const kepada = 'Inspektur IV';
      const pembuka = ctx.refNomorND
        ? `Menindaklanjuti Nota Dinas ${ctx.refPengirimND || 'Inspektur IV'} Nomor: ${ctx.refNomorND}${ctx.refTanggalND ? ` tanggal ${ctx.refTanggalND}` : ''} perihal ${ctx.refPerihalND || 'Hasil Reviu dan Pengawasan Internal'}, bersama ini kami sampaikan matriks tindak lanjut beserta dokumen pendukung pada Pusat Kebijakan Strategis sebagai berikut:`
        : `Menindaklanjuti hasil reviu Aparat Pengawasan Intern Pemerintah (APIP) pada Pusat Kebijakan Strategis Sekretariat Jenderal, bersama ini kami sampaikan laporan pemenuhan tindak lanjut rekomendasi beserta dokumen data dukung sebagai berikut:`;

      const isi = [
        `1. Pemenuhan Rekomendasi Administratif dan Tata Kelola: Seluruh dokumen pertanggungjawaban kegiatan dan administrasi keuangan telah dilengkapi serta diverifikasi sesuai catatan hasil reviu.`,
        `2. Penyesuaian Dokumen Perencanaan dan Akuntabilitas: Telah dilakukan penyelarasan matriks target kinerja dan rincian output kegiatan agar sesuai dengan standar akuntabilitas kementerian.${klausulTautan}`,
      ].join('\n\n');
      const penutup = selectNotaDinasClosing(kepada, 'ND_ANGGARAN', lowerInput);

      return {
        nota_hal: 'Penyampaian Tindak Lanjut Hasil Reviu Pengawasan pada Pusat Kebijakan Strategis',
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'PW.01.01',
        tipologi: 'ND_ANGGARAN',
      };
    }

    // 3C. Revisi Anggaran DIPA / Pokok-Pokok Revisi (Formula 4 Variasi Revisi + Format 2/3 + Variasi Penutup 1)
    if (/revisi anggaran|\bdipa\b|rka[\-\s]*k\/l|pokok[\-\s]*pokok revisi|pagu/i.test(lowerInput)) {
      const kepada = 'Kepala Biro Keuangan dan Barang Milik Negara';
      const pembuka =
        'Sehubungan dengan adanya penyesuaian belanja dalam rangka pemenuhan kebutuhan kegiatan prioritas Pusat Kebijakan Strategis Tahun Anggaran 2026, bersama ini kami mengajukan permohonan Revisi Anggaran pada DIPA Pusat Kebijakan Strategis dengan pokok-pokok revisi sebagai berikut:';
      const isi = [
        `1. Penataan dan Pergeseran Alokasi Belanja Operasional: Optimalisasi alokasi belanja barang dalam satu keluaran (output) guna mendukung penyusunan kajian strategis dan fasilitasi rapat koordinasi lintas sektor tanpa mengubah target kinerja utama.`,
        `2. Pemenuhan Kebutuhan Prioritas Analisis Kebijakan: Penyesuaian rincian komponen kegiatan fasilitasi perumusan rekomendasi kebijakan strategis Menteri dan Wakil Menteri agar selaras dengan agenda prioritas tahun berjalan.`,
        `Sebagai kelengkapan administrasi pengajuan revisi anggaran dimaksud, turut kami lampirkan matriks semula-menjadi, RKA-K/L, Kerangka Acuan Kerja (TOR), dan Rincian Anggaran Biaya (RAB).${klausulTautan}`,
      ].join('\n\n');
      const penutup = selectNotaDinasClosing(kepada, 'ND_ANGGARAN', lowerInput);

      return {
        nota_hal: 'Permohonan Revisi Anggaran pada DIPA Pusat Kebijakan Strategis Tahun Anggaran 2026',
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'PR.02.02',
        tipologi: 'ND_ANGGARAN',
      };
    }

    // 3D. Perencanaan / Kegiatan Prioritas / Perjanjian Kinerja (Kepada Kepala Biro Perencanaan)
    const kepada = 'Kepala Biro Perencanaan';
    const pembuka = ctx.refNomorND
      ? `Menindaklanjuti Nota Dinas ${ctx.refPengirimND || 'Kepala Biro Perencanaan'} Nomor: ${ctx.refNomorND}${ctx.refTanggalND ? ` tanggal ${ctx.refTanggalND}` : ''} perihal ${ctx.refPerihalND || 'Penyusunan Dokumen Perencanaan dan Perjanjian Kinerja'}, bersama ini kami sampaikan dokumen usulan dari Pusat Kebijakan Strategis sebagai berikut:`
      : `Dalam rangka penyelarasan perencanaan program dan akuntabilitas kinerja di lingkungan Sekretariat Jenderal, bersama ini kami sampaikan dokumen perencanaan dan rincian kegiatan prioritas Pusat Kebijakan Strategis sebagai berikut:`;

    const isi = [
      `1. Sinkronisasi Indikator Kinerja dan Target Strategis: Rancangan indikator kinerja utama dan rincian kegiatan prioritas Pusat Kebijakan Strategis telah disusun mengacu pada Rencana Strategis Kementerian Komunikasi dan Digital.`,
      `2. Dukungan Analisis dan Telaah Kebijakan: Mencakup program penyusunan rekomendasi kebijakan strategis, pemantauan program percepatan (Quickwins), serta evaluasi regulasi ekosistem digital nasional.${klausulTautan}`,
    ].join('\n\n');
    const penutup = selectNotaDinasClosing(kepada, 'ND_ANGGARAN', lowerInput);

    return {
      nota_hal: 'Penyampaian Dokumen Perencanaan dan Kegiatan Prioritas Pusat Kebijakan Strategis',
      nota_kepada: kepada,
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: sifat,
      nota_lampiran: 'Satu berkas',
      nota_pembuka: pembuka,
      nota_isi: isi,
      nota_penutup: penutup,
      rekomendasi_kode_klasifikasi: 'PR.01.02',
      tipologi: 'ND_ANGGARAN',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOLOGI 5: ND_FASILITAS (FASILITASI UMUM, BMN & TEKNOLOGI INFORMASI)
  // ═══════════════════════════════════════════════════════════════════════════
  const isFasilitas =
    /medical check up|\bmcu\b|pemeriksaan kesehatan|\bbmn\b|barang milik negara|penetapan status penggunaan|\bpsp\b|pemindahan aset|reset akun|akun email|pos-el|jaringan|pusdatin/i.test(
      lowerInput
    );

  if (isFasilitas) {
    // 5A. Layanan TI / Reset Akun / Email Dinas (Kepada Kepala Pusat Data dan Sarana Informatika)
    if (/reset akun|akun email|pos-el|jaringan|pusdatin|aplikasi/i.test(lowerInput)) {
      const kepada = 'Kepala Pusat Data dan Sarana Informatika';
      const namaPeg = ctx.pegawaiNama || 'Pegawai Pusat Kebijakan Strategis';
      const nipPeg = ctx.pegawaiNIP || '199508192023212028';
      const pembuka =
        'Bersama ini kami mengajukan permohonan fasilitasi pemulihan akses dan pengaturan ulang (reset) akun layanan teknologi informasi kedinasan dikarenakan kendala otentikasi akses bagi pegawai atas nama:';
      const blokPegawai = [
        `Nama : ${namaPeg}`,
        `NIP : ${nipPeg}`,
        `Jabatan : ${ctx.pegawaiJabatan || 'Analis Kebijakan Ahli Pertama'}`,
        `Unit Kerja : ${ctx.pegawaiUnitKerja}`,
      ].join('\n');
      const penutup = selectNotaDinasClosing(kepada, 'ND_FASILITAS', lowerInput);

      return {
        nota_hal: `Permohonan Fasilitasi Layanan Teknologi Informasi / Reset Akun Kedinasan a.n. ${namaPeg}`,
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: '-',
        nota_pembuka: pembuka,
        nota_isi: `${blokPegawai}${klausulTautan}`,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'TI.01.01',
        tipologi: 'ND_FASILITAS',
      };
    }

    // 5B. PSP BMN / Pemindahan Lokasi Aset BMN
    if (/\bbmn\b|barang milik negara|penetapan status penggunaan|\bpsp\b|pemindahan aset/i.test(lowerInput)) {
      const kepada = 'Kepala Biro Keuangan dan Barang Milik Negara';
      const pembuka = ctx.refNomorND
        ? `Menindaklanjuti Nota Dinas ${ctx.refPengirimND || 'Kepala Biro Keuangan dan Barang Milik Negara'} Nomor: ${ctx.refNomorND}${ctx.refTanggalND ? ` tanggal ${ctx.refTanggalND}` : ''} perihal ${ctx.refPerihalND || 'Penatausahaan Barang Milik Negara'}, bersama ini kami mengajukan permohonan Penetapan Status Penggunaan (PSP) dan penataan Barang Milik Negara (BMN) pada Pusat Kebijakan Strategis.`
        : `Dalam rangka tertib administrasi pengelolaan dan penatausahaan aset negara di lingkungan Pusat Kebijakan Strategis, bersama ini kami mengajukan permohonan Penetapan Status Penggunaan (PSP) serta penyesuaian lokasi Barang Milik Negara (BMN).`;
      const isi = `Daftar rincian Barang Milik Negara (BMN) beserta kode barang, nomor urutan pendaftaran (NUP), dan keterangan lokasi ruang kerja telah kami susun secara lengkap sebagaimana tercantum dalam lampiran Nota Dinas ini.${klausulTautan}`;
      const penutup = selectNotaDinasClosing(kepada, 'ND_FASILITAS', lowerInput);

      return {
        nota_hal: 'Permohonan Penetapan Status Penggunaan (PSP) dan Penataan Barang Milik Negara (BMN)',
        nota_kepada: kepada,
        nota_dari: 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: sifat,
        nota_lampiran: 'Satu berkas',
        nota_pembuka: pembuka,
        nota_isi: isi,
        nota_penutup: penutup,
        rekomendasi_kode_klasifikasi: 'PL.02.01',
        tipologi: 'ND_FASILITAS',
      };
    }

    // 5C. Fasilitasi Medical Check Up (MCU) / Kerumahtanggaan (Kepada Kepala Biro Umum)
    const kepada = 'Kepala Biro Umum';
    const pembuka =
      'Dalam rangka menjaga kesehatan dan mendukung produktivitas kerja pegawai di lingkungan Pusat Kebijakan Strategis Sekretariat Jenderal, bersama ini kami mengajukan permohonan fasilitasi pelaksanaan Pemeriksaan Kesehatan (Medical Check Up) bagi pejabat dan pegawai Pusat Kebijakan Strategis.';
    const isi = `Sehubungan dengan hal tersebut, bersama ini turut kami sampaikan daftar nama pegawai peserta pemeriksaan kesehatan sebagaimana terlampir untuk dapat difasilitasi sesuai ketentuan yang berlaku.${klausulTautan}`;
    const penutup = selectNotaDinasClosing(kepada, 'ND_FASILITAS', lowerInput);

    return {
      nota_hal: 'Permohonan Fasilitasi Pemeriksaan Kesehatan (Medical Check Up) Pegawai Pusat Kebijakan Strategis',
      nota_kepada: kepada,
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: sifat,
      nota_lampiran: 'Satu berkas',
      nota_pembuka: pembuka,
      nota_isi: isi,
      nota_penutup: penutup,
      rekomendasi_kode_klasifikasi: 'RT.01.01',
      tipologi: 'ND_FASILITAS',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOLOGI 4: ND_KOORDINASI (KOORDINASI & PERMINTAAN DATA / PIC LINTAS UNIT)
  // ═══════════════════════════════════════════════════════════════════════════
  const isKoordinasi =
    /\bpic\b|person in charge|narahubung|perwakilan unit|permintaan data|koordinasi lintas/i.test(lowerInput);

  if (isKoordinasi) {
    const kepada = '(Daftar Terlampir)';
    const pembuka = `Dalam rangka memperkuat sinergi pelaksanaan program serta kelancaran koordinasi substantif terkait ${e.namaAcara || 'penyusunan kebijakan strategis kementerian'}, bersama ini kami memohon kerja sama Bapak/Ibu untuk menugaskan perwakilan atau Person in Charge (PIC) dari masing-masing satuan kerja.`;
    const isi = `Usulan nama personel perwakilan atau PIC (dilengkapi dengan nama lengkap, jabatan, dan nomor kontak aktif) mohon kiranya dapat disampaikan kepada Pusat Kebijakan Strategis guna memudahkan koordinasi teknis selanjutnya.${klausulTautan}`;
    const penutup = selectNotaDinasClosing(kepada, 'ND_KOORDINASI', lowerInput);

    return {
      nota_hal: `Permohonan Penunjukan Person in Charge (PIC) Koordinasi ${e.namaAcara || 'Kebijakan Strategis'}`,
      nota_kepada: kepada,
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: sifat,
      nota_lampiran: 'Satu berkas',
      nota_pembuka: pembuka,
      nota_isi: isi,
      nota_penutup: penutup,
      rekomendasi_kode_klasifikasi: 'OT.01.01',
      tipologi: 'ND_KOORDINASI',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOLOGI 2: ND_KEBIJAKAN (SUBSTANSI & KAJIAN STRATEGIS) — DEFAULT MASTER
  // Tujuan: Sekretaris Jenderal (atau Dirjen KPM untuk GPR/Narasi Tunggal)
  // ═══════════════════════════════════════════════════════════════════════════

  // 2A. Skenario Khusus: Permohonan Penandatanganan SK / Keputusan / Tim Quickwins
  if (
    lowerInput.includes('permohonan') &&
    (lowerInput.includes('tanda tangan') ||
      lowerInput.includes('penandatanganan') ||
      lowerInput.includes('sk') ||
      lowerInput.includes('keputusan') ||
      lowerInput.includes('quickwins'))
  ) {
    return {
      nota_hal:
        'Permohonan Penandatanganan Keputusan Sekretaris Jenderal Tentang Tim Pemantauan Program Cepat (Quickwins) dan Tim Penyusunan Substansi Strategis Menteri dan Wakil Menteri',
      nota_kepada: 'Sekretaris Jenderal',
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: 'Segera',
      nota_lampiran: 'Satu berkas',
      nota_pembuka:
        'Dalam rangka mendukung pelaksanaan pemantauan Program Cepat (Quickwins) serta penyusunan substansi strategis Menteri dan Wakil Menteri, perlu dilakukan penyesuaian terhadap susunan personel Tim Pemantauan Program Percepatan (Quickwins) dan Tim Penyusunan Substansi Strategis Menteri dan Wakil Menteri agar sesuai dengan kebutuhan pelaksanaan tugas.',
      nota_isi:
        'Sehubungan dengan hal tersebut, bersama ini kami sampaikan draf Keputusan Sekretaris Jenderal yang telah disesuaikan dengan kebutuhan organisasi untuk memperoleh persetujuan dan penandatanganan Bapak Sekretaris Jenderal.',
      nota_penutup:
        'Demikian kami sampaikan. Apabila Bapak Sekretaris Jenderal tidak berpendapat lain, mohon perkenan Bapak Sekretaris Jenderal untuk menandatangani Keputusan Sekretaris Jenderal dimaksud. Atas perhatian dan perkenan Bapak Sekretaris Jenderal, kami ucapkan terima kasih.',
      rekomendasi_kode_klasifikasi: 'HK.01.06',
      tipologi: 'ND_KEBIJAKAN',
    };
  }

  // 2B. Skenario Khusus: Penyampaian Bahan / Keynote Speech / Sambutan Menteri
  if (
    lowerInput.includes('keynote') ||
    lowerInput.includes('pidato') ||
    lowerInput.includes('sambutan') ||
    (lowerInput.includes('bahan') &&
      (lowerInput.includes('menteri') || lowerInput.includes('disposisi') || lowerInput.includes('speech')))
  ) {
    const eventName =
      e.namaAcara ||
      'ASEAN Forum on the Protection of Journalistic Works in the Copyright Regime in the Digital Era';
    return {
      nota_hal: `Penyampaian Bahan Keynote Speech ${eventName}`,
      nota_kepada: 'Sekretaris Jenderal',
      nota_dari: 'Kepala Pusat Kebijakan Strategis',
      nota_sifat: sifat,
      nota_lampiran: 'Satu berkas',
      nota_pembuka: `Berdasarkan arahan dan disposisi pimpinan terkait pelaksanaan kegiatan ${eventName}, bersama ini dengan hormat kami sampaikan dukungan bahan dan data strategis sebagai suplemen Ibu Menteri Komunikasi dan Digital.`,
      nota_isi: `Pusat Kebijakan Strategis telah menyiapkan bahan berupa draf Keynote Speech yang dilengkapi dengan analisis kebijakan, data capaian indikator digital nasional, serta poin-poin posisi strategis Indonesia yang menjadi rujukan dalam penyusunan materi paparan tersebut.${klausulTautan}`,
      nota_penutup: selectNotaDinasClosing('Sekretaris Jenderal', 'ND_KEBIJAKAN', lowerInput),
      rekomendasi_kode_klasifikasi: 'PR.01.01',
      tipologi: 'ND_KEBIJAKAN',
    };
  }

  // 2C. Penyampaian Policy Brief / Laporan Kajian / Telaah Substantif (Formula 3 + Format 3 + Variasi Penutup 2)
  let kepada = 'Sekretaris Jenderal';
  if (/komunikasi publik|narasi tunggal|\bgpr\b|kehumasan/i.test(combinedInput)) {
    kepada = 'Direktur Jenderal Komunikasi Publik dan Media';
  } else if (/kepala biro\s+[^\n\r,]+/i.test(combinedInput)) {
    const biroMatch = combinedInput.match(/Kepala Biro\s+[^\n\r,\.]+/i);
    if (biroMatch) kepada = biroMatch[0].trim();
  } else if (/direktur jenderal\s+[^\n\r,]+/i.test(combinedInput)) {
    const dirMatch = combinedInput.match(/Direktur Jenderal\s+[^\n\r,\.]+/i);
    if (dirMatch) kepada = dirMatch[0].trim();
  }

  // Susun Hal Nota Dinas yang diawali kata benda verbal baku (Penyampaian / Permohonan / Pengajuan / Usulan)
  let hal = '';
  if (userPrompt && userPrompt.trim()) {
    hal = userPrompt
      .replace(/^(buatkan|tolong buatkan|bikin|susun|draftkan)\s+(nota dinas|nd)\s+(tentang|mengenai|perihal|untuk)?\s*/i, '')
      .replace(/\s+/g, ' ')
      .slice(0, 115)
      .trim();
  }
  if (!hal) {
    const titleMatch = text.match(/(?:POLICY BRIEF|LAPORAN|TELAAH|KAJIAN|HASIL PELAKSANAAN|EVALUASI)\s+[^\n\r]+/i);
    if (titleMatch) {
      hal = `Penyampaian ${titleMatch[0].trim()}`;
    } else if (fileName) {
      const cleanFileName = fileName.replace(/\.[a-zA-Z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
      hal = `Penyampaian Laporan dan Telaah ${cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1)}`;
    } else {
      hal = `Penyampaian Laporan Kajian dan Telaah Kebijakan ${e.namaAcara || 'Transformasi Digital'}`;
    }
  }
  if (!/^(Penyampaian|Permohonan|Pengajuan|Usulan|Laporan)\b/i.test(hal)) {
    hal = `Penyampaian ${hal.charAt(0).toUpperCase() + hal.slice(1)}`;
  } else {
    hal = hal.charAt(0).toUpperCase() + hal.slice(1);
  }

  // Ekstraksi kalimat-kalimat temuan pokok dari dokumen
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && !l.startsWith('[Halaman'));
  const candidateFindings = lines.filter((l) =>
    /(?:hasil|evaluasi|capaian|pelaksanaan|indikator|koordinasi|kendala|rekomendasi|kebijakan|persen|%|\d{4}|strategi|regulasi)/i.test(
      l
    )
  );

  // Formula 1 jika ada rujukan ND, atau Formula 3 (Mandat Arahan Pimpinan / Rapim)
  const pembuka = ctx.refNomorND
    ? `Menindaklanjuti Nota Dinas ${ctx.refPengirimND || 'Sekretaris Jenderal'} Nomor: ${ctx.refNomorND}${ctx.refTanggalND ? ` tanggal ${ctx.refTanggalND}` : ''} perihal ${ctx.refPerihalND || hal}, bersama ini dengan hormat kami sampaikan hasil telaah dan rekomendasi kebijakan sebagai berikut:`
    : `Berdasarkan arahan pimpinan dan hasil pelaksanaan telaah strategis pada Pusat Kebijakan Strategis terkait ${hal.replace(/^Penyampaian\s+/i, '')}, bersama ini dengan hormat kami sampaikan pokok-pokok telaah dan rekomendasi kebijakan sebagai berikut:`;

  // Format 3: Poin-Poin Narasi Eksekutif (1., 2., 3.) sesuai Panduan Bagian 3.2 Format 3
  const temuan1 =
    candidateFindings[0] ||
    `Pelaksanaan analisis dan evaluasi kebijakan terkait ${e.namaAcara || hal.replace(/^Penyampaian\s+/i, '')} menunjukkan perlunya penguatan tata kelola regulasi serta akselerasi infrastruktur dan ekosistem digital nasional secara terpadu.`;
  const temuan2 =
    candidateFindings[1] ||
    `Dari sisi implementasi lintas sektor, diperlukan penyelarasan indikator kinerja dan sinkronisasi program prioritas antar-satuan kerja agar target transformasi digital kementerian tercapai secara efektif dan terukur.`;

  const poinEksekutif = [
    `1. Evaluasi Konteks dan Temuan Substantif: ${temuan1}`,
    `2. Analisis Dampak dan Sinkronisasi Kebijakan: ${temuan2}`,
    `3. Rekomendasi Strategis dan Tindak Lanjut: Mengusulkan penetapan langkah koordinasi lanjutan serta penyusunan instrumen kebijakan teknis sebagai acuan operasional bagi unit kerja terkait di lingkungan Kementerian Komunikasi dan Digital.${klausulTautan}`,
  ].join('\n\n');

  const penutup = selectNotaDinasClosing(kepada, 'ND_KEBIJAKAN', lowerInput);

  return {
    nota_hal: hal,
    nota_kepada: kepada,
    nota_dari: 'Kepala Pusat Kebijakan Strategis',
    nota_sifat: sifat,
    nota_lampiran: 'Satu berkas',
    nota_pembuka: pembuka,
    nota_isi: poinEksekutif,
    nota_penutup: penutup,
    rekomendasi_kode_klasifikasi: 'PR.01.01',
    tipologi: 'ND_KEBIJAKAN',
  };
}

/**
 * SMART SURAT UNDANGAN EXTRACTOR (CLIENT-SIDE NLP & SYNTHESIS)
 */
export function smartLocalExtractSuratUndangan(
  text: string,
  fileName?: string,
  userPrompt?: string
): EkstraksiSuratUndangan {
  const e = extractEntitiesFromDocument(text, fileName);
  let hal = userPrompt
    ? userPrompt.replace(/^(buatkan|tolong buatkan|bikin|susun)\s+(surat undangan|undangan)\s+(tentang|mengenai|perihal|rapat)?\s*/i, '').slice(0, 90)
    : `Undangan Rapat ${e.namaAcara || 'Koordinasi Kebijakan Transformasi Digital'}`;
  hal = hal.charAt(0).toUpperCase() + hal.slice(1);

  const agenda = [
    `1. Pembahasan substansi dan arah tindak lanjut mengenai ${hal}.`,
    `2. Koordinasi teknis pelaksanaan program bersama unit kerja dan pemangku kepentingan terkait.`,
    `3. Perumusan kesepakatan dan rekomendasi langkah strategis berikutnya.`,
  ].join('\n');

  const pembuka =
    'Dalam rangka mendukung pelaksanaan tugas dan fungsi Pusat Kebijakan Strategis serta koordinasi teknis kebijakan, bersama ini kami mengundang Bapak/Ibu untuk hadir pada rapat yang akan diselenggarakan pada:';

  return {
    undangan_hal: hal,
    undangan_agenda: agenda,
    hari_tanggal_pelaksanaan: e.hariTanggalStr || 'Senin, 27 Oktober 2026',
    undangan_waktu: e.waktu || '09.00 WIB s.d. selesai',
    undangan_tipe_tempat: e.isHybrid ? 'hybrid' : e.isOnline ? 'online' : 'offline',
    undangan_tempat_offline: e.lokasi || 'Ruang Rapat Pusat Kebijakan Strategis, Gd. Sapta Pesona Lt. 5, Jakarta Pusat',
    undangan_tempat_online: e.linkOnline || 'https://s.komdigi.go.id/zoom-meeting',
    undangan_pembuka: pembuka,
    undangan_kepada: '(Daftar Terlampir)\ndi Tempat',
    undangan_sifat: 'Biasa',
  };
}

/**
 * SMART SURAT TUGAS EXTRACTOR (CLIENT-SIDE NLP & ADVANCED SYNTHESIS)
 */
export function smartLocalExtractSuratTugas(
  text: string,
  fileName?: string,
  userPrompt?: string
): EkstraksiUndangan {
  const e = extractEntitiesFromDocument(text, fileName);
  let namaAcara = userPrompt
    ? userPrompt.replace(/^(buatkan|tolong buatkan|tugaskan|bikin|susun)\s+(surat tugas|st)?\s*(untuk)?\s*/i, '').slice(0, 110)
    : e.namaAcara || 'Forum Koordinasi Kebijakan Transformasi Digital';
  namaAcara = namaAcara.charAt(0).toUpperCase() + namaAcara.slice(1);

  const narasiMenimbang =
    `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${namaAcara} serta optimalisasi kontribusi Pusat Kebijakan Strategis dalam perumusan kebijakan transformasi digital nasional, dipandang perlu menugaskan pegawai yang memiliki kompetensi teknis relevan untuk menghadiri, berpartisipasi aktif, dan melaksanakan tugas kedinasan dimaksud.`;

  const dasarSuratList: string[] = [];
  if (e.nomorSurat && e.nomorSurat !== '-') {
    dasarSuratList.push(
      `Surat Undangan dari ${e.instansi} Nomor : ${e.nomorSurat} tanggal ${e.hariTanggalStr.split(',')[1]?.trim() || e.tanggalMulai}.`
    );
  } else {
    dasarSuratList.push(`Arahan pimpinan perihal penugasan menghadiri ${namaAcara}.`);
  }
  dasarSuratList.push(
    `Daftar Isian Pelaksanaan Anggaran (DIPA) Pusat Kebijakan Strategis Kementerian Komunikasi dan Digital Republik Indonesia Tahun Anggaran 2026.`
  );

  const narasiDasar = dasarSuratList.join('\n');

  const narasiUntuk = [
    `1. Mengikuti, menghadiri, dan berpartisipasi aktif dalam rangkaian kegiatan ${namaAcara} pada tanggal ${e.hariTanggalStr || 'jadwal penugasan'} bertempat di ${e.lokasi || 'lokasi kegiatan'}.`,
    `2. Melakukan koordinasi substantif serta menghimpun masukan kebijakan bersama kementerian/lembaga dan pemangku kepentingan terkait.`,
    `3. Menyusun dan melaporkan hasil pelaksanaan tugas kedinasan serta rekomendasi tindak lanjut kepada Kepala Pusat Kebijakan Strategis.`,
  ].join('\n');

  return {
    nama_acara: namaAcara,
    nomor_surat_undangan: e.nomorSurat || '-',
    instansi_pengundang: e.instansi || 'Kementerian Komunikasi dan Digital RI',
    tanggal_surat_undangan: e.tanggalMulai,
    tanggal_mulai: e.tanggalMulai,
    tanggal_selesai: e.tanggalSelesai,
    waktu_pelaksanaan: e.waktu || '09.00 WIB s.d. selesai',
    hari_tanggal_pelaksanaan: e.hariTanggalStr || 'Sesuai jadwal penugasan',
    lokasi: e.lokasi || 'Jakarta',
    kota_kegiatan: e.kota || 'Jakarta Pusat',
    narasi_menimbang: narasiMenimbang,
    narasi_dasar: narasiDasar,
    narasi_untuk: narasiUntuk,
    perihal_undangan: `Undangan ${namaAcara}`,
    topik: e.topikPaparan || namaAcara,
    kriteria_peserta: 'Pegawai yang membidangi analisis kebijakan transformasi digital',
  };
}

