export const PERSONAL_CATALOG_CUSTOM_PREFIX = 'filora.catalog.custom.v1:';
export const PERSONAL_CATALOG_COLOR_HEX_PREFIX = 'filora.catalog.color-hex.v1:';

export interface PersonalCatalogSnapshot {
  customOptions: Record<string, string[]>;
  colorHexes: Record<string, string>;
}

export interface PersonalCatalogStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function emptyPersonalCatalogSnapshot(): PersonalCatalogSnapshot {
  return { customOptions: {}, colorHexes: {} };
}

export function getBrowserPersonalCatalogStorage(): PersonalCatalogStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function relevantKeys(storage: PersonalCatalogStorage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (key.startsWith(PERSONAL_CATALOG_CUSTOM_PREFIX) || key.startsWith(PERSONAL_CATALOG_COLOR_HEX_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

function parseCustomOptions(raw: string, key: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Catalogue personnel local invalide pour ${key}.`);
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`Catalogue personnel local invalide pour ${key}.`);
  }
  return parsed.map((item) => item.trim());
}

export function readPersonalCatalogStorage(
  storage: PersonalCatalogStorage | null = getBrowserPersonalCatalogStorage(),
): PersonalCatalogSnapshot {
  if (!storage) return emptyPersonalCatalogSnapshot();

  const snapshot = emptyPersonalCatalogSnapshot();
  for (const key of relevantKeys(storage)) {
    const raw = storage.getItem(key);
    if (raw === null) continue;

    if (key.startsWith(PERSONAL_CATALOG_CUSTOM_PREFIX)) {
      const scope = key.slice(PERSONAL_CATALOG_CUSTOM_PREFIX.length);
      if (!scope) throw new Error('Catalogue personnel local : clé de sélection invalide.');
      snapshot.customOptions[scope] = parseCustomOptions(raw, key);
      continue;
    }

    const scope = key.slice(PERSONAL_CATALOG_COLOR_HEX_PREFIX.length);
    if (!scope || !/^#[0-9a-f]{6}$/i.test(raw)) {
      throw new Error(`Catalogue personnel local invalide pour ${key}.`);
    }
    snapshot.colorHexes[scope] = raw.toUpperCase();
  }
  return snapshot;
}

function rawRelevantEntries(storage: PersonalCatalogStorage): Array<[string, string]> {
  return relevantKeys(storage).map((key) => [key, storage.getItem(key)] as const)
    .filter((entry): entry is [string, string] => entry[1] !== null);
}

function clearRelevantEntries(storage: PersonalCatalogStorage): void {
  for (const key of relevantKeys(storage)) storage.removeItem(key);
}

function writeSnapshot(storage: PersonalCatalogStorage, snapshot: PersonalCatalogSnapshot): void {
  for (const scope of Object.keys(snapshot.customOptions).sort()) {
    storage.setItem(
      `${PERSONAL_CATALOG_CUSTOM_PREFIX}${scope}`,
      JSON.stringify(snapshot.customOptions[scope]),
    );
  }
  for (const scope of Object.keys(snapshot.colorHexes).sort()) {
    storage.setItem(`${PERSONAL_CATALOG_COLOR_HEX_PREFIX}${scope}`, snapshot.colorHexes[scope]!);
  }
}

export function replacePersonalCatalogStorage(
  snapshot: PersonalCatalogSnapshot,
  storage: PersonalCatalogStorage | null = getBrowserPersonalCatalogStorage(),
): void {
  const hasData = Object.keys(snapshot.customOptions).length > 0 || Object.keys(snapshot.colorHexes).length > 0;
  if (!storage) {
    if (hasData) throw new Error('Impossible de restaurer le catalogue personnel : stockage local indisponible.');
    return;
  }

  const previous = rawRelevantEntries(storage);
  try {
    clearRelevantEntries(storage);
    writeSnapshot(storage, snapshot);
  } catch (error) {
    try {
      clearRelevantEntries(storage);
      for (const [key, value] of previous) storage.setItem(key, value);
    } catch {
      throw new Error('La restauration du catalogue personnel a échoué et son état précédent n’a pas pu être garanti.');
    }
    throw error;
  }
}
