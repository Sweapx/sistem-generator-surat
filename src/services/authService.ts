/**
 * authService.ts
 *
 * Layanan autentikasi dan manajemen pengguna untuk Sistem Surat Tugas PUSAKA Komdigi.
 * Mengintegrasikan autentikasi frontend dengan backend Google Apps Script / Google Sheets.
 */

import { User, AuthState } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { getSheetsWebAppUrl, isSheetsConfigured } from './sheetsService';

const STORAGE_KEY_AUTH = 'pusaka_auth_session_v1';
const STORAGE_KEY_USERS = 'pusaka_users_local_v1';

/**
 * Panggil endpoint API Google Apps Script untuk operasi Autentikasi
 */
async function callAuthApi<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
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
    throw new Error(`Respons server bukan JSON: ${rawText.slice(0, 100)}...`);
  }

  if (data.status === 'error') {
    throw new Error(data.message || 'Gagal memproses autentikasi.');
  }

  return data.result as T;
}

// ─────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_USERS;
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {}
}

export function getCurrentAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user && parsed.isAuthenticated) {
        return parsed;
      }
    }
  } catch {}
  return { isAuthenticated: false, user: null };
}

export function saveAuthSession(user: User, token?: string, rememberMe = true): void {
  const session: AuthState = {
    isAuthenticated: true,
    user,
    token: token || `tk-${Date.now()}`,
  };
  const str = JSON.stringify(session);
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY_AUTH, str);
  } else {
    sessionStorage.setItem(STORAGE_KEY_AUTH, str);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
  } catch {}
}

// ─────────────────────────────────────────────
// Login & CRUD Users
// ─────────────────────────────────────────────

export async function login(username: string, password: string, rememberMe = true): Promise<User> {
  const uClean = username.trim().toLowerCase();
  const pClean = password.trim();

  if (!uClean || !pClean) {
    throw new Error('Silakan masukkan username dan kata sandi.');
  }

  // 1. Coba verifikasi ke Google Apps Script / Google Sheets
  if (isSheetsConfigured()) {
    try {
      const userResult = await callAuthApi<User>('login', { username: uClean, password: pClean });
      if (userResult && userResult.username) {
        saveAuthSession(userResult, (userResult as any).token, rememberMe);
        return userResult;
      }
    } catch (err: any) {
      // Jika pesan error spesifik dari server (sandi salah / nonaktif), lemparkan langsung
      if (
        err.message.includes('tidak sesuai') ||
        err.message.includes('dinonaktifkan') ||
        err.message.includes('wajib diisi')
      ) {
        throw err;
      }
      console.warn('Gagal login via cloud, mencoba verifikasi data lokal:', err);
    }
  }

  // 2. Fallback verifikasi lokal jika cloud offline / belum tersambung
  const localUsers = getStoredUsers();
  const found = localUsers.find(
    (u) => u.username.toLowerCase() === uClean && u.password === pClean
  );

  if (!found) {
    throw new Error('Username atau kata sandi tidak sesuai. Silakan periksa kembali.');
  }

  if (found.status !== 'Aktif') {
    throw new Error('Akun Anda dinonaktifkan. Silakan hubungi Admin Tata Usaha.');
  }

  saveAuthSession(found, undefined, rememberMe);
  return found;
}

export async function fetchUsersList(): Promise<User[]> {
  if (isSheetsConfigured()) {
    try {
      const remoteUsers = await callAuthApi<User[]>('getUsers');
      if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        saveStoredUsers(remoteUsers);
        return remoteUsers;
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar pengguna dari Sheets:', err);
    }
  }
  return getStoredUsers();
}

export async function saveUserAccount(userData: Partial<User>): Promise<User> {
  if (!userData.username) {
    throw new Error('Username wajib diisi.');
  }

  // Simpan ke Sheets jika terhubung
  if (isSheetsConfigured()) {
    try {
      const saved = await callAuthApi<User>('saveUser', { user: userData });
      // Update cache lokal
      const list = getStoredUsers();
      const updated = list.some((u) => u.id === saved.id || u.username === saved.username)
        ? list.map((u) => (u.id === saved.id || u.username === saved.username ? { ...u, ...saved } : u))
        : [...list, saved];
      saveStoredUsers(updated);
      return saved;
    } catch (err) {
      console.warn('Gagal simpan user ke Sheets:', err);
    }
  }

  // Simpan ke cache lokal
  const list = getStoredUsers();
  const userId = userData.id || `user-${Date.now()}`;
  const newUser: User = {
    id: userId,
    username: userData.username.trim(),
    password: userData.password || 'pusaka2026',
    nama: userData.nama || userData.username,
    nip: userData.nip || '',
    role: userData.role || 'staff',
    unit_kerja: userData.unit_kerja || 'Pusat Kebijakan Strategis',
    status: userData.status || 'Aktif',
    created_at: userData.created_at || new Date().toISOString().split('T')[0],
  };

  const updated = list.some((u) => u.id === userId || u.username === newUser.username)
    ? list.map((u) => (u.id === userId || u.username === newUser.username ? newUser : u))
    : [...list, newUser];

  saveStoredUsers(updated);
  return newUser;
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (isSheetsConfigured()) {
    try {
      await callAuthApi('deleteUser', { id: userId });
    } catch (err) {
      console.warn('Gagal hapus user di Sheets:', err);
    }
  }

  const list = getStoredUsers();
  const filtered = list.filter((u) => u.id !== userId);
  saveStoredUsers(filtered);
  return true;
}
