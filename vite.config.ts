import { defineConfig, type Plugin } from 'vite'

type FiloraChannel = 'production' | 'test'

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process

const env = runtimeProcess?.env ?? {}
const branch = env.VERCEL_GIT_COMMIT_REF ?? env.GITHUB_REF_NAME ?? ''
const projectProductionUrl = (env.VERCEL_PROJECT_PRODUCTION_URL ?? '').toLowerCase()
const channel: FiloraChannel = projectProductionUrl === 'filora-test-stable.vercel.app'
  ? 'test'
  : projectProductionUrl === 'filora-app-nine.vercel.app'
    ? 'production'
    : branch === 'main'
      ? 'production'
      : 'test'
const test = channel === 'test'
const appName = test ? 'Filora Test' : 'Filora'
const iconPrefix = test ? 'filora-test' : 'filora'
const themeColor = test ? '#14181f' : '#f5f5f0'
const iconAssetVersion = '2'
const icon192 = `./icons/${iconPrefix}-192.png?v=${iconAssetVersion}`
const icon512 = `./icons/${iconPrefix}-512.png?v=${iconAssetVersion}`
const rawBuildId = env.VERCEL_GIT_COMMIT_SHA ?? env.GITHUB_SHA ?? env.VERCEL_URL ?? 'local'
const buildId = rawBuildId.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64) || 'local'

function manifestSource(): string {
  return JSON.stringify({
    name: appName,
    short_name: appName,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: themeColor,
    theme_color: themeColor,
    prefer_related_applications: false,
    icons: [
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }, null, 2)
}

function serviceWorkerSource(): string {
  const cachePrefix = test ? 'filora-test-' : 'filora-'
  const cacheName = `${cachePrefix}${buildId}`
  return `const BUILD_ID = ${JSON.stringify(buildId)};
const CACHE_PREFIX = ${JSON.stringify(cachePrefix)};
const CACHE_NAME = ${JSON.stringify(cacheName)};
const SHELL = ['./', './index.html', './manifest.webmanifest', ${JSON.stringify(icon192)}, ${JSON.stringify(icon512)}];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
`
}

function pwaAssetsPlugin(): Plugin {
  return {
    name: 'filora-pwa-assets',
    transformIndexHtml(html) {
      return html
        .replaceAll('__FILORA_APP_NAME__', appName)
        .replaceAll('__FILORA_THEME_COLOR__', themeColor)
        .replaceAll('__FILORA_ICON_192__', icon192)
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const rawUrl = Reflect.get(request, 'url')
        const url = new URL(typeof rawUrl === 'string' ? rawUrl : '/', 'http://127.0.0.1')

        if (url.pathname === '/manifest.webmanifest') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(manifestSource())
          return
        }

        if (url.pathname === '/sw.js') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(serviceWorkerSource())
          return
        }

        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifestSource() })
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource() })
    },
  }
}

export default defineConfig({
  define: {
    __FILORA_CHANNEL__: JSON.stringify(channel),
  },
  plugins: [pwaAssetsPlugin()],
})
