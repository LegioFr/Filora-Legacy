import { expect, test } from '@playwright/test'
import {
  createSpool,
  downloadBackup,
  expectStockCount,
  goToSettings,
  openApp,
  stockCard,
  uploadBackup,
} from './helpers'

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
