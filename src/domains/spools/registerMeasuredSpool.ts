import type {
  PersistedSpoolIdentity,
  SpoolIdentityStore,
  TareSource,
} from './persistence/SpoolIdentityStore.js';

export interface RegisterMeasuredSpoolInput {
  id: string;
  grossMeasuredWeightGrams: number;
  tareWeightGrams: number;
  tareSource: TareSource;
}

const TARE_SOURCES: readonly TareSource[] = ['measured_empty_support', 'manufacturer'];

export function calculateAvailableFilamentGrams(
  spool: Pick<PersistedSpoolIdentity, 'grossMeasuredWeightGrams' | 'tareWeightGrams'>,
): number {
  return Math.max(0, spool.grossMeasuredWeightGrams - spool.tareWeightGrams);
}

export function validateMeasuredSpoolInput(
  input: RegisterMeasuredSpoolInput,
): PersistedSpoolIdentity {
  const id = input.id.trim();
  if (id.length === 0) {
    throw new Error('Spool id is required');
  }

  if (!Number.isFinite(input.grossMeasuredWeightGrams) || input.grossMeasuredWeightGrams <= 0) {
    throw new Error('Gross measured weight must be a positive finite number of grams');
  }

  if (!Number.isFinite(input.tareWeightGrams) || input.tareWeightGrams < 0) {
    throw new Error('Tare weight must be a finite number of grams greater than or equal to zero');
  }

  if (input.tareWeightGrams > input.grossMeasuredWeightGrams) {
    throw new Error('La tare ne peut pas dépasser le poids brut mesuré.');
  }

  if (!TARE_SOURCES.includes(input.tareSource)) {
    throw new Error('Tare source is invalid');
  }

  return {
    id,
    grossMeasuredWeightGrams: input.grossMeasuredWeightGrams,
    tareWeightGrams: input.tareWeightGrams,
    tareSource: input.tareSource,
  };
}

export async function registerMeasuredSpool(
  store: SpoolIdentityStore,
  input: RegisterMeasuredSpoolInput,
): Promise<PersistedSpoolIdentity> {
  const spool = validateMeasuredSpoolInput(input);
  await store.create(spool);
  return spool;
}
