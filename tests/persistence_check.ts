import {
  IndexedDbSpoolIdentityStore,
  FILORA_DATABASE_VERSION,
  SPOOL_IDENTITIES_STORE,
} from '../src/domains/spools/persistence/IndexedDbSpoolIdentityStore.js';
import { registerMeasuredSpool } from '../src/domains/spools/registerMeasuredSpool.js';

type StoredSpool = { id: string; measuredWeightGrams: number };
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
  measuredWeightGrams: 842.6,
});
assert(registered.id === 'spool-1', 'spool id must be normalized before persistence');
assert(registered.measuredWeightGrams === 842.6, 'measured weight must be preserved exactly');

const loaded = await store.get('spool-1');
assert(loaded?.id === 'spool-1', 'persisted spool must be readable');
assert(loaded.measuredWeightGrams === 842.6, 'persisted measured weight must be readable without alteration');
assert(factory.requestedVersion === FILORA_DATABASE_VERSION, 'database version must be explicit');

let invalidWeightRejected = false;
try {
  await registerMeasuredSpool(store, { id: 'spool-invalid', measuredWeightGrams: 0 });
} catch (error) {
  invalidWeightRejected = error instanceof Error && error.message.includes('positive finite');
}
assert(invalidWeightRejected, 'zero or negative measured weight must be rejected');
assert(await store.get('spool-invalid') === undefined, 'invalid measured spool must not be persisted');

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
    { id: 'spool-2', measuredWeightGrams: 500 },
  );
} catch (error) {
  failureObserved = error instanceof Error && error.message === 'forced IndexedDB failure';
}
assert(failureObserved, 'persistence failures must propagate instead of becoming success');

console.log('PASS: measured spool write/read/validation/remove/error/transaction timing checks');
