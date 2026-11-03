/**
 * Utilitas Pemformatan dan Paginasi Tata Naskah Dinas (PUSAKA Komdigi)
 * Memastikan penomoran, sub-poin (a., b., c.), dan pemisahan halaman A4 berjalan rapi
 * baik untuk teks yang dihasilkan AI maupun ketikan/manual kalimat panjang dari pengguna.
 */

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
  //    Termasuk kasus hasil AI di mana titik langsung diikuti angka tanpa spasi (misal: "...berkualitas.2. Kebijakan")
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
 * Memecah kalimat yang sangat panjang berdasarkan tanda koma atau spasi
 * sehingga tidak membentuk satu baris teks raksasa yang tidak bisa dipaginasi.
 */
function splitLongSentenceByCommas(sentence: string): string[] {
  const parts: string[] = [];
  let remaining = sentence;
  while (remaining.length > 110) {
    let cutIdx = remaining.lastIndexOf(', ', 110);
    if (cutIdx === -1 || cutIdx < 40) {
      cutIdx = remaining.lastIndexOf(' ', 110);
    }
    if (cutIdx === -1 || cutIdx < 40) {
      cutIdx = 110;
    } else {
      cutIdx += 1; // sertakan koma
    }
    parts.push(remaining.substring(0, cutIdx).trim());
    remaining = remaining.substring(cutIdx).trim();
  }
  if (remaining) {
    parts.push(remaining);
  }
  return parts;
}

/**
 * Memecah teks nota dinas menjadi unit-unit paragraf atau butir poin utuh
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
    // Pertahankan baris/paragraf secara utuh tanpa memecah di koma
    units.push(trimmed);
  }

  return units;
}

export interface NotaDinasPageSplit {
  page1Lines: string[];
  page2Lines: string[];
  pages: string[][];
  isMultiPage: boolean;
}

/**
 * Memotong satu paragraf/poin yang panjang agar muat ke dalam sisa baris halaman (`maxLines`).
 * Mengembalikan `[bagianMuatHalamanIni, sisaKeHalamanBerikutnya]`.
 * Memprioritaskan pemotongan pada batas kalimat (`. `), kemudian batas kata (` `),
 * atau batas karakter jika pengguna mengetik string panjang tanpa spasi.
 */
function splitTextToFitLines(
  text: string,
  maxLines: number,
  charsPerLine = 65
): [string, string] {
  const trimmed = text.trim();
  const targetChars = Math.max(charsPerLine, Math.floor(maxLines * charsPerLine));
  if (trimmed.length <= targetChars) {
    return [trimmed, ''];
  }

  // 1. Coba potong di batas akhir kalimat (. / ! / ? / ;) dalam rentang 55%..100% targetChars
  const slice = trimmed.slice(0, targetChars);
  let cutIdx = -1;
  const sentenceEndRegex = /[.!?;]\s+/g;
  let match: RegExpExecArray | null;
  while ((match = sentenceEndRegex.exec(slice)) !== null) {
    const endPos = match.index + 1;
    if (endPos >= targetChars * 0.55) {
      cutIdx = endPos;
    }
  }

  // 2. Jika tidak ada batas kalimat yang pas, potong di batas spasi kata terdekat
  if (cutIdx === -1) {
    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace >= targetChars * 0.4) {
      cutIdx = lastSpace;
    } else {
      // String tanpa spasi (misal ketikan panjang terus-menerus)
      cutIdx = targetChars;
    }
  }

  const head = trimmed.slice(0, cutIdx).trim();
  const tail = trimmed.slice(cutIdx).trim();
  return [head, tail];
}

/**
 * Membagi teks nota dinas (baik poin-poin maupun paragraf narasi)
 * menjadi Halaman 1, 2, 3, dst. secara adaptif, profesional, dan dinamis.
 * - Mengutamakan 1 halaman penuh jika teks cukup.
 * - Jika melebihi 1 halaman, memanfaatkan ruang Halaman 1 secara optimal (~23-24 baris)
 *   tanpa menyisakan ruang kosong besar.
 * - Halaman lanjutan dibagi secara dinamis sehingga tanda tangan dan penutup
 *   berada tepat di bawah paragraf penutup dan tidak pernah terpotong/overflow.
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

  // Rapikan penomoran poin yang menempel (misal "...berkualitas.2. Kebijakan...") sebelum dipaginasi
  const normalizedText = formatNumberedPoints(fullText);

  // Pecah menjadi blok paragraf/poin utuh
  const rawParagraphs = normalizedText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParagraphs.length === 0) {
    return { page1Lines: [], page2Lines: [], pages: [], isMultiPage: false };
  }

  // 1. Cek jika pengguna sengaja menyisipkan pemisah halaman manual: `---`, `===`, atau `[halaman baru]`
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

  // Hitung bobot baris (lebar efektif kertas A4 dengan margin kiri/kanan pada Arial 12pt adalah ~65 karakter/baris)
  const getLineWeight = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0.5;
    const isBulletOrNum = /^(\d+[\.\)]|[a-zA-Z][\.\)]|[\-\*•])\s+/.test(trimmed);
    const charsPerLine = isBulletOrNum ? 62 : 65;
    return Math.max(1, Math.ceil(trimmed.length / charsPerLine)) + 0.25; // +0.25 untuk spasi antar paragraf
  };

  // Hitung total baris keseluruhan
  let totalWeight = 0;
  let totalChars = 0;
  for (const p of rawParagraphs) {
    totalWeight += getLineWeight(p);
    totalChars += p.length;
  }

  // 2. Cek apakah cukup 1 Halaman:
  // Ruang bebas untuk isi + penutup + TTD pada Halaman 1 A4 adalah ~18.5 baris visual atau ~1.200 karakter.
  const SINGLE_PAGE_MAX_LINES = 18.5;
  if (totalWeight <= SINGLE_PAGE_MAX_LINES && totalChars <= 1200 && rawParagraphs.length <= 12) {
    return {
      page1Lines: rawParagraphs,
      page2Lines: [],
      pages: [rawParagraphs],
      isMultiPage: false,
    };
  }

  // 3. Multi-Halaman:
  // Kapasitas baris aman per halaman:
  // - Halaman 1: Memuat Kop + Atribut Nota Dinas + Isi + "(bersambung ke halaman 2)" => 24 baris
  const PAGE_1_CAPACITY = 24;
  // - Halaman Tengah: Memuat "- 2 -" + Isi + "(bersambung ke halaman 3)" => 31 baris
  const MIDDLE_PAGE_CAPACITY = 31;
  // - Halaman Terakhir: Memuat "- N -" + Isi + Penutup + Blok Tanda Tangan => 22 baris
  const LAST_PAGE_CAPACITY = 22;

  const queue = [...rawParagraphs];
  const pages: string[][] = [];

  // Isi Halaman 1 secara proporsional (potong paragraf panjang jika masih ada sisa ruang >= 3 baris)
  const page1Items: string[] = [];
  let page1Used = 0;

  while (queue.length > 0) {
    const item = queue[0];
    const w = getLineWeight(item);
    const remLines = PAGE_1_CAPACITY - page1Used;

    if (w <= remLines) {
      page1Items.push(queue.shift()!);
      page1Used += w;
    } else if (remLines >= 3.5 || page1Items.length === 0) {
      // Potong paragraf/poin agar mengisi ruang Halaman 1 dan sisanya mengalir ke Halaman 2
      const [head, tail] = splitTextToFitLines(item, Math.max(3, remLines - 0.3), 64);
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

  // Isi Halaman Lanjutan (Halaman 2, 3, dst.)
  while (queue.length > 0) {
    let remainingWeight = 0;
    for (const q of queue) {
      remainingWeight += getLineWeight(q);
    }

    if (remainingWeight <= LAST_PAGE_CAPACITY) {
      pages.push(queue.splice(0, queue.length));
      break;
    }

    const midItems: string[] = [];
    let midUsed = 0;

    while (queue.length > 0) {
      const item = queue[0];
      const w = getLineWeight(item);
      const remLines = MIDDLE_PAGE_CAPACITY - midUsed;

      if (w <= remLines) {
        midItems.push(queue.shift()!);
        midUsed += w;
      } else if (remLines >= 3.5 || midItems.length === 0) {
        const [head, tail] = splitTextToFitLines(item, Math.max(3, remLines - 0.3), 64);
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

  // 4. Penyeimbangan Anti-Orphan:
  // Jika halaman terakhir hanya berisi 1 paragraf pendek (< 4 baris, misal hanya kalimat "Demikian disampaikan...")
  // dan halaman sebelumnya memiliki >= 2 paragraf, geser 1 paragraf (atau potongan akhir) ke halaman terakhir
  // agar halaman terakhir tidak tampak kosong melompong sebelum tanda tangan.
  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    const lastWeight = lastPage.reduce((acc, l) => acc + getLineWeight(l), 0);

    if (lastWeight < 4 && prevPage.length >= 2) {
      const candidate = prevPage[prevPage.length - 1];
      const candidateWeight = getLineWeight(candidate);
      if (lastWeight + candidateWeight <= LAST_PAGE_CAPACITY) {
        prevPage.pop();
        lastPage.unshift(candidate);
      } else if (candidateWeight > 6) {
        const keepLines = Math.max(3, Math.ceil(candidateWeight - 5));
        const [head, tail] = splitTextToFitLines(candidate, keepLines, 64);
        if (head && tail) {
          prevPage[prevPage.length - 1] = head;
          lastPage.unshift(tail);
        }
      }
    }
  }

  return {
    page1Lines: pages[0] || [],
    page2Lines: pages[1] || [],
    pages: pages,
    isMultiPage: pages.length > 1,
  };
}

export interface SuratUndanganPageSplit {
  page1AgendaLines: string[];
  page2AgendaLines: string[];
  isMultiPage: boolean;
}

/**
 * Membagi agenda dan rincian acara Surat Undangan jika kalimatnya panjang / melebihi 1 halaman A4.
 */
export function splitSuratUndanganPages(
  agendaText: string,
  undanganKepada?: string,
  undanganPembuka?: string,
  undanganPenutup?: string
): SuratUndanganPageSplit {
  const formatted = formatNumberedPoints(agendaText);
  const units = chunkIntoSentenceUnits(formatted).filter((u) => u.trim() !== '');

  if (units.length === 0) {
    return { page1AgendaLines: [], page2AgendaLines: [], isMultiPage: false };
  }

  const charsPerLine = 52; // Kolom agenda dimulai setelah label "Agenda :" (lebar ~52 karakter/baris)
  let agendaLineWeight = 0;
  for (const u of units) {
    agendaLineWeight += Math.max(1, Math.ceil(u.trim().length / charsPerLine));
  }

  const kepadaLines = undanganKepada ? Math.max(1, undanganKepada.split('\n').length) : 2;
  const pembukaLines = undanganPembuka ? Math.max(2, Math.ceil(undanganPembuka.length / 65)) : 3;
  const penutupLines = undanganPenutup ? Math.max(2, Math.ceil(undanganPenutup.length / 65)) : 3;
  const extraLines = Math.max(0, kepadaLines - 3) + Math.max(0, pembukaLines - 4) + Math.max(0, penutupLines - 3);

  // Surat Undangan memuat Kop, Nomor/Sifat/Hal/Lampiran, Kepada Yth, Waktu, Tempat, Penutup, TTD.
  // Jika agenda + ekstra > 5 baris atau panjang karakter > 280, pecah ke Halaman 2.
  if (agendaLineWeight + extraLines <= 5 && formatted.length <= 280) {
    return {
      page1AgendaLines: units,
      page2AgendaLines: [],
      isMultiPage: false,
    };
  }

  // Kapasitas baris agenda di Halaman 1 (tanpa Penutup & TTD di Halaman 1) adalah ~9 baris
  const maxPage1AgendaLines = Math.max(3, 9 - Math.max(0, kepadaLines - 3) - Math.max(0, pembukaLines - 4));

  const page1AgendaLines: string[] = [];
  const page2AgendaLines: string[] = [];
  let usedLines = 0;
  let overflowed = false;

  for (const unit of units) {
    const trimmed = unit.trim();
    const w = Math.max(1, Math.ceil(trimmed.length / charsPerLine));
    if (!overflowed) {
      if (usedLines + w <= maxPage1AgendaLines) {
        page1AgendaLines.push(trimmed);
        usedLines += w;
      } else if (maxPage1AgendaLines - usedLines >= 2 || page1AgendaLines.length === 0) {
        const [head, tail] = splitTextToFitLines(trimmed, Math.max(2, maxPage1AgendaLines - usedLines), charsPerLine);
        if (head && tail) {
          page1AgendaLines.push(head);
          page2AgendaLines.push(tail);
        } else {
          page1AgendaLines.push(trimmed);
        }
        overflowed = true;
      } else {
        page2AgendaLines.push(trimmed);
        overflowed = true;
      }
    } else {
      page2AgendaLines.push(trimmed);
    }
  }

  return {
    page1AgendaLines,
    page2AgendaLines,
    isMultiPage: true,
  };
}

export interface SuratTugasPageSplit {
  page1UntukLines: string[];
  page2UntukLines: string[];
  isMultiPage: boolean;
}

/**
 * Membagi diktum "Untuk" dan bagian penutup/TTD pada Surat Tugas (1-3 pegawai)
 * apabila pengguna mengetik teks yang panjang pada Menimbang, Dasar, atau Untuk.
 */
export function splitSuratTugasPages(
  untukText: string,
  menimbangText: string,
  dasarText: string,
  pegawaiCount: number
): SuratTugasPageSplit {
  const countLines = (txt: string, cpl = 58): number => {
    if (!txt || !txt.trim()) return 1;
    return txt
      .split('\n')
      .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.trim().length / cpl)), 0);
  };

  const menimbangLines = countLines(menimbangText, 58);
  const dasarLines = countLines(dasarText, 58);
  const untukLines = countLines(untukText, 58);
  const pegawaiLines = pegawaiCount <= 1 ? 4 : pegawaiCount === 2 ? 8 : 12;

  const rawUntukUnits = (untukText || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const totalLines = menimbangLines + dasarLines + untukLines + pegawaiLines;

  // Aturan 1-3 Pegawai: Surat Tugas selalu cukup 1 halaman (diskalakan adaptif di SuratPreview),
  // kecuali pengguna mengetik diktum yang sangat panjang (> 32 baris atau > 850 karakter).
  if (totalLines <= 32 && (untukText || '').length <= 850) {
    return {
      page1UntukLines: rawUntukUnits.length > 0 ? rawUntukUnits : [untukText || ''],
      page2UntukLines: [],
      isMultiPage: false,
    };
  }

  // Jika melebihi 1 halaman, hitung sisa baris di Halaman 1 untuk diktum "Untuk"
  // Tanpa Penutup & TTD di Halaman 1, total kapasitas Halaman 1 adalah ~27 baris
  const maxPage1UntukLines = Math.max(3, 27 - menimbangLines - dasarLines - pegawaiLines);

  if (untukLines <= maxPage1UntukLines) {
    // Seluruh "Untuk" masih muat di Halaman 1, hanya Penutup & TTD yang pindah ke Halaman 2
    return {
      page1UntukLines: rawUntukUnits.length > 0 ? rawUntukUnits : [untukText || ''],
      page2UntukLines: [],
      isMultiPage: true,
    };
  }

  // Jika "Untuk" sangat panjang hingga melebihi Halaman 1, bagi "Untuk" ke Halaman 1 dan Halaman 2
  const page1UntukLines: string[] = [];
  const page2UntukLines: string[] = [];
  let used = 0;
  let overflow = false;

  for (const unit of rawUntukUnits) {
    const w = Math.max(1, Math.ceil(unit.length / 58));
    if (!overflow) {
      if (used + w <= maxPage1UntukLines) {
        page1UntukLines.push(unit);
        used += w;
      } else if (maxPage1UntukLines - used >= 2 || page1UntukLines.length === 0) {
        const [head, tail] = splitTextToFitLines(unit, Math.max(2, maxPage1UntukLines - used), 58);
        if (head && tail) {
          page1UntukLines.push(head);
          page2UntukLines.push(tail);
        } else {
          page1UntukLines.push(unit);
        }
        overflow = true;
      } else {
        page2UntukLines.push(unit);
        overflow = true;
      }
    } else {
      page2UntukLines.push(unit);
    }
  }

  return {
    page1UntukLines,
    page2UntukLines,
    isMultiPage: true,
  };
}
