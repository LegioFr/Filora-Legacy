import {
  buildShortcutPresets,
  canonicalManufacturerType,
  getBrandOptions,
  getManufacturerColorHex,
  getManufacturerColors,
  getManufacturerTypes,
  getMaterialOptions,
  isVerifiedCatalogBrand,
  type CatalogReferenceLike,
  type CatalogSpoolLike,
} from '../src/app/filamentCatalog.js';
import {
  getManufacturerTypePresentation,
  getVerifiedManufacturerColorHex,
} from '../src/app/catalogPresentation.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const polymakerMaterials = getMaterialOptions([], 'Polymaker');
assert(polymakerMaterials.includes('PLA'), 'Polymaker doit proposer PLA.');
assert(polymakerMaterials.includes('PETG'), 'Polymaker doit proposer PETG.');
assert(polymakerMaterials.includes('CoPE'), 'Polymaker doit distinguer CoPE du PLA.');
assert(isVerifiedCatalogBrand('Polymaker'), 'Polymaker doit être une marque à catalogue vérifié.');
assert(!isVerifiedCatalogBrand('3DJake'), '3DJake ne doit pas recevoir un faux catalogue fabricant.');

const polymakerPlaTypes = getManufacturerTypes('Polymaker', [], 'PLA');
assert(polymakerPlaTypes.includes('Panchroma Matte PLA'), 'Polymaker PLA doit proposer Panchroma Matte PLA.');
assert(polymakerPlaTypes.includes('Panchroma Basic PLA'), 'Polymaker PLA doit proposer Panchroma Basic PLA.');
assert(!polymakerPlaTypes.includes('Polymaker PETG'), 'Polymaker PLA ne doit jamais proposer une gamme PETG.');

const polymakerPetgTypes = getManufacturerTypes('Polymaker', [], 'PETG');
assert(polymakerPetgTypes.includes('Polymaker PETG'), 'Polymaker PETG doit proposer Polymaker PETG.');
assert(polymakerPetgTypes.includes('PolyMax PETG'), 'Polymaker PETG doit proposer PolyMax PETG.');
assert(!polymakerPetgTypes.includes('Panchroma Matte PLA'), 'Polymaker PETG ne doit jamais proposer Panchroma Matte PLA.');
assert(!polymakerPetgTypes.includes('Panchroma Basic PLA'), 'Polymaker PETG ne doit jamais proposer Panchroma Basic PLA.');

const bambuPetgTypes = getManufacturerTypes('Bambu Lab', [], 'PETG');
assert(bambuPetgTypes.includes('PETG HF'), 'Bambu PETG doit proposer PETG HF.');
assert(!bambuPetgTypes.includes('PLA Basic'), 'Bambu PETG ne doit jamais proposer PLA Basic.');

assert(getManufacturerTypes('3DJake', [], 'PLA').length === 0, 'Une marque non vérifiée ne doit recevoir aucune fausse gamme automatique.');

const presentation = getManufacturerTypePresentation('Polymaker', polymakerPlaTypes);
assert(presentation.groups['Panchroma Matte PLA'] === 'Panchroma', 'Les variantes Panchroma doivent rester regroupées.');
assert(presentation.options.includes('Panchroma Matte PLA'), 'La présentation ne doit pas perdre les valeurs canoniques.');
assert(canonicalManufacturerType('Polymaker', 'Matte') === 'Panchroma Matte PLA', 'Les anciennes références Polymaker Matte doivent rester compatibles.');
assert(canonicalManufacturerType('Polymaker', 'Silk') === 'Panchroma Silk PLA', 'Les anciennes références Polymaker Silk doivent rester compatibles.');

const matteColors = getManufacturerColors('Polymaker', 'Panchroma Matte PLA', [], 'PLA');
assert(matteColors.includes('Army Blue'), 'Army Blue doit être proposée pour Panchroma Matte PLA.');
assert(matteColors.includes('Seafoam Green'), 'Seafoam Green doit être proposée pour Panchroma Matte PLA.');
assert(matteColors.includes('Emerald Green'), 'Emerald Green doit être proposée pour Panchroma Matte PLA.');
assert(getManufacturerColors('Polymaker', 'Panchroma Matte PLA', [], 'PETG').length === 0, 'Une couleur PLA ne doit pas fuiter dans PETG.');

const seafoamHex = getVerifiedManufacturerColorHex('Polymaker', 'Panchroma Matte PLA', 'Seafoam Green', [], 'PLA');
const emeraldHex = getVerifiedManufacturerColorHex('Polymaker', 'Panchroma Matte PLA', 'Emerald Green', [], 'PLA');
assert(seafoamHex === '#7DD4BE', 'Seafoam Green doit reprendre le HEX vérifié.');
assert(emeraldHex === '#22624F', 'Emerald Green doit reprendre le HEX vérifié.');
assert(new Set<string | null>([seafoamHex, emeraldHex]).size === 2, 'Deux couleurs fabricant distinctes doivent conserver des HEX distincts.');

const bambuHex = getManufacturerColorHex('Bambu Lab', 'PETG HF', 'Lake Blue', [], 'PETG');
assert(bambuHex === '#1F79E5', 'Le HEX Bambu PETG HF Lake Blue doit être connu.');
const qidiHex = getManufacturerColorHex('QIDI Tech', 'PETG Basic', 'Klein Blue', [], 'PETG');
assert(qidiHex === '#0065BD', 'Le HEX QIDI PETG Basic Klein Blue doit être connu.');

const learnedReferences: CatalogReferenceLike[] = [
  {
    id: 'REF-A',
    brand: 'Ma Marque',
    material: 'PLA',
    diameterMm: 1.75,
    nominalWeightGrams: 1000,
    manufacturerType: 'Ma Gamme',
    manufacturerColor: 'Mon Bleu',
    colorHex: '#123456',
  },
  {
    id: 'REF-B',
    brand: 'Ma Marque',
    material: 'PLA',
    diameterMm: 1.75,
    nominalWeightGrams: 2000,
    manufacturerType: 'Ma Gamme',
    manufacturerColor: 'Mon Rouge',
    colorHex: '#AA1122',
  },
  {
    id: 'REF-C',
    brand: 'Ma Marque',
    material: 'PETG',
    diameterMm: 1.75,
    nominalWeightGrams: 1000,
    manufacturerType: 'Ma Gamme PETG',
    manufacturerColor: 'Mon Vert',
    colorHex: '#11AA55',
  },
];

assert(getBrandOptions(learnedReferences).includes('Ma Marque'), 'Une marque déjà enregistrée doit être reproposée.');
assert(getManufacturerTypes('Ma Marque', learnedReferences, 'PLA').includes('Ma Gamme'), 'Une gamme manuelle PLA doit être reproposée sous PLA.');
assert(!getManufacturerTypes('Ma Marque', learnedReferences, 'PETG').includes('Ma Gamme'), 'Une gamme manuelle PLA ne doit pas fuiter sous PETG.');
assert(getManufacturerTypes('Ma Marque', learnedReferences, 'PETG').includes('Ma Gamme PETG'), 'Une gamme manuelle PETG doit rester sous PETG.');
assert(getManufacturerColors('Ma Marque', 'Ma Gamme', learnedReferences, 'PLA').includes('Mon Bleu'), 'Une couleur manuelle PLA doit être reproposée.');
assert(getManufacturerColors('Ma Marque', 'Ma Gamme', learnedReferences, 'PETG').length === 0, 'Une couleur manuelle PLA ne doit pas fuiter sous PETG.');
assert(getManufacturerColorHex('Ma Marque', 'Ma Gamme', 'Mon Bleu', learnedReferences, 'PLA') === '#123456', 'Le HEX enregistré doit être repris.');

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
