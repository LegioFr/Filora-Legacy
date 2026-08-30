import {
  getManufacturerColorHex,
  type CatalogReferenceLike,
} from './filamentCatalog.js';

export interface ManufacturerTypePresentation {
  options: string[];
  labels: Readonly<Record<string, string>>;
  groups: Readonly<Record<string, string>>;
}

const POLYMAKER_ORDER = [
  'Matte',
  'Panchroma Basic PLA',
  'Panchroma Satin PLA',
  'Silk',
  'Panchroma CoPE',
] as const;

const POLYMAKER_LABELS: Readonly<Record<string, string>> = {
  Matte: 'Matte PLA',
  'Panchroma Basic PLA': 'Basic PLA',
  'Panchroma Satin PLA': 'Satin PLA',
  Silk: 'Silk PLA',
  'Panchroma CoPE': 'CoPE',
};

// Codes publiés sur la boutique Polymaker pour Panchroma Matte PLA.
const POLYMAKER_MATTE_HEX: Readonly<Record<string, string>> = {
  'Charcoal Black': '#2F2E30',
  'Cotton White': '#F4EFEB',
  'Ash Grey': '#485155',
  'Army Beige': '#DBBAA5',
  'Army Brown': '#795A4D',
  'Earth Brown': '#7C594A',
  'Muted White': '#BBADA4',
  'Pastel Peanut': '#BF9573',
  'Wood Brown': '#AB7449',
  'Pastel Peach': '#F6BF8B',
  'Sunrise Orange': '#F88B17',
  'Pastel Banana': '#F7D475',
  'Army Light Green': '#AB8C02',
  'Savannah Yellow': '#F3C432',
  'Lime Green': '#D7D602',
  'Army Dark Green': '#5F6244',
  'Pastel Mint': '#D2DEBB',
  'Muted Green': '#777E71',
  'Forest Green': '#60AD70',
  'Sky Blue': '#1AC5FC',
  'Arctic Teal': '#61BCC3',
  'Pastel Ice': '#A4D0DF',
  'Electric Indigo': '#6858A9',
  'Sapphire Blue': '#0163A6',
  'Army Blue': '#2E4462',
  'Muted Blue': '#5F778E',
  'Fossil Grey': '#8A8C94',
  'Lavender Purple': '#9572BF',
  'Muted Purple': '#7C5C78',
  'Pastel Candy': '#F0D6D9',
  'Lotus Pink': '#DD76C0',
  'Sakura Pink': '#EAADBD',
  'Pastel Watermelon': '#EE474B',
  'Lava Red': '#ED2F2E',
  'Army Red': '#BF312E',
  'Muted Red': '#D84B2E',
  'Pastel Periwinkle': '#ADB4E6',
  'Army Purple': '#36364A',
  'Grass Green': '#32BC46',
  'Sunshine Yellow': '#F9DA07',
  'Seafoam Green': '#7DD4BE',
  'Raspberry Blue': '#5472D0',
  'Wine Burgundy': '#753E4C',
  'Emerald Green': '#22624F',
  'Muted Moss': '#92864F',
  'Muted Teal': '#5D989E',
  'Pastel Coral': '#F09A7E',
  'Pastel Beige': '#E4D0B0',
  'Muted Mauve': '#A36D82',
  'Muted Terracotta': '#C06443',
  'Electric Magenta': '#F05B8F',
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('fr-FR');
}

function recordFrom(entries: readonly [string, string][]): Record<string, string> {
  return Object.fromEntries(entries);
}

export function getManufacturerTypePresentation(
  brand: string,
  rawOptions: readonly string[],
): ManufacturerTypePresentation {
  if (normalized(brand) === 'polymaker') {
    const known = POLYMAKER_ORDER.filter((option) => rawOptions.includes(option));
    const extras = rawOptions
      .filter((option) => !POLYMAKER_ORDER.includes(option as (typeof POLYMAKER_ORDER)[number]))
      .sort((a, b) => a.localeCompare(b, 'fr'));
    const options = [...known, ...extras];
    return {
      options,
      labels: recordFrom(options.map((option) => [option, POLYMAKER_LABELS[option] ?? option])),
      groups: recordFrom(known.map((option) => [option, 'Panchroma'])),
    };
  }

  if (normalized(brand) === 'bambu lab') {
    const options = [...rawOptions].sort((a, b) => {
      const groupA = a.split(' ')[0] ?? '';
      const groupB = b.split(' ')[0] ?? '';
      return groupA.localeCompare(groupB, 'fr') || a.localeCompare(b, 'fr');
    });
    return {
      options,
      labels: {},
      groups: recordFrom(options.map((option) => [option, option.startsWith('PETG') ? 'PETG' : option.startsWith('PLA') ? 'PLA' : 'Autres'])),
    };
  }

  return {
    options: [...rawOptions].sort((a, b) => a.localeCompare(b, 'fr')),
    labels: {},
    groups: {},
  };
}

export function displayManufacturerType(brand: string, manufacturerType: string | null): string {
  if (!manufacturerType) return '';
  if (normalized(brand) === 'polymaker') return POLYMAKER_LABELS[manufacturerType] ?? manufacturerType;
  return manufacturerType;
}

export function getVerifiedManufacturerColorHex(
  brand: string,
  manufacturerType: string,
  colorName: string,
  references: readonly CatalogReferenceLike[],
): string | null {
  if (
    normalized(brand) === 'polymaker'
    && normalized(manufacturerType) === 'matte'
  ) {
    const match = Object.entries(POLYMAKER_MATTE_HEX)
      .find(([name]) => normalized(name) === normalized(colorName));
    if (match) return match[1];
  }

  return getManufacturerColorHex(brand, manufacturerType, colorName, references);
}
