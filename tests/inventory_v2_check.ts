import {
  EMPTY_PRINT_SETTINGS,
  type FilamentReference,
  type LegacyPersistedSpoolIdentity,
  type PersistedSpoolV2,
  type StorageLocation,
} from '../src/domains/spools/model.js';
import {
  FILAMENT_REFERENCES_STORE,
  FILORA_DATABASE_VERSION_V2,
  IndexedDbInventoryStore,
  LOCATIONS_STORE,
  SPOOL_IDENTITIES_STORE,
  validateInventorySnapshot,
} from '../src/domains/spools/persistence/IndexedDbInventoryStore.js';

type StoredRecord = { id: string; [key: string]: unknown };
type EventHandler = ((event: Event) => unknown) | null;

class FakeRequest<T> {
  result!: T;
  error: DOMException | null = null;
  onsuccess: EventHandler = null;
  onerror: EventHandler = null;
  onupgradeneeded: EventHandler = null;
}

function cloneStore(store: Map<string, StoredRecord>): Map<string, StoredRecord> {
  return new Map(Array.from(store, ([id, value]) => [id, structuredClone(value)]));
}

class FakeTransaction {
  error: DOMException | null = null;
  oncomplete: EventHandler = null;
  onerror: EventHandler = null;
  onabort: EventHandler = null;

  private readonly working = new Map<string, Map<string, StoredRecord>>();
  private pendingRequests = 0;
  private failed = false;

  constructor(
    private readonly stores: Map<string, Map<string, StoredRecord>>,
    names: string[],
    private readonly mode: IDBTransactionMode,
  ) {
    for (const name of names) {
      const source = stores.get(name);
      if (!source) throw new Error(`Missing store ${name}`);
      this.working.set(name, cloneStore(source));
    }
  }

  private schedule<T>(operation: () => T): IDBRequest<T> {
    const request = new FakeRequest<T>();
    this.pendingRequests += 1;
    setTimeout(() => {
      if (this.failed) return;
      try {
        request.result = operation();
        request.onsuccess?.(new Event('success'));
        this.pendingRequests -= 1;
        if (this.pendingRequests === 0) {
          if (this.mode === 'readwrite') {
            for (const [name, values] of this.working) {
              const destination = this.stores.get(name)!;
              destination.clear();
              for (const [id, value] of values) destination.set(id, structuredClone(value));
            }
          }
          this.oncomplete?.(new Event('complete'));
        }
      } catch (error) {
        const domError = error instanceof DOMException ? error : new DOMException(String(error), 'AbortError');
        request.error = domError;
        this.error = domError;
        this.failed = true;
        request.onerror?.(new Event('error'));
        this.onerror?.(new Event('error'));
        this.onabort?.(new Event('abort'));
      }
    }, 0);
    return request as unknown as IDBRequest<T>;
  }

  objectStore(name: string): IDBObjectStore {
    const store = this.working.get(name);
    if (!store) throw new Error(`Unexpected store ${name}`);
    return {
      add: (value: StoredRecord) => this.schedule<IDBValidKey>(() => {
        if (store.has(value.id)) throw new DOMException('Duplicate', 'ConstraintError');
        store.set(value.id, structuredClone(value));
        return value.id;
      }),
      put: (value: StoredRecord) => this.schedule<IDBValidKey>(() => {
        store.set(value.id, structuredClone(value));
        return value.id;
      }),
      get: (id: string) => this.schedule<StoredRecord | undefined>(() => {
        const value = store.get(id);
        return value ? structuredClone(value) : undefined;
      }) as unknown as IDBRequest<unknown>,
      getAll: () => this.schedule<StoredRecord[]>(() =>
        Array.from(store.values(), (value) => structuredClone(value)),
      ) as unknown as IDBRequest<unknown>,
      clear: () => this.schedule<undefined>(() => {
        store.clear();
        return undefined;
      }),
    } as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  currentVersion = 1;
  readonly stores = new Map<string, Map<string, StoredRecord>>([
    [SPOOL_IDENTITIES_STORE, new Map()],
  ]);
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  } as DOMStringList;

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    if (options?.keyPath !== 'id' || this.stores.has(name)) throw new Error('Unexpected schema operation');
    this.stores.set(name, new Map());
    return {} as IDBObjectStore;
  }

  transaction(names: string | string[], mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    const normalized = Array.isArray(names) ? names : [names];
    return new FakeTransaction(this.stores, normalized, mode) as unknown as IDBTransaction;
  }

  close(): void {}
}

class FakeFactory {
  readonly database = new FakeDatabase();
  requestedVersion: number | undefined;

  open(_name: string, version?: number): IDBOpenDBRequest {
    this.requestedVersion = version;
    const request = new FakeRequest<IDBDatabase>();
    request.result = this.database as unknown as IDBDatabase;
    setTimeout(() => {
      if ((version ?? this.database.currentVersion) > this.database.currentVersion) {
        request.onupgradeneeded?.(new Event('upgradeneeded'));
        this.database.currentVersion = version ?? this.database.currentVersion;
      }
      request.onsuccess?.(new Event('success'));
    }, 0);
    return request as unknown as IDBOpenDBRequest;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const factory = new FakeFactory();
const legacy: LegacyPersistedSpoolIdentity = {
  id: 'batch5-recovery-001',
  grossMeasuredWeightGrams: 842.6,
  tareWeightGrams: 210.1,
  tareSource: 'measured_empty_support',
};
factory.database.stores.get(SPOOL_IDENTITIES_STORE)!.set(legacy.id, structuredClone(legacy) as StoredRecord);

const store = new IndexedDbInventoryStore(factory as unknown as IDBFactory, 'filora-v2-test');
const migrated = await store.getSpool(legacy.id);
assert(factory.requestedVersion === FILORA_DATABASE_VERSION_V2, 'inventory store must explicitly open database version 2');
assert(factory.database.stores.has(FILAMENT_REFERENCES_STORE), 'version 2 must add filament reference store');
assert(factory.database.stores.has(LOCATIONS_STORE), 'version 2 must add location store');
assert(migrated?.id === legacy.id, 'legacy id must remain readable after upgrade');
assert(migrated.filamentReferenceId === null, 'legacy upgrade must not invent a product reference');
assert(migrated.grossMeasuredWeightGrams === 842.6, 'legacy measured gross must be preserved');
assert(migrated.tareWeightGrams === 210.1, 'legacy tare must be preserved');

const reference: FilamentReference = {
  id: 'ref-001',
  brand: 'Polymaker',
  material: 'PLA',
  diameterMm: 1.75,
  manufacturerType: 'Matte',
  manufacturerColor: 'Black',
  colorHex: '#111111',
  nominalWeightGrams: 1000,
  nozzleTemperatureC: { min: 190, max: 220 },
  bedTemperatureC: { min: 45, max: 60 },
  printSettings: { ...EMPTY_PRINT_SETTINGS, pressureAdvance: 0.04 },
};
const location: StorageLocation = { id: 'loc-atelier', name: 'Atelier' };
await store.createFilamentReference(reference);
await store.createLocation(location);

const spool: PersistedSpoolV2 = {
  recordVersion: 2,
  id: 'SP-0068',
  filamentReferenceId: reference.id,
  purchaseDate: '2026-08-30',
  openDate: null,
  supplier: 'Boutique test',
  locationId: location.id,
  purchasePriceEuros: 24.9,
  lastDriedDate: null,
  purchaseUrl: 'https://example.test/filament',
  supportKind: 'original',
  tareWeightGrams: 200,
  tareSource: 'manufacturer',
  grossMeasuredWeightGrams: null,
  stockBasis: 'nominal',
  notes: null,
};
await store.createSpools([spool]);
const snapshot = await store.getSnapshot();
assert(snapshot.spools.length === 2, 'snapshot must contain legacy and new spool');
assert(snapshot.filamentReferences.length === 1, 'snapshot must contain reference data');
assert(snapshot.locations.length === 1, 'snapshot must contain location data');

let orphanRejected = false;
try {
  validateInventorySnapshot({
    filamentReferences: [],
    locations: [location],
    spools: [spool],
  });
} catch (error) {
  orphanRejected = error instanceof Error && error.message.includes('référence filament introuvable');
}
assert(orphanRejected, 'snapshot validation must reject an active relation to a missing reference');

let locationOrphanRejected = false;
try {
  validateInventorySnapshot({
    filamentReferences: [reference],
    locations: [],
    spools: [spool],
  });
} catch (error) {
  locationOrphanRejected = error instanceof Error && error.message.includes('emplacement introuvable');
}
assert(locationOrphanRejected, 'snapshot validation must reject an active relation to a missing location');

const beforeDuplicate = await store.getSnapshot();
let duplicateBatchRejected = false;
try {
  await store.createSpools([
    { ...spool, id: 'SP-0069' },
    { ...spool, id: 'SP-0068' },
  ]);
} catch {
  duplicateBatchRejected = true;
}
assert(duplicateBatchRejected, 'series write containing a duplicate must fail');
const afterDuplicate = await store.getSnapshot();
assert(
  afterDuplicate.spools.map((item) => item.id).sort().join(',') === beforeDuplicate.spools.map((item) => item.id).sort().join(','),
  'failed series transaction must not persist its earlier items',
);

await store.replaceSnapshot({
  filamentReferences: [reference],
  locations: [location],
  spools: [{ ...spool, id: 'SP-0100' }],
});
const replaced = await store.getSnapshot();
assert(replaced.spools.length === 1 && replaced.spools[0]?.id === 'SP-0100', 'snapshot replacement must replace spool store');
assert(replaced.filamentReferences.length === 1, 'snapshot replacement must preserve references');
assert(replaced.locations.length === 1, 'snapshot replacement must preserve locations');

console.log('Batch 6 IndexedDB v2 migration checks passed');
