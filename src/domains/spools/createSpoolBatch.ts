import {
  planSpoolIds,
  validateFilamentReference,
  validatePersistedSpoolV2,
  validateStorageLocation,
  type FilamentReference,
  type PersistedSpoolV2,
  type StorageLocation,
} from './model.js';
import type {
  InventoryBatchCreate,
  InventorySnapshot,
  InventoryStore,
} from './persistence/InventoryStore.js';

export type FilamentReferenceSelection =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; reference: FilamentReference };

export type StorageLocationSelection =
  | { kind: 'none' }
  | { kind: 'existing'; id: string }
  | { kind: 'new'; location: StorageLocation };

export type SpoolCreationTemplate = Omit<
  PersistedSpoolV2,
  'recordVersion' | 'id' | 'filamentReferenceId' | 'locationId'
>;

export interface CreateSpoolBatchRequest {
  reference: FilamentReferenceSelection;
  location: StorageLocationSelection;
  quantity: number;
  requestedFirstId?: string;
  spool: SpoolCreationTemplate;
}

export interface SpoolBatchPlan extends InventoryBatchCreate {
  ids: string[];
}

function findReference(snapshot: InventorySnapshot, id: string): FilamentReference | undefined {
  const key = id.trim().toLowerCase();
  return snapshot.filamentReferences.find((reference) => reference.id.toLowerCase() === key);
}

function findLocation(snapshot: InventorySnapshot, id: string): StorageLocation | undefined {
  const key = id.trim().toLowerCase();
  return snapshot.locations.find((location) => location.id.toLowerCase() === key);
}

export function planSpoolBatch(
  snapshot: InventorySnapshot,
  request: CreateSpoolBatchRequest,
): SpoolBatchPlan {
  let filamentReference: FilamentReference | undefined;
  let filamentReferenceId: string;

  if (request.reference.kind === 'existing') {
    const existing = findReference(snapshot, request.reference.id);
    if (!existing) {
      throw new Error('La référence filament sélectionnée est introuvable.');
    }
    filamentReferenceId = existing.id;
  } else {
    filamentReference = validateFilamentReference(request.reference.reference);
    if (findReference(snapshot, filamentReference.id)) {
      throw new Error(`La référence filament ${filamentReference.id} existe déjà.`);
    }
    filamentReferenceId = filamentReference.id;
  }

  let location: StorageLocation | undefined;
  let locationId: string | null = null;

  if (request.location.kind === 'existing') {
    const existing = findLocation(snapshot, request.location.id);
    if (!existing) {
      throw new Error("L'emplacement sélectionné est introuvable.");
    }
    locationId = existing.id;
  } else if (request.location.kind === 'new') {
    location = validateStorageLocation(request.location.location);
    if (findLocation(snapshot, location.id)) {
      throw new Error(`L'emplacement ${location.id} existe déjà.`);
    }
    locationId = location.id;
  }

  const ids = planSpoolIds(
    snapshot.spools.map((spool) => spool.id),
    request.quantity,
    request.requestedFirstId,
  );

  const spools = ids.map((id) =>
    validatePersistedSpoolV2({
      ...request.spool,
      recordVersion: 2,
      id,
      filamentReferenceId,
      locationId,
    }),
  );

  return {
    filamentReference,
    location,
    spools,
    ids,
  };
}

export async function createSpoolBatch(
  store: InventoryStore,
  request: CreateSpoolBatchRequest,
): Promise<PersistedSpoolV2[]> {
  const snapshot = await store.getSnapshot();
  const plan = planSpoolBatch(snapshot, request);
  await store.createInventoryBatch(plan);
  return plan.spools;
}
