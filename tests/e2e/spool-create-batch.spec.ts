import { expect, test } from '@playwright/test'
import {
  downloadBackup,
  expectStockCount,
  fieldInput,
  fillNewReference,
  fillSeries,
  openApp,
  openCreateDialog,
  setSectionOpen,
  stockCard,
  submitCreation,
} from './helpers'

test('les boutons quantité respectent les limites 1 et 20 et refusent les hors limites', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await setSectionOpen(dialog, 'Exemplaires physiques')
  const quantity = fieldInput(dialog, 'Nombre de bobines')
  const stepper = dialog.locator('.quantity-stepper')

  await expect(quantity).toHaveValue('1')
  await stepper.getByRole('button').first().click()
  await expect(quantity).toHaveValue('1')
  await quantity.fill('20')
  await stepper.getByRole('button').last().click()
  await expect(quantity).toHaveValue('20')
  await expect(dialog.locator('.id-preview')).toContainText('20')

  await quantity.fill('0')
  await dialog.getByRole('button', { name: 'Enregistrer 0 bobine', exact: true }).click()
  expect(await quantity.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false)
  await expect(dialog).toBeVisible()
  await quantity.fill('21')
  await dialog.getByRole('button', { name: 'Enregistrer 21 bobines', exact: true }).click()
  expect(await quantity.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false)
  await expect(dialog).toBeVisible()
  await expect(page.locator('article.stock-card')).toHaveCount(0)
})

test('crée un lot avec IDs automatiques et le persiste', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { manufacturerType: 'PLA Basic' })
  await fillSeries(dialog, { quantity: 3, notes: 'Lot automatique E2E' })
  await expect(dialog.locator('.id-preview')).toContainText('SP-0001 · SP-0002 · SP-0003')
  await submitCreation(page, dialog, 3)
  await expectStockCount(page, 3)
  for (const id of ['SP-0001', 'SP-0002', 'SP-0003']) await expect(stockCard(page, id)).toBeVisible()

  await page.reload()
  await expectStockCount(page, 3)
  const backup = await downloadBackup(page)
  expect(backup.spools.map(({ id }) => id).sort()).toEqual(['SP-0001', 'SP-0002', 'SP-0003'])
  expect(backup.spools.every(({ notes }) => notes === 'Lot automatique E2E')).toBe(true)
})

test('un premier ID personnalisé produit exactement le lot attendu', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await fillSeries(dialog, { id: 'LOT-CUSTOM', quantity: 3, notes: 'Trois bobines' })
  await expect(dialog.locator('.id-preview')).toContainText('LOT-CUSTOM · SP-0001 · SP-0002')
  await submitCreation(page, dialog, 3)
  await expectStockCount(page, 3)
  for (const id of ['LOT-CUSTOM', 'SP-0001', 'SP-0002']) await expect(stockCard(page, id)).toBeVisible()
})

test('une validation de lot échouée ne produit aucune écriture partielle', async ({ page }) => {
  await openApp(page)
  let dialog = await openCreateDialog(page)
  await fillNewReference(dialog)
  await fillSeries(dialog, { id: 'DUPLICATE' })
  await submitCreation(page, dialog)

  dialog = await openCreateDialog(page)
  await fillNewReference(dialog, { brand: 'eSUN' })
  await fillSeries(dialog, { id: 'DUPLICATE', quantity: 3 })
  await dialog.getByRole('button', { name: 'Enregistrer 3 bobines', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText(/DUPLICATE.*existe déjà/i)
  await expectStockCount(page, 1)
})
