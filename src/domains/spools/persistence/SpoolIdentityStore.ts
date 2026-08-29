export interface PersistedSpoolIdentity {
  id: string;
}

export interface SpoolIdentityStore {
  save(identity: PersistedSpoolIdentity): Promise<void>;
  get(id: string): Promise<PersistedSpoolIdentity | undefined>;
  remove(id: string): Promise<void>;
}
