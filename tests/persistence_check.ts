import {
  IndexedDbSpoolIdentityStore,
  FILORA_DATABASE_VERSION,
  SPOOL_IDENTITIES_STORE,
} from '../src/domains/spools/persistence/IndexedDbSpoolIdentityStore.js';
import {
  calculateAvailableFilamentGrams,
  registerMeasuredSpool,
} from '../src/domains/spools/registerMeasuredSpool.js';
import type { TareSource } from '../src/domains/spools/persistence/SpoolIdentityStore.js';

type StoredSpool = {
  id: string;
  grossMeasuredWeightGrams: number;
  tareWeightGrams: number;
  tareSource: TareSource;
};
type EventHandler = ((event: Event) => unknown) | null;

class FakeRequest<T> {
  result!: T;
  error: DOMException | null = null;
  onsuccess: EventHandler = null;
  onerror: EventHandler = null;
  onupgradeneeded: EventHandler = null;
}

class FakeTransaction {
  error: DOMException | null = null;
  oncomplete: EventHandler = null;
  onerror: EventHandler = null;
  onabort: EventHandler = null;

  constructor(private readonly records: Map<string, StoredSpool>) {}

  objectStore(name: string): IDBObjectStore {
    if (name !== SPOOL_IDENTITIES_STORE) {
      throw new Error(`Unexpected object store: ${name}`);
    }

    const completeImmediately = () => {
      this.oncomplete?.(new Event('complete'));
    };

    return {
      put: (value: StoredSpool) => {
        this.records.set(value.id, { ...value });
        completeImmediately();
        return {} as IDBRequest<IDBValidKey>;
      },
      get: (id: string) => {
        const request = new FakeRequest<StoredSpool | undefined>();
        completeImmediately();
        setTimeout(() => {
          request.result = this.records.get(id);
          request.onsuccess?.(new Event('success'));
        }, 0);
        return request as unknown as IDBRequest<unknown>;
      },
      delete: (id: string) => {
        this.records.delete(id);
        completeImmediately();
        return {} as IDBRequest<undefined>;
      },
    } as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  readonly records = new Map<string, StoredSpool>();
  readonly objectStoreNames = {
    contains: (name: string) => name === SPOOL_IDENTITIES_STORE && this.storeCreated,
  } as DOMStringList;

  private storeCreated = false;

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    if (name !== SPOOL_IDENTITIES_STORE || options?.keyPath !== 'id') {
      throw new Error('Unexpected IndexedDB schema');
    }
    this.storeCreated = true;
    return {} as IDBObjectStore;
  }

  transaction(name: string, _mode?: IDBTransactionMode): IDBTransaction {
    if (!this.storeCreated || name !== SPOOL_IDENTITIES_STORE) {
      throw new Error('Store is not available');
    }
    return new FakeTransaction(this.records) as unknown as IDBTransaction;
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
      request.onupgradeneeded?.(new Event('upgradeneeded'));
      request.onsuccess?.(new Event('success'));
    }, 0);

    return request as unknown as IDBOpenDBRequest;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const factory = new FakeFactory();
const store = new IndexedDbSpoolIdentityStore(factory as unknown as IDBFactory, 'filora-test');

const registered = await registerMeasuredSpool(store, {
  id: ' spool-1 ',
  grossMeasuredWeightGrams: 842.6,
  tareWeightGrams: 210,
  tareSource: 'measured_empty_support',
});
assert(registered.id === 'spool-1', 'spool id must be normalized before persistence');
assert(registered.grossMeasuredWeightGrams === 842.6, 'gross measured weight must be preserved exactly');
assert(registered.tareWeightGrams === 210, 'tare weight must be preserved exactly');
assert(registered.tareSource === 'measured_empty_support', 'measured tare source must be preserved');
assert(
  Math.abs(calculateAvailableFilamentGrams(registered) - 632.6) < 1e-9,
  'available filament must equal gross measured weight minus tare',
);

const loaded = await store.get('spool-1');
assert(loaded?.id === 'spool-1', 'persisted spool must be readable');
assert(loaded.grossMeasuredWeightGrams === 842.6, 'persisted gross measured weight must be readable without alteration');
assert(loaded.tareWeightGrams === 210, 'persisted tare must be readable without alteration');
assert(loaded.tareSource === 'measured_empty_support', 'persisted tare source must be readable');
assert(factory.requestedVersion === FILORA_DATABASE_VERSION, 'database version must be explicit');

const manufacturerTareSpool = await registerMeasuredSpool(store, {
  id: 'spool-manufacturer-tare',
  grossMeasuredWeightGrams: 760.5,
  tareWeightGrams: 185.5,
  tareSource: 'manufacturer',
});
assert(manufacturerTareSpool.tareSource === 'manufacturer', 'manufacturer tare source must be accepted');
assert(
  Math.abs(calculateAvailableFilamentGrams(manufacturerTareSpool) - 575) < 1e-9,
  'manufacturer tare must be used in the same stock calculation',
);

const zeroAvailable = await registerMeasuredSpool(store, {
  id: 'spool-zero-available',
  grossMeasuredWeightGrams: 150,
  tareWeightGrams: 200,
  tareSource: 'manufacturer',
});
assert(calculateAvailableFilamentGrams(zeroAvailable) === 0, 'displayed available filament must never become negative');

let invalidGrossWeightRejected = false;
try {
  await registerMeasuredSpool(store, {
    id: 'spool-invalid-gross',
    grossMeasuredWeightGrams: 0,
    tareWeightGrams: 100,
    tareSource: 'manufacturer',
  });
} catch (error) {
  invalidGrossWeightRejected = error instanceof Error && error.message.includes('positive finite');
}
assert(invalidGrossWeightRejected, 'zero or negative gross measured weight must be rejected');
assert(await store.get('spool-invalid-gross') === undefined, 'invalid gross measured spool must not be persisted');

let invalidTareRejected = false;
try {
  await registerMeasuredSpool(store, {
    id: 'spool-invalid-tare',
    grossMeasuredWeightGrams: 500,
    tareWeightGrams: -1,
    tareSource: 'manufacturer',
  });
} catch (error) {
  invalidTareRejected = error instanceof Error && error.message.includes('greater than or equal to zero');
}
assert(invalidTareRejected, 'negative tare must be rejected');
assert(await store.get('spool-invalid-tare') === undefined, 'invalid tare spool must not be persisted');

let invalidTareSourceRejected = false;
try {
  await registerMeasuredSpool(store, {
    id: 'spool-invalid-source',
    grossMeasuredWeightGrams: 500,
    tareWeightGrams: 100,
    tareSource: 'unknown' as TareSource,
  });
} catch (error) {
  invalidTareSourceRejected = error instanceof Error && error.message.includes('source is invalid');
}
assert(invalidTareSourceRejected, 'unknown tare source must be rejected');
assert(await store.get('spool-invalid-source') === undefined, 'invalid tare source spool must not be persisted');

await store.remove('spool-1');
const removed = await store.get('spool-1');
assert(removed === undefined, 'controlled removal of test data must be observable');

const failingFactory = {
  open() {
    throw new Error('forced IndexedDB failure');
  },
} as unknown as IDBFactory;

let failureObserved = false;
try {
  await registerMeasuredSpool(
    new IndexedDbSpoolIdentityStore(failingFactory, 'filora-failure-test'),
    {
      id: 'spool-2',
      grossMeasuredWeightGrams: 500,
      tareWeightGrams: 100,
      tareSource: 'manufacturer',
    },
  );
} catch (error) {
  failureObserved = error instanceof Error && error.message === 'forced IndexedDB failure';
}
assert(failureObserved, 'persistence failures must propagate instead of becoming success');

console.log('PASS: measured spool gross/tare/source/available/write/read/validation/remove/error/transaction timing checks');
