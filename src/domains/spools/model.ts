export type TareSource = 'measured_empty_support' | 'manufacturer';
export type StockBasis = 'nominal' | 'measured';
export type SupportKind = 'original' | 'reusable' | null;

export interface TemperatureRangeC {
  min: number;
  max: number;
}

export interface PrintSettings {
  chamberTemperatureC: number | null;
  firstLayerTemperatureC: number | null;
  printSpeedMmPerSecond: number | null;
  flowPercent: number | null;
  flowRatio: number | null;
  pressureAdvance: number | null;
  maxVolumetricSpeedMm3PerSecond: number | null;
  fanPercent: number | null;
  retractionMm: number | null;
  retractionSpeedMmPerSecond: number | null;
}

export interface FilamentReference {
  id: string;
  brand: string;
  material: string;
  diameterMm: number;
  manufacturerType: string | null;
  manufacturerColor: string | null;
  colorHex: string | null;
  nominalWeightGrams: number;
  nozzleTemperatureC: TemperatureRangeC | null;
  bedTemperatureC: TemperatureRangeC | null;
  printSettings: PrintSettings;
}

export interface StorageLocation {
  id: string;
  name: string;
}

export interface PersistedSpoolV2 {
  recordVersion: 2;
  id: string;
  filamentReferenceId: string | null;
  purchaseDate: string | null;
  openDate: string | null;
  supplier: string | null;
  locationId: string | null;
  purchasePriceEuros: number | null;
  lastDriedDate: string | null;
  purchaseUrl: string | null;
  supportKind: SupportKind;
  tareWeightGrams: number | null;
  tareSource: TareSource | null;
  grossMeasuredWeightGrams: number | null;
  stockBasis: StockBasis;
  notes: string | null;
}

export interface LegacyPersistedSpoolIdentity {
  id: string;
  grossMeasuredWeightGrams: number;
  tareWeightGrams: number;
  tareSource: TareSource;
}

export const EMPTY_PRINT_SETTINGS: Readonly<PrintSettings> = Object.freeze({
  chamberTemperatureC: null,
  firstLayerTemperatureC: null,
  printSpeedMmPerSecond: null,
  flowPercent: null,
  flowRatio: null,
  pressureAdvance: null,
  maxVolumetricSpeedMm3PerSecond: null,
  fanPercent: null,
  retractionMm: null,
  retractionSpeedMmPerSecond: null,
});

function requireNonEmptyText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} est obligatoire.`);
  }
  return normalized;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} doit être un nombre positif fini.`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} doit être un nombre fini supérieur ou égal à zéro.`);
  }
  return value;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateTemperatureRange(
  value: TemperatureRangeC | null,
  label: string,
): TemperatureRangeC | null {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value.min) || !Number.isFinite(value.max) || value.min > value.max) {
    throw new Error(`${label} est invalide.`);
  }
  return { min: value.min, max: value.max };
}

function validateOptionalFinite(value: number | null, label: string): number | null {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value)) {
    throw new Error(`${label} doit être un nombre fini.`);
  }
  return value;
}

export function validateFilamentReference(reference: FilamentReference): FilamentReference {
  const id = requireNonEmptyText(reference.id, 'ID de référence filament');
  const brand = requireNonEmptyText(reference.brand, 'Marque');
  const material = requireNonEmptyText(reference.material, 'Matière');
  const diameterMm = requirePositiveFinite(reference.diameterMm, 'Diamètre');
  const nominalWeightGrams = requirePositiveFinite(reference.nominalWeightGrams, 'Poids nominal');

  const printSettings: PrintSettings = {
    chamberTemperatureC: validateOptionalFinite(reference.printSettings.chamberTemperatureC, 'Température chambre'),
    firstLayerTemperatureC: validateOptionalFinite(reference.printSettings.firstLayerTemperatureC, 'Température première couche'),
    printSpeedMmPerSecond: validateOptionalFinite(reference.printSettings.printSpeedMmPerSecond, "Vitesse d'impression"),
    flowPercent: validateOptionalFinite(reference.printSettings.flowPercent, 'Débit'),
    flowRatio: validateOptionalFinite(reference.printSettings.flowRatio, 'Rapport de flux'),
    pressureAdvance: validateOptionalFinite(reference.printSettings.pressureAdvance, 'Pressure Advance'),
    maxVolumetricSpeedMm3PerSecond: validateOptionalFinite(
      reference.printSettings.maxVolumetricSpeedMm3PerSecond,
      'Vitesse volumétrique maximale',
    ),
    fanPercent: validateOptionalFinite(reference.printSettings.fanPercent, 'Ventilation'),
    retractionMm: validateOptionalFinite(reference.printSettings.retractionMm, 'Rétraction'),
    retractionSpeedMmPerSecond: validateOptionalFinite(
      reference.printSettings.retractionSpeedMmPerSecond,
      'Vitesse de rétraction',
    ),
  };

  if (printSettings.flowPercent !== null && printSettings.flowPercent < 0) {
    throw new Error('Débit doit être supérieur ou égal à zéro.');
  }
  if (printSettings.fanPercent !== null && (printSettings.fanPercent < 0 || printSettings.fanPercent > 100)) {
    throw new Error('Ventilation doit être comprise entre 0 et 100 %.');
  }

  return {
    ...reference,
    id,
    brand,
    material,
    diameterMm,
    manufacturerType: normalizeOptionalText(reference.manufacturerType),
    manufacturerColor: normalizeOptionalText(reference.manufacturerColor),
    colorHex: normalizeOptionalText(reference.colorHex),
    nominalWeightGrams,
    nozzleTemperatureC: validateTemperatureRange(reference.nozzleTemperatureC, 'Température buse'),
    bedTemperatureC: validateTemperatureRange(reference.bedTemperatureC, 'Température plateau'),
    printSettings,
  };
}

export function validateStorageLocation(location: StorageLocation): StorageLocation {
  return {
    id: requireNonEmptyText(location.id, "ID d'emplacement"),
    name: requireNonEmptyText(location.name, "Nom de l'emplacement"),
  };
}

export function validatePersistedSpoolV2(spool: PersistedSpoolV2): PersistedSpoolV2 {
  const id = requireNonEmptyText(spool.id, 'ID de bobine');
  const filamentReferenceId = normalizeOptionalText(spool.filamentReferenceId);

  if (spool.supportKind !== null && spool.supportKind !== 'original' && spool.supportKind !== 'reusable') {
    throw new Error('Type de support invalide.');
  }
  if (spool.stockBasis !== 'measured' && spool.stockBasis !== 'nominal') {
    throw new Error('Qualité de stock invalide.');
  }

  const tareWeightGrams = spool.tareWeightGrams === null
    ? null
    : requireNonNegativeFinite(spool.tareWeightGrams, 'Tare');
  const tareSource = spool.tareSource;
  if (tareSource !== null && tareSource !== 'measured_empty_support' && tareSource !== 'manufacturer') {
    throw new Error('Origine de tare invalide.');
  }
  if ((tareWeightGrams === null) !== (tareSource === null)) {
    throw new Error('La tare et son origine doivent être renseignées ensemble.');
  }

  let grossMeasuredWeightGrams: number | null = null;
  if (spool.stockBasis === 'measured') {
    if (spool.grossMeasuredWeightGrams === null) {
      throw new Error('Une bobine mesurée doit conserver son poids brut réellement mesuré.');
    }
    if (tareWeightGrams === null || tareSource === null) {
      throw new Error('Une bobine mesurée doit conserver la tare utilisée pour le calcul.');
    }
    grossMeasuredWeightGrams = requirePositiveFinite(spool.grossMeasuredWeightGrams, 'Poids brut mesuré');
    if (tareWeightGrams > grossMeasuredWeightGrams) {
      throw new Error('La tare ne peut pas dépasser le poids brut mesuré.');
    }
  } else {
    if (spool.grossMeasuredWeightGrams !== null) {
      throw new Error('Une quantité nominale non vérifiée ne doit pas porter un faux poids brut mesuré.');
    }
    if (filamentReferenceId === null) {
      throw new Error('Une bobine nominale doit être liée à une référence filament connue.');
    }
  }

  const purchasePriceEuros = spool.purchasePriceEuros === null
    ? null
    : requireNonNegativeFinite(spool.purchasePriceEuros, "Prix d'achat");

  return {
    ...spool,
    recordVersion: 2,
    id,
    filamentReferenceId,
    purchaseDate: normalizeOptionalText(spool.purchaseDate),
    openDate: normalizeOptionalText(spool.openDate),
    supplier: normalizeOptionalText(spool.supplier),
    locationId: normalizeOptionalText(spool.locationId),
    purchasePriceEuros,
    lastDriedDate: normalizeOptionalText(spool.lastDriedDate),
    purchaseUrl: normalizeOptionalText(spool.purchaseUrl),
    tareWeightGrams,
    tareSource,
    grossMeasuredWeightGrams,
    notes: normalizeOptionalText(spool.notes),
  };
}

export function migrateLegacySpool(legacy: LegacyPersistedSpoolIdentity): PersistedSpoolV2 {
  return validatePersistedSpoolV2({
    recordVersion: 2,
    id: legacy.id,
    filamentReferenceId: null,
    purchaseDate: null,
    openDate: null,
    supplier: null,
    locationId: null,
    purchasePriceEuros: null,
    lastDriedDate: null,
    purchaseUrl: null,
    supportKind: null,
    tareWeightGrams: legacy.tareWeightGrams,
    tareSource: legacy.tareSource,
    grossMeasuredWeightGrams: legacy.grossMeasuredWeightGrams,
    stockBasis: 'measured',
    notes: null,
  });
}

export function isPersistedSpoolV2(value: LegacyPersistedSpoolIdentity | PersistedSpoolV2): value is PersistedSpoolV2 {
  return 'recordVersion' in value && value.recordVersion === 2;
}

export function normalizePersistedSpool(
  value: LegacyPersistedSpoolIdentity | PersistedSpoolV2,
): PersistedSpoolV2 {
  return isPersistedSpoolV2(value) ? validatePersistedSpoolV2(value) : migrateLegacySpool(value);
}

export function calculateFilamentRemainingGrams(
  spool: PersistedSpoolV2,
  reference: FilamentReference | null,
): number {
  const validated = validatePersistedSpoolV2(spool);
  if (validated.stockBasis === 'measured') {
    return Math.max(0, validated.grossMeasuredWeightGrams! - validated.tareWeightGrams!);
  }

  if (reference === null || reference.id !== validated.filamentReferenceId) {
    throw new Error('Référence filament nécessaire pour calculer une quantité nominale.');
  }
  return validateFilamentReference(reference).nominalWeightGrams;
}

const GENERATED_SPOOL_ID = /^SP-(\d+)$/i;

export function planSpoolIds(
  existingIds: readonly string[],
  quantity: number,
  requestedFirstId?: string,
): string[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error('Le nombre de bobines doit être un entier compris entre 1 et 20.');
  }

  const used = new Set(existingIds.map((id) => id.trim().toLowerCase()));
  const planned: string[] = [];
  const requested = requestedFirstId?.trim() ?? '';

  if (requested) {
    if (used.has(requested.toLowerCase())) {
      throw new Error(`Une bobine avec l'ID ${requested} existe déjà.`);
    }
    used.add(requested.toLowerCase());
    planned.push(requested);
  }

  let nextNumber = existingIds.reduce((max, id) => {
    const match = GENERATED_SPOOL_ID.exec(id.trim());
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;

  while (planned.length < quantity) {
    const candidate = `SP-${String(nextNumber).padStart(4, '0')}`;
    nextNumber += 1;
    if (used.has(candidate.toLowerCase())) {
      continue;
    }
    used.add(candidate.toLowerCase());
    planned.push(candidate);
  }

  return planned;
}
