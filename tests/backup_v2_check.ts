import {
  createInventoryBackup,
  createInventoryBackupJson,
  parseInventoryBackupJson,
  restoreInventoryBackup,
} from '../src/domains/spools/backupInventory.js';
import {
  EMPTY_PRINT_SETTINGS,
  type FilamentReference,
  type PersistedSpoolV2,
  type StorageLocation,
} from '../src/domains/spools/model.js';
import type {
  InventoryBatchCreate,
  InventorySnapshot,
  InventoryStore,
} from '../src/domains/spools/persistence/InventoryStore.js';

function clone<T>(value: T): T {
  return structuredClone(value);
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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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
  grossMeasuredWeightGrams: 1200,
  stockBasis: 'measured',
  notes: 'Bobine de test',
};
const nominalWithoutTare: PersistedSpoolV2 = {
  ...spool,
  id: 'SP-0069',
  tareWeightGrams: null,
  tareSource: null,
  grossMeasuredWeightGrams: null,
  stockBasis: 'nominal',
  notes: 'Bobine neuve non pesée',
};

const store = new MemoryInventoryStore({
  filamentReferences: [reference],
  locations: [location],
  spools: [spool, nominalWithoutTare],
});
const backup = await createInventoryBackup(store);
assert(backup.version === 2, 'new inventory backup must use version 2');
assert(backup.filamentReferences.length === 1, 'v2 backup must include filament references');
assert(backup.locations.length === 1, 'v2 backup must include locations');
assert(backup.spools.length === 2, 'v2 backup must include all spools');
assert(!('filamentRemainingGrams' in backup.spools[0]!), 'derived remaining filament must not become persisted backup authority');
assert(backup.spools[1]?.tareWeightGrams === null, 'unknown nominal tare must remain null in backup');
assert(backup.spools[1]?.tareSource === null, 'unknown nominal tare source must remain null in backup');

const json = await createInventoryBackupJson(store);
const parsedV2 = parseInventoryBackupJson(json);
assert(parsedV2.sourceVersion === 2, 'v2 backup must be recognized as v2');
assert(parsedV2.snapshot.spools[0]?.filamentReferenceId === reference.id, 'v2 relation must survive JSON round trip');
assert(parsedV2.snapshot.spools[1]?.stockBasis === 'nominal', 'nominal stock basis must survive JSON round trip');
assert(parsedV2.snapshot.spools[1]?.tareWeightGrams === null, 'unknown tare must survive JSON round trip');

const legacyJson = JSON.stringify({
  format: 'filora-backup',
  version: 1,
  spools: [
    {
      id: 'batch5-recovery-001',
      grossMeasuredWeightGrams: 842.6,
      tareWeightGrams: 210.1,
      tareSource: 'measured_empty_support',
    },
  ],
});
const parsedV1 = parseInventoryBackupJson(legacyJson);
assert(parsedV1.sourceVersion === 1, 'legacy backup must remain readable');
assert(parsedV1.snapshot.filamentReferences.length === 0, 'legacy backup must not invent product references');
assert(parsedV1.snapshot.locations.length === 0, 'legacy backup must not invent locations');
assert(parsedV1.snapshot.spools[0]?.filamentReferenceId === null, 'legacy spool must migrate with unknown reference');
assert(parsedV1.snapshot.spools[0]?.supportKind === null, 'legacy spool must not invent support kind');
assert(parsedV1.snapshot.spools[0]?.grossMeasuredWeightGrams === 842.6, 'legacy measured gross must be preserved');

let unknownFieldRejected = false;
try {
  parseInventoryBackupJson(JSON.stringify({ ...backup, unexpected: true }));
} catch (error) {
  unknownFieldRejected = error instanceof Error && error.message.includes('champs manquants ou inconnus');
}
assert(unknownFieldRejected, 'v2 backup must reject unknown root fields');

let orphanRejected = false;
try {
  parseInventoryBackupJson(JSON.stringify({ ...backup, filamentReferences: [] }));
} catch (error) {
  orphanRejected = error instanceof Error && error.message.includes('référence filament introuvable');
}
assert(orphanRejected, 'v2 backup must reject orphaned spool relations before mutation');

const replacementStore = new MemoryInventoryStore({ filamentReferences: [], locations: [], spools: [] });
const restored = await restoreInventoryBackup(replacementStore, backup);
assert(restored.sourceVersion === 2, 'restore must report validated source version');
const restoredSnapshot = await replacementStore.getSnapshot();
assert(restoredSnapshot.spools[0]?.id === 'SP-0068', 'restore must replace with validated spool data');
assert(restoredSnapshot.spools[1]?.tareWeightGrams === null, 'restore must preserve unknown nominal tare');
assert(restoredSnapshot.filamentReferences[0]?.brand === 'Polymaker', 'restore must include reference data');
assert(restoredSnapshot.locations[0]?.name === 'Atelier', 'restore must include location data');

console.log('Batch 6 backup v2 checks passed');
