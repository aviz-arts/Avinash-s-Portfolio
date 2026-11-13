/**
 * IndexedDB helper for persisting uploaded 3D models (.fbx, .glb)
 * Large binary files (up to 100MB+) persist across page reloads without localStorage quotas.
 */

const DB_NAME = 'avinash_portfolio_studio_db';
const STORE_NAME = 'uploaded_models';
const MODEL_KEY = 'active_studio_model';

export interface StoredModelRecord {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  format: 'fbx' | 'glb';
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUploadedModel(
  name: string,
  buffer: ArrayBuffer,
  format: 'fbx' | 'glb'
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredModelRecord = {
        name,
        size: buffer.byteLength,
        buffer,
        format,
        updatedAt: Date.now(),
      };
      const putReq = store.put(record, MODEL_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('Failed to save 3D model to IndexedDB:', err);
  }
}

export async function loadUploadedModel(): Promise<StoredModelRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(MODEL_KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return null;
  }
}

export async function clearUploadedModel(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(MODEL_KEY);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
  } catch (err) {
    console.warn('Failed to clear 3D model from IndexedDB:', err);
  }
}
