import { JenisNaskah, KlasifikasiItem } from '../types';
import { KLASIFIKASI_SURAT } from '../data/klasifikasiData';

/**
 * Format nomor naskah dinas resmi Komdigi Pusat Kebijakan Strategis:
 * - Surat Tugas  : {urut}/SJ.9/{kode}/{bulan}/{tahun}  (Contoh: 851/SJ.9/KP.01.06/09/2026)
 * - Surat Undangan: B-{urut}/SJ.9/{kode}/{bulan}/{tahun} (Contoh: B-142/SJ.9/KU.03.01/02/2026)
 * - Nota Dinas   : {urut}/SJ.9/{kode}/{bulan}/{tahun}  (Contoh: 116/SJ.9/KP.01.01/02/2026)
 */
export function formatNomorNaskah(
  jenis: JenisNaskah,
  nomorUrut: number | string,
  kodeKlasifikasi: string,
  bulan: string,
  tahun: number | string
): string {
  const urutStr = String(nomorUrut || 1);
  const kodeStr = (kodeKlasifikasi || 'KP.01.06').trim();
  const bulanStr = String(bulan || '01').padStart(2, '0');
  const tahunStr = String(tahun || new Date().getFullYear());

  if (jenis === 'UNDANGAN') {
    return `B-${urutStr}/SJ.9/${kodeStr}/${bulanStr}/${tahunStr}`;
  }
  return `${urutStr}/SJ.9/${kodeStr}/${bulanStr}/${tahunStr}`;
}

/**
 * Default kode klasifikasi berdasarkan jenis naskah
 */
export function getDefaultKlasifikasi(jenis: JenisNaskah): KlasifikasiItem {
  if (jenis === 'TUGAS') {
    // KP.01.06 - Penugasan / Penunjukan / Surat Perintah
    const found = KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === 'KP.01.06');
    if (found) return found;
  }
  if (jenis === 'UNDANGAN') {
    // PR.01.01 - Rencana Strategis Kementerian / Rapat Koordinasi
    const found = KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === 'PR.01.01');
    if (found) return found;
  }
  if (jenis === 'NOTA_DINAS') {
    // KP.01.01 - Data Perorangan / Tata Usaha
    const found = KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === 'KP.01.01');
    if (found) return found;
  }
  return (
    KLASIFIKASI_SURAT.find((k) => k.kode_lengkap === 'KP.01.06') || KLASIFIKASI_SURAT[0]
  );
}

/**
 * Label yang ramah pengguna untuk setiap Jenis Naskah
 */
export function getJenisNaskahLabel(jenis?: JenisNaskah): string {
  switch (jenis) {
    case 'UNDANGAN':
      return 'Surat Undangan';
    case 'NOTA_DINAS':
      return 'Nota Dinas';
    case 'TUGAS':
    default:
      return 'Surat Tugas';
  }
}

/**
 * Singkatan kode resmi buku agenda: ST, ND, UND
 */
export function getJenisNaskahCode(jenis?: JenisNaskah | string): 'ST' | 'ND' | 'UND' {
  if (!jenis) return 'ST';
  const upper = String(jenis).toUpperCase();
  if (upper.includes('UND') || upper === 'UNDANGAN') return 'UND';
  if (upper.includes('ND') || upper === 'NOTA_DINAS' || upper.includes('NOTA')) return 'ND';
  return 'ST';
}

