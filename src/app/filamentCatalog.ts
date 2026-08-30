export interface CatalogReferenceLike {
  id: string;
  brand: string;
  material: string;
  diameterMm: number;
  nominalWeightGrams: number;
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
  group?: string;
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
const colors = (...names: string[]): readonly CatalogColor[] => names.map((name) => c(name));
const NO_COLORS: readonly CatalogColor[] = [];
const p = (
  material: string,
  group: string,
  productColors: readonly CatalogColor[] = NO_COLORS,
  nozzle?: readonly [number, number],
  bed?: readonly [number, number],
): CatalogType => ({ material, group, colors: productColors, nozzle, bed });

export const DEFAULT_BRANDS = [
  'Bambu Lab', 'Polymaker', 'eSUN', 'SUNLU', 'JAYO', 'Overture', 'ERYONE', 'Prusament',
  'Rosa3D', 'Creality', 'Anycubic', 'ELEGOO', 'FlashForge', 'QIDI Tech', '3DJake', 'Amolen',
  'AzureFilm', 'Extrudr', 'Fiberlogy', 'Fillamentum', 'FormFutura', 'GEEETECH', 'GST3D',
  'Hatchbox', 'Inland', 'Kingroon', 'MatterHackers', 'NinjaTek', 'OVV3D', 'Proto-pasta',
  'Recreus', 'SainSmart', 'Smart Materials 3D', 'Spectrum Filaments', 'Taulman3D',
  'Treed Filaments', 'Ziro', 'ArianePlast', 'Capifil', 'Francofil', 'Grossiste3D', 'Kimya',
  'Nanovia', 'Octofiber', 'BASF Forward AM', 'Ultimaker', 'colorFabb', 'American Filament',
  'Raise3D', 'Snapmaker', 'Voxelab',
] as const;

export const DEFAULT_MATERIALS = [
  'PLA', 'PLA+', 'PLA-CF', 'PLA-GF', 'PETG', 'PETG-CF', 'PETG-GF', 'PCTG', 'ABS', 'ABS-GF',
  'ASA', 'ASA-CF', 'TPU', 'TPE', 'TPC', 'PA / Nylon', 'PA6', 'PA12', 'PA-CF', 'PA-GF',
  'PC', 'PC-CF', 'PC-ABS', 'PC-PBT', 'PET', 'PET-CF', 'PET-GF', 'PP', 'PP-CF', 'PP-GF',
  'PPA-CF', 'PPS', 'PPS-CF', 'PPS-GF', 'PVB', 'PVA', 'BVOH', 'HIPS', 'PEBA', 'CoPE',
  'POM', 'PMMA', 'PVDF', 'PEEK', 'PEKK', 'PEI', 'PPSU',
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
  c('Charcoal Black', '#2F2E30'), c('Cotton White', '#F4EFEB'), c('Ash Grey', '#485155'),
  c('Army Beige', '#DBBAA5'), c('Army Brown', '#795A4D'), c('Earth Brown', '#7C594A'),
  c('Muted White', '#BBADA4'), c('Pastel Peanut', '#BF9573'), c('Wood Brown', '#AB7449'),
  c('Pastel Peach', '#F6BF8B'), c('Sunrise Orange', '#F88B17'), c('Pastel Banana', '#F7D475'),
  c('Army Light Green', '#AB8C02'), c('Savannah Yellow', '#F3C432'), c('Lime Green', '#D7D602'),
  c('Army Dark Green', '#5F6244'), c('Pastel Mint', '#D2DEBB'), c('Muted Green', '#777E71'),
  c('Forest Green', '#60AD70'), c('Sky Blue', '#1AC5FC'), c('Arctic Teal', '#61BCC3'),
  c('Pastel Ice', '#A4D0DF'), c('Electric Indigo', '#6858A9'), c('Sapphire Blue', '#0163A6'),
  c('Army Blue', '#2E4462'), c('Muted Blue', '#5F778E'), c('Fossil Grey', '#8A8C94'),
  c('Lavender Purple', '#9572BF'), c('Muted Purple', '#7C5C78'), c('Pastel Candy', '#F0D6D9'),
  c('Lotus Pink', '#DD76C0'), c('Sakura Pink', '#EAADBD'), c('Pastel Watermelon', '#EE474B'),
  c('Lava Red', '#ED2F2E'), c('Army Red', '#BF312E'), c('Muted Red', '#D84B2E'),
  c('Pastel Periwinkle', '#ADB4E6'), c('Army Purple', '#36364A'), c('Grass Green', '#32BC46'),
  c('Sunshine Yellow', '#F9DA07'), c('Seafoam Green', '#7DD4BE'), c('Raspberry Blue', '#5472D0'),
  c('Wine Burgundy', '#753E4C'), c('Emerald Green', '#22624F'), c('Muted Moss', '#92864F'),
  c('Muted Teal', '#5D989E'), c('Pastel Coral', '#F09A7E'), c('Pastel Beige', '#E4D0B0'),
  c('Muted Mauve', '#A36D82'), c('Muted Terracotta', '#C06443'), c('Electric Magenta', '#F05B8F'),
] as const;

const POLYMAKER_SILK = colors(
  'Black', 'Purple', 'Magenta', 'Rose', 'Red', 'Rose Gold', 'Quartz Pink', 'Bronze', 'Orange',
  'White', 'Gold', 'Yellow', 'Lime', 'Green', 'Teal', 'Light Blue', 'Blue', 'Chrome', 'Silver',
  'Brass', 'Peridot Green', 'Periwinkle', 'Dark Blue', 'Gunmetal Grey', 'Pink',
);

const POLYMAKER_SATIN = [
  c('Satin Black', '#302E30'), c('Satin White', '#F5F0EC'), c('Satin Grey', '#797E89'),
  c('Satin Orange', '#FE9217'), c('Satin Yellow', '#F4C131'), c('Satin Green', '#5EAB71'),
  c('Satin Polymaker Teal', '#61BBC1'), c('Satin Blue', '#0162A6'), c('Satin Purple', '#9272C1'),
  c('Satin Red', '#DA1521'),
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

const PRUSAMENT_PLA = [
  c('Galaxy Black', '#191919'), c('Prusa Orange', '#F05A28'), c('Gentleman’s Grey', '#5D5D5D'),
  c('Azure Blue', '#0076A8'), c('Lipstick Red', '#D7263D'), c('Pistachio Green', '#A4C639'),
  c('Vanilla White', '#F4F1DE'), c('Jet Black', '#101010'),
] as const;

const QIDI_PETG_BASIC = [
  c('Klein Blue', '#0065BD'), c('Black', '#000000'), c('White', '#F2F0EB'), c('Beige', '#D0B891'),
  c('Cyan', '#00AEEF'), c('Yellow', '#F6D155'), c('Green', '#1F4E3A'), c('Light Gray', '#D1D3D4'),
  c('Red', '#D3100C'), c('Skin', '#E3BC9A'),
] as const;

const QIDI_PLA_RAPIDO = [
  c('Black', '#000000'), c('White', '#FFFFFF'), c('Red', '#E93536'), c('Yellow', '#F1D041'),
  c('Orange', '#FF9151'), c('Blue', '#1041AD'), c('Green', '#00B97E'), c('Silver', '#8B898B'),
  c('Gray', '#C3C3C1'), c('Pink', '#FF66CC'), c('Purple', '#9900CC'),
] as const;

const FLASHFORGE_PETG = colors(
  'White', 'Black', 'Red', 'Yellow', 'Blue', 'Green', 'Orange', 'Pink', 'Rose', 'Gray', 'Purple',
  'Brown', 'Gold', 'Silver', 'Natural', 'Transparent Natural', 'Transparent Purple', 'Transparent Ruby Red',
  'Transparent Yellow', 'Transparent Sky Blue', 'Transparent Green', 'Metallic Silver',
  'Metallic Bright Golden', 'Metallic Red', 'Metallic Purple', 'Metallic Blue', 'Metallic Green', 'Burnt Titanium',
);

const FLASHFORGE_ASA = colors(
  'Natural', 'Blue', 'Sparkle White', 'Sparkle Blue', 'Black', 'Sparkle Green', 'Yellow Green',
  'Sky Blue', 'Iron Gray', 'Sparkle Sky Blue', 'Sparkle Black', 'White', 'Traffic Red', 'Multicolor Burnt Titanium',
);

export const MANUFACTURER_CATALOG: Readonly<Record<string, Readonly<Record<string, CatalogType>>>> = {
  Polymaker: {
    'Panchroma Basic PLA': p('PLA', 'Panchroma', PANCHROMA_BASIC, [190, 230], [20, 60]),
    'Panchroma Matte PLA': p('PLA', 'Panchroma', POLYMAKER_MATTE, [190, 230], [25, 60]),
    'Panchroma Silk PLA': p('PLA', 'Panchroma', POLYMAKER_SILK, [190, 230], [25, 60]),
    'Panchroma Satin PLA': p('PLA', 'Panchroma', POLYMAKER_SATIN, [190, 230], [25, 60]),
    'Panchroma Galaxy PLA': p('PLA', 'Panchroma'),
    'Panchroma Starlight PLA': p('PLA', 'Panchroma'),
    'Panchroma Celestial PLA': p('PLA', 'Panchroma'),
    'Panchroma Metallic PLA': p('PLA', 'Panchroma'),
    'Panchroma Marble PLA': p('PLA', 'Panchroma'),
    'Panchroma Translucent PLA': p('PLA', 'Panchroma'),
    'Panchroma Glow PLA': p('PLA', 'Panchroma'),
    'Panchroma Luminous PLA': p('PLA', 'Panchroma'),
    'Panchroma Neon PLA': p('PLA', 'Panchroma'),
    'Panchroma UV Shift PLA': p('PLA', 'Panchroma'),
    'Panchroma Gradient Matte PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Satin PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Silk PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Galaxy PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Celestial PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Crystal PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Starlight PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Neon PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Translucent PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Gradient Luminous PLA': p('PLA', 'Panchroma dégradé'),
    'Panchroma Dual Matte PLA': p('PLA', 'Panchroma multicolore'),
    'Panchroma Dual Silk PLA': p('PLA', 'Panchroma multicolore'),
    'Panchroma Dual Special PLA': p('PLA', 'Panchroma multicolore'),
    'PolyLite PLA': p('PLA', 'PLA fonctionnel'),
    'Polymaker PLA Pro': p('PLA', 'PLA fonctionnel'),
    'PolyLite PLA Metallic Pro': p('PLA', 'PLA fonctionnel'),
    'PolyMax PLA': p('PLA', 'PLA fonctionnel'),
    'PolySonic PLA': p('PLA', 'PLA fonctionnel'),
    'PolyLite LW-PLA': p('PLA', 'PLA fonctionnel'),
    'PolyLite CosPLA': p('PLA', 'PLA fonctionnel'),
    'Matte PLA for Production': p('PLA', 'PLA fonctionnel'),
    'Polymaker HT-PLA': p('PLA', 'PLA fonctionnel'),
    'Polymaker HT-PLA Pro': p('PLA', 'PLA fonctionnel'),
    'PolyLite PLA-CF': p('PLA-CF', 'PLA renforcé'),
    'Polymaker HT-PLA-GF': p('PLA-GF', 'PLA renforcé'),
    'Panchroma CoPE': p('CoPE', 'Panchroma expérimental'),
    'Polymaker PETG': p('PETG', 'PETG'),
    'PolyLite Translucent PETG': p('PETG', 'PETG'),
    'PolyMax PETG': p('PETG', 'PETG'),
    'Fiberon PETG-ESD': p('PETG', 'Fiberon'),
    'Fiberon PETG-rCF08': p('PETG-CF', 'Fiberon'),
    'Fiberon PET-CF17': p('PET-CF', 'Fiberon'),
    'Fiberon PET-GF15': p('PET-GF', 'Fiberon'),
    'PolyLite ABS': p('ABS', 'ABS'),
    'PolyLite Galaxy ABS': p('ABS', 'ABS'),
    'PolyLite Metallic ABS': p('ABS', 'ABS'),
    'PolyLite Neon ABS': p('ABS', 'ABS'),
    'Polymaker ASA': p('ASA', 'ASA'),
    'Polymaker Galaxy ASA': p('ASA', 'ASA'),
    'Fiberon ASA-CF08': p('ASA-CF', 'Fiberon'),
    'PolyLite PC': p('PC', 'PC'),
    'PolyMax PC': p('PC', 'PC'),
    'PC-ABS': p('PC-ABS', 'PC'),
    'PC-PBT': p('PC-PBT', 'PC'),
    'PC-FR': p('PC', 'PC'),
    'PolyMide CoPA': p('PA / Nylon', 'Nylon'),
    'Fiberon PA612-CF15': p('PA-CF', 'Fiberon'),
    'Fiberon PA6-CF20': p('PA-CF', 'Fiberon'),
    'Fiberon PA6-GF25': p('PA-GF', 'Fiberon'),
    'Fiberon PA12-CF10': p('PA-CF', 'Fiberon'),
    'Fiberon PA12-GF10': p('PA-GF', 'Fiberon'),
    'Fiberon PA612-ESD': p('PA / Nylon', 'Fiberon'),
    'PolyFlex TPU90': p('TPU', 'Flexible'),
    'PolyFlex TPU95': p('TPU', 'Flexible'),
    'PolyFlex TPU95-HF': p('TPU', 'Flexible'),
    'Fiberon PPS-CF10': p('PPS-CF', 'Fiberon'),
    'Fiberon PPS-GF20': p('PPS-GF', 'Fiberon'),
  },
  'Bambu Lab': {
    'PLA Basic': p('PLA', 'PLA', BAMBU_PLA_BASIC, [190, 230], [35, 45]),
    'PLA Matte': p('PLA', 'PLA'),
    'PLA Basic Gradient': p('PLA', 'PLA effets', BAMBU_GRADIENT, [190, 230], [35, 45]),
    'PLA Silk+': p('PLA', 'PLA effets', BAMBU_SILK, [190, 230], [35, 45]),
    'PLA Silk Multi-Color': p('PLA', 'PLA effets'),
    'PLA Translucent': p('PLA', 'PLA effets'),
    'PLA Wood': p('PLA', 'PLA effets', BAMBU_WOOD, [190, 240], [35, 45]),
    'PLA Sparkle': p('PLA', 'PLA effets'),
    'PLA Marble': p('PLA', 'PLA effets'),
    'PLA Metal': p('PLA', 'PLA effets', BAMBU_METAL, [190, 230], [35, 45]),
    'PLA Galaxy': p('PLA', 'PLA effets'),
    'PLA Glow': p('PLA', 'PLA effets'),
    'PLA Aero': p('PLA', 'PLA technique'),
    'PLA-CF': p('PLA-CF', 'PLA renforcé'),
    'PETG HF': p('PETG', 'PETG', BAMBU_PETG_HF, [230, 260], [65, 80]),
    'PETG Translucent': p('PETG', 'PETG', BAMBU_PETG_TRANSLUCENT, [230, 260], [65, 75]),
    'PETG-CF': p('PETG-CF', 'PETG renforcé'),
    'ABS': p('ABS', 'Engineering'),
    'ABS-GF': p('ABS-GF', 'Engineering'),
    'ASA': p('ASA', 'Engineering'),
    'ASA-CF': p('ASA-CF', 'Engineering'),
    'ASA Aero': p('ASA', 'Engineering'),
    'PC': p('PC', 'Engineering'),
    'PC FR': p('PC', 'Engineering'),
    'PA6-GF': p('PA-GF', 'Engineering'),
    'PA6-CF': p('PA-CF', 'Engineering'),
    'PAHT-CF': p('PA-CF', 'Engineering'),
    'PPA-CF': p('PPA-CF', 'Engineering'),
    'PET-CF': p('PET-CF', 'Engineering'),
    'TPU for AMS': p('TPU', 'Flexible'),
    'TPU 95A HF': p('TPU', 'Flexible'),
    'TPU 90A': p('TPU', 'Flexible'),
    'TPU 85A': p('TPU', 'Flexible'),
  },
  eSUN: {
    'PLA Basic': p('PLA', 'PLA'),
    'PLA Matte': p('PLA', 'PLA effets'),
    'PLA Silk': p('PLA', 'PLA effets'),
    'PLA Marble': p('PLA', 'PLA effets'),
    'PLA Rainbow': p('PLA', 'PLA effets'),
    'PLA+': p('PLA+', 'PLA+', ESUN_PLA_PLUS, [210, 230], [45, 60]),
    'PETG': p('PETG', 'PETG'),
    'PETG Basic': p('PETG', 'PETG'),
    'ABS': p('ABS', 'Engineering'),
    'ASA': p('ASA', 'Engineering'),
    'TPU': p('TPU', 'Flexible'),
    'PA': p('PA / Nylon', 'Engineering'),
    'PA6-CF': p('PA-CF', 'Engineering'),
    'PC-ESD': p('PC', 'Engineering'),
    'ABS-ESD': p('ABS', 'Engineering'),
    'PEBA': p('PEBA', 'Flexible'),
  },
  SUNLU: {
    'PLA': p('PLA', 'PLA'),
    'PLA+': p('PLA+', 'PLA'),
    'PLA+ 2.0': p('PLA+', 'PLA'),
    'PLA Meta': p('PLA', 'PLA'),
    'PLA Silk+ 2.0': p('PLA', 'PLA effets'),
    'PLA Metallic': p('PLA', 'PLA effets'),
    'PLA Galaxy': p('PLA', 'PLA effets'),
    'PLA Glow': p('PLA', 'PLA effets'),
    'PLA Rainbow': p('PLA', 'PLA effets'),
    'PLA Wood': p('PLA', 'PLA effets'),
    'PLA-CF': p('PLA-CF', 'Renforcé'),
    'PETG': p('PETG', 'PETG'),
    'PETG 2.0': p('PETG', 'PETG'),
    'PETG Glow': p('PETG', 'PETG effets'),
    'PETG-CF': p('PETG-CF', 'Renforcé'),
    'ABS High Speed': p('ABS', 'Engineering'),
    'PC-ABS': p('PC-ABS', 'Engineering'),
    'TPU 95A': p('TPU', 'Flexible'),
    'TPU 90A': p('TPU', 'Flexible'),
    'Easy PA': p('PA / Nylon', 'Engineering'),
    'PA6-CF': p('PA-CF', 'Engineering'),
    'PA12-CF': p('PA-CF', 'Engineering'),
    'PA6-GF': p('PA-GF', 'Engineering'),
    'PP 2.0': p('PP', 'Engineering'),
  },
  Prusament: {
    'PLA': p('PLA', 'PLA', PRUSAMENT_PLA, [200, 220], [50, 60]),
    'PLA High Speed': p('PLA', 'PLA'),
    'PLA Recycled': p('PLA', 'PLA'),
    'rPLA': p('PLA', 'PLA'),
    'Woodfill': p('PLA', 'PLA effets'),
    'PETG': p('PETG', 'PETG'),
    'PETG Recycled': p('PETG', 'PETG'),
    'PETG V0': p('PETG', 'PETG'),
    'PETG Ultraglow': p('PETG', 'PETG effets'),
    'PETG Magnetite': p('PETG', 'PETG effets'),
    'PETG-CF': p('PETG-CF', 'Renforcé'),
    'PETG Tungsten': p('PETG', 'Spécial'),
    'ASA': p('ASA', 'Engineering'),
    'TPU 95A': p('TPU', 'Flexible'),
    'PC Blend': p('PC', 'Engineering'),
    'PC Blend CF': p('PC-CF', 'Engineering'),
    'PC Space Grade': p('PC', 'Engineering'),
    'PA11': p('PA / Nylon', 'Engineering'),
    'PA11 CF': p('PA-CF', 'Engineering'),
    'PP GF': p('PP-GF', 'Engineering'),
    'PP CF': p('PP-CF', 'Engineering'),
    'PVB': p('PVB', 'Spécial'),
  },
  Anycubic: {
    'PLA Basic': p('PLA', 'PLA'), 'PLA High Speed': p('PLA', 'PLA'), 'PLA Silk': p('PLA', 'PLA effets'),
    'PLA Dual/Tri-Color': p('PLA', 'PLA effets'), 'PLA Metal': p('PLA', 'PLA effets'),
    'PLA Matte': p('PLA', 'PLA effets'), 'PLA Glow': p('PLA', 'PLA effets'),
    'PLA Galaxy': p('PLA', 'PLA effets'), 'PLA Marble': p('PLA', 'PLA effets'),
    'PLA+': p('PLA+', 'PLA+'), 'PLA-CF': p('PLA-CF', 'Renforcé'),
    'PETG': p('PETG', 'PETG'), 'PETG Translucent': p('PETG', 'PETG effets'),
    'PETG-CF': p('PETG-CF', 'Renforcé'), 'ABS': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering'),
    'TPU 68D': p('TPU', 'Flexible'), 'TPU 95A': p('TPU', 'Flexible'), 'PC': p('PC', 'Engineering'),
    'PVA': p('PVA', 'Support'),
  },
  ELEGOO: {
    'PLA': p('PLA', 'PLA'), 'Rapid PLA+': p('PLA+', 'PLA+'), 'PLA+': p('PLA+', 'PLA+'),
    'PLA Silk': p('PLA', 'PLA effets'), 'PLA Pro': p('PLA', 'PLA'), 'PLA Galaxy': p('PLA', 'PLA effets'),
    'PLA Matte': p('PLA', 'PLA effets'), 'PLA CMYK': p('PLA', 'PLA effets'), 'PLA Glow': p('PLA', 'PLA effets'),
    'PLA Wood': p('PLA', 'PLA effets'), 'PLA Marble': p('PLA', 'PLA effets'), 'PLA-CF': p('PLA-CF', 'Renforcé'),
    'Rapid PETG': p('PETG', 'PETG'), 'PETG Pro': p('PETG', 'PETG'), 'PETG Translucent': p('PETG', 'PETG effets'),
    'PETG-CF': p('PETG-CF', 'Renforcé'), 'PETG-GF': p('PETG-GF', 'Renforcé'),
    'ABS': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering'), 'PC': p('PC', 'Engineering'),
    'TPU 95A': p('TPU', 'Flexible'), 'TPU 72D': p('TPU', 'Flexible'), 'Rapid TPU 95A': p('TPU', 'Flexible'),
    'PAHT-CF': p('PA-CF', 'Engineering'),
  },
  Creality: {
    'Hyper PLA': p('PLA', 'PLA'), 'Soleyin Ultra PLA': p('PLA', 'PLA'), 'Ender PLA+': p('PLA+', 'PLA+'),
    'Rainbow PLA': p('PLA', 'PLA effets'), 'PLA Silk': p('PLA', 'PLA effets'), 'PLA Wood': p('PLA', 'PLA effets'),
    'Hyper PLA-CF': p('PLA-CF', 'Renforcé'), 'Hyper PETG': p('PETG', 'PETG'), 'CR-PETG': p('PETG', 'PETG'),
    'Hyper ABS': p('ABS', 'Engineering'), 'ABS': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering'),
    'HP ASA': p('ASA', 'Engineering'), 'CR-TPU': p('TPU', 'Flexible'), 'Hyper PC': p('PC', 'Engineering'),
    'PPA-CF': p('PPA-CF', 'Engineering'),
  },
  Overture: {
    'PLA': p('PLA', 'PLA'), 'Matte PLA': p('PLA', 'PLA effets'), 'PLA Professional': p('PLA', 'PLA'),
    'Silk PLA': p('PLA', 'PLA effets'), 'Rock PLA': p('PLA', 'PLA effets'), 'Easy PLA': p('PLA', 'PLA'),
    'Super PLA': p('PLA', 'PLA'), 'Glow PLA': p('PLA', 'PLA effets'), 'PLA+': p('PLA+', 'PLA+'),
    'PETG': p('PETG', 'PETG'), 'ABS': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering'),
    'TPU': p('TPU', 'Flexible'), 'High Speed TPU': p('TPU', 'Flexible'), 'Matte TPU': p('TPU', 'Flexible'),
    'Easy Nylon': p('PA / Nylon', 'Engineering'), 'PC Professional': p('PC', 'Engineering'),
  },
  ERYONE: {
    'PLA': p('PLA', 'PLA'), 'PLA High-Speed': p('PLA', 'PLA'), 'PETG': p('PETG', 'PETG'),
    'PETG High-Speed': p('PETG', 'PETG'), 'ABS': p('ABS', 'Engineering'), 'ABS High-Speed': p('ABS', 'Engineering'),
    'ASA': p('ASA', 'Engineering'), 'ASA High-Speed': p('ASA', 'Engineering'), 'TPU': p('TPU', 'Flexible'),
    'TPU High-Speed': p('TPU', 'Flexible'), 'PA': p('PA / Nylon', 'Engineering'), 'PP': p('PP', 'Engineering'),
  },
  FlashForge: {
    'HS PLA': p('PLA', 'PLA'), 'HS PLA Multicolor': p('PLA', 'PLA effets'), 'PLA Silk': p('PLA', 'PLA effets'),
    'PETG Basic': p('PETG', 'PETG', FLASHFORGE_PETG), 'HS PETG': p('PETG', 'PETG', FLASHFORGE_PETG),
    'HS PETG Transparent': p('PETG', 'PETG effets', FLASHFORGE_PETG), 'HS PETG Metallic': p('PETG', 'PETG effets', FLASHFORGE_PETG),
    'HS PETG Multicolor': p('PETG', 'PETG effets', FLASHFORGE_PETG), 'PETG-CF': p('PETG-CF', 'Renforcé'),
    'ABS Basic': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering', FLASHFORGE_ASA),
    'ASA-CF': p('ASA-CF', 'Renforcé'), 'PET-CF': p('PET-CF', 'Renforcé'), 'PET-GF': p('PET-GF', 'Renforcé'),
  },
  'QIDI Tech': {
    'PLA Basic': p('PLA', 'PLA'), 'PLA Rapido': p('PLA', 'PLA', QIDI_PLA_RAPIDO), 'PLA Matte': p('PLA', 'PLA effets'),
    'PETG Basic': p('PETG', 'PETG', QIDI_PETG_BASIC), 'ABS': p('ABS', 'Engineering'), 'ASA': p('ASA', 'Engineering'),
    'TPU': p('TPU', 'Flexible'),
  },
  Rosa3D: {
    'PLA Starter': p('PLA', 'PLA'), 'PLA Pastel': p('PLA', 'PLA effets'), 'PLA Magic': p('PLA', 'PLA effets'),
    'PLA Multicolour': p('PLA', 'PLA effets'), 'PLA Rainbow': p('PLA', 'PLA effets'), 'PLA Silk': p('PLA', 'PLA effets'),
    'PLA Speed Matt': p('PLA', 'PLA effets'), 'PLA High Speed': p('PLA', 'PLA'), 'PLA Plus ProSpeed': p('PLA+', 'PLA+'),
    'PLA CarbonLook': p('PLA-CF', 'Renforcé'), 'PLA Galaxy': p('PLA', 'PLA effets'), 'PLA LW Aero': p('PLA', 'PLA technique'),
    'PET-G Standard HS': p('PETG', 'PETG'), 'PET-G Magic': p('PETG', 'PETG effets'), 'PET-G Galaxy HS': p('PETG', 'PETG effets'),
    'PET-G HT': p('PETG', 'PETG'), 'PET-G Structure HS': p('PETG', 'PETG'), 'PET-G CarbonLook': p('PETG-CF', 'Renforcé'),
    'PET-G +10CF': p('PETG-CF', 'Renforcé'), 'PET-G V0 FR': p('PETG', 'PETG spécial'), 'PET-G MDT': p('PETG', 'PETG spécial'),
    'PET-G PTFE': p('PETG', 'PETG spécial'), 'PET-G ESD': p('PETG', 'PETG spécial'), 'PET-G MATT': p('PETG', 'PETG effets'),
    'PET-G +30GF': p('PETG-GF', 'Renforcé'), 'PCTG': p('PCTG', 'PCTG'),
    'ASA': p('ASA', 'Engineering'), 'ASA-X': p('ASA', 'Engineering'), 'ASA +10CF': p('ASA-CF', 'Renforcé'),
    'ABS': p('ABS', 'Engineering'), 'PC/PBT': p('PC-PBT', 'Engineering'),
    'Rosa-Flex 85A': p('TPU', 'Flexible'), 'Rosa-Flex 96A': p('TPU', 'Flexible'), 'TPU 75D': p('TPU', 'Flexible'),
    'HardTech 83D': p('TPU', 'Flexible'), 'Flex LW': p('TPU', 'Flexible'), 'PA12 + CF': p('PA-CF', 'Engineering'),
  },
};

export const EMPTY_SPOOL_PRESETS: readonly EmptySpoolPreset[] = [
  { brand: 'colorFabb', label: 'Carton 750 g', tareGrams: 152, source: 'Valeur constructeur publiée pour la bobine carton 750 g.' },
  { brand: 'American Filament', label: 'Spool AMS compatible', tareGrams: 220, source: 'Valeur publiquement déclarée par American Filament.' },
  ...DEFAULT_BRANDS.map((brand) => ({
    brand,
    label: 'Bobine / modèle variable',
    tareGrams: null,
    source: 'La tare varie selon le modèle ou la génération : mesurer une bobine vide identique.',
  })),
];

const MATERIAL_TEMPERATURES: Readonly<Record<string, { nozzle: readonly [number, number]; bed: readonly [number, number] }>> = {
  PLA: { nozzle: [190, 220], bed: [45, 60] }, 'PLA+': { nozzle: [200, 230], bed: [45, 60] },
  'PLA-CF': { nozzle: [210, 240], bed: [45, 65] }, 'PLA-GF': { nozzle: [210, 250], bed: [45, 65] },
  PETG: { nozzle: [230, 250], bed: [70, 85] }, 'PETG-CF': { nozzle: [240, 270], bed: [70, 90] },
  PCTG: { nozzle: [240, 270], bed: [70, 90] }, ABS: { nozzle: [240, 260], bed: [90, 110] },
  ASA: { nozzle: [245, 270], bed: [90, 110] }, TPU: { nozzle: [210, 235], bed: [30, 55] },
  TPE: { nozzle: [210, 240], bed: [30, 55] }, 'PA / Nylon': { nozzle: [250, 290], bed: [70, 100] },
  'PA-CF': { nozzle: [260, 300], bed: [80, 110] }, PC: { nozzle: [260, 300], bed: [90, 120] },
  'PC-CF': { nozzle: [270, 310], bed: [90, 120] }, CoPE: { nozzle: [190, 230], bed: [25, 60] },
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
function same(left: string, right: string): boolean { return key(left) === key(right); }

function brandCatalog(brand: string): Readonly<Record<string, CatalogType>> | null {
  const match = Object.keys(MANUFACTURER_CATALOG).find((candidate) => same(candidate, brand));
  return match ? MANUFACTURER_CATALOG[match] : null;
}

const LEGACY_TYPE_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  Polymaker: {
    Matte: 'Panchroma Matte PLA',
    Silk: 'Panchroma Silk PLA',
  },
};

export function canonicalManufacturerType(brand: string, manufacturerType: string): string {
  const aliases = Object.entries(LEGACY_TYPE_ALIASES).find(([candidate]) => same(candidate, brand))?.[1];
  const match = aliases ? Object.entries(aliases).find(([candidate]) => same(candidate, manufacturerType)) : undefined;
  return match?.[1] ?? clean(manufacturerType);
}

export function isVerifiedCatalogBrand(brand: string): boolean {
  return brandCatalog(brand) !== null;
}

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

function materialSort(values: readonly string[]): string[] {
  const order = new Map(DEFAULT_MATERIALS.map((material, index) => [key(material), index]));
  return [...values].sort((left, right) => (order.get(key(left)) ?? 999) - (order.get(key(right)) ?? 999) || left.localeCompare(right, 'fr'));
}

export function getBrandOptions(references: readonly CatalogReferenceLike[]): string[] {
  return mergeUnique(DEFAULT_BRANDS, references.map((reference) => reference.brand)).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function getMaterialOptions(references: readonly CatalogReferenceLike[], brand = ''): string[] {
  if (!brand.trim()) return materialSort(mergeUnique(DEFAULT_MATERIALS, references.map((reference) => reference.material)));
  const catalog = brandCatalog(brand);
  const learned = references.filter((reference) => same(reference.brand, brand)).map((reference) => reference.material);
  if (!catalog) return materialSort(mergeUnique(DEFAULT_MATERIALS, learned));
  return materialSort(mergeUnique(Object.values(catalog).map((type) => type.material), learned));
}

export function getDiameterOptions(references: readonly CatalogReferenceLike[]): string[] {
  return mergeUnique(DEFAULT_DIAMETERS, references.map((reference) => String(reference.diameterMm)));
}

export function getManufacturerTypes(brand: string, references: readonly CatalogReferenceLike[], material = ''): string[] {
  const catalog = brandCatalog(brand);
  const builtin = catalog
    ? Object.entries(catalog).filter(([, type]) => !material || same(type.material, material)).map(([name]) => name)
    : [];
  const learned = references
    .filter((reference) => same(reference.brand, brand)
      && (!material || same(reference.material, material))
      && reference.manufacturerType)
    .map((reference) => canonicalManufacturerType(brand, reference.manufacturerType!));
  return mergeUnique(builtin, learned);
}

function typeDefinition(brand: string, manufacturerType: string): CatalogType | null {
  const catalog = brandCatalog(brand);
  if (!catalog) return null;
  const canonical = canonicalManufacturerType(brand, manufacturerType);
  const match = Object.entries(catalog).find(([name]) => same(name, canonical));
  return match?.[1] ?? null;
}

export function getManufacturerTypeGroup(brand: string, manufacturerType: string): string {
  return typeDefinition(brand, manufacturerType)?.group ?? '';
}

export function getManufacturerTypeLabel(brand: string, manufacturerType: string): string {
  return canonicalManufacturerType(brand, manufacturerType);
}

export function getManufacturerColors(
  brand: string,
  manufacturerType: string,
  references: readonly CatalogReferenceLike[],
  material = '',
): string[] {
  const canonical = canonicalManufacturerType(brand, manufacturerType);
  const definition = typeDefinition(brand, canonical);
  const builtin = definition && (!material || same(definition.material, material))
    ? definition.colors.map((color) => color.name)
    : [];
  const learned = references
    .filter((reference) => same(reference.brand, brand)
      && (!material || same(reference.material, material))
      && same(canonicalManufacturerType(brand, reference.manufacturerType ?? ''), canonical)
      && reference.manufacturerColor)
    .map((reference) => reference.manufacturerColor!);
  return mergeUnique(builtin, learned);
}

export function getManufacturerColorHex(
  brand: string,
  manufacturerType: string,
  colorName: string,
  references: readonly CatalogReferenceLike[],
  material = '',
): string | null {
  const canonical = canonicalManufacturerType(brand, manufacturerType);
  const learned = references.find((reference) => same(reference.brand, brand)
    && (!material || same(reference.material, material))
    && same(canonicalManufacturerType(brand, reference.manufacturerType ?? ''), canonical)
    && same(reference.manufacturerColor ?? '', colorName)
    && reference.colorHex);
  if (learned?.colorHex) return learned.colorHex.toUpperCase();
  const definition = typeDefinition(brand, canonical);
  if (!definition || (material && !same(definition.material, material))) return null;
  return definition.colors.find((color) => same(color.name, colorName))?.hex?.toUpperCase() ?? null;
}

export function inferMaterial(brand: string, manufacturerType: string): string | null {
  return typeDefinition(brand, manufacturerType)?.material ?? null;
}

export function getTemperatureDefaults(
  brand: string,
  manufacturerType: string,
  material: string,
): { nozzle: readonly [number, number]; bed: readonly [number, number] } | null {
  const type = typeDefinition(brand, manufacturerType);
  if (type && same(type.material, material) && type.nozzle && type.bed) return { nozzle: type.nozzle, bed: type.bed };
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
    const manufacturerType = canonicalManufacturerType(reference.brand, reference.manufacturerType);
    const shortcutKey = [reference.brand, reference.material, reference.diameterMm, manufacturerType]
      .map(String).map(key).join('|');
    const current = counts.get(shortcutKey);
    if (current) current.count += 1;
    else counts.set(shortcutKey, {
      brand: reference.brand,
      material: reference.material,
      diameterMm: reference.diameterMm,
      manufacturerType,
      count: 1,
    });
  }
  return [...counts.values()]
    .sort((left, right) => right.count - left.count
      || left.brand.localeCompare(right.brand, 'fr')
      || left.manufacturerType.localeCompare(right.manufacturerType, 'fr'))
    .slice(0, Math.max(0, limit));
}
