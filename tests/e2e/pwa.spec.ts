import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

async function waitForServiceWorkerControl(page: Parameters<typeof openApp>[0]) {
  await expect.poll(async () => page.evaluate(async () => {
    await navigator.serviceWorker.ready
    return Boolean(navigator.serviceWorker.controller)
  })).toBe(true)
}

test('expose un manifeste installable clairement identifié Filora Test', async ({ page }) => {
  await openApp(page)

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest', { cache: 'no-store' })
    return response.json() as Promise<{
      id: string
      name: string
      short_name: string
      start_url: string
      scope: string
      display: string
      prefer_related_applications: boolean
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>
    }>
  })

  expect(manifest).toMatchObject({
    id: '/filora-test',
    name: 'Filora Test',
    short_name: 'Filora Test',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    prefer_related_applications: false,
  })
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
  expect(manifest.icons.every((icon) => icon.type === 'image/png')).toBe(true)
  expect(manifest.icons.every((icon) => icon.purpose === 'any')).toBe(true)
  await expect(page.getByLabel('Version de test')).toHaveText('TEST')
  await expect(page).toHaveTitle('Filora Test')
})

test('affiche le vrai bouton d installation uniquement quand Chrome fournit beforeinstallprompt', async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('button', { name: 'Installer Filora Test' })).toHaveCount(0)

  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>
    }
    event.prompt = async () => {
      document.documentElement.dataset.installPromptCalled = 'yes'
    }
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(event)
  })

  const installButton = page.getByRole('button', { name: 'Installer Filora Test' })
  await expect(installButton).toBeVisible()
  await installButton.click()
  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.installPromptCalled)).toBe('yes')
})

test('enregistre un service worker avec uniquement le cache shell hors ligne Filora', async ({ page }) => {
  await openApp(page)
  await waitForServiceWorkerControl(page)

  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/')
    const cacheKeys = await caches.keys()
    const cacheContents = await Promise.all(cacheKeys.map(async (key) => {
      const cache = await caches.open(key)
      const requests = await cache.keys()
      return { key, paths: requests.map((request) => new URL(request.url).pathname) }
    }))
    return {
      active: registration?.active?.state ?? null,
      scope: registration?.scope ?? null,
      cacheContents,
    }
  })

  expect(state.active).toBe('activated')
  expect(state.scope).toBe('http://127.0.0.1:4173/')
  expect(state.cacheContents).toEqual([
    { key: 'filora-shell-v1', paths: ['/offline.html'] },
  ])
})

test('Chromium ne signale aucune erreur d installabilite PWA', async ({ page, context }) => {
  await openApp(page)
  await waitForServiceWorkerControl(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()

  const session = await context.newCDPSession(page)
  const result = await session.send('Page.getInstallabilityErrors') as {
    installabilityErrors: Array<{ errorId: string; errorArguments: Array<{ name: string; value: string }> }>
  }
  expect(result.installabilityErrors).toEqual([])
})

test('propose explicitement une mise à jour et ne l applique qu après action utilisateur', async ({ page }) => {
  await openApp(page)
  await waitForServiceWorkerControl(page)

  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js?build=e2e-next', {
      scope: '/',
      updateViaCache: 'none',
    })
  })

  const prompt = page.getByRole('status').filter({ hasText: 'Mise à jour disponible' })
  await expect(prompt).toContainText('Mise à jour disponible')
  await expect(prompt.getByRole('button', { name: 'Mettre à jour' })).toBeVisible()

  const navigation = page.waitForEvent('framenavigated')
  await prompt.getByRole('button', { name: 'Mettre à jour' }).click()
  await navigation
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
})
