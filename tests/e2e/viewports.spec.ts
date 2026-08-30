import { expect, test, type Page } from '@playwright/test'
import { createSpool, goToSettings, goToStock, openApp, openCreateDialog, stockCard } from './helpers'

const VIEWPORTS = [
  { name: 'MOBILE', width: 390, height: 844, spoolId: 'VIEWPORT-MOBILE' },
  { name: 'TABLETTE', width: 800, height: 1280, spoolId: 'VIEWPORT-TABLETTE' },
  { name: 'PC', width: 1440, height: 900, spoolId: 'VIEWPORT-PC' },
  { name: 'ULTRA-WIDE', width: 2560, height: 1080, spoolId: 'VIEWPORT-ULTRAWIDE' },
] as const

async function expectNoGlobalHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.pageWidth, `largeur du document ${dimensions.pageWidth}px pour ${dimensions.viewportWidth}px disponibles`)
    .toBeLessThanOrEqual(dimensions.viewportWidth + 1)
}

async function holdFinalStateForVisibleDemo(page: Page): Promise<void> {
  if (process.env.FILORA_VIEWPORT_DEMO !== '1') return
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2_000)))
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} ${viewport.width}x${viewport.height} garde les parcours critiques utilisables`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openApp(page)

    const navigation = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(navigation).toBeVisible()
    await expect(navigation.getByRole('link', { name: /Stock$/ })).toBeInViewport()
    await expect(navigation.getByRole('link', { name: /Réglages$/ })).toBeInViewport()
    await expectNoGlobalHorizontalOverflow(page)

    const dialog = await openCreateDialog(page)
    const closeButton = dialog.getByRole('button', { name: 'Fermer' })
    const cancelButton = dialog.getByRole('button', { name: 'Annuler', exact: true })
    const saveButton = dialog.getByRole('button', { name: 'Enregistrer 1 bobine', exact: true })
    await expect(closeButton).toBeInViewport()
    await expect(cancelButton).toBeInViewport()
    await expect(saveButton).toBeInViewport()
    await expect(saveButton).toBeEnabled()
    await expectNoGlobalHorizontalOverflow(page)
    await cancelButton.click()
    await expect(dialog).toBeHidden()

    await createSpool(page, {
      id: viewport.spoolId,
      manufacturerType: 'PLA Basic',
      manufacturerColor: 'Blue',
    })
    const card = stockCard(page, viewport.spoolId)
    await expect(card).toBeInViewport()
    await expect(card.getByRole('button', { name: 'Modifier la référence' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Changer le filament' })).toBeVisible()
    await expectNoGlobalHorizontalOverflow(page)

    await goToSettings(page)
    await expect(page.getByRole('button', { name: 'Télécharger la sauvegarde' })).toBeVisible()
    await expectNoGlobalHorizontalOverflow(page)
    await goToStock(page)
    await expect(card).toBeVisible()
    await expectNoGlobalHorizontalOverflow(page)
    await holdFinalStateForVisibleDemo(page)
  })
}
