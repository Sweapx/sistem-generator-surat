import { GoogleGenAI, Type } from '@google/genai';
import { EkstraksiUndangan } from '../types';

const STORAGE_KEY_GEMINI_KEY = 'pusaka_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_GEMINI_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      ''
    );
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
  } catch {}
}

export interface FileAttachment {
  base64: string;
  mimeType: string;
  name: string;
}

const BULAN_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  jun: '06',
  jul: '07',
  agu: '08',
  agt: '08',
  sep: '09',
  okt: '10',
  nov: '11',
  des: '12',
};

export function parseIndonesianDate(text: string): string | null {
  if (!text) return null;
  // Match DD Month YYYY
  const match = text.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const month = BULAN_MAP[monthName];
    const year = match[3];
    if (month) return `${year}-${month}-${day}`;
  }
  // Match YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  // Match DD/MM/YYYY
  const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  }
  return null;
}

/**
 * Service to extract structured invitation data using Gemini AI model.
 * Supports text input and multimodal file attachments (PDF/Images).
 * Falls back to deep heuristic parser if API key is not provided or fails.
 */
export async function extractInvitationWithGemini(
  textOrPrompt: string,
  apiKeyOverride?: string,
  fileAttachment?: FileAttachment
): Promise<EkstraksiUndangan> {
  const apiKey =
    apiKeyOverride?.trim() ||
    getStoredGeminiApiKey()?.trim() ||
    '';

  const cleanText = (textOrPrompt || '').replace(/^\[Dokumen terlampir:[^\]]*\]\s*/i, '').trim();

  // If no Gemini API key or set to placeholder, use deep heuristic extraction
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return deepHeuristicExtract(cleanText || textOrPrompt, fileAttachment?.name);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Anda adalah Analis Tata Usaha (TU) Senior Kementerian Komunikasi dan Digital RI (Komdigi).
Tugas Anda adalah menelaah, men-screening, dan menganalisa dokumen surat undangan resmi kedinasan secara SANGAT MENDALAM, RINCI, DAN PRESISI untuk pembuatan Surat Tugas resmi.

BACА DAN ANALISA SELURUH BAGIAN DOKUMEN DENGAN TELITI:
1. Instansi atau Pejabat Pengirim Undangan:
   - Identifikasi Kop Surat dan/atau pejabat pengundang/penandatangan di penutup (misal: "Menteri Perencanaan Pembangunan Nasional/Kepala Bappenas", "Sekretariat Jenderal Kementerian Komunikasi dan Digital", "Pemerintah Provinsi Jawa Barat").
   - JANGAN menggunakan nama file atau kata dummy.
2. Nomor Surat Undangan:
   - Ambil nomor surat resmi persis seperti yang tertulis (contoh: "B-723/D.3/HM.01.01/07/2026"). Jika tidak ada nomor, isi "-". JANGAN mengarang nomor.
3. Tanggal Surat Undangan Diterbitkan:
   - Tanggal penetapan/penerbitan surat undangan (biasanya di kanan atas atau sebelum tanda tangan), format YYYY-MM-DD.
4. Perihal / Nama Kegiatan:
   - Ekstrak nama kegiatan atau perihal secara lengkap, jelas, dan spesifik (contoh: "Rapat Koordinasi Evaluasi Kebijakan dan Regulasi Penyelenggaraan Digital Nasional").
5. Perihal Ringkasan (FIELD PENTING — perihal_ringkasan):
   - Buat RINGKASAN singkat nan informatif tentang ISI SURAT yang menjelaskan TUJUAN PENUGASAN, bukan sekadar nama surat.
   - Format: "Menghadiri [Nama Kegiatan singkat] [konteks/tujuan kegiatan] di [Tempat Singkat]"
   - Contoh baik: "Menghadiri Rapat Koordinasi Evaluasi Regulasi Digital Nasional di Kemenko Perekonomian, Jakarta"
   - Contoh baik: "Menjadi Pemakalah Konferensi ICISS 2026 Bidang Infrastruktur Strategis di Hotel Indonesia Kempinski, Jakarta"
   - Contoh baik: "Mengikuti Bimtek Pengadaan Barang/Jasa Pemerintah Tahun 2026 di LKPP Pusat, Jakarta Selatan"
   - JANGAN hanya menulis nama surat atau perihal apa adanya. Rangkum apa yang akan DILAKUKAN pegawai.
6. Waktu Pelaksanaan (Hari, Tanggal Mulai, Tanggal Selesai, dan Jam):
   - tanggal_mulai & tanggal_selesai (format YYYY-MM-DD).
   - waktu_pelaksanaan (contoh: "08.30 WIB s.d. 17.00 WIB" atau "09.00 WIB s.d. Selesai").
   - hari_tanggal_pelaksanaan (contoh: "Rabu s.d. Jumat, 23 s.d. 25 September 2026").
7. Tempat / Lokasi & Alamat Lengkap:
   - WAJIB mencantumkan Nama Gedung/Hotel/Ruangan beserta ALAMAT JALAN LENGKAP (contoh: "Hotel Mercure Bandung Nexa Supratman, Jl. Supratman No. 66-68, Cihapit"). Jika daring, sebutkan "Media Daring (Zoom Meeting)".
8. Kota Kegiatan:
   - Nama kota atau kabupaten lokasi kegiatan (contoh: "Kota Bandung", "Jakarta Pusat", "Kabupaten Tangerang").
9. Tujuan / Isi Pokok & Urgensi Kegiatan:
   - Jelaskan isi pokok, maksud, dan tujuan diselenggarakannya kegiatan secara mendalam dan jelas.
10. Kriteria atau Sasaran Peserta:
    - Kriteria peserta atau jabatan pegawai yang diminta hadir (contoh: "Pejabat Administrator/Pengawas dan Analis Kebijakan yang membidangi regulasi dan pemetaan digital").
11. Rekomendasi Klausul Naskah Dinas Resmi Komdigi:
    - narasi_menimbang: Konsideran Menimbang resmi Surat Tugas yang mengaitkan urgensi acara dengan tugas fungsi Komdigi.
    - narasi_dasar: Konsideran Dasar resmi naskah dinas mengutip Surat Undangan [Instansi] Nomor : [Nomor] tanggal [Tanggal].
    - narasi_untuk: Diktum Untuk resmi yang merinci tugas pegawai, nama acara, waktu pelaksanaan, alamat lengkap tempat, dan kota.`;

    const parts: any[] = [{ text: promptText }];

    if (fileAttachment && fileAttachment.base64) {
      parts.push({
        inlineData: {
          mimeType: fileAttachment.mimeType || 'application/pdf',
          data: fileAttachment.base64,
        },
      });
    }

    if (cleanText) {
      parts.push({
        text: `Teks / Transkrip Dokumen Undangan:\n"""\n${cleanText}\n"""`,
      });
    }

    // Try available Gemini models (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nama_acara: { type: Type.STRING },
                nomor_surat_undangan: { type: Type.STRING },
                instansi_pengundang: { type: Type.STRING },
                tanggal_surat_undangan: { type: Type.STRING },
                tanggal_mulai: { type: Type.STRING },
                tanggal_selesai: { type: Type.STRING },
                waktu_pelaksanaan: { type: Type.STRING },
                hari_tanggal_pelaksanaan: { type: Type.STRING },
                lokasi: { type: Type.STRING },
                kota_kegiatan: { type: Type.STRING },
                topik: { type: Type.STRING },
                perihal_undangan: { type: Type.STRING },
                perihal_ringkasan: { type: Type.STRING },
                kriteria_peserta: { type: Type.STRING },
                narasi_menimbang: { type: Type.STRING },
                narasi_dasar: { type: Type.STRING },
                narasi_untuk: { type: Type.STRING },
                keterangan_tambahan: { type: Type.STRING },
              },
              required: [
                'nama_acara',
                'nomor_surat_undangan',
                'instansi_pengundang',
                'tanggal_mulai',
                'tanggal_selesai',
                'lokasi',
                'kota_kegiatan',
                'topik',
              ],
            },
          },
        });

        const contentText = response.text?.trim();
        if (contentText) {
          const parsed = JSON.parse(contentText);
          const namaAcara = parsed.nama_acara || 'Kegiatan Rapat Kedinasan';
          const nomorSurat = parsed.nomor_surat_undangan || '-';
          const instansi = parsed.instansi_pengundang || 'Penyelenggara Kegiatan';
          const tglSurat = parsed.tanggal_surat_undangan || new Date().toISOString().split('T')[0];
          const tglMulai = parsed.tanggal_mulai || new Date().toISOString().split('T')[0];
          const tglSelesai = parsed.tanggal_selesai || tglMulai;
          const waktu = parsed.waktu_pelaksanaan || '09.00 WIB s.d. Selesai';
          const lokasi = parsed.lokasi || 'Tempat Penyelenggara';
          const kota = parsed.kota_kegiatan || 'Jakarta Pusat';
          // Gunakan perihal_ringkasan jika tersedia, lalu perihal_undangan, lalu topik, lalu nama acara
          const perihal = parsed.perihal_ringkasan || parsed.perihal_undangan || parsed.topik || `Menghadiri ${namaAcara} di ${lokasi}`;
          const kriteriaPeserta = parsed.kriteria_peserta || 'Pegawai yang membidangi substansi kegiatan';

          return {
            nama_acara: namaAcara,
            nomor_surat_undangan: nomorSurat,
            instansi_pengundang: instansi,
            tanggal_surat_undangan: tglSurat,
            tanggal_mulai: tglMulai,
            tanggal_selesai: tglSelesai,
            waktu_pelaksanaan: waktu,
            hari_tanggal_pelaksanaan: parsed.hari_tanggal_pelaksanaan || `${tglMulai} s.d. ${tglSelesai}`,
            lokasi: lokasi,
            kota_kegiatan: kota,
            topik: perihal,
            perihal_undangan: perihal,
            kriteria_peserta: kriteriaPeserta,
            narasi_menimbang:
              parsed.narasi_menimbang ||
              `Bahwa dalam rangka mendukung kelancaran pelaksanaan dan arah kebijakan ${perihal}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`,
            narasi_dasar:
              parsed.narasi_dasar ||
              `Surat Undangan ${instansi} Nomor : ${nomorSurat} tanggal ${tglSurat}.`,
            narasi_untuk:
              parsed.narasi_untuk ||
              `Mengikuti kegiatan ${namaAcara} yang dilaksanakan pada ${waktu} bertempat di ${lokasi}, ${kota}.`,
            keterangan_tambahan: `Analisa Mendalam Gemini AI (${modelName})`,
          };
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next candidate...`, err);
      }
    }

    throw lastError || new Error('Semua model Gemini gagal merespons');
  } catch (err) {
    console.warn('Gemini AI extraction unavailable, performing deep heuristic parsing:', err);
    return deepHeuristicExtract(cleanText || textOrPrompt, fileAttachment?.name);
  }
}

/**
 * Deep heuristic and NLP analysis for Indonesian official correspondence (Surat Undangan Dinas).
 * Accurately extracts Nomor, Instansi, Tanggal, Perihal, Waktu, Lokasi/Alamat, Kota, dan Klausul Resmi.
 */
export function deepHeuristicExtract(text: string, fileName?: string): EkstraksiUndangan {
  const clean = (text || '')
    .replace(/^\[Dokumen terlampir:[^\]]*\]\s*/gi, '')
    .trim();

  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. EXTRACT NOMOR SURAT RESMI
  let nomorSurat = '';
  const noMatch = clean.match(/(?:Nomor|No\.?)\s*[:=]\s*([^\n\r]+)/i);
  if (noMatch) {
    // Strip trailing tags such as Sifat:, Lampiran:, Hal:
    const rawNo = noMatch[1]
      .split(/\s{2,}|\t|(?:\bSifat\b|\bLampiran\b|\bHal\b|\bPerihal\b|\bTanggal\b)/i)[0]
      .trim();
    if (rawNo && !rawNo.startsWith('-') && rawNo.length > 2) {
      nomorSurat = rawNo;
    }
  }

  // Fallback pattern match for Indonesian letter number pattern (e.g. B-123/SJ/2026 or 851/SJ.9/KP.01.06/09/2026)
  if (!nomorSurat) {
    const patternMatch = clean.match(/\b([A-Za-z0-9\.\-]+\/[A-Za-z0-9\.\-\/]+[0-9])\b/);
    if (patternMatch) {
      nomorSurat = patternMatch[1];
    }
  }

  // 2. EXTRACT PERIHAL / HAL
  let perihal = '';
  const halMatch = clean.match(/(?:Perihal|Hal)\s*[:=]\s*([^\n\r]+(?:\n\s{2,}[^\n\r]+)?)/i);
  if (halMatch) {
    perihal = halMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Bersihkan awalan kata "Undangan" / "Permohonan" untuk nama acara
  let namaAcara = perihal;
  if (!namaAcara && fileName) {
    // If filename has readable words, clean it
    const cleanFile = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/^\d+[\s_-]*/, '') // remove date prefix
      .replace(/[-_]/g, ' ')
      .trim();
    if (cleanFile.length > 5) {
      namaAcara = cleanFile;
    }
  }
  if (!namaAcara) {
    namaAcara = 'Kegiatan Rapat Koordinasi dan Pembahasan Kebijakan';
  }

  // 3. EXTRACT INSTANSI ATAU PEJABAT PENGIRIM
  let instansi = '';

  // Scan Kop Surat (top 8 lines)
  const kopCandidates = lines.slice(0, 8);
  for (const line of kopCandidates) {
    if (
      /(?:KEMENTERIAN|BADAN|LEMBAGA|SEKRETARIAT JENDERAL|DIREKTORAT JENDERAL|PUSAT KEBIJAKAN|PEMERINTAH PROVINSI|PEMERINTAH KOTA|PEMERINTAH KABUPATEN|DINAS KOMUNIKASI)/i.test(
        line
      ) &&
      !/(?:Jalan|Jl\.|Telepon|Telp|Email|Fax|Website|Kode Pos)/i.test(line)
    ) {
      instansi = line;
      break;
    }
  }

  // Jika tidak ditemukan di Kop, cari nama pengirim/pejabat di teks atau penutup
  if (!instansi) {
    const pengirimMatch = clean.match(
      /(?:a\.n\.\s+)?(?:Menteri|Kepala Pusat|Kepala Badan|Kepala Dinas|Sekretaris Jenderal|Direktur Jenderal|Sekretaris Daerah|Deputi)\s+[^\n\r,]+/i
    );
    if (pengirimMatch) {
      instansi = pengirimMatch[0].trim();
    }
  }

  if (!instansi) {
    instansi = 'Instansi Penyelenggara Kegiatan';
  }

  // 4. EXTRACT TANGGAL PENETAPAN SURAT UNDANGAN
  let tanggalSuratUndangan = new Date().toISOString().split('T')[0];
  const tglSuratMatch = clean.match(
    /(?:Jakarta|Bandung|Bogor|Depok|Tangerang|Bekasi|Surabaya|Semarang|Yogyakarta|Denpasar|Tanggal|Tgl\.?)[,\s:=]+(\d{1,2}\s+[a-zA-Z]+\s+\d{4})/i
  );
  if (tglSuratMatch) {
    const parsed = parseIndonesianDate(tglSuratMatch[1]);
    if (parsed) tanggalSuratUndangan = parsed;
  }

  // 5. EXTRACT HARI, TANGGAL PELAKSANAAN KEGIATAN
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  let tanggalMulai = defaultDate;
  let tanggalSelesai = defaultDate;
  let hariTanggalStr = '';

  const dateMatch = clean.match(
    /(?:Hari[\s/,\-]+Tanggal|Hari\s*,\s*Tanggal|Tanggal\s+Pelaksanaan|Waktu\s+Pelaksanaan)\s*[:=]\s*([^\n\r]+)/i
  );
  if (dateMatch) {
    hariTanggalStr = dateMatch[1].trim();

    // Check date range: "23 s.d. 25 September 2026" or "23 - 25 September 2026"
    const rangeMatch = hariTanggalStr.match(
      /(\d{1,2})\s*(?:s\.?d\.?|-)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i
    );
    if (rangeMatch) {
      const monthName = rangeMatch[3].toLowerCase();
      const month = BULAN_MAP[monthName];
      const year = rangeMatch[4];
      if (month) {
        tanggalMulai = `${year}-${month}-${rangeMatch[1].padStart(2, '0')}`;
        tanggalSelesai = `${year}-${month}-${rangeMatch[2].padStart(2, '0')}`;
      }
    } else {
      // Single date
      const parsed = parseIndonesianDate(hariTanggalStr);
      if (parsed) {
        tanggalMulai = parsed;
        tanggalSelesai = parsed;
      }
    }
  }

  // 6. EXTRACT WAKTU / JAM PELAKSANAAN
  let waktu = '09.00 WIB s.d. Selesai';
  const waktuMatch = clean.match(/(?:Waktu|Pukul|Jam)\s*[:=]\s*([^\n\r]+)/i);
  if (waktuMatch) {
    waktu = waktuMatch[1].split(/\s{3,}|\t/)[0].trim();
  }

  // 7. EXTRACT TEMPAT / ALAMAT LENGKAP KEGIATAN
  let lokasi = '';
  const tempatMatch = clean.match(/(?:Tempat|Lokasi)\s*[:=]\s*([^\n\r]+(?:\n\s{2,}[^\n\r]+)*)/i);
  if (tempatMatch) {
    lokasi = tempatMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Detect online meeting / Zoom
  if (/(?:Zoom|Microsoft Teams|Webinar|Daring|Video Conference)/i.test(clean)) {
    if (!lokasi || lokasi.length < 5) {
      lokasi = 'Media Daring (Zoom Meeting / Video Conference)';
    }
  }

  if (!lokasi) {
    lokasi = 'Kantor / Tempat Penyelenggara';
  }

  // 8. DETEKSI KOTA KEGIATAN
  let kota = 'Jakarta Pusat';
  const searchCorpus = `${lokasi} ${clean}`.toLowerCase();

  if (/bandung/i.test(searchCorpus)) kota = 'Kota Bandung';
  else if (/tangerang selatan/i.test(searchCorpus)) kota = 'Kota Tangerang Selatan';
  else if (/kab\.?\s*tangerang|kabupaten tangerang/i.test(searchCorpus)) kota = 'Kabupaten Tangerang';
  else if (/tangerang/i.test(searchCorpus)) kota = 'Kota Tangerang';
  else if (/bogor/i.test(searchCorpus)) kota = 'Kota Bogor';
  else if (/depok/i.test(searchCorpus)) kota = 'Kota Depok';
  else if (/bekasi/i.test(searchCorpus)) kota = 'Kota Bekasi';
  else if (/surabaya/i.test(searchCorpus)) kota = 'Kota Surabaya';
  else if (/semarang/i.test(searchCorpus)) kota = 'Kota Semarang';
  else if (/surakarta|solo/i.test(searchCorpus)) kota = 'Kota Surakarta';
  else if (/yogyakarta|jogja|sleman/i.test(searchCorpus)) kota = 'D.I. Yogyakarta';
  else if (/bali|denpasar|badung/i.test(searchCorpus)) kota = 'Denpasar, Bali';
  else if (/medan/i.test(searchCorpus)) kota = 'Kota Medan';
  else if (/makassar/i.test(searchCorpus)) kota = 'Kota Makassar';
  else if (/balikpapan/i.test(searchCorpus)) kota = 'Kota Balikpapan';
  else if (/samarinda/i.test(searchCorpus)) kota = 'Kota Samarinda';
  else if (/ikn|nusantara/i.test(searchCorpus)) kota = 'Ibu Kota Nusantara (IKN)';
  else if (/jakarta selatan/i.test(searchCorpus)) kota = 'Jakarta Selatan';
  else if (/jakarta barat/i.test(searchCorpus)) kota = 'Jakarta Barat';
  else if (/jakarta timur/i.test(searchCorpus)) kota = 'Jakarta Timur';
  else if (/jakarta utara/i.test(searchCorpus)) kota = 'Jakarta Utara';
  else if (/daring|zoom/i.test(searchCorpus)) kota = 'Daring (Online) / Jakarta';

  // 9. DETEKSI KRITERIA PESERTA
  let kriteriaPeserta = 'Pegawai yang membidangi analisis kebijakan dan substansi terkait';
  const pesertaMatch = clean.match(/(?:Kriteria|Peserta|Sasaran|Ditugaskan|Menugaskan)\s*[:=]\s*([^\n\r]+)/i);
  if (pesertaMatch) {
    kriteriaPeserta = pesertaMatch[1].trim();
  }

  // 10. FORMAT KLAUSUL RESMI NASKAH DINAS KOMDIGI
  const finalNomor = nomorSurat || '-';
  const finalInstansi = instansi;
  const finalAcara = namaAcara;

  const narasiMenimbang = `Bahwa dalam rangka mendukung arah kebijakan dan pelaksanaan kegiatan ${finalAcara}, dipandang perlu menugaskan pegawai untuk menghadiri dan mengikuti kegiatan dimaksud.`;
  const narasiDasar =
    finalNomor !== '-'
      ? `Surat Undangan ${finalInstansi} Nomor : ${finalNomor} tanggal ${tanggalSuratUndangan}.`
      : `Surat Undangan dari ${finalInstansi} tanggal ${tanggalSuratUndangan}.`;
  const narasiUntuk = `Mengikuti kegiatan ${finalAcara} yang dilaksanakan pada tanggal ${
    hariTanggalStr || `${tanggalMulai} s.d. ${tanggalSelesai}`
  } bertempat di ${lokasi}, ${kota}.`;

  return {
    nama_acara: finalAcara,
    nomor_surat_undangan: finalNomor,
    instansi_pengundang: finalInstansi,
    tanggal_surat_undangan: tanggalSuratUndangan,
    tanggal_mulai: tanggalMulai,
    tanggal_selesai: tanggalSelesai,
    waktu_pelaksanaan: waktu,
    hari_tanggal_pelaksanaan: hariTanggalStr || `${tanggalMulai} s.d. ${tanggalSelesai}`,
    lokasi: lokasi,
    kota_kegiatan: kota,
    topik: perihal || finalAcara,
    // Bangun perihal yang deskriptif: kata kerja + nama kegiatan singkat + kota
    perihal_undangan: perihal
      ? `Menghadiri ${perihal}${kota !== 'Jakarta Pusat' ? ` di ${kota}` : ''}`
      : `Menghadiri ${finalAcara} di ${kota}`,
    kriteria_peserta: kriteriaPeserta,
    narasi_menimbang: narasiMenimbang,
    narasi_dasar: narasiDasar,
    narasi_untuk: narasiUntuk,
    keterangan_tambahan: 'Dianalisis secara mendalam melalui Modul Ekstraksi Dokumen Dinas Pusaka Komdigi',
  };
}
