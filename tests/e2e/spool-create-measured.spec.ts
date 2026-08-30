import { expect, test } from '@playwright/test'
import {
  chooseFieldCatalogOption,
  createSpool,
  downloadBackup,
  fieldInput,
  fillNewReference,
  fillSeries,
  openApp,
  openCreateDialog,
  setSectionOpen,
  stockCard,
  submitCreation,
} from './helpers'

test('une bobine nominale n’invente aucune mesure et persiste avec son support', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'NOMINAL-ORIGINAL', support: 'original' })
  await createSpool(page, { id: 'NOMINAL-REFILL', brand: 'eSUN', support: 'reusable' })

  await page.reload()
  for (const id of ['NOMINAL-ORIGINAL', 'NOMINAL-REFILL']) {
    const card = stockCard(page, id)
    await expect(card).toContainText('1 000 g')
    await expect(card).toContainText('Nominal · non vérifié')
  }
  const backup = await downloadBackup(page)
  expect(backup.spools.find(({ id }) => id === 'NOMINAL-ORIGINAL')).toMatchObject({
    supportKind: 'original', stockBasis: 'nominal', tareWeightGrams: null,
    tareSource: null, grossMeasuredWeightGrams: null,
  })
  expect(backup.spools.find(({ id }) => id === 'NOMINAL-REFILL')?.supportKind).toBe('reusable')
})

test('une pesée manuelle calcule le restant, le pourcentage et persiste', async ({ page }) => {
  await openApp(page)
  await createSpool(page, {
    id: 'MEASURED-MANUAL', measured: { tare: '200', gross: '850' }, support: 'reusable',
  })

  const card = stockCard(page, 'MEASURED-MANUAL')
  await expect(card).toContainText('650 g')
  await expect(card).toContainText('Mesuré')
  await expect(card.locator('.progress-track > span')).toHaveAttribute('style', /65%/)
  await page.reload()
  await expect(stockCard(page, 'MEASURED-MANUAL')).toContainText('650 g')

  const backup = await downloadBackup(page)
  expect(backup.spools[0]).toMatchObject({
    supportKind: 'reusable', tareWeightGrams: 200,
    tareSource: 'measured_empty_support', grossMeasuredWeightGrams: 850, stockBasis: 'measured',
  })
})

test('un preset de tare constructeur renseigne la tare et le support original', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { brand: 'colorFabb' })
  await setSectionOpen(dialog, 'Quantité de filament')
  await dialog.getByRole('button', { name: /Je viens de la peser/ }).click()
  await chooseFieldCatalogOption(dialog, 'Bobine vide / tare de référence', 'colorFabb — Carton 750 g — 152 g')
  await expect(fieldInput(dialog, 'Poids de la bobine vide')).toHaveValue('152')
  await fieldInput(dialog, 'Poids total sur la balance').fill('902')
  await fillSeries(dialog, { id: 'MEASURED-PRESET' })
  await submitCreation(page, dialog)

  await expect(stockCard(page, 'MEASURED-PRESET')).toContainText('750 g')
  const backup = await downloadBackup(page)
  expect(backup.spools[0]).toMatchObject({ tareWeightGrams: 152, tareSource: 'manufacturer', supportKind: 'original' })
})

test('les erreurs de pesée sont refusées et la borne minimale zéro est acceptée', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await setSectionOpen(dialog, 'Quantité de filament')
  await dialog.getByRole('button', { name: /Je viens de la peser/ }).click()
  await fillSeries(dialog, { id: 'MEASURED-EDGE' })
  const save = dialog.getByRole('button', { name: 'Enregistrer 1 bobine', exact: true })

  await save.click()
  await expect(dialog.getByRole('status')).toContainText('renseigne le poids de la bobine vide')
  await fieldInput(dialog, 'Poids de la bobine vide').fill('100')
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Poids brut mesuré doit être un nombre valide')
  await fieldInput(dialog, 'Poids total sur la balance').fill('-1')
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Poids brut mesuré doit être supérieur à zéro')
  await fieldInput(dialog, 'Poids total sur la balance').fill('50')
  await save.click()
  await expect(dialog.getByRole('status')).toContainText(/tare.*poids brut/i)
  await expect(page.locator('article.stock-card')).toHaveCount(0)

  await fieldInput(dialog, 'Poids total sur la balance').fill('100')
  await submitCreation(page, dialog)
  await expect(stockCard(page, 'MEASURED-EDGE')).toContainText('0 g')
})
