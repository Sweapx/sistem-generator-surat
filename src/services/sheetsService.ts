/**
 * sheetsService.ts
 *
 * Service untuk integrasi antara aplikasi React dan Google Sheets
 * melalui Google Apps Script Web App sebagai perantara (proxy API).
 *
 * CARA SETUP:
 * 1. Buka Google Sheets yang dipakai sebagai database
 * 2. Klik Extensions → Apps Script
 * 3. Paste seluruh isi file `google-apps-script/Code.gs` ke editor Apps Script
 * 4. Klik Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (atau Anyone within [domain organisasi])
 * 5. Copy URL deployment yang dihasilkan
 * 6. Paste URL tersebut di field konfigurasi di aplikasi ini (tombol "Sheets: Belum Setup")
 * 7. Simpan URL — disimpan di localStorage browser
 */

import { NomorSuratRecord, Pegawai, Pejabat } from '../types';

const STORAGE_KEY_SHEETS_URL = 'pusdatin_sheets_webapp_url';

const OLD_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwFcLRzlRE5nkNHimIuOPKa29iJMDg05swlIwC-7iiysKo88xfLM3o3vAxvIIntk1ve/exec';

export const DEFAULT_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbzyrXWP5Lx2BC3RPYYcn1r_M0sDIO85A4MCmlgHn1yJIAUnHdMxfkUNMw7FqclwDPn3Rg/exec';

// ─────────────────────────────────────────────
// URL Management
// ─────────────────────────────────────────────

/** Ambil URL Apps Script dari localStorage (otomatis migrasi ke URL aktif terbaru) */
export function getSheetsWebAppUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEY_SHEETS_URL);
  if (stored && stored.trim() !== '' && stored.trim() !== OLD_SHEETS_URL) {
    return stored.trim();
  }
  localStorage.setItem(STORAGE_KEY_SHEETS_URL, DEFAULT_SHEETS_URL);
  return DEFAULT_SHEETS_URL;
}

/** Simpan URL Apps Script ke localStorage */
export function setSheetsWebAppUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_SHEETS_URL, url.trim());
}

/** Cek apakah URL sudah di-set */
export function isSheetsConfigured(): boolean {
  const url = getSheetsWebAppUrl();
  return url.startsWith('https://script.google.com/macros/s/');
}

// ─────────────────────────────────────────────
// Generic fetch helper
// ─────────────────────────────────────────────

async function callAppsScript<T>(
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const baseUrl = getSheetsWebAppUrl();
  if (!baseUrl) {
    throw new Error('URL Google Apps Script belum dikonfigurasi.');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('action', action);

  const response = await fetch(url.toString(), {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'text/plain;charset=utf-8' } : {},
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
        'Akses dibatasi oleh Google (perlu login). Pada setelan Deployment Apps Script, pastikan opsi "Who has access" (Siapa yang memiliki akses) diubah menjadi "Anyone" (Siapa saja).'
      );
    }
    throw new Error(`Respons Apps Script bukan JSON: ${rawText.slice(0, 120)}...`);
  }

  if (data.status === 'error') {
    throw new Error(data.message || 'Apps Script returned an error.');
  }

  return data.result as T;
}

// ─────────────────────────────────────────────
// Nomor Surat Operations
// ─────────────────────────────────────────────

/**
 * Ambil semua record nomor surat dari Google Sheets.
 * Gunakan ini untuk sinkronisasi saat aplikasi pertama kali dibuka.
 */
export async function fetchNomorSuratFromSheets(): Promise<NomorSuratRecord[]> {
  return callAppsScript<NomorSuratRecord[]>('getNomorSurat');
}

/**
 * Tambahkan record nomor surat baru ke Google Sheets.
 * Dipanggil saat user klik "Simpan & Generate Surat".
 *
 * @returns Record yang tersimpan dengan nomor yang dikonfirmasi dari Sheets
 */
export async function appendNomorSuratToSheets(
  record: Omit<NomorSuratRecord, 'id'>
): Promise<NomorSuratRecord> {
  return callAppsScript<NomorSuratRecord>('appendNomorSurat', { record });
}

/**
 * Update record nomor surat yang sudah ada di Google Sheets & Google Drive.
 * Dipanggil saat user mengedit surat tugas yang sudah ada.
 */
export async function updateNomorSuratInSheets(
  record: NomorSuratRecord
): Promise<NomorSuratRecord> {
  return callAppsScript<NomorSuratRecord>('updateNomorSurat', { record });
}

/**
 * Ambil nomor urut terakhir dari Sheets (untuk generate nomor berikutnya).
 * Lebih ringan daripada fetch seluruh list.
 */
export async function fetchLastNomorUrut(): Promise<{
  nomor_urut: number;
  tahun: number;
}> {
  return callAppsScript<{ nomor_urut: number; tahun: number }>('getLastNomor');
}

// ─────────────────────────────────────────────
// Pegawai Operations
// ─────────────────────────────────────────────

/**
 * Ambil seluruh data pegawai dari Google Sheets jika sheet pegawai tersedia.
 */
export async function fetchPegawaiFromSheets(): Promise<Pegawai[]> {
  try {
    const res = await callAppsScript<Pegawai[]>('getPegawai');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Pejabat Operations
// ─────────────────────────────────────────────

/**
 * Ambil seluruh data pejabat penandatangan dari Google Sheets jika tersedia.
 */
export async function fetchPejabatFromSheets(): Promise<Pejabat[]> {
  try {
    const res = await callAppsScript<Pejabat[]>('getPejabat');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Sync Status Helper
// ─────────────────────────────────────────────

export interface SyncStatus {
  ok: boolean;
  message: string;
  lastSync?: string;
}

/**
 * Ping Apps Script untuk cek apakah koneksi aktif.
 */
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

/**
 * Uji koneksi Google Drive — memanggil testDriveOtorisasi() di Apps Script.
 * Fungsi ini akan membuat folder bulan + file uji di Google Drive.
 */
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
