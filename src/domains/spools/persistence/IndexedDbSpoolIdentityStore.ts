import type { PersistedSpoolIdentity, SpoolIdentityStore } from './SpoolIdentityStore.js';

export const FILORA_DATABASE_NAME = 'filora';
export const FILORA_DATABASE_VERSION = 1;
export const SPOOL_IDENTITIES_STORE = 'spoolIdentities';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export class IndexedDbSpoolIdentityStore implements SpoolIdentityStore {
  constructor(
    private readonly factory: IDBFactory = indexedDB,
    private readonly databaseName = FILORA_DATABASE_NAME,
  ) {}

  private async openDatabase(): Promise<IDBDatabase> {
    const request = this.factory.open(this.databaseName, FILORA_DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SPOOL_IDENTITIES_STORE)) {
        database.createObjectStore(SPOOL_IDENTITIES_STORE, { keyPath: 'id' });
      }
    };

    return requestResult(request);
  }

  async create(identity: PersistedSpoolIdentity): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readwrite');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(SPOOL_IDENTITIES_STORE).add(identity);

      try {
        await Promise.all([requestResult(request), done]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          throw new Error('Une bobine avec cet ID existe déjà.');
        }
        throw error;
      }
    } finally {
      database.close();
    }
  }

  async get(id: string): Promise<PersistedSpoolIdentity | undefined> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readonly');
      const done = transactionDone(transaction);
      const result = await requestResult(
        transaction.objectStore(SPOOL_IDENTITIES_STORE).get(id) as IDBRequest<PersistedSpoolIdentity | undefined>,
      );
      await done;
      return result;
    } finally {
      database.close();
    }
  }

  async list(): Promise<PersistedSpoolIdentity[]> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readonly');
      const done = transactionDone(transaction);
      const result = await requestResult(
        transaction.objectStore(SPOOL_IDENTITIES_STORE).getAll() as IDBRequest<PersistedSpoolIdentity[]>,
      );
      await done;
      return result;
    } finally {
      database.close();
    }
  }

  async remove(id: string): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(SPOOL_IDENTITIES_STORE).delete(id);
      await done;
    } finally {
      database.close();
    }
  }
}
