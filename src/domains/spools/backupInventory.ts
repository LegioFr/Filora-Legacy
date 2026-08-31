import {
  migrateLegacySpool,
  validateFilamentReference,
  validatePersistedSpoolV2,
  validateStorageLocation,
  type FilamentReference,
  type PersistedSpoolV2,
  type PrintSettings,
  type StorageLocation,
  type TemperatureRangeC,
} from './model.js';
import {
  FILORA_BACKUP_FORMAT,
  validateFiloraBackup,
} from './backupMeasuredSpools.js';
import type { InventorySnapshot, InventoryStore } from './persistence/InventoryStore.js';
import { validateInventorySnapshot } from './persistence/IndexedDbInventoryStore.js';
import {
  emptyPersonalCatalogSnapshot,
  getBrowserPersonalCatalogStorage,
  readPersonalCatalogStorage,
  replacePersonalCatalogStorage,
  type PersonalCatalogSnapshot,
  type PersonalCatalogStorage,
} from './persistence/PersonalCatalogStorage.js';

export const FILORA_BACKUP_VERSION_V2 = 2 as const;

export interface FiloraInventoryBackupV2 {
  format: typeof FILORA_BACKUP_FORMAT;
  version: typeof FILORA_BACKUP_VERSION_V2;
  filamentReferences: FilamentReference[];
  locations: StorageLocation[];
  spools: PersistedSpoolV2[];
  personalCatalog: PersonalCatalogSnapshot;
}

export interface ValidatedInventoryBackup {
  sourceVersion: 1 | 2;
  snapshot: InventorySnapshot;
  personalCatalog: PersonalCatalogSnapshot;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[], context: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${context} contient des champs manquants ou inconnus.`);
  }
}

function assertRequiredAndAllowedKeys(
  value: Record<string, unknown>,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  context: string,
): void {
  const actual = Object.keys(value);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  if (requiredKeys.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) || actual.some((key) => !allowed.has(key))) {
    throw new Error(`${context} contient des champs manquants ou inconnus.`);
  }
}

function optionalString(value: unknown, context: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`${context} doit être un texte ou null.`);
  return value;
}

function optionalNumber(value: unknown, context: string): number | null {
  if (value === null) return null;
  if (typeof value !== 'number') throw new Error(`${context} doit être un nombre ou null.`);
  return value;
}

function optionalNumberOrMissing(value: Record<string, unknown>, key: string, context: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(value, key)) return null;
  return optionalNumber(value[key], `${context}.${key}`);
}

function temperatureRange(value: unknown, context: string): TemperatureRangeC | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error(`${context} est invalide.`);
  assertExactKeys(value, ['min', 'max'], context);
  if (typeof value.min !== 'number' || typeof value.max !== 'number') {
    throw new Error(`${context} doit contenir deux nombres.`);
  }
  return { min: value.min, max: value.max };
}

const PRINT_SETTING_KEYS = [
  'chamberTemperatureC',
  'firstLayerTemperatureC',
  'printSpeedMmPerSecond',
  'flowPercent',
  'flowRatio',
  'pressureAdvance',
  'maxVolumetricSpeedMm3PerSecond',
  'fanPercent',
  'retractionMm',
  'retractionSpeedMmPerSecond',
] as const;

function printSettings(value: unknown, context: string): PrintSettings {
  if (!isRecord(value)) throw new Error(`${context} est invalide.`);
  assertExactKeys(value, PRINT_SETTING_KEYS, context);
  return {
    chamberTemperatureC: optionalNumber(value.chamberTemperatureC, `${context}.chamberTemperatureC`),
    firstLayerTemperatureC: optionalNumber(value.firstLayerTemperatureC, `${context}.firstLayerTemperatureC`),
    printSpeedMmPerSecond: optionalNumber(value.printSpeedMmPerSecond, `${context}.printSpeedMmPerSecond`),
    flowPercent: optionalNumber(value.flowPercent, `${context}.flowPercent`),
    flowRatio: optionalNumber(value.flowRatio, `${context}.flowRatio`),
    pressureAdvance: optionalNumber(value.pressureAdvance, `${context}.pressureAdvance`),
    maxVolumetricSpeedMm3PerSecond: optionalNumber(
      value.maxVolumetricSpeedMm3PerSecond,
      `${context}.maxVolumetricSpeedMm3PerSecond`,
    ),
    fanPercent: optionalNumber(value.fanPercent, `${context}.fanPercent`),
    retractionMm: optionalNumber(value.retractionMm, `${context}.retractionMm`),
    retractionSpeedMmPerSecond: optionalNumber(
      value.retractionSpeedMmPerSecond,
      `${context}.retractionSpeedMmPerSecond`,
    ),
  };
}

function validateBackupReference(value: unknown, index: number): FilamentReference {
  const context = `Référence filament ${index + 1}`;
  if (!isRecord(value)) throw new Error(`${context} : structure invalide.`);
  assertExactKeys(
    value,
    [
      'id',
      'brand',
      'material',
      'diameterMm',
      'manufacturerType',
      'manufacturerColor',
      'colorHex',
      'nominalWeightGrams',
      'nozzleTemperatureC',
      'bedTemperatureC',
      'printSettings',
    ],
    context,
  );
  if (typeof value.id !== 'string' || typeof value.brand !== 'string' || typeof value.material !== 'string') {
    throw new Error(`${context} : identité produit invalide.`);
  }
  if (typeof value.diameterMm !== 'number' || typeof value.nominalWeightGrams !== 'number') {
    throw new Error(`${context} : diamètre ou poids nominal invalide.`);
  }

  return validateFilamentReference({
    id: value.id,
    brand: value.brand,
    material: value.material,
    diameterMm: value.diameterMm,
    manufacturerType: optionalString(value.manufacturerType, `${context}.manufacturerType`),
    manufacturerColor: optionalString(value.manufacturerColor, `${context}.manufacturerColor`),
    colorHex: optionalString(value.colorHex, `${context}.colorHex`),
    nominalWeightGrams: value.nominalWeightGrams,
    nozzleTemperatureC: temperatureRange(value.nozzleTemperatureC, `${context}.nozzleTemperatureC`),
    bedTemperatureC: temperatureRange(value.bedTemperatureC, `${context}.bedTemperatureC`),
    printSettings: printSettings(value.printSettings, `${context}.printSettings`),
  });
}

function validateBackupLocation(value: unknown, index: number): StorageLocation {
  const context = `Emplacement ${index + 1}`;
  if (!isRecord(value)) throw new Error(`${context} : structure invalide.`);
  assertExactKeys(value, ['id', 'name'], context);
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new Error(`${context} : données invalides.`);
  }
  return validateStorageLocation({ id: value.id, name: value.name });
}

const SPOOL_V2_REQUIRED_KEYS = [
  'recordVersion',
  'id',
  'filamentReferenceId',
  'purchaseDate',
  'openDate',
  'supplier',
  'locationId',
  'purchasePriceEuros',
  'lastDriedDate',
  'purchaseUrl',
  'supportKind',
  'tareWeightGrams',
  'tareSource',
  'grossMeasuredWeightGrams',
  'stockBasis',
  'notes',
] as const;

const SPOOL_V2_OPTIONAL_KEYS = [
  'preferredNozzleTemperatureC',
  'preferredBedTemperatureC',
] as const;

function validateBackupSpoolV2(value: unknown, index: number): PersistedSpoolV2 {
  const context = `Bobine ${index + 1}`;
  if (!isRecord(value)) throw new Error(`${context} : structure invalide.`);
  assertRequiredAndAllowedKeys(value, SPOOL_V2_REQUIRED_KEYS, SPOOL_V2_OPTIONAL_KEYS, context);
  if (value.recordVersion !== 2 || typeof value.id !== 'string') {
    throw new Error(`${context} : version ou ID invalide.`);
  }
  if (value.tareWeightGrams !== null && typeof value.tareWeightGrams !== 'number') {
    throw new Error(`${context} : tare invalide.`);
  }
  if (value.tareSource !== null && typeof value.tareSource !== 'string') {
    throw new Error(`${context} : origine de tare invalide.`);
  }
  if (value.grossMeasuredWeightGrams !== null && typeof value.grossMeasuredWeightGrams !== 'number') {
    throw new Error(`${context} : poids brut mesuré invalide.`);
  }
  if (typeof value.stockBasis !== 'string') throw new Error(`${context} : qualité de stock invalide.`);
  if (value.supportKind !== null && typeof value.supportKind !== 'string') {
    throw new Error(`${context} : type de support invalide.`);
  }

  return validatePersistedSpoolV2({
    recordVersion: 2,
    id: value.id,
    filamentReferenceId: optionalString(value.filamentReferenceId, `${context}.filamentReferenceId`),
    purchaseDate: optionalString(value.purchaseDate, `${context}.purchaseDate`),
    openDate: optionalString(value.openDate, `${context}.openDate`),
    supplier: optionalString(value.supplier, `${context}.supplier`),
    locationId: optionalString(value.locationId, `${context}.locationId`),
    purchasePriceEuros: optionalNumber(value.purchasePriceEuros, `${context}.purchasePriceEuros`),
    lastDriedDate: optionalString(value.lastDriedDate, `${context}.lastDriedDate`),
    purchaseUrl: optionalString(value.purchaseUrl, `${context}.purchaseUrl`),
    supportKind: value.supportKind as PersistedSpoolV2['supportKind'],
    tareWeightGrams: optionalNumber(value.tareWeightGrams, `${context}.tareWeightGrams`),
    tareSource: optionalString(value.tareSource, `${context}.tareSource`) as PersistedSpoolV2['tareSource'],
    grossMeasuredWeightGrams: value.grossMeasuredWeightGrams,
    stockBasis: value.stockBasis as PersistedSpoolV2['stockBasis'],
    preferredNozzleTemperatureC: optionalNumberOrMissing(value, 'preferredNozzleTemperatureC', context),
    preferredBedTemperatureC: optionalNumberOrMissing(value, 'preferredBedTemperatureC', context),
    notes: optionalString(value.notes, `${context}.notes`),
  });
}

function validateStringArrayRecord(value: unknown, context: string): Record<string, string[]> {
  if (!isRecord(value)) throw new Error(`${context} est invalide.`);
  const result: Record<string, string[]> = {};
  for (const [scope, options] of Object.entries(value)) {
    if (!scope || !Array.isArray(options) || options.some((item) => typeof item !== 'string' || !item.trim())) {
      throw new Error(`${context}.${scope || '?'} est invalide.`);
    }
    result[scope] = options.map((item) => item.trim());
  }
  return result;
}

function validateHexRecord(value: unknown, context: string): Record<string, string> {
  if (!isRecord(value)) throw new Error(`${context} est invalide.`);
  const result: Record<string, string> = {};
  for (const [scope, hex] of Object.entries(value)) {
    if (!scope || typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
      throw new Error(`${context}.${scope || '?'} est invalide.`);
    }
    result[scope] = hex.toUpperCase();
  }
  return result;
}

function validatePersonalCatalog(value: unknown): PersonalCatalogSnapshot {
  if (!isRecord(value)) throw new Error('Le catalogue personnel de la sauvegarde est invalide.');
  assertExactKeys(value, ['customOptions', 'colorHexes'], 'Le catalogue personnel');
  return {
    customOptions: validateStringArrayRecord(value.customOptions, 'Le catalogue personnel.customOptions'),
    colorHexes: validateHexRecord(value.colorHexes, 'Le catalogue personnel.colorHexes'),
  };
}

function validateV2(value: Record<string, unknown>): ValidatedInventoryBackup {
  assertRequiredAndAllowedKeys(
    value,
    ['format', 'version', 'filamentReferences', 'locations', 'spools'],
    ['personalCatalog'],
    'La sauvegarde',
  );
  if (!Array.isArray(value.filamentReferences) || !Array.isArray(value.locations) || !Array.isArray(value.spools)) {
    throw new Error('Les collections de la sauvegarde Filora v2 sont invalides.');
  }

  const snapshot = validateInventorySnapshot({
    filamentReferences: value.filamentReferences.map(validateBackupReference),
    locations: value.locations.map(validateBackupLocation),
    spools: value.spools.map(validateBackupSpoolV2),
  });
  const personalCatalog = Object.prototype.hasOwnProperty.call(value, 'personalCatalog')
    ? validatePersonalCatalog(value.personalCatalog)
    : emptyPersonalCatalogSnapshot();
  return { sourceVersion: 2, snapshot, personalCatalog };
}

export function validateInventoryBackup(value: unknown): ValidatedInventoryBackup {
  if (!isRecord(value)) throw new Error('La sauvegarde Filora doit être un objet JSON.');
  if (value.format !== FILORA_BACKUP_FORMAT) throw new Error('Format de sauvegarde Filora non reconnu.');

  if (value.version === 1) {
    const legacy = validateFiloraBackup(value);
    return {
      sourceVersion: 1,
      snapshot: validateInventorySnapshot({
        filamentReferences: [],
        locations: [],
        spools: legacy.spools.map(migrateLegacySpool),
      }),
      personalCatalog: emptyPersonalCatalogSnapshot(),
    };
  }
  if (value.version === FILORA_BACKUP_VERSION_V2) return validateV2(value);
  throw new Error('Version de sauvegarde Filora non reconnue.');
}

export function parseInventoryBackupJson(text: string): ValidatedInventoryBackup {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Le fichier sélectionné ne contient pas un JSON valide.');
  }
  return validateInventoryBackup(value);
}

export async function createInventoryBackup(
  store: InventoryStore,
  personalCatalogStorage: PersonalCatalogStorage | null = getBrowserPersonalCatalogStorage(),
): Promise<FiloraInventoryBackupV2> {
  const snapshot = validateInventorySnapshot(await store.getSnapshot());
  return {
    format: FILORA_BACKUP_FORMAT,
    version: FILORA_BACKUP_VERSION_V2,
    filamentReferences: snapshot.filamentReferences,
    locations: snapshot.locations,
    spools: snapshot.spools,
    personalCatalog: readPersonalCatalogStorage(personalCatalogStorage),
  };
}

export async function createInventoryBackupJson(
  store: InventoryStore,
  personalCatalogStorage: PersonalCatalogStorage | null = getBrowserPersonalCatalogStorage(),
): Promise<string> {
  return JSON.stringify(await createInventoryBackup(store, personalCatalogStorage), null, 2);
}

export async function restoreInventoryBackup(
  store: InventoryStore,
  backup: unknown,
  personalCatalogStorage: PersonalCatalogStorage | null = getBrowserPersonalCatalogStorage(),
): Promise<ValidatedInventoryBackup> {
  const validated = validateInventoryBackup(backup);
  const previousSnapshot = validateInventorySnapshot(await store.getSnapshot());
  const previousPersonalCatalog = readPersonalCatalogStorage(personalCatalogStorage);

  try {
    await store.replaceSnapshot(validated.snapshot);
    replacePersonalCatalogStorage(validated.personalCatalog, personalCatalogStorage);
  } catch (error) {
    try {
      await store.replaceSnapshot(previousSnapshot);
      replacePersonalCatalogStorage(previousPersonalCatalog, personalCatalogStorage);
    } catch {
      throw new Error('La restauration a échoué et l’état précédent de Filora n’a pas pu être garanti.');
    }
    throw error;
  }
  return validated;
}
