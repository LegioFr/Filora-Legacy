import { expect, test, type Page } from '@playwright/test'
import {
  addCustomAriaCatalogOption,
  createSpool,
  downloadBackup,
  expectStockCount,
  fillSeries,
  goToSettings,
  openApp,
  openCreateDialog,
  stockCard,
  submitCreation,
  uploadBackup,
} from './helpers'

async function createCustomCatalogSpool(page: Page, id: string, brand: string): Promise<void> {
  const dialog = await openCreateDialog(page)
  await addCustomAriaCatalogOption(dialog, 'Marque', 'Ajouter une marque…', brand)
  await addCustomAriaCatalogOption(dialog, 'Matière', 'Ajouter une matière…', `PLA ${brand}`)
  await addCustomAriaCatalogOption(dialog, 'Diamètre', 'Autre diamètre…', '2.00')
  await addCustomAriaCatalogOption(dialog, 'Poids nominal', 'Autre poids en grammes…', '750')
  await fillSeries(dialog, { id })
  await submitCreation(page, dialog)
}

test('télécharge un JSON parseable contenant le stock créé par l’interface', async ({ page }) => {
  await openApp(page)
  await createSpool(page, {
    id: 'BACKUP-E2E', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue',
    measured: { tare: '200', gross: '700' }, notes: 'Présente dans la sauvegarde',
  })

  const backup = await downloadBackup(page)
  expect(backup.format).toBe('filora-backup')
  expect(backup.version).toBe(2)
  expect(backup.spools).toEqual([
    expect.objectContaining({ id: 'BACKUP-E2E', notes: 'Présente dans la sauvegarde', stockBasis: 'measured' }),
  ])
  expect(backup.filamentReferences).toEqual([
    expect.objectContaining({ brand: 'Bambu Lab', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' }),
  ])
})

test('valide sans modifier, annule, puis restaure réellement un état antérieur', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'RESTORE-A', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })
  const backupA = await downloadBackup(page)
  await page.getByRole('link', { name: /Stock$/ }).click()
  await createSpool(page, { id: 'RESTORE-B', brand: 'eSUN' })
  await expectStockCount(page, 2)

  await uploadBackup(page, JSON.stringify(backupA), 'stock-a.json')
  await expect(page.getByRole('status')).toContainText("Sauvegarde valide : 1 bobine. Aucune donnée n'a encore été modifiée")
  await page.getByRole('link', { name: /Stock$/ }).click()
  await expect(stockCard(page, 'RESTORE-A')).toBeVisible()
  await expect(stockCard(page, 'RESTORE-B')).toBeVisible()

  await goToSettings(page)
  page.once('dialog', async (confirmation) => {
    expect(confirmation.message()).toContain('remplacera entièrement le stock local par 1 bobine')
    await confirmation.dismiss()
  })
  await page.getByRole('button', { name: 'Restaurer et remplacer le stock' }).click()
  await page.getByRole('link', { name: /Stock$/ }).click()
  await expect(stockCard(page, 'RESTORE-B')).toBeVisible()
  await expectStockCount(page, 2)

  await uploadBackup(page, JSON.stringify(backupA), 'stock-a.json')
  page.once('dialog', async (confirmation) => confirmation.accept())
  await page.getByRole('button', { name: 'Restaurer et remplacer le stock' }).click()
  await expect(page.getByRole('status')).toContainText('Restauration terminée')
  await page.getByRole('link', { name: /Stock$/ }).click()
  await expectStockCount(page, 1)
  await expect(stockCard(page, 'RESTORE-A')).toBeVisible()
  await expect(stockCard(page, 'RESTORE-B')).toHaveCount(0)

  await page.reload()
  await expectStockCount(page, 1)
  await expect(stockCard(page, 'RESTORE-A')).toBeVisible()
})

test('rollback navigateur restaure IndexedDB et le catalogue après une panne inter-stockages', async ({ page, browser }) => {
  await openApp(page)
  await createCustomCatalogSpool(page, 'ROLLBACK-KEEP', 'Ancienne Marque')

  const targetContext = await browser.newContext()
  try {
    const targetPage = await targetContext.newPage()
    await openApp(targetPage)
    await createCustomCatalogSpool(targetPage, 'ROLLBACK-TARGET', 'Nouvelle Marque')
    const targetBackup = await downloadBackup(targetPage)
    const targetCatalog = (targetBackup as typeof targetBackup & {
      personalCatalog?: { customOptions: Record<string, string[]> }
    }).personalCatalog
    expect(targetCatalog?.customOptions.brand).toContain('Nouvelle Marque')

    await uploadBackup(page, JSON.stringify(targetBackup), 'rollback-target.json')
    await expect(page.getByRole('status')).toContainText('Sauvegarde valide : 1 bobine')

    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem
      let failNextCatalogWrite = true
      Storage.prototype.setItem = function (key: string, value: string): void {
        if (failNextCatalogWrite && key.startsWith('filora.catalog.custom.v1:')) {
          failNextCatalogWrite = false
          Storage.prototype.setItem = originalSetItem
          throw new Error('Injected Playwright personal catalog write failure')
        }
        originalSetItem.call(this, key, value)
      }
    })

    page.once('dialog', async (confirmation) => confirmation.accept())
    await page.getByRole('button', { name: 'Restaurer et remplacer le stock' }).click()
    await expect(page.getByRole('status')).toContainText('Injected Playwright personal catalog write failure')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
    await expectStockCount(page, 1)
    await expect(stockCard(page, 'ROLLBACK-KEEP')).toBeVisible()
    await expect(stockCard(page, 'ROLLBACK-TARGET')).toHaveCount(0)

    const dialog = await openCreateDialog(page)
    const brandSummary = dialog.locator('summary[aria-label="Marque"]')
    await brandSummary.click()
    await expect(dialog.getByRole('option', { name: 'Ancienne Marque', exact: true })).toBeVisible()
    await expect(dialog.getByRole('option', { name: 'Nouvelle Marque', exact: true })).toHaveCount(0)
  } finally {
    await targetContext.close()
  }
})

test('refuse un JSON invalide sans altérer le stock existant', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'INVALID-KEEP' })
  await uploadBackup(page, '{ ceci nest pas du json', 'invalide.json')

  const status = page.getByRole('status')
  await expect(status).toBeVisible()
  await expect(status).not.toContainText('Sauvegarde valide')
  await expect(page.getByRole('button', { name: 'Restaurer et remplacer le stock' })).toHaveCount(0)
  await page.getByRole('link', { name: /Stock$/ }).click()
  await expectStockCount(page, 1)
  await expect(stockCard(page, 'INVALID-KEEP')).toBeVisible()
})
