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
import type {
  InventoryBatchCreate,
  InventorySnapshot,
  InventoryStore,
} from './InventoryStore.js';

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

function findById<T extends { id: string }>(values: readonly T[], id: string): T | undefined {
  const key = id.trim().toLowerCase();
  return values.find((value) => value.id.toLowerCase() === key);
}

function validateSpoolRelations(snapshot: InventorySnapshot, spool: PersistedSpoolV2): void {
  if (
    spool.filamentReferenceId !== null
    && !findById(snapshot.filamentReferences, spool.filamentReferenceId)
  ) {
    throw new Error(`Bobine ${spool.id} : référence filament introuvable.`);
  }
  if (spool.locationId !== null && !findById(snapshot.locations, spool.locationId)) {
    throw new Error(`Bobine ${spool.id} : emplacement introuvable.`);
  }
}

export function validateInventorySnapshot(snapshot: InventorySnapshot): InventorySnapshot {
  const filamentReferences = normalizeUnique(
    snapshot.filamentReferences,
    validateFilamentReference,
    'Référence filament',
  );
  const locations = normalizeUnique(snapshot.locations, validateStorageLocation, 'Emplacement');
  const spools = normalizeUnique(snapshot.spools, validatePersistedSpoolV2, 'Bobine');
  const normalized = { filamentReferences, locations, spools };

  for (const spool of spools) {
    validateSpoolRelations(normalized, spool);
  }

  return normalized;
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
    const snapshot = await this.getSnapshot();
    return findById(snapshot.spools, id);
  }

  async listFilamentReferences(): Promise<FilamentReference[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.filamentReferences].sort((left, right) => left.id.localeCompare(right.id));
  }

  async getFilamentReference(id: string): Promise<FilamentReference | undefined> {
    const snapshot = await this.getSnapshot();
    return findById(snapshot.filamentReferences, id);
  }

  async createFilamentReference(reference: FilamentReference): Promise<void> {
    await this.addOne(FILAMENT_REFERENCES_STORE, validateFilamentReference(reference), 'Cette référence filament');
  }

  async updateFilamentReference(reference: FilamentReference): Promise<void> {
    const validated = validateFilamentReference(reference);
    const snapshot = await this.getSnapshot();
    const existing = findById(snapshot.filamentReferences, validated.id);
    if (!existing) {
      throw new Error('La référence filament à modifier est introuvable.');
    }
    await this.putOne(FILAMENT_REFERENCES_STORE, { ...validated, id: existing.id });
  }

  async listLocations(): Promise<StorageLocation[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.locations].sort((left, right) => left.name.localeCompare(right.name));
  }

  async getLocation(id: string): Promise<StorageLocation | undefined> {
    const snapshot = await this.getSnapshot();
    return findById(snapshot.locations, id);
  }

  async createLocation(location: StorageLocation): Promise<void> {
    await this.addOne(LOCATIONS_STORE, validateStorageLocation(location), 'Cet emplacement');
  }

  async createSpools(spools: PersistedSpoolV2[]): Promise<void> {
    await this.createInventoryBatch({ spools });
  }

  async createInventoryBatch(batch: InventoryBatchCreate): Promise<void> {
    const filamentReference = batch.filamentReference
      ? validateFilamentReference(batch.filamentReference)
      : undefined;
    const location = batch.location ? validateStorageLocation(batch.location) : undefined;
    const spools = normalizeUnique(batch.spools, validatePersistedSpoolV2, 'Bobine');

    const current = await this.getSnapshot();
    const futureSnapshot: InventorySnapshot = {
      filamentReferences: [
        ...current.filamentReferences,
        ...(filamentReference ? [filamentReference] : []),
      ],
      locations: [...current.locations, ...(location ? [location] : [])],
      spools: [...current.spools, ...spools],
    };
    validateInventorySnapshot(futureSnapshot);

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
      const requests: Promise<unknown>[] = [];

      if (filamentReference) {
        requests.push(requestResult(referenceStore.add(filamentReference)));
      }
      if (location) {
        requests.push(requestResult(locationStore.add(location)));
      }
      for (const spool of spools) {
        requests.push(requestResult(spoolStore.add(spool)));
      }

      try {
        await Promise.all([...requests, done]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          throw duplicateError('Une donnée du lot');
        }
        throw error;
      }
    } finally {
      database.close();
    }
  }

  async updateSpool(spool: PersistedSpoolV2): Promise<void> {
    const validated = validatePersistedSpoolV2(spool);
    const snapshot = await this.getSnapshot();
    const existing = findById(snapshot.spools, validated.id);
    if (!existing) {
      throw new Error('La bobine à modifier est introuvable.');
    }
    const normalized = { ...validated, id: existing.id };
    validateSpoolRelations(snapshot, normalized);
    await this.putOne(SPOOL_IDENTITIES_STORE, normalized);
  }

  async createFilamentReferenceAndUpdateSpool(
    reference: FilamentReference,
    spool: PersistedSpoolV2,
  ): Promise<void> {
    const validatedReference = validateFilamentReference(reference);
    const validatedSpool = validatePersistedSpoolV2(spool);
    if (validatedSpool.filamentReferenceId?.toLowerCase() !== validatedReference.id.toLowerCase()) {
      throw new Error('La bobine doit être reliée à la nouvelle référence filament du même changement.');
    }

    const snapshot = await this.getSnapshot();
    const existingSpool = findById(snapshot.spools, validatedSpool.id);
    if (!existingSpool) {
      throw new Error('La bobine à modifier est introuvable.');
    }
    if (findById(snapshot.filamentReferences, validatedReference.id)) {
      throw duplicateError('Cette référence filament');
    }
    if (validatedSpool.locationId !== null && !findById(snapshot.locations, validatedSpool.locationId)) {
      throw new Error(`Bobine ${validatedSpool.id} : emplacement introuvable.`);
    }

    const normalizedSpool = {
      ...validatedSpool,
      id: existingSpool.id,
      filamentReferenceId: validatedReference.id,
    };

    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(
        [SPOOL_IDENTITIES_STORE, FILAMENT_REFERENCES_STORE],
        'readwrite',
      );
      const done = transactionDone(transaction);
      const referenceRequest = transaction.objectStore(FILAMENT_REFERENCES_STORE).add(validatedReference);
      const spoolRequest = transaction.objectStore(SPOOL_IDENTITIES_STORE).put(normalizedSpool);
      try {
        await Promise.all([requestResult(referenceRequest), requestResult(spoolRequest), done]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          throw duplicateError('Cette référence filament');
        }
        throw error;
      }
    } finally {
      database.close();
    }
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
      for (const item of validated.locations) {
        requests.push(requestResult(locationStore.add(item)));
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
