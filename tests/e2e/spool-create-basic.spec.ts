import { expect, test } from '@playwright/test'
import { fillNewReference, openApp, openCreateDialog, sectionToggle, setSectionOpen } from './helpers'

test('ouvre et ferme la création sans créer de bobine', async ({ page }) => {
  await openApp(page)

  let dialog = await openCreateDialog(page)
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).toBeHidden()

  dialog = await openCreateDialog(page)
  await dialog.getByRole('button', { name: 'Annuler', exact: true }).click()
  await expect(dialog).toBeHidden()

  dialog = await openCreateDialog(page)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  dialog = await openCreateDialog(page)
  await page.locator('.creation-modal-backdrop').click({ position: { x: 5, y: 5 } })
  await expect(dialog).toBeHidden()
  await expect(page.locator('article.stock-card')).toHaveCount(0)
})

test('les quatre sections se replient et mémorisent leur état', async ({ page }) => {
  await openApp(page)
  let dialog = await openCreateDialog(page)
  const sections = [
    'Filament',
    'Informations de cette bobine',
    'Quantité de filament',
    'Exemplaires physiques',
  ]

  for (const section of sections) await setSectionOpen(dialog, section, true)
  for (const section of sections) await expect(sectionToggle(dialog, section)).toHaveAttribute('aria-expanded', 'true')
  await dialog.getByRole('button', { name: 'Fermer' }).click()

  dialog = await openCreateDialog(page)
  for (const section of sections) await expect(sectionToggle(dialog, section)).toHaveAttribute('aria-expanded', 'true')
})

test('les validations essentielles refusent toute écriture', async ({ page }) => {
  await openApp(page)
  const dialog = await openCreateDialog(page)
  const save = dialog.getByRole('button', { name: 'Enregistrer 1 bobine', exact: true })

  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Marque est obligatoire')

  await fillNewReference(dialog)
  const diameter = dialog.locator('summary[aria-label="Diamètre"]').locator('..')
  await diameter.locator('summary').click()
  await diameter.getByPlaceholder('Autre diamètre…').fill('invalide')
  await diameter.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Diamètre doit être un nombre valide')

  await diameter.locator('summary').click()
  await diameter.getByRole('option', { name: '1.75', exact: true }).click()
  const weight = dialog.locator('summary[aria-label="Poids nominal"]').locator('..')
  await weight.locator('summary').click()
  await weight.getByPlaceholder('Autre poids en grammes…').fill('0')
  await weight.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Poids nominal doit être supérieur à zéro')

  await weight.locator('summary').click()
  await weight.getByRole('option', { name: '1000', exact: true }).click()
  await dialog.locator('input.color-code').fill('#12ZZ00')
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('La couleur doit être au format hexadécimal #RRGGBB')

  await dialog.locator('input.color-code').fill('#123456')
  await dialog.getByText('Réglages d’impression', { exact: true }).click()
  await dialog.getByLabel('Température buse minimale').fill('205')
  await dialog.getByLabel('Température buse maximale').fill('')
  await save.click()
  await expect(dialog.getByRole('status')).toContainText('Température buse : renseigne la valeur minimale et la valeur maximale')
  await expect(page.locator('article.stock-card')).toHaveCount(0)
})
