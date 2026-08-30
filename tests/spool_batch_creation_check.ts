import {
  EMPTY_PRINT_SETTINGS,
  type FilamentReference,
  type PersistedSpoolV2,
  type StorageLocation,
} from '../src/domains/spools/model.js';
import {
  planSpoolBatch,
  type CreateSpoolBatchRequest,
} from '../src/domains/spools/createSpoolBatch.js';
import type { InventorySnapshot } from '../src/domains/spools/persistence/InventoryStore.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const existingReference: FilamentReference = {
  id: 'ref-existing',
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

const existingLocation: StorageLocation = { id: 'loc-atelier', name: 'Atelier' };

function measuredSpool(id: string): PersistedSpoolV2 {
  return {
    recordVersion: 2,
    id,
    filamentReferenceId: existingReference.id,
    purchaseDate: null,
    openDate: null,
    supplier: null,
    locationId: existingLocation.id,
    purchasePriceEuros: null,
    lastDriedDate: null,
    purchaseUrl: null,
    supportKind: 'original',
    tareWeightGrams: 200,
    tareSource: 'measured_empty_support',
    grossMeasuredWeightGrams: 930,
    stockBasis: 'measured',
    notes: null,
  };
}

const snapshot: InventorySnapshot = {
  filamentReferences: [existingReference],
  locations: [existingLocation],
  spools: [measuredSpool('SP-0001'), measuredSpool('SP-0003')],
};

const baseRequest: CreateSpoolBatchRequest = {
  reference: { kind: 'existing', id: 'REF-EXISTING' },
  location: { kind: 'existing', id: 'LOC-ATELIER' },
  quantity: 3,
  spool: {
    purchaseDate: '2026-08-30',
    openDate: null,
    supplier: 'Boutique test',
    purchasePriceEuros: 24.9,
    lastDriedDate: null,
    purchaseUrl: 'https://example.test/filament',
    supportKind: 'original',
    tareWeightGrams: 200,
    tareSource: 'manufacturer',
    grossMeasuredWeightGrams: null,
    stockBasis: 'nominal',
    notes: 'Lot de test',
  },
};

const automatic = planSpoolBatch(snapshot, baseRequest);
assert(automatic.ids.join(',') === 'SP-0004,SP-0005,SP-0006', 'automatic series ids must continue after highest existing generated id');
assert(automatic.spools.length === 3, 'series plan must contain requested number of physical spools');
assert(automatic.spools.every((spool) => spool.filamentReferenceId === existingReference.id), 'series spools must share selected reference');
assert(automatic.spools.every((spool) => spool.locationId === existingLocation.id), 'series spools must share selected location');
assert(automatic.spools.every((spool) => spool.stockBasis === 'nominal' && spool.grossMeasuredWeightGrams === null), 'nominal series must not invent measured gross weight');

const customFirst = planSpoolBatch(snapshot, {
  ...baseRequest,
  quantity: 2,
  requestedFirstId: 'Mon-ID',
});
assert(customFirst.ids.join(',') === 'Mon-ID,SP-0004', 'custom first id must not disturb deterministic generated sequence');

const newReference: FilamentReference = {
  ...existingReference,
  id: 'ref-new',
  brand: 'Bambu Lab',
  manufacturerColor: 'Jade White',
  colorHex: '#F3F1E7',
};
const newLocation: StorageLocation = { id: 'loc-drybox', name: 'Drybox' };
const measured = planSpoolBatch(snapshot, {
  ...baseRequest,
  reference: { kind: 'new', reference: newReference },
  location: { kind: 'new', location: newLocation },
  quantity: 1,
  spool: {
    ...baseRequest.spool,
    tareWeightGrams: 205.5,
    tareSource: 'measured_empty_support',
    grossMeasuredWeightGrams: 1188.2,
    stockBasis: 'measured',
  },
});
assert(measured.filamentReference?.id === newReference.id, 'new product reference must be part of atomic plan');
assert(measured.location?.id === newLocation.id, 'new location must be part of atomic plan');
assert(measured.spools[0]?.grossMeasuredWeightGrams === 1188.2, 'real measured gross weight must be preserved');
assert(measured.spools[0]?.tareWeightGrams === 205.5, 'real tare must be preserved');

let missingReferenceRejected = false;
try {
  planSpoolBatch(snapshot, {
    ...baseRequest,
    reference: { kind: 'existing', id: 'missing-reference' },
  });
} catch (error) {
  missingReferenceRejected = error instanceof Error && error.message.includes('introuvable');
}
assert(missingReferenceRejected, 'missing existing reference must be rejected before write');

let missingLocationRejected = false;
try {
  planSpoolBatch(snapshot, {
    ...baseRequest,
    location: { kind: 'existing', id: 'missing-location' },
  });
} catch (error) {
  missingLocationRejected = error instanceof Error && error.message.includes('introuvable');
}
assert(missingLocationRejected, 'missing existing location must be rejected before write');

let duplicateReferenceRejected = false;
try {
  planSpoolBatch(snapshot, {
    ...baseRequest,
    reference: { kind: 'new', reference: { ...existingReference, id: 'REF-EXISTING' } },
  });
} catch (error) {
  duplicateReferenceRejected = error instanceof Error && error.message.includes('existe déjà');
}
assert(duplicateReferenceRejected, 'new reference id must not collide case-insensitively');

console.log('Batch 6 spool batch planning checks passed');
