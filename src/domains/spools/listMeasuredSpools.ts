import type {
  PersistedSpoolIdentity,
  SpoolIdentityStore,
} from './persistence/SpoolIdentityStore.js';

export async function listMeasuredSpools(
  store: SpoolIdentityStore,
): Promise<PersistedSpoolIdentity[]> {
  const spools = await store.list();
  return [...spools].sort((left, right) => left.id.localeCompare(right.id));
}
