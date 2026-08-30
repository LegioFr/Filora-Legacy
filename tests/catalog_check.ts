import {
  buildShortcutPresets,
  getBrandOptions,
  getManufacturerColorHex,
  getManufacturerColors,
  getManufacturerTypes,
  type CatalogReferenceLike,
  type CatalogSpoolLike,
} from '../src/app/filamentCatalog.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const builtInTypes = getManufacturerTypes('Polymaker', []);
assert(builtInTypes.includes('Matte'), 'Polymaker doit proposer Matte.');
assert(builtInTypes.includes('Panchroma Basic PLA'), 'Polymaker doit proposer Panchroma Basic PLA.');

const matteColors = getManufacturerColors('Polymaker', 'Matte', []);
assert(matteColors.includes('Army Blue'), 'La couleur Army Blue doit être proposée pour Polymaker Matte.');

const bambuHex = getManufacturerColorHex('Bambu Lab', 'PETG HF', 'Lake Blue', []);
assert(bambuHex === '#1F79E5', 'Le HEX Bambu PETG HF Lake Blue doit être connu.');

const learnedReferences: CatalogReferenceLike[] = [
  {
    id: 'REF-A',
    brand: 'Ma Marque',
    material: 'PLA',
    diameterMm: 1.75,
    manufacturerType: 'Ma Gamme',
    manufacturerColor: 'Mon Bleu',
    colorHex: '#123456',
  },
  {
    id: 'REF-B',
    brand: 'Ma Marque',
    material: 'PLA',
    diameterMm: 1.75,
    manufacturerType: 'Ma Gamme',
    manufacturerColor: 'Mon Rouge',
    colorHex: '#AA1122',
  },
];

assert(getBrandOptions(learnedReferences).includes('Ma Marque'), 'Une marque déjà enregistrée doit être reproposée.');
assert(getManufacturerTypes('Ma Marque', learnedReferences).includes('Ma Gamme'), 'Une gamme manuelle enregistrée doit être reproposée.');
assert(getManufacturerColors('Ma Marque', 'Ma Gamme', learnedReferences).includes('Mon Bleu'), 'Une couleur manuelle enregistrée doit être reproposée.');
assert(getManufacturerColorHex('Ma Marque', 'Ma Gamme', 'Mon Bleu', learnedReferences) === '#123456', 'Le HEX enregistré doit être repris.');

const spools: CatalogSpoolLike[] = [
  { filamentReferenceId: 'REF-A', supplier: 'Boutique perso' },
  { filamentReferenceId: 'REF-A', supplier: 'Boutique perso' },
  { filamentReferenceId: 'REF-B', supplier: 'Boutique perso' },
];
const shortcuts = buildShortcutPresets(learnedReferences, spools, 4);
assert(shortcuts.length === 1, 'Les couleurs différentes d’une même combinaison doivent partager un raccourci.');
assert(shortcuts[0].count === 3, 'Le raccourci doit refléter la fréquence réelle des bobines.');
assert(shortcuts[0].brand === 'Ma Marque' && shortcuts[0].manufacturerType === 'Ma Gamme', 'Le raccourci doit conserver marque et gamme.');

console.log('Batch 6 guided catalog checks passed');
