import {
  calculateFilamentRemainingGrams,
  EMPTY_PRINT_SETTINGS,
  migrateLegacySpool,
  planSpoolIds,
  validateFilamentReference,
  validatePersistedSpoolV2,
  type FilamentReference,
  type PersistedSpoolV2,
} from '../src/domains/spools/model.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const migrated = migrateLegacySpool({
  id: 'batch5-recovery-001',
  grossMeasuredWeightGrams: 842.6,
  tareWeightGrams: 210.1,
  tareSource: 'measured_empty_support',
});
assert(migrated.id === 'batch5-recovery-001', 'legacy id must be preserved');
assert(migrated.filamentReferenceId === null, 'legacy migration must not invent a filament reference');
assert(migrated.supportKind === null, 'legacy migration must not invent a support kind');
assert(migrated.stockBasis === 'measured', 'legacy measured facts must remain measured');
assert(migrated.grossMeasuredWeightGrams === 842.6, 'legacy gross measured weight must be preserved');
assert(migrated.tareWeightGrams === 210.1, 'legacy tare must be preserved');
assert(
  Math.abs(calculateFilamentRemainingGrams(migrated, null) - 632.5) < 1e-9,
  'legacy available filament must still derive from measured gross minus tare',
);

const reference: FilamentReference = validateFilamentReference({
  id: 'ref-polymaker-pla-matte-black',
  brand: ' Polymaker ',
  material: ' PLA ',
  diameterMm: 1.75,
  manufacturerType: 'Matte',
  manufacturerColor: 'Black',
  colorHex: '#111111',
  nominalWeightGrams: 1000,
  nozzleTemperatureC: { min: 190, max: 220 },
  bedTemperatureC: { min: 45, max: 60 },
  printSettings: {
    ...EMPTY_PRINT_SETTINGS,
    chamberTemperatureC: 45,
    firstLayerTemperatureC: 215,
    printSpeedMmPerSecond: 50,
    flowPercent: 100,
    flowRatio: 0.96,
    pressureAdvance: 0.04,
    maxVolumetricSpeedMm3PerSecond: 12,
    fanPercent: 100,
    retractionMm: 0.8,
    retractionSpeedMmPerSecond: 30,
  },
});
assert(reference.brand === 'Polymaker', 'reference brand must be normalized');
assert(reference.material === 'PLA', 'reference material must be normalized');
assert(reference.nominalWeightGrams === 1000, 'nominal weight must be preserved');

const nominal: PersistedSpoolV2 = validatePersistedSpoolV2({
  recordVersion: 2,
  id: 'SP-0068',
  filamentReferenceId: reference.id,
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
});
assert(
  calculateFilamentRemainingGrams(nominal, reference) === 1000,
  'unweighed spool must use nominal filament amount without inventing gross measured weight',
);

let fakeMeasurementRejected = false;
try {
  validatePersistedSpoolV2({ ...nominal, grossMeasuredWeightGrams: 1200 });
} catch (error) {
  fakeMeasurementRejected = error instanceof Error && error.message.includes('faux poids brut mesuré');
}
assert(fakeMeasurementRejected, 'nominal stock must reject a synthetic measured gross value');

const measured = validatePersistedSpoolV2({
  ...nominal,
  id: 'SP-0069',
  grossMeasuredWeightGrams: 1200,
  stockBasis: 'measured',
});
assert(
  calculateFilamentRemainingGrams(measured, reference) === 1000,
  'measured stock must derive filament from gross minus tare',
);

let impossibleTareRejected = false;
try {
  validatePersistedSpoolV2({ ...measured, tareWeightGrams: 1300 });
} catch (error) {
  impossibleTareRejected = error instanceof Error && error.message.includes('tare ne peut pas dépasser');
}
assert(impossibleTareRejected, 'tare greater than measured gross must be rejected');

const planned = planSpoolIds(['SP-0001', 'SP-0003', 'custom'], 3);
assert(planned.join(',') === 'SP-0004,SP-0005,SP-0006', 'series ids must continue deterministically after the highest SP number');

const requestedSeries = planSpoolIds(['SP-0068'], 3, 'SPECIAL-01');
assert(
  requestedSeries.join(',') === 'SPECIAL-01,SP-0069,SP-0070',
  'a requested first id must coexist with deterministic generated ids for the rest of the series',
);

let duplicateRejected = false;
try {
  planSpoolIds(['SP-0068'], 1, 'sp-0068');
} catch (error) {
  duplicateRejected = error instanceof Error && error.message.includes('existe déjà');
}
assert(duplicateRejected, 'series planning must reject duplicate ids case-insensitively before writing');

console.log('Batch 6 spool model checks passed');
