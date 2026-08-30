import { defineConfig, type Plugin } from 'vite'

type FiloraChannel = 'production' | 'test'

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process

const env = runtimeProcess?.env ?? {}
const branch = env.VERCEL_GIT_COMMIT_REF ?? env.GITHUB_REF_NAME ?? ''
const channel: FiloraChannel = branch === 'main' ? 'production' : 'test'
const buildId = env.VERCEL_GIT_COMMIT_SHA ?? env.GITHUB_SHA ?? 'dev'

function manifestSource(): string {
  const test = channel === 'test'
  const prefix = test ? 'filora-test' : 'filora'
  return JSON.stringify({
    id: test ? '/filora-test' : '/filora',
    name: test ? 'Filora Test' : 'Filora',
    short_name: test ? 'Filora Test' : 'Filora',
    description: test
      ? 'Version de validation de Filora.'
      : 'Gestion locale du stock de filament.',
    lang: 'fr-FR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    prefer_related_applications: false,
    background_color: test ? '#14181f' : '#f5f5f0',
    theme_color: test ? '#14181f' : '#f5f5f0',
    icons: [
      {
        src: `/icons/${prefix}-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icons/${prefix}-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }, null, 2)
}

function serviceWorkerSource(version: string): string {
  return `const BUILD_ID = ${JSON.stringify(version)};

self.addEventListener('install', () => {
  void BUILD_ID;
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(request));
});
`
}

function pwaAssetsPlugin(): Plugin {
  return {
    name: 'filora-pwa-assets',
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
          response.end(serviceWorkerSource(url.searchParams.get('build') ?? buildId))
          return
        }

        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: manifestSource(),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorkerSource(buildId),
      })
    },
  }
}

export default defineConfig({
  define: {
    __FILORA_CHANNEL__: JSON.stringify(channel),
    __FILORA_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [pwaAssetsPlugin()],
})
