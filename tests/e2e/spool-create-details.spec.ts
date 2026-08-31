import { expect, test } from '@playwright/test'
import {
  addCustomFieldCatalogOption,
  chooseFieldCatalogOption,
  createSpool,
  downloadBackup,
  fieldInput,
  fillNewReference,
  fillSeries,
  openApp,
  openCreateDialog,
  selectExistingReference,
  setSectionOpen,
  stockCard,
  submitCreation,
} from './helpers'

test('enregistre achat, fournisseur personnalisé, prix, dates et nouvel emplacement', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })
  await setSectionOpen(dialog, 'Informations de cette bobine')
  await fieldInput(dialog, 'Date d’achat').fill('2026-08-01')
  await fieldInput(dialog, 'Date d’ouverture').fill('2026-08-15')
  await addCustomFieldCatalogOption(dialog, 'Fournisseur / boutique', 'Ajouter un fournisseur…', 'Boutique Démo')
  await fieldInput(dialog, 'Prix d’achat').fill('24,90')
  await addCustomFieldCatalogOption(dialog, 'Emplacement de stockage', 'Ajouter un emplacement…', 'Étagère Démo')
  await fieldInput(dialog, 'Dernier séchage').fill('2026-08-20')
  await fieldInput(dialog, 'Lien de rachat exact').fill('https://example.test/filament')
  await fillSeries(dialog, { id: 'DETAIL-CUSTOM' })
  await submitCreation(page, dialog)

  const card = stockCard(page, 'DETAIL-CUSTOM')
  await expect(card).toContainText('Bambu Lab · PLA Basic · Blue')
  await expect(card).toContainText('PLA · 1.75 mm')
  await expect(card.locator('.stock-swatch')).toHaveCSS('background-color', 'rgb(10, 41, 137)')
  await expect(card).toContainText('Étagère Démo')
  await expect(card).toContainText('Boutique Démo')
  await expect(card).toContainText('24,90 €')

  const backup = await downloadBackup(page)
  expect(backup.spools[0]).toMatchObject({
    purchaseDate: '2026-08-01', openDate: '2026-08-15', supplier: 'Boutique Démo',
    purchasePriceEuros: 24.9, lastDriedDate: '2026-08-20',
    purchaseUrl: 'https://example.test/filament',
  })
  expect(backup.locations).toEqual([expect.objectContaining({ name: 'Étagère Démo' })])
})

test('réutilise fournisseur catalogue et emplacement existant, ou laisse sans emplacement', async ({ page }) => {
  await openApp(page)
  let dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await setSectionOpen(dialog, 'Informations de cette bobine')
  await addCustomFieldCatalogOption(dialog, 'Emplacement de stockage', 'Ajouter un emplacement…', 'Rack E2E')
  await fillSeries(dialog, { id: 'DETAIL-LOC-1' })
  await submitCreation(page, dialog)

  dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { brand: 'eSUN' })
  await setSectionOpen(dialog, 'Informations de cette bobine')
  await chooseFieldCatalogOption(dialog, 'Fournisseur / boutique', 'Amazon')
  await chooseFieldCatalogOption(dialog, 'Emplacement de stockage', 'Rack E2E')
  await fieldInput(dialog, 'Lien de rachat exact').fill('http://example.test/rebuy')
  await fillSeries(dialog, { id: 'DETAIL-LOC-2' })
  await submitCreation(page, dialog)

  dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { brand: 'SUNLU' })
  await setSectionOpen(dialog, 'Informations de cette bobine')
  await chooseFieldCatalogOption(dialog, 'Emplacement de stockage', 'Étagère 1')
  await dialog.getByRole('button', { name: 'Laisser sans emplacement' }).click()
  await fillSeries(dialog, { id: 'DETAIL-NO-LOC' })
  await submitCreation(page, dialog)

  await expect(stockCard(page, 'DETAIL-LOC-2')).toContainText('Amazon')
  await expect(stockCard(page, 'DETAIL-LOC-2')).toContainText('Rack E2E')
  await expect(stockCard(page, 'DETAIL-NO-LOC').locator('.stock-meta dd').nth(1)).toHaveText('—')

  const backup = await downloadBackup(page)
  expect(backup.locations.filter(({ name }) => name === 'Rack E2E')).toHaveLength(1)
  expect(backup.spools.find(({ id }) => id === 'DETAIL-NO-LOC')?.locationId).toBeNull()
})

test('rejette une URL de rachat invalide sans écriture partielle', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await setSectionOpen(dialog, 'Informations de cette bobine')
  await fieldInput(dialog, 'Lien de rachat exact').fill('ftp://example.test/filament')
  await fillSeries(dialog, { id: 'DETAIL-BAD-URL' })
  await dialog.getByRole('button', { name: 'Enregistrer 1 bobine', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText('Le lien de rachat doit être une URL http(s) valide')
  await expect(page.locator('article.stock-card')).toHaveCount(0)
})

test('réutilise une référence existante sans la dupliquer et conserve les températures propres', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'EXISTING-1', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })

  const dialog = await openCreateDialog(page)
  await selectExistingReference(dialog, 'Bambu Lab · PLA Basic · Blue · PLA')
  await dialog.getByText('Températures pour cette bobine', { exact: true }).click()
  await fieldInput(dialog, 'Buse pour cette bobine').fill('212')
  await fieldInput(dialog, 'Plateau pour cette bobine').fill('58')
  await fillSeries(dialog, { id: 'EXISTING-2' })
  await submitCreation(page, dialog)

  await page.reload()
  await expect(stockCard(page, 'EXISTING-1')).toContainText('Bambu Lab · PLA Basic · Blue')
  await expect(stockCard(page, 'EXISTING-2')).toContainText('Bambu Lab · PLA Basic · Blue')
  const backup = await downloadBackup(page)
  expect(backup.filamentReferences).toHaveLength(1)
  expect(backup.spools.find(({ id }) => id === 'EXISTING-2')).toMatchObject({
    preferredNozzleTemperatureC: 212, preferredBedTemperatureC: 58,
  })
})
