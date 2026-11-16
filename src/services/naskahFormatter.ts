/**
 * Utilitas Pemformatan dan Paginasi Tata Naskah Dinas (PUSAKA Komdigi)
 * Memastikan penomoran, sub-poin (a., b., c.), dan pemisahan halaman A4 berjalan rapi
 * baik untuk teks yang dihasilkan AI maupun ketikan/manual kalimat panjang dari pengguna.
 */

import { stripMarkup } from './richText';

/**
 * Merapikan teks berpoin-poin (nota_isi, telaah, rekomendasi) agar memiliki baris baru (\n)
 * dan indentasi yang tepat, bukan tersambung menjadi satu paragraf rapat.
 * Tetap menjaga keutuhan singkatan seperti s.d., a.n., u.b., gelar, dan tautan URL.
 */
export function formatNumberedPoints(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // Lindungi singkatan umum (s.d., a.n., u.b., u.p., d.a., q.q.) agar tidak terpecah
  const abbrPlaceholders: Array<[RegExp, string]> = [
    [/\bs\.\s*d\./gi, '__ABBR_SD__'],
    [/\ba\.\s*n\./gi, '__ABBR_AN__'],
    [/\bu\.\s*b\./gi, '__ABBR_UB__'],
    [/\bu\.\s*p\./gi, '__ABBR_UP__'],
    [/\bd\.\s*a\./gi, '__ABBR_DA__'],
    [/\bq\.\s*q\./gi, '__ABBR_QQ__'],
  ];
  for (const [rx, token] of abbrPlaceholders) {
    text = text.replace(rx, token);
  }

  // 1. Tangani jika angka poin utama (1., 2., 3., dst) menempel setelah tanda titik, kurung tutup, petik, titik koma, atau titik dua
  text = text.replace(/([.:\)\"”;])\s*(\d+\.)\s+(?=[A-Z**(])/g, '$1\n\n$2 ');
  text = text.replace(/([.:\)\"”;])\s+(\d+\.)\s+/g, '$1\n\n$2 ');

  // 2. Tangani jika sub-poin huruf (a., b., c., dst) menempel setelah titik dua, titik, petik, atau kurung
  text = text.replace(/([.:\)\"”;])\s+([a-z]\.)\s+/g, '$1\n   $2 ');

  // 3. Tangani kasus khusus jika poin diawali di awal baris (gunakan [ \t]* agar tidak menghapus baris kosong \n\n)
  text = text.replace(/(^|\n)[ \t]*(\d+\.)\s+/g, '$1$2 ');
  text = text.replace(/(^|\n)[ \t]*([a-z]\.)\s+/g, '$1   $2 ');

  // 4. Tangani jika ada simbol bullet / dash yang menempel
  text = text.replace(/([.:\)\"”;])\s+([-\*•])\s+/g, '$1\n   $2 ');

  // Kembalikan singkatan
  text = text
    .replace(/__ABBR_SD__/g, 's.d.')
    .replace(/__ABBR_AN__/g, 'a.n.')
    .replace(/__ABBR_UB__/g, 'u.b.')
    .replace(/__ABBR_UP__/g, 'u.p.')
    .replace(/__ABBR_DA__/g, 'd.a.')
    .replace(/__ABBR_QQ__/g, 'q.q.');

  // 5. Bersihkan newline berlebih (maksimal 2 baris baru berurutan)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 6. Rapikan spasi ganda horizontal
  const lines = text.split('\n').map((line) => {
    const leadingSpaces = line.match(/^\s*/)?.[0] || '';
    const trimmedContent = line.trim().replace(/[ \t]{2,}/g, ' ');
    return trimmedContent ? `${leadingSpaces}${trimmedContent}` : '';
  });

  return lines.join('\n').trim();
}

/**
 * Menggabungkan Paragraf Pembuka, Substansi Isi, dan Paragraf Penutup Nota Dinas
 * menjadi satu kesatuan teks terstruktur (dipisahkan spasi baris kosong \n\n antar bagian)
 * yang selaras dengan tata letak satu form terpadu Nota Dinas.
 */
export function combineNotaDinasSections(
  notaPembuka?: string,
  notaIsi?: string,
  notaPenutup?: string
): string {
  const pembuka = (notaPembuka || '').trim();
  const isi = formatNumberedPoints(notaIsi || '');
  const penutup = (notaPenutup || '').trim();

  const sections: string[] = [];
  if (pembuka && !isi.startsWith(pembuka)) {
    sections.push(pembuka);
  }
  if (isi) {
    sections.push(isi);
  }
  if (penutup && !isi.endsWith(penutup)) {
    sections.push(penutup);
  }

  return sections.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Memecah teks menjadi unit-unit paragraf atau butir poin utuh
 * TANPA memotong di tengah kalimat atau pada tanda koma.
 */
export function chunkIntoSentenceUnits(text: string): string[] {
  if (!text) return [];
  const rawLines = text.split('\n');
  const units: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (units.length > 0 && units[units.length - 1] !== '') {
        units.push('');
      }
      continue;
    }
    units.push(trimmed);
  }

  return units;
}

/**
 * Memotong satu paragraf/poin yang panjang agar muat ke dalam sisa baris halaman (`maxLines`).
 * Mengembalikan `[bagianMuatHalamanIni, sisaKeHalamanBerikutnya]`.
 * Memotong tepat pada batas kata terakhir yang muat di baris terbawah halaman
 * (layaknya MS Word / Google Docs) agar halaman terisi penuh sampai batas margin bawah.
 */
export function splitTextToFitLines(
  text: string,
  maxLines: number,
  charsPerLine = 72
): [string, string] {
  const leadingSpaces = (text.match(/^ */) || [''])[0];
  const trimmed = text.trim();
  const isNumberedOrIndented =
    /^\d+[.)]\s+/.test(trimmed) || leadingSpaces.length >= 2;
  const isSubPoint = /^([a-zA-Z][.)]|\([0-9a-zA-Z]\))\s+/.test(trimmed);

  // Untuk butir bernomor/sub-poin, lebar baris efektif sedikit lebih sempit karena hanging indent 24px
  const effectiveCpl = isNumberedOrIndented || isSubPoint ? Math.max(40, charsPerLine - 4) : charsPerLine;
  const targetChars = Math.max(effectiveCpl, Math.floor(maxLines * effectiveCpl));

  if (trimmed.length <= targetChars) {
    return [leadingSpaces + trimmed, ''];
  }

  const slice = trimmed.slice(0, targetChars);
  let cutIdx = -1;

  // Potong pada spasi kata terakhir mendekati ujung baris terakhir agar tidak menyisakan ruang kosong di bawah halaman
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace >= targetChars * 0.45) {
    cutIdx = lastSpace;
  } else {
    // String panjang tanpa spasi
    cutIdx = targetChars;
  }

  // Pastikan tidak memotong di tengah penanda markup inline (** atau ^^ atau __)
  const rawHead = trimmed.slice(0, cutIdx).trim();
  const rawTail = trimmed.slice(cutIdx).trim();

  // Jika yang dipotong adalah butir bernomor (1. / 2. / dst.) atau lanjutan ber-indent,
  // beri awalan 2 spasi ('  ') pada tail agar di halaman berikutnya lurus sejajar (margin-left: 24px, tanpa text-indent paragraf baru)
  const tailPrefix = isSubPoint ? '    ' : isNumberedOrIndented ? '  ' : '';

  return [leadingSpaces + rawHead, rawTail ? tailPrefix + rawTail : ''];
}

/**
 * Menghitung bobot baris visual sebuah teks berdasarkan lebar karakter per baris (`charsPerLine`).
 */
export function estimateVisualLines(
  text: string | undefined,
  charsPerLine = 72,
  paragraphSpacingWeight = 0.22
): number {
  if (!text || !text.trim()) return 0;
  const lines = text.split('\n');
  let total = 0;
  for (const line of lines) {
    const clean = stripMarkup(line).trim();
    if (!clean) {
      total += 0.4;
      continue;
    }
    const isNum = /^\d+[.)]\s+/.test(clean);
    const cpl = isNum ? Math.max(40, charsPerLine - 4) : charsPerLine;
    total += Math.max(1, Math.ceil(clean.length / cpl)) + paragraphSpacingWeight;
  }
  return total;
}

/**
 * Mesin paginasi multi-halaman universal yang membagi array paragraf ke dalam
 * `[Halaman 1, Halaman 2, Halaman 3, ...]` berdasarkan kapasitas baris masing-masing halaman.
 */
function paginateParagraphs(
  rawParagraphs: string[],
  opts: {
    charsPerLine: number;
    page1Capacity: number;
    middlePageCapacity: number;
    lastPageCapacity: number;
    forceAtLeastTwoPages?: boolean;
  }
): string[][] {
  const { charsPerLine, page1Capacity, middlePageCapacity, lastPageCapacity, forceAtLeastTwoPages } = opts;

  const getWeight = (p: string): number => {
    const clean = stripMarkup(p).trim();
    if (!clean) return 0.4;
    const isNum = /^\d+[.)]\s+/.test(clean) || /^ {2,}\S/.test(p);
    const cpl = isNum ? Math.max(40, charsPerLine - 4) : charsPerLine;
    return Math.max(1, Math.ceil(clean.length / cpl)) + 0.22;
  };

  const queue = [...rawParagraphs];
  const pages: string[][] = [];

  // 1. Isi Halaman 1 sampai penuh mendekati margin bawah
  const page1Items: string[] = [];
  let page1Used = 0;
  const safePage1Cap = Math.max(2, page1Capacity);

  while (queue.length > 0) {
    const item = queue[0];
    const w = getWeight(item);
    const remLines = safePage1Cap - page1Used;

    if (w <= remLines) {
      page1Items.push(queue.shift()!);
      page1Used += w;
    } else if (remLines >= 1.8 || page1Items.length === 0) {
      const [head, tail] = splitTextToFitLines(item, Math.max(1.2, remLines), charsPerLine);
      if (head && tail) {
        page1Items.push(head);
        queue[0] = tail;
      } else {
        page1Items.push(queue.shift()!);
      }
      break;
    } else {
      break;
    }
  }
  pages.push(page1Items);

  // Jika dipaksa minimal 2 halaman (karena di Halaman 1 tidak cukup ruang untuk TTD),
  // pastikan paragraf penutup / bagian paling akhir pindah ke Halaman 2 menemani blok tanda tangan
  if (forceAtLeastTwoPages && queue.length === 0 && page1Items.length > 0) {
    if (page1Items.length >= 2) {
      queue.unshift(page1Items.pop()!);
    } else {
      const onlyItem = page1Items[0];
      const w = getWeight(onlyItem);
      if (w > 3) {
        const [head, tail] = splitTextToFitLines(onlyItem, Math.max(2, w - 2), charsPerLine);
        if (head && tail) {
          page1Items[0] = head;
          queue.unshift(tail);
        }
      }
    }
  }

  // 2. Isi Halaman Lanjutan (Halaman 2, 3, 4, dst.)
  while (queue.length > 0) {
    let remainingWeight = 0;
    for (const q of queue) {
      remainingWeight += getWeight(q);
    }

    // Jika sisa teks muat di halaman terakhir bersama TTD
    if (remainingWeight <= lastPageCapacity) {
      pages.push(queue.splice(0, queue.length));
      break;
    }

    const midItems: string[] = [];
    let midUsed = 0;
    const effectiveCap =
      remainingWeight <= middlePageCapacity
        ? Math.max(3, remainingWeight - 2.5)
        : middlePageCapacity;

    while (queue.length > 0) {
      const item = queue[0];
      const w = getWeight(item);
      const remLines = effectiveCap - midUsed;

      if (w <= remLines) {
        midItems.push(queue.shift()!);
        midUsed += w;
      } else if (remLines >= 1.8 || midItems.length === 0) {
        const [head, tail] = splitTextToFitLines(item, Math.max(1.2, remLines), charsPerLine);
        if (head && tail) {
          midItems.push(head);
          queue[0] = tail;
        } else {
          midItems.push(queue.shift()!);
        }
        break;
      } else {
        break;
      }
    }

    if (midItems.length > 0) {
      pages.push(midItems);
    } else if (queue.length > 0) {
      pages.push([queue.shift()!]);
    }
  }

  return pages;
}

export interface NotaDinasPageSplit {
  page1Lines: string[];
  page2Lines: string[];
  pages: string[][];
  isMultiPage: boolean;
}

/**
 * Membagi teks Nota Dinas menjadi Halaman 1, 2, 3, dst. secara adaptif dan otomatis
 * ketika pengguna mengetik panjang lebar, persis seperti aliran halaman MS Word / Google Docs.
 */
export function splitNotaDinasPages(
  notaIsi: string,
  notaPembuka?: string,
  notaPenutup?: string
): NotaDinasPageSplit {
  let fullText = (notaIsi || '').trim();
  if (notaPembuka && notaPembuka.trim() && !fullText.includes(notaPembuka.trim())) {
    fullText = `${notaPembuka.trim()}\n\n${fullText}`;
  }
  if (notaPenutup && notaPenutup.trim() && !fullText.includes(notaPenutup.trim())) {
    fullText = `${fullText}\n\n${notaPenutup.trim()}`;
  }

  if (!fullText) {
    return { page1Lines: [], page2Lines: [], pages: [], isMultiPage: false };
  }

  // Satukan kembali baris lanjutan ber-indent ('  ...') hasil pecahan halaman sebelumnya
  // agar paragraf/butir bernomor utuh kembali sebelum dihitung ulang
  const mergedLines: string[] = [];
  for (const rawLine of fullText.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const isContinuation =
      /^ {2,}\S/.test(rawLine) &&
      !/^\s*(?:\d+[.)]|[a-zA-Z][.)]|\([0-9a-zA-Z]\)|[-*•#])\s+/.test(rawLine);
    if (isContinuation && mergedLines.length > 0) {
      mergedLines[mergedLines.length - 1] = `${mergedLines[mergedLines.length - 1].trimEnd()} ${trimmed}`;
    } else {
      mergedLines.push(trimmed);
    }
  }

  const normalizedText = formatNumberedPoints(mergedLines.join('\n\n'));
  const rawParagraphs = normalizedText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParagraphs.length === 0) {
    return { page1Lines: [], page2Lines: [], pages: [], isMultiPage: false };
  }

  // 1. Cek pemisah halaman manual (`---`, `===`, `[halaman baru]`)
  const hasManualPageBreak = rawParagraphs.some((l) =>
    /^(?:---|===|\*\*\*|\[halaman baru\]|\[pagebreak\])/i.test(l.trim())
  );
  if (hasManualPageBreak) {
    const manualPages: string[][] = [];
    let curPage: string[] = [];
    for (const p of rawParagraphs) {
      if (/^(?:---|===|\*\*\*|\[halaman baru\]|\[pagebreak\])/i.test(p.trim())) {
        if (curPage.length > 0) {
          manualPages.push(curPage);
          curPage = [];
        }
      } else {
        curPage.push(p);
      }
    }
    if (curPage.length > 0) {
      manualPages.push(curPage);
    }
    return {
      page1Lines: manualPages[0] || [],
      page2Lines: manualPages[1] || [],
      pages: manualPages,
      isMultiPage: manualPages.length > 1,
    };
  }

  // Lebar area teks Nota Dinas pada kertas A4 (640px, Arial 12pt) memuat ~74 karakter per baris
  const CHARS_PER_LINE = 74;
  let totalWeight = 0;
  let totalChars = 0;
  for (const p of rawParagraphs) {
    const clean = stripMarkup(p).trim();
    const isNum = /^\d+[.)]\s+/.test(clean);
    const cpl = isNum ? CHARS_PER_LINE - 4 : CHARS_PER_LINE;
    totalWeight += Math.max(1, Math.ceil(clean.length / cpl)) + 0.22;
    totalChars += clean.length;
  }

  // Kapasitas Halaman 1 jika beserta TTD: ~23.5 baris visual (~1.650 karakter)
  const SINGLE_PAGE_MAX_LINES = 23.5;
  if (totalWeight <= SINGLE_PAGE_MAX_LINES && totalChars <= 1650) {
    return {
      page1Lines: rawParagraphs,
      page2Lines: [],
      pages: [rawParagraphs],
      isMultiPage: false,
    };
  }

  // Jika melebihi 1 halaman (totalWeight > 23.5), Halaman 1 diisi penuh sampai margin bawah (~29.5 baris visual)
  const pages = paginateParagraphs(rawParagraphs, {
    charsPerLine: CHARS_PER_LINE,
    page1Capacity: 29.5,
    middlePageCapacity: 42,
    lastPageCapacity: 34,
    forceAtLeastTwoPages: true,
  });

  return {
    page1Lines: pages[0] || [],
    page2Lines: pages[1] || [],
    pages,
    isMultiPage: pages.length > 1,
  };
}

export interface SuratUndanganPageSplit {
  page1AgendaLines: string[];
  page2AgendaLines: string[];
  agendaPages: string[][];
  isMultiPage: boolean;
}

/**
 * Membagi Surat Undangan secara otomatis ke Halaman 2, 3, dst. apabila pengguna
 * mengetik panjang lebar pada Kepada Yth., Paragraf Pembuka, Agenda, atau Paragraf Penutup.
 */
export function splitSuratUndanganPages(
  agendaText: string,
  undanganKepada?: string,
  undanganPembuka?: string,
  undanganPenutup?: string
): SuratUndanganPageSplit {
  const formattedAgenda = formatNumberedPoints(agendaText || '');
  const agendaUnits = chunkIntoSentenceUnits(formattedAgenda).filter((u) => u.trim() !== '');

  const AGENDA_CPL = 56; // Kolom agenda berada di sebelah kanan label "Agenda :"
  const BODY_CPL = 72;

  const kepadaWeight = Math.max(1.2, estimateVisualLines(undanganKepada, BODY_CPL, 0.2));
  const pembukaWeight = Math.max(1.5, estimateVisualLines(undanganPembuka, BODY_CPL, 0.22));
  const agendaWeight = Math.max(1, estimateVisualLines(formattedAgenda, AGENDA_CPL, 0.22));
  const penutupWeight = Math.max(1.5, estimateVisualLines(undanganPenutup, BODY_CPL, 0.22));

  const totalDynamicWeight = kepadaWeight + pembukaWeight + agendaWeight + penutupWeight;

  // Pada Halaman 1 Surat Undangan (dengan Kop, Nomor/Hal, Hari/Waktu/Tempat, dan Blok TTD),
  // ruang dinamis untuk (Kepada + Pembuka + Agenda + Penutup) adalah ~22.5 baris visual.
  const SINGLE_PAGE_BUDGET = 22.5;

  if (totalDynamicWeight <= SINGLE_PAGE_BUDGET) {
    return {
      page1AgendaLines: agendaUnits.length > 0 ? agendaUnits : [agendaText || ''],
      page2AgendaLines: [],
      agendaPages: [agendaUnits.length > 0 ? agendaUnits : [agendaText || '']],
      isMultiPage: false,
    };
  }

  // Jika melebihi 1 halaman: Penutup & TTD otomatis pindah ke halaman lanjutan.
  // Hitung sisa ruang untuk Agenda di Halaman 1 sampai margin bawah (~30 baris total):
  const page1AgendaCap = Math.max(2, 30 - kepadaWeight - pembukaWeight);

  if (agendaUnits.length === 0) {
    return {
      page1AgendaLines: [''],
      page2AgendaLines: [],
      agendaPages: [['']],
      isMultiPage: true,
    };
  }

  const agendaPages = paginateParagraphs(agendaUnits, {
    charsPerLine: AGENDA_CPL,
    page1Capacity: page1AgendaCap,
    middlePageCapacity: 40,
    lastPageCapacity: Math.max(4, 33 - penutupWeight),
    forceAtLeastTwoPages: false,
  });

  return {
    page1AgendaLines: agendaPages[0] || [],
    page2AgendaLines: agendaPages.slice(1).flat(),
    agendaPages,
    isMultiPage: true,
  };
}

export interface SuratTugasPageSplit {
  page1UntukLines: string[];
  page2UntukLines: string[];
  untukPages: string[][];
  isMultiPage: boolean;
}

/**
 * Membagi Surat Tugas secara otomatis ke Halaman 2, 3, dst. apabila pengguna
 * mengetik panjang lebar pada Menimbang, Dasar, Kepada, Untuk, atau Penutup.
 */
export function splitSuratTugasPages(
  untukText: string,
  menimbangText: string,
  dasarText: string,
  pegawaiCount: number,
  customKepadaText?: string,
  penutupText?: string
): SuratTugasPageSplit {
  const DIKTUM_CPL = 64; // Kolom kanan di sebelah label Menimbang / Dasar / Kepada / Untuk

  const menimbangWeight = Math.max(1.5, estimateVisualLines(menimbangText, DIKTUM_CPL, 0.22));
  const dasarWeight = Math.max(1.5, estimateVisualLines(dasarText, DIKTUM_CPL, 0.22));
  const untukWeight = Math.max(1.5, estimateVisualLines(untukText, DIKTUM_CPL, 0.22));
  const penutupWeight = penutupText ? estimateVisualLines(penutupText, 72, 0.22) : 0;

  const pegawaiWeight =
    pegawaiCount === 0
      ? Math.max(1.5, estimateVisualLines(customKepadaText, DIKTUM_CPL, 0.22))
      : pegawaiCount > 3
      ? 1.5
      : pegawaiCount === 1
      ? 4.2
      : pegawaiCount === 2
      ? 8.4
      : 12.2;

  const rawUntukUnits = (untukText || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const totalWeight = menimbangWeight + dasarWeight + pegawaiWeight + untukWeight + penutupWeight;

  // Aturan 1-3 Pegawai: Surat Tugas muat 1 halaman untuk teks standar (<= 28.5 baris bobot),
  // namun otomatis menambah Halaman 2, 3, dst. jika pengguna mengetik manual panjang lebar.
  const SINGLE_PAGE_BUDGET = pegawaiCount === 3 ? 29.5 : 28.5;

  if (totalWeight <= SINGLE_PAGE_BUDGET) {
    const defaultPages = [rawUntukUnits.length > 0 ? rawUntukUnits : [untukText || '']];
    return {
      page1UntukLines: defaultPages[0],
      page2UntukLines: [],
      untukPages: defaultPages,
      isMultiPage: false,
    };
  }

  // Tanpa Penutup & TTD di Halaman 1, kapasitas Halaman 1 sampai margin bawah adalah ~36 baris
  const page1UntukCap = Math.max(2, 36 - menimbangWeight - dasarWeight - pegawaiWeight);

  if (rawUntukUnits.length === 0) {
    return {
      page1UntukLines: [''],
      page2UntukLines: [],
      untukPages: [['']],
      isMultiPage: true,
    };
  }

  const untukPages = paginateParagraphs(rawUntukUnits, {
    charsPerLine: DIKTUM_CPL,
    page1Capacity: page1UntukCap,
    middlePageCapacity: 40,
    lastPageCapacity: Math.max(4, 32 - penutupWeight),
    forceAtLeastTwoPages: false,
  });

  return {
    page1UntukLines: untukPages[0] || [],
    page2UntukLines: untukPages.slice(1).flat(),
    untukPages,
    isMultiPage: true,
  };
}
