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
      name: string
      short_name: string
      start_url: string
      scope: string
      display: string
      prefer_related_applications: boolean
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>
      id?: string
    }>
  })

  expect(manifest).toMatchObject({
    name: 'Filora Test',
    short_name: 'Filora Test',
    start_url: './',
    scope: './',
    display: 'standalone',
    prefer_related_applications: false,
  })
  expect(Object.hasOwn(manifest, 'id')).toBe(false)
  expect(manifest.icons.map((icon) => icon.src)).toEqual([
    './icons/filora-test-192.png',
    './icons/filora-test-512.png',
  ])
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
  expect(manifest.icons.every((icon) => icon.type === 'image/png')).toBe(true)
  expect(manifest.icons.every((icon) => icon.purpose === 'any maskable')).toBe(true)
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

test('enregistre le service worker simple et précharge uniquement l enveloppe PWA', async ({ page }) => {
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
      activeScriptURL: registration?.active?.scriptURL ?? null,
      scope: registration?.scope ?? null,
      cacheContents,
    }
  })

  expect(state.active).toBe('activated')
  expect(state.activeScriptURL).toBe('http://127.0.0.1:4173/sw.js')
  expect(state.scope).toBe('http://127.0.0.1:4173/')
  expect(state.cacheContents).toEqual([
    {
      key: 'filora-test-v1',
      paths: [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/icons/filora-test-192.png',
        '/icons/filora-test-512.png',
      ],
    },
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

test('signale une nouvelle version de service worker puis recharge après action utilisateur', async ({ page }) => {
  await openApp(page)
  await waitForServiceWorkerControl(page)

  // Une vraie mise à jour arrive dans une session déjà contrôlée par le SW précédent.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
  await waitForServiceWorkerControl(page)

  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js?e2e-next=1', { scope: '/' })
  })

  const prompt = page.getByRole('status').filter({ hasText: 'Mise à jour disponible' })
  await expect(prompt).toContainText('Mise à jour disponible')
  const updateButton = prompt.getByRole('button', { name: 'Mettre à jour' })
  await expect(updateButton).toBeVisible()

  const navigation = page.waitForEvent('framenavigated')
  await updateButton.click()
  await navigation
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
})
