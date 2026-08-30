import { expect, test } from '@playwright/test'

test('Stock ouvre puis ferme la création de bobines', async ({ page }) => {
  await page.goto('/')

  const mainNavigation = page.getByRole('navigation', { name: 'Navigation principale' })
  await mainNavigation.getByRole('link', { name: /Stock$/ }).click()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()

  await page.getByRole('button', { name: 'Ajouter une bobine' }).click()
  const creationDialog = page.getByRole('dialog', { name: 'Créer une ou plusieurs bobines' })
  await expect(creationDialog).toBeVisible()

  await creationDialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(creationDialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
})
