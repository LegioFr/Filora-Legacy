import type { PersistedSpoolIdentity, SpoolIdentityStore } from './persistence/SpoolIdentityStore.js';

export async function loadMeasuredSpool(
  store: SpoolIdentityStore,
  id: string,
): Promise<PersistedSpoolIdentity | undefined> {
  const normalizedId = id.trim();
  if (normalizedId.length === 0) {
    throw new Error('Spool id is required');
  }

  return store.get(normalizedId);
}
