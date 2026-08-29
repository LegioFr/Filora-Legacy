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

export async function registerMeasuredSpool(
  store: SpoolIdentityStore,
  input: RegisterMeasuredSpoolInput,
): Promise<PersistedSpoolIdentity> {
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

  if (!TARE_SOURCES.includes(input.tareSource)) {
    throw new Error('Tare source is invalid');
  }

  const spool: PersistedSpoolIdentity = {
    id,
    grossMeasuredWeightGrams: input.grossMeasuredWeightGrams,
    tareWeightGrams: input.tareWeightGrams,
    tareSource: input.tareSource,
  };

  await store.save(spool);
  return spool;
}
