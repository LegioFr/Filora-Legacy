export type TareSource = 'measured_empty_support' | 'manufacturer';

export interface PersistedSpoolIdentity {
  id: string;
  grossMeasuredWeightGrams: number;
  tareWeightGrams: number;
  tareSource: TareSource;
}

export interface SpoolIdentityStore {
  save(identity: PersistedSpoolIdentity): Promise<void>;
  get(id: string): Promise<PersistedSpoolIdentity | undefined>;
  remove(id: string): Promise<void>;
}
