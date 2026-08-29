export type TareSource = 'measured_empty_support' | 'manufacturer';

export interface PersistedSpoolIdentity {
  id: string;
  grossMeasuredWeightGrams: number;
  tareWeightGrams: number;
  tareSource: TareSource;
}

export interface SpoolIdentityStore {
  create(identity: PersistedSpoolIdentity): Promise<void>;
  get(id: string): Promise<PersistedSpoolIdentity | undefined>;
  list(): Promise<PersistedSpoolIdentity[]>;
  remove(id: string): Promise<void>;
}
