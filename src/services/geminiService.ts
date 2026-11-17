import { GoogleGenAI, Type } from '@google/genai';
import {
  EkstraksiUndangan,
  EkstraksiSuratUndangan,
  EkstraksiNotaDinas,
  GeneratedLampiranDraft,
} from '../types';
import {
  smartLocalExtractSuratTugas,
  smartLocalExtractSuratUndangan,
  smartLocalExtractNotaDinas,
} from './localDocumentIntelligence';
import { parseTableFromText, serializeTableToHtml, normalizeTableModel } from './tableService';

/**
 * Normalisasi array lampiran_generated dari Gemini AI agar tabel HTML selalu rapi, valid,
 * dan langsung kompatibel dengan DocumentPreviewTable & docxService.
 */
function normalizeLampiranGenerated(rawList: any): GeneratedLampiranDraft[] | undefined {
  if (!Array.isArray(rawList) || rawList.length === 0) return undefined;
  const out: GeneratedLampiranDraft[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    let isi = typeof item.isi === 'string' ? item.isi.trim() : '';
    const tipeKonten = item.tipe_konten === 'tabel' || item.tipe_konten === 'daftar_undangan' ? item.tipe_konten : 'teks';
    if (tipeKonten === 'tabel' || isi.includes('<table') || (isi.includes('|') && isi.includes('\n'))) {
      const parsed = parseTableFromText(isi);
      if (parsed) {
        isi = serializeTableToHtml(normalizeTableModel(parsed));
      }
    }
    if (!isi && !item.include_internal_pusaka) continue;
    out.push({
      judul: (item.judul || 'LAMPIRAN').trim(),
      sub_judul: item.sub_judul ? String(item.sub_judul).trim() : undefined,
      tipe_konten: tipeKonten,
      isi,
      include_internal_pusaka: Boolean(item.include_internal_pusaka),
    });
  }
  return out.length > 0 ? out : undefined;
}

const LAMPIRAN_GENERATED_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      judul: { type: Type.STRING },
      sub_judul: { type: Type.STRING },
      tipe_konten: { type: Type.STRING },
      isi: { type: Type.STRING },
      include_internal_pusaka: { type: Type.BOOLEAN },
    },
    required: ['judul', 'tipe_konten', 'isi'],
  },
};

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
 * Inisialisasi client GoogleGenAI menggunakan API Key dari file .env.
 * Mendukung baik Gemini API Key standar (AIza...) maupun Google AI / Cloud key (AQ....).
 */
function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey: apiKey.trim() });
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
 * Transkrip cepat seluruh teks dari PDF pindaian atau gambar menggunakan Gemini Multimodal AI
 * agar kolom "Teks Transkrip Dokumen" langsung terisi akurat.
 */
export async function transcribeDocumentWithGemini(
  fileAttachment: FileAttachment,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = apiKeyOverride?.trim() || getStoredGeminiApiKey()?.trim() || '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !fileAttachment?.base64) {
    return '';
  }
  try {
    const ai = createGeminiClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transkripsikan seluruh isi teks penting, judul, nomor surat, tanggal, angka statistik, poin-poin temuan, dan rekomendasi dari dokumen terlampir secara lengkap, rapi, dan akurat dalam bahasa aslinya (tanpa komentar tambahan).',
            },
            {
              inlineData: {
                mimeType: fileAttachment.mimeType || 'application/pdf',
                data: fileAttachment.base64,
              },
            },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return (response.text || '').trim();
  } catch (err) {
    console.warn('Gemini document transcription failed:', err);
    return '';
  }
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

  const cleanText = (textOrPrompt || '')
    .replace(/^\[(?:Dokumen|Gambar)[^\]]*\]\s*/i, '')
    .trim();

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
11. Rekomendasi Klausul Naskah Dinas Resmi Komdigi (DILARANG keras menulis placeholder seperti "[Instansi]", "[Nomor]", "[Tanggal]", atau "Tidak diketahui"):
    - narasi_menimbang: Konsideran Menimbang resmi Surat Tugas yang mengaitkan urgensi acara dengan tugas fungsi Komdigi (diawali "Bahwa dalam rangka...").
    - narasi_dasar: Jika ada surat undangan acuan, kutip resmi: "Surat Undangan <Nama Instansi> Nomor : <Nomor> tanggal <Tanggal>.". Jika hanya dari perintah/prompt pengguna tanpa surat undangan, tulis: "Arahan pimpinan terkait pelaksanaan kegiatan <Nama Kegiatan>."
    - narasi_untuk: Diktum Untuk resmi yang merinci tugas pegawai, nama acara, tanggal/waktu pelaksanaan, dan lokasi/kota.
12. Daftar Pegawai yang Ditugaskan (pegawai_nama_list):
    - Jika pengguna menyebutkan nama-nama pegawai pada perintah/prompt atau dokumen (misal: "5 pegawai dengan nama a, b, c, d dan e" atau "Oki Suryowahono, Dyah Purwaningrum"), ekstrak seluruh nama pegawai tersebut ke dalam array string pegawai_nama_list (misal: ["a", "b", "c", "d", "e"]). Jika tidak disebutkan nama pegawai, kosongkan array [].
13. Lampiran Tambahan (lampiran_generated):
    - Jika pengguna meminta dibuatkan lampiran tambahan selain daftar pegawai (misalnya jadwal/rundown acara atau catatan lampiran), buatkan pada array lampiran_generated (tipe_konten: "tabel" dengan tag HTML <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table> atau "teks"). Jika tidak diminta, kosongkan [].`;

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

    // Gunakan kandidat model aktif dengan fallback otomatis bila salah satu mengalami lonjakan trafik (503)
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
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
                pegawai_nama_list: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                lampiran_generated: LAMPIRAN_GENERATED_SCHEMA,
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
          const rawNomor = (parsed.nomor_surat_undangan || '').trim();
          const nomorSurat = !rawNomor || /tidak diketahui|undangan dari pengguna|\[nomor\]/i.test(rawNomor) ? '-' : rawNomor;
          const rawInstansi = (parsed.instansi_pengundang || '').trim();
          const instansi = !rawInstansi || /tidak diketahui|\[instansi\]/i.test(rawInstansi) ? 'Pusat Kebijakan Strategis' : rawInstansi;
          const rawTglSurat = (parsed.tanggal_surat_undangan || '').trim();
          const tglSurat = !rawTglSurat || /tidak diketahui|\[tanggal\]/i.test(rawTglSurat) ? new Date().toISOString().split('T')[0] : rawTglSurat;
          const tglMulai = parsed.tanggal_mulai || new Date().toISOString().split('T')[0];
          const tglSelesai = parsed.tanggal_selesai || tglMulai;
          const rawWaktu = (parsed.waktu_pelaksanaan || '').trim();
          const waktu = !rawWaktu || /tidak diketahui/i.test(rawWaktu) ? '09.00 WIB s.d. Selesai' : rawWaktu;
          const lokasi = parsed.lokasi || 'Tempat Penyelenggara';
          const kota = parsed.kota_kegiatan || 'Jakarta Pusat';
          // Gunakan perihal_ringkasan jika tersedia, lalu perihal_undangan, lalu topik, lalu nama acara
          const perihal = parsed.perihal_ringkasan || parsed.perihal_undangan || parsed.topik || `Menghadiri ${namaAcara} di ${lokasi}`;
          const kriteriaPeserta = parsed.kriteria_peserta || 'Pegawai yang membidangi substansi kegiatan';
          const cleanNarasiDasar =
            parsed.narasi_dasar && !/\[(?:Instansi|Nomor|Tanggal)\]/i.test(parsed.narasi_dasar)
              ? parsed.narasi_dasar
              : nomorSurat !== '-'
              ? `Surat Undangan ${instansi} Nomor : ${nomorSurat} tanggal ${tglSurat}.`
              : `Arahan pimpinan perihal pelaksanaan kegiatan ${namaAcara}.`;

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
            narasi_dasar: cleanNarasiDasar,
            narasi_untuk:
              parsed.narasi_untuk ||
              `Mengikuti kegiatan ${namaAcara} yang dilaksanakan pada ${waktu} bertempat di ${lokasi}, ${kota}.`,
            keterangan_tambahan: `Analisa Mendalam Gemini AI (${modelName})`,
            pegawai_nama_list: Array.isArray(parsed.pegawai_nama_list)
              ? parsed.pegawai_nama_list.map((s: any) => String(s).trim()).filter(Boolean)
              : undefined,
            lampiran_generated: normalizeLampiranGenerated(parsed.lampiran_generated),
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
    return smartLocalExtractSuratTugas(cleanText || textOrPrompt, fileAttachment?.name, userPrompt);
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
  const cleanText = (textOrPrompt || '')
    .replace(/^\[(?:Dokumen|Gambar)[^\]]*\]\s*/i, '')
    .trim();

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = createGeminiClient(apiKey);
      const prompt = `Anda adalah Analis Tata Naskah Dinas Kementerian Komunikasi dan Digital RI (PUSAKA).
Telaah dokumen acuan berikut dan/atau perintah pengguna untuk menyusun SURAT UNDANGAN RESMI:

${userPrompt ? `INSTRUKSI/PERINTAH KHUSUS DARI PENGGUNA (PRIORITASKAN & PATUHI INI):\n"""\n${userPrompt}\n"""\n` : ''}

1. Perihal / Hal Undangan (undangan_hal): Judul/perihal surat undangan yang ringkas dan jelas (misal: "Undangan Event Tahunan Rakyat").
2. Agenda Pembahasan (undangan_agenda): Poin-poin atau uraian agenda acara/rapat yang akan dilaksanakan.
3. Hari dan Tanggal Pelaksanaan (hari_tanggal_pelaksanaan): Format Indonesia lengkap, contoh "Kamis, 12 November ${new Date().getFullYear()}". Jika pengguna tidak menyebut tahun, gunakan tahun ${new Date().getFullYear()}.
4. Waktu Pelaksanaan (undangan_waktu): Format jam resmi Indonesia, contoh "19.00 WIB s.d. selesai" (jika jam 7 malam = 19.00 WIB).
5. Tipe Tempat (undangan_tipe_tempat): "hybrid", "offline", atau "online".
6. Tempat Fisik (undangan_tempat_offline): Ruang rapat, nama gedung, dan alamat jika ada (misal: "Balai Kota DKI Jakarta, Jl. Medan Merdeka Selatan No. 8-9, Jakarta Pusat").
7. Tempat Daring (undangan_tempat_online): Link video conference jika ada/hybrid/online.
8. Paragraf Pengantar/Pembuka (undangan_pembuka): Paragraf pengantar resmi tata naskah dinas Komdigi (diawali "Dalam rangka..." atau "Menindaklanjuti...", TANPA kata "Dengan hormat,").
9. Daftar Pihak yang Diundang (undangan_kepada): Jika tamu undangan > 2 pihak/satker atau ada lampiran daftar undangan, isi "(Daftar Terlampir)\\ndi Tempat". Jika hanya 1-2 pejabat spesifik tanpa lampiran, tulis jabatannya.
10. Sifat Surat (undangan_sifat): Pilih tepat satu dari "Biasa", "Segera", atau "Sangat Segera".
11. Keterangan Lampiran (undangan_lampiran): "-" jika tidak ada lampiran, atau "1 (satu) berkas" / "2 (dua) berkas" sesuai jumlah lampiran pada lampiran_generated.
12. Lampiran Otomatis (lampiran_generated):
   - Jika pengguna menyebutkan daftar tamu undangan beberapa instansi/satker/internal (contoh: "tamu undangannya Sekjen, BPSDM, dan seluruh internal Pusaka"), buatkan 1 item lampiran dengan:
     * judul: "DAFTAR UNDANGAN"
     * sub_judul: Nama acara/kegiatan
     * tipe_konten: "daftar_undangan"
     * include_internal_pusaka: true (jika pengguna menyebut seluruh/internal Pusaka atau Pusat Kebijakan Strategis)
     * isi: Daftar pihak eksternal terstruktur dengan huruf kapital tebal, contoh:
       "**A. Sekretariat Jenderal**\\n  1. Sekretaris Jenderal Kementerian Komunikasi dan Digital\\n\\n**B. Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital (BPSDM)**\\n  1. Kepala Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital"
   - Jika pengguna meminta dibuatkan rundown / susunan acara / jadwal pada lampiran (contoh: "rundownnya tolong buatkan juga pada lampirannya"), buatkan 1 item lampiran dengan:
     * judul: "SUSUNAN ACARA / RUNDOWN KEGIATAN"
     * sub_judul: Nama acara beserta hari/tanggalnya
     * tipe_konten: "tabel"
     * isi: Tabel HTML lengkap yang rapi dengan kolom <thead><tr><th>No</th><th>Waktu</th><th>Kegiatan</th><th>Keterangan / Pengisi</th></tr></thead><tbody>...</tbody> berisi susunan acara yang realistis dan sesuai dengan jam mulai & jenis acara yang diminta pengguna!`;

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

      const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
      let parsed: any = null;
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
                  undangan_lampiran: { type: Type.STRING },
                  rekomendasi_kode_klasifikasi: { type: Type.STRING },
                  lampiran_generated: LAMPIRAN_GENERATED_SCHEMA,
                },
                required: ['undangan_hal', 'undangan_agenda', 'hari_tanggal_pelaksanaan', 'undangan_waktu'],
              },
            },
          });
          if (response.text) {
            parsed = JSON.parse(response.text);
            break;
          }
        } catch (modelErr) {
          console.warn(`Undangan Gemini model ${modelName} failed, trying fallback...`, modelErr);
        }
      }
      if (!parsed) throw new Error('Semua model Gemini Undangan gagal merespons');
      const genLampiran = normalizeLampiranGenerated(parsed.lampiran_generated);
      const lampCount = genLampiran ? genLampiran.length : 0;
      const defaultLampStr =
        lampCount === 0 ? '-' : `${lampCount} (${lampCount === 1 ? 'satu' : lampCount === 2 ? 'dua' : lampCount}) berkas`;

      return {
        undangan_hal: parsed.undangan_hal || 'Undangan Rapat Pembahasan',
        undangan_agenda: parsed.undangan_agenda || 'Pembahasan agenda strategis dan asistensi substansi kebijakan.',
        hari_tanggal_pelaksanaan: parsed.hari_tanggal_pelaksanaan || 'Senin, 27 Oktober 2026',
        undangan_waktu: parsed.undangan_waktu || '09.00 WIB s.d. selesai',
        undangan_tipe_tempat: (parsed.undangan_tipe_tempat === 'online' || parsed.undangan_tipe_tempat === 'offline') ? parsed.undangan_tipe_tempat : 'hybrid',
        undangan_tempat_offline: parsed.undangan_tempat_offline || 'Ruang Rapat Pusat Kebijakan Strategis, Gd Sapta Pesona Lt. 5, Jl. Medan Merdeka Barat No. 17-19, Jakarta Pusat',
        undangan_tempat_online: parsed.undangan_tempat_online || 'https://s.komdigi.go.id/zoom-rapat',
        undangan_pembuka: parsed.undangan_pembuka || 'Dalam rangka mendukung pelaksanaan tugas dan fungsi Pusat Kebijakan Strategis, bersama ini kami bermaksud menyelenggarakan rapat yang akan diselenggarakan pada:',
        undangan_kepada: parsed.undangan_kepada || '(Daftar Terlampir)\ndi Tempat',
        undangan_sifat:
          parsed.undangan_sifat === 'Segera' || parsed.undangan_sifat === 'Sangat Segera'
            ? parsed.undangan_sifat
            : 'Biasa',
        undangan_lampiran: parsed.undangan_lampiran || defaultLampStr,
        rekomendasi_kode_klasifikasi: parsed.rekomendasi_kode_klasifikasi || 'PR.01.01',
        lampiran_generated: genLampiran,
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
  const cleanText = (textOrPrompt || '')
    .replace(/^\[(?:Dokumen|Gambar)[^\]]*\]\s*/i, '')
    .trim();

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = createGeminiClient(apiKey);
      const prompt = `Anda adalah Asisten Pembuat Naskah Dinas Resmi pada Pusat Kebijakan Strategis (Kode Unit: SJ.9), Sekretariat Jenderal, Kementerian Komunikasi dan Digital RI.
Tugas Anda adalah menelaah dokumen acuan (laporan, kajian, policy brief, surat masuk, atau nota dinas) dan/atau perintah pengguna secara SANGAT MENDALAM, AKURAT, dan menyusun draf **NOTA DINAS** yang 100% patuh pada "Panduan Lengkap Struktur, Pola Kalimat, Tipologi, dan Otomatisasi Dokumen Nota Dinas PUSAKA Komdigi".

${userPrompt ? `INSTRUKSI/PERINTAH KHUSUS DARI PENGGUNA (PRIORITASKAN & PATUHI INI):\n"""\n${userPrompt}\n"""\n` : ''}

ATURAN GAYA BAHASA & SUDUT PANDANG WAJIB:
- Gunakan sudut pandang institusional kata ganti jamak ("kami"), DILARANG menggunakan kata "saya".
- Bahasa baku tata naskah dinas pemerintah: lugas, objektif, santun, dan selalu diawali dasar pijakan hukum/administratif.
- JANGAN mengulang paragraf pembuka atau penutup di dalam field nota_isi.

1. PEMETAAN 5 TIPOLOGI MASTER, PENERIMA (nota_kepada), & KODE KLASIFIKASI:
   ATURAN MUTLAK nota_kepada: Selalu tulis NAMA JABATAN RESMI penerima (TANPA nama orang pribadi). Jika >3 jabatan, tulis "(Daftar Terlampir)".
   - TIPOLOGI 1 (ND_SDM - Administrasi & Mutasi Kepegawaian):
     * Kenaikan Gaji Berkala / KGB, Penyesuaian Gaji Pokok & Tukin -> nota_kepada: "Kepala Biro Keuangan dan Barang Milik Negara", kode: "KP.01.03" atau "KP.01.04".
     * Usulan Kenaikan Pangkat -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi", kode: "KP.04.04".
     * Uji Kompetensi & Fasilitasi Pembiayaan Ujikom JF -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi", kode: "KP.06.01".
     * Pemberhentian JF karena Tugas Belajar -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi", kode: "KP.04.07".
     * Pembukaan Akses E-Kinerja SKP -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi", kode: "KP.06.06".
     * Usulan Beasiswa LPDP / Diklat / Pembaruan SK / SPMT -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi", kode: "KP.01.06" atau "KP.01.01".
   - TIPOLOGI 2 (ND_KEBIJAKAN - Laporan Eksekutif, Telaah Kebijakan, Policy Brief, Hasil Kajian/Reviu Regulasi):
     * Laporan Progres Quickwin, Konsep Jawaban/Matriks Tanya Jawab Menteri, Policy Brief, Reviu Rancangan Peraturan (RPM/PP/UU) -> nota_kepada: "Sekretaris Jenderal", kode: "PR.01.02" atau "PR.02.01".
     * Telaah Analisis Isu Strategis / Reviu Singkat Isu Publik -> nota_kepada: "Sekretaris Jenderal" (atau "Direktur Jenderal Komunikasi Publik dan Media" jika terkait Narasi Tunggal/GPR), kode: "PR.01.01" atau "PR.02.01".
     * Permohonan Penandatanganan Keputusan Sekjen -> nota_kepada: "Sekretaris Jenderal", kode: "HK.01.06".
   - TIPOLOGI 3 (ND_ANGGARAN - Perencanaan, Revisi & Pengawasan Anggaran):
     * Usulan Rincian Output (RO) / Revisi POK/DIPA / Pergeseran Belanja -> nota_kepada: "Kepala Biro Perencanaan", kode: "KU.01.01" atau "KU.01.02".
     * Permohonan Reviu Anggaran & Tindak Lanjut Hasil Reviu Itjen -> nota_kepada: "Inspektur IV", kode: "PW.01.04" atau "PW.04.04".
     * Persetujuan Tambahan Pagu Setjen -> nota_kepada: "Sekretaris Jenderal", kode: "PW.01.04".
     * Tanggapan Temuan BPK & Bukti Potong Pajak PPh 21 (1721-A2) -> nota_kepada: "Kepala Biro Keuangan dan Barang Milik Negara", kode: "KU.01.01".
   - TIPOLOGI 4 (ND_KOORDINASI - Koordinasi Tim & Kepatuhan Organisasi):
     * Usulan Nama PIC Tim / Anggota Tim -> nota_kepada: "(Daftar Terlampir)" atau unit pengundang, kode: "PR.01.02" atau "PW.02.01".
     * IDP Satker / Pakta Integritas ASN / Sertifikat PPK -> nota_kepada: "Kepala Biro Sumber Daya Manusia dan Organisasi" / "Kepala Biro Umum", kode: "KP.05.01" / "KP.01.06" / "KP.01.01".
   - TIPOLOGI 5 (ND_FASILITAS - Fasilitas Kerja, TI & BMN):
     * Akun Email Official / Layanan TI -> nota_kepada: "Kepala Pusat Data dan Sarana Informatika", kode: "DT.01.01".
     * Pemanfaatan Anggaran Medical Check-Up (MCU) -> nota_kepada: "Sekretaris Jenderal", kode: "KP.07.01".
     * Penetapan Status Penggunaan (PSP) BMN -> nota_kepada: "Kepala Biro Umum", kode: "PL.01.02".

2. ATURAN METADATA LAINNYA:
   - nota_dari: Selalu "Kepala Pusat Kebijakan Strategis".
   - nota_hal: Ringkas, padat, Title Case, WAJIB diawali kata benda verbal baku: "Penyampaian ...", "Permohonan ...", "Pengajuan ...", atau "Usulan ...".
   - nota_sifat: "Biasa" (default), "Segera" (tanggapan BPK/reviu mendesak/pajak), atau "Rahasia" (laporan strategis tertentu/IDP).
   - nota_lampiran: "Satu berkas" (jika ada lampiran/mengutip berkas laporan) atau "-".

3. 6 POLA BAKU PARAGRAF PEMBUKA (nota_pembuka) — Satu kalimat majemuk lengkap (Anak Kalimat Dasar/Alasan + ", " + Induk Kalimat Tindakan Utama):
   - Pola 1 (Tindak Lanjut ND/Surat Masuk): "Menindaklanjuti Nota Dinas {Jabatan_Pengirim_Asal} Nomor: {Nomor_ND_Asal} tanggal {Tanggal_ND_Asal} perihal {Perihal_ND_Asal}, bersama ini kami sampaikan/mengajukan permohonan {Objek_Utama}..."
   - Pola 2 (Tindak Lanjut SK Menteri/Regulasi): "Menindaklanjuti Keputusan Menteri Komunikasi dan Digital Republik Indonesia Nomor {Nomor_SK} tanggal {Tanggal_SK} tentang {Judul_SK}, bersama ini kami mengajukan permohonan untuk dilakukan {Nama_Tindakan} TMT {Tanggal_TMT} bagi pegawai yang telah ditetapkan dalam jabatan {Nama_Jabatan}, dengan informasi pegawai sebagai berikut:"
   - Pola 3 (Mandat Arahan Pimpinan / Rapim / Telaah Laporan/Kajian): "Berdasarkan {arahan Ibu Menteri / hasil Rapat Pimpinan (RAPIM) / pelaksanaan telaah strategis} terkait {Topik_Bahasan}, bersama ini dengan hormat kami sampaikan {Dokumen_Output} sebagai berikut:"
   - Pola 4 (Syarat Administratif Berkala - KGB/KP/Revisi): "Dengan telah terpenuhinya syarat kenaikan gaji berkala, bersama ini kami sampaikan informasi untuk dilakukan proses Kenaikan Gaji Berkala (KGB) TMT {TMT} untuk pegawai atas nama sebagai berikut:" / "Sehubungan dengan telah dipenuhinya persyaratan administratif dan kinerja pegawai..., bersama ini kami mengusulkan..."
   - Pola 5 (Tujuan Fungsional & Tata Kelola): "Dalam rangka {Tujuan_Kedinasan}, bersama ini kami mengajukan permohonan / mengusulkan {Bentuk_Permohonan} dengan rincian sebagai berikut:"
   - Pola 6 (Permohonan Teknis Langsung): "Bersama ini kami mengajukan permohonan {Bentuk_Permohonan_Teknis} dikarenakan {Alasan_Teknis} bagi pegawai atas nama:"

4. 5 FORMAT PENYAJIAN SUBSTANSI ISI (nota_isi):
   - Format 1 (Blok Atribut Identitas Pegawai - Khusus 1 orang pegawai pada KGB/KP/Ujikom/Tukin/E-Kinerja):
     Tulis tiap field pada baris tersendiri:
     Nama : {Nama Lengkap}
     NIP : {NIP}
     Pangkat/Gol : {Pangkat/Golongan} (atau "Pangkat saat ini" & "Pangkat yang dituju" untuk KP)
     Jabatan : {Jabatan} (atau "Jabatan Baru" untuk Tukin/SPMT; atau "Jabatan saat ini" & "Jabatan yang dituju" untuk Ujikom)
     Unit Kerja : Pusat Kebijakan Strategis
   - Format 2 (Rekapitulasi Kolektif / Rincian Anggaran & Matriks Reviu): Jika >1 pegawai atau rincian angka anggaran/RO.
   - Format 3 (Poin Narasi Eksekutif — untuk Dokumen Laporan, Kajian, Policy Brief, Evaluasi, Reviu Regulasi):
     Jika ada dokumen laporan terlampir, ekstrak secara MENDALAM seluruh temuan nyata, angka statistik/kuantitatif, pasal/regulasi yang dibahas, kendala, dan rekomendasi spesifik dari dokumen!
     Jika HANYA dari perintah/prompt pengguna tanpa dokumen lampiran, JANGAN mengarang angka fiktif atau nama proyek fiktif seperti "Aplikasi Y" / "Modul X" — susunlah poin-poin substantif yang formal dan relevan sesuai topik perintah pengguna.
     Sajikan dalam 3 s.d. 5 poin bernomor angka Arab (1., 2., 3., ...) dengan format persis:
     1. **{Judul_Aspek_Kajian_atau_Temuan}**: {Narasi temuan utama, angka capaian kuantitatif/fakta spesifik dari dokumen, serta dampak/rekomendasi tindak lanjut}.
     2. **{Judul_Aspek_Kedua}**: {Narasi temuan spesifik dari dokumen...}.
   - Format 4 (Klausul Tautan Digital / Email): Jika dokumen memuat URL Google Drive/shortlink atau email, tambahkan di akhir: "Seluruh data dukung dan kelengkapan berkas sebagaimana dimaksud dapat diakses/diunduh melalui tautan berikut: {URL}."
   - Format 5 (Permintaan PIC Koordinasi Lintas Unit): Sertakan mekanisme penyampaian usulan nama PIC dan batas waktu.

5. 4 VARIASI BAKU PARAGRAF PENUTUP (nota_penutup):
   - Tipe 1 (Horizontal ke Kepala Biro / Inspektur / Sesditjen / Kapusdatin): "Demikian kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."
   - Tipe 2 (Vertikal ke Sekretaris Jenderal — laporan/telaah/policy brief): "Demikian disampaikan, mohon arahan Bapak Sekjen lebih lanjut. Atas perhatian dan kerja sama Bapak Sekjen, kami ucapkan terima kasih." (Khusus tanda tangan SK Sekjen: "Demikian kami sampaikan. Apabila Bapak Sekretaris Jenderal tidak berpendapat lain, mohon perkenan Bapak Sekretaris Jenderal untuk menandatangani Keputusan Sekretaris Jenderal dimaksud. Atas perhatian dan perkenan Bapak Sekretaris Jenderal, kami ucapkan terima kasih.")
   - Tipe 3 (Permohonan Persetujuan Anggaran / MCU ke Sekjen / PSP BMN): "Demikian permohonan ini kami sampaikan. Atas perkenan dan arahan Bapak/Ibu, kami ucapkan terima kasih."
   - Tipe 4 (Mendesak / Distribusi Cepat Bukti Potong Pajak): "Kami mohon agar dokumen tersebut dapat segera disampaikan kepada kami untuk selanjutnya didistribusikan kepada pegawai yang bersangkutan. Demikian kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih."

6. LAMPIRAN OTOMATIS NOTA DINAS (lampiran_generated):
   - Jika pengguna meminta dibuatkan lampiran (misal matriks tindak lanjut, tabel rincian anggaran, daftar pegawai kolektif, jadwal, atau dokumen teks lampiran), buatkan pada array lampiran_generated (tipe_konten: "tabel" dengan tag HTML <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table> atau "teks"). Jika tidak diminta lampiran, kosongkan [].`;

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

      const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
      let parsed: any = null;
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
                  nota_hal: { type: Type.STRING },
                  nota_kepada: { type: Type.STRING },
                  nota_dari: { type: Type.STRING },
                  nota_sifat: { type: Type.STRING },
                  nota_lampiran: { type: Type.STRING },
                  nota_pembuka: { type: Type.STRING },
                  nota_isi: { type: Type.STRING },
                  nota_penutup: { type: Type.STRING },
                  rekomendasi_kode_klasifikasi: { type: Type.STRING },
                  lampiran_generated: LAMPIRAN_GENERATED_SCHEMA,
                },
                required: ['nota_hal', 'nota_kepada', 'nota_pembuka', 'nota_isi', 'nota_penutup'],
              },
            },
          });
          if (response.text) {
            parsed = JSON.parse(response.text);
            break;
          }
        } catch (modelErr) {
          console.warn(`Nota Dinas Gemini model ${modelName} failed, trying fallback...`, modelErr);
        }
      }

      if (parsed) {
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
          rekomendasi_kode_klasifikasi: parsed.rekomendasi_kode_klasifikasi || 'PR.01.02',
          lampiran_generated: normalizeLampiranGenerated(parsed.lampiran_generated),
        };
      }
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
