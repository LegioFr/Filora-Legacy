import {
  normalizePersistedSpool,
  validateFilamentReference,
  validatePersistedSpoolV2,
  validateStorageLocation,
  type FilamentReference,
  type LegacyPersistedSpoolIdentity,
  type PersistedSpoolV2,
  type StorageLocation,
} from '../model.js';
import type { InventorySnapshot, InventoryStore } from './InventoryStore.js';

export const FILORA_DATABASE_NAME = 'filora';
export const FILORA_DATABASE_VERSION_V2 = 2;
export const SPOOL_IDENTITIES_STORE = 'spoolIdentities';
export const FILAMENT_REFERENCES_STORE = 'filamentReferences';
export const LOCATIONS_STORE = 'locations';

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

function duplicateError(label: string): Error {
  return new Error(`${label} existe déjà.`);
}

function normalizeUnique<T extends { id: string }>(
  values: readonly T[],
  validate: (value: T) => T,
  label: string,
): T[] {
  const seen = new Set<string>();
  return values.map((value) => {
    const normalized = validate(value);
    const key = normalized.id.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`${label} ${normalized.id} est dupliqué.`);
    }
    seen.add(key);
    return normalized;
  });
}

export function validateInventorySnapshot(snapshot: InventorySnapshot): InventorySnapshot {
  const filamentReferences = normalizeUnique(
    snapshot.filamentReferences,
    validateFilamentReference,
    'Référence filament',
  );
  const locations = normalizeUnique(snapshot.locations, validateStorageLocation, 'Emplacement');
  const spools = normalizeUnique(snapshot.spools, validatePersistedSpoolV2, 'Bobine');

  const referenceIds = new Set(filamentReferences.map((reference) => reference.id.toLowerCase()));
  const locationIds = new Set(locations.map((location) => location.id.toLowerCase()));

  for (const spool of spools) {
    if (spool.filamentReferenceId !== null && !referenceIds.has(spool.filamentReferenceId.toLowerCase())) {
      throw new Error(`Bobine ${spool.id} : référence filament introuvable.`);
    }
    if (spool.locationId !== null && !locationIds.has(spool.locationId.toLowerCase())) {
      throw new Error(`Bobine ${spool.id} : emplacement introuvable.`);
    }
  }

  return { filamentReferences, locations, spools };
}

export class IndexedDbInventoryStore implements InventoryStore {
  constructor(
    private readonly factory: IDBFactory = indexedDB,
    private readonly databaseName = FILORA_DATABASE_NAME,
  ) {}

  private async openDatabase(): Promise<IDBDatabase> {
    const request = this.factory.open(this.databaseName, FILORA_DATABASE_VERSION_V2);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SPOOL_IDENTITIES_STORE)) {
        database.createObjectStore(SPOOL_IDENTITIES_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(FILAMENT_REFERENCES_STORE)) {
        database.createObjectStore(FILAMENT_REFERENCES_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(LOCATIONS_STORE)) {
        database.createObjectStore(LOCATIONS_STORE, { keyPath: 'id' });
      }
    };

    return requestResult(request);
  }

  async getSnapshot(): Promise<InventorySnapshot> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(
        [SPOOL_IDENTITIES_STORE, FILAMENT_REFERENCES_STORE, LOCATIONS_STORE],
        'readonly',
      );
      const done = transactionDone(transaction);
      const spoolsRequest = transaction.objectStore(SPOOL_IDENTITIES_STORE).getAll() as IDBRequest<
        Array<LegacyPersistedSpoolIdentity | PersistedSpoolV2>
      >;
      const referencesRequest = transaction.objectStore(FILAMENT_REFERENCES_STORE).getAll() as IDBRequest<FilamentReference[]>;
      const locationsRequest = transaction.objectStore(LOCATIONS_STORE).getAll() as IDBRequest<StorageLocation[]>;
      const [rawSpools, filamentReferences, locations] = await Promise.all([
        requestResult(spoolsRequest),
        requestResult(referencesRequest),
        requestResult(locationsRequest),
      ]);
      await done;

      return validateInventorySnapshot({
        spools: rawSpools.map(normalizePersistedSpool),
        filamentReferences,
        locations,
      });
    } finally {
      database.close();
    }
  }

  async listSpools(): Promise<PersistedSpoolV2[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.spools].sort((left, right) => left.id.localeCompare(right.id));
  }

  async getSpool(id: string): Promise<PersistedSpoolV2 | undefined> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readonly');
      const done = transactionDone(transaction);
      const raw = await requestResult(
        transaction.objectStore(SPOOL_IDENTITIES_STORE).get(id) as IDBRequest<
          LegacyPersistedSpoolIdentity | PersistedSpoolV2 | undefined
        >,
      );
      await done;
      return raw === undefined ? undefined : normalizePersistedSpool(raw);
    } finally {
      database.close();
    }
  }

  async listFilamentReferences(): Promise<FilamentReference[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.filamentReferences].sort((left, right) => left.id.localeCompare(right.id));
  }

  async getFilamentReference(id: string): Promise<FilamentReference | undefined> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(FILAMENT_REFERENCES_STORE, 'readonly');
      const done = transactionDone(transaction);
      const result = await requestResult(
        transaction.objectStore(FILAMENT_REFERENCES_STORE).get(id) as IDBRequest<FilamentReference | undefined>,
      );
      await done;
      return result === undefined ? undefined : validateFilamentReference(result);
    } finally {
      database.close();
    }
  }

  async createFilamentReference(reference: FilamentReference): Promise<void> {
    await this.addOne(FILAMENT_REFERENCES_STORE, validateFilamentReference(reference), 'Cette référence filament');
  }

  async updateFilamentReference(reference: FilamentReference): Promise<void> {
    await this.putOne(FILAMENT_REFERENCES_STORE, validateFilamentReference(reference));
  }

  async listLocations(): Promise<StorageLocation[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.locations].sort((left, right) => left.name.localeCompare(right.name));
  }

  async getLocation(id: string): Promise<StorageLocation | undefined> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(LOCATIONS_STORE, 'readonly');
      const done = transactionDone(transaction);
      const result = await requestResult(
        transaction.objectStore(LOCATIONS_STORE).get(id) as IDBRequest<StorageLocation | undefined>,
      );
      await done;
      return result === undefined ? undefined : validateStorageLocation(result);
    } finally {
      database.close();
    }
  }

  async createLocation(location: StorageLocation): Promise<void> {
    await this.addOne(LOCATIONS_STORE, validateStorageLocation(location), 'Cet emplacement');
  }

  async createSpools(spools: PersistedSpoolV2[]): Promise<void> {
    const validated = normalizeUnique(spools, validatePersistedSpoolV2, 'Bobine');
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(SPOOL_IDENTITIES_STORE, 'readwrite');
      const done = transactionDone(transaction);
      const objectStore = transaction.objectStore(SPOOL_IDENTITIES_STORE);
      const requests = validated.map((spool) => requestResult(objectStore.add(spool)));
      try {
        await Promise.all([...requests, done]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          throw duplicateError('Une bobine avec cet ID');
        }
        throw error;
      }
    } finally {
      database.close();
    }
  }

  async updateSpool(spool: PersistedSpoolV2): Promise<void> {
    await this.putOne(SPOOL_IDENTITIES_STORE, validatePersistedSpoolV2(spool));
  }

  async replaceSnapshot(snapshot: InventorySnapshot): Promise<void> {
    const validated = validateInventorySnapshot(snapshot);
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(
        [SPOOL_IDENTITIES_STORE, FILAMENT_REFERENCES_STORE, LOCATIONS_STORE],
        'readwrite',
      );
      const done = transactionDone(transaction);
      const spoolStore = transaction.objectStore(SPOOL_IDENTITIES_STORE);
      const referenceStore = transaction.objectStore(FILAMENT_REFERENCES_STORE);
      const locationStore = transaction.objectStore(LOCATIONS_STORE);
      const requests: Promise<unknown>[] = [
        requestResult(spoolStore.clear()),
        requestResult(referenceStore.clear()),
        requestResult(locationStore.clear()),
      ];
      for (const reference of validated.filamentReferences) {
        requests.push(requestResult(referenceStore.add(reference)));
      }
      for (const location of validated.locations) {
        requests.push(requestResult(locationStore.add(location)));
      }
      for (const spool of validated.spools) {
        requests.push(requestResult(spoolStore.add(spool)));
      }
      await Promise.all([...requests, done]);
    } finally {
      database.close();
    }
  }

  private async addOne(storeName: string, value: { id: string }, label: string): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(storeName).add(value);
      try {
        await Promise.all([requestResult(request), done]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          throw duplicateError(label);
        }
        throw error;
      }
    } finally {
      database.close();
    }
  }

  private async putOne(storeName: string, value: { id: string }): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(storeName).put(value);
      await Promise.all([requestResult(request), done]);
    } finally {
      database.close();
    }
  }
}
