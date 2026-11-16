import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  X,
  Columns,
  Rows,
  Split,
  Table as TableIcon,
  Check,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import {
  TableModel,
  parseTableFromText,
  serializeTableToHtml,
  DEFAULT_BLANK_TABLE,
  TEMPLATE_RUNDOWN_TABLE,
  TEMPLATE_MATRIKS_TABLE,
  createBlankTable,
  insertColumnAt,
  insertRowAt,
  deleteColumnAt,
  mergeCellRange,
  unmergeCellRange,
  getExpandedSelectionBounds,
  normalizeTableModel,
} from '../services/tableService';

interface TableMetrics {
  width: number;
  height: number;
  colRightPositions: number[]; // Posisi X tepat di garis border kanan tiap kolom
  rowBottomPositions: number[]; // Posisi Y tepat di garis border bawah tiap baris
}

/**
 * Hook untuk mengukur posisi pixel garis kolom (<th>) dan garis baris (<tr>) secara presisi dari DOM
 */
function useTableBorderMetrics(
  tableRef: React.RefObject<HTMLTableElement | null>,
  model: TableModel
): { metrics: TableMetrics; updateMetrics: () => void } {
  const [metrics, setMetrics] = useState<TableMetrics>({
    width: 0,
    height: 0,
    colRightPositions: [],
    rowBottomPositions: [],
  });

  const updateMetrics = useCallback(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    const width = tableEl.offsetWidth;
    const height = tableEl.offsetHeight;

    const ths = Array.from(tableEl.querySelectorAll('thead tr:first-child th')) as HTMLElement[];
    const colRightPositions = ths.map((th) => th.offsetLeft + th.offsetWidth);

    const trs = Array.from(tableEl.querySelectorAll('tbody tr')) as HTMLElement[];
    const rowBottomPositions = trs.map((tr) => tr.offsetTop + tr.offsetHeight);

    setMetrics((prev) => {
      if (
        prev.width === width &&
        prev.height === height &&
        prev.colRightPositions.length === colRightPositions.length &&
        prev.rowBottomPositions.length === rowBottomPositions.length &&
        prev.colRightPositions.every((v, i) => v === colRightPositions[i]) &&
        prev.rowBottomPositions.every((v, i) => v === rowBottomPositions[i])
      ) {
        return prev;
      }
      return { width, height, colRightPositions, rowBottomPositions };
    });
  }, [tableRef]);

  useLayoutEffect(() => {
    updateMetrics();
  }, [model, updateMetrics]);

  useEffect(() => {
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  return { metrics, updateMetrics };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. KOMPONEN TABEL KHUSUS KERTAS DOKUMEN PANEL KANAN (SuratPreview)
//    - Tampilan formal murni naskah dinas tanpa toolbar permanen & tanpa scrollbar
//    - Tombol (+) dan garis biru 100% presisi tepat di atas garis kolom & baris
//    - Multi-selection sel dengan tombol Merge & Split muncul saat di-select
// ═════════════════════════════════════════════════════════════════════════════

export interface DocumentPreviewTableProps {
  initialContent: string;
  onChangeContent: (newHtml: string) => void;
  readOnly?: boolean;
}

export const DocumentPreviewTable: React.FC<DocumentPreviewTableProps> = ({
  initialContent,
  onChangeContent,
  readOnly = false,
}) => {
  const [model, setModel] = useState<TableModel>(() => {
    const parsed = parseTableFromText(initialContent);
    return normalizeTableModel(parsed || DEFAULT_BLANK_TABLE);
  });

  // State Multi-selection drag di kertas dokumen (terisolasi per tabel)
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState<boolean>(false);

  // Hover states untuk tombol lingkaran (+) di perbatasan kolom dan baris
  const [hoveredColBorder, setHoveredColBorder] = useState<number | null>(null);
  const [hoveredRowBorder, setHoveredRowBorder] = useState<number | null>(null);

  const debounceTimer = useRef<number | undefined>(undefined);
  const lastCommittedHtmlRef = useRef<string>(serializeTableToHtml(model));
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const { metrics, updateMetrics } = useTableBorderMetrics(tableRef, model);

  // Sync saat initialContent berubah dari luar (misal diedit dari panel kiri)
  useEffect(() => {
    if (initialContent === lastCommittedHtmlRef.current) return;
    const parsed = parseTableFromText(initialContent);
    if (parsed) {
      const normalized = normalizeTableModel(parsed);
      const canonical = serializeTableToHtml(normalized);
      lastCommittedHtmlRef.current = canonical;
      setModel((prev) => (serializeTableToHtml(prev) === canonical ? prev : normalized));
    }
  }, [initialContent]);

  // Klik di luar tabel ini akan menutup seleksi tabel ini
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tableContainerRef.current &&
        !tableContainerRef.current.contains(e.target as Node)
      ) {
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.clearTimeout(debounceTimer.current);
    };
  }, []);

  const commitModel = (nextRawModel: TableModel) => {
    const nextModel = normalizeTableModel(nextRawModel);
    setModel(nextModel);
    window.clearTimeout(debounceTimer.current);
    const html = serializeTableToHtml(nextModel);
    if (html !== lastCommittedHtmlRef.current) {
      lastCommittedHtmlRef.current = html;
      onChangeContent(html);
    }
  };

  // ── Penanganan Multi-Selection Drag ────────────────────────────────────────

  const handleCellMouseDown = (r: number, c: number) => {
    if (readOnly) return;
    setSelectionStart({ r, c });
    setSelectionEnd({ r, c });
    setIsDraggingSelection(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isDraggingSelection || readOnly) return;
    setSelectionEnd({ r, c });
  };

  useEffect(() => {
    if (!isDraggingSelection) return;
    const handleMouseUp = () => {
      setIsDraggingSelection(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingSelection]);

  // Hitung rentang seleksi aktif yang sudah memperhitungkan sel ter-merge
  const selectedBounds = React.useMemo(() => {
    if (!selectionStart || !selectionEnd) return null;
    const { minR, maxR, minC, maxC } = getExpandedSelectionBounds(
      model,
      selectionStart,
      selectionEnd
    );
    const rawMinR = Math.min(selectionStart.r, selectionEnd.r);
    const rawMaxR = Math.max(selectionStart.r, selectionEnd.r);
    const rawMinC = Math.min(selectionStart.c, selectionEnd.c);
    const rawMaxC = Math.max(selectionStart.c, selectionEnd.c);
    const isMultiDrag = rawMaxR > rawMinR || rawMaxC > rawMinC;

    // Hitung jumlah sel visible dalam area
    let visibleCount = 0;
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (!model.rows[r]?.[c]?.isHidden) {
          visibleCount++;
        }
      }
    }

    const totalGridCells = (maxR - minR + 1) * (maxC - minC + 1);
    return {
      minR,
      maxR,
      minC,
      maxC,
      count: totalGridCells,
      visibleCount,
      isMulti: isMultiDrag || visibleCount > 1,
    };
  }, [selectionStart, selectionEnd, model]);

  const isCellSelected = (r: number, c: number) => {
    if (!selectedBounds) return false;
    return (
      r >= selectedBounds.minR &&
      r <= selectedBounds.maxR &&
      c >= selectedBounds.minC &&
      c <= selectedBounds.maxC
    );
  };

  // Cek apakah ada sel yang di-merge dalam seleksi
  const hasMergedCellsInSelection = React.useMemo(() => {
    if (!selectedBounds) return false;
    for (let r = selectedBounds.minR; r <= selectedBounds.maxR; r++) {
      for (let c = selectedBounds.minC; c <= selectedBounds.maxC; c++) {
        const cell = model.rows[r]?.[c];
        if (cell && !cell.isHidden && ((cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1)) {
          return true;
        }
      }
    }
    return false;
  }, [selectedBounds, model]);

  // ── Aksi Floating Toolbar (Hanya Muncul Saat Pengguna Multi-Select / Klik Sel Ter-Merge) ──

  const handleMergeSelected = () => {
    if (!selectedBounds || !selectionStart || !selectionEnd) return;
    const nextModel = mergeCellRange(model, selectionStart, selectionEnd);
    commitModel(nextModel);
    setSelectionStart({ r: selectedBounds.minR, c: selectedBounds.minC });
    setSelectionEnd({ r: selectedBounds.minR, c: selectedBounds.minC });
  };

  const handleUnmergeSelected = () => {
    if (!selectedBounds || !selectionStart || !selectionEnd) return;
    const nextModel = unmergeCellRange(model, selectionStart, selectionEnd);
    commitModel(nextModel);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleDeleteSelectedRows = () => {
    if (!selectedBounds) return;
    const rowsToDelete = selectedBounds.maxR - selectedBounds.minR + 1;
    if (model.rows.length - rowsToDelete < 1) {
      alert('Tabel minimal harus memiliki 1 baris.');
      return;
    }
    // Unmerge dulu area seleksi agar tidak merusak baris lain
    let safeModel = unmergeCellRange(
      model,
      { r: selectedBounds.minR, c: 0 },
      { r: selectedBounds.maxR, c: model.columns.length - 1 }
    );
    const filteredRows = safeModel.rows.filter(
      (_, rIdx) => rIdx < selectedBounds.minR || rIdx > selectedBounds.maxR
    );
    if (safeModel.columns[0]?.toLowerCase() === 'no') {
      filteredRows.forEach((r, i) => {
        if (r[0] && !r[0].isHidden) {
          r[0].text = String(i + 1);
        }
      });
    }
    commitModel({ ...safeModel, rows: filteredRows });
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleDeleteSelectedColumns = () => {
    if (!selectedBounds) return;
    const colsToDelete = selectedBounds.maxC - selectedBounds.minC + 1;
    if (model.columns.length - colsToDelete < 1) {
      alert('Tabel minimal harus memiliki 1 kolom.');
      return;
    }
    let safeModel = unmergeCellRange(
      model,
      { r: 0, c: selectedBounds.minC },
      { r: model.rows.length - 1, c: selectedBounds.maxC }
    );
    const filteredCols = safeModel.columns.filter(
      (_, cIdx) => cIdx < selectedBounds.minC || cIdx > selectedBounds.maxC
    );
    const filteredRows = safeModel.rows.map((row) =>
      row.filter((_, cIdx) => cIdx < selectedBounds.minC || cIdx > selectedBounds.maxC)
    );
    commitModel({ columns: filteredCols, rows: filteredRows });
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Inline edit
  const handleCellBlur = (rIdx: number, cIdx: number, text: string) => {
    if (readOnly) return;
    const trimmed = text.trim();
    if ((model.rows[rIdx]?.[cIdx]?.text || '') === trimmed) return;
    const nextRows = model.rows.map((row, rI) => {
      if (rI !== rIdx) return row;
      const cells = [...row];
      cells[cIdx] = { ...cells[cIdx], text: trimmed };
      return cells;
    });
    commitModel({ ...model, rows: nextRows });
    updateMetrics();
  };

  const handleHeaderBlur = (cIdx: number, text: string) => {
    if (readOnly) return;
    const trimmed = text.trim();
    if ((model.columns[cIdx] || '') === trimmed) return;
    const nextCols = model.columns.map((col, i) => (i === cIdx ? trimmed : col));
    commitModel({ ...model, columns: nextCols });
    updateMetrics();
  };

  return (
    <div
      ref={tableContainerRef}
      onMouseEnter={updateMetrics}
      className="w-full my-3 relative group/doc-table font-sans select-text"
      style={{ overflow: 'visible' }}
    >
      {/* ── FLOATING TOOLBAR AKSI MINI: HANYA MUNCUL KETIKA PENGGUNA MULTI-SELECT / KLIK SEL MERGED ── */}
      {!readOnly && selectedBounds && (selectedBounds.isMulti || hasMergedCellsInSelection) && (
        <div className="no-print absolute -top-10 left-0 z-50 bg-slate-900/95 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl border border-slate-700 animate-fade-in text-[11px] select-none backdrop-blur-xs">
          <span className="text-[10.5px] text-amber-300 font-bold px-1">
            {selectedBounds.count} Sel:
          </span>

          {/* Tombol Merge Sel */}
          {selectedBounds.visibleCount > 1 && (
            <button
              type="button"
              onClick={handleMergeSelected}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Gabung seluruh sel yang diblok menjadi 1 sel (Merge)"
            >
              <Check className="w-3 h-3" />
              <span>Merge Sel</span>
            </button>
          )}

          {/* Tombol Split Sel */}
          {hasMergedCellsInSelection && (
            <button
              type="button"
              onClick={handleUnmergeSelected}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Pisahkan sel kembali sejajar mengikuti baris & kolomnya (Split)"
            >
              <Split className="w-3 h-3" />
              <span>Split Sel</span>
            </button>
          )}

          <div className="w-px h-3.5 bg-slate-600 mx-0.5" />

          {/* Hapus Baris & Kolom Terpilih */}
          <button
            type="button"
            onClick={handleDeleteSelectedRows}
            className="px-1.5 py-0.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-[10.5px] cursor-pointer"
            title="Hapus baris yang diblok"
          >
            Hapus Baris
          </button>

          <button
            type="button"
            onClick={handleDeleteSelectedColumns}
            className="px-1.5 py-0.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-[10.5px] cursor-pointer"
            title="Hapus kolom yang diblok"
          >
            Hapus Kolom
          </button>

          {/* Tutup Seleksi */}
          <button
            type="button"
            onClick={() => {
              setSelectionStart(null);
              setSelectionEnd(null);
            }}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer ml-0.5"
            title="Batal seleksi"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── WRAPPER TABEL DENGAN OVERLAY GARIS & TOMBOL (+) PRESISI 100% ── */}
      <div className="relative w-full" style={{ overflow: 'visible' }}>
        {/* 1. Tombol (+) & Garis Penambah Kolom — Tepat di koordinat X border kanan tiap <th> */}
        {!readOnly &&
          metrics.colRightPositions.map((colRightX, cIdx) => (
            <div
              key={`col-hotspot-${cIdx}`}
              className="no-print absolute z-30 flex flex-col items-center"
              style={{
                left: `${colRightX - 10}px`,
                top: '-18px',
                width: '20px',
                height: '22px',
              }}
              onMouseEnter={() => {
                updateMetrics();
                setHoveredColBorder(cIdx);
              }}
              onMouseLeave={() => setHoveredColBorder(null)}
            >
              <button
                type="button"
                onClick={() => commitModel(insertColumnAt(model, cIdx + 1))}
                className={`w-4.5 h-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-opacity ${
                  hoveredColBorder === cIdx ? 'opacity-100 scale-105' : 'opacity-0'
                }`}
                title={`Sisipkan kolom baru di sini`}
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </button>

              {/* Garis vertikal biru tepat di atas garis border kolom sepanjang tinggi tabel */}
              {hoveredColBorder === cIdx && (
                <div
                  className="pointer-events-none bg-blue-500"
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '9px',
                    width: '2px',
                    height: `${metrics.height}px`,
                  }}
                />
              )}
            </div>
          ))}

        {/* 2. Tombol (+) & Garis Penambah Baris — Tepat di koordinat Y border bawah tiap <tr> */}
        {!readOnly &&
          metrics.rowBottomPositions.map((rowBottomY, rIdx) => (
            <div
              key={`row-hotspot-${rIdx}`}
              className="no-print absolute z-30 flex items-center"
              style={{
                left: '-20px',
                top: `${rowBottomY - 10}px`,
                width: '24px',
                height: '20px',
              }}
              onMouseEnter={() => {
                updateMetrics();
                setHoveredRowBorder(rIdx);
              }}
              onMouseLeave={() => setHoveredRowBorder(null)}
            >
              <button
                type="button"
                onClick={() => commitModel(insertRowAt(model, rIdx + 1))}
                className={`w-4.5 h-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-opacity ${
                  hoveredRowBorder === rIdx ? 'opacity-100 scale-105' : 'opacity-0'
                }`}
                title={`Sisipkan baris baru di sini`}
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </button>

              {/* Garis horizontal biru tepat di atas garis border baris selebar tabel */}
              {hoveredRowBorder === rIdx && (
                <div
                  className="pointer-events-none bg-blue-500"
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '9px',
                    height: '2px',
                    width: `${metrics.width}px`,
                  }}
                />
              )}
            </div>
          ))}

        {/* ── TABEL RESMI NASKAH DINAS KOMDIGI PADA LEMBAR A4 (CENTER) ── */}
        <table
          ref={tableRef}
          data-lampiran-table="true"
          style={{
            width: '100%',
            margin: '0 auto',
            borderCollapse: 'collapse',
            fontSize: '9.5pt',
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
            border: '1px solid #000000',
            tableLayout: 'auto',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#ffffff' }}>
              {model.columns.map((col, cIdx) => (
                <th
                  key={`prev-th-${cIdx}`}
                  style={{
                    border: '1px solid #000000',
                    padding: '6px 8px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                  }}
                  className="group/th select-none"
                >
                  {readOnly ? (
                    col || ''
                  ) : (
                    <div className="relative flex items-center justify-center w-full">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          updateMetrics();
                          const val = (e.currentTarget.textContent || '').trim();
                          const nextCols = model.columns.map((c, i) => (i === cIdx ? val : c));
                          const nextModel = normalizeTableModel({ ...model, columns: nextCols });
                          const html = serializeTableToHtml(nextModel);
                          if (html !== lastCommittedHtmlRef.current) {
                            lastCommittedHtmlRef.current = html;
                            onChangeContent(html);
                          }
                        }}
                        onBlur={(e) => handleHeaderBlur(cIdx, e.currentTarget.textContent || '')}
                        style={{ textAlign: 'center', width: '100%' }}
                        className="outline-none min-h-[16px] w-full text-center"
                      >
                        {col}
                      </div>
                      {model.columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => commitModel(deleteColumnAt(model, cIdx))}
                          className="no-print absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/th:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition-opacity cursor-pointer"
                          title="Hapus kolom ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row, rIdx) => (
              <tr key={`prev-tr-${rIdx}`}>
                {row.map((cell, cIdx) => {
                  if (cell.isHidden) return null;
                  const isSelected = isCellSelected(rIdx, cIdx);

                  return (
                    <td
                      key={`prev-td-${rIdx}-${cIdx}`}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                      onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                      style={{
                        border: '1px solid #000000',
                        padding: '6px 8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                        outline: isSelected ? '2px solid #2563eb' : 'none',
                        outlineOffset: '-1px',
                        userSelect: isDraggingSelection ? 'none' : 'text',
                      }}
                      className="transition-colors cursor-text"
                    >
                      {readOnly ? (
                        cell.text || ''
                      ) : (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => {
                            updateMetrics();
                            const val = (e.currentTarget.textContent || '').trim();
                            const nextRows = model.rows.map((row, rI) => {
                              if (rI !== rIdx) return row;
                              const cells = [...row];
                              cells[cIdx] = { ...cells[cIdx], text: val };
                              return cells;
                            });
                            const nextModel = normalizeTableModel({ ...model, rows: nextRows });
                            const html = serializeTableToHtml(nextModel);
                            if (html !== lastCommittedHtmlRef.current) {
                              lastCommittedHtmlRef.current = html;
                              onChangeContent(html);
                            }
                          }}
                          onBlur={(e) => handleCellBlur(rIdx, cIdx, e.currentTarget.textContent || '')}
                          style={{
                            outline: 'none',
                            minHeight: '18px',
                            width: '100%',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            textAlign: 'center',
                          }}
                        >
                          {cell.text}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. BAGAN GRID SELECTOR UKURAN TABEL STATIS
// ═════════════════════════════════════════════════════════════════════════════

export const TableGridPickerStatic: React.FC<{
  onSelectSize: (cols: number, rows: number) => void;
  onClose?: () => void;
}> = ({ onSelectSize, onClose }) => {
  const [hovered, setHovered] = useState<{ cols: number; rows: number }>({ cols: 0, rows: 0 });
  const maxCols = 8;
  const maxRows = 6;

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 select-none animate-fade-in shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <TableIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>Atur Ukuran Tabel:</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
            {hovered.cols > 0 && hovered.rows > 0
              ? `${hovered.cols} Kolom × ${hovered.rows} Baris`
              : 'Sorot kotak di bawah'}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Tutup pemilih ukuran"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[10.5px] text-slate-500">
        Gerakkan kursor pada kotak-kotak di bawah dan klik untuk membuat ukuran tabel yang diinginkan:
      </p>

      {/* Grid Matriks Kotak-Kotak */}
      <div
        className="inline-grid gap-1 p-2 bg-white border border-slate-300 rounded-lg shadow-2xs"
        style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
        onMouseLeave={() => setHovered({ cols: 0, rows: 0 })}
      >
        {Array.from({ length: maxRows }).map((_, rIdx) =>
          Array.from({ length: maxCols }).map((_, cIdx) => {
            const isHighlighted = cIdx < hovered.cols && rIdx < hovered.rows;
            return (
              <div
                key={`grid-${rIdx}-${cIdx}`}
                onMouseEnter={() => setHovered({ cols: cIdx + 1, rows: rIdx + 1 })}
                onClick={() => {
                  onSelectSize(cIdx + 1, rIdx + 1);
                  if (onClose) onClose();
                }}
                className={`w-5 h-5 rounded-xs border cursor-pointer transition-all ${
                  isHighlighted
                    ? 'bg-teal-600 border-teal-700 shadow-2xs scale-105'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
                title={`Klik untuk membuat tabel ${cIdx + 1} Kolom × ${rIdx + 1} Baris`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. KOMPONEN EDITOR TABEL INTERAKTIF PANEL KIRI (LampiranManager)
//    - Tampilan minimalis: Grid Picker hanya muncul jika tombol 'Buat Ukuran Tabel' ditekan
//    - Tombol (+) di perbatasan kolom & baris 100% presisi
//    - Multi-select drag dengan tombol Merge & Split
// ═════════════════════════════════════════════════════════════════════════════

export interface InteractiveDocumentTableProps {
  initialContent: string;
  onChangeContent: (newHtml: string) => void;
  readOnly?: boolean;
}

export const InteractiveDocumentTable: React.FC<InteractiveDocumentTableProps> = ({
  initialContent,
  onChangeContent,
  readOnly = false,
}) => {
  const [model, setModel] = useState<TableModel>(() => {
    const parsed = parseTableFromText(initialContent);
    return normalizeTableModel(parsed || DEFAULT_BLANK_TABLE);
  });

  // State toggle grid selector ukuran (Hanya muncul jika tombol ditekan agar minimalis)
  const [showGridSizePicker, setShowGridSizePicker] = useState<boolean>(false);

  // State Multi-selection drag sel
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState<boolean>(false);

  // Hover states untuk tombol lingkaran (+) di perbatasan kolom dan baris
  const [hoveredColBorder, setHoveredColBorder] = useState<number | null>(null);
  const [hoveredRowBorder, setHoveredRowBorder] = useState<number | null>(null);

  const debounceTimer = useRef<number | undefined>(undefined);
  const lastCommittedHtmlRef = useRef<string>(serializeTableToHtml(model));
  const tableRef = useRef<HTMLTableElement | null>(null);

  const { metrics, updateMetrics } = useTableBorderMetrics(tableRef, model);

  // Sync saat initialContent berubah dari luar
  useEffect(() => {
    if (initialContent === lastCommittedHtmlRef.current) return;
    const parsed = parseTableFromText(initialContent);
    if (parsed) {
      const normalized = normalizeTableModel(parsed);
      const canonical = serializeTableToHtml(normalized);
      lastCommittedHtmlRef.current = canonical;
      setModel((prev) => (serializeTableToHtml(prev) === canonical ? prev : normalized));
    }
  }, [initialContent]);

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceTimer.current);
    };
  }, []);

  const commitModel = (nextRawModel: TableModel) => {
    const nextModel = normalizeTableModel(nextRawModel);
    setModel(nextModel);
    window.clearTimeout(debounceTimer.current);
    const html = serializeTableToHtml(nextModel);
    if (html !== lastCommittedHtmlRef.current) {
      lastCommittedHtmlRef.current = html;
      onChangeContent(html);
    }
  };

  // ── Penanganan Seleksi Multi-Cell ──────────────────────────────────────────

  const handleCellMouseDown = (r: number, c: number) => {
    if (readOnly) return;
    setSelectionStart({ r, c });
    setSelectionEnd({ r, c });
    setIsDraggingSelection(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isDraggingSelection || readOnly) return;
    setSelectionEnd({ r, c });
  };

  useEffect(() => {
    if (!isDraggingSelection) return;
    const handleMouseUpGlobal = () => {
      setIsDraggingSelection(false);
    };
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, [isDraggingSelection]);

  const selectedBounds = React.useMemo(() => {
    if (!selectionStart || !selectionEnd) return null;
    const { minR, maxR, minC, maxC } = getExpandedSelectionBounds(
      model,
      selectionStart,
      selectionEnd
    );
    const rawMinR = Math.min(selectionStart.r, selectionEnd.r);
    const rawMaxR = Math.max(selectionStart.r, selectionEnd.r);
    const rawMinC = Math.min(selectionStart.c, selectionEnd.c);
    const rawMaxC = Math.max(selectionStart.c, selectionEnd.c);
    const isMultiDrag = rawMaxR > rawMinR || rawMaxC > rawMinC;

    let visibleCount = 0;
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (!model.rows[r]?.[c]?.isHidden) {
          visibleCount++;
        }
      }
    }

    const count = (maxR - minR + 1) * (maxC - minC + 1);
    return {
      minR,
      maxR,
      minC,
      maxC,
      count,
      visibleCount,
      isMulti: isMultiDrag || visibleCount > 1,
    };
  }, [selectionStart, selectionEnd, model]);

  const isCellSelected = (r: number, c: number) => {
    if (!selectedBounds) return false;
    return (
      r >= selectedBounds.minR &&
      r <= selectedBounds.maxR &&
      c >= selectedBounds.minC &&
      c <= selectedBounds.maxC
    );
  };

  const hasMergedCellsInSelection = React.useMemo(() => {
    if (!selectedBounds) return false;
    for (let r = selectedBounds.minR; r <= selectedBounds.maxR; r++) {
      for (let c = selectedBounds.minC; c <= selectedBounds.maxC; c++) {
        const cell = model.rows[r]?.[c];
        if (cell && !cell.isHidden && ((cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1)) {
          return true;
        }
      }
    }
    return false;
  }, [selectedBounds, model]);

  // ── Aksi Tabel ─────────────────────────────────────────────────────────────

  // Merge Cells
  const handleMergeSelected = () => {
    if (!selectedBounds || !selectionStart || !selectionEnd) return;
    const nextModel = mergeCellRange(model, selectionStart, selectionEnd);
    commitModel(nextModel);
    setSelectionStart({ r: selectedBounds.minR, c: selectedBounds.minC });
    setSelectionEnd({ r: selectedBounds.minR, c: selectedBounds.minC });
  };

  // Unmerge / Split Cells
  const handleUnmergeSelected = () => {
    if (!selectedBounds || !selectionStart || !selectionEnd) return;
    const nextModel = unmergeCellRange(model, selectionStart, selectionEnd);
    commitModel(nextModel);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Hapus Baris Terpilih
  const handleDeleteSelectedRows = () => {
    if (!selectedBounds) return;
    const rowsToDelete = selectedBounds.maxR - selectedBounds.minR + 1;
    if (model.rows.length - rowsToDelete < 1) {
      alert('Tabel minimal harus menyisakan 1 baris.');
      return;
    }
    let safeModel = unmergeCellRange(
      model,
      { r: selectedBounds.minR, c: 0 },
      { r: selectedBounds.maxR, c: model.columns.length - 1 }
    );
    const filteredRows = safeModel.rows.filter(
      (_, rIdx) => rIdx < selectedBounds.minR || rIdx > selectedBounds.maxR
    );
    if (safeModel.columns[0]?.toLowerCase() === 'no') {
      filteredRows.forEach((r, i) => {
        if (r[0] && !r[0].isHidden) {
          r[0].text = String(i + 1);
        }
      });
    }
    commitModel({ ...safeModel, rows: filteredRows });
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Hapus Kolom Terpilih
  const handleDeleteSelectedColumns = () => {
    if (!selectedBounds) return;
    const colsToDelete = selectedBounds.maxC - selectedBounds.minC + 1;
    if (model.columns.length - colsToDelete < 1) {
      alert('Tabel minimal harus menyisakan 1 kolom.');
      return;
    }
    let safeModel = unmergeCellRange(
      model,
      { r: 0, c: selectedBounds.minC },
      { r: model.rows.length - 1, c: selectedBounds.maxC }
    );
    const filteredCols = safeModel.columns.filter(
      (_, cIdx) => cIdx < selectedBounds.minC || cIdx > selectedBounds.maxC
    );
    const filteredRows = safeModel.rows.map((row) =>
      row.filter((_, cIdx) => cIdx < selectedBounds.minC || cIdx > selectedBounds.maxC)
    );
    commitModel({ columns: filteredCols, rows: filteredRows });
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Edit Sel
  const handleCellChange = (rIdx: number, cIdx: number, text: string) => {
    const nextRows = model.rows.map((row, rI) => {
      if (rI !== rIdx) return row;
      const cells = [...row];
      cells[cIdx] = { ...cells[cIdx], text };
      return cells;
    });
    commitModel({ ...model, rows: nextRows });
  };

  // Edit Header
  const handleRenameColumn = (cIdx: number, newLabel: string) => {
    const nextCols = model.columns.map((col, i) => (i === cIdx ? newLabel : col));
    commitModel({ ...model, columns: nextCols });
  };

  // Setup ukuran tabel baru dari Grid Picker
  const handleCreateGridTable = (cols: number, rows: number) => {
    const newTable = createBlankTable(cols, rows, true);
    commitModel(newTable);
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowGridSizePicker(false);
  };

  // Terapkan template susunan acara
  const handleApplyRundownTemplate = () => {
    commitModel(TEMPLATE_RUNDOWN_TABLE);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Terapkan template matriks kerja
  const handleApplyMatriksTemplate = () => {
    commitModel(TEMPLATE_MATRIKS_TABLE);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Bersihkan jadi tabel kosong
  const handleResetToBlank = () => {
    commitModel(DEFAULT_BLANK_TABLE);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  return (
    <div className="w-full space-y-3 font-sans select-text" onMouseEnter={updateMetrics}>
      {/* ── 1. BARIS OPSI TEMPLATE & TOMBOL BUAT UKURAN TABEL (MINIMALIS) ── */}
      {!readOnly && (
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Opsi &amp; Template Tabel:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tombol Buat Ukuran Tabel (Toggle Collapsible agar minimalis) */}
              <button
                type="button"
                onClick={() => setShowGridSizePicker(!showGridSizePicker)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                  showGridSizePicker
                    ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
                }`}
                title="Buka / tutup kotak pemilih ukuran tabel"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{showGridSizePicker ? 'Tutup Ukuran' : 'Buat Ukuran Tabel'}</span>
              </button>

              <button
                type="button"
                onClick={handleApplyRundownTemplate}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                title="Muat contoh gambaran susunan acara / rundown kegiatan"
              >
                Susunan Acara
              </button>

              <button
                type="button"
                onClick={handleApplyMatriksTemplate}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                title="Muat contoh gambaran matriks program kerja"
              >
                Matriks Kerja
              </button>

              <button
                type="button"
                onClick={handleResetToBlank}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
                title="Kembalikan ke tabel kosongan bersih"
              >
                <RotateCcw className="w-3 h-3 inline mr-1" />
                Kosongkan
              </button>
            </div>
          </div>

          {/* Grid Matriks Kotak-Kotak: HANYA MUNCUL KETIKA TOMBOL 'Buat Ukuran Tabel' DITEKAN */}
          {showGridSizePicker && (
            <div className="pt-2 border-t border-slate-100 animate-fade-in">
              <TableGridPickerStatic
                onSelectSize={handleCreateGridTable}
                onClose={() => setShowGridSizePicker(false)}
              />
            </div>
          )}

          {/* Toolbar Cepat: Tambah Baris / Kolom & Seleksi */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => commitModel(insertRowAt(model, model.rows.length))}
                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Tambah 1 Baris di Bagian Paling Bawah"
              >
                <Rows className="w-3 h-3" />
                <span>+ Baris</span>
              </button>

              <button
                type="button"
                onClick={() => commitModel(insertColumnAt(model, model.columns.length))}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-md font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Tambah 1 Kolom di Bagian Paling Kanan"
              >
                <Columns className="w-3 h-3" />
                <span>+ Kolom</span>
              </button>

              {/* Toolbar Aksi Seleksi (Merge, Split, Hapus) */}
              {selectedBounds && (
                <div className="flex items-center gap-1 bg-slate-800 text-white px-2 py-0.5 rounded-lg flex-wrap">
                  <span className="text-[10.5px] text-amber-300 font-semibold mr-1">
                    {selectedBounds.count} Sel:
                  </span>

                  {selectedBounds.visibleCount > 1 && (
                    <button
                      type="button"
                      onClick={handleMergeSelected}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer"
                      title="Gabung seluruh sel yang diblok (Merge)"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>Merge</span>
                    </button>
                  )}

                  {hasMergedCellsInSelection && (
                    <button
                      type="button"
                      onClick={handleUnmergeSelected}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer"
                      title="Pisahkan sel kembali sejajar dengan baris & kolomnya (Split)"
                    >
                      <Split className="w-2.5 h-2.5" />
                      <span>Split</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDeleteSelectedRows}
                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-medium flex items-center gap-0.5 cursor-pointer"
                    title="Hapus baris terpilih"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Hapus Baris</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSelectedColumns}
                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-medium flex items-center gap-0.5 cursor-pointer"
                    title="Hapus kolom terpilih"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Hapus Kolom</span>
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              {model.rows.length} Baris &times; {model.columns.length} Kolom
            </div>
          </div>
        </div>
      )}

      {/* ── 2. VISUAL EDITOR TABEL DENGAN TOMBOL (+) PRESISI 100% DI PERBATASAN ── */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white p-4 pt-6 pl-7 shadow-2xs">
        <div className="relative w-full">
          {/* 1. Tombol (+) & Garis Penambah Kolom — Tepat di koordinat X border kanan tiap <th> */}
          {!readOnly &&
            metrics.colRightPositions.map((colRightX, cIdx) => (
              <div
                key={`editor-col-hotspot-${cIdx}`}
                className="no-print absolute z-30 flex flex-col items-center"
                style={{
                  left: `${colRightX - 10}px`,
                  top: '-18px',
                  width: '20px',
                  height: '22px',
                }}
                onMouseEnter={() => {
                  updateMetrics();
                  setHoveredColBorder(cIdx);
                }}
                onMouseLeave={() => setHoveredColBorder(null)}
              >
                <button
                  type="button"
                  onClick={() => commitModel(insertColumnAt(model, cIdx + 1))}
                  className={`w-4.5 h-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-opacity ${
                    hoveredColBorder === cIdx ? 'opacity-100 scale-105' : 'opacity-0'
                  }`}
                  title={`Sisipkan kolom baru di sini`}
                >
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </button>

                {hoveredColBorder === cIdx && (
                  <div
                    className="pointer-events-none bg-blue-500"
                    style={{
                      position: 'absolute',
                      top: '18px',
                      left: '9px',
                      width: '2px',
                      height: `${metrics.height}px`,
                    }}
                  />
                )}
              </div>
            ))}

          {/* 2. Tombol (+) & Garis Penambah Baris — Tepat di koordinat Y border bawah tiap <tr> */}
          {!readOnly &&
            metrics.rowBottomPositions.map((rowBottomY, rIdx) => (
              <div
                key={`editor-row-hotspot-${rIdx}`}
                className="no-print absolute z-30 flex items-center"
                style={{
                  left: '-20px',
                  top: `${rowBottomY - 10}px`,
                  width: '24px',
                  height: '20px',
                }}
                onMouseEnter={() => {
                  updateMetrics();
                  setHoveredRowBorder(rIdx);
                }}
                onMouseLeave={() => setHoveredRowBorder(null)}
              >
                <button
                  type="button"
                  onClick={() => commitModel(insertRowAt(model, rIdx + 1))}
                  className={`w-4.5 h-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-opacity ${
                    hoveredRowBorder === rIdx ? 'opacity-100 scale-105' : 'opacity-0'
                  }`}
                  title={`Sisipkan baris baru di sini`}
                >
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </button>

                {hoveredRowBorder === rIdx && (
                  <div
                    className="pointer-events-none bg-blue-500"
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '9px',
                      height: '2px',
                      width: `${metrics.width}px`,
                    }}
                  />
                )}
              </div>
            ))}

          {/* Elemen Tabel Editor */}
          <table
            ref={tableRef}
            data-lampiran-table="true"
            style={{
              width: '100%',
              margin: '0 auto',
              borderCollapse: 'collapse',
              fontSize: '9.5pt',
              fontFamily: 'Arial, sans-serif',
              border: '1px solid #000000',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {model.columns.map((col, cIdx) => (
                  <th
                    key={`th-${cIdx}`}
                    style={{
                      border: '1px solid #000000',
                      padding: '6px 8px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      position: 'relative',
                    }}
                    className="group/th select-none bg-slate-50"
                  >
                    {readOnly ? (
                      col
                    ) : (
                      <div className="relative flex items-center justify-center w-full">
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => handleRenameColumn(cIdx, e.target.value)}
                          className="font-bold text-xs text-center bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 py-0.5 rounded w-full"
                          title="Klik untuk mengubah judul kolom"
                        />
                        {model.columns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => commitModel(deleteColumnAt(model, cIdx))}
                            className="no-print absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/th:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition-opacity cursor-pointer"
                            title="Hapus Kolom Ini"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`}>
                  {row.map((cell, cIdx) => {
                    if (cell.isHidden) return null;
                    const isSelected = isCellSelected(rIdx, cIdx);
                    const cellMerged = (cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1;

                    return (
                      <td
                        key={`td-${rIdx}-${cIdx}`}
                        colSpan={cell.colSpan || 1}
                        rowSpan={cell.rowSpan || 1}
                        onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                        onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                        style={{
                          border: '1px solid #000000',
                          padding: '4px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          backgroundColor: isSelected
                            ? '#dbeafe'
                            : cellMerged
                            ? '#fefce8'
                            : 'transparent',
                          outline: isSelected ? '2px solid #2563eb' : 'none',
                          outlineOffset: '-1px',
                          userSelect: isDraggingSelection ? 'none' : 'text',
                        }}
                        className="relative group/td transition-colors cursor-text"
                      >
                        <textarea
                          rows={1}
                          value={cell.text}
                          onChange={(e) => {
                            handleCellChange(rIdx, cIdx, e.target.value);
                            updateMetrics();
                          }}
                          placeholder="Ketik isi..."
                          className="w-full p-1 text-xs text-center border border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded resize-y leading-tight font-sans bg-transparent outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
