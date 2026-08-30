import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createInventoryBackupJson,
  parseInventoryBackupJson,
  restoreInventoryBackup,
  type ValidatedInventoryBackup,
} from '../domains/spools/backupInventory';
import { createSpoolBatch } from '../domains/spools/createSpoolBatch';
import {
  calculateFilamentRemainingGrams,
  planSpoolIds,
  type FilamentReference,
  type PersistedSpoolV2,
  type StockBasis,
  type SupportKind,
  type TareSource,
} from '../domains/spools/model';
import { IndexedDbInventoryStore } from '../domains/spools/persistence/IndexedDbInventoryStore';
import type { InventorySnapshot } from '../domains/spools/persistence/InventoryStore';
import {
  inspectSharedReference,
  reassignSpoolReference,
  updateSharedFilamentReference,
} from '../domains/spools/referenceActions';
import {
  buildReference,
  emptyReferenceDraft,
  ReferenceFields,
  referenceToDraft,
  type ReferenceDraft,
} from './referenceForm';

type ReferenceMode = 'new' | 'existing';
type LocationMode = 'none' | 'existing' | 'new';
type FormSupportKind = Exclude<SupportKind, null>;

type PendingBackup = {
  validated: ValidatedInventoryBackup;
  raw: unknown;
};

interface SpoolDraft {
  purchaseDate: string;
  openDate: string;
  supplier: string;
  locationMode: LocationMode;
  existingLocationId: string;
  newLocationName: string;
  purchasePriceEuros: string;
  lastDriedDate: string;
  purchaseUrl: string;
  supportKind: FormSupportKind;
  tareSource: TareSource;
  tareWeightGrams: string;
  stockBasis: StockBasis;
  grossMeasuredWeightGrams: string;
  quantity: string;
  requestedFirstId: string;
  notes: string;
}

interface EditReferenceDialog {
  referenceId: string;
  draft: ReferenceDraft;
}

interface ReassignDialog {
  spoolId: string;
  mode: 'existing' | 'new';
  existingReferenceId: string;
  draft: ReferenceDraft;
}

const EMPTY_SNAPSHOT: InventorySnapshot = { filamentReferences: [], locations: [], spools: [] };

function emptySpoolDraft(): SpoolDraft {
  return {
    purchaseDate: '',
    openDate: '',
    supplier: '',
    locationMode: 'none',
    existingLocationId: '',
    newLocationName: '',
    purchasePriceEuros: '',
    lastDriedDate: '',
    purchaseUrl: '',
    supportKind: 'original',
    tareSource: 'measured_empty_support',
    tareWeightGrams: '',
    stockBasis: 'nominal',
    grossMeasuredWeightGrams: '',
    quantity: '1',
    requestedFirstId: '',
    notes: '',
  };
}

function entityId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function decimal(value: string, label: string): number {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);
  if (!normalized || !Number.isFinite(parsed)) throw new Error(`${label} doit être un nombre valide.`);
  return parsed;
}

function nonNegativeDecimal(value: string, label: string): number {
  const parsed = decimal(value, label);
  if (parsed < 0) throw new Error(`${label} doit être supérieur ou égal à zéro.`);
  return parsed;
}

function positiveDecimal(value: string, label: string): number {
  const parsed = decimal(value, label);
  if (parsed <= 0) throw new Error(`${label} doit être supérieur à zéro.`);
  return parsed;
}

function optionalNonNegativeDecimal(value: string, label: string): number | null {
  if (!value.trim()) return null;
  return nonNegativeDecimal(value, label);
}

function quantityValue(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new Error('Le nombre de bobines doit être compris entre 1 et 20.');
  }
  return parsed;
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
  } catch {
    throw new Error("Le lien de rachat doit être une URL http(s) valide.");
  }
  return trimmed;
}

function looseNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatGrams(value: number): string {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} g`;
}

function formatMoney(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function qualityLabel(basis: StockBasis): string {
  return basis === 'measured' ? 'Mesuré' : 'Nominal · non vérifié';
}

function tareSourceLabel(source: TareSource): string {
  return source === 'measured_empty_support' ? 'Support vide pesé' : 'Valeur fabricant';
}

function supportLabel(kind: SupportKind): string {
  if (kind === 'reusable') return 'Support réutilisable / refill';
  if (kind === 'original') return "Bobine d'origine";
  return 'Support non renseigné';
}

function backupFileName(): string {
  return `filora-backup-v2-${new Date().toISOString().slice(0, 10)}.json`;
}

function referenceLabel(reference: FilamentReference): string {
  return [reference.brand, reference.manufacturerType, reference.manufacturerColor]
    .filter(Boolean)
    .join(' · ');
}

export function App() {
  const store = useMemo(() => new IndexedDbInventoryStore(), []);
  const [snapshot, setSnapshot] = useState<InventorySnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('new');
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [referenceDraft, setReferenceDraft] = useState<ReferenceDraft>(() => emptyReferenceDraft());
  const [spoolDraft, setSpoolDraft] = useState<SpoolDraft>(() => emptySpoolDraft());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | 'info'>('info');
  const [editReference, setEditReference] = useState<EditReferenceDialog | null>(null);
  const [reassignDialog, setReassignDialog] = useState<ReassignDialog | null>(null);
  const [modalStatus, setModalStatus] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [pendingBackup, setPendingBackup] = useState<PendingBackup | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await store.getSnapshot();
      setSnapshot(next);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de lire le stock local.');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { void refresh(); }, [refresh]);

  const selectedReference = useMemo(
    () => snapshot.filamentReferences.find((item) => item.id === selectedReferenceId) ?? null,
    [snapshot.filamentReferences, selectedReferenceId],
  );

  const measuredCount = snapshot.spools.filter((spool) => spool.stockBasis === 'measured').length;
  const legacyCount = snapshot.spools.filter((spool) => spool.filamentReferenceId === null).length;

  const previewIds = useMemo(() => {
    try {
      return planSpoolIds(
        snapshot.spools.map((spool) => spool.id),
        quantityValue(spoolDraft.quantity),
        spoolDraft.requestedFirstId.trim() || undefined,
      );
    } catch {
      return [];
    }
  }, [snapshot.spools, spoolDraft.quantity, spoolDraft.requestedFirstId]);

  const summaryNominal = referenceMode === 'existing'
    ? selectedReference?.nominalWeightGrams ?? null
    : looseNumber(referenceDraft.nominalWeightGrams);
  const summaryTare = looseNumber(spoolDraft.tareWeightGrams);
  const summaryGross = looseNumber(spoolDraft.grossMeasuredWeightGrams);
  const summaryRemaining = spoolDraft.stockBasis === 'measured'
    ? summaryGross !== null && summaryTare !== null ? Math.max(0, summaryGross - summaryTare) : null
    : summaryNominal;
  const summaryPercent = summaryRemaining !== null && summaryNominal && summaryNominal > 0
    ? (summaryRemaining / summaryNominal) * 100
    : null;
  const summaryColor = referenceMode === 'existing'
    ? selectedReference?.colorHex ?? '#334155'
    : referenceDraft.colorHex;
  const summaryTitle = referenceMode === 'existing'
    ? selectedReference ? referenceLabel(selectedReference) : 'Choisir une référence'
    : [referenceDraft.brand || 'Nouvelle référence', referenceDraft.manufacturerColor].filter(Boolean).join(' · ');

  function patchSpool<K extends keyof SpoolDraft>(key: K, value: SpoolDraft[K]) {
    setSpoolDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    setStatusKind('info');

    try {
      const newReferenceId = entityId('REF');
      const reference = referenceMode === 'new'
        ? { kind: 'new' as const, reference: buildReference(referenceDraft, newReferenceId) }
        : { kind: 'existing' as const, id: selectedReferenceId };

      const newLocationId = entityId('LOC');
      const location = spoolDraft.locationMode === 'none'
        ? { kind: 'none' as const }
        : spoolDraft.locationMode === 'existing'
          ? { kind: 'existing' as const, id: spoolDraft.existingLocationId }
          : {
              kind: 'new' as const,
              location: { id: newLocationId, name: spoolDraft.newLocationName },
            };

      const tareWeightGrams = nonNegativeDecimal(spoolDraft.tareWeightGrams, 'Tare');
      const grossMeasuredWeightGrams = spoolDraft.stockBasis === 'measured'
        ? positiveDecimal(spoolDraft.grossMeasuredWeightGrams, 'Poids brut mesuré')
        : null;

      const created = await createSpoolBatch(store, {
        reference,
        location,
        quantity: quantityValue(spoolDraft.quantity),
        requestedFirstId: spoolDraft.requestedFirstId.trim() || undefined,
        spool: {
          purchaseDate: optionalText(spoolDraft.purchaseDate),
          openDate: optionalText(spoolDraft.openDate),
          supplier: optionalText(spoolDraft.supplier),
          purchasePriceEuros: optionalNonNegativeDecimal(spoolDraft.purchasePriceEuros, "Prix d'achat"),
          lastDriedDate: optionalText(spoolDraft.lastDriedDate),
          purchaseUrl: optionalUrl(spoolDraft.purchaseUrl),
          supportKind: spoolDraft.supportKind,
          tareWeightGrams,
          tareSource: spoolDraft.tareSource,
          grossMeasuredWeightGrams,
          stockBasis: spoolDraft.stockBasis,
          notes: optionalText(spoolDraft.notes),
        },
      });

      await refresh();
      if (reference.kind === 'new') {
        setReferenceMode('existing');
        setSelectedReferenceId(reference.reference.id);
      }
      setSpoolDraft(emptySpoolDraft());
      setStatusKind('success');
      setStatus(`${created.length} bobine${created.length > 1 ? 's' : ''} enregistrée${created.length > 1 ? 's' : ''} : ${created.map((item) => item.id).join(', ')}.`);
    } catch (error) {
      setStatusKind('error');
      setStatus(error instanceof Error ? error.message : "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  function openReferenceEditor(reference: FilamentReference) {
    setModalStatus('');
    setEditReference({ referenceId: reference.id, draft: referenceToDraft(reference) });
  }

  async function handleReferenceUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editReference) return;
    setModalStatus('');
    try {
      const impact = inspectSharedReference(snapshot, editReference.referenceId);
      if (impact.affectedSpoolCount > 1) {
        const confirmed = window.confirm(
          `Cette référence est utilisée par ${impact.affectedSpoolCount} bobines. La correction s'appliquera aux ${impact.affectedSpoolCount} bobines liées. Continuer ?`,
        );
        if (!confirmed) return;
      }
      const updated = buildReference(editReference.draft, editReference.referenceId);
      await updateSharedFilamentReference(store, updated);
      await refresh();
      setEditReference(null);
      setStatusKind('success');
      setStatus(`Référence corrigée pour ${impact.affectedSpoolCount} bobine${impact.affectedSpoolCount > 1 ? 's' : ''} liée${impact.affectedSpoolCount > 1 ? 's' : ''}.`);
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : 'La référence n’a pas pu être modifiée.');
    }
  }

  function openReassign(spool: PersistedSpoolV2) {
    const alternative = snapshot.filamentReferences.find((reference) => reference.id !== spool.filamentReferenceId);
    setModalStatus('');
    setReassignDialog({
      spoolId: spool.id,
      mode: alternative ? 'existing' : 'new',
      existingReferenceId: alternative?.id ?? '',
      draft: emptyReferenceDraft(),
    });
  }

  async function handleReassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reassignDialog) return;
    setModalStatus('');
    try {
      if (reassignDialog.mode === 'existing') {
        if (!reassignDialog.existingReferenceId) throw new Error('Choisis une référence filament.');
        await reassignSpoolReference(store, reassignDialog.spoolId, {
          kind: 'existing',
          id: reassignDialog.existingReferenceId,
        });
      } else {
        const reference = buildReference(reassignDialog.draft, entityId('REF'));
        await reassignSpoolReference(store, reassignDialog.spoolId, { kind: 'new', reference });
      }
      await refresh();
      setReassignDialog(null);
      setStatusKind('success');
      setStatus(`Le filament de ${reassignDialog.spoolId} a été changé sans modifier les autres bobines.`);
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : 'La réaffectation a échoué.');
    }
  }

  async function handleBackupDownload() {
    setBackupBusy(true);
    setBackupStatus('');
    try {
      const json = await createInventoryBackupJson(store);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupStatus(`Sauvegarde v2 créée : ${snapshot.spools.length} bobine${snapshot.spools.length > 1 ? 's' : ''}, ${snapshot.filamentReferences.length} référence${snapshot.filamentReferences.length > 1 ? 's' : ''}.`);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Impossible de créer la sauvegarde.');
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    setPendingBackup(null);
    setBackupStatus('');
    if (!file) return;
    setBackupBusy(true);
    try {
      const text = await file.text();
      const validated = parseInventoryBackupJson(text);
      const raw = JSON.parse(text) as unknown;
      setPendingBackup({ validated, raw });
      setBackupStatus(
        `Sauvegarde valide (v${validated.sourceVersion}) : ${validated.snapshot.spools.length} bobine${validated.snapshot.spools.length > 1 ? 's' : ''}. Aucune donnée n'a encore été modifiée.`,
      );
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Impossible de lire cette sauvegarde.');
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestore() {
    if (!pendingBackup) return;
    const confirmed = window.confirm(
      `La restauration remplacera entièrement le stock local par ${pendingBackup.validated.snapshot.spools.length} bobine${pendingBackup.validated.snapshot.spools.length > 1 ? 's' : ''}. Continuer ?`,
    );
    if (!confirmed) return;
    setBackupBusy(true);
    setBackupStatus('');
    try {
      const restored = await restoreInventoryBackup(store, pendingBackup.raw);
      await refresh();
      setPendingBackup(null);
      setBackupStatus(`Restauration terminée depuis une sauvegarde v${restored.sourceVersion}.`);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'La restauration a échoué.');
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Filora accueil">
          <span className="brand-mark">F</span>
          <span><strong>Filora</strong><small>Filament inventory</small></span>
        </a>
        <nav className="side-nav" aria-label="Navigation principale">
          <a className="active" href="#create"><span>＋</span> Ajouter une bobine</a>
          <a href="#stock"><span>◎</span> Stock</a>
          <a href="#safety"><span>↗</span> Sauvegarde</a>
        </nav>
        <div className="sidebar-stats">
          <div><span>Bobines</span><strong>{snapshot.spools.length}</strong></div>
          <div><span>Mesurées</span><strong>{measuredCount}</strong></div>
          <div><span>Références</span><strong>{snapshot.filamentReferences.length}</strong></div>
        </div>
        <p className="sidebar-note">Batch 6 · données locales IndexedDB v2</p>
      </aside>

      <main className="workspace" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow">Gestion du filament</p>
            <h1>Stock de bobines</h1>
          </div>
          <a className="primary-link" href="#create">＋ Nouvelle bobine</a>
        </header>

        {loadError ? <div className="global-alert error" role="alert">{loadError}</div> : null}
        {legacyCount > 0 ? (
          <div className="global-alert warning">
            <strong>{legacyCount} bobine{legacyCount > 1 ? 's' : ''} héritée{legacyCount > 1 ? 's' : ''}</strong>
            <span>Référence filament à compléter, sans donnée produit inventée.</span>
          </div>
        ) : null}

        <section className="intro-card">
          <div>
            <span className="section-kicker">Création complète</span>
            <h2>Une référence produit, une ou plusieurs bobines physiques.</h2>
            <p>Renseigne le filament une fois, choisis si le stock est nominal ou réellement pesé, puis Filora crée chaque exemplaire avec son propre ID.</p>
          </div>
          <div className="intro-facts">
            <span><b>01</b> Produit partagé</span>
            <span><b>02</b> Stock traçable</span>
            <span><b>03</b> Écriture atomique</span>
          </div>
        </section>

        <section className="creation-layout" id="create">
          <form className="form-card" onSubmit={handleCreate}>
            <div className="form-card-head">
              <div><span className="step-number">1</span><div><p>Identification</p><h2>Filament</h2></div></div>
              <span className="required-legend">Champs essentiels indiqués</span>
            </div>

            <div className="segmented" role="group" aria-label="Mode de référence filament">
              <button type="button" className={referenceMode === 'new' ? 'selected' : ''} onClick={() => setReferenceMode('new')}>Nouvelle référence</button>
              <button type="button" className={referenceMode === 'existing' ? 'selected' : ''} onClick={() => setReferenceMode('existing')}>Référence existante</button>
            </div>

            {referenceMode === 'new' ? (
              <ReferenceFields draft={referenceDraft} onChange={setReferenceDraft} idPrefix="create" />
            ) : (
              <div className="existing-reference-panel">
                <label className="field">
                  <span>Référence filament <b>obligatoire</b></span>
                  <select value={selectedReferenceId} onChange={(event) => setSelectedReferenceId(event.target.value)}>
                    <option value="">Sélectionner une référence…</option>
                    {snapshot.filamentReferences.map((reference) => (
                      <option key={reference.id} value={reference.id}>{referenceLabel(reference)} · {reference.material}</option>
                    ))}
                  </select>
                </label>
                {selectedReference ? (
                  <div className="reference-preview">
                    <span className="large-swatch" style={{ background: selectedReference.colorHex ?? '#334155' }} />
                    <div><strong>{referenceLabel(selectedReference)}</strong><span>{selectedReference.material} · {selectedReference.diameterMm} mm · {formatGrams(selectedReference.nominalWeightGrams)}</span></div>
                  </div>
                ) : <p className="helper-text">Les données communes seront reprises sans créer de copie indépendante.</p>}
              </div>
            )}

            <div className="form-divider" />
            <div className="form-section-heading"><span className="step-number">2</span><div><p>Achat & rangement</p><h3>Informations de cette bobine</h3></div></div>
            <div className="field-grid">
              <label className="field"><span>Date d’achat</span><input type="date" value={spoolDraft.purchaseDate} onChange={(e) => patchSpool('purchaseDate', e.target.value)} /></label>
              <label className="field"><span>Date d’ouverture</span><input type="date" value={spoolDraft.openDate} onChange={(e) => patchSpool('openDate', e.target.value)} /></label>
            </div>
            <div className="field-grid">
              <label className="field"><span>Fournisseur / boutique</span><input list="supplier-list" value={spoolDraft.supplier} onChange={(e) => patchSpool('supplier', e.target.value)} placeholder="Amazon, Atome3D…" /><datalist id="supplier-list"><option value="Bambu Lab" /><option value="Prusa Research" /><option value="3DJake" /><option value="Atome3D" /><option value="Polyfab3D" /><option value="Amazon" /><option value="AliExpress" /></datalist></label>
              <label className="field"><span>Prix d’achat <b>€</b></span><input value={spoolDraft.purchasePriceEuros} onChange={(e) => patchSpool('purchasePriceEuros', e.target.value)} inputMode="decimal" placeholder="24,90" /></label>
            </div>

            <div className="location-box">
              <div className="location-tabs">
                <button type="button" className={spoolDraft.locationMode === 'none' ? 'selected' : ''} onClick={() => patchSpool('locationMode', 'none')}>Sans emplacement</button>
                <button type="button" className={spoolDraft.locationMode === 'existing' ? 'selected' : ''} onClick={() => patchSpool('locationMode', 'existing')}>Existant</button>
                <button type="button" className={spoolDraft.locationMode === 'new' ? 'selected' : ''} onClick={() => patchSpool('locationMode', 'new')}>Nouveau</button>
              </div>
              {spoolDraft.locationMode === 'existing' ? (
                <label className="field"><span>Emplacement</span><select value={spoolDraft.existingLocationId} onChange={(e) => patchSpool('existingLocationId', e.target.value)}><option value="">Sélectionner…</option>{snapshot.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
              ) : spoolDraft.locationMode === 'new' ? (
                <label className="field"><span>Nom du nouvel emplacement</span><input value={spoolDraft.newLocationName} onChange={(e) => patchSpool('newLocationName', e.target.value)} placeholder="Étagère 2, Drybox…" /></label>
              ) : <p className="helper-text">La bobine restera sans emplacement courant renseigné.</p>}
            </div>

            <div className="field-grid">
              <label className="field"><span>Dernier séchage</span><input type="date" value={spoolDraft.lastDriedDate} onChange={(e) => patchSpool('lastDriedDate', e.target.value)} /></label>
              <label className="field"><span>Lien de rachat exact</span><input type="url" value={spoolDraft.purchaseUrl} onChange={(e) => patchSpool('purchaseUrl', e.target.value)} placeholder="https://…" /></label>
            </div>

            <div className="form-divider" />
            <div className="form-section-heading"><span className="step-number">3</span><div><p>Poids & support</p><h3>Source du stock</h3></div></div>
            <div className="segmented stock-basis-toggle">
              <button type="button" className={spoolDraft.stockBasis === 'nominal' ? 'selected' : ''} onClick={() => patchSpool('stockBasis', 'nominal')}><strong>Nominal</strong><small>non pesée</small></button>
              <button type="button" className={spoolDraft.stockBasis === 'measured' ? 'selected' : ''} onClick={() => patchSpool('stockBasis', 'measured')}><strong>Mesuré</strong><small>pesée réelle</small></button>
            </div>
            <div className="field-grid">
              <label className="field"><span>Type de support <b>obligatoire</b></span><select value={spoolDraft.supportKind} onChange={(e) => patchSpool('supportKind', e.target.value as FormSupportKind)}><option value="original">Bobine d’origine</option><option value="reusable">Support réutilisable / refill</option></select></label>
              <label className="field"><span>Bobine vide / origine de tare <b>obligatoire</b></span><select value={spoolDraft.tareSource} onChange={(e) => patchSpool('tareSource', e.target.value as TareSource)}><option value="measured_empty_support">Support vide pesé</option><option value="manufacturer">Valeur fabricant</option></select></label>
            </div>
            <div className="field-grid">
              <label className="field"><span>Tare bobine vide <b>g · obligatoire</b></span><input value={spoolDraft.tareWeightGrams} onChange={(e) => patchSpool('tareWeightGrams', e.target.value)} inputMode="decimal" placeholder="210,1" /></label>
              {spoolDraft.stockBasis === 'measured' ? (
                <label className="field measured-field"><span>Poids brut réellement mesuré <b>g · obligatoire</b></span><input value={spoolDraft.grossMeasuredWeightGrams} onChange={(e) => patchSpool('grossMeasuredWeightGrams', e.target.value)} inputMode="decimal" placeholder="842,6" /></label>
              ) : (
                <div className="nominal-note"><strong>Aucune fausse pesée.</strong><span>Le stock initial utilisera le poids nominal de la référence et restera marqué « non vérifié ».</span></div>
              )}
            </div>

            <div className="form-divider" />
            <div className="form-section-heading"><span className="step-number">4</span><div><p>Création en série</p><h3>Exemplaires physiques</h3></div></div>
            <div className="field-grid">
              <label className="field"><span>Nombre de bobines <b>1 à 20</b></span><input type="number" min="1" max="20" value={spoolDraft.quantity} onChange={(e) => patchSpool('quantity', e.target.value)} /></label>
              <label className="field"><span>Premier ID personnalisé</span><input value={spoolDraft.requestedFirstId} onChange={(e) => patchSpool('requestedFirstId', e.target.value)} placeholder="Optionnel · sinon SP-####" /></label>
            </div>
            <div className="id-preview"><span>IDs prévus</span><strong>{previewIds.length ? previewIds.join(' · ') : '—'}</strong></div>

            <label className="field notes-field"><span>Notes</span><textarea rows={4} value={spoolDraft.notes} onChange={(e) => patchSpool('notes', e.target.value)} placeholder="Informations propres à cette bobine ou à ce lot…" /></label>

            {status ? <div className={`form-status ${statusKind}`} role="status">{status}</div> : null}
            <div className="submit-row">
              <div><strong>Enregistrement local sécurisé</strong><span>Le lot est validé avant la première écriture.</span></div>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : `Enregistrer ${spoolDraft.quantity || '1'} bobine${Number(spoolDraft.quantity) > 1 ? 's' : ''}`}</button>
            </div>
          </form>

          <aside className="summary-card" aria-label="Résumé avant enregistrement">
            <div className="summary-head"><span>Résumé</span><span className={`quality-badge ${spoolDraft.stockBasis}`}>{qualityLabel(spoolDraft.stockBasis)}</span></div>
            <div className="spool-visual">
              <div className="spool-ring"><span style={{ background: /^#[0-9a-f]{6}$/i.test(summaryColor ?? '') ? summaryColor ?? '#334155' : '#334155' }} /></div>
              <div><h3>{summaryTitle}</h3><p>{referenceMode === 'existing' ? selectedReference?.material ?? '—' : referenceDraft.material || '—'} · {referenceMode === 'existing' ? selectedReference?.diameterMm ?? '—' : referenceDraft.diameterMm || '—'} mm</p></div>
            </div>
            <div className="summary-metric"><span>Filament disponible</span><strong>{summaryRemaining === null ? '—' : formatGrams(summaryRemaining)}</strong>{summaryPercent !== null ? <small>{summaryPercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du nominal</small> : null}</div>
            <div className="summary-grid">
              <div><span>Poids nominal</span><strong>{summaryNominal === null ? '—' : formatGrams(summaryNominal)}</strong></div>
              <div><span>Tare</span><strong>{summaryTare === null ? '—' : formatGrams(summaryTare)}</strong></div>
              <div><span>Support</span><strong>{supportLabel(spoolDraft.supportKind)}</strong></div>
              <div><span>Origine tare</span><strong>{tareSourceLabel(spoolDraft.tareSource)}</strong></div>
            </div>
            <div className="summary-rule"><span className={spoolDraft.stockBasis === 'measured' ? 'dot green' : 'dot amber'} />{spoolDraft.stockBasis === 'measured' ? 'Poids brut conservé comme mesure physique.' : 'Aucune mesure physique ne sera inventée.'}</div>
            <div className="summary-series"><span>Lot</span><strong>{previewIds.length || 0} exemplaire{previewIds.length > 1 ? 's' : ''}</strong><small>{previewIds.slice(0, 3).join(' · ')}{previewIds.length > 3 ? ` · +${previewIds.length - 3}` : ''}</small></div>
          </aside>
        </section>

        <section className="stock-section" id="stock">
          <div className="section-title-row"><div><p className="eyebrow">Inventaire courant</p><h2>Bobines enregistrées</h2><span>{loading ? 'Chargement…' : `${snapshot.spools.length} bobine${snapshot.spools.length > 1 ? 's' : ''}`}</span></div></div>
          {!loading && snapshot.spools.length === 0 ? <div className="empty-state"><strong>Aucune bobine enregistrée</strong><span>Le premier lot créé apparaîtra ici.</span></div> : null}
          <div className="stock-grid">
            {snapshot.spools.slice().sort((a, b) => a.id.localeCompare(b.id)).map((spool) => {
              const reference = spool.filamentReferenceId ? snapshot.filamentReferences.find((item) => item.id === spool.filamentReferenceId) ?? null : null;
              const location = spool.locationId ? snapshot.locations.find((item) => item.id === spool.locationId) ?? null : null;
              let remaining: number | null = null;
              try { remaining = calculateFilamentRemainingGrams(spool, reference); } catch { remaining = null; }
              const percent = remaining !== null && reference ? (remaining / reference.nominalWeightGrams) * 100 : null;
              return (
                <article className="stock-card" key={spool.id}>
                  <div className="stock-card-top">
                    <span className="stock-swatch" style={{ background: reference?.colorHex ?? '#475569' }} />
                    <div className="stock-card-title"><strong>{reference ? referenceLabel(reference) : 'Référence filament à compléter'}</strong><span>{reference ? `${reference.material} · ${reference.diameterMm} mm` : 'Donnée héritée préservée sans produit inventé'}</span></div>
                    <span className={`quality-badge ${spool.stockBasis}`}>{qualityLabel(spool.stockBasis)}</span>
                  </div>
                  <div className="stock-amount"><strong>{remaining === null ? '—' : formatGrams(remaining)}</strong><span>disponible</span></div>
                  {percent !== null ? <div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }} /></div> : null}
                  <dl className="stock-meta">
                    <div><dt>ID</dt><dd>{spool.id}</dd></div>
                    <div><dt>Emplacement</dt><dd>{location?.name ?? '—'}</dd></div>
                    <div><dt>Fournisseur</dt><dd>{spool.supplier ?? '—'}</dd></div>
                    <div><dt>Prix</dt><dd>{formatMoney(spool.purchasePriceEuros)}</dd></div>
                  </dl>
                  <div className="stock-card-actions">
                    {reference ? <button type="button" onClick={() => openReferenceEditor(reference)}>Modifier la référence</button> : null}
                    <button type="button" className="accent-action" onClick={() => openReassign(spool)}>{reference ? 'Changer le filament' : 'Compléter la référence'}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="safety-section" id="safety">
          <div className="safety-copy"><p className="eyebrow">Sécurité des données</p><h2>Sauvegarde & restauration v2</h2><p>La sauvegarde contient les références, les emplacements, les bobines et leurs relations. Un fichier v1 Batch 5 reste accepté et migré sans inventer de données.</p></div>
          <div className="safety-actions">
            <button className="primary-button" type="button" onClick={handleBackupDownload} disabled={backupBusy}>Télécharger la sauvegarde</button>
            <label className="file-button">Choisir une sauvegarde<input type="file" accept="application/json,.json" onChange={handleBackupFile} disabled={backupBusy} /></label>
            {pendingBackup ? <button className="danger-button" type="button" onClick={handleRestore} disabled={backupBusy}>Restaurer et remplacer le stock</button> : null}
          </div>
          {backupStatus ? <div className="backup-status" role="status">{backupStatus}</div> : null}
        </section>
      </main>

      {editReference ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditReference(null); }}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-reference-title">
            <div className="modal-head"><div><p className="eyebrow">Correction partagée</p><h2 id="edit-reference-title">Modifier la référence filament</h2></div><button className="icon-button" type="button" onClick={() => setEditReference(null)}>×</button></div>
            <div className="shared-warning"><strong>Impact partagé</strong><span>Cette référence est liée à {inspectSharedReference(snapshot, editReference.referenceId).affectedSpoolCount} bobine{inspectSharedReference(snapshot, editReference.referenceId).affectedSpoolCount > 1 ? 's' : ''}. La correction sera visible sur toutes.</span></div>
            <form onSubmit={handleReferenceUpdate}>
              <ReferenceFields draft={editReference.draft} onChange={(draft) => setEditReference({ ...editReference, draft })} idPrefix="edit" />
              {modalStatus ? <div className="form-status error">{modalStatus}</div> : null}
              <div className="modal-actions"><button type="button" onClick={() => setEditReference(null)}>Annuler</button><button className="primary-button" type="submit">Enregistrer la correction</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {reassignDialog ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReassignDialog(null); }}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reassign-title">
            <div className="modal-head"><div><p className="eyebrow">Bobine {reassignDialog.spoolId}</p><h2 id="reassign-title">Changer le filament de cette bobine</h2></div><button className="icon-button" type="button" onClick={() => setReassignDialog(null)}>×</button></div>
            <p className="modal-intro">Seule cette bobine sera réaffectée. Les autres exemplaires liés à l’ancienne référence ne seront pas modifiés.</p>
            <form onSubmit={handleReassign}>
              <div className="segmented"><button type="button" className={reassignDialog.mode === 'existing' ? 'selected' : ''} onClick={() => setReassignDialog({ ...reassignDialog, mode: 'existing' })}>Référence existante</button><button type="button" className={reassignDialog.mode === 'new' ? 'selected' : ''} onClick={() => setReassignDialog({ ...reassignDialog, mode: 'new' })}>Nouvelle référence</button></div>
              {reassignDialog.mode === 'existing' ? (
                <label className="field modal-single-field"><span>Nouvelle référence</span><select value={reassignDialog.existingReferenceId} onChange={(e) => setReassignDialog({ ...reassignDialog, existingReferenceId: e.target.value })}><option value="">Sélectionner…</option>{snapshot.filamentReferences.filter((reference) => reference.id !== snapshot.spools.find((spool) => spool.id === reassignDialog.spoolId)?.filamentReferenceId).map((reference) => <option value={reference.id} key={reference.id}>{referenceLabel(reference)} · {reference.material}</option>)}</select></label>
              ) : <ReferenceFields draft={reassignDialog.draft} onChange={(draft) => setReassignDialog({ ...reassignDialog, draft })} idPrefix="reassign" />}
              {modalStatus ? <div className="form-status error">{modalStatus}</div> : null}
              <div className="modal-actions"><button type="button" onClick={() => setReassignDialog(null)}>Annuler</button><button className="primary-button" type="submit">Changer cette bobine uniquement</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
