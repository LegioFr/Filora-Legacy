import type { PersistedSpoolIdentity, SpoolIdentityStore } from './persistence/SpoolIdentityStore.js';

export interface RegisterMeasuredSpoolInput {
  id: string;
  measuredWeightGrams: number;
}

export async function registerMeasuredSpool(
  store: SpoolIdentityStore,
  input: RegisterMeasuredSpoolInput,
): Promise<PersistedSpoolIdentity> {
  const id = input.id.trim();
  if (id.length === 0) {
    throw new Error('Spool id is required');
  }

  if (!Number.isFinite(input.measuredWeightGrams) || input.measuredWeightGrams <= 0) {
    throw new Error('Measured spool weight must be a positive finite number of grams');
  }

  const spool: PersistedSpoolIdentity = {
    id,
    measuredWeightGrams: input.measuredWeightGrams,
  };

  await store.save(spool);
  return spool;
}
