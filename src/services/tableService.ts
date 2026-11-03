export interface TableCellModel {
  text: string;
  colSpan?: number;
  rowSpan?: number;
  isHidden?: boolean;
}

export interface TableModel {
  columns: string[];
  rows: TableCellModel[][];
}

/**
 * Isian awal default: TABEL KOSONGAN (Hanya header dan sel kosong siap diisi)
 */
export const DEFAULT_BLANK_TABLE: TableModel = {
  columns: ['No', 'Kolom 1', 'Kolom 2', 'Kolom 3'],
  rows: [
    [{ text: '1' }, { text: '' }, { text: '' }, { text: '' }],
    [{ text: '2' }, { text: '' }, { text: '' }, { text: '' }],
    [{ text: '3' }, { text: '' }, { text: '' }, { text: '' }],
  ],
};

/**
 * Opsi Template Gambaran: Susunan Acara / Rundown Kegiatan
 */
export const TEMPLATE_RUNDOWN_TABLE: TableModel = {
  columns: ['No', 'Waktu', 'Agenda / Pembahasan', 'Narasumber / PIC', 'Keterangan'],
  rows: [
    [
      { text: '1' },
      { text: '08.30 - 09.00 WIB' },
      { text: 'Registrasi dan Presensi Kehadiran Peserta' },
      { text: 'Sekretariat / Panitia' },
      { text: 'Meja Depan' },
    ],
    [
      { text: '2' },
      { text: '09.00 - 09.30 WIB' },
      { text: 'Pembukaan Rapat dan Sambutan Pengantar' },
      { text: 'Kepala Pusat Kebijakan Strategis' },
      { text: 'Ruang Rapat Utama' },
    ],
    [
      { text: '3' },
      { text: '09.30 - 11.30 WIB' },
      { text: 'Pemaparan Substansi dan Pembahasan Draft Rekomendasi Kebijakan' },
      { text: 'Tim Kerja Kebijakan Strategis' },
      { text: 'Diskusi Terarah' },
    ],
    [
      { text: '4' },
      { text: '11.30 - 12.00 WIB' },
      { text: 'Perumusan Tindak Lanjut, Kesimpulan, dan Penutupan' },
      { text: 'Moderator / Pimpinan Rapat' },
      { text: 'Selesai' },
    ],
  ],
};

/**
 * Opsi Template Gambaran: Matriks Program / Rencana Kerja
 */
export const TEMPLATE_MATRIKS_TABLE: TableModel = {
  columns: ['No', 'Program / Kegiatan', 'Target / Output', 'Penanggung Jawab', 'Jadwal Pelaksanaan'],
  rows: [
    [
      { text: '1' },
      { text: 'Penyusunan Naskah Kebijakan' },
      { text: 'Draft Dokumen Kebijakan' },
      { text: 'Tim Perumus' },
      { text: 'Bulan I' },
    ],
    [
      { text: '2' },
      { text: 'Konsultasi Publik dan FGD' },
      { text: 'Laporan Masukan Stakeholder' },
      { text: 'Sekretariat Tim' },
      { text: 'Bulan II' },
    ],
    [
      { text: '3' },
      { text: 'Finalisasi dan Harmonisasi Regulasi' },
      { text: 'Naskah Final Siap Terbit' },
      { text: 'Biro Hukum & PKS' },
      { text: 'Bulan III' },
    ],
  ],
};

// Aliaskan DEFAULT_RUNDOWN_TABLE ke DEFAULT_BLANK_TABLE agar tabel awal bersih kosong
export const DEFAULT_RUNDOWN_TABLE = DEFAULT_BLANK_TABLE;

/**
 * Pastikan struktur 2D tabel selalu konsisten (setiap baris punya tepat columns.length elemen,
 * serta colSpan & rowSpan tidak melebihi batas tabel dan sel cakupan ditandai isHidden: true)
 */
export function normalizeTableModel(model: TableModel): TableModel {
  const numCols = Math.max(1, model.columns.length);
  const numRows = Math.max(1, model.rows.length);

  // Buat grid kosong
  const grid: (TableCellModel | null)[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => null)
  );

  for (let r = 0; r < numRows; r++) {
    const srcRow = model.rows[r] || [];
    for (let c = 0; c < numCols; c++) {
      // Jika sudah ditandai oleh span dari atas/kiri, lewati
      if (grid[r][c] !== null) continue;

      const srcCell = srcRow[c];
      if (!srcCell || srcCell.isHidden) {
        grid[r][c] = { text: srcCell?.text || '', isHidden: false };
        continue;
      }

      const maxColSpan = numCols - c;
      const maxRowSpan = numRows - r;
      const colSpan = Math.max(1, Math.min(srcCell.colSpan || 1, maxColSpan));
      const rowSpan = Math.max(1, Math.min(srcCell.rowSpan || 1, maxRowSpan));

      grid[r][c] = {
        text: srcCell.text || '',
        colSpan: colSpan > 1 ? colSpan : undefined,
        rowSpan: rowSpan > 1 ? rowSpan : undefined,
        isHidden: false,
      };

      for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          if (dr === 0 && dc === 0) continue;
          if (r + dr < numRows && c + dc < numCols) {
            grid[r + dr][c + dc] = {
              text: '',
              isHidden: true,
            };
          }
        }
      }
    }
  }

  const finalRows: TableCellModel[][] = grid.map((row) =>
    row.map((cell) => cell || { text: '', isHidden: false })
  );

  return {
    columns: [...model.columns],
    rows: finalRows,
  };
}

/**
 * Konversi TableModel ke HTML Table resmi A4 yang mendukung colspan, rowspan, dan cetak PDF/Word
 */
export function serializeTableToHtml(rawModel: TableModel): string {
  const model = normalizeTableModel(rawModel);
  const { columns, rows } = model;
  let html =
    '<table data-lampiran-table="true" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 10px; border: 1px solid #000;">\n';
  html += '  <thead>\n    <tr style="background-color: #f8fafc;">\n';
  columns.forEach((col, idx) => {
    html += `      <th style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: ${
      idx === 0 ? 'center' : 'left'
    };">${col || ''}</th>\n`;
  });
  html += '    </tr>\n  </thead>\n  <tbody>\n';

  rows.forEach((row) => {
    html += '    <tr>\n';
    row.forEach((cell, cIdx) => {
      if (cell.isHidden) return;
      const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
      const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
      const align = cIdx === 0 && (!cell.colSpan || cell.colSpan === 1) ? 'center' : 'left';
      html += `      <td${colSpanAttr}${rowSpanAttr} style="border: 1px solid #000; padding: 6px 8px; text-align: ${align}; vertical-align: top;">${
        cell.text || ''
      }</td>\n`;
    });
    html += '    </tr>\n';
  });

  html += '  </tbody>\n</table>';
  return html;
}

/**
 * Parse string teks (HTML Table atau Markdown Table) menjadi TableModel 2D yang utuh & presisi
 */
export function parseTableFromText(rawText: string): TableModel | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  // 1. Coba parse dari HTML Table dengan rekonstruksi matriks 2D penuh (mendukung colspan & rowspan)
  if (trimmed.includes('<table')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'text/html');
      const table = doc.querySelector('table');
      if (table) {
        const ths = Array.from(table.querySelectorAll('thead th, tr:first-child th'));
        const columns: string[] =
          ths.length > 0 ? ths.map((th) => th.textContent?.trim() || '') : [];

        const trs = Array.from(table.querySelectorAll('tbody tr, tr')).filter((tr) => {
          return tr.querySelectorAll('td').length > 0;
        });

        // Hitung jumlah kolom jika header kosong
        let numCols = columns.length;
        if (numCols === 0 && trs.length > 0) {
          const firstRowTds = Array.from(trs[0].querySelectorAll('td'));
          numCols = firstRowTds.reduce((acc, td) => {
            const cs = td.hasAttribute('colspan')
              ? parseInt(td.getAttribute('colspan') || '1', 10)
              : 1;
            return acc + Math.max(1, cs);
          }, 0);
          for (let i = 0; i < numCols; i++) {
            columns.push(i === 0 ? 'No' : `Kolom ${i}`);
          }
        }

        const numRows = trs.length;
        if (numCols > 0 && numRows > 0) {
          // Matriks 2D berukuran numRows x numCols
          const grid: (TableCellModel | null)[][] = Array.from({ length: numRows }, () =>
            Array.from({ length: numCols }, () => null)
          );

          trs.forEach((tr, rIdx) => {
            const tds = Array.from(tr.querySelectorAll('td'));
            let cIdx = 0;

            tds.forEach((td) => {
              // Cari kolom kosong berikutnya di baris rIdx yang belum ditempati oleh rowspan dari atas
              while (cIdx < numCols && grid[rIdx][cIdx] !== null) {
                cIdx++;
              }
              if (cIdx >= numCols) return;

              const rawColSpan = td.hasAttribute('colspan')
                ? parseInt(td.getAttribute('colspan') || '1', 10)
                : 1;
              const rawRowSpan = td.hasAttribute('rowspan')
                ? parseInt(td.getAttribute('rowspan') || '1', 10)
                : 1;

              const colSpan = Math.max(1, Math.min(rawColSpan, numCols - cIdx));
              const rowSpan = Math.max(1, Math.min(rawRowSpan, numRows - rIdx));

              grid[rIdx][cIdx] = {
                text: td.textContent?.trim() || '',
                colSpan: colSpan > 1 ? colSpan : undefined,
                rowSpan: rowSpan > 1 ? rowSpan : undefined,
                isHidden: false,
              };

              // Tandai sel yang tertutup oleh colspan/rowspan sebagai isHidden: true
              for (let dr = 0; dr < rowSpan; dr++) {
                for (let dc = 0; dc < colSpan; dc++) {
                  if (dr === 0 && dc === 0) continue;
                  if (rIdx + dr < numRows && cIdx + dc < numCols) {
                    grid[rIdx + dr][cIdx + dc] = {
                      text: '',
                      isHidden: true,
                    };
                  }
                }
              }

              cIdx += colSpan;
            });
          });

          const rows: TableCellModel[][] = grid.map((row) =>
            row.map((cell) => cell || { text: '', isHidden: false })
          );

          return { columns, rows };
        }
      }
    } catch (e) {
      console.warn('Gagal parse HTML table:', e);
    }
  }

  // 2. Coba parse dari Markdown Table
  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const isMdTable = lines.some((l) => l.startsWith('|') && l.endsWith('|'));
  if (isMdTable) {
    const tableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));
    if (tableLines.length >= 2) {
      const parseCells = (line: string) =>
        line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

      const columns = parseCells(tableLines[0]);
      const dataLines = tableLines.slice(1).filter((l) => !l.replace(/[|\s-:]/g, '') === false);

      const rows: TableCellModel[][] = dataLines.map((line) => {
        const cells = parseCells(line);
        return columns.map((_, idx) => ({
          text: cells[idx] === '-' ? '' : cells[idx] || '',
        }));
      });

      if (columns.length > 0 && rows.length > 0) {
        return { columns, rows };
      }
    }
  }

  return null;
}

/**
 * Hitung bounding box seleksi yang sudah dinormalisasi terhadap sel yang ter-merge (colSpan / rowSpan)
 */
export function getExpandedSelectionBounds(
  model: TableModel,
  start: { r: number; c: number },
  end: { r: number; c: number }
): { minR: number; maxR: number; minC: number; maxC: number } {
  let minR = Math.max(0, Math.min(start.r, end.r));
  let maxR = Math.min(model.rows.length - 1, Math.max(start.r, end.r));
  let minC = Math.max(0, Math.min(start.c, end.c));
  let maxC = Math.min(model.columns.length - 1, Math.max(start.c, end.c));

  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < model.rows.length; r++) {
      for (let c = 0; c < model.columns.length; c++) {
        const cell = model.rows[r]?.[c];
        if (!cell || cell.isHidden) continue;

        const rEnd = r + (cell.rowSpan || 1) - 1;
        const cEnd = c + (cell.colSpan || 1) - 1;

        // Cek apakah sel (r..rEnd, c..cEnd) bersinggungan dengan (minR..maxR, minC..maxC)
        const overlapsR = r <= maxR && rEnd >= minR;
        const overlapsC = c <= maxC && cEnd >= minC;

        if (overlapsR && overlapsC) {
          if (r < minR) {
            minR = r;
            changed = true;
          }
          if (rEnd > maxR) {
            maxR = rEnd;
            changed = true;
          }
          if (c < minC) {
            minC = c;
            changed = true;
          }
          if (cEnd > maxC) {
            maxC = cEnd;
            changed = true;
          }
        }
      }
    }
  }

  return { minR, maxR, minC, maxC };
}

/**
 * Membuat tabel baru dengan ukuran Kolom x Baris yang dipilih pengguna
 */
export function createBlankTable(cols: number, rows: number, hasHeaderNo: boolean = true): TableModel {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);

  const columns: string[] = [];
  for (let c = 0; c < safeCols; c++) {
    if (c === 0 && hasHeaderNo) {
      columns.push('No');
    } else {
      columns.push(`Kolom ${hasHeaderNo ? c : c + 1}`);
    }
  }

  const rowList: TableCellModel[][] = [];
  for (let r = 0; r < safeRows; r++) {
    const cells: TableCellModel[] = [];
    for (let c = 0; c < safeCols; c++) {
      if (c === 0 && hasHeaderNo) {
        cells.push({ text: String(r + 1) });
      } else {
        cells.push({ text: '' });
      }
    }
    rowList.push(cells);
  }

  return { columns, rows: rowList };
}

/**
 * Menyisipkan kolom di indeks tertentu (misal tepat di perbatasan antar-kolom)
 */
export function insertColumnAt(rawModel: TableModel, colIndex: number, label?: string): TableModel {
  const model = normalizeTableModel(rawModel);
  const insertIdx = Math.max(0, Math.min(colIndex, model.columns.length));
  const hasNo = model.columns[0]?.toLowerCase() === 'no';
  const newLabel = label || `Kolom ${hasNo ? model.columns.length : model.columns.length + 1}`;

  const nextCols = [
    ...model.columns.slice(0, insertIdx),
    newLabel,
    ...model.columns.slice(insertIdx),
  ];

  const nextRows = model.rows.map((row) => [
    ...row.slice(0, insertIdx),
    { text: '', isHidden: false },
    ...row.slice(insertIdx),
  ]);

  return normalizeTableModel({ columns: nextCols, rows: nextRows });
}

/**
 * Menyisipkan baris di indeks tertentu (misal tepat di perbatasan antar-baris)
 */
export function insertRowAt(rawModel: TableModel, rowIndex: number): TableModel {
  const model = normalizeTableModel(rawModel);
  const insertIdx = Math.max(0, Math.min(rowIndex, model.rows.length));
  const newCells: TableCellModel[] = model.columns.map((col, idx) => {
    if (idx === 0 && col.toLowerCase() === 'no') {
      return { text: String(insertIdx + 1), isHidden: false };
    }
    return { text: '', isHidden: false };
  });

  const nextRows = [
    ...model.rows.slice(0, insertIdx),
    newCells,
    ...model.rows.slice(insertIdx),
  ];

  // Renumber nomor urut jika kolom pertama adalah 'No'
  if (model.columns[0]?.toLowerCase() === 'no') {
    nextRows.forEach((r, i) => {
      if (r[0] && !r[0].isHidden) {
        r[0].text = String(i + 1);
      }
    });
  }

  return normalizeTableModel({ columns: model.columns, rows: nextRows });
}

/**
 * Hapus kolom di indeks tertentu
 */
export function deleteColumnAt(rawModel: TableModel, colIndex: number): TableModel {
  const model = normalizeTableModel(rawModel);
  if (model.columns.length <= 1) return model;

  // Pertama unmerge sel apa pun yang melintasi colIndex agar tidak merusak struktur kolom lain
  let safeModel = model;
  for (let r = 0; r < safeModel.rows.length; r++) {
    safeModel = unmergeCellRange(safeModel, { r, c: colIndex }, { r, c: colIndex });
  }

  const nextCols = safeModel.columns.filter((_, i) => i !== colIndex);
  const nextRows = safeModel.rows.map((row) => row.filter((_, i) => i !== colIndex));
  return normalizeTableModel({ columns: nextCols, rows: nextRows });
}

/**
 * Hapus baris di indeks tertentu
 */
export function deleteRowAt(rawModel: TableModel, rowIndex: number): TableModel {
  const model = normalizeTableModel(rawModel);
  if (model.rows.length <= 1) return model;

  // Pertama unmerge sel apa pun yang melintasi rowIndex agar tidak merusak struktur baris lain
  let safeModel = model;
  for (let c = 0; c < safeModel.columns.length; c++) {
    safeModel = unmergeCellRange(safeModel, { r: rowIndex, c }, { r: rowIndex, c });
  }

  const filtered = safeModel.rows.filter((_, i) => i !== rowIndex);

  if (safeModel.columns[0]?.toLowerCase() === 'no') {
    filtered.forEach((r, i) => {
      if (r[0] && !r[0].isHidden) {
        r[0].text = String(i + 1);
      }
    });
  }
  return normalizeTableModel({ columns: safeModel.columns, rows: filtered });
}

/**
 * Gabungkan (Merge) area sel terpilih [minR..maxR, minC..maxC]
 */
export function mergeCellRange(
  rawModel: TableModel,
  start: { r: number; c: number },
  end: { r: number; c: number }
): TableModel {
  const model = normalizeTableModel(rawModel);
  const { minR, maxR, minC, maxC } = getExpandedSelectionBounds(model, start, end);

  if (minR === maxR && minC === maxC) return model; // Hanya 1 sel, tidak ada yang di-merge

  const colSpan = maxC - minC + 1;
  const rowSpan = maxR - minR + 1;

  // Kumpulkan semua teks dari sel yang tidak hidden dalam rentang
  const textPieces: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = model.rows[r]?.[c];
      if (cell && !cell.isHidden && cell.text && cell.text.trim()) {
        textPieces.push(cell.text.trim());
      }
    }
  }
  const combinedText = textPieces.join(' ');

  const nextRows = model.rows.map((row, rI) =>
    row.map((cell, cI) => {
      if (rI === minR && cI === minC) {
        return {
          text: combinedText,
          colSpan: colSpan > 1 ? colSpan : undefined,
          rowSpan: rowSpan > 1 ? rowSpan : undefined,
          isHidden: false,
        };
      }
      if (rI >= minR && rI <= maxR && cI >= minC && cI <= maxC) {
        return {
          text: '',
          isHidden: true,
          colSpan: undefined,
          rowSpan: undefined,
        };
      }
      return { ...cell };
    })
  );

  return normalizeTableModel({ columns: model.columns, rows: nextRows });
}

/**
 * Pisahkan (Split / Unmerge) semua sel yang di-merge dalam rentang terpilih
 * sehingga kembali sejajar mengikuti baris dan kolom tabel secara simetris.
 */
export function unmergeCellRange(
  rawModel: TableModel,
  start: { r: number; c: number },
  end: { r: number; c: number }
): TableModel {
  const model = normalizeTableModel(rawModel);
  const { minR, maxR, minC, maxC } = getExpandedSelectionBounds(model, start, end);

  const nextRows = model.rows.map((row, rI) =>
    row.map((cell, cI) => {
      if (rI >= minR && rI <= maxR && cI >= minC && cI <= maxC) {
        return {
          text: cell.isHidden ? '' : cell.text,
          isHidden: false,
          colSpan: undefined,
          rowSpan: undefined,
        };
      }
      return { ...cell };
    })
  );

  // Jika kolom 0 adalah 'No' dan ikut di-split, rapikan kembali penomoran barisnya
  if (minC === 0 && model.columns[0]?.toLowerCase() === 'no') {
    nextRows.forEach((r, i) => {
      if (r[0] && !r[0].isHidden && (!r[0].colSpan || r[0].colSpan === 1) && (!r[0].rowSpan || r[0].rowSpan === 1)) {
        r[0].text = String(i + 1);
      }
    });
  }

  return normalizeTableModel({ columns: model.columns, rows: nextRows });
}
