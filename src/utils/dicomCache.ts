// utils/dicomCache.ts
export class DicomCache {
  private static readonly DB_NAME = 'DicomCache';
  private static readonly STORE_NAME = 'instances';
  private static readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DicomCache.DB_NAME, DicomCache.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DicomCache.STORE_NAME)) {
          const store = db.createObjectStore(DicomCache.STORE_NAME, { keyPath: 'sopInstanceUID' });
          store.createIndex('studyUID', 'studyUID', { unique: false });
          store.createIndex('seriesUID', 'seriesUID', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveInstance(
    sopInstanceUID: string,
    studyUID: string,
    seriesUID: string,
    blob: Blob
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DicomCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DicomCache.STORE_NAME);

      const record = {
        sopInstanceUID,
        studyUID,
        seriesUID,
        blob,
        timestamp: Date.now()
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getInstance(sopInstanceUID: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DicomCache.STORE_NAME], 'readonly');
      const store = transaction.objectStore(DicomCache.STORE_NAME);

      const request = store.get(sopInstanceUID);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInstance(sopInstanceUID: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DicomCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DicomCache.STORE_NAME);

      const request = store.delete(sopInstanceUID);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStudy(studyUID: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DicomCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DicomCache.STORE_NAME);
      const index = store.index('studyUID');

      const request = index.openCursor(IDBKeyRange.only(studyUID));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupOlderThan(maxAgeMs: number): Promise<void> {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - maxAgeMs;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DicomCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DicomCache.STORE_NAME);
      const index = store.index('timestamp');

      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// 创建全局缓存实例
export const dicomCache = new DicomCache();

