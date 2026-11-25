/**
 * sheetsService.ts
 *
 * Service untuk integrasi antara aplikasi React dan Google Sheets + Google Drive
 * melalui Google Apps Script Web App sebagai perantara (proxy API).
 */

import { NomorSuratRecord, Pegawai, Pejabat } from '../types';

const STORAGE_KEY_SHEETS_URL = 'pusdatin_sheets_webapp_url';

const OLD_SHEETS_URLS = [
  'https://script.google.com/macros/s/AKfycbwFcLRzlRE5nkNHimIuOPKa29iJMDg05swlIwC-7iiysKo88xfLM3o3vAxvIIntk1ve/exec',
];

export const DEFAULT_SHEETS_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_SHEETS_WEBAPP_URL?.trim()) ||
  'https://script.google.com/macros/s/AKfycbzyrXWP5Lx2BC3RPYYcn1r_M0sDIO85A4MCmlgHn1yJIAUnHdMxfkUNMw7FqclwDPn3Rg/exec';

// ─────────────────────────────────────────────
// URL Management
// ─────────────────────────────────────────────

/** Ambil URL Apps Script aktif (otomatis migrasi dari URL lama ke URL aktif terbaru) */
export function getSheetsWebAppUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHEETS_URL);
    if (
      stored &&
      stored.trim().startsWith('https://script.google.com/macros/s/') &&
      !OLD_SHEETS_URLS.includes(stored.trim())
    ) {
      return stored.trim();
    }
    localStorage.setItem(STORAGE_KEY_SHEETS_URL, DEFAULT_SHEETS_URL);
  } catch {}
  return DEFAULT_SHEETS_URL;
}

/** Simpan URL Apps Script ke localStorage */
export function setSheetsWebAppUrl(url: string): void {
  const clean = url.trim() || DEFAULT_SHEETS_URL;
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_URL, clean);
  } catch {}
}

/** Reset URL ke DEFAULT_SHEETS_URL bawaan sistem */
export function resetSheetsWebAppUrlToDefault(): string {
  setSheetsWebAppUrl(DEFAULT_SHEETS_URL);
  return DEFAULT_SHEETS_URL;
}

/** Cek apakah URL sudah valid */
export function isSheetsConfigured(): boolean {
  const url = getSheetsWebAppUrl();
  return url.startsWith('https://script.google.com/macros/s/');
}

// ─────────────────────────────────────────────
// Payload Sanitizer (Mencegah Payload Bloat & Kegagalan Upload Drive/Sheets)
// ─────────────────────────────────────────────

/**
 * Bersihkan objek record sebelum dikirim ke Google Apps Script:
 * - Menghapus `form_state` (yang berisi gambar lampiran PDF resolusi tinggi ber-MB-MB)
 * - Menghindari duplikasi `pdf_base64` + `docx_base64` (hanya kirim 1 field `docx_base64`)
 * sehingga ukuran POST minimal, cepat, dan tidak gagal di proxy redirect Google Apps Script.
 */
function sanitizeRecordForSheetsPayload(
  record: Partial<NomorSuratRecord>,
  includeFileBase64 = true
): Record<string, unknown> {
  const fileBase64 = includeFileBase64
    ? record.docx_base64 || record.pdf_base64 || undefined
    : undefined;
  const fileName = record.docx_filename || record.pdf_filename || record.link_pdf;

  return {
    id: record.id,
    nomor_urut: record.nomor_urut,
    tahun: record.tahun,
    bulan: record.bulan,
    nomor_lengkap: record.nomor_lengkap,
    tanggal: record.tanggal || record.tanggal_surat,
    tanggal_surat: record.tanggal_surat || record.tanggal,
    tanggal_dibuat: record.tanggal_dibuat,
    perihal: record.perihal,
    dibuat_oleh: record.dibuat_oleh,
    tujuan_lokasi: record.tujuan_lokasi,
    jumlah_pegawai: record.jumlah_pegawai,
    penandatangan_nama: record.penandatangan_nama,
    dasar_surat: record.dasar_surat,
    jenis: record.jenis,
    jenis_naskah: record.jenis_naskah,
    kode_klasifikasi: record.kode_klasifikasi,
    kategori_klasifikasi: record.kategori_klasifikasi,
    kepada: record.kepada,
    status_ttd: record.status_ttd,
    topik_tim: record.topik_tim,
    konseptor: record.konseptor,
    status_surat: record.status_surat,
    link_word: record.link_word,
    link_pdf: record.link_pdf,
    drive_url: record.drive_url,
    docx_filename: fileName,
    pdf_filename: fileName,
    file_mime_type:
      record.file_mime_type ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ...(fileBase64 ? { docx_base64: fileBase64 } : {}),
  };
}

// ─────────────────────────────────────────────
// Generic Fetch Helper dengan Retry & Auto-Fallback URL
// ─────────────────────────────────────────────

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function executeSingleRequest<T>(
  targetBaseUrl: string,
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const url = new URL(targetBaseUrl);
  url.searchParams.set('action', action);
  if (!payload) {
    // Cache-buster untuk GET agar browser tidak memakai respons redirect lama
    url.searchParams.set('_t', String(Date.now()));
  }

  const response = await fetch(url.toString(), {
    method: payload ? 'POST' : 'GET',
    mode: 'cors',
    credentials: 'omit',
    headers: payload ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  const rawText = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (rawText.includes('accounts.google.com') || rawText.includes('ServiceLogin')) {
      throw new Error(
        'Akses dibatasi oleh Google (perlu login). Pada setelan Deployment Apps Script, pastikan opsi "Who has access" diubah menjadi "Anyone".'
      );
    }
    throw new Error(`Respons Apps Script bukan JSON: ${rawText.slice(0, 120)}...`);
  }

  if (data.status === 'error') {
    throw new Error(data.message || 'Apps Script mengembalikan status error.');
  }

  return data.result as T;
}

async function callAppsScript<T>(
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  let baseUrl = getSheetsWebAppUrl();
  if (!baseUrl) {
    throw new Error('URL Google Apps Script belum dikonfigurasi.');
  }

  let lastError: unknown = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await executeSingleRequest<T>(baseUrl, action, payload);
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');

      // Jika error bisnis eksplisit dari Apps Script (misal action tidak dikenal), jangan retry sia-sia
      if (msg.includes('Action tidak dikenal') || msg.includes('Akses dibatasi oleh Google')) {
        break;
      }

      // Jika URL kustom di localStorage ternyata sudah mati/berbeda dari DEFAULT_SHEETS_URL, otomatis pulihkan ke DEFAULT_SHEETS_URL
      if (attempt === 1 && baseUrl !== DEFAULT_SHEETS_URL) {
        console.warn('URL Apps Script lokal gagal, memulihkan ke DEFAULT_SHEETS_URL...');
        baseUrl = resetSheetsWebAppUrlToDefault();
        continue;
      }

      if (attempt < maxAttempts) {
        await delay(attempt * 900);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Gagal menghubungi server Google Apps Script.');
}

// ─────────────────────────────────────────────
// Nomor Surat Operations
// ─────────────────────────────────────────────

/**
 * Ambil semua record nomor surat dari Google Sheets.
 */
export async function fetchNomorSuratFromSheets(): Promise<NomorSuratRecord[]> {
  return callAppsScript<NomorSuratRecord[]>('getNomorSurat');
}

/**
 * Tambahkan record nomor surat baru ke Google Sheets & unggah dokumen ke Google Drive.
 */
export async function appendNomorSuratToSheets(
  record: Omit<NomorSuratRecord, 'id'>
): Promise<NomorSuratRecord> {
  const cleanRecord = sanitizeRecordForSheetsPayload(record, true);
  try {
    return await callAppsScript<NomorSuratRecord>('appendNomorSurat', { record: cleanRecord });
  } catch (err) {
    // Jika gagal karena ukuran lampiran base64 terlalu besar, fallback simpan metadata surat agar penomoran Sheets & file dasar Drive tetap tercatat
    const hasHeavyBase64 =
      typeof cleanRecord.docx_base64 === 'string' && cleanRecord.docx_base64.length > 2_500_000;
    if (hasHeavyBase64) {
      console.warn('Mengulang sinkronisasi tanpa lampiran biner raksasa:', err);
      const lightRecord = sanitizeRecordForSheetsPayload(record, false);
      return await callAppsScript<NomorSuratRecord>('appendNomorSurat', { record: lightRecord });
    }
    throw err;
  }
}

/**
 * Update record nomor surat yang sudah ada di Google Sheets & Google Drive.
 */
export async function updateNomorSuratInSheets(
  record: NomorSuratRecord
): Promise<NomorSuratRecord> {
  const cleanRecord = sanitizeRecordForSheetsPayload(record, true);
  try {
    return await callAppsScript<NomorSuratRecord>('updateNomorSurat', { record: cleanRecord });
  } catch (err) {
    const hasHeavyBase64 =
      typeof cleanRecord.docx_base64 === 'string' && cleanRecord.docx_base64.length > 2_500_000;
    if (hasHeavyBase64) {
      const lightRecord = sanitizeRecordForSheetsPayload(record, false);
      return await callAppsScript<NomorSuratRecord>('updateNomorSurat', { record: lightRecord });
    }
    throw err;
  }
}

/**
 * Ambil nomor urut terakhir dari Sheets.
 */
export async function fetchLastNomorUrut(): Promise<{
  nomor_urut: number;
  tahun: number;
}> {
  return callAppsScript<{ nomor_urut: number; tahun: number }>('getLastNomor');
}

// ─────────────────────────────────────────────
// Pegawai & Pejabat Operations (Data Master dikelola di aplikasi; hindari request sia-sia ke action yang tidak ada)
// ─────────────────────────────────────────────

export async function fetchPegawaiFromSheets(): Promise<Pegawai[]> {
  return [];
}

export async function fetchPejabatFromSheets(): Promise<Pejabat[]> {
  return [];
}

// ─────────────────────────────────────────────
// Sync Status Helper
// ─────────────────────────────────────────────

export interface SyncStatus {
  ok: boolean;
  message: string;
  lastSync?: string;
}

export async function pingSheets(): Promise<SyncStatus> {
  try {
    const result = await callAppsScript<{ timestamp: string }>('ping');
    return {
      ok: true,
      message: 'Terhubung ke Google Sheets.',
      lastSync: result.timestamp,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Gagal terhubung.',
    };
  }
}

export interface DriveTestResult {
  ok: boolean;
  message: string;
  monthFolderUrl?: string;
  monthFolder?: string;
  testFileUrl?: string;
}

export async function testDriveConnection(): Promise<DriveTestResult> {
  try {
    const result = await callAppsScript<{
      message: string;
      parentFolder: string;
      monthFolder: string;
      monthFolderUrl: string;
      testFileUrl: string;
    }>('testDrive');
    return {
      ok: true,
      message: result.message || 'Koneksi Google Drive berhasil!',
      monthFolderUrl: result.monthFolderUrl,
      monthFolder: result.monthFolder,
      testFileUrl: result.testFileUrl,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Gagal terhubung ke Google Drive.',
    };
  }
}
