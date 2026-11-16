import { JenisNaskah, SuratTugasFormState } from '../types';

const IDB_NAME = 'pusaka_komdigi_storage_v1';
const IDB_STORE = 'naskah_drafts';

// In-memory cache agar perpindahan tab (Surat Tugas <-> Undangan <-> Nota Dinas)
// terjadi secara instan dan tidak pernah kehilangan pdf_pages_images / file_data
const memoryDrafts = new Map<JenisNaskah, SuratTugasFormState>();

function openDraftDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function setMemoryDraft(jenis: JenisNaskah, form: SuratTugasFormState): void {
  memoryDrafts.set(jenis, form);
}

export function getMemoryDraft(jenis: JenisNaskah): SuratTugasFormState | undefined {
  return memoryDrafts.get(jenis);
}

export async function saveDraftToIndexedDB(
  jenis: JenisNaskah,
  form: SuratTugasFormState
): Promise<void> {
  memoryDrafts.set(jenis, form);
  const db = await openDraftDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(form, `draft_${jenis}`);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function loadDraftFromIndexedDB(
  jenis: JenisNaskah
): Promise<SuratTugasFormState | null> {
  const mem = memoryDrafts.get(jenis);
  if (mem) return mem;

  const db = await openDraftDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(`draft_${jenis}`);
      req.onsuccess = () => {
        const result = (req.result as SuratTugasFormState) || null;
        if (result) {
          memoryDrafts.set(jenis, result);
        }
        db.close();
        resolve(result);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function removeDraftFromIndexedDB(jenis: JenisNaskah): Promise<void> {
  memoryDrafts.delete(jenis);
  const db = await openDraftDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(`draft_${jenis}`);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

