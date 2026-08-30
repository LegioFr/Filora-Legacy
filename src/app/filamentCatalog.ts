export interface CatalogReferenceLike {
  id: string;
  brand: string;
  material: string;
  diameterMm: number;
  manufacturerType: string | null;
  manufacturerColor: string | null;
  colorHex: string | null;
}

export interface CatalogSpoolLike {
  filamentReferenceId: string | null;
  supplier?: string | null;
}

export interface CatalogLocationLike {
  name: string;
}

export interface CatalogColor {
  name: string;
  hex: string | null;
}

interface CatalogType {
  material: string;
  colors: readonly CatalogColor[];
  nozzle?: readonly [number, number];
  bed?: readonly [number, number];
}

export interface ShortcutPreset {
  brand: string;
  material: string;
  diameterMm: number;
  manufacturerType: string;
  count: number;
}

export interface EmptySpoolPreset {
  brand: string;
  label: string;
  tareGrams: number | null;
  source: string;
}

const c = (name: string, hex: string | null = null): CatalogColor => ({ name, hex });

export const DEFAULT_BRANDS = [
  'Bambu Lab', 'Polymaker', 'eSUN', 'SUNLU', 'JAYO', 'Overture', 'ERYONE', 'Prusament',
  'Rosa3D', 'Creality', 'Anycubic', 'ELEGOO', 'FlashForge', 'QIDI Tech', '3DJake', 'Amolen',
  'AzureFilm', 'Extrudr', 'Fiberlogy', 'Fillamentum', 'FormFutura', 'GEEETECH', 'GST3D',
  'Hatchbox', 'Inland', 'Kingroon', 'MatterHackers', 'NinjaTek', 'OVV3D', 'Proto-pasta',
  'Recreus', 'SainSmart', 'Smart Materials 3D', 'Spectrum Filaments', 'Taulman3D',
  'Treed Filaments', 'Ziro', 'ArianePlast', 'Capifil', 'Francofil', 'Grossiste3D', 'Kimya',
  'Nanovia', 'Octofiber', 'BASF Forward AM', 'Ultimaker', 'colorFabb', 'American Filament',
  'Prusa Research', 'Raise3D', 'Snapmaker', 'Voxelab', 'Geeetech', 'Geeetech', 'Filamentum',
] as const;

export const DEFAULT_MATERIALS = [
  'PLA', 'PLA+', 'PETG', 'PCTG', 'ABS', 'ASA', 'TPU', 'TPE', 'TPC', 'PA / Nylon', 'PA6',
  'PA12', 'PC', 'PP', 'POM', 'PMMA', 'PVDF', 'PEEK', 'PEKK', 'PEI', 'PPS', 'PPSU', 'PVA',
  'BVOH', 'HIPS', 'PET', 'PET-CF', 'PA-CF', 'PA-GF', 'PC-CF', 'PLA-CF', 'PETG-CF',
] as const;

export const DEFAULT_DIAMETERS = ['1.75', '2.85', '3.00'] as const;

export const DEFAULT_SUPPLIERS = [
  'Bambu Lab', 'Prusa Research', '3DJake', 'Atome3D', 'Polyfab3D', 'Grossiste3D',
  'Filimprimante3D', 'Amazon', 'AliExpress', 'Cdiscount', 'eBay', 'MakerWorld Store',
] as const;

export const DEFAULT_LOCATIONS = [
  'Étagère 1', 'Étagère 2', 'Étagère 3', 'Étagère 4', 'Étagère 5',
  'Boîte 1', 'Boîte 2', 'Boîte 3', 'Boîte sèche', 'Armoire filament', 'Rack bobines',
  'AMS', 'AMS Lite', 'ACE Pro', 'Creality CFS', 'MMU',
] as const;

export const COLOR_PRESETS = [
  '#111827', '#374151', '#6B7280', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#FDE047',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#0284C7', '#2563EB',
  '#4F46E5', '#7C3AED', '#D946EF', '#EC4899', '#F43F5E', '#8B4513', '#C08457', '#D1D5DB',
] as const;

const PANCHROMA_BASIC = [
  c('Black', '#080A0D'), c('White', '#EBF7FF'), c('Cold White', '#D9DFE5'), c('Red', '#E72F1D'),
  c('Orange', '#F67405'), c('Magenta', '#F24574'), c('Pink', '#F1A1AF'), c('Wine Red', '#D60212'),
  c('Lemon Yellow', '#EED230'), c('Yellow', '#FFE800'), c('Cream', '#EED1A8'), c('Beige', '#C2AB72'),
  c('Tan', '#A79E82'), c('Brown', '#55331A'), c('Green', '#06924D'), c('Lime Green', '#D5D701'),
  c('Jungle Green', '#4E742D'), c('Olive Green', '#948902'), c('Dark Olive Khaki', '#575B54'),
  c('Azure Blue', '#0066D9'), c('Blue', '#003776'), c('Aqua Blue', '#5EBDDB'), c('Stone Blue', '#487BA2'),
  c('Polymaker Teal', '#4CC0C7'), c('Steel Grey', '#616469'), c('Grey', '#8C9099'),
  c('Dark Grey', '#485259'), c('Purple', '#6C47B2'),
] as const;

const POLYMAKER_MATTE = [
  c('Charcoal Black', '#2F2E30'), c('Cotton White', '#F4EFEB'), c('Army Beige'), c('Army Brown'),
  c('Earth Brown'), c('Muted White', '#BBADA4'), c('Pastel Peanut'), c('Wood Brown', '#AB7449'),
  c('Pastel Peach'), c('Sunrise Orange'), c('Pastel Banana'), c('Army Light Green'), c('Savannah Yellow'),
  c('Lime Green'), c('Army Dark Green'), c('Pastel Mint'), c('Muted Green', '#777E71'), c('Forest Green'),
  c('Arctic Teal'), c('Pastel Ice'), c('Sapphire Blue'), c('Army Blue'), c('Muted Blue'), c('Fossil Grey'),
  c('Lavender Purple'), c('Muted Purple', '#7C5C78'), c('Pastel Candy'), c('Sakura Pink'),
  c('Pastel Watermelon'), c('Lava Red'), c('Army Red'), c('Muted Red'), c('Army Purple'), c('Ash Grey'),
  c('Electric Indigo'), c('Pastel Periwinkle'), c('Lotus Pink'), c('Sky Blue'), c('Sunshine Yellow'),
  c('Grass Green'), c('Seafoam Green'), c('Raspberry Blue'), c('Wine Burgundy'), c('Emerald Green'),
  c('Muted Moss', '#92864F'), c('Muted Teal', '#5D989E'), c('Muted Mauve'), c('Muted Terracotta'),
  c('Pastel Coral'), c('Pastel Beige'),
] as const;

const POLYMAKER_SILK = [
  c('Black'), c('Purple'), c('Magenta'), c('Rose'), c('Red'), c('Rose Gold'), c('Quartz Pink'),
  c('Bronze'), c('Orange'), c('White'), c('Gold'), c('Yellow'), c('Lime'), c('Green'), c('Teal'),
  c('Light Blue'), c('Blue'), c('Chrome'), c('Silver'), c('Brass'), c('Peridot Green'),
  c('Periwinkle'), c('Dark Blue'), c('Gunmetal Grey'), c('Pink'),
] as const;

const BAMBU_PLA_BASIC = [
  c('Black', '#000000'), c('Jade White', '#FFFFFF'), c('Gray', '#8E9089'), c('Dark Gray', '#545454'),
  c('Light Gray', '#D1D3D5'), c('Cocoa Brown', '#6F5034'), c('Bambu Green', '#00AE42'),
  c('Mistletoe Green', '#3F6B4F'), c('Bright Green', '#63D13D'), c('Blue', '#0A2989'),
  c('Cyan', '#0086D6'), c('Turquoise', '#00B1B7'), c('Indigo Purple', '#482960'),
  c('Purple', '#6E3FA3'), c('Sunflower Yellow', '#FEC600'), c('Gold', '#E4BD68'), c('Red Brown', '#9D432C'),
] as const;

const BAMBU_GRADIENT = [
  c('Arctic Whisper', '#9CDBD9'), c('Solar Breeze', '#E94B3C'), c('Ocean to Meadow', '#307FE2'),
  c('Cotton Candy Cloud', '#E7C1D5'), c('Blueberry Bubblegum', '#6FCAEF'), c('Mint Lime', '#B6FF43'),
  c('Pink Citrus', '#F78F77'), c('Dusk Glare', '#ED9558'),
] as const;

const BAMBU_PETG_HF = [
  c('Yellow', '#FFD00B'), c('Orange', '#F75403'), c('Green', '#00AE42'), c('Red', '#EB3A3A'),
  c('Blue', '#002E96'), c('Black', '#000000'), c('White', '#FFFFFF'), c('Cream', '#F9DFB9'),
  c('Lime Green', '#6EE53C'), c('Forest Green', '#39541A'), c('Lake Blue', '#1F79E5'),
  c('Peanut Brown', '#875718'), c('Gray', '#ADB1B2'), c('Dark Gray', '#515151'),
] as const;

const BAMBU_PETG_TRANSLUCENT = [
  c('Translucent Gray', '#8E8E8E'), c('Translucent Light Blue', '#61B0FF'), c('Translucent Olive', '#748C45'),
  c('Translucent Brown', '#C9A381'), c('Translucent Teal', '#77EDD7'), c('Translucent Orange', '#FF911A'),
  c('Translucent Purple', '#D6ABFF'), c('Translucent Pink', '#F9C1BD'),
] as const;

const BAMBU_SILK = [
  c('Gold', '#F4A925'), c('Silver', '#C8C8C8'), c('Titan Gray', '#5F6367'), c('Blue', '#008BDA'),
  c('Purple', '#8671CB'), c('Candy Red', '#D02727'), c('Candy Green', '#018814'), c('Rose Gold', '#BA9594'),
  c('Baby Blue', '#A8C6EE'), c('Pink', '#F7ADA6'), c('Mint', '#96DCB9'), c('Champagne', '#F3CFB2'),
  c('White', '#FFFFFF'),
] as const;

const BAMBU_WOOD = [
  c('Black Walnut', '#4F3F24'), c('Rosewood', '#4C241C'), c('Clay Brown', '#995F11'),
  c('Classic Birch', '#918669'), c('White Oak', '#D6CCA3'), c('Ochre Yellow', '#C98935'),
] as const;

const BAMBU_METAL = [
  c('Iridium Gold Metallic', '#B39B84'), c('Copper Brown Metallic', '#AA6443'),
  c('Oxide Green Metallic', '#1D7C6A'), c('Cobalt Blue Metallic', '#39699E'), c('Iron Gray Metallic', '#43403D'),
] as const;

const ESUN_PLA_PLUS = [
  c('Milky White', '#C9C9C9'), c('Mint Green', '#69C296'), c('Mustard Green', '#E4E6A5'),
  c('Olive Green', '#1B1F11'), c('Orange', '#FF821B'), c('Peach Pink', '#EEB9B3'), c('Peak Green', '#38D844'),
  c('Pine Green', '#43634E'), c('Pink', '#FF7F6F'), c('Black', '#272729'), c('Red', '#B40200'),
  c('RGB Blue', '#1E4FCF'), c('RGB Green', '#9AEE74'), c('RGB Red', '#E6413F'), c('Silver', '#68676C'),
  c('Soft Blue', '#71D6E8'), c('Soft Pink', '#F89F93'), c('Space Blue', '#50D3FF'), c('Very Peri', '#22047E'),
  c('White', '#E3E4D4'), c('Yellow', '#FFFC01'), c('Almond Yellow', '#E9E199'), c('Apricot', '#E68A1D'),
  c('Aqua', '#6BBFE3'), c('Blue', '#01378D'), c('Bone White', '#C7B494'), c('Brick Red', '#9B5347'),
  c('Brown', '#664033'), c('Cold White', '#DBD6DC'), c('Beige', '#FDC094'), c('Coral Orange', '#FF8C49'),
  c('Dark Blue', '#262431'), c('Fire Engine Red', '#BB2028'), c('Gold', '#EDA10F'), c('Grass Green', '#2B6439'),
  c('Green', '#1B2D39'), c('Grey', '#606783'), c('Haze Blue', '#7AB9EF'), c('Holly Green', '#03594E'),
  c('Jade Green', '#53ECD0'), c('Light Beige', '#E5C0A3'), c('Light Blue', '#169BEA'), c('Light Brown', '#C99367'),
  c('Light Khaki', '#C6C0A8'), c('Lilac', '#C78DBF'), c('Magenta', '#E02552'), c('Matcha Green', '#989F4F'),
  c('Purple', '#793EB6'), c('Concrete Grey', '#B7B7B5'),
] as const;

const SIMPLE_COLORS = [
  c('Black', '#111827'), c('White', '#F8FAFC'), c('Grey', '#6B7280'), c('Red', '#EF4444'),
  c('Orange', '#F97316'), c('Yellow', '#FACC15'), c('Green', '#22C55E'), c('Blue', '#0EA5E9'),
  c('Purple', '#7C3AED'), c('Pink', '#EC4899'), c('Brown', '#8B5A2B'), c('Silver', '#C0C4CC'), c('Gold', '#D4A017'),
] as const;

export const MANUFACTURER_CATALOG: Readonly<Record<string, Readonly<Record<string, CatalogType>>>> = {
  Polymaker: {
    'Panchroma Basic PLA': { material: 'PLA', colors: PANCHROMA_BASIC, nozzle: [190, 230], bed: [20, 60] },
    'Panchroma CoPE': { material: 'PLA', colors: PANCHROMA_BASIC, nozzle: [190, 230], bed: [25, 60] },
    'Matte': { material: 'PLA', colors: POLYMAKER_MATTE, nozzle: [190, 230], bed: [25, 60] },
    'Panchroma Satin PLA': { material: 'PLA', colors: [
      c('Satin Black', '#302E30'), c('Satin White', '#F5F0EC'), c('Satin Grey', '#797E89'),
      c('Satin Orange', '#FE9217'), c('Satin Yellow', '#F4C131'), c('Satin Green', '#5EAB71'),
      c('Satin Polymaker Teal', '#61BBC1'), c('Satin Blue', '#0162A6'), c('Satin Purple', '#9272C1'), c('Satin Red', '#DA1521'),
    ], nozzle: [190, 230], bed: [25, 60] },
    'Silk': { material: 'PLA', colors: POLYMAKER_SILK, nozzle: [190, 230], bed: [25, 60] },
  },
  'Bambu Lab': {
    'PLA Basic': { material: 'PLA', colors: BAMBU_PLA_BASIC, nozzle: [190, 230], bed: [35, 45] },
    'PLA Basic Gradient': { material: 'PLA', colors: BAMBU_GRADIENT, nozzle: [190, 230], bed: [35, 45] },
    'PLA Silk+': { material: 'PLA', colors: BAMBU_SILK, nozzle: [190, 230], bed: [35, 45] },
    'PLA Wood': { material: 'PLA', colors: BAMBU_WOOD, nozzle: [190, 240], bed: [35, 45] },
    'PLA Metal': { material: 'PLA', colors: BAMBU_METAL, nozzle: [190, 230], bed: [35, 45] },
    'PETG HF': { material: 'PETG', colors: BAMBU_PETG_HF, nozzle: [230, 260], bed: [65, 80] },
    'PETG Translucent': { material: 'PETG', colors: BAMBU_PETG_TRANSLUCENT, nozzle: [230, 260], bed: [65, 75] },
  },
  Rosa3D: {
    Standard: { material: 'PLA', colors: [
      c('Peau rose', '#E8B7A9'), c('Porcelaine', '#F2D2C4'), c('Bronzer', '#C98E68'), c('Graphite brillant', '#4B5563'),
      c('Marron clair', '#A9745B'), c('Chocolat', '#6B3F2B'), c('Rouge carmin', '#B91C1C'), c('Rubis', '#9F1239'),
      c('Vert tendre', '#86B98B'), c('Bleu nuit', '#1E3A8A'), c('Bleu perle', '#8EC5E8'),
    ], nozzle: [190, 220], bed: [45, 60] },
    Silk: { material: 'PLA', colors: [c('Argent', '#C0C4CC'), c('Or Silk', '#D4A017')], nozzle: [190, 220], bed: [45, 60] },
  },
  eSUN: {
    'PLA+': { material: 'PLA+', colors: ESUN_PLA_PLUS, nozzle: [210, 230], bed: [45, 60] },
    'PLA / PLA+': { material: 'PLA', colors: ESUN_PLA_PLUS, nozzle: [190, 230], bed: [45, 60] },
  },
  SUNLU: { 'PLA / PLA+': { material: 'PLA', colors: SIMPLE_COLORS, nozzle: [190, 220], bed: [45, 60] } },
  Prusament: { PLA: { material: 'PLA', colors: [
    c('Galaxy Black', '#191919'), c('Prusa Orange', '#F05A28'), c('Gentleman’s Grey', '#5D5D5D'),
    c('Azure Blue', '#0076A8'), c('Lipstick Red', '#D7263D'), c('Pistachio Green', '#A4C639'),
    c('Vanilla White', '#F4F1DE'), c('Jet Black', '#101010'),
  ], nozzle: [200, 220], bed: [50, 60] } },
  Overture: { PLA: { material: 'PLA', colors: SIMPLE_COLORS, nozzle: [190, 220], bed: [45, 60] } },
  ERYONE: { PLA: { material: 'PLA', colors: SIMPLE_COLORS, nozzle: [190, 220], bed: [45, 60] } },
};

export const EMPTY_SPOOL_PRESETS: readonly EmptySpoolPreset[] = [
  { brand: 'colorFabb', label: 'Carton 750 g', tareGrams: 152, source: 'Valeur constructeur publiée pour la bobine carton 750 g.' },
  { brand: 'American Filament', label: 'Spool AMS compatible', tareGrams: 220, source: 'Valeur publiquement déclarée par American Filament.' },
  ...[
    'Bambu Lab', 'Prusament', 'Polymaker', 'eSUN', 'SUNLU', 'JAYO', 'Overture', 'Creality', 'Anycubic',
    'ELEGOO', 'ERYONE', 'FlashForge', 'QIDI Tech', '3DJake', 'Amolen', 'AzureFilm', 'Extrudr', 'Fiberlogy',
    'Fillamentum', 'FormFutura', 'GEEETECH', 'GST3D', 'Hatchbox', 'Inland', 'Kingroon', 'MatterHackers',
    'NinjaTek', 'OVV3D', 'Proto-pasta', 'Recreus', 'Rosa3D', 'SainSmart', 'Smart Materials 3D',
    'Spectrum Filaments', 'Taulman3D', 'Treed Filaments', 'Ziro', 'ArianePlast', 'Capifil', 'Francofil',
    'Grossiste3D', 'Kimya', 'Nanovia', 'Octofiber', 'BASF Forward AM', 'Ultimaker',
  ].map((brand) => ({ brand, label: 'Bobine / modèle variable', tareGrams: null, source: 'La tare varie selon le modèle ou la génération : mesurer une bobine vide identique.' })),
];

const MATERIAL_TEMPERATURES: Readonly<Record<string, { nozzle: readonly [number, number]; bed: readonly [number, number] }>> = {
  PLA: { nozzle: [190, 220], bed: [45, 60] }, 'PLA+': { nozzle: [200, 230], bed: [45, 60] },
  PETG: { nozzle: [230, 250], bed: [70, 85] }, PCTG: { nozzle: [240, 270], bed: [70, 90] },
  ABS: { nozzle: [240, 260], bed: [90, 110] }, ASA: { nozzle: [245, 270], bed: [90, 110] },
  TPU: { nozzle: [210, 235], bed: [30, 55] }, TPE: { nozzle: [210, 240], bed: [30, 55] },
  'PA / Nylon': { nozzle: [250, 290], bed: [70, 100] }, PC: { nozzle: [260, 300], bed: [90, 120] },
};

export const MATERIAL_PRINT_DEFAULTS: Readonly<Record<string, Partial<Record<'printSpeedMmPerSecond' | 'flowPercent' | 'flowRatio' | 'fanPercent' | 'retractionMm' | 'retractionSpeedMmPerSecond', string>>>> = {
  PLA: { printSpeedMmPerSecond: '50', flowPercent: '100', flowRatio: '1', fanPercent: '100', retractionMm: '0.8', retractionSpeedMmPerSecond: '30' },
  'PLA+': { printSpeedMmPerSecond: '50', flowPercent: '100', flowRatio: '1', fanPercent: '100', retractionMm: '0.8', retractionSpeedMmPerSecond: '30' },
  PETG: { printSpeedMmPerSecond: '45', flowPercent: '100', flowRatio: '1', fanPercent: '40', retractionMm: '0.8', retractionSpeedMmPerSecond: '30' },
  ABS: { printSpeedMmPerSecond: '50', flowPercent: '100', flowRatio: '1', fanPercent: '20', retractionMm: '0.8', retractionSpeedMmPerSecond: '30' },
  ASA: { printSpeedMmPerSecond: '50', flowPercent: '100', flowRatio: '1', fanPercent: '20', retractionMm: '0.8', retractionSpeedMmPerSecond: '30' },
  TPU: { printSpeedMmPerSecond: '25', flowPercent: '100', flowRatio: '1', fanPercent: '60', retractionMm: '0.4', retractionSpeedMmPerSecond: '20' },
};

function clean(value: string): string { return value.trim(); }
function key(value: string): string { return clean(value).toLocaleLowerCase('fr-FR'); }

export function mergeUnique(...groups: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const raw of group) {
      const value = clean(raw);
      if (!value) continue;
      const normalized = key(value);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(value);
    }
  }
  return out;
}

export function getBrandOptions(references: readonly CatalogReferenceLike[]): string[] {
  return mergeUnique(DEFAULT_BRANDS, references.map((reference) => reference.brand)).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function getMaterialOptions(references: readonly CatalogReferenceLike[]): string[] {
  return mergeUnique(DEFAULT_MATERIALS, references.map((reference) => reference.material));
}

export function getDiameterOptions(references: readonly CatalogReferenceLike[]): string[] {
  return mergeUnique(DEFAULT_DIAMETERS, references.map((reference) => String(reference.diameterMm)));
}

export function getManufacturerTypes(brand: string, references: readonly CatalogReferenceLike[]): string[] {
  const builtin = Object.keys(MANUFACTURER_CATALOG[brand] ?? {});
  const learned = references
    .filter((reference) => key(reference.brand) === key(brand) && reference.manufacturerType)
    .map((reference) => reference.manufacturerType!);
  return mergeUnique(builtin, learned);
}

export function getManufacturerColors(
  brand: string,
  manufacturerType: string,
  references: readonly CatalogReferenceLike[],
): string[] {
  const builtin = MANUFACTURER_CATALOG[brand]?.[manufacturerType]?.colors.map((color) => color.name) ?? [];
  const learned = references
    .filter((reference) => key(reference.brand) === key(brand)
      && key(reference.manufacturerType ?? '') === key(manufacturerType)
      && reference.manufacturerColor)
    .map((reference) => reference.manufacturerColor!);
  return mergeUnique(builtin, learned);
}

export function getManufacturerColorHex(
  brand: string,
  manufacturerType: string,
  colorName: string,
  references: readonly CatalogReferenceLike[],
): string | null {
  const learned = references.find((reference) => key(reference.brand) === key(brand)
    && key(reference.manufacturerType ?? '') === key(manufacturerType)
    && key(reference.manufacturerColor ?? '') === key(colorName)
    && reference.colorHex);
  if (learned?.colorHex) return learned.colorHex.toUpperCase();
  const builtin = MANUFACTURER_CATALOG[brand]?.[manufacturerType]?.colors.find((color) => key(color.name) === key(colorName));
  return builtin?.hex?.toUpperCase() ?? null;
}

export function inferMaterial(brand: string, manufacturerType: string): string | null {
  return MANUFACTURER_CATALOG[brand]?.[manufacturerType]?.material ?? null;
}

export function getTemperatureDefaults(
  brand: string,
  manufacturerType: string,
  material: string,
): { nozzle: readonly [number, number]; bed: readonly [number, number] } | null {
  const type = MANUFACTURER_CATALOG[brand]?.[manufacturerType];
  if (type?.nozzle && type.bed) return { nozzle: type.nozzle, bed: type.bed };
  return MATERIAL_TEMPERATURES[material] ?? null;
}

export function getSupplierOptions(spools: readonly CatalogSpoolLike[]): string[] {
  return mergeUnique(DEFAULT_SUPPLIERS, spools.map((spool) => spool.supplier ?? ''));
}

export function getLocationOptions(locations: readonly CatalogLocationLike[]): string[] {
  return mergeUnique(DEFAULT_LOCATIONS, locations.map((location) => location.name));
}

export function emptySpoolPresetLabel(preset: EmptySpoolPreset): string {
  return `${preset.brand} — ${preset.label}${preset.tareGrams === null ? '' : ` — ${preset.tareGrams} g`}`;
}

export function getEmptySpoolPresets(brand: string): EmptySpoolPreset[] {
  const normalizedBrand = key(brand);
  return [...EMPTY_SPOOL_PRESETS].sort((left, right) => {
    const leftExact = key(left.brand) === normalizedBrand ? 0 : 1;
    const rightExact = key(right.brand) === normalizedBrand ? 0 : 1;
    return leftExact - rightExact || left.brand.localeCompare(right.brand, 'fr');
  });
}

export function buildShortcutPresets(
  references: readonly CatalogReferenceLike[],
  spools: readonly CatalogSpoolLike[],
  limit = 4,
): ShortcutPreset[] {
  const byId = new Map(references.map((reference) => [reference.id, reference]));
  const counts = new Map<string, ShortcutPreset>();
  for (const spool of spools) {
    if (!spool.filamentReferenceId) continue;
    const reference = byId.get(spool.filamentReferenceId);
    if (!reference?.manufacturerType) continue;
    const shortcutKey = [reference.brand, reference.material, reference.diameterMm, reference.manufacturerType]
      .map(String).map(key).join('|');
    const current = counts.get(shortcutKey);
    if (current) current.count += 1;
    else counts.set(shortcutKey, {
      brand: reference.brand,
      material: reference.material,
      diameterMm: reference.diameterMm,
      manufacturerType: reference.manufacturerType,
      count: 1,
    });
  }
  return [...counts.values()]
    .sort((left, right) => right.count - left.count
      || left.brand.localeCompare(right.brand, 'fr')
      || left.manufacturerType.localeCompare(right.manufacturerType, 'fr'))
    .slice(0, Math.max(0, limit));
}
