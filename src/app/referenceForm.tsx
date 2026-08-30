import type { ChangeEvent } from 'react';
import {
  validateFilamentReference,
  type FilamentReference,
  type PrintSettings,
  type TemperatureRangeC,
} from '../domains/spools/model';

export interface ReferenceDraft {
  brand: string;
  material: string;
  diameterMm: string;
  manufacturerType: string;
  manufacturerColor: string;
  colorHex: string;
  nominalWeightGrams: string;
  nozzleMin: string;
  nozzleMax: string;
  bedMin: string;
  bedMax: string;
  chamberTemperatureC: string;
  firstLayerTemperatureC: string;
  printSpeedMmPerSecond: string;
  flowPercent: string;
  flowRatio: string;
  pressureAdvance: string;
  maxVolumetricSpeedMm3PerSecond: string;
  fanPercent: string;
  retractionMm: string;
  retractionSpeedMmPerSecond: string;
}

export function emptyReferenceDraft(): ReferenceDraft {
  return {
    brand: '',
    material: 'PLA',
    diameterMm: '1.75',
    manufacturerType: '',
    manufacturerColor: '',
    colorHex: '#38bdf8',
    nominalWeightGrams: '1000',
    nozzleMin: '',
    nozzleMax: '',
    bedMin: '',
    bedMax: '',
    chamberTemperatureC: '',
    firstLayerTemperatureC: '',
    printSpeedMmPerSecond: '',
    flowPercent: '',
    flowRatio: '',
    pressureAdvance: '',
    maxVolumetricSpeedMm3PerSecond: '',
    fanPercent: '',
    retractionMm: '',
    retractionSpeedMmPerSecond: '',
  };
}

function textNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

export function referenceToDraft(reference: FilamentReference): ReferenceDraft {
  return {
    brand: reference.brand,
    material: reference.material,
    diameterMm: String(reference.diameterMm),
    manufacturerType: reference.manufacturerType ?? '',
    manufacturerColor: reference.manufacturerColor ?? '',
    colorHex: reference.colorHex ?? '#38bdf8',
    nominalWeightGrams: String(reference.nominalWeightGrams),
    nozzleMin: reference.nozzleTemperatureC ? String(reference.nozzleTemperatureC.min) : '',
    nozzleMax: reference.nozzleTemperatureC ? String(reference.nozzleTemperatureC.max) : '',
    bedMin: reference.bedTemperatureC ? String(reference.bedTemperatureC.min) : '',
    bedMax: reference.bedTemperatureC ? String(reference.bedTemperatureC.max) : '',
    chamberTemperatureC: textNumber(reference.printSettings.chamberTemperatureC),
    firstLayerTemperatureC: textNumber(reference.printSettings.firstLayerTemperatureC),
    printSpeedMmPerSecond: textNumber(reference.printSettings.printSpeedMmPerSecond),
    flowPercent: textNumber(reference.printSettings.flowPercent),
    flowRatio: textNumber(reference.printSettings.flowRatio),
    pressureAdvance: textNumber(reference.printSettings.pressureAdvance),
    maxVolumetricSpeedMm3PerSecond: textNumber(reference.printSettings.maxVolumetricSpeedMm3PerSecond),
    fanPercent: textNumber(reference.printSettings.fanPercent),
    retractionMm: textNumber(reference.printSettings.retractionMm),
    retractionSpeedMmPerSecond: textNumber(reference.printSettings.retractionSpeedMmPerSecond),
  };
}

function decimal(value: string, label: string): number {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);
  if (!normalized || !Number.isFinite(parsed)) {
    throw new Error(`${label} doit être un nombre valide.`);
  }
  return parsed;
}

function positiveDecimal(value: string, label: string): number {
  const parsed = decimal(value, label);
  if (parsed <= 0) throw new Error(`${label} doit être supérieur à zéro.`);
  return parsed;
}

function optionalDecimal(value: string, label: string): number | null {
  if (!value.trim()) return null;
  return decimal(value, label);
}

function optionalRange(min: string, max: string, label: string): TemperatureRangeC | null {
  if (!min.trim() && !max.trim()) return null;
  if (!min.trim() || !max.trim()) {
    throw new Error(`${label} : renseigne la valeur minimale et la valeur maximale.`);
  }
  return { min: decimal(min, `${label} minimale`), max: decimal(max, `${label} maximale`) };
}

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^#[0-9a-f]{6}$/i.test(trimmed)) {
    throw new Error('La couleur doit être au format hexadécimal #RRGGBB.');
  }
  return trimmed.toUpperCase();
}

export function buildReference(draft: ReferenceDraft, id: string): FilamentReference {
  const printSettings: PrintSettings = {
    chamberTemperatureC: optionalDecimal(draft.chamberTemperatureC, 'Température chambre'),
    firstLayerTemperatureC: optionalDecimal(draft.firstLayerTemperatureC, 'Température première couche'),
    printSpeedMmPerSecond: optionalDecimal(draft.printSpeedMmPerSecond, "Vitesse d'impression"),
    flowPercent: optionalDecimal(draft.flowPercent, 'Débit'),
    flowRatio: optionalDecimal(draft.flowRatio, 'Rapport de flux'),
    pressureAdvance: optionalDecimal(draft.pressureAdvance, 'Pressure Advance'),
    maxVolumetricSpeedMm3PerSecond: optionalDecimal(
      draft.maxVolumetricSpeedMm3PerSecond,
      'Vitesse volumétrique maximale',
    ),
    fanPercent: optionalDecimal(draft.fanPercent, 'Ventilation'),
    retractionMm: optionalDecimal(draft.retractionMm, 'Rétraction'),
    retractionSpeedMmPerSecond: optionalDecimal(
      draft.retractionSpeedMmPerSecond,
      'Vitesse de rétraction',
    ),
  };

  return validateFilamentReference({
    id,
    brand: draft.brand,
    material: draft.material,
    diameterMm: positiveDecimal(draft.diameterMm, 'Diamètre'),
    manufacturerType: draft.manufacturerType,
    manufacturerColor: draft.manufacturerColor,
    colorHex: normalizeHex(draft.colorHex),
    nominalWeightGrams: positiveDecimal(draft.nominalWeightGrams, 'Poids nominal'),
    nozzleTemperatureC: optionalRange(draft.nozzleMin, draft.nozzleMax, 'Température buse'),
    bedTemperatureC: optionalRange(draft.bedMin, draft.bedMax, 'Température plateau'),
    printSettings,
  });
}

interface ReferenceFieldsProps {
  draft: ReferenceDraft;
  onChange: (next: ReferenceDraft) => void;
  idPrefix: string;
}

export function ReferenceFields({ draft, onChange, idPrefix }: ReferenceFieldsProps) {
  const set = (key: keyof ReferenceDraft) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => onChange({ ...draft, [key]: event.target.value });
  const colorValue = /^#[0-9a-f]{6}$/i.test(draft.colorHex) ? draft.colorHex : '#38bdf8';

  return (
    <div className="reference-fields">
      <div className="field-grid field-grid-3">
        <label className="field">
          <span>Marque <b>obligatoire</b></span>
          <input list={`${idPrefix}-brands`} value={draft.brand} onChange={set('brand')} placeholder="Bambu Lab, Polymaker…" />
          <datalist id={`${idPrefix}-brands`}>
            <option value="Bambu Lab" /><option value="Polymaker" /><option value="Rosa3D" />
            <option value="eSUN" /><option value="SUNLU" /><option value="Prusament" />
            <option value="Overture" /><option value="ERYONE" /><option value="Creality" />
          </datalist>
        </label>
        <label className="field">
          <span>Matière <b>obligatoire</b></span>
          <input list={`${idPrefix}-materials`} value={draft.material} onChange={set('material')} placeholder="PLA" />
          <datalist id={`${idPrefix}-materials`}>
            <option value="PLA" /><option value="PLA+" /><option value="PETG" /><option value="ABS" />
            <option value="ASA" /><option value="TPU" /><option value="PA / Nylon" /><option value="PC" />
          </datalist>
        </label>
        <label className="field">
          <span>Diamètre <b>mm</b></span>
          <input value={draft.diameterMm} onChange={set('diameterMm')} inputMode="decimal" placeholder="1,75" />
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Gamme / type fabricant</span>
          <input value={draft.manufacturerType} onChange={set('manufacturerType')} placeholder="Matte, Basic, Silk…" />
        </label>
        <label className="field">
          <span>Couleur fabricant</span>
          <input value={draft.manufacturerColor} onChange={set('manufacturerColor')} placeholder="Jade White, Galaxy Black…" />
        </label>
      </div>

      <div className="color-row">
        <label className="field color-picker-field">
          <span>Aperçu couleur</span>
          <div className="color-control">
            <input className="color-picker" type="color" value={colorValue} onChange={set('colorHex')} />
            <input className="color-code" value={draft.colorHex} onChange={set('colorHex')} placeholder="#38BDF8" />
          </div>
        </label>
        <label className="field">
          <span>Poids nominal <b>g</b></span>
          <input value={draft.nominalWeightGrams} onChange={set('nominalWeightGrams')} inputMode="decimal" placeholder="1000" />
        </label>
      </div>

      <div className="field-grid">
        <div className="range-field">
          <span className="field-label">Température buse <b>°C</b></span>
          <div className="range-inputs">
            <input value={draft.nozzleMin} onChange={set('nozzleMin')} inputMode="decimal" placeholder="min" aria-label="Température buse minimale" />
            <span>à</span>
            <input value={draft.nozzleMax} onChange={set('nozzleMax')} inputMode="decimal" placeholder="max" aria-label="Température buse maximale" />
          </div>
        </div>
        <div className="range-field">
          <span className="field-label">Température plateau <b>°C</b></span>
          <div className="range-inputs">
            <input value={draft.bedMin} onChange={set('bedMin')} inputMode="decimal" placeholder="min" aria-label="Température plateau minimale" />
            <span>à</span>
            <input value={draft.bedMax} onChange={set('bedMax')} inputMode="decimal" placeholder="max" aria-label="Température plateau maximale" />
          </div>
        </div>
      </div>

      <details className="advanced-panel">
        <summary>
          <span>Paramètres d’impression avancés</span>
          <small>Facultatifs</small>
        </summary>
        <div className="advanced-content field-grid field-grid-3">
          <label className="field"><span>Chambre <b>°C</b></span><input value={draft.chamberTemperatureC} onChange={set('chamberTemperatureC')} inputMode="decimal" /></label>
          <label className="field"><span>Première couche <b>°C</b></span><input value={draft.firstLayerTemperatureC} onChange={set('firstLayerTemperatureC')} inputMode="decimal" /></label>
          <label className="field"><span>Vitesse <b>mm/s</b></span><input value={draft.printSpeedMmPerSecond} onChange={set('printSpeedMmPerSecond')} inputMode="decimal" /></label>
          <label className="field"><span>Débit <b>%</b></span><input value={draft.flowPercent} onChange={set('flowPercent')} inputMode="decimal" /></label>
          <label className="field"><span>Rapport de flux</span><input value={draft.flowRatio} onChange={set('flowRatio')} inputMode="decimal" /></label>
          <label className="field"><span>Pressure Advance / K</span><input value={draft.pressureAdvance} onChange={set('pressureAdvance')} inputMode="decimal" /></label>
          <label className="field"><span>Vitesse volumétrique <b>mm³/s</b></span><input value={draft.maxVolumetricSpeedMm3PerSecond} onChange={set('maxVolumetricSpeedMm3PerSecond')} inputMode="decimal" /></label>
          <label className="field"><span>Ventilation <b>%</b></span><input value={draft.fanPercent} onChange={set('fanPercent')} inputMode="decimal" /></label>
          <label className="field"><span>Rétraction <b>mm</b></span><input value={draft.retractionMm} onChange={set('retractionMm')} inputMode="decimal" /></label>
          <label className="field"><span>Vitesse rétraction <b>mm/s</b></span><input value={draft.retractionSpeedMmPerSecond} onChange={set('retractionSpeedMmPerSecond')} inputMode="decimal" /></label>
        </div>
      </details>
    </div>
  );
}
