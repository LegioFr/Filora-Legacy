import {
  canonicalManufacturerType,
  getManufacturerColorHex,
  getManufacturerTypeGroup,
  getManufacturerTypeLabel,
  type CatalogReferenceLike,
} from './filamentCatalog.js';

export interface ManufacturerTypePresentation {
  options: string[];
  labels: Readonly<Record<string, string>>;
  groups: Readonly<Record<string, string>>;
}

function recordFrom(entries: readonly [string, string][]): Record<string, string> {
  return Object.fromEntries(entries);
}

export function getManufacturerTypePresentation(
  brand: string,
  rawOptions: readonly string[],
): ManufacturerTypePresentation {
  const options = rawOptions.map((option) => canonicalManufacturerType(brand, option));
  return {
    options,
    labels: recordFrom(options.map((option) => [option, getManufacturerTypeLabel(brand, option)])),
    groups: recordFrom(options
      .map((option) => [option, getManufacturerTypeGroup(brand, option)] as [string, string])
      .filter(([, group]) => Boolean(group))),
  };
}

export function displayManufacturerType(brand: string, manufacturerType: string | null): string {
  if (!manufacturerType) return '';
  return getManufacturerTypeLabel(brand, manufacturerType);
}

export function getVerifiedManufacturerColorHex(
  brand: string,
  manufacturerType: string,
  colorName: string,
  references: readonly CatalogReferenceLike[],
  material = '',
): string | null {
  return getManufacturerColorHex(brand, manufacturerType, colorName, references, material);
}
