import { expect, test } from '@playwright/test'
import { createSpool, expectStockCount, openApp, stockCard } from './helpers'

test('le premier contexte crée une donnée portant un ID fixe', async ({ page, context }) => {
  await openApp(page)
  expect(context.browser()).not.toBeNull()
  await createSpool(page, { id: 'ISOLATION-FIXE' })
  await expectStockCount(page, 1)
})

test('un autre contexte ne voit pas la donnée et peut réutiliser le même ID', async ({ page, context }) => {
  await openApp(page)
  expect(context.browser()).not.toBeNull()
  await expect(stockCard(page, 'ISOLATION-FIXE')).toHaveCount(0)
  await expectStockCount(page, 0)
  await createSpool(page, { id: 'ISOLATION-FIXE', brand: 'eSUN' })
  await expectStockCount(page, 1)
})
