import type { ChangeEvent } from 'react';
import {
  validateFilamentReference,
  type FilamentReference,
  type PrintSettings,
  type TemperatureRangeC,
} from '../domains/spools/model';
import { CatalogSelect } from './CatalogSelect';
import {
  COLOR_PRESETS,
  MATERIAL_PRINT_DEFAULTS,
  getBrandOptions,
  getDiameterOptions,
  getManufacturerColors,
  getManufacturerTypes,
  getMaterialOptions,
  getTemperatureDefaults,
  isVerifiedCatalogBrand,
  type CatalogReferenceLike,
} from './filamentCatalog';
import {
  getManufacturerTypePresentation,
  getVerifiedManufacturerColorHex,
} from './catalogPresentation';

const NOMINAL_WEIGHT_OPTIONS = ['250', '500', '750', '1000', '2000', '3000', '5000'] as const;

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
    colorHex: '#38BDF8',
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
    colorHex: reference.colorHex ?? '#38BDF8',
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
  existingReferences?: readonly CatalogReferenceLike[];
  spoolNozzleTemperatureC?: string;
  spoolBedTemperatureC?: string;
  onSpoolNozzleTemperatureChange?: (value: string) => void;
  onSpoolBedTemperatureChange?: (value: string) => void;
}

function applyMaterialDefaults(draft: ReferenceDraft, material: string): ReferenceDraft {
  const temps = getTemperatureDefaults(draft.brand, draft.manufacturerType, material);
  const print = MATERIAL_PRINT_DEFAULTS[material] ?? {};
  return {
    ...draft,
    material,
    nozzleMin: temps ? String(temps.nozzle[0]) : '',
    nozzleMax: temps ? String(temps.nozzle[1]) : '',
    bedMin: temps ? String(temps.bed[0]) : '',
    bedMax: temps ? String(temps.bed[1]) : '',
    chamberTemperatureC: '',
    firstLayerTemperatureC: '',
    printSpeedMmPerSecond: print.printSpeedMmPerSecond ?? '',
    flowPercent: print.flowPercent ?? '',
    flowRatio: print.flowRatio ?? '',
    pressureAdvance: '',
    maxVolumetricSpeedMm3PerSecond: '',
    fanPercent: print.fanPercent ?? '',
    retractionMm: print.retractionMm ?? '',
    retractionSpeedMmPerSecond: print.retractionSpeedMmPerSecond ?? '',
  };
}

function sameText(left: string, right: string): boolean {
  return left.trim().localeCompare(right.trim(), 'fr', { sensitivity: 'base' }) === 0;
}

export function ReferenceFields({
  draft,
  onChange,
  idPrefix: _idPrefix,
  existingReferences = [],
  spoolNozzleTemperatureC = '',
  spoolBedTemperatureC = '',
  onSpoolNozzleTemperatureChange,
  onSpoolBedTemperatureChange,
}: ReferenceFieldsProps) {
  const set = (key: keyof ReferenceDraft) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => onChange({ ...draft, [key]: event.target.value });

  const brandOptions = getBrandOptions(existingReferences);
  const materialOptions = getMaterialOptions(existingReferences, draft.brand);
  const diameterOptions = getDiameterOptions(existingReferences);
  const nominalWeightOptions = Array.from(new Set([
    ...NOMINAL_WEIGHT_OPTIONS,
    ...existingReferences.map((reference) => String(reference.nominalWeightGrams)),
  ]));
  const rawTypeOptions = draft.brand && draft.material
    ? getManufacturerTypes(draft.brand, existingReferences, draft.material)
    : [];
  const typePresentation = getManufacturerTypePresentation(draft.brand, rawTypeOptions);
  const colorOptions = draft.brand && draft.material && draft.manufacturerType
    ? getManufacturerColors(draft.brand, draft.manufacturerType, existingReferences, draft.material)
    : [];
  const colorValue = /^#[0-9a-f]{6}$/i.test(draft.colorHex) ? draft.colorHex : '#38BDF8';

  function chooseBrand(brand: string) {
    const supportedMaterials = getMaterialOptions(existingReferences, brand);
    const material = isVerifiedCatalogBrand(brand)
      && !supportedMaterials.some((candidate) => sameText(candidate, draft.material))
      ? supportedMaterials[0] ?? draft.material
      : draft.material;
    onChange(applyMaterialDefaults({
      ...draft,
      brand,
      manufacturerType: '',
      manufacturerColor: '',
      colorHex: '',
    }, material));
  }

  function chooseMaterial(material: string) {
    onChange(applyMaterialDefaults({
      ...draft,
      manufacturerType: '',
      manufacturerColor: '',
      colorHex: '',
    }, material));
  }

  function chooseType(manufacturerType: string) {
    const next = applyMaterialDefaults({
      ...draft,
      manufacturerType,
      manufacturerColor: '',
      colorHex: '',
    }, draft.material);
    onChange(next);
  }

  function chooseColor(manufacturerColor: string) {
    const catalogHex = getVerifiedManufacturerColorHex(
      draft.brand,
      draft.manufacturerType,
      manufacturerColor,
      existingReferences,
      draft.material,
    );
    onChange({
      ...draft,
      manufacturerColor,
      colorHex: catalogHex ?? '',
    });
  }

  return (
    <div className="reference-fields">
      <div className="field-grid field-grid-3">
        <label className="field">
          <span>Marque <b>obligatoire</b></span>
          <CatalogSelect value={draft.brand} options={brandOptions} placeholder="Sélectionner une marque…" onChange={chooseBrand} customPlaceholder="Ajouter une marque…" ariaLabel="Marque" />
        </label>
        <label className="field">
          <span>Matière <b>obligatoire</b></span>
          <CatalogSelect value={draft.material} options={materialOptions} placeholder="Sélectionner une matière…" onChange={chooseMaterial} customPlaceholder="Ajouter une matière…" ariaLabel="Matière" />
        </label>
        <label className="field">
          <span>Diamètre <b>mm</b></span>
          <CatalogSelect value={draft.diameterMm} options={diameterOptions} placeholder="Sélectionner…" onChange={(diameterMm) => onChange({ ...draft, diameterMm })} customPlaceholder="Autre diamètre…" ariaLabel="Diamètre" />
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Gamme / type fabricant</span>
          <CatalogSelect
            value={draft.manufacturerType}
            options={typePresentation.options}
            optionLabels={typePresentation.labels}
            optionGroups={typePresentation.groups}
            placeholder={draft.brand && draft.material ? 'Sélectionner une gamme…' : 'Sélectionner d’abord une marque et une matière…'}
            onChange={chooseType}
            customPlaceholder="Ajouter une gamme / un type…"
            disabled={!draft.brand || !draft.material}
            ariaLabel="Gamme ou type de filament fabricant"
          />
        </label>
        <label className="field">
          <span>Couleur fabricant</span>
          <CatalogSelect value={draft.manufacturerColor} options={colorOptions} placeholder={draft.brand && draft.material && draft.manufacturerType ? 'Sélectionner une couleur…' : 'Sélectionner d’abord une gamme…'} onChange={chooseColor} customPlaceholder="Ajouter une couleur…" disabled={!draft.brand || !draft.material || !draft.manufacturerType} ariaLabel="Couleur fabricant" />
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
          <CatalogSelect value={draft.nominalWeightGrams} options={nominalWeightOptions} placeholder="Sélectionner un poids…" onChange={(nominalWeightGrams) => onChange({ ...draft, nominalWeightGrams })} customPlaceholder="Autre poids en grammes…" ariaLabel="Poids nominal" />
        </label>
      </div>

      <div className="color-preset-grid" aria-label="Palette de couleurs rapides">
        {COLOR_PRESETS.map((hex) => (
          <button key={hex} className={hex.toUpperCase() === draft.colorHex.toUpperCase() ? 'selected' : ''} type="button" aria-label={`Utiliser la couleur ${hex}`} title={hex} style={{ background: hex }} onClick={() => onChange({ ...draft, colorHex: hex })} />
        ))}
      </div>

      <details className="advanced-panel print-settings-panel">
        <summary><span>Réglages d’impression</span><small>Températures et paramètres avancés</small></summary>
        <div className="advanced-content print-settings-content">
          <div className="field-grid print-temperature-grid">
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
          <div className="field-grid field-grid-3 advanced-print-grid">
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
            {onSpoolNozzleTemperatureChange ? <label className="field"><span>Buse pour cette bobine <b>°C</b></span><input value={spoolNozzleTemperatureC} onChange={(event) => onSpoolNozzleTemperatureChange(event.target.value)} inputMode="decimal" placeholder="ex. 205" /></label> : null}
            {onSpoolBedTemperatureChange ? <label className="field"><span>Plateau pour cette bobine <b>°C</b></span><input value={spoolBedTemperatureC} onChange={(event) => onSpoolBedTemperatureChange(event.target.value)} inputMode="decimal" placeholder="ex. 55" /></label> : null}
          </div>
        </div>
      </details>
    </div>
  );
}