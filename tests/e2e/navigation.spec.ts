import { expect, test } from '@playwright/test'
import { createSpool, goToSettings, goToStock, openApp } from './helpers'

test('ouvre Filora et navigue entre Stock et Réglages', async ({ page }) => {
  await openApp(page)
  await goToSettings(page)
  await goToStock(page)
  await goToSettings(page)

  await page.getByRole('link', { name: 'Filora accueil' }).click()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
})

test('les statistiques latérales suivent les données créées', async ({ page }) => {
  await openApp(page)
  await createSpool(page, { id: 'NAV-NOMINAL', manufacturerType: 'PLA Basic' })
  await createSpool(page, {
    id: 'NAV-MESUREE',
    brand: 'eSUN',
    material: 'PLA+',
    manufacturerType: 'PLA+',
    measured: { tare: '200', gross: '850' },
  })

  const stats = page.locator('.sidebar-stats')
  await expect(stats.getByText('Bobines', { exact: true }).locator('..').locator('strong')).toHaveText('2')
  await expect(stats.getByText('Mesurées', { exact: true }).locator('..').locator('strong')).toHaveText('1')
  await expect(stats.getByText('Références', { exact: true }).locator('..').locator('strong')).toHaveText('2')
})
