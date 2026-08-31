import { expect, test } from '@playwright/test'
import {
  addCustomAriaCatalogOption,
  createSpool,
  downloadBackup,
  fillSeries,
  openApp,
  openCreateDialog,
  selectExistingReference,
  stockCard,
  submitCreation,
} from './helpers'

async function createSecondBlueSpool(page: Parameters<typeof openApp>[0], id: string): Promise<void> {
  const dialog = await openCreateDialog(page)
  await selectExistingReference(dialog, 'Bambu Lab · PLA Basic · Blue · PLA')
  await fillSeries(dialog, { id })
  await submitCreation(page, dialog)
}

test('modifie une référence liée à une seule bobine et persiste', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'EDIT-SINGLE', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })
  await stockCard(page, 'EDIT-SINGLE').getByRole('button', { name: 'Modifier la référence' }).click()

  const edit = page.getByRole('dialog', { name: 'Modifier la référence filament' })
  await expect(edit).toContainText('Cette référence est liée à 1 bobine')
  await addCustomAriaCatalogOption(edit, 'Couleur fabricant', 'Ajouter une couleur…', 'Violet E2E')
  await edit.locator('input.color-code').fill('#7C3AED')
  await edit.getByRole('button', { name: 'Enregistrer la correction' }).click()

  await expect(edit).toBeHidden()
  await expect(stockCard(page, 'EDIT-SINGLE')).toContainText('Violet E2E')
  await page.reload()
  await expect(stockCard(page, 'EDIT-SINGLE')).toContainText('Violet E2E')
})

test('une correction partagée peut être annulée puis s’applique à toutes les bobines', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'EDIT-SHARED-1', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })
  await createSecondBlueSpool(page, 'EDIT-SHARED-2')

  await stockCard(page, 'EDIT-SHARED-1').getByRole('button', { name: 'Modifier la référence' }).click()
  let edit = page.getByRole('dialog', { name: 'Modifier la référence filament' })
  await expect(edit).toContainText('Cette référence est liée à 2 bobines')
  await edit.getByRole('button', { name: 'Annuler' }).click()
  await expect(edit).toBeHidden()
  await expect(stockCard(page, 'EDIT-SHARED-1')).toContainText('Blue')

  await stockCard(page, 'EDIT-SHARED-1').getByRole('button', { name: 'Modifier la référence' }).click()
  edit = page.getByRole('dialog', { name: 'Modifier la référence filament' })
  await addCustomAriaCatalogOption(edit, 'Couleur fabricant', 'Ajouter une couleur…', 'Orange corrigé')
  await edit.locator('input.color-code').fill('#F97316')

  page.once('dialog', async (confirmation) => {
    expect(confirmation.message()).toContain('utilisée par 2 bobines')
    await confirmation.dismiss()
  })
  await edit.getByRole('button', { name: 'Enregistrer la correction' }).click()
  await expect(edit).toBeVisible()
  await expect(stockCard(page, 'EDIT-SHARED-1')).toContainText('Blue')
  await expect(stockCard(page, 'EDIT-SHARED-2')).toContainText('Blue')

  page.once('dialog', async (confirmation) => confirmation.accept())
  await edit.getByRole('button', { name: 'Enregistrer la correction' }).click()
  await expect(edit).toBeHidden()
  for (const id of ['EDIT-SHARED-1', 'EDIT-SHARED-2']) {
    await expect(stockCard(page, id)).toContainText('Orange corrigé')
  }
  await page.reload()
  for (const id of ['EDIT-SHARED-1', 'EDIT-SHARED-2']) {
    await expect(stockCard(page, id)).toContainText('Orange corrigé')
  }
})

test('change une seule bobine vers une référence existante puis vers une nouvelle', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'REASSIGN-A1', manufacturerType: 'PLA Basic', manufacturerColor: 'Blue' })
  await createSecondBlueSpool(page, 'REASSIGN-A2')
  await createSpool(page, { id: 'REASSIGN-B', manufacturerType: 'PLA Basic', manufacturerColor: 'Bambu Green' })

  await stockCard(page, 'REASSIGN-A1').getByRole('button', { name: 'Changer le filament' }).click()
  let dialog = page.getByRole('dialog', { name: 'Changer le filament de cette bobine' })
  await dialog.locator('label').filter({ hasText: 'Nouvelle référence' }).locator('select').selectOption({
    label: 'Bambu Lab · PLA Basic · Bambu Green · PLA',
  })
  await dialog.getByRole('button', { name: 'Changer cette bobine uniquement' }).click()
  await expect(stockCard(page, 'REASSIGN-A1')).toContainText('Bambu Green')
  await expect(stockCard(page, 'REASSIGN-A2')).toContainText('Blue')

  await stockCard(page, 'REASSIGN-A2').getByRole('button', { name: 'Changer le filament' }).click()
  dialog = page.getByRole('dialog', { name: 'Changer le filament de cette bobine' })
  await dialog.getByRole('button', { name: 'Nouvelle référence', exact: true }).click()
  await dialog.locator('summary[aria-label="Marque"]').click()
  await dialog.getByRole('option', { name: 'eSUN', exact: true }).click()
  await dialog.locator('input.color-code').fill('#14B8A6')
  await dialog.getByRole('button', { name: 'Changer cette bobine uniquement' }).click()

  await expect(stockCard(page, 'REASSIGN-A1')).toContainText('Bambu Green')
  await expect(stockCard(page, 'REASSIGN-A2')).toContainText('eSUN')
  await expect(stockCard(page, 'REASSIGN-B')).toContainText('Bambu Green')
  await page.reload()
  await expect(stockCard(page, 'REASSIGN-A1')).toContainText('Bambu Green')
  await expect(stockCard(page, 'REASSIGN-A2')).toContainText('eSUN')

  const backup = await downloadBackup(page)
  const a1 = backup.spools.find(({ id }) => id === 'REASSIGN-A1')
  const a2 = backup.spools.find(({ id }) => id === 'REASSIGN-A2')
  const b = backup.spools.find(({ id }) => id === 'REASSIGN-B')
  expect(a1?.filamentReferenceId).toBe(b?.filamentReferenceId)
  expect(a2?.filamentReferenceId).not.toBe(a1?.filamentReferenceId)
})
