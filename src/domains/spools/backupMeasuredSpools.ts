import { listMeasuredSpools } from './listMeasuredSpools.js';
import type {
  PersistedSpoolIdentity,
  SpoolIdentityStore,
  TareSource,
} from './persistence/SpoolIdentityStore.js';
import { validateMeasuredSpoolInput } from './registerMeasuredSpool.js';

export const FILORA_BACKUP_FORMAT = 'filora-backup';
export const FILORA_BACKUP_VERSION = 1;

export interface FiloraBackupV1 {
  format: typeof FILORA_BACKUP_FORMAT;
  version: typeof FILORA_BACKUP_VERSION;
  spools: PersistedSpoolIdentity[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  context: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${context} contient des champs manquants ou inconnus.`);
  }
}

function validateBackupSpool(value: unknown, index: number): PersistedSpoolIdentity {
  if (!isRecord(value)) {
    throw new Error(`Bobine ${index + 1} : structure invalide.`);
  }

  assertExactKeys(
    value,
    ['id', 'grossMeasuredWeightGrams', 'tareWeightGrams', 'tareSource'],
    `Bobine ${index + 1}`,
  );

  if (typeof value.id !== 'string') {
    throw new Error(`Bobine ${index + 1} : ID invalide.`);
  }
  if (typeof value.grossMeasuredWeightGrams !== 'number') {
    throw new Error(`Bobine ${value.id || index + 1} : poids brut invalide.`);
  }
  if (typeof value.tareWeightGrams !== 'number') {
    throw new Error(`Bobine ${value.id || index + 1} : tare invalide.`);
  }
  if (typeof value.tareSource !== 'string') {
    throw new Error(`Bobine ${value.id || index + 1} : origine de tare invalide.`);
  }

  let validated: PersistedSpoolIdentity;
  try {
    validated = validateMeasuredSpoolInput({
      id: value.id,
      grossMeasuredWeightGrams: value.grossMeasuredWeightGrams,
      tareWeightGrams: value.tareWeightGrams,
      tareSource: value.tareSource as TareSource,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'donnée invalide';
    throw new Error(`Bobine ${value.id || index + 1} : ${reason}`);
  }

  if (validated.id !== value.id) {
    throw new Error(`Bobine ${index + 1} : l'ID doit déjà être normalisé.`);
  }

  return validated;
}

export function validateFiloraBackup(value: unknown): FiloraBackupV1 {
  if (!isRecord(value)) {
    throw new Error('La sauvegarde Filora doit être un objet JSON.');
  }

  assertExactKeys(value, ['format', 'version', 'spools'], 'La sauvegarde');

  if (value.format !== FILORA_BACKUP_FORMAT) {
    throw new Error('Format de sauvegarde Filora non reconnu.');
  }
  if (value.version !== FILORA_BACKUP_VERSION) {
    throw new Error('Version de sauvegarde Filora non reconnue.');
  }
  if (!Array.isArray(value.spools)) {
    throw new Error('La liste des bobines de la sauvegarde est invalide.');
  }

  const spools = value.spools.map(validateBackupSpool);
  const seenIds = new Set<string>();
  for (const spool of spools) {
    if (seenIds.has(spool.id)) {
      throw new Error(`Bobine ${spool.id} : ID dupliqué dans la sauvegarde.`);
    }
    seenIds.add(spool.id);
  }

  return {
    format: FILORA_BACKUP_FORMAT,
    version: FILORA_BACKUP_VERSION,
    spools,
  };
}

export function parseFiloraBackupJson(text: string): FiloraBackupV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Le fichier sélectionné ne contient pas un JSON valide.');
  }
  return validateFiloraBackup(parsed);
}

export async function createFiloraBackup(store: SpoolIdentityStore): Promise<FiloraBackupV1> {
  return {
    format: FILORA_BACKUP_FORMAT,
    version: FILORA_BACKUP_VERSION,
    spools: await listMeasuredSpools(store),
  };
}

export async function createFiloraBackupJson(store: SpoolIdentityStore): Promise<string> {
  return JSON.stringify(await createFiloraBackup(store), null, 2);
}

export async function restoreFiloraBackup(
  store: SpoolIdentityStore,
  backup: unknown,
): Promise<FiloraBackupV1> {
  const validated = validateFiloraBackup(backup);
  await store.replaceAll(validated.spools);
  return validated;
}
