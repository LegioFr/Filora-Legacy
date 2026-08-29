import {
  IndexedDbSpoolIdentityStore,
  FILORA_DATABASE_VERSION,
  SPOOL_IDENTITIES_STORE,
} from '../src/domains/spools/persistence/IndexedDbSpoolIdentityStore.js';

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

  constructor(private readonly records: Map<string, { id: string }>) {}

  objectStore(name: string): IDBObjectStore {
    if (name !== SPOOL_IDENTITIES_STORE) {
      throw new Error(`Unexpected object store: ${name}`);
    }

    const completeSoon = () => {
      setTimeout(() => this.oncomplete?.(new Event('complete')), 0);
    };

    return {
      put: (value: { id: string }) => {
        this.records.set(value.id, { ...value });
        completeSoon();
        return {} as IDBRequest<IDBValidKey>;
      },
      get: (id: string) => {
        const request = new FakeRequest<{ id: string } | undefined>();
        setTimeout(() => {
          request.result = this.records.get(id);
          request.onsuccess?.(new Event('success'));
          completeSoon();
        }, 0);
        return request as unknown as IDBRequest<unknown>;
      },
      delete: (id: string) => {
        this.records.delete(id);
        completeSoon();
        return {} as IDBRequest<undefined>;
      },
    } as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  readonly records = new Map<string, { id: string }>();
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

await store.save({ id: 'spool-1' });
const loaded = await store.get('spool-1');
assert(loaded?.id === 'spool-1', 'persisted identity must be readable without alteration');
assert(factory.requestedVersion === FILORA_DATABASE_VERSION, 'database version must be explicit');

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
  await new IndexedDbSpoolIdentityStore(failingFactory, 'filora-failure-test').save({ id: 'spool-2' });
} catch (error) {
  failureObserved = error instanceof Error && error.message === 'forced IndexedDB failure';
}
assert(failureObserved, 'persistence failures must propagate instead of becoming success');

console.log('PASS: persistence foundation write/read/remove/error checks');
