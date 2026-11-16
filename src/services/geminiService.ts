import { GoogleGenAI, Type } from '@google/genai';
import { EkstraksiUndangan, EkstraksiSuratUndangan, EkstraksiNotaDinas } from '../types';
import {
  smartLocalExtractSuratTugas,
  smartLocalExtractSuratUndangan,
  smartLocalExtractNotaDinas,
} from './localDocumentIntelligence';

const STORAGE_KEY_GEMINI_KEY = 'pusaka_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  try {
    const envKey =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      localStorage.getItem(STORAGE_KEY_GEMINI_KEY) ||
      '';
    if (envKey === 'YOUR_GEMINI_API_KEY_HERE' || envKey === 'MY_GEMINI_API_KEY') {
      return '';
    }
    return envKey.trim();
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
  } catch {}
}

/**
 * Inisialisasi client GoogleGenAI yang mendukung baik Gemini Developer API Key (AIza...)
 * maupun Google Cloud Vertex AI Express Mode API Key (AQ....) dari file .env.
 */
function createGeminiClient(apiKey: string): GoogleGenAI {
  const cleanKey = apiKey.trim();
  if (cleanKey.startsWith('AQ.')) {
    return new GoogleGenAI({ vertexai: true, apiKey: cleanKey });
  }
  return new GoogleGenAI({ apiKey: cleanKey });
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
  fileAttachment?: FileAttachment,
  userPrompt?: string
): Promise<EkstraksiUndangan> {
  const apiKey =
    apiKeyOverride?.trim() ||
    getStoredGeminiApiKey()?.trim() ||
    '';

  const cleanText = (textOrPrompt || '').replace(/^\[Dokumen terlampir:[^\]]*\]\s*/i, '').trim();

  // If no Gemini API key or set to placeholder, use deep heuristic extraction with prompt support
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return smartLocalExtractSuratTugas(cleanText || textOrPrompt, fileAttachment?.name, userPrompt);
  }

  try {
    const ai = createGeminiClient(apiKey);

    const promptText = `Anda adalah Analis Tata Usaha (TU) Senior Kementerian Komunikasi dan Digital RI (Komdigi).
Tugas Anda adalah menelaah, men-screening, dan menganalisa dokumen surat undangan resmi kedinasan dan/atau perintah pengguna secara SANGAT MENDALAM, RINCI, DAN PRESISI untuk pembuatan Surat Tugas resmi.

${userPrompt ? `INSTRUKSI/PERINTAH TAMBAHAN DARI PENGGUNA (PRIORITASKAN & PATUHI INI):\n"""\n${userPrompt}\n"""\n` : ''}

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

    // Gunakan kandidat model tercepat dengan thinkingBudget: 0 pada 2.5-flash agar ekstraksi JSON selesai dalam ~1 detik
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: {
            ...(modelName.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
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
    console.warn('Gemini AI extraction unavailable, performing smart local document intelligence:', err);
    return smartLocalExtractSuratTugas(cleanText || textOrPrompt, fileAttachment?.name);
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

/**
 * Service to extract structured Surat Undangan data using Gemini AI or heuristic fallback
 */
/**
 * Service to extract structured Surat Undangan data using Gemini AI or heuristic fallback
 */
export async function extractSuratUndanganWithGemini(
  textOrPrompt: string,
  apiKeyOverride?: string,
  fileAttachment?: FileAttachment,
  userPrompt?: string
): Promise<EkstraksiSuratUndangan> {
  const apiKey = apiKeyOverride?.trim() || getStoredGeminiApiKey()?.trim() || '';
  const cleanText = (textOrPrompt || '').replace(/^\[Dokumen terlampir:[^\]]*\]\s*/i, '').trim();

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = createGeminiClient(apiKey);
      const prompt = `Anda adalah Analis Tata Naskah Dinas Kementerian Komunikasi dan Digital RI (PUSAKA).
Telaah dokumen acuan berikut dan/atau perintah pengguna untuk menyusun SURAT UNDANGAN RESMI:

${userPrompt ? `INSTRUKSI/PERINTAH KHUSUS DARI PENGGUNA (PRIORITASKAN & PATUHI INI):\n"""\n${userPrompt}\n"""\n` : ''}

1. Perihal / Hal Undangan: Judul/perihal surat undangan yang ringkas dan jelas.
2. Agenda Pembahasan: Poin-poin atau uraian agenda rapat yang akan dibahas.
3. Hari dan Tanggal Pelaksanaan: Contoh "Senin, 27 Oktober 2026"
4. Waktu Pelaksanaan: Contoh "09.00 WIB s.d. selesai"
5. Tipe Tempat: "hybrid", "offline", atau "online"
6. Tempat Fisik (Offline): Ruang rapat, nama gedung, dan alamat jika ada.
7. Tempat Daring (Online): Link video conference jika ada.
8. Paragraf Pengantar/Pembuka: Paragraf pengantar yang sopan sesuai tata naskah dinas Komdigi.
9. Daftar Pihak yang Diundang (undangan_kepada): Daftar nama pejabat/satker yang diundang (format: "(Daftar Terlampir)\\ndi Tempat" atau rincian pejabat).
10. Sifat Surat: "Biasa", "Segera", atau "Penting"`;

      const parts: any[] = [{ text: prompt }];
      if (fileAttachment && fileAttachment.base64) {
        parts.push({
          inlineData: {
            mimeType: fileAttachment.mimeType || 'application/pdf',
            data: fileAttachment.base64,
          },
        });
      }
      if (cleanText) {
        parts.push({ text: `Dokumen Acuan:\n"""\n${cleanText}\n"""` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              undangan_hal: { type: Type.STRING },
              undangan_agenda: { type: Type.STRING },
              hari_tanggal_pelaksanaan: { type: Type.STRING },
              undangan_waktu: { type: Type.STRING },
              undangan_tipe_tempat: { type: Type.STRING },
              undangan_tempat_offline: { type: Type.STRING },
              undangan_tempat_online: { type: Type.STRING },
              undangan_pembuka: { type: Type.STRING },
              undangan_kepada: { type: Type.STRING },
              undangan_sifat: { type: Type.STRING },
            },
            required: ['undangan_hal', 'undangan_agenda', 'hari_tanggal_pelaksanaan', 'undangan_waktu'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        undangan_hal: parsed.undangan_hal || 'Undangan Rapat Pembahasan',
        undangan_agenda: parsed.undangan_agenda || 'Pembahasan agenda strategis dan asistensi substansi kebijakan.',
        hari_tanggal_pelaksanaan: parsed.hari_tanggal_pelaksanaan || 'Senin, 27 Oktober 2026',
        undangan_waktu: parsed.undangan_waktu || '09.00 WIB s.d. selesai',
        undangan_tipe_tempat: (parsed.undangan_tipe_tempat === 'online' || parsed.undangan_tipe_tempat === 'offline') ? parsed.undangan_tipe_tempat : 'hybrid',
        undangan_tempat_offline: parsed.undangan_tempat_offline || 'Ruang Rapat Pusat Kebijakan Strategis, Gd Sapta Pesona Lt. 5, Jl. Medan Merdeka Barat No. 17-19, Jakarta Pusat',
        undangan_tempat_online: parsed.undangan_tempat_online || 'https://s.komdigi.go.id/zoom-rapat',
        undangan_pembuka: parsed.undangan_pembuka || 'Dalam rangka mendukung pelaksanaan tugas dan fungsi Pusat Kebijakan Strategis, bersama ini kami bermaksud menyelenggarakan rapat yang akan diselenggarakan pada:',
        undangan_kepada: parsed.undangan_kepada || '(Daftar Terlampir)\ndi Jakarta',
        undangan_sifat: parsed.undangan_sifat || 'Biasa',
      };
    } catch (err) {
      console.warn('Gemini screening Undangan failed, using heuristic fallback:', err);
    }
  }

  // Smart Local NLP Fallback (Tanpa API Key)
  return smartLocalExtractSuratUndangan(cleanText || textOrPrompt, fileAttachment?.name, userPrompt);
}

import { formatNumberedPoints } from './naskahFormatter';

/**
 * Service to extract structured Nota Dinas data using Gemini AI or heuristic fallback.
 * Mendukung format paragraf penjelasan mengalir (resmi Komdigi) serta format poin-poin.
 */
export async function extractNotaDinasWithGemini(
  textOrPrompt: string,
  apiKeyOverride?: string,
  fileAttachment?: FileAttachment,
  userPrompt?: string
): Promise<EkstraksiNotaDinas> {
  const apiKey = apiKeyOverride?.trim() || getStoredGeminiApiKey()?.trim() || '';
  const cleanText = (textOrPrompt || '').replace(/^\[Dokumen terlampir:[^\]]*\]\s*/i, '').trim();

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = createGeminiClient(apiKey);
      const prompt = `Anda adalah Analis Tata Naskah Dinas Pusat Kebijakan Strategis (PUSAKA), Sekretariat Jenderal Kementerian Komunikasi dan Digital RI.
Tugas Anda adalah menelaah dokumen acuan dan/atau perintah pengguna untuk menyusun NOTA DINAS RESMI sesuai "Panduan Struktur dan Otomatisasi Nota Dinas PUSAKA Komdigi":

${userPrompt ? `INSTRUKSI/PERINTAH KHUSUS DARI PENGGUNA (PRIORITASKAN & PATUHI INI):\n"""\n${userPrompt}\n"""\n` : ''}

ATURAN BAKU METADATA & TIPOLOGI NOTA DINAS PUSAKA:
1. Yth. (nota_kepada): WAJIB HANYA MENULISKAN NAMA JABATAN (tanpa nama pejabat), dipetakan berdasarkan 5 Tipologi Master:
   - Tipologi 1 (ND_SDM - Kepegawaian: KGB, Kenaikan Pangkat, Uji Kompetensi/Kenaikan Jenjang JF, SPMT, Kelas Jabatan, SIMPEG, Cuti, Tugas Belajar) -> "Kepala Biro Sumber Daya Manusia dan Organisasi" (rekomendasi_kode_klasifikasi: "KP.01.01", "KP.03.03", atau "KP.05.01").
   - Tipologi 2 (ND_KEBIJAKAN - Substansi & Kajian: Policy Brief, Laporan Kajian, Bahan Rapim, Keynote Speech, SK Tim Quickwins, Arahan Pimpinan) -> "Sekretaris Jenderal" atau "Direktur Jenderal Komunikasi Publik dan Media" bila terkait GPR/Narasi Tunggal (rekomendasi_kode_klasifikasi: "PR.01.01", "HK.01.06", atau "HM.01.01").
   - Tipologi 3 (ND_ANGGARAN - Perencanaan, Anggaran, Akuntabilitas & Pajak):
     * Revisi Anggaran DIPA / Pokok-Pokok Revisi / Bukti Potong Pajak 1721-A2 -> "Kepala Biro Keuangan dan Barang Milik Negara" ("PR.02.02" atau "KU.03.01")
     * Usulan Kegiatan Prioritas / Renja / Perjanjian Kinerja -> "Kepala Biro Perencanaan" ("PR.01.02")
     * Tindak Lanjut Reviu APIP / LHP Pengawasan -> "Inspektur IV" ("PW.01.01")
   - Tipologi 4 (ND_KOORDINASI - Permintaan PIC / Data Lintas Unit) -> "(Daftar Terlampir)" ("OT.01.01").
   - Tipologi 5 (ND_FASILITAS - Fasilitasi Umum, BMN & TI):
     * Fasilitasi Medical Check Up (MCU) / Kerumahtanggaan -> "Kepala Biro Umum" ("RT.01.01")
     * Penetapan Status Penggunaan (PSP) / Pemindahan BMN -> "Kepala Biro Keuangan dan Barang Milik Negara" ("PL.02.01")
     * Reset Akun / Layanan TI / Email Dinas -> "Kepala Pusat Data dan Sarana Informatika" ("TI.01.01")
2. Dari (nota_dari): Selalu "Kepala Pusat Kebijakan Strategis".
3. Hal (nota_hal): Diawali kata benda verbal baku: "Penyampaian ...", "Permohonan ...", "Pengajuan ...", atau "Usulan ..." (Title Case, lugas dan komprehensif).
4. Sifat (nota_sifat): "Biasa", "Segera", atau "Rahasia".
5. Lampiran (nota_lampiran): "Satu berkas" atau "-".

ATURAN 6 FORMULA PARAGRAF PEMBUKA (nota_pembuka):
Pilih 1 formula yang paling tepat sesuai konteks:
- Formula 1 (Tindak Lanjut ND/Surat Masuk): "Menindaklanjuti Nota Dinas {Jabatan_Pengirim_Asal} Nomor: {Nomor_ND_Asal} tanggal {Tanggal_ND_Asal} perihal {Perihal_ND_Asal}, bersama ini kami sampaikan/mengajukan permohonan {Inti_Tindak_Lanjut} sebagai berikut:"
- Formula 2 (Tindak Lanjut SK Menteri/Regulasi): "Menindaklanjuti Keputusan Menteri Komunikasi dan Digital Republik Indonesia Nomor {Nomor_SK} tanggal {Tanggal_SK} tentang {Judul_SK}, bersama ini kami mengajukan permohonan untuk dilakukan {Nama_Tindakan} TMT {Tanggal_TMT} bagi pegawai yang telah ditetapkan dalam jabatan {Nama_Jabatan}, dengan informasi pegawai sebagai berikut:"
- Formula 3 (Mandat Arahan Pimpinan / Rapim / Kajian Strategis): "Berdasarkan {arahan Ibu Menteri / hasil Rapat Pimpinan (RAPIM) / pelaksanaan telaah strategis} terkait {Topik}, bersama ini dengan hormat kami sampaikan {Dokumen_Output} sebagai berikut:"
- Formula 4 (Syarat Administratif Berkala):
  * KGB: "Dengan telah terpenuhinya syarat kenaikan gaji berkala yaitu telah mencapai masa kerja golongan yang ditentukan, maka bersama ini kami sampaikan pengajuan kenaikan gaji berkala atas nama:"
  * Kenaikan Pangkat / Jenjang JF: "Sehubungan dengan telah dipenuhinya persyaratan administratif dan kinerja pegawai dalam rangka pengusulan {Jenis_Kenaikan} pada Pusat Kebijakan Strategis Sekretariat Jenderal, bersama ini kami mengusulkan {Jenis_Kenaikan} bagi pegawai sebagai berikut:"
  * Revisi Anggaran DIPA: "Sehubungan dengan adanya penyesuaian belanja dalam rangka pemenuhan kebutuhan kegiatan prioritas Pusat Kebijakan Strategis Tahun Anggaran {Tahun}, bersama ini kami mengajukan permohonan Revisi Anggaran pada DIPA Pusat Kebijakan Strategis."
- Formula 5 (Tujuan Fungsional & Tata Kelola): "Dalam rangka {Tujuan_Kedinasan}, bersama ini kami mengajukan permohonan / mengusulkan {Bentuk_Permohonan} dengan rincian sebagai berikut:"
- Formula 6 (Permohonan Teknis Langsung): "Bersama ini kami mengajukan permohonan {Bentuk_Permohonan_Teknis} dikarenakan {Alasan_Teknis} bagi pegawai atas nama:"

ATURAN 5 FORMAT PENYAJIAN SUBSTANSI ISI (nota_isi):
Pilih format isi yang sesuai dengan tipologi naskah (JANGAN mengulang kalimat pembuka atau penutup di dalam nota_isi):
- Format 1 (Blok Atribut Identitas Pegawai - Khusus 1 Orang Pegawai pada KGB/KP/Ujikom/SPMT/SIMPEG/Pajak/Reset Akun):
  Tulis setiap atribut pada baris tersendiri dengan format "Label : Nilai":
  Nama : {Nama Lengkap beserta Gelar}
  NIP : {18 Digit NIP}
  Pangkat/Gol : {Pangkat / Golongan Ruang} (atau Pangkat saat ini & Pangkat yang dituju untuk KP)
  Jabatan : {Nama Jabatan} (atau Jabatan Baru untuk SPMT; atau Jabatan saat ini & Jabatan yang dituju untuk Ujikom)
  Unit Kerja : Pusat Kebijakan Strategis

  Sebagai kelengkapan administrasi pengajuan {Jenis_Urusan} dimaksud, turut kami lampirkan berkas persyaratan yang dibutuhkan.
- Format 2 (Narasi Rekapitulasi Multi-Pegawai / Rincian Anggaran & Aset): Rincian terstruktur disertai kalimat pengantar lampiran berkas/matriks.
- Format 3 (Poin-Poin Narasi Eksekutif - Khusus Laporan Hasil Telaah / Policy Brief / Laporan Kajian / Evaluasi / Hasil Reviu Regulasi):
   Analisis secara mendalam seluruh isi laporan/dokumen yang diunggah (termasuk permasalahan utama, kerangka regulasi/hukum seperti UU/PP/Permen, data capaian, dan rekomendasi kebijakan).
  Sajikan dalam 3 s.d. 4 poin bernomor angka Arab (1., 2., 3., 4.) di mana kalimat/frasa utama di awal setiap poin ditebalkan dengan **...** seperti standar Nota Dinas Komdigi:
  1. **{Frasa/Judul Inti Poin Pertama}**: {Narasi analitis mendalam mengenai temuan pertama, konteks regulasi, dan rincian operasional}.
  2. **{Frasa/Judul Inti Poin Kedua}**: {Narasi analitis mendalam mengenai temuan kedua, mekanisme pelaksanaan, atau evaluasi substansi}.
  3. **{Frasa/Judul Inti Poin Ketiga}**: {Narasi analitis mendalam mengenai prinsip tata kelola, pelindungan data/mitigasi risiko, atau sinkronisasi lintas sektor}.
  4. **{Frasa/Judul Inti Poin Keempat / Rekomendasi Strategis}**: {Narasi penguatan strategi pelaksanaan, rekomendasi tindak lanjut, dan kolaborasi pemangku kepentingan}.
- Format 4 (Klausul Tautan Digital / Email): Jika ada link cloud atau email, tambahkan: "Seluruh data dukung dan kelengkapan berkas sebagaimana dimaksud dapat diakses/diunduh melalui tautan berikut: {URL_Link}."
- Format 5 (Narasi Permohonan Koordinasi Lintas Unit / PIC): Memuat mekanisme penyampaian usulan nama PIC/perwakilan unit kerja.

ATURAN 4 VARIASI PARAGRAF PENUTUP (nota_penutup):
Pilih variasi yang sesuai dengan hirarki penerima:
- Variasi 1 (Horizontal Eselon II: Kepala Biro / Inspektur / Sesditjen / Kapusdatin): "Demikian kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."
- Variasi 2 (Vertikal ke Atas: Sekretaris Jenderal): "Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian dan kerja sama Bapak Sekjen, kami ucapkan terima kasih." (Atau khusus permohonan tanda tangan Keputusan Sekjen: "Demikian kami sampaikan. Apabila Bapak Sekretaris Jenderal tidak berpendapat lain, mohon perkenan Bapak Sekretaris Jenderal untuk menandatangani Keputusan Sekretaris Jenderal dimaksud. Atas perhatian dan perkenan Bapak Sekretaris Jenderal, kami ucapkan terima kasih.")
- Variasi 3 (Permohonan Persetujuan / Fasilitasi MCU & PSP BMN): "Demikian permohonan ini kami sampaikan. Atas perkenan dan arahan Bapak/Ibu, kami ucapkan terima kasih."
- Variasi 4 (Permohonan Mendesak / Distribusi Cepat Bukti Potong Pajak): "Kami mohon agar dokumen tersebut dapat segera disampaikan kepada kami untuk selanjutnya didistribusikan kepada pegawai yang bersangkutan. Demikian kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih."`;

      const parts: any[] = [{ text: prompt }];
      if (fileAttachment && fileAttachment.base64) {
        parts.push({
          inlineData: {
            mimeType: fileAttachment.mimeType || 'application/pdf',
            data: fileAttachment.base64,
          },
        });
      }
      if (cleanText) {
        parts.push({ text: `Dokumen Acuan:\n"""\n${cleanText}\n"""` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nota_hal: { type: Type.STRING },
              nota_kepada: { type: Type.STRING },
              nota_dari: { type: Type.STRING },
              nota_sifat: { type: Type.STRING },
              nota_lampiran: { type: Type.STRING },
              nota_pembuka: { type: Type.STRING },
              nota_isi: { type: Type.STRING },
              nota_penutup: { type: Type.STRING },
              rekomendasi_kode_klasifikasi: { type: Type.STRING },
            },
            required: ['nota_hal', 'nota_kepada', 'nota_pembuka', 'nota_isi', 'nota_penutup'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawNotaIsi = parsed.nota_isi || '';
      const isBulletOrNumbered = /^\s*(\d+\.|[a-zA-Z]\.|[\-\*•])/m.test(rawNotaIsi);
      const cleanNotaIsi = isBulletOrNumbered ? formatNumberedPoints(rawNotaIsi) : rawNotaIsi.trim();

      return {
        nota_hal: parsed.nota_hal || 'Penyampaian Laporan dan Rekomendasi Kebijakan',
        nota_kepada: parsed.nota_kepada || 'Sekretaris Jenderal',
        nota_dari: parsed.nota_dari || 'Kepala Pusat Kebijakan Strategis',
        nota_sifat: parsed.nota_sifat || 'Biasa',
        nota_lampiran: parsed.nota_lampiran || 'Satu berkas',
        nota_pembuka: (parsed.nota_pembuka || '').trim(),
        nota_isi: cleanNotaIsi,
        nota_penutup:
          (parsed.nota_penutup || '').trim() ||
          'Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian dan kerja sama Bapak Sekjen, kami ucapkan terima kasih.',
        rekomendasi_kode_klasifikasi: parsed.rekomendasi_kode_klasifikasi || 'PR.01.01',
      };
    } catch (err) {
      console.warn('Gemini screening Nota Dinas failed, using heuristic fallback:', err);
    }
  }

  // Smart Local NLP Fallback (Tanpa API Key)
  return smartLocalExtractNotaDinas(cleanText || textOrPrompt, fileAttachment?.name, userPrompt);
}

/**
 * Smart Heuristic & NLP Extractor for Indonesian Official Nota Dinas (Pusaka Komdigi).
 * Delegasikan langsung ke smartLocalExtractNotaDinas agar 100% mengikuti Panduan Struktur Nota Dinas.
 */
export function deepHeuristicExtractNotaDinas(text: string, fileName?: string): EkstraksiNotaDinas {
  return smartLocalExtractNotaDinas(text, fileName);
}
