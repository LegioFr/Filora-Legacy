import { expect, test } from '@playwright/test'
import {
  addCustomAriaCatalogOption,
  downloadBackup,
  fillSeries,
  openApp,
  openCreateDialog,
  submitCreation,
} from './helpers'

test('le catalogue met à jour les choix dépendants et leurs valeurs par défaut', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)

  await dialog.locator('summary[aria-label="Marque"]').click()
  await dialog.getByRole('option', { name: 'Bambu Lab', exact: true }).click()
  await expect(dialog.locator('summary[aria-label="Matière"]')).toContainText('PLA')
  await expect(dialog.locator('summary[aria-label="Diamètre"]')).toContainText('1.75')
  await expect(dialog.locator('summary[aria-label="Poids nominal"]')).toContainText('1000')

  await dialog.locator('summary[aria-label="Matière"]').click()
  await dialog.getByRole('option', { name: 'PETG', exact: true }).click()
  await dialog.locator('summary[aria-label="Gamme ou type de filament fabricant"]').click()
  await expect(dialog.getByRole('option', { name: 'PETG HF', exact: true })).toBeVisible()
  await expect(dialog.getByRole('option', { name: 'PLA Basic', exact: true })).toHaveCount(0)
  await dialog.getByRole('option', { name: 'PETG HF', exact: true }).click()
  await dialog.locator('summary[aria-label="Couleur fabricant"]').click()
  await expect(dialog.getByRole('option', { name: 'Red', exact: true })).toBeVisible()

  await dialog.locator('summary[aria-label="Matière"]').click()
  await dialog.getByRole('option', { name: 'PLA', exact: true }).click()
  await dialog.locator('summary[aria-label="Gamme ou type de filament fabricant"]').click()
  await dialog.getByRole('option', { name: 'PLA Basic', exact: true }).click()
  await dialog.locator('summary[aria-label="Couleur fabricant"]').click()
  await dialog.getByRole('option', { name: 'Blue', exact: true }).click()
  await expect(dialog.locator('input.color-code')).toHaveValue('#0A2989')
  await expect(dialog.getByLabel('Température buse minimale')).toHaveValue('190')
  await expect(dialog.getByLabel('Température buse maximale')).toHaveValue('230')
  await expect(dialog.getByLabel('Température plateau minimale')).toHaveValue('35')
  await expect(dialog.getByLabel('Température plateau maximale')).toHaveValue('45')

  await dialog.getByRole('button', { name: 'Utiliser la couleur #EF4444' }).click()
  await expect(dialog.locator('input.color-code')).toHaveValue('#EF4444')
})

test('une référence personnalisée et tous les réglages d’impression sont conservés', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await addCustomAriaCatalogOption(dialog, 'Marque', 'Ajouter une marque…', 'Filora Démo')
  await addCustomAriaCatalogOption(dialog, 'Matière', 'Ajouter une matière…', 'PLA Démo')
  await addCustomAriaCatalogOption(dialog, 'Diamètre', 'Autre diamètre…', '2.00')
  await addCustomAriaCatalogOption(dialog, 'Gamme ou type de filament fabricant', 'Ajouter une gamme / un type…', 'Série Démo')
  await addCustomAriaCatalogOption(dialog, 'Couleur fabricant', 'Ajouter une couleur…', 'Bleu Démo')
  await dialog.locator('input.color-code').fill('#123ABC')
  await addCustomAriaCatalogOption(dialog, 'Poids nominal', 'Autre poids en grammes…', '750')

  await dialog.getByText('Réglages d’impression', { exact: true }).click()
  const values: Array<[string, string]> = [
    ['Température buse minimale', '195'], ['Température buse maximale', '225'],
    ['Température plateau minimale', '45'], ['Température plateau maximale', '60'],
    ['Chambre', '35'], ['Première couche', '210'], ['Vitesse', '120'], ['Débit', '98'],
    ['Rapport de flux', '0.97'], ['Pressure Advance / K', '0.025'],
    ['Vitesse volumétrique', '18'], ['Ventilation', '80'], ['Rétraction', '0.8'],
    ['Vitesse rétraction', '35'], ['Buse pour cette bobine', '207'], ['Plateau pour cette bobine', '57'],
  ]
  for (const [label, value] of values) {
    const input = label.startsWith('Température')
      ? dialog.getByLabel(label, { exact: true })
      : dialog.locator('label').filter({ hasText: label }).locator('input').first()
    await input.fill(value)
  }
  await fillSeries(dialog, { id: 'REF-CUSTOM' })
  await submitCreation(page, dialog)

  const backup = await downloadBackup(page)
  expect(backup.filamentReferences).toHaveLength(1)
  expect(backup.filamentReferences[0]).toMatchObject({
    brand: 'Filora Démo', material: 'PLA Démo', diameterMm: 2,
    manufacturerType: 'Série Démo', manufacturerColor: 'Bleu Démo',
    colorHex: '#123ABC', nominalWeightGrams: 750,
    nozzleTemperatureC: { min: 195, max: 225 }, bedTemperatureC: { min: 45, max: 60 },
    printSettings: {
      chamberTemperatureC: 35, firstLayerTemperatureC: 210, printSpeedMmPerSecond: 120,
      flowPercent: 98, flowRatio: 0.97, pressureAdvance: 0.025,
      maxVolumetricSpeedMm3PerSecond: 18, fanPercent: 80,
      retractionMm: 0.8, retractionSpeedMmPerSecond: 35,
    },
  })
  expect(backup.spools[0]).toMatchObject({
    id: 'REF-CUSTOM', preferredNozzleTemperatureC: 207, preferredBedTemperatureC: 57,
  })
})
