import type {
  FilamentReference,
  PersistedSpoolV2,
  StorageLocation,
} from '../model.js';

export interface InventorySnapshot {
  filamentReferences: FilamentReference[];
  locations: StorageLocation[];
  spools: PersistedSpoolV2[];
}

export interface InventoryStore {
  getSnapshot(): Promise<InventorySnapshot>;
  listSpools(): Promise<PersistedSpoolV2[]>;
  getSpool(id: string): Promise<PersistedSpoolV2 | undefined>;
  listFilamentReferences(): Promise<FilamentReference[]>;
  getFilamentReference(id: string): Promise<FilamentReference | undefined>;
  createFilamentReference(reference: FilamentReference): Promise<void>;
  updateFilamentReference(reference: FilamentReference): Promise<void>;
  listLocations(): Promise<StorageLocation[]>;
  getLocation(id: string): Promise<StorageLocation | undefined>;
  createLocation(location: StorageLocation): Promise<void>;
  createSpools(spools: PersistedSpoolV2[]): Promise<void>;
  updateSpool(spool: PersistedSpoolV2): Promise<void>;
  replaceSnapshot(snapshot: InventorySnapshot): Promise<void>;
}
