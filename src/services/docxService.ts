import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
  UnderlineType,
  VerticalAlign,
} from 'docx';
import { SuratTugasFormState, Pegawai, Pejabat, LampiranItem, KopSuratTipe } from '../types';
import { inlineSegments, stripMarkup } from './richText';
import { parseTableFromText, normalizeTableModel } from './tableService';

// Font default seluruh dokumen — Arial, sesuai format asli Komdigi
const F = 'Arial';

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

const CELL_NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

/**
 * Format date string (YYYY-MM-DD) -> "01 November 2026" (tanggal 2 digit)
 */
export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '';
  const bulanIndo = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dayNum = parseInt(parts[2], 10);
    const day = isNaN(dayNum) ? parts[2] : String(dayNum).padStart(2, '0');
    const month = bulanIndo[parseInt(parts[1], 10) - 1] || parts[1];
    return `${day} ${month} ${parts[0]}`;
  }
  return normalizeTwoDigitDateText(dateStr);
}

/**
 * Pastikan angka tanggal 1 digit sebelum nama bulan Indonesia (misal "Senin, 1 November 2026")
 * diubah menjadi 2 digit ("Senin, 01 November 2026").
 */
export function normalizeTwoDigitDateText(text?: string): string {
  if (!text) return '';
  return text.replace(
    /\b([1-9])\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/gi,
    '0$1 $2'
  );
}

/**
 * Menghapus gelar akademik di depan maupun di belakang nama pejabat/pegawai
 * Contoh: "Oki Suryowahono, S.T., M.T." -> "Oki Suryowahono"
 */
export function stripAcademicTitles(nama?: string): string {
  if (!nama) return '';
  let clean = stripMarkup(nama).trim();
  const commaIdx = clean.indexOf(',');
  if (commaIdx !== -1) {
    clean = clean.slice(0, commaIdx).trim();
  }
  clean = clean
    .replace(/^(?:Prof\.?\s*|Dr\.?\s*|Drs\.?\s*|Dra\.?\s*|Ir\.?\s*|H\.?\s*|Hj\.?\s*)+/i, '')
    .trim();
  return clean;
}

/**
 * Membersihkan nilai field tempat online/offline dari artefak pengulangan awalan
 * (*online* via tautan / *offline* di) agar hanya menyisakan tautan atau nama tempat bersih.
 */
export function cleanTempatField(raw: string | undefined, mode: 'online' | 'offline'): string {
  if (!raw) return '';
  let s = raw.trim();
  if (mode === 'online') {
    s = s
      .replace(
        /^(?:\s*(?:(?:\*{1,2}|\^{1,2})[a-zA-Z]*(?:\*{1,2}|\^{1,2})?|online\b|onlie\b|onln\b|onli\b)\s*(?:via(?:\s+tautan)?\b)?|\s*via(?:\s+tautan)?\b)+/i,
        ''
      )
      .trim();
  } else {
    s = s
      .replace(
        /^(?:\s*(?:(?:\*{1,2}|\^{1,2})[a-zA-Z]*(?:\*{1,2}|\^{1,2})?|offline\b|ofline\b|offlne\b|offli\b)\s*(?:di\b)?)+/i,
        ''
      )
      .trim();
  }
  return s;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Paragraph kosong sebagai spasi antar baris */
const spacer = (pt = 0) =>
  new Paragraph({ spacing: { before: 0, after: pt ? pt * 20 : 0 }, children: [] });

/** Teks biasa Arial 12pt */
const t = (text: string, opts?: { bold?: boolean; italic?: boolean; underline?: boolean; size?: number }) =>
  new TextRun({
    text,
    font: F,
    size: (opts?.size ?? 12) * 2,
    bold: opts?.bold,
    italics: opts?.italic,
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
  });

/** Konversi baris ber-markup (**bold**, *bold*, ^^italic^^, __underline__) menjadi array TextRun Word */
function runsFromMarkup(
  text: string,
  opts?: { size?: number; defaultBold?: boolean; defaultItalic?: boolean }
): TextRun[] {
  const cleaned = (text || '').replace(/^#{1,2}\s+/, '');
  // Konversi *teks* (single asterisk) menjadi **teks** (bold) agar konsisten tanpa simbol bintang
  const normalized = cleaned.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');
  const segs = inlineSegments(normalized);
  if (segs.length === 0) {
    return [t('', { size: opts?.size, bold: opts?.defaultBold, italic: opts?.defaultItalic })];
  }
  return segs.map((seg) =>
    t(seg.text, {
      size: opts?.size ?? 12,
      bold: seg.b || opts?.defaultBold,
      italic: seg.i || opts?.defaultItalic,
      underline: seg.u,
    })
  );
}

/** Konversi Base64 Data URL menjadi Uint8Array untuk ImageRun di Word */
function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    const base64 = parts.length > 1 ? parts[1] : parts[0];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/** Ambil bytes logo Komdigi dari /komdigi_logo.png */
async function fetchKomdigiLogoBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch('/komdigi_logo.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/**
 * Helper membuat baris [ Label | : | Isi ] pada tabel tanpa border
 * agar titik dua (:) selalu rata lurus vertikal 100% seperti Flexbox di preview web.
 */
function buildKvTableRow(
  label: string,
  valueParagraphs: (Paragraph | Table)[],
  opts?: {
    labelWidth?: number;
    colonWidth?: number;
    totalWidth?: number;
    fontSize?: number;
    spaceAfter?: number;
  }
): TableRow {
  const labelW = opts?.labelWidth ?? 1500;
  const colonW = opts?.colonWidth ?? 240;
  const totalW = opts?.totalWidth ?? 9600;
  const valW = totalW - labelW - colonW;
  const sz = opts?.fontSize ?? 12;
  const after = opts?.spaceAfter ?? 40;

  const cellPadding = {
    top: 15,
    bottom: 15,
    left: 0,
    right: 20,
  };

  return new TableRow({
    children: [
      new TableCell({
        width: { size: labelW, type: WidthType.DXA },
        borders: CELL_NO_BORDERS,
        margins: cellPadding,
        children: [
          new Paragraph({
            spacing: { before: 0, after },
            children: [t(label, { size: sz })],
          }),
        ],
      }),
      new TableCell({
        width: { size: colonW, type: WidthType.DXA },
        borders: CELL_NO_BORDERS,
        margins: cellPadding,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after },
            children: [t(':', { size: sz })],
          }),
        ],
      }),
      new TableCell({
        width: { size: valW, type: WidthType.DXA },
        borders: CELL_NO_BORDERS,
        margins: cellPadding,
        children: valueParagraphs,
      }),
    ],
  });
}

/**
 * Helper membuat Blok Tanda Tangan (posisi di kanan halaman, namun teks jabatan & nama rata tengah
 * di dalam kotak tanda tangan 280px seperti pada preview web).
 */
function buildSignatureTable(
  jabatanTTD: string,
  namaPejabatClean: string,
  kotaTanggal?: string,
  fontSize = 12
): Table {
  const rightChildren: Paragraph[] = [];
  if (kotaTanggal) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [t(kotaTanggal, { size: fontSize })],
      })
    );
  }
  rightChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [t(jabatanTTD, { size: fontSize })],
    }),
    spacer(12),
    spacer(12),
    spacer(12),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [t(namaPejabatClean, { size: fontSize, bold: false })],
    })
  );

  return new Table({
    width: { size: 9600, type: WidthType.DXA },
    columnWidths: [5300, 4300],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5300, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 4300, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

const SOLID_TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
} as const;

const SOLID_CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
} as const;

/** Baca dimensi pixel asli (width x height) dari bytes PNG atau JPEG agar rasio gambar lampiran presisi */
function getImageDimensionsFromBytes(bytes: Uint8Array): { width: number; height: number } | null {
  try {
    if (!bytes || bytes.length < 24) return null;
    // PNG: 89 50 4E 47 0D 0A 1A 0A, diikuti IHDR chunk dengan width di byte 16..19 dan height di 20..23
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const width = ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
      const height = ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0;
      if (width > 0 && height > 0) return { width, height };
    }
    // JPEG: FF D8 ... cari marker SOF0 (FF C0), SOF1 (FF C1), atau SOF2 (FF C2)
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = bytes[i + 1];
        if (marker === 0xff) {
          i++;
          continue;
        }
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = (bytes[i + 5] << 8) | bytes[i + 6];
          const width = (bytes[i + 7] << 8) | bytes[i + 8];
          if (width > 0 && height > 0) return { width, height };
          break;
        }
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
        if (segLen < 2) break;
        i += 2 + segLen;
      }
    }
  } catch {}
  return null;
}

/** Hitung ukuran tampil gambar lampiran agar proporsional dan hampir memenuhi seluruh kertas A4 seperti di preview web & Google Docs */
function computeFullPageImageSize(
  bytes: Uint8Array,
  hasTopMark: boolean
): { width: number; height: number } {
  const maxW = hasTopMark ? 740 : 760;
  const maxH = hasTopMark ? 975 : 1070;
  const dims = getImageDimensionsFromBytes(bytes);
  if (!dims || dims.width <= 0 || dims.height <= 0) {
    return { width: maxW, height: maxH };
  }
  const ratio = dims.width / dims.height;
  let w = maxW;
  let h = Math.round(w / ratio);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * ratio);
  }
  return { width: Math.max(100, w), height: Math.max(100, h) };
}

/** Konversi tabel HTML (<table...>) atau Markdown menjadi objek Table Word (docx) rata tengah yang identik dengan preview web */
function parseHtmlTableToDocx(html: string): Table | null {
  try {
    const parsed = parseTableFromText(html);
    if (!parsed) return null;
    const model = normalizeTableModel(parsed);
    const numCols = Math.max(1, model.columns.length);
    const totalTableW = 9600;

    // Hitung lebar tiap kolom dalam DXA agar proporsional dan memenuhi lebar halaman (9600 DXA)
    const firstColIsNo =
      numCols > 1 && /^(no\.?|nomor|#)$/i.test((model.columns[0] || '').trim());
    const noColW = firstColIsNo ? 720 : Math.floor(totalTableW / numCols);
    const remW = totalTableW - (firstColIsNo ? noColW : 0);
    const otherColsCount = firstColIsNo ? numCols - 1 : numCols;
    const eachOtherW = Math.floor(remW / Math.max(1, otherColsCount));

    const colWidths: number[] = [];
    for (let c = 0; c < numCols; c++) {
      if (c === 0 && firstColIsNo) {
        colWidths.push(noColW);
      } else if (c === numCols - 1) {
        const used = colWidths.reduce((a, b) => a + b, 0);
        colWidths.push(Math.max(400, totalTableW - used));
      } else {
        colWidths.push(eachOtherW);
      }
    }

    const cellPad = { top: 60, bottom: 60, left: 80, right: 80 };

    const headerRow = new TableRow({
      tableHeader: true,
      children: model.columns.map((col, cIdx) =>
        new TableCell({
          width: { size: colWidths[cIdx], type: WidthType.DXA },
          borders: SOLID_CELL_BORDERS,
          margins: cellPad,
          verticalAlign: VerticalAlign.CENTER,
          children: (col || '')
            .split('\n')
            .map(
              (ln) =>
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 20, after: 20 },
                  children: runsFromMarkup(ln.trim(), { size: 10, defaultBold: true }),
                })
            ),
        })
      ),
    });

    const bodyRows: TableRow[] = model.rows.map((row) => {
      const cells: TableCell[] = [];
      row.forEach((cell, cIdx) => {
        if (cell.isHidden) return;
        const cSpan = Math.max(1, cell.colSpan || 1);
        const rSpan = Math.max(1, cell.rowSpan || 1);
        let spanW = 0;
        for (let k = cIdx; k < Math.min(numCols, cIdx + cSpan); k++) {
          spanW += colWidths[k] || eachOtherW;
        }
        const rawLines = (cell.text || '').split('\n');
        cells.push(
          new TableCell({
            width: { size: spanW, type: WidthType.DXA },
            columnSpan: cSpan > 1 ? cSpan : undefined,
            rowSpan: rSpan > 1 ? rSpan : undefined,
            borders: SOLID_CELL_BORDERS,
            margins: cellPad,
            verticalAlign: VerticalAlign.CENTER,
            children: rawLines.map(
              (ln) =>
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 20, after: 20 },
                  children: runsFromMarkup(ln, { size: 10, defaultBold: false }),
                })
            ),
          })
        );
      });
      return new TableRow({ children: cells });
    });

    return new Table({
      alignment: AlignmentType.CENTER,
      width: { size: totalTableW, type: WidthType.DXA },
      columnWidths: colWidths,
      borders: SOLID_TABLE_BORDERS,
      rows: [headerRow, ...bodyRows],
    });
  } catch {
    return null;
  }
}

// ─── Kop Surat Resmi Komdigi (Logo Kiri + Teks Kanan + Garis Ganda) ──────────

async function buildKop(kopTipe: KopSuratTipe = 'pusaka'): Promise<(Paragraph | Table)[]> {
  const logoBytes = await fetchKomdigiLogoBytes();

  const headerParagraphs: Paragraph[] =
    kopTipe === 'sekjen'
      ? [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 20, after: 30 },
            children: [t('KEMENTERIAN KOMUNIKASI DAN DIGITAL RI', { bold: true, size: 14.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 0 },
            children: [t('SEKRETARIAT JENDERAL', { bold: true, size: 14.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 260, after: 20 },
            children: [
              t('Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735 ', { size: 8.5 }),
              t('www.komdigi.go.id', { size: 8.5, underline: true }),
            ],
          }),
        ]
      : kopTipe === 'djed'
      ? [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 10 },
            children: [t('KEMENTERIAN KOMUNIKASI DAN DIGITAL RI', { bold: true, size: 14 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 10 },
            children: [t('DIREKTORAT JENDERAL EKOSISTEM DIGITAL', { bold: true, size: 13.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 0 },
            children: [t('SEKRETARIAT DIREKTORAT JENDERAL EKOSISTEM DIGITAL', { bold: true, size: 10.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 110, after: 20 },
            children: [
              t('Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735 ', { size: 8.5 }),
              t('www.komdigi.go.id', { size: 8.5, underline: true }),
            ],
          }),
        ]
      : [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 10 },
            children: [t('KEMENTERIAN KOMUNIKASI DAN DIGITAL RI', { bold: true, size: 14.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 10 },
            children: [t('SEKRETARIAT JENDERAL', { bold: true, size: 14.5 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 0 },
            children: [t('PUSAT KEBIJAKAN STRATEGIS', { bold: true, size: 14 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 110, after: 20 },
            children: [
              t('Jl. Medan Merdeka Barat No. 9, Jakarta 10110 Telp./Fax. (021) 3503735 ', { size: 8.5 }),
              t('www.komdigi.go.id', { size: 8.5, underline: true }),
            ],
          }),
        ];

  const kopTable = new Table({
    width: { size: 9600, type: WidthType.DXA },
    columnWidths: [2450, 7150],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 18, color: '000000' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2450, type: WidthType.DXA },
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { top: 0, bottom: 35, left: 0, right: 100 },
            borders: {
              ...CELL_NO_BORDERS,
              bottom: { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 18, color: '000000' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 20 },
                children: logoBytes
                  ? [
                      new ImageRun({
                        data: logoBytes,
                        transformation: { width: 126, height: 91 },
                        type: 'png',
                      }),
                    ]
                  : [t('KOMDIGI', { bold: true, size: 14 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7150, type: WidthType.DXA },
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { top: 0, bottom: 35, left: 20, right: 0 },
            borders: {
              ...CELL_NO_BORDERS,
              bottom: { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 18, color: '000000' },
            },
            children: headerParagraphs,
          }),
        ],
      }),
    ],
  });

  return [kopTable, spacer(8)];
}

// ─── Main Generator: SURAT TUGAS ──────────────────────────────────────────────

export async function generateSuratTugasDocx(
  form: SuratTugasFormState,
  pegawaiList: Pegawai[],
  pejabat: Pejabat
): Promise<Blob> {
  const count = pegawaiList.length;
  const isLampiran = count > 3;
  const bodySize = 12;

  const tglSurat = normalizeTwoDigitDateText(
    form.custom_tanggal_surat_text || formatTanggalIndonesia(form.tanggal_surat)
  );
  const tglMulai = formatTanggalIndonesia(form.tanggal_mulai);
  const tglSelesai = formatTanggalIndonesia(form.tanggal_selesai);
  const rentang =
    form.tanggal_mulai === form.tanggal_selesai
      ? tglMulai
      : `${tglMulai} s.d. ${tglSelesai}`;

  const defaultDasar = form.instansi_pengundang
    ? `${form.instansi_pengundang} Nomor : ${form.nomor_surat_undangan}${
        form.tanggal_surat_undangan ? ' tanggal ' + formatTanggalIndonesia(form.tanggal_surat_undangan) : ''
      }${form.perihal_undangan ? ' hal ' + form.perihal_undangan : ''}.`
    : form.nomor_surat_undangan
    ? `Nomor ${form.nomor_surat_undangan}${
        form.tanggal_surat_undangan ? ' tanggal ' + formatTanggalIndonesia(form.tanggal_surat_undangan) : ''
      }.`
    : '';

  const defaultMenimbang = form.nama_acara
    ? `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${form.nama_acara}, perlu menugaskan pegawai di lingkungan Pusat Kebijakan Strategis untuk mengikuti kegiatan dimaksud.`
    : '';

  const defaultUntuk =
    form.nama_acara || form.lokasi_kegiatan || form.tanggal_mulai
      ? `Mengikuti kegiatan ${form.nama_acara || ''} yang dilaksanakan pada tanggal ${rentang || ''} di ${form.lokasi_kegiatan || ''}${
          form.kota_kegiatan ? ', ' + form.kota_kegiatan : ''
        }.`
      : '';

  const pembebanan =
    form.pembebanan_anggaran ||
    'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026';

  const sertakanBeban = Boolean(form.sertakan_beban_anggaran);
  const defaultPenutup = sertakanBeban
    ? `Biaya yang timbul akibat pelaksanaan Surat Tugas ini dibebankan pada ${pembebanan}.`
    : '';

  const menimbangText =
    form.menimbang_custom && form.menimbang_custom.trim() !== ''
      ? form.menimbang_custom
      : defaultMenimbang;
  const dasarText =
    form.dasar_custom && form.dasar_custom.trim() !== ''
      ? form.dasar_custom
      : defaultDasar;
  const untukText =
    form.untuk_custom && form.untuk_custom.trim() !== ''
      ? form.untuk_custom
      : defaultUntuk;
  const penutupText = !sertakanBeban
    ? ''
    : form.penutup_custom && form.penutup_custom.trim() !== ''
    ? form.penutup_custom
    : defaultPenutup;

  const jabatanTTD =
    form.custom_jabatan_ttd ||
    (pejabat.is_default ? `${pejabat.jabatan},` : `Plh. ${pejabat.jabatan},`);
  const namaPejabatClean = stripAcademicTitles(form.custom_nama_ttd || pejabat.nama);
  const kotaTanggalStr = `${form.kota_surat || 'Jakarta'}, ${tglSurat}`;

  const children: (Paragraph | Table)[] = [];

  // Kop Surat
  children.push(...(await buildKop(form.kop_tipe)));

  // Judul "SURAT TUGAS" — Arial 14pt bold underline
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [t('SURAT TUGAS', { bold: true, underline: true, size: 14 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [t(`Nomor: ${form.nomor_lengkap || ''}`, { size: bodySize })],
    })
  );

  // Menimbang & Dasar (menggunakan tabel 3 kolom tanpa border agar titik dua sejajar lurus)
  children.push(
    new Table({
      width: { size: 9600, type: WidthType.DXA },
      columnWidths: [1350, 220, 8030],
      borders: NO_BORDERS,
      rows: [
        buildKvTableRow(
          'Menimbang',
          (menimbangText || '').split('\n').map(
            (ln) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 80 },
                children: runsFromMarkup(ln, { size: bodySize }),
              })
          ),
          { labelWidth: 1350, colonWidth: 220, fontSize: bodySize, spaceAfter: 80 }
        ),
        buildKvTableRow(
          'Dasar',
          (dasarText || '').split('\n').map(
            (ln) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 80 },
                children: runsFromMarkup(ln, { size: bodySize }),
              })
          ),
          { labelWidth: 1350, colonWidth: 220, fontSize: bodySize, spaceAfter: 80 }
        ),
      ],
    })
  );

  // MEMBERI TUGAS:
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 100 },
      children: [t('MEMBERI TUGAS:', { bold: true, size: bodySize })],
    })
  );

  // Kepada & Untuk
  let kepadaRightContent: (Paragraph | Table)[] = [];
  if (count === 0) {
    kepadaRightContent = [
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: runsFromMarkup(form.custom_kepada_tugas || '', { size: bodySize }),
      }),
    ];
  } else if (isLampiran) {
    kepadaRightContent = [
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [t(form.custom_kepada_tugas || '(Daftar Terlampir)', { size: bodySize })],
      }),
    ];
  } else if (count === 1) {
    const peg = pegawaiList[0];
    const ov = form.custom_pegawai_overrides?.[peg.id] || {};
    const rowsData: [string, string][] = [
      ['Nama', stripAcademicTitles(ov.nama ?? peg.nama)],
      ['NIP', ov.nip ?? peg.nip],
      ['Pangkat, Gol/Ruang', ov.pangkat_golongan ?? peg.pangkat_golongan],
      ['Jabatan', ov.jabatan ?? peg.jabatan],
    ];
    const pegCellPad = { top: 0, bottom: 10, left: 0, right: 15 };
    const singlePegTable = new Table({
      width: { size: 8030, type: WidthType.DXA },
      columnWidths: [2250, 200, 5580],
      borders: NO_BORDERS,
      rows: rowsData.map(([lbl, val], rIdx) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2250, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: pegCellPad,
              children: [
                new Paragraph({
                  spacing: { before: 0, after: rIdx === 3 ? 60 : 10 },
                  children: [t(lbl, { size: bodySize })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 200, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: pegCellPad,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: rIdx === 3 ? 60 : 10 },
                  children: [t(':', { size: bodySize })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 5580, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: pegCellPad,
              children: [
                new Paragraph({
                  spacing: { before: 0, after: rIdx === 3 ? 60 : 10 },
                  children: [t(String(val || ''), { size: bodySize, bold: false })],
                }),
              ],
            }),
          ],
        })
      ),
    });
    kepadaRightContent = [singlePegTable];
  } else {
    // 2 - 3 pegawai: Tabel 4 kolom tanpa border [No. | Label | : | Nilai] agar 100% lurus rapi di Google Docs & MS Word
    const pegRows: TableRow[] = [];
    const pegCellPad = { top: 0, bottom: 8, left: 0, right: 15 };
    pegawaiList.forEach((peg, pIdx) => {
      const ov = form.custom_pegawai_overrides?.[peg.id] || {};
      const rowsData: [string, string][] = [
        ['Nama', stripAcademicTitles(ov.nama ?? peg.nama)],
        ['NIP', ov.nip ?? peg.nip],
        ['Pangkat, Gol/Ruang', ov.pangkat_golongan ?? peg.pangkat_golongan],
        ['Jabatan', ov.jabatan ?? peg.jabatan],
      ];
      rowsData.forEach(([lbl, val], rIdx) => {
        const isLastField = rIdx === 3;
        const isLastPeg = pIdx === pegawaiList.length - 1;
        const afterSpacing = isLastField ? (isLastPeg ? 50 : count === 3 ? 35 : 60) : 8;
        pegRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 340, type: WidthType.DXA },
                borders: CELL_NO_BORDERS,
                margins: pegCellPad,
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: afterSpacing },
                    children: [t(rIdx === 0 ? `${pIdx + 1}.` : '', { size: bodySize })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 2200, type: WidthType.DXA },
                borders: CELL_NO_BORDERS,
                margins: pegCellPad,
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: afterSpacing },
                    children: [t(lbl, { size: bodySize })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 200, type: WidthType.DXA },
                borders: CELL_NO_BORDERS,
                margins: pegCellPad,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: afterSpacing },
                    children: [t(':', { size: bodySize })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 5290, type: WidthType.DXA },
                borders: CELL_NO_BORDERS,
                margins: pegCellPad,
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: afterSpacing },
                    children: [t(String(val || ''), { size: bodySize, bold: false })],
                  }),
                ],
              }),
            ],
          })
        );
      });
    });

    const multiPegTable = new Table({
      width: { size: 8030, type: WidthType.DXA },
      columnWidths: [340, 2200, 200, 5290],
      borders: NO_BORDERS,
      rows: pegRows,
    });
    kepadaRightContent = [multiPegTable];
  }

  children.push(
    new Table({
      width: { size: 9600, type: WidthType.DXA },
      columnWidths: [1350, 220, 8030],
      borders: NO_BORDERS,
      rows: [
        buildKvTableRow('Kepada', kepadaRightContent, {
          labelWidth: 1350,
          colonWidth: 220,
          fontSize: bodySize,
          spaceAfter: 60,
        }),
        buildKvTableRow(
          'Untuk',
          (untukText || '').split('\n').map(
            (ln) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 80 },
                children: runsFromMarkup(ln, { size: bodySize }),
              })
          ),
          { labelWidth: 1350, colonWidth: 220, fontSize: bodySize, spaceAfter: 80 }
        ),
      ],
    })
  );

  // Penutup
  if (penutupText && penutupText.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 40, after: 40 },
        children: runsFromMarkup(penutupText.trim(), { size: bodySize }),
      })
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 40, after: count === 3 ? 120 : 200 },
      children: runsFromMarkup(
        form.custom_kalimat_penutup_tugas ||
          'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.',
        { size: bodySize }
      ),
    })
  );

  // Tanda Tangan (posisi di kanan, teks rata tengah di dalam kotak tanda tangan, nama tanpa gelar & tidak bold)
  children.push(buildSignatureTable(jabatanTTD, namaPejabatClean, kotaTanggalStr, bodySize));

  // ── Halaman Lampiran Pegawai (jika > 3 pegawai) ──────────────────────────
  if (isLampiran) {
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Header Kanan Atas — Lampiran I Surat Tugas (tidak bold) / Nomor / Tanggal (Tanpa judul "Daftar Pegawai Yang Ditugaskan")
    children.push(
      buildLampiranHeaderMark(
        'Lampiran I Surat Tugas',
        form.nomor_lengkap || '',
        tglSurat,
        false,
        false
      ),
      spacer(8)
    );

    // Tabel daftar pegawai: Kolom judul di-bold & center, Nama pegawai tidak di-bold
    const colW = [550, 2400, 2100, 1950, 2600]; // total 9600 DXA

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['No', 'Nama', 'NIP', 'Pangkat, Gol/Ruang', 'Jabatan'].map((h, i) =>
        new TableCell({
          width: { size: colW[i], type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [t(h, { size: 10.5, bold: true })],
            }),
          ],
        })
      ),
    });

    const dataRows = pegawaiList.map((peg, idx) => {
      const ov = form.custom_pegawai_overrides?.[peg.id] || {};
      return new TableRow({
        children: [
          new TableCell({
            width: { size: colW[0], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [t(`${idx + 1}`, { size: 10.5, bold: false })],
              }),
            ],
          }),
          new TableCell({
            width: { size: colW[1], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [t(stripAcademicTitles(ov.nama ?? peg.nama), { size: 10.5, bold: false })],
              }),
            ],
          }),
          new TableCell({
            width: { size: colW[2], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [t(ov.nip ?? peg.nip, { size: 10.5, bold: false })],
              }),
            ],
          }),
          new TableCell({
            width: { size: colW[3], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [t(ov.pangkat_golongan ?? peg.pangkat_golongan, { size: 10.5, bold: false })],
              }),
            ],
          }),
          new TableCell({
            width: { size: colW[4], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [t(ov.jabatan ?? peg.jabatan, { size: 10.5, bold: false })],
              }),
            ],
          }),
        ],
      });
    });

    children.push(
      new Table({
        alignment: AlignmentType.CENTER,
        columnWidths: colW,
        rows: [headerRow, ...dataRows],
        width: { size: 9600, type: WidthType.DXA },
      }),
      spacer(12),
      buildSignatureTable(jabatanTTD, namaPejabatClean, kotaTanggalStr, 12)
    );
  }

  const doc = new Document({
    sections: buildDocumentSectionsWithLampiran(
      children,
      form.lampiran_items,
      form.nomor_lengkap,
      tglSurat,
      isLampiran ? 1 : 0
    ),
  });

  return await Packer.toBlob(doc);
}

// ─── Main Generator: SURAT UNDANGAN ───────────────────────────────────────────

export async function generateSuratUndanganDocx(
  form: SuratTugasFormState,
  pejabat: Pejabat
): Promise<Blob> {
  const tglSurat = normalizeTwoDigitDateText(
    form.custom_tanggal_surat_text || formatTanggalIndonesia(form.tanggal_surat)
  );
  const jabatanTTD =
    form.custom_jabatan_ttd ||
    (pejabat.is_default ? `${pejabat.jabatan},` : `Plh. ${pejabat.jabatan},`);
  const namaPejabatClean = stripAcademicTitles(form.custom_nama_ttd || pejabat.nama);
  const kotaTanggalStr = `${form.kota_surat || 'Jakarta'}, ${tglSurat}`;
  const children: (Paragraph | Table)[] = [];

  // Kop Surat (Logo Komdigi + Teks Kop + Garis Ganda)
  children.push(...(await buildKop(form.kop_tipe)));

  // Header 2 Kolom: Kiri (Tabel 3 kolom Nomor/Sifat/Lampiran/Hal), Kanan (Jakarta, Tanggal)
  const leftMetaTable = new Table({
    width: { size: 5800, type: WidthType.DXA },
    columnWidths: [1150, 200, 4450],
    borders: NO_BORDERS,
    rows: [
      buildKvTableRow(
        'Nomor',
        [new Paragraph({ spacing: { after: 30 }, children: [t(form.nomor_lengkap || '')] })],
        { labelWidth: 1150, colonWidth: 200, totalWidth: 5800, spaceAfter: 30 }
      ),
      buildKvTableRow(
        'Sifat',
        [new Paragraph({ spacing: { after: 30 }, children: [t(form.undangan_sifat || 'Biasa')] })],
        { labelWidth: 1150, colonWidth: 200, totalWidth: 5800, spaceAfter: 30 }
      ),
      buildKvTableRow(
        'Lampiran',
        [new Paragraph({ spacing: { after: 30 }, children: [t(form.undangan_lampiran || '-')] })],
        { labelWidth: 1150, colonWidth: 200, totalWidth: 5800, spaceAfter: 30 }
      ),
      buildKvTableRow(
        'Hal',
        [new Paragraph({ spacing: { after: 30 }, children: runsFromMarkup(form.undangan_hal || '') })],
        { labelWidth: 1150, colonWidth: 200, totalWidth: 5800, spaceAfter: 30 }
      ),
    ],
  });

  const headerTable = new Table({
    width: { size: 9600, type: WidthType.DXA },
    columnWidths: [5800, 3800],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5800, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            children: [leftMetaTable],
          }),
          new TableCell({
            width: { size: 3800, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [t(kotaTanggalStr)],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(headerTable, spacer(8));

  // Kepada Yth. (sama persis dengan preview web: jika kosong tetap kosong, tidak diganti '-')
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [t('Kepada Yth.')],
    })
  );
  const kepadaLines = (form.undangan_kepada || '').split('\n');
  kepadaLines.forEach((ln, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: idx === kepadaLines.length - 1 ? 140 : 20 },
        children: runsFromMarkup(ln),
      })
    );
  });

  // Paragraf Pembuka
  if (form.undangan_pembuka && form.undangan_pembuka.trim()) {
    form.undangan_pembuka.split('\n').forEach((ln) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 480 },
          spacing: { after: 120 },
          children: runsFromMarkup(ln.trim()),
        })
      );
    });
  } else {
    children.push(spacer(8));
  }

  // Rincian Acara (Hari, Tanggal / Waktu / Tempat / Agenda)
  const hariTglVal = normalizeTwoDigitDateText(
    form.undangan_hari_tanggal || form.hari_tanggal_pelaksanaan || tglSurat || ''
  );
  const waktuVal = form.undangan_waktu || form.waktu_kegiatan || '';

  const cleanOnline = cleanTempatField(form.undangan_tempat_online, 'online');
  const cleanOffline = cleanTempatField(form.undangan_tempat_offline || form.lokasi_kegiatan, 'offline');
  const onlineDisplay =
    form.undangan_tempat_online_custom !== undefined
      ? form.undangan_tempat_online_custom
      : `**online** via tautan ${cleanOnline}`;
  const offlineDisplay =
    form.undangan_tempat_offline_custom !== undefined
      ? form.undangan_tempat_offline_custom
      : `**offline** di ${cleanOffline}`;

  let tempatParagraphs: Paragraph[] = [];
  if (form.undangan_tipe_tempat === 'online') {
    tempatParagraphs = [
      new Paragraph({
        spacing: { after: 40 },
        children: runsFromMarkup(onlineDisplay),
      }),
    ];
  } else if (form.undangan_tipe_tempat === 'hybrid') {
    tempatParagraphs = [
      new Paragraph({ spacing: { after: 20 }, children: runsFromMarkup(onlineDisplay) }),
      new Paragraph({ spacing: { after: 40 }, children: runsFromMarkup(offlineDisplay) }),
    ];
  } else {
    tempatParagraphs = [
      new Paragraph({
        spacing: { after: 40 },
        children: runsFromMarkup(cleanOffline),
      }),
    ];
  }

  const agendaLines = (form.undangan_agenda || '').split('\n');
  const agendaParagraphs = agendaLines.map(
    (ln) =>
      new Paragraph({
        spacing: { after: 40 },
        children: runsFromMarkup(ln),
      })
  );

  // Tabel Rincian Acara dengan indent kiri (~300 DXA) seperti di preview web
  children.push(
    new Table({
      width: { size: 9300, type: WidthType.DXA },
      columnWidths: [1650, 220, 7430],
      indent: { size: 300, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        buildKvTableRow(
          'Hari, Tanggal',
          [new Paragraph({ spacing: { after: 40 }, children: [t(hariTglVal)] })],
          { labelWidth: 1650, colonWidth: 220, totalWidth: 9300, spaceAfter: 40 }
        ),
        buildKvTableRow(
          'Waktu',
          [new Paragraph({ spacing: { after: 40 }, children: [t(waktuVal)] })],
          { labelWidth: 1650, colonWidth: 220, totalWidth: 9300, spaceAfter: 40 }
        ),
        buildKvTableRow('Tempat', tempatParagraphs, {
          labelWidth: 1650,
          colonWidth: 220,
          totalWidth: 9300,
          spaceAfter: 40,
        }),
        buildKvTableRow('Agenda', agendaParagraphs, {
          labelWidth: 1650,
          colonWidth: 220,
          totalWidth: 9300,
          spaceAfter: 40,
        }),
      ],
    }),
    spacer(8)
  );

  // Paragraf Penutup
  if (form.undangan_penutup && form.undangan_penutup.trim()) {
    form.undangan_penutup.split('\n').forEach((ln) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 480 },
          spacing: { after: 180 },
          children: runsFromMarkup(ln.trim()),
        })
      );
    });
  } else {
    children.push(spacer(12));
  }

  // Tanda Tangan (posisi di kanan, teks jabatan & nama rata tengah di dalam blok TTD seperti preview web)
  children.push(buildSignatureTable(jabatanTTD, namaPejabatClean));

  // Tembusan jika ada
  if (form.undangan_tembusan && form.undangan_tembusan.trim()) {
    children.push(
      spacer(10),
      new Paragraph({
        spacing: { after: 40 },
        children: [t('Tembusan disampaikan kepada Yth.', { bold: true, size: 10 })],
      })
    );
    form.undangan_tembusan.split('\n').forEach((tmb) => {
      if (tmb.trim()) {
        children.push(
          new Paragraph({
            spacing: { after: 20 },
            children: runsFromMarkup(tmb.trim(), { size: 10 }),
          })
        );
      }
    });
  }

  const undanganLampiranItems = form.undangan_lampiran_items || form.lampiran_items || [];
  const doc = new Document({
    sections: buildDocumentSectionsWithLampiran(
      children,
      undanganLampiranItems,
      form.nomor_lengkap,
      tglSurat,
      0
    ),
  });
  return await Packer.toBlob(doc);
}

// ─── Helper Penanda Kanan Atas Lampiran ──────────────────────────────────────

function buildLampiranHeaderMark(
  labelMark: string,
  nomorLengkap: string,
  tanggalSuratFormatted: string,
  withLampiranColon = false,
  boldLabel = false,
  leftSpacerWidth = 5200
): Table {
  const cellPad = {
    top: 15,
    bottom: 15,
    left: 0,
    right: 0,
  };

  const makeEmptyLeftCell = () =>
    new TableCell({
      width: { size: leftSpacerWidth, type: WidthType.DXA },
      borders: CELL_NO_BORDERS,
      margins: cellPad,
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
    });

  const makeKvRow4Cols = (label: string, valText: string, isBoldVal = false) =>
    new TableRow({
      children: [
        makeEmptyLeftCell(),
        new TableCell({
          width: { size: 900, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          margins: cellPad,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { before: 0, after: 20 },
              children: [t(label, { size: 10, bold: false })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 160, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          margins: cellPad,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 20 },
              children: [t(':', { size: 10, bold: false })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3340, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          margins: cellPad,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { before: 0, after: 20 },
              children: [t(valText, { size: 10, bold: isBoldVal })],
            }),
          ],
        }),
      ],
    });

  const rows: TableRow[] = [];
  if (withLampiranColon) {
    rows.push(makeKvRow4Cols('Lampiran', labelMark, boldLabel));
  } else {
    rows.push(
      new TableRow({
        children: [
          makeEmptyLeftCell(),
          new TableCell({
            width: { size: 4400, type: WidthType.DXA },
            columnSpan: 3,
            borders: CELL_NO_BORDERS,
            margins: cellPad,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 20 },
                children: [t(labelMark, { size: 10, bold: boldLabel })],
              }),
            ],
          }),
        ],
      })
    );
  }

  rows.push(
    makeKvRow4Cols('Nomor', nomorLengkap || '-'),
    makeKvRow4Cols('Tanggal', tanggalSuratFormatted || '-')
  );

  return new Table({
    width: { size: leftSpacerWidth + 4400, type: WidthType.DXA },
    columnWidths: [leftSpacerWidth, 900, 160, 3340],
    borders: NO_BORDERS,
    rows,
  });
}

function toRomanNum(num: number): string {
  const n = Math.max(1, Math.floor(num));
  const romanMap: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let res = '';
  let cur = n;
  for (const [val, sym] of romanMap) {
    while (cur >= val) {
      res += sym;
      cur -= val;
    }
  }
  return res || 'I';
}

/**
 * Helper untuk membangun array Section Word (ISectionOptions[]) beserta halaman lampiran.
 * - Halaman surat utama & lampiran teks/tabel menggunakan margin standar naskah dinas (top: 680, bottom: 900, left: 1230, right: 1080 DXA).
 * - Halaman lampiran dokumen terunggah (PDF multi-halaman / Gambar) ditempatkan pada Section tersendiri dengan margin ekstra tipis
 *   (left: 200, right: 200, top: 160..280, bottom: 150 DXA) agar gambar dokumen tampil HAMPIR FULL UKURAN KERTAS A4 di Google Docs & Word!
 */
function buildDocumentSectionsWithLampiran(
  mainChildren: (Paragraph | Table)[],
  items: LampiranItem[] | undefined,
  nomorLengkap: string,
  tanggalSuratFormatted: string,
  romanOffset: number = 0
) {
  const standardPageProps = {
    page: {
      margin: {
        top: 680,
        bottom: 900,
        left: 1230,
        right: 1080,
      },
    },
  };

  const sections: { properties: any; children: (Paragraph | Table)[] }[] = [];
  let currentStandardChildren: (Paragraph | Table)[] = [...mainChildren];

  const flushStandardSection = () => {
    if (currentStandardChildren.length > 0) {
      sections.push({
        properties: standardPageProps,
        children: currentStandardChildren,
      });
      currentStandardChildren = [];
    }
  };

  if (items && items.length > 0) {
    items.forEach((item, idx) => {
      const isUploadedDoc =
        item.tipe === 'upload' || (item.pdf_pages_images && item.pdf_pages_images.length > 0);
      const autoRomanMark = `Lampiran ${toRomanNum(idx + 1 + romanOffset)}`;
      const effectiveLabelMark =
        !item.label_mark || /^Lampiran\s+[IVXLCDM\d]+$/i.test(item.label_mark.trim())
          ? autoRomanMark
          : item.label_mark;

      // Gabungkan halaman gambar dari PDF multi-halaman maupun unggahan gambar tunggal
      const uploadedPageUrls =
        item.pdf_pages_images && item.pdf_pages_images.length > 0
          ? item.pdf_pages_images
          : item.file_type?.startsWith('image/') && item.file_data
          ? [item.file_data]
          : [];

      if (uploadedPageUrls.length > 0) {
        flushStandardSection();

        uploadedPageUrls.forEach((pageDataUrl, pIdx) => {
          const imgBytes = dataUrlToUint8Array(pageDataUrl);
          if (!imgBytes) return;

          const hasTopMark = pIdx === 0 && !item.tanpa_mark;
          const imgSize = computeFullPageImageSize(imgBytes, hasTopMark);
          const isJpeg =
            pageDataUrl.startsWith('data:image/jpeg') || pageDataUrl.startsWith('data:image/jpg');

          const pageChildren: (Paragraph | Table)[] = [];
          if (hasTopMark) {
            // Dengan margin kiri/kanan 200 DXA, lebar area cetak adalah ~11500 DXA.
            // Gunakan leftSpacerWidth = 6200 DXA (+ 4400 DXA = 10600 DXA) agar posisi mark kanan atas sejajar rapi dengan halaman lain.
            pageChildren.push(
              buildLampiranHeaderMark(
                effectiveLabelMark,
                nomorLengkap || '-',
                tanggalSuratFormatted || '-',
                false,
                false,
                6200
              ),
              spacer(3)
            );
          }

          pageChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: {
                    width: imgSize.width,
                    height: imgSize.height,
                  },
                  type: isJpeg ? 'jpg' : 'png',
                }),
              ],
            })
          );

          sections.push({
            properties: {
              page: {
                margin: {
                  top: hasTopMark ? 280 : 160,
                  bottom: 150,
                  left: 200,
                  right: 200,
                },
              },
            },
            children: pageChildren,
          });
        });
        return;
      }

      // Jika item adalah PDF terunggah tanpa halaman gambar (misal sesi lama), lewati agar tidak menampilkan teks mentah
      if (
        item.tipe === 'upload' &&
        (item.file_type === 'application/pdf' || item.file_name?.toLowerCase().endsWith('.pdf'))
      ) {
        return;
      }

      // Untuk lampiran Teks / Tabel: tambahkan PageBreak jika masih di dalam section standar yang sama
      if (currentStandardChildren.length > 0) {
        currentStandardChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }

      // Penanda Kanan Atas Resmi (kecuali tanpa_mark)
      if (!item.tanpa_mark) {
        currentStandardChildren.push(
          buildLampiranHeaderMark(
            effectiveLabelMark,
            nomorLengkap || '-',
            tanggalSuratFormatted || '-'
          ),
          spacer(8)
        );
      }

      // Judul Lampiran & Sub Judul HANYA ditampilkan untuk lampiran Buat Teks/Tabel (BUKAN unggahan dokumen)
      if (!isUploadedDoc && !item.tanpa_mark) {
        if (item.judul) {
          currentStandardChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: item.sub_judul ? 60 : 180 },
              children: [t(stripMarkup(item.judul).toUpperCase(), { bold: true, size: 11 })],
            })
          );
        }
        if (item.sub_judul) {
          currentStandardChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 180 },
              children: [t(stripMarkup(item.sub_judul), { bold: true, size: 10.5 })],
            })
          );
        }
      }

      // Isi Dokumen (Tabel HTML, Tabel Markdown, atau Teks Daftar Undangan / Bebas)
      const textContent = item.isi || item.extracted_text;
      if (textContent) {
        const trimmedContent = textContent.trim();
        const isTableContent =
          trimmedContent.includes('<table') ||
          trimmedContent.split('\n').some((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));
        if (isTableContent) {
          const docxTable = parseHtmlTableToDocx(trimmedContent);
          if (docxTable) {
            currentStandardChildren.push(docxTable);
            return;
          }
        }

        textContent.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed) {
            const plainTrimmed = stripMarkup(trimmed);
            const isSatkerHeading = /^[A-Z]\.\s+/.test(plainTrimmed);
            const isMemberLine = /^(\d+\.|[\-\*•])\s+/.test(plainTrimmed);

            currentStandardChildren.push(
              new Paragraph({
                alignment: isSatkerHeading || isMemberLine ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
                indent: isMemberLine ? { left: 360 } : undefined,
                spacing: { before: isSatkerHeading ? 80 : 0, after: 40 },
                children: isSatkerHeading
                  ? [t(plainTrimmed, { size: 10.5, bold: true })]
                  : isMemberLine
                  ? [t(plainTrimmed, { size: 10.5, bold: false })]
                  : runsFromMarkup(trimmed, { size: 10.5 }),
              })
            );
          } else {
            currentStandardChildren.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
          }
        });
      }
    });
  }

  flushStandardSection();
  return sections;
}

// ─── Main Generator: NOTA DINAS ───────────────────────────────────────────────

export async function generateNotaDinasDocx(
  form: SuratTugasFormState,
  pejabat: Pejabat
): Promise<Blob> {
  const tglSurat = normalizeTwoDigitDateText(
    form.custom_tanggal_surat_text || formatTanggalIndonesia(form.tanggal_surat)
  );
  const jabatanTTD =
    form.custom_jabatan_ttd ||
    (pejabat.is_default ? `${pejabat.jabatan},` : `Plh. ${pejabat.jabatan},`);
  const namaPejabatClean = stripAcademicTitles(form.custom_nama_ttd || pejabat.nama);
  const children: (Paragraph | Table)[] = [];

  // Kop Surat (Logo Komdigi + Teks Kop + Garis Ganda)
  children.push(...(await buildKop(form.kop_tipe)));

  // Judul "NOTA DINAS" menggunakan font Arial 14pt
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [t('NOTA DINAS', { bold: true, underline: true, size: 14 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [t(`Nomor: ${form.nomor_lengkap || ''}`, { size: 12 })],
    })
  );

  // Tabel Atribut Nota Dinas (3 kolom tanpa border agar titik dua rata lurus sempurna)
  const attrRows: [string, string][] = [
    ['Kepada Yth.', form.nota_kepada || ''],
    ['Dari', form.nota_dari || ''],
    ['Hal', form.nota_hal || ''],
    ['Sifat', form.nota_sifat || 'Biasa'],
    ['Lampiran', form.nota_lampiran || '-'],
    ['Tanggal', tglSurat],
  ];

  children.push(
    new Table({
      width: { size: 9600, type: WidthType.DXA },
      columnWidths: [1650, 220, 7730],
      borders: NO_BORDERS,
      rows: attrRows.map(([label, val]) =>
        buildKvTableRow(
          label,
          [new Paragraph({ spacing: { after: 40 }, children: runsFromMarkup(val) })],
          { labelWidth: 1650, colonWidth: 220, totalWidth: 9600, spaceAfter: 40 }
        )
      ),
    })
  );

  // Garis batas tipis di bawah atribut Nota Dinas
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      spacing: { before: 60, after: 140 },
      children: [],
    })
  );

  // Gabungkan nota_pembuka, nota_isi, dan nota_penutup sama persis seperti di SuratPreview.tsx
  const combinedNotaLines = [form.nota_pembuka, form.nota_isi, form.nota_penutup]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join('\n')
    .split('\n');

  combinedNotaLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^(?:---|===|\[halaman baru\]|\[pagebreak\])$/i.test(trimmed)) return;

    const plainLine = stripMarkup(trimmed);
    const isKv = /^(Nama(?:\s+Pegawai|\s+Lengkap)?|NIP|NIK|Pangkat(?:\s*\/\s*Gol(?:\.\s*Ruang|\s*Ruang)?|\s+saat\s+ini|\s+yang\s+dituju)?|Golongan(?:\s*\/\s*Ruang)?|Jabatan(?:\s+Baru|\s+Lama|\s+saat\s+ini|\s+yang\s+dituju)?|Kelas\s+Jabatan(?:\s+Semula|\s+Usulan)?|Unit\s+Kerja|Instansi|TMT(?:\s+Jabatan|\s+Pangkat)?|Pendidikan|Masa\s+Kerja|Alamat\s+Email|Akun\s+Pengguna|Nomor\s+SK|Tautan(?:\s+Berkas|\s+Data)?|Narahubung|PIC)\s*:\s*(.+)$/i.test(
      plainLine
    );
    if (isKv) {
      const colonIdx = plainLine.indexOf(':');
      const keyStr = plainLine.slice(0, colonIdx).trim();
      const valStr = plainLine.slice(colonIdx + 1).trim();
      children.push(
        new Table({
          width: { size: 9120, type: WidthType.DXA },
          columnWidths: [2200, 220, 6700],
          indent: { size: 480, type: WidthType.DXA },
          borders: NO_BORDERS,
          rows: [
            buildKvTableRow(
              keyStr,
              [new Paragraph({ spacing: { after: 30 }, children: [t(valStr)] })],
              { labelWidth: 2200, colonWidth: 220, totalWidth: 9120, spaceAfter: 30 }
            ),
          ],
        })
      );
    } else {
      const isMainNum = /^\s*\d+[\.\)]\s+/i.test(plainLine);
      const isSubPoint = /^\s*([a-zA-Z][\.\)]|\([0-9a-zA-Z]\)|[\-\*•])\s+/i.test(plainLine);
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: isMainNum
            ? { left: 360, hanging: 360 }
            : isSubPoint
            ? { left: 540, hanging: 280 }
            : { firstLine: 480 },
          spacing: { after: 80 },
          children: runsFromMarkup(trimmed),
        })
      );
    }
  });

  children.push(spacer(10));

  // TTD (posisi di kanan, teks jabatan & nama rata tengah di dalam blok TTD seperti preview web)
  children.push(buildSignatureTable(jabatanTTD, namaPejabatClean));

  // Tembusan jika ada
  if (form.nota_tembusan && form.nota_tembusan.trim()) {
    children.push(
      spacer(10),
      new Paragraph({
        spacing: { after: 40 },
        children: [t('Tembusan disampaikan kepada Yth.', { bold: true, size: 10 })],
      })
    );
    form.nota_tembusan.split('\n').forEach((tmb) => {
      if (tmb.trim()) {
        children.push(
          new Paragraph({
            spacing: { after: 20 },
            children: runsFromMarkup(tmb.trim(), { size: 10 }),
          })
        );
      }
    });
  }

  const notaLampiranItems = form.nota_lampiran_items || form.lampiran_items || [];
  const doc = new Document({
    sections: buildDocumentSectionsWithLampiran(
      children,
      notaLampiranItems,
      form.nomor_lengkap,
      tglSurat,
      0
    ),
  });
  return await Packer.toBlob(doc);
}

/**
 * Universal export function yang otomatis mendistribusikan ke generator sesuai jenis_naskah
 */
export async function exportNaskahDinasDocx(
  form: SuratTugasFormState,
  pegawaiList: Pegawai[],
  pejabat: Pejabat
): Promise<Blob> {
  if (form.jenis_naskah === 'UNDANGAN') {
    return generateSuratUndanganDocx(form, pejabat);
  }
  if (form.jenis_naskah === 'NOTA_DINAS') {
    return generateNotaDinasDocx(form, pejabat);
  }
  return generateSuratTugasDocx(form, pegawaiList, pejabat);
}
