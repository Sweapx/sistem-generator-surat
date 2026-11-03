import dictionaryRaw from '../data/dictionaryKlasifikasi.json';

interface DictionaryEntry {
  kode: string;
  kategori: 'FASILITATIF' | 'SUBSTANTIF';
  hirarki?: string;
  tersier_nama?: string;
  keywords?: string[];
  contoh_kasus?: string;
}

export interface KlasifikasiSuggestion {
  kode: string;
  kategori: 'FASILITATIF' | 'SUBSTANTIF';
  uraian: string;
  hirarki: string;
  confidence: number; // 0..1
  matched: string[];
}

const DICTIONARY = dictionaryRaw as DictionaryEntry[];

const normalize = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Seberapa banyak entri yang memuat sebuah keyword (untuk meredam kata yang terlalu umum)
const KEYWORD_DF: Record<string, number> = (() => {
  const df: Record<string, number> = {};
  for (const e of DICTIONARY) {
    const seen = new Set((e.keywords || []).map(normalize));
    seen.forEach((k) => {
      if (k) df[k] = (df[k] || 0) + 1;
    });
  }
  return df;
})();

const countOccurrences = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
};

/**
 * Menyarankan kode klasifikasi berdasarkan isi nota dinas.
 * Bobot: perihal 3x, isi 1x; frasa lebih panjang & lebih spesifik (jarang muncul di entri lain) bernilai lebih tinggi.
 * Hanya bersifat saran — pengguna tetap bebas memilih kode lain.
 */
export function suggestKlasifikasi(perihal: string, isi: string, limit = 3): KlasifikasiSuggestion[] {
  const p = ` ${normalize(perihal)} `;
  const body = ` ${normalize(isi)} `;
  if (p.trim().length + body.trim().length < 8) return [];

  const N = DICTIONARY.length;
  const scored: { entry: DictionaryEntry; score: number; matched: string[] }[] = [];

  for (const entry of DICTIONARY) {
    let score = 0;
    const matched: string[] = [];
    const keywords = [...(entry.keywords || [])];
    if (entry.tersier_nama) keywords.push(entry.tersier_nama);

    for (const kwRaw of keywords) {
      const kw = normalize(kwRaw);
      if (!kw || kw.length < 4) continue;
      const needle = ` ${kw} `;
      const inPerihal = countOccurrences(p, needle);
      const inIsi = countOccurrences(body, needle);
      if (inPerihal + inIsi === 0) continue;

      const wordCount = kw.split(' ').length;
      const rarity = Math.log(1 + N / (KEYWORD_DF[kw] || 1));
      const weight = wordCount * rarity;
      // Batasi pengaruh pengulangan agar satu kata tidak mendominasi
      score += weight * (3 * Math.min(inPerihal, 2) + Math.min(inIsi, 5));
      matched.push(kwRaw);
    }
    if (score > 0) scored.push({ entry, score, matched });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);
  if (top.length === 0) return [];

  const best = top[0].score;
  // Confidence: ditentukan oleh kekuatan absolut (jenuh pada ~40) dan kedekatan dengan skor terbaik
  const absStrength = Math.min(1, best / 40);

  return top.map((t) => ({
    kode: t.entry.kode,
    kategori: t.entry.kategori,
    uraian: t.entry.tersier_nama || t.entry.kode,
    hirarki: t.entry.hirarki || '',
    confidence: Math.max(0.05, Math.min(0.99, (t.score / best) * absStrength)),
    matched: Array.from(new Set(t.matched)).slice(0, 4),
  }));
}

