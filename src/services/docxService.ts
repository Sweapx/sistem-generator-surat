import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
  UnderlineType,
} from 'docx';
import { SuratTugasFormState, Pegawai, Pejabat, LampiranItem } from '../types';

// Font default seluruh dokumen — Arial, sesuai format asli Komdigi
const F = 'Arial';

/**
 * Format date string (YYYY-MM-DD) -> "15 September 2026"
 */
export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '';
  const bulanIndo = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = bulanIndo[parseInt(parts[1], 10) - 1] || parts[1];
    return `${day} ${month} ${parts[0]}`;
  }
  return dateStr;
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

/**
 * Baris label : isi (tab stop layout seperti Menimbang/Dasar/Kepada/Untuk)
 * Label lebar ~900 twips, kolon di 1000, isi setelahnya
 */
function barisDua(
  label: string,
  isi: TextRun[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  spaceAfter = 80
): Paragraph {
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter },
    tabStops: [
      { type: 'left' as any, position: 1600 }, // posisi titik dua
      { type: 'left' as any, position: 1800 }, // posisi isi
    ],
    children: [
      t(label),
      t('\t: \t'),
      ...isi,
    ],
  });
}

/**
 * Baris isi lanjutan (indent sesuai kolom isi)
 */
function barisContinue(isiRuns: TextRun[], spaceAfter = 80): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: spaceAfter },
    indent: { left: 1800 },
    children: isiRuns,
  });
}

// ─── Kop Surat ────────────────────────────────────────────────────────────────

function buildKop(): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t('KEMENTERIAN KOMUNIKASI DAN DIGITAL RI', { bold: true, size: 14 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t('SEKRETARIAT JENDERAL', { bold: true, size: 13 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t('PUSAT KEBIJAKAN STRATEGIS', { bold: true, size: 13 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [t('Jl. Medan Merdeka Barat No. 9, Jakarta 10110  Telp./Fax. (021) 3503735  www.komdigi.go.id', { size: 9 })],
    }),
    // Garis single tebal
    new Paragraph({
      border: { bottom: { style: BorderStyle.THICK, size: 12, color: '000000' } },
      spacing: { after: 120 },
      children: [],
    }),
  ];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generates official Komdigi Surat Tugas (.docx).
 * Format 1:1 dengan dokumen asli ST 851 & ST Oki.
 * Font: Arial. Margin: L=3cm R=2cm T=2.5cm B=2.5cm.
 */
export async function generateSuratTugasDocx(
  form: SuratTugasFormState,
  pegawaiList: Pegawai[],
  pejabat: Pejabat
): Promise<Blob> {
  const isLampiran = pegawaiList.length > 3;

  const tglSurat = formatTanggalIndonesia(form.tanggal_surat);
  const tglMulai = formatTanggalIndonesia(form.tanggal_mulai);
  const tglSelesai = formatTanggalIndonesia(form.tanggal_selesai);
  const rentang =
    form.tanggal_mulai === form.tanggal_selesai
      ? tglMulai
      : `${tglMulai} s.d. ${tglSelesai}`;

  const dasar = form.instansi_pengundang
    ? `${form.instansi_pengundang} Nomor : ${form.nomor_surat_undangan}${
        form.tanggal_surat_undangan ? ' tanggal ' + formatTanggalIndonesia(form.tanggal_surat_undangan) : ''
      }`
    : `Nomor ${form.nomor_surat_undangan}`;

  const pembebanan =
    form.pembebanan_anggaran ||
    'DIPA Sekretariat Jenderal Kementerian Komunikasi dan Digital Tahun Anggaran 2026';

  const jabatanTTD = pejabat.is_default
    ? `${pejabat.jabatan},`
    : `Plh. ${pejabat.jabatan},`;

  // ── Paragraphs Halaman 1 ──────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [];

  // Kop
  children.push(...buildKop());

  // Judul
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t('SURAT TUGAS', { bold: true, underline: true, size: 12 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [t(`Nomor: ${form.nomor_lengkap}`, { size: 12 })],
    })
  );

  // Menimbang
  children.push(barisDua(
    'Menimbang',
    [t(`Bahwa dalam rangka mendukung kelancaran pelaksanaan `), t(form.nama_acara, { bold: true }), t(`, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`)],
    AlignmentType.JUSTIFIED, 100
  ));

  // Dasar
  children.push(barisDua(
    'Dasar',
    [t(`${dasar}.`)],
    AlignmentType.JUSTIFIED, 160
  ));

  // MEMBERI TUGAS
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120 },
      children: [t('MEMBERI TUGAS:', { bold: true })],
    })
  );

  // KEPADA
  if (!isLampiran) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        tabStops: [{ type: 'left' as any, position: 1600 }, { type: 'left' as any, position: 1800 }],
        children: [t('Kepada'), t('\t:\t')],
      })
    );
    pegawaiList.forEach((peg) => {
      [
        ['Nama', peg.nama, true],
        ['NIP', peg.nip, false],
        ['Pangkat, Gol/Ruang', peg.pangkat_golongan, false],
        ['Jabatan', peg.jabatan, false],
      ].forEach(([label, val, bold], i) => {
        children.push(new Paragraph({
          indent: { left: 1800 },
          spacing: { after: i === 3 ? 120 : 0 },
          tabStops: [{ type: 'left' as any, position: 2800 }],
          children: [t(String(label)), t('\t: '), t(String(val), { bold: Boolean(bold) })],
        }));
      });
    });
  } else {
    children.push(barisDua('Kepada', [t('(Daftar Terlampir)')], AlignmentType.LEFT, 100));
  }

  // UNTUK
  children.push(barisDua(
    'Untuk',
    [t('Mengikuti kegiatan '), t(form.nama_acara, { bold: true }), t(` yang dilaksanakan pada ${rentang} di ${form.lokasi_kegiatan}${form.kota_kegiatan ? ', ' + form.kota_kegiatan : ''}.`)],
    AlignmentType.JUSTIFIED, 140
  ));

  // Penutup
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60 },
      children: [t(`Biaya yang timbul akibat Surat Tugas ini dibebankan pada ${pembebanan} sesuai ketentuan yang berlaku.`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 280 },
      children: [t('Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan seksama dan penuh tanggung jawab.')],
    })
  );

  // TTD — rata kanan
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(`${form.kota_surat || 'Jakarta'}, ${tglSurat}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(jabatanTTD)],
    }),
    spacer(10),
    spacer(10),
    spacer(10),
    spacer(10),
    spacer(10),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(pejabat.nama, { bold: true })],
    })
  );

  // Catatan TTE
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: '555555' } },
      spacing: { before: 400, after: 20 },
      children: [t('Catatan :', { italic: true, size: 8 })],
    }),
    new Paragraph({ spacing: { after: 0 }, children: [t('- UU ITE No 11 Tahun 2008 Pasal 5 ayat 1', { size: 8 })] }),
    new Paragraph({
      indent: { left: 200 },
      spacing: { after: 0 },
      children: [t('"Informasi Elektronik dan/atau Dokumen Elektronik dan/atau hasil cetaknya merupakan alat bukti hukum yang sah."', { size: 8, italic: true })],
    }),
    new Paragraph({ spacing: { after: 0 }, children: [t('- Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan iOTENTIK/BSrE', { size: 8 })] })
  );

  // ── Halaman Lampiran (jika > 3 pegawai) ──────────────────────────────────
  if (isLampiran) {
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Header kanan — Lampiran I / Nomor / Tanggal
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        children: [t('Lampiran I Surat Tugas')],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        tabStops: [{ type: 'left' as any, position: 8800 }],
        children: [t('Nomor'), t('\t:\t'), t(form.nomor_lengkap)],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        tabStops: [{ type: 'left' as any, position: 8800 }],
        children: [t('Tanggal'), t('\t:\t'), t(tglSurat)],
      })
    );

    // Tabel daftar pegawai
    const colW = [500, 2400, 2100, 1700, 2400]; // twips

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['No', 'Nama', 'NIP', 'Pangkat/Gol\nRuang', 'Jabatan'].map((h, i) =>
        new TableCell({
          width: { size: colW[i], type: WidthType.DXA },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [t(h, { size: 11 })],
          })],
        })
      ),
    });

    const dataRows = pegawaiList.map((peg, idx) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`${idx + 1}`, { size: 11 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [t(peg.nama, { size: 11 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [t(peg.nip, { size: 11 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [t(peg.pangkat_golongan, { size: 11 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [t(peg.jabatan, { size: 11 })] })] }),
        ],
      })
    );

    children.push(
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 9600, type: WidthType.DXA },
      })
    );
  }

  // ── Build Document ─────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,   // 2.54 cm
              bottom: 1440,
              left: 1700,  // ~3 cm
              right: 1134, // ~2 cm
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generator Naskah Dinas untuk Surat Undangan
 */
export async function generateSuratUndanganDocx(
  form: SuratTugasFormState,
  pejabat: Pejabat
): Promise<Blob> {
  const tglSurat = formatTanggalIndonesia(form.tanggal_surat);
  const jabatanTTD = pejabat.is_default ? `${pejabat.jabatan},` : `Plh. ${pejabat.jabatan},`;
  const children: (Paragraph | Table)[] = [];

  children.push(...buildKop());

  // Header 2 Kolom (Nomor, Sifat, Lampiran, Hal di kiri; Jakarta, Tanggal di kanan)
  const headerTable = new Table({
    width: { size: 9600, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6000, type: WidthType.DXA },
            children: [
              new Paragraph({ children: [t('Nomor\t: ' + form.nomor_lengkap)] }),
              new Paragraph({ children: [t('Sifat\t: ' + (form.undangan_sifat || 'Biasa'))] }),
              new Paragraph({ children: [t('Lampiran\t: ' + (form.undangan_lampiran || '1 (satu) berkas'))] }),
              new Paragraph({ children: [t('Hal\t: ' + (form.undangan_hal || 'Undangan'))] }),
            ],
          }),
          new TableCell({
            width: { size: 3600, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [t(`${form.kota_surat || 'Jakarta'}, ${tglSurat}`)],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(headerTable);

  children.push(spacer(8));
  children.push(
    new Paragraph({ spacing: { after: 40 }, children: [t('Kepada Yth.')] }),
    new Paragraph({
      spacing: { after: 140 },
      children: [t(form.undangan_kepada || '-')],
    })
  );

  // Paragraf Pembuka
  if (form.undangan_pembuka && form.undangan_pembuka.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 120 },
        children: [t(form.undangan_pembuka.trim())],
      })
    );
  }

  // Rincian Acara
  const tempatVal =
    form.undangan_tipe_tempat === 'online'
      ? form.undangan_tempat_online || '-'
      : form.undangan_tipe_tempat === 'hybrid'
      ? `${form.undangan_tempat_offline || '-'} / Online: ${form.undangan_tempat_online || '-'}`
      : form.undangan_tempat_offline || form.lokasi_kegiatan || '-';

  [
    ['Hari, Tanggal', form.undangan_hari_tanggal || form.hari_tanggal_pelaksanaan || tglSurat || '-'],
    ['Waktu', form.undangan_waktu || form.waktu_kegiatan || '-'],
    ['Tempat', tempatVal],
    ['Agenda', form.undangan_agenda || form.nama_acara || '-'],
  ].forEach(([label, val]) => {
    children.push(
      new Paragraph({
        indent: { left: 720 },
        spacing: { after: 60 },
        tabStops: [{ type: 'left' as any, position: 2600 }],
        children: [t(String(label)), t('\t: '), t(String(val))],
      })
    );
  });

  // Paragraf Penutup
  if (form.undangan_penutup && form.undangan_penutup.trim()) {
    children.push(
      spacer(8),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 240 },
        children: [t(form.undangan_penutup.trim())],
      })
    );
  }

  // TTD
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(jabatanTTD)],
    }),
    spacer(10),
    spacer(10),
    spacer(10),
    spacer(10),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(pejabat.nama, { bold: true })],
    })
  );

  // Lampiran Tambahan (Undangan)
  const undanganLampiranItems = form.undangan_lampiran_items || form.lampiran_items || [];
  if (undanganLampiranItems.length > 0) {
    children.push(...buildLampiranChildren(undanganLampiranItems, form.nomor_lengkap, tglSurat));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 },
          },
        },
        children,
      },
    ],
  });
  return await Packer.toBlob(doc);
}

/**
 * Helper untuk membangun halaman lampiran Word dengan penanda kanan atas
 */
function buildLampiranChildren(
  items: LampiranItem[] | undefined,
  nomorLengkap: string,
  tanggalSuratFormatted: string
): Paragraph[] {
  if (!items || items.length === 0) return [];
  const paragraphs: Paragraph[] = [];

  items.forEach((item, idx) => {
    // Page break untuk memisahkan setiap lampiran ke halaman baru
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Penanda Kanan Atas Resmi (Sample Lampiran format):
    // Lampiran [Label Mark]
    // Nomor   : [Nomor]
    // Tanggal : [Tanggal]
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [t(item.label_mark || `Lampiran ${idx + 1}`, { size: 10 })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [t(`Nomor   : ${nomorLengkap || '-'}`, { size: 10 })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [t(`Tanggal : ${tanggalSuratFormatted || '-'}`, { size: 10 })],
      })
    );

    // Judul Lampiran (Center, Bold, Uppercase)
    if (item.judul) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [t(item.judul.toUpperCase(), { bold: true, size: 11 })],
        })
      );
    }

    // Isi Dokumen
    const textContent = item.isi || item.extracted_text;
    if (textContent) {
      textContent.split('\n').forEach((line) => {
        if (line.trim()) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 60 },
              children: [t(line.trim(), { size: 10 })],
            })
          );
        } else {
          paragraphs.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
        }
      });
    } else if (item.tipe === 'upload') {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            t(`[Dokumen Lampiran Elektronik: ${item.file_name || 'Berkas Terlampir'}]`, {
              italic: true,
              size: 10,
            }),
          ],
        })
      );
    }
  });

  return paragraphs;
}

/**
 * Generator Naskah Dinas untuk Nota Dinas
 */
export async function generateNotaDinasDocx(
  form: SuratTugasFormState,
  pejabat: Pejabat
): Promise<Blob> {
  const tglSurat = formatTanggalIndonesia(form.tanggal_surat);
  const jabatanTTD = pejabat.is_default ? `${pejabat.jabatan},` : `Plh. ${pejabat.jabatan},`;
  const children: (Paragraph | Table)[] = [];

  children.push(...buildKop());

  // Judul NOTA DINAS
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t('NOTA DINAS', { bold: true, underline: true, size: 12 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [t(`Nomor: ${form.nomor_lengkap}`, { size: 12 })],
    })
  );

  // Header Attributes
  const attrList = [
    ['Kepada Yth.', form.nota_kepada || 'Kepala Bagian / Pimpinan Terkait'],
    ['Dari', form.nota_dari || 'Kepala Pusat Kebijakan Strategis'],
    ['Hal', form.nota_hal || form.nama_acara || 'Penyampaian Informasi'],
    ['Sifat', form.nota_sifat || 'Biasa'],
    ['Lampiran', form.nota_lampiran || '-'],
    ['Tanggal', tglSurat],
  ];

  attrList.forEach(([label, val]) => {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        tabStops: [
          { type: 'left' as any, position: 2000 },
          { type: 'left' as any, position: 2200 },
        ],
        children: [t(label), t('\t:\t'), t(val)],
      })
    );
  });

  // Border pembatas bawah atribut
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
      spacing: { before: 80, after: 140 },
      children: [],
    })
  );

  // Paragraf Pembuka (jika ada)
  if (form.nota_pembuka && form.nota_pembuka.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 100 },
        children: [t(form.nota_pembuka.trim())],
      })
    );
  }

  // Isi (Paragraf Narasi Penjelasan, Blok Atribut Identitas Pegawai, atau Poin-Poin)
  const isi = form.nota_isi || '';
  const isiLines = isi.split('\n');
  isiLines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed) {
      const isKv = /^(Nama(?:\s+Pegawai|\s+Lengkap)?|NIP|NIK|Pangkat(?:\s*\/\s*Gol(?:\.\s*Ruang|\s*Ruang)?|\s+saat\s+ini|\s+yang\s+dituju)?|Golongan(?:\s*\/\s*Ruang)?|Jabatan(?:\s+Baru|\s+Lama|\s+saat\s+ini|\s+yang\s+dituju)?|Kelas\s+Jabatan(?:\s+Semula|\s+Usulan)?|Unit\s+Kerja|Instansi|TMT(?:\s+Jabatan|\s+Pangkat)?|Pendidikan|Masa\s+Kerja|Alamat\s+Email|Akun\s+Pengguna|Nomor\s+SK|Tautan(?:\s+Berkas|\s+Data)?|Narahubung|PIC)\s*:\s*(.+)$/i.test(
        trimmed
      );
      if (isKv) {
        const colonIdx = trimmed.indexOf(':');
        const keyStr = trimmed.slice(0, colonIdx).trim();
        const valStr = trimmed.slice(colonIdx + 1).trim();
        children.push(
          new Paragraph({
            indent: { left: 720 },
            spacing: { after: 40 },
            tabStops: [
              { type: 'left' as any, position: 2800 },
              { type: 'left' as any, position: 3000 },
            ],
            children: [t(keyStr), t('\t:\t'), t(valStr)],
          })
        );
      } else {
        const isPoint = /^\s*(\d+\.|[a-zA-Z]\.|[\-\*•])/i.test(trimmed);
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: isPoint ? undefined : { firstLine: 720 },
            spacing: { after: 80 },
            children: [t(trimmed)],
          })
        );
      }
    }
  });

  // Paragraf Penutup (jika ada)
  if (form.nota_penutup && form.nota_penutup.trim()) {
    children.push(
      spacer(8),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 200 },
        children: [t(form.nota_penutup.trim())],
      })
    );
  }

  // TTD
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(jabatanTTD)],
    }),
    spacer(10),
    spacer(10),
    spacer(10),
    spacer(10),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [t(pejabat.nama, { bold: true })],
    })
  );

  // Tembusan jika ada
  if (form.nota_tembusan) {
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
            children: [t(tmb.trim(), { size: 10 })],
          })
        );
      }
    });
  }

  // Lampiran Tambahan (Nota Dinas)
  const notaLampiranItems = form.nota_lampiran_items || form.lampiran_items || [];
  if (notaLampiranItems.length > 0) {
    children.push(...buildLampiranChildren(notaLampiranItems, form.nomor_lengkap, tglSurat));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 },
          },
        },
        children,
      },
    ],
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
