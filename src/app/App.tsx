import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
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
import { CatalogSelect } from './CatalogSelect';
import {
  MATERIAL_PRINT_DEFAULTS,
  buildShortcutPresets,
  emptySpoolPresetLabel,
  getEmptySpoolPresets,
  getLocationOptions,
  getSupplierOptions,
  getTemperatureDefaults,
  type ShortcutPreset,
} from './filamentCatalog';
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
type AppView = 'stock' | 'settings';
type CreationSectionKey = 'filament' | 'purchase' | 'stock' | 'series';
type CreationSectionPreferences = Record<CreationSectionKey, boolean>;

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
  tarePresetLabel: string;
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

interface CreationSectionProps {
  step: string;
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const EMPTY_SNAPSHOT: InventorySnapshot = { filamentReferences: [], locations: [], spools: [] };
const MANUAL_TARE_LABEL = 'Tare personnalisée / bobine vide pesée manuellement';
const CREATION_SECTIONS_KEY = 'filora.creation.sections.v1';
const DEFAULT_CREATION_SECTIONS: CreationSectionPreferences = {
  filament: true,
  purchase: false,
  stock: false,
  series: false,
};

function loadCreationSections(): CreationSectionPreferences {
  try {
    const raw = globalThis.localStorage?.getItem(CREATION_SECTIONS_KEY);
    if (!raw) return DEFAULT_CREATION_SECTIONS;
    const parsed = JSON.parse(raw) as Partial<CreationSectionPreferences>;
    return {
      filament: typeof parsed.filament === 'boolean' ? parsed.filament : true,
      purchase: typeof parsed.purchase === 'boolean' ? parsed.purchase : false,
      stock: typeof parsed.stock === 'boolean' ? parsed.stock : false,
      series: typeof parsed.series === 'boolean' ? parsed.series : false,
    };
  } catch {
    return DEFAULT_CREATION_SECTIONS;
  }
}

function CreationSection({ step, eyebrow, title, open, onToggle, children }: CreationSectionProps) {
  return (
    <section className={`creation-section${open ? ' is-open' : ''}`}>
      <button className="creation-section-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="step-number">{step}</span>
        <span className="creation-section-title"><small>{eyebrow}</small><strong>{title}</strong></span>
        <span className="creation-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="creation-section-content">{children}</div> : null}
    </section>
  );
}

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
    tarePresetLabel: MANUAL_TARE_LABEL,
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
    throw new Error('Le lien de rachat doit être une URL http(s) valide.');
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
  return `filora-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function referenceLabel(reference: FilamentReference): string {
  return [reference.brand, reference.manufacturerType, reference.manufacturerColor]
    .filter(Boolean)
    .join(' · ');
}

function sameText(left: string, right: string): boolean {
  return left.trim().localeCompare(right.trim(), 'fr', { sensitivity: 'base' }) === 0;
}

export function App() {
  const store = useMemo(() => new IndexedDbInventoryStore(), []);
  const [snapshot, setSnapshot] = useState<InventorySnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('stock');
  const [creationOpen, setCreationOpen] = useState(false);
  const [creationSections, setCreationSections] = useState<CreationSectionPreferences>(loadCreationSections);
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

  useEffect(() => {
    try { globalThis.localStorage?.setItem(CREATION_SECTIONS_KEY, JSON.stringify(creationSections)); } catch { /* préférence non critique */ }
  }, [creationSections]);

  useEffect(() => {
    if (!creationOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setCreationOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [creationOpen, saving]);

  const selectedReference = useMemo(
    () => snapshot.filamentReferences.find((item) => item.id === selectedReferenceId) ?? null,
    [snapshot.filamentReferences, selectedReferenceId],
  );

  const shortcuts = useMemo(
    () => buildShortcutPresets(snapshot.filamentReferences, snapshot.spools, 4).filter((item) => item.count >= 2),
    [snapshot.filamentReferences, snapshot.spools],
  );
  const supplierOptions = useMemo(() => getSupplierOptions(snapshot.spools), [snapshot.spools]);
  const locationOptions = useMemo(() => getLocationOptions(snapshot.locations), [snapshot.locations]);
  const tarePresets = useMemo(
    () => getEmptySpoolPresets(referenceMode === 'existing' ? selectedReference?.brand ?? '' : referenceDraft.brand),
    [referenceDraft.brand, referenceMode, selectedReference?.brand],
  );
  const tarePresetOptions = useMemo(
    () => [MANUAL_TARE_LABEL, ...tarePresets.map(emptySpoolPresetLabel)],
    [tarePresets],
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

  const selectedLocationName = spoolDraft.locationMode === 'existing'
    ? snapshot.locations.find((location) => location.id === spoolDraft.existingLocationId)?.name ?? ''
    : spoolDraft.locationMode === 'new' ? spoolDraft.newLocationName : '';

  function patchSpool<K extends keyof SpoolDraft>(key: K, value: SpoolDraft[K]) {
    setSpoolDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleCreationSection(key: CreationSectionKey) {
    setCreationSections((current) => ({ ...current, [key]: !current[key] }));
  }

  function openCreation() {
    setView('stock');
    setStatus('');
    setCreationOpen(true);
  }

  function closeCreation() {
    if (!saving) setCreationOpen(false);
  }

  function applyShortcut(shortcut: ShortcutPreset) {
    const temps = getTemperatureDefaults(shortcut.brand, shortcut.manufacturerType, shortcut.material);
    const print = MATERIAL_PRINT_DEFAULTS[shortcut.material] ?? {};
    setReferenceMode('new');
    setSelectedReferenceId('');
    setReferenceDraft((current) => ({
      ...current,
      brand: shortcut.brand,
      material: shortcut.material,
      diameterMm: String(shortcut.diameterMm),
      manufacturerType: shortcut.manufacturerType,
      manufacturerColor: '',
      colorHex: '#38BDF8',
      nozzleMin: temps ? String(temps.nozzle[0]) : current.nozzleMin,
      nozzleMax: temps ? String(temps.nozzle[1]) : current.nozzleMax,
      bedMin: temps ? String(temps.bed[0]) : current.bedMin,
      bedMax: temps ? String(temps.bed[1]) : current.bedMax,
      printSpeedMmPerSecond: current.printSpeedMmPerSecond || print.printSpeedMmPerSecond || '',
      flowPercent: current.flowPercent || print.flowPercent || '',
      flowRatio: current.flowRatio || print.flowRatio || '',
      fanPercent: current.fanPercent || print.fanPercent || '',
      retractionMm: current.retractionMm || print.retractionMm || '',
      retractionSpeedMmPerSecond: current.retractionSpeedMmPerSecond || print.retractionSpeedMmPerSecond || '',
    }));
  }

  function chooseLocation(name: string) {
    if (!name.trim()) {
      setSpoolDraft((current) => ({ ...current, locationMode: 'none', existingLocationId: '', newLocationName: '' }));
      return;
    }
    const existing = snapshot.locations.find((location) => sameText(location.name, name));
    if (existing) {
      setSpoolDraft((current) => ({ ...current, locationMode: 'existing', existingLocationId: existing.id, newLocationName: '' }));
    } else {
      setSpoolDraft((current) => ({ ...current, locationMode: 'new', existingLocationId: '', newLocationName: name }));
    }
  }

  function chooseTarePreset(label: string) {
    if (label === MANUAL_TARE_LABEL) {
      setSpoolDraft((current) => ({
        ...current,
        tarePresetLabel: label,
        tareSource: 'measured_empty_support',
        tareWeightGrams: '',
      }));
      return;
    }
    const preset = tarePresets.find((item) => emptySpoolPresetLabel(item) === label);
    if (!preset) return;
    setSpoolDraft((current) => ({
      ...current,
      tarePresetLabel: label,
      tareSource: preset.tareGrams === null ? 'measured_empty_support' : 'manufacturer',
      tareWeightGrams: preset.tareGrams === null ? '' : String(preset.tareGrams),
    }));
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
      if (reference.kind === 'existing' && !reference.id) throw new Error('Choisis une référence filament existante.');

      const newLocationId = entityId('LOC');
      const location = spoolDraft.locationMode === 'none'
        ? { kind: 'none' as const }
        : spoolDraft.locationMode === 'existing'
          ? { kind: 'existing' as const, id: spoolDraft.existingLocationId }
          : { kind: 'new' as const, location: { id: newLocationId, name: spoolDraft.newLocationName } };

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
      setReferenceMode('new');
      setSelectedReferenceId('');
      setReferenceDraft(emptyReferenceDraft());
      setSpoolDraft(emptySpoolDraft());
      setStatusKind('success');
      setStatus(`${created.length} bobine${created.length > 1 ? 's' : ''} enregistrée${created.length > 1 ? 's' : ''} : ${created.map((item) => item.id).join(', ')}.`);
      setCreationOpen(false);
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
        await reassignSpoolReference(store, reassignDialog.spoolId, { kind: 'existing', id: reassignDialog.existingReferenceId });
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
      setBackupStatus(`Sauvegarde créée : ${snapshot.spools.length} bobine${snapshot.spools.length > 1 ? 's' : ''}, ${snapshot.filamentReferences.length} référence${snapshot.filamentReferences.length > 1 ? 's' : ''}.`);
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
      setBackupStatus(`Sauvegarde valide : ${validated.snapshot.spools.length} bobine${validated.snapshot.spools.length > 1 ? 's' : ''}. Aucune donnée n'a encore été modifiée.`);
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
      await restoreInventoryBackup(store, pendingBackup.raw);
      await refresh();
      setPendingBackup(null);
      setBackupStatus('Restauration terminée.');
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'La restauration a échoué.');
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <a className="brand" href="#stock" aria-label="Filora accueil" onClick={(event) => { event.preventDefault(); setView('stock'); }}>
          <span className="brand-mark">F</span>
          <span><strong>Filora</strong><small>Filament inventory</small></span>
        </a>
        <nav className="side-nav" aria-label="Navigation principale">
          <a className={view === 'stock' ? 'active' : ''} href="#stock" onClick={(event) => { event.preventDefault(); setView('stock'); }}><span>◎</span> Stock</a>
          <a className={view === 'settings' ? 'active' : ''} href="#settings" onClick={(event) => { event.preventDefault(); setView('settings'); }}><span>⚙</span> Réglages</a>
        </nav>
        <div className="sidebar-stats">
          <div><span>Bobines</span><strong>{snapshot.spools.length}</strong></div>
          <div><span>Mesurées</span><strong>{measuredCount}</strong></div>
          <div><span>Références</span><strong>{snapshot.filamentReferences.length}</strong></div>
        </div>
      </aside>

      <main className="workspace" id={view === 'stock' ? 'stock' : 'settings'}>
        {view === 'stock' ? (
          <>
            <header className="topbar">
              <div><p className="eyebrow">Gestion du filament</p><h1>Stock de bobines</h1></div>
              <button className="primary-link" type="button" onClick={openCreation}>＋ Ajouter une bobine</button>
            </header>

            {loadError ? <div className="global-alert error" role="alert">{loadError}</div> : null}
            {status ? <div className={`global-alert ${statusKind === 'error' ? 'error' : statusKind === 'success' ? 'success' : ''}`} role="status">{status}</div> : null}
            {legacyCount > 0 ? (
              <div className="global-alert warning"><strong>{legacyCount} bobine{legacyCount > 1 ? 's' : ''} héritée{legacyCount > 1 ? 's' : ''}</strong><span>Référence filament à compléter, sans donnée produit inventée.</span></div>
            ) : null}

            <section className="stock-section stock-main-section">
              <div className="section-title-row">
                <div><p className="eyebrow">Stock</p><h2>Mes bobines</h2><span>{loading ? 'Chargement…' : `${snapshot.spools.length} bobine${snapshot.spools.length > 1 ? 's' : ''}`}</span></div>
                <button className="secondary-button stock-add-secondary" type="button" onClick={openCreation}>＋ Ajouter</button>
              </div>
              {!loading && snapshot.spools.length === 0 ? <div className="empty-state"><strong>Aucune bobine enregistrée</strong><span>Utilise « Ajouter une bobine » pour créer ton premier exemplaire.</span></div> : null}
              <div className="stock-grid">
                {snapshot.spools.slice().sort((a, b) => a.id.localeCompare(b.id)).map((spool) => {
                  const reference = spool.filamentReferenceId ? snapshot.filamentReferences.find((item) => item.id === spool.filamentReferenceId) ?? null : null;
                  const location = spool.locationId ? snapshot.locations.find((item) => item.id === spool.locationId) ?? null : null;
                  let remaining: number | null = null;
                  try { remaining = calculateFilamentRemainingGrams(spool, reference); } catch { remaining = null; }
                  const percent = remaining !== null && reference ? (remaining / reference.nominalWeightGrams) * 100 : null;
                  return <article className="stock-card" key={spool.id}><div className="stock-card-top"><span className="stock-swatch" style={{ background: reference?.colorHex ?? '#475569' }} /><div className="stock-card-title"><strong>{reference ? referenceLabel(reference) : 'Référence filament à compléter'}</strong><span>{reference ? `${reference.material} · ${reference.diameterMm} mm` : 'Donnée héritée préservée sans produit inventé'}</span></div><span className={`quality-badge ${spool.stockBasis}`}>{qualityLabel(spool.stockBasis)}</span></div><div className="stock-amount"><strong>{remaining === null ? '—' : formatGrams(remaining)}</strong><span>disponible</span></div>{percent !== null ? <div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }} /></div> : null}<dl className="stock-meta"><div><dt>ID</dt><dd>{spool.id}</dd></div><div><dt>Emplacement</dt><dd>{location?.name ?? '—'}</dd></div><div><dt>Fournisseur</dt><dd>{spool.supplier ?? '—'}</dd></div><div><dt>Prix</dt><dd>{formatMoney(spool.purchasePriceEuros)}</dd></div></dl><div className="stock-card-actions">{reference ? <button type="button" onClick={() => openReferenceEditor(reference)}>Modifier la référence</button> : null}<button type="button" className="accent-action" onClick={() => openReassign(spool)}>{reference ? 'Changer le filament' : 'Compléter la référence'}</button></div></article>;
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="topbar settings-topbar">
              <div><p className="eyebrow">Préférences Filora</p><h1>Réglages</h1></div>
            </header>
            <section className="settings-panel">
              <div className="settings-panel-head"><span className="settings-icon">↗</span><div><p className="eyebrow">Données & sauvegardes</p><h2>Sauvegarde et restauration</h2><p>Protège le stock local ou restaure une sauvegarde complète. Les sauvegardes du Batch 5 restent acceptées.</p></div></div>
              <div className="safety-section settings-safety-section">
                <div className="safety-copy"><h3>Données locales</h3><p>La sauvegarde contient les références filament, les emplacements, les bobines et toutes leurs relations.</p></div>
                <div className="safety-actions"><button className="primary-button" type="button" onClick={handleBackupDownload} disabled={backupBusy}>Télécharger la sauvegarde</button><label className="file-button">Choisir une sauvegarde<input type="file" accept="application/json,.json" onChange={handleBackupFile} disabled={backupBusy} /></label>{pendingBackup ? <button className="danger-button" type="button" onClick={handleRestore} disabled={backupBusy}>Restaurer et remplacer le stock</button> : null}</div>
                {backupStatus ? <div className="backup-status" role="status">{backupStatus}</div> : null}
              </div>
            </section>
          </>
        )}
      </main>

      {creationOpen ? (
        <div className="creation-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreation(); }}>
          <section className="creation-modal" role="dialog" aria-modal="true" aria-labelledby="creation-title">
            <header className="creation-modal-head">
              <div><p className="eyebrow">Nouvelle bobine</p><h2 id="creation-title">Créer une ou plusieurs bobines</h2><span>Tes catégories ouvertes ou repliées restent mémorisées pour la prochaine ouverture.</span></div>
              <button className="icon-button creation-close" type="button" onClick={closeCreation} aria-label="Fermer">×</button>
            </header>

            <div className="creation-modal-body">
              <form id="spool-create-form" className="creation-form" onSubmit={handleCreate}>
                <div className="creation-layout creation-dialog-layout">
                  <div className="creation-sections">
                    <CreationSection step="1" eyebrow="Identification" title="Filament" open={creationSections.filament} onToggle={() => toggleCreationSection('filament')}>
                      {shortcuts.length ? (
                        <div className="filament-shortcuts">
                          <span className="shortcut-label">⚡ Raccourcis selon ton stock</span>
                          <div className="shortcut-list">
                            {shortcuts.map((shortcut) => (
                              <button type="button" key={`${shortcut.brand}-${shortcut.material}-${shortcut.diameterMm}-${shortcut.manufacturerType}`} onClick={() => applyShortcut(shortcut)}>
                                <strong>{shortcut.brand} · {shortcut.manufacturerType}</strong>
                                <small>{shortcut.material} · {shortcut.diameterMm} mm · {shortcut.count} bobines</small>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="segmented" role="group" aria-label="Mode de référence filament">
                        <button type="button" className={referenceMode === 'new' ? 'selected' : ''} onClick={() => setReferenceMode('new')}>Nouvelle référence</button>
                        <button type="button" className={referenceMode === 'existing' ? 'selected' : ''} onClick={() => setReferenceMode('existing')}>Référence existante</button>
                      </div>
                      {referenceMode === 'new' ? (
                        <ReferenceFields draft={referenceDraft} onChange={setReferenceDraft} idPrefix="create" existingReferences={snapshot.filamentReferences} />
                      ) : (
                        <div className="existing-reference-panel">
                          <label className="field"><span>Référence filament <b>obligatoire</b></span><select value={selectedReferenceId} onChange={(event) => setSelectedReferenceId(event.target.value)}><option value="">Sélectionner une référence…</option>{snapshot.filamentReferences.map((reference) => <option key={reference.id} value={reference.id}>{referenceLabel(reference)} · {reference.material}</option>)}</select></label>
                          {selectedReference ? <div className="reference-preview"><span className="large-swatch" style={{ background: selectedReference.colorHex ?? '#334155' }} /><div><strong>{referenceLabel(selectedReference)}</strong><span>{selectedReference.material} · {selectedReference.diameterMm} mm · {formatGrams(selectedReference.nominalWeightGrams)}</span></div></div> : <p className="helper-text">Les données communes seront reprises sans créer de copie indépendante.</p>}
                        </div>
                      )}
                    </CreationSection>

                    <CreationSection step="2" eyebrow="Achat & rangement" title="Informations de cette bobine" open={creationSections.purchase} onToggle={() => toggleCreationSection('purchase')}>
                      <div className="field-grid">
                        <label className="field"><span>Date d’achat</span><input type="date" value={spoolDraft.purchaseDate} onChange={(e) => patchSpool('purchaseDate', e.target.value)} /></label>
                        <label className="field"><span>Date d’ouverture</span><input type="date" value={spoolDraft.openDate} onChange={(e) => patchSpool('openDate', e.target.value)} /></label>
                      </div>
                      <div className="field-grid">
                        <label className="field"><span>Fournisseur / boutique</span><CatalogSelect value={spoolDraft.supplier} options={supplierOptions} placeholder="Sélectionner un fournisseur…" onChange={(supplier) => patchSpool('supplier', supplier)} customPlaceholder="Ajouter un fournisseur…" /></label>
                        <label className="field"><span>Prix d’achat <b>€</b></span><input value={spoolDraft.purchasePriceEuros} onChange={(e) => patchSpool('purchasePriceEuros', e.target.value)} inputMode="decimal" placeholder="24,90" /></label>
                      </div>
                      <div className="field-grid">
                        <label className="field"><span>Emplacement de stockage</span><CatalogSelect value={selectedLocationName} options={locationOptions} placeholder="Sans emplacement" onChange={chooseLocation} customPlaceholder="Ajouter un emplacement…" /></label>
                        <div className="field clear-location-field"><span>Emplacement facultatif</span><button type="button" className="secondary-button" onClick={() => chooseLocation('')}>Laisser sans emplacement</button></div>
                      </div>
                      <div className="field-grid">
                        <label className="field"><span>Dernier séchage</span><input type="date" value={spoolDraft.lastDriedDate} onChange={(e) => patchSpool('lastDriedDate', e.target.value)} /></label>
                        <label className="field"><span>Lien de rachat exact</span><input type="url" value={spoolDraft.purchaseUrl} onChange={(e) => patchSpool('purchaseUrl', e.target.value)} placeholder="https://…" /></label>
                      </div>
                    </CreationSection>

                    <CreationSection step="3" eyebrow="Poids & support" title="Source du stock" open={creationSections.stock} onToggle={() => toggleCreationSection('stock')}>
                      <div className="segmented stock-basis-toggle">
                        <button type="button" className={spoolDraft.stockBasis === 'nominal' ? 'selected' : ''} onClick={() => patchSpool('stockBasis', 'nominal')}><strong>Nominal</strong><small>non pesée</small></button>
                        <button type="button" className={spoolDraft.stockBasis === 'measured' ? 'selected' : ''} onClick={() => patchSpool('stockBasis', 'measured')}><strong>Mesuré</strong><small>pesée réelle</small></button>
                      </div>
                      <div className="field-grid">
                        <label className="field"><span>Type de support <b>obligatoire</b></span><select value={spoolDraft.supportKind} onChange={(e) => patchSpool('supportKind', e.target.value as FormSupportKind)}><option value="original">Bobine d’origine</option><option value="reusable">Support réutilisable / refill</option></select></label>
                        <label className="field"><span>Bobine vide / tare de référence</span><CatalogSelect value={spoolDraft.tarePresetLabel} options={tarePresetOptions} placeholder="Sélectionner une bobine vide…" onChange={chooseTarePreset} allowCustom={false} /></label>
                      </div>
                      {spoolDraft.tarePresetLabel !== MANUAL_TARE_LABEL ? (() => {
                        const preset = tarePresets.find((item) => emptySpoolPresetLabel(item) === spoolDraft.tarePresetLabel);
                        return preset ? <div className="tare-source-note"><strong>{preset.tareGrams === null ? 'Tare à mesurer' : `${preset.tareGrams} g`}</strong><span>{preset.source}</span></div> : null;
                      })() : null}
                      <div className="field-grid">
                        <label className="field"><span>Tare bobine vide <b>g · obligatoire</b></span><input value={spoolDraft.tareWeightGrams} onChange={(e) => patchSpool('tareWeightGrams', e.target.value)} inputMode="decimal" placeholder="210,1" /></label>
                        {spoolDraft.stockBasis === 'measured' ? <label className="field measured-field"><span>Poids brut réellement mesuré <b>g · obligatoire</b></span><input value={spoolDraft.grossMeasuredWeightGrams} onChange={(e) => patchSpool('grossMeasuredWeightGrams', e.target.value)} inputMode="decimal" placeholder="842,6" /></label> : <div className="nominal-note"><strong>Aucune fausse pesée.</strong><span>Le stock initial utilisera le poids nominal de la référence et restera marqué « non vérifié ».</span></div>}
                      </div>
                    </CreationSection>

                    <CreationSection step="4" eyebrow="Création en série" title="Exemplaires physiques" open={creationSections.series} onToggle={() => toggleCreationSection('series')}>
                      <div className="field-grid">
                        <label className="field"><span>Nombre de bobines <b>1 à 20</b></span><div className="quantity-stepper"><button type="button" onClick={() => patchSpool('quantity', String(Math.max(1, Number(spoolDraft.quantity || 1) - 1)))}>−</button><input type="number" min="1" max="20" value={spoolDraft.quantity} onChange={(e) => patchSpool('quantity', e.target.value)} /><button type="button" onClick={() => patchSpool('quantity', String(Math.min(20, Number(spoolDraft.quantity || 1) + 1)))}>＋</button></div></label>
                        <label className="field"><span>Premier ID personnalisé</span><input value={spoolDraft.requestedFirstId} onChange={(e) => patchSpool('requestedFirstId', e.target.value)} placeholder="Optionnel · sinon SP-####" /></label>
                      </div>
                      <div className="id-preview"><span>IDs prévus</span><strong>{previewIds.length ? previewIds.join(' · ') : '—'}</strong></div>
                      <label className="field notes-field"><span>Notes</span><textarea rows={4} value={spoolDraft.notes} onChange={(e) => patchSpool('notes', e.target.value)} placeholder="Informations propres à cette bobine ou à ce lot…" /></label>
                    </CreationSection>
                  </div>

                  <aside className="summary-card creation-summary" aria-label="Résumé avant enregistrement">
                    <div className="summary-head"><span>Résumé</span><span className={`quality-badge ${spoolDraft.stockBasis}`}>{qualityLabel(spoolDraft.stockBasis)}</span></div>
                    <div className="spool-visual"><div className="spool-ring"><span style={{ background: /^#[0-9a-f]{6}$/i.test(summaryColor ?? '') ? summaryColor ?? '#334155' : '#334155' }} /></div><div><h3>{summaryTitle}</h3><p>{referenceMode === 'existing' ? selectedReference?.material ?? '—' : referenceDraft.material || '—'} · {referenceMode === 'existing' ? selectedReference?.diameterMm ?? '—' : referenceDraft.diameterMm || '—'} mm</p></div></div>
                    <div className="summary-metric"><span>Filament disponible</span><strong>{summaryRemaining === null ? '—' : formatGrams(summaryRemaining)}</strong>{summaryPercent !== null ? <small>{summaryPercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du nominal</small> : null}</div>
                    <div className="summary-grid"><div><span>Poids nominal</span><strong>{summaryNominal === null ? '—' : formatGrams(summaryNominal)}</strong></div><div><span>Tare</span><strong>{summaryTare === null ? '—' : formatGrams(summaryTare)}</strong></div><div><span>Support</span><strong>{supportLabel(spoolDraft.supportKind)}</strong></div><div><span>Origine tare</span><strong>{tareSourceLabel(spoolDraft.tareSource)}</strong></div></div>
                    <div className="summary-rule"><span className={spoolDraft.stockBasis === 'measured' ? 'dot green' : 'dot amber'} />{spoolDraft.stockBasis === 'measured' ? 'Poids brut conservé comme mesure physique.' : 'Aucune mesure physique ne sera inventée.'}</div>
                    <div className="summary-series"><span>Lot</span><strong>{previewIds.length || 0} exemplaire{previewIds.length > 1 ? 's' : ''}</strong><small>{previewIds.slice(0, 3).join(' · ')}{previewIds.length > 3 ? ` · +${previewIds.length - 3}` : ''}</small></div>
                  </aside>
                </div>
              </form>
            </div>

            <footer className="creation-modal-footer">
              <div className="creation-footer-status">{status && statusKind === 'error' ? <span className="form-status error" role="status">{status}</span> : <span>Le lot est validé avant la première écriture.</span>}</div>
              <div className="creation-footer-actions"><button className="secondary-button" type="button" onClick={closeCreation} disabled={saving}>Annuler</button><button className="primary-button" type="submit" form="spool-create-form" disabled={saving}>{saving ? 'Enregistrement…' : `Enregistrer ${spoolDraft.quantity || '1'} bobine${Number(spoolDraft.quantity) > 1 ? 's' : ''}`}</button></div>
            </footer>
          </section>
        </div>
      ) : null}

      {editReference ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditReference(null); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-reference-title"><div className="modal-head"><div><p className="eyebrow">Correction partagée</p><h2 id="edit-reference-title">Modifier la référence filament</h2></div><button className="icon-button" type="button" onClick={() => setEditReference(null)}>×</button></div><div className="shared-warning"><strong>Impact partagé</strong><span>Cette référence est liée à {inspectSharedReference(snapshot, editReference.referenceId).affectedSpoolCount} bobine{inspectSharedReference(snapshot, editReference.referenceId).affectedSpoolCount > 1 ? 's' : ''}. La correction sera visible sur toutes.</span></div><form onSubmit={handleReferenceUpdate}><ReferenceFields draft={editReference.draft} onChange={(draft) => setEditReference({ ...editReference, draft })} idPrefix="edit" existingReferences={snapshot.filamentReferences} />{modalStatus ? <div className="form-status error">{modalStatus}</div> : null}<div className="modal-actions"><button type="button" onClick={() => setEditReference(null)}>Annuler</button><button className="primary-button" type="submit">Enregistrer la correction</button></div></form></div></div> : null}

      {reassignDialog ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReassignDialog(null); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reassign-title"><div className="modal-head"><div><p className="eyebrow">Bobine {reassignDialog.spoolId}</p><h2 id="reassign-title">Changer le filament de cette bobine</h2></div><button className="icon-button" type="button" onClick={() => setReassignDialog(null)}>×</button></div><p className="modal-intro">Seule cette bobine sera réaffectée. Les autres exemplaires liés à l’ancienne référence ne seront pas modifiés.</p><form onSubmit={handleReassign}><div className="segmented"><button type="button" className={reassignDialog.mode === 'existing' ? 'selected' : ''} onClick={() => setReassignDialog({ ...reassignDialog, mode: 'existing' })}>Référence existante</button><button type="button" className={reassignDialog.mode === 'new' ? 'selected' : ''} onClick={() => setReassignDialog({ ...reassignDialog, mode: 'new' })}>Nouvelle référence</button></div>{reassignDialog.mode === 'existing' ? <label className="field modal-single-field"><span>Nouvelle référence</span><select value={reassignDialog.existingReferenceId} onChange={(e) => setReassignDialog({ ...reassignDialog, existingReferenceId: e.target.value })}><option value="">Sélectionner…</option>{snapshot.filamentReferences.filter((reference) => reference.id !== snapshot.spools.find((spool) => spool.id === reassignDialog.spoolId)?.filamentReferenceId).map((reference) => <option value={reference.id} key={reference.id}>{referenceLabel(reference)} · {reference.material}</option>)}</select></label> : <ReferenceFields draft={reassignDialog.draft} onChange={(draft) => setReassignDialog({ ...reassignDialog, draft })} idPrefix="reassign" existingReferences={snapshot.filamentReferences} />}{modalStatus ? <div className="form-status error">{modalStatus}</div> : null}<div className="modal-actions"><button type="button" onClick={() => setReassignDialog(null)}>Annuler</button><button className="primary-button" type="submit">Changer cette bobine uniquement</button></div></form></div></div> : null}
    </div>
  );
}
