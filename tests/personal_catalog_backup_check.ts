import {
  createInventoryBackupJson,
  parseInventoryBackupJson,
  restoreInventoryBackup,
} from '../src/domains/spools/backupInventory.js';
import {
  PERSONAL_CATALOG_COLOR_HEX_PREFIX,
  PERSONAL_CATALOG_CUSTOM_PREFIX,
  emptyPersonalCatalogSnapshot,
  readPersonalCatalogStorage,
  replacePersonalCatalogStorage,
  type PersonalCatalogStorage,
} from '../src/domains/spools/persistence/PersonalCatalogStorage.js';
import type {
  FilamentReference,
  PersistedSpoolV2,
  StorageLocation,
} from '../src/domains/spools/model.js';
import type {
  InventoryBatchCreate,
  InventorySnapshot,
  InventoryStore,
} from '../src/domains/spools/persistence/InventoryStore.js';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryCatalogStorage implements PersonalCatalogStorage {
  private values = new Map<string, string>();

  get length(): number { return this.values.size; }
  key(index: number): string | null { return Array.from(this.values.keys())[index] ?? null; }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

class FailingCatalogStorage extends MemoryCatalogStorage {
  failNextSet = false;

  override setItem(key: string, value: string): void {
    if (this.failNextSet) {
      this.failNextSet = false;
      throw new Error('Injected personal catalog write failure');
    }
    super.setItem(key, value);
  }
}

class MemoryInventoryStore implements InventoryStore {
  constructor(private snapshot: InventorySnapshot) {}
  async getSnapshot() { return clone(this.snapshot); }
  async listSpools() { return clone(this.snapshot.spools); }
  async getSpool(id: string) { return clone(this.snapshot.spools.find((item) => item.id === id)); }
  async listFilamentReferences() { return clone(this.snapshot.filamentReferences); }
  async getFilamentReference(id: string) { return clone(this.snapshot.filamentReferences.find((item) => item.id === id)); }
  async createFilamentReference(reference: FilamentReference) { this.snapshot.filamentReferences.push(clone(reference)); }
  async updateFilamentReference(reference: FilamentReference) {
    const index = this.snapshot.filamentReferences.findIndex((item) => item.id === reference.id);
    if (index >= 0) this.snapshot.filamentReferences[index] = clone(reference);
  }
  async listLocations() { return clone(this.snapshot.locations); }
  async getLocation(id: string) { return clone(this.snapshot.locations.find((item) => item.id === id)); }
  async createLocation(location: StorageLocation) { this.snapshot.locations.push(clone(location)); }
  async createSpools(spools: PersistedSpoolV2[]) { this.snapshot.spools.push(...clone(spools)); }
  async createInventoryBatch(batch: InventoryBatchCreate) {
    const next = clone(this.snapshot);
    if (batch.filamentReference) next.filamentReferences.push(clone(batch.filamentReference));
    if (batch.location) next.locations.push(clone(batch.location));
    next.spools.push(...clone(batch.spools));
    this.snapshot = next;
  }
  async updateSpool(spool: PersistedSpoolV2) {
    const index = this.snapshot.spools.findIndex((item) => item.id === spool.id);
    if (index >= 0) this.snapshot.spools[index] = clone(spool);
  }
  async createFilamentReferenceAndUpdateSpool(reference: FilamentReference, spool: PersistedSpoolV2) {
    const next = clone(this.snapshot);
    next.filamentReferences.push(clone(reference));
    const index = next.spools.findIndex((item) => item.id === spool.id);
    if (index < 0) throw new Error('missing spool');
    next.spools[index] = clone(spool);
    this.snapshot = next;
  }
  async replaceSnapshot(snapshot: InventorySnapshot) { this.snapshot = clone(snapshot); }
}

const catalogStorage = new MemoryCatalogStorage();
catalogStorage.setItem(`${PERSONAL_CATALOG_CUSTOM_PREFIX}brand`, JSON.stringify(['Ma Marque']));
catalogStorage.setItem(`${PERSONAL_CATALOG_CUSTOM_PREFIX}material:ma%20marque`, JSON.stringify(['PLA Test']));
catalogStorage.setItem(`${PERSONAL_CATALOG_CUSTOM_PREFIX}type:ma%20marque|pla%20test`, JSON.stringify(['Matte Maison']));
catalogStorage.setItem(`${PERSONAL_CATALOG_CUSTOM_PREFIX}color:ma%20marque|pla%20test|matte%20maison`, JSON.stringify(['Rouge Test']));
catalogStorage.setItem(`${PERSONAL_CATALOG_COLOR_HEX_PREFIX}ma%20marque|pla%20test|matte%20maison|rouge%20test`, '#AABBCC');

const sourceStore = new MemoryInventoryStore({ filamentReferences: [], locations: [], spools: [] });
const json = await createInventoryBackupJson(sourceStore, catalogStorage);
const parsed = parseInventoryBackupJson(json);
assert(parsed.personalCatalog.customOptions.brand?.[0] === 'Ma Marque', 'backup must include custom brand');
assert(parsed.personalCatalog.customOptions['material:ma%20marque']?.[0] === 'PLA Test', 'backup must include material in brand scope');
assert(parsed.personalCatalog.customOptions['type:ma%20marque|pla%20test']?.[0] === 'Matte Maison', 'backup must include type in brand/material scope');
assert(parsed.personalCatalog.customOptions['color:ma%20marque|pla%20test|matte%20maison']?.[0] === 'Rouge Test', 'backup must include color in full scope');
assert(parsed.personalCatalog.colorHexes['ma%20marque|pla%20test|matte%20maison|rouge%20test'] === '#AABBCC', 'backup must include personal color hex');

const previousV2 = JSON.parse(json) as Record<string, unknown>;
delete previousV2.personalCatalog;
const parsedPreviousV2 = parseInventoryBackupJson(JSON.stringify(previousV2));
assert(Object.keys(parsedPreviousV2.personalCatalog.customOptions).length === 0, 'previous v2 backup without personal catalog must remain readable');
assert(Object.keys(parsedPreviousV2.personalCatalog.colorHexes).length === 0, 'missing personal catalog must normalize to empty');

// Régression Batch 5 : A et a étaient deux clés IndexedDB distinctes et un backup v1
// valide doit conserver les deux sans fusion, renommage ni rejet pendant la migration.
const legacyCaseBackup = {
  format: 'filora-backup',
  version: 1,
  spools: [
    { id: 'A', grossMeasuredWeightGrams: 800, tareWeightGrams: 200, tareSource: 'manufacturer' },
    { id: 'a', grossMeasuredWeightGrams: 900, tareWeightGrams: 210, tareSource: 'measured_empty_support' },
  ],
};
const parsedLegacyCaseBackup = parseInventoryBackupJson(JSON.stringify(legacyCaseBackup));
assert(parsedLegacyCaseBackup.sourceVersion === 1, 'case-distinct Batch 5 backup must remain a valid v1 source');
assert(parsedLegacyCaseBackup.snapshot.spools.length === 2, 'case-distinct Batch 5 backup must keep both physical spools');
assert(parsedLegacyCaseBackup.snapshot.spools.some((spool) => spool.id === 'A'), 'uppercase historical id must survive backup migration');
assert(parsedLegacyCaseBackup.snapshot.spools.some((spool) => spool.id === 'a'), 'lowercase historical id must survive backup migration');

replacePersonalCatalogStorage(emptyPersonalCatalogSnapshot(), catalogStorage);
assert(Object.keys(readPersonalCatalogStorage(catalogStorage).customOptions).length === 0, 'personal catalog must be erasable before recovery proof');

const targetStore = new MemoryInventoryStore({ filamentReferences: [], locations: [], spools: [] });
await restoreInventoryBackup(targetStore, JSON.parse(json) as unknown, catalogStorage);
const restoredCatalog = readPersonalCatalogStorage(catalogStorage);
assert(restoredCatalog.customOptions.brand?.[0] === 'Ma Marque', 'restore must recover custom brand after erase');
assert(restoredCatalog.customOptions['type:ma%20marque|pla%20test']?.[0] === 'Matte Maison', 'restore must recover scoped custom type after erase');
assert(restoredCatalog.customOptions['color:ma%20marque|pla%20test|matte%20maison']?.[0] === 'Rouge Test', 'restore must recover scoped custom color after erase');
assert(restoredCatalog.colorHexes['ma%20marque|pla%20test|matte%20maison|rouge%20test'] === '#AABBCC', 'restore must recover custom color hex after erase');

let invalidCatalogRejected = false;
try {
  const invalid = JSON.parse(json) as {
    personalCatalog: { customOptions: Record<string, string[]>; colorHexes: Record<string, string> };
  };
  invalid.personalCatalog.colorHexes['bad-scope'] = 'not-a-hex';
  parseInventoryBackupJson(JSON.stringify(invalid));
} catch (error) {
  invalidCatalogRejected = error instanceof Error && error.message.includes('catalogue personnel');
}
assert(invalidCatalogRejected, 'invalid personal catalog must be rejected before restore');

// Injection d'une panne entre le remplacement IndexedDB et l'écriture du catalogue
// personnel : l'état inventaire + catalogue précédent doit être restauré complètement.
const previousPhysicalSpool: PersistedSpoolV2 = {
  recordVersion: 2,
  id: 'ROLLBACK-KEEP',
  filamentReferenceId: null,
  purchaseDate: null,
  openDate: null,
  supplier: null,
  locationId: null,
  purchasePriceEuros: null,
  lastDriedDate: null,
  purchaseUrl: null,
  supportKind: null,
  tareWeightGrams: 200,
  tareSource: 'manufacturer',
  grossMeasuredWeightGrams: 800,
  stockBasis: 'measured',
  notes: 'état précédent',
};
const rollbackStore = new MemoryInventoryStore({
  filamentReferences: [],
  locations: [],
  spools: [previousPhysicalSpool],
});
const failingStorage = new FailingCatalogStorage();
failingStorage.setItem(`${PERSONAL_CATALOG_CUSTOM_PREFIX}brand`, JSON.stringify(['Ancienne Marque']));
failingStorage.failNextSet = true;

let injectedFailureRejected = false;
try {
  await restoreInventoryBackup(rollbackStore, JSON.parse(json) as unknown, failingStorage);
} catch (error) {
  injectedFailureRejected = error instanceof Error && error.message.includes('Injected personal catalog write failure');
}
assert(injectedFailureRejected, 'injected catalog write failure must reject the restore');
const rolledBackInventory = await rollbackStore.getSnapshot();
assert(rolledBackInventory.spools.length === 1, 'failed cross-storage restore must recover previous inventory cardinality');
assert(rolledBackInventory.spools[0]?.id === 'ROLLBACK-KEEP', 'failed cross-storage restore must recover previous physical spool');
const rolledBackCatalog = readPersonalCatalogStorage(failingStorage);
assert(rolledBackCatalog.customOptions.brand?.[0] === 'Ancienne Marque', 'failed cross-storage restore must recover previous personal catalog');
assert(!Object.values(rolledBackCatalog.customOptions).flat().includes('Ma Marque'), 'failed cross-storage restore must not leave target catalog values behind');

console.log('Batch 6 personal catalog backup/recovery checks passed');
