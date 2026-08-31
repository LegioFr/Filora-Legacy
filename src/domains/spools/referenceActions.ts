import {
  validateFilamentReference,
  validatePersistedSpoolV2,
  type FilamentReference,
  type PersistedSpoolV2,
} from './model.js';
import type { InventorySnapshot, InventoryStore } from './persistence/InventoryStore.js';

export interface SharedReferenceImpact {
  reference: FilamentReference;
  spoolIds: string[];
  affectedSpoolCount: number;
}

export type SpoolReferenceSelection =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; reference: FilamentReference };

export interface SpoolReferenceReassignmentPlan {
  spool: PersistedSpoolV2;
  filamentReference?: FilamentReference;
}

function findReference(snapshot: InventorySnapshot, id: string): FilamentReference | undefined {
  const key = id.trim().toLowerCase();
  return snapshot.filamentReferences.find((reference) => reference.id.toLowerCase() === key);
}

function findSpool(snapshot: InventorySnapshot, id: string): PersistedSpoolV2 | undefined {
  const key = id.trim().toLowerCase();
  return snapshot.spools.find((spool) => spool.id.toLowerCase() === key);
}

export function inspectSharedReference(
  snapshot: InventorySnapshot,
  referenceId: string,
): SharedReferenceImpact {
  const reference = findReference(snapshot, referenceId);
  if (!reference) {
    throw new Error('La référence filament est introuvable.');
  }

  const spoolIds = snapshot.spools
    .filter((spool) => spool.filamentReferenceId?.toLowerCase() === reference.id.toLowerCase())
    .map((spool) => spool.id)
    .sort((left, right) => left.localeCompare(right));

  return {
    reference,
    spoolIds,
    affectedSpoolCount: spoolIds.length,
  };
}

export function planSpoolReferenceReassignment(
  snapshot: InventorySnapshot,
  spoolId: string,
  selection: SpoolReferenceSelection,
): SpoolReferenceReassignmentPlan {
  const current = findSpool(snapshot, spoolId);
  if (!current) {
    throw new Error('La bobine à modifier est introuvable.');
  }

  let filamentReference: FilamentReference | undefined;
  let filamentReferenceId: string;

  if (selection.kind === 'existing') {
    const existing = findReference(snapshot, selection.id);
    if (!existing) {
      throw new Error('La nouvelle référence filament sélectionnée est introuvable.');
    }
    filamentReferenceId = existing.id;
  } else {
    filamentReference = validateFilamentReference(selection.reference);
    if (findReference(snapshot, filamentReference.id)) {
      throw new Error(`La référence filament ${filamentReference.id} existe déjà.`);
    }
    filamentReferenceId = filamentReference.id;
  }

  return {
    filamentReference,
    spool: validatePersistedSpoolV2({
      ...current,
      filamentReferenceId,
    }),
  };
}

export async function updateSharedFilamentReference(
  store: InventoryStore,
  updatedReference: FilamentReference,
): Promise<SharedReferenceImpact> {
  const snapshot = await store.getSnapshot();
  const impact = inspectSharedReference(snapshot, updatedReference.id);
  const validated = validateFilamentReference({
    ...updatedReference,
    id: impact.reference.id,
  });
  await store.updateFilamentReference(validated);
  return impact;
}

export async function reassignSpoolReference(
  store: InventoryStore,
  spoolId: string,
  selection: SpoolReferenceSelection,
): Promise<PersistedSpoolV2> {
  const snapshot = await store.getSnapshot();
  const plan = planSpoolReferenceReassignment(snapshot, spoolId, selection);

  if (plan.filamentReference) {
    await store.createFilamentReferenceAndUpdateSpool(plan.filamentReference, plan.spool);
  } else {
    await store.updateSpool(plan.spool);
  }

  return plan.spool;
}
