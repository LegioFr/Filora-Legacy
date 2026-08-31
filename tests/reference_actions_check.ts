import {
  EMPTY_PRINT_SETTINGS,
  type FilamentReference,
  type PersistedSpoolV2,
} from '../src/domains/spools/model.js';
import {
  inspectSharedReference,
  planSpoolReferenceReassignment,
  reassignSpoolReference,
  updateSharedFilamentReference,
} from '../src/domains/spools/referenceActions.js';
import type { InventorySnapshot, InventoryStore } from '../src/domains/spools/persistence/InventoryStore.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function reference(id: string, color: string): FilamentReference {
  return {
    id,
    brand: 'Polymaker',
    material: 'PLA',
    diameterMm: 1.75,
    manufacturerType: 'Matte',
    manufacturerColor: color,
    colorHex: '#111111',
    nominalWeightGrams: 1000,
    nozzleTemperatureC: { min: 190, max: 220 },
    bedTemperatureC: { min: 45, max: 60 },
    printSettings: { ...EMPTY_PRINT_SETTINGS },
  };
}

function spool(id: string, filamentReferenceId: string): PersistedSpoolV2 {
  return {
    recordVersion: 2,
    id,
    filamentReferenceId,
    purchaseDate: null,
    openDate: null,
    supplier: null,
    locationId: null,
    purchasePriceEuros: null,
    lastDriedDate: null,
    purchaseUrl: null,
    supportKind: 'original',
    tareWeightGrams: 200,
    tareSource: 'manufacturer',
    grossMeasuredWeightGrams: null,
    stockBasis: 'nominal',
    notes: null,
  };
}

const refA = reference('ref-a', 'Black');
const refB = reference('ref-b', 'White');
const snapshot: InventorySnapshot = {
  filamentReferences: [refA, refB],
  locations: [],
  spools: [spool('SP-0001', refA.id), spool('SP-0002', refA.id), spool('SP-0003', refB.id)],
};

const impact = inspectSharedReference(snapshot, 'REF-A');
assert(impact.affectedSpoolCount === 2, 'shared reference impact must count every linked physical spool');
assert(impact.spoolIds.join(',') === 'SP-0001,SP-0002', 'shared reference impact must identify linked spool ids');

const existingPlan = planSpoolReferenceReassignment(snapshot, 'sp-0001', { kind: 'existing', id: 'REF-B' });
assert(existingPlan.spool.id === 'SP-0001', 'reassignment must preserve physical spool identity');
assert(existingPlan.spool.filamentReferenceId === refB.id, 'reassignment must target canonical existing reference id');
assert(snapshot.spools[1]?.filamentReferenceId === refA.id, 'planning one reassignment must not modify another spool');

const refC = reference('ref-c', 'Red');
const newPlan = planSpoolReferenceReassignment(snapshot, 'SP-0001', { kind: 'new', reference: refC });
assert(newPlan.filamentReference?.id === refC.id, 'new product reassignment must carry its new reference');
assert(newPlan.spool.filamentReferenceId === refC.id, 'target spool must point to new reference');

let missingSpoolRejected = false;
try {
  planSpoolReferenceReassignment(snapshot, 'missing-spool', { kind: 'existing', id: refB.id });
} catch (error) {
  missingSpoolRejected = error instanceof Error && error.message.includes('introuvable');
}
assert(missingSpoolRejected, 'missing physical spool must be rejected');

const calls: string[] = [];
const fakeStore = {
  getSnapshot: async () => structuredClone(snapshot),
  updateFilamentReference: async (value: FilamentReference) => { calls.push(`shared:${value.id}:${value.manufacturerColor}`); },
  updateSpool: async (value: PersistedSpoolV2) => { calls.push(`spool:${value.id}:${value.filamentReferenceId}`); },
  createFilamentReferenceAndUpdateSpool: async (value: FilamentReference, valueSpool: PersistedSpoolV2) => {
    calls.push(`new:${value.id}:${valueSpool.id}:${valueSpool.filamentReferenceId}`);
  },
} as unknown as InventoryStore;

const changedImpact = await updateSharedFilamentReference(fakeStore, { ...refA, manufacturerColor: 'Blue' });
assert(changedImpact.affectedSpoolCount === 2, 'shared update must expose affected spool count before UI confirmation');
assert(calls.includes('shared:ref-a:Blue'), 'shared update must update the reference itself, not each spool copy');

await reassignSpoolReference(fakeStore, 'SP-0001', { kind: 'existing', id: refB.id });
assert(calls.includes('spool:SP-0001:ref-b'), 'existing-product reassignment must update only target spool relation');

await reassignSpoolReference(fakeStore, 'SP-0001', { kind: 'new', reference: refC });
assert(calls.includes('new:ref-c:SP-0001:ref-c'), 'new-product reassignment must request atomic reference creation plus target update');

console.log('Batch 6 reference action checks passed');
