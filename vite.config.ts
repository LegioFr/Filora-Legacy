import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

type FiloraChannel = 'production' | 'test'

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process

const env = runtimeProcess?.env ?? {}
const branch = env.VERCEL_GIT_COMMIT_REF ?? env.GITHUB_REF_NAME ?? ''
const channel: FiloraChannel = branch === 'main' ? 'production' : 'test'
const test = channel === 'test'
const appName = test ? 'Filora Test' : 'Filora'
const iconPrefix = test ? 'filora-test' : 'filora'
const themeColor = test ? '#14181f' : '#f5f5f0'
const icon192 = readFileSync(resolve(process.cwd(), 'public', 'icons', `${iconPrefix}-192.png`))
const icon512 = readFileSync(resolve(process.cwd(), 'public', 'icons', `${iconPrefix}-512.png`))

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
        src: './icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: './icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }, null, 2)
}

function serviceWorkerSource(): string {
  const cacheName = test ? 'filora-test-v1' : 'filora-v1'
  return `const CACHE_NAME = ${JSON.stringify(cacheName)};
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
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

        if (url.pathname === '/icon-192.png') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'image/png')
          response.setHeader('Cache-Control', 'no-store')
          response.end(icon192)
          return
        }

        if (url.pathname === '/icon-512.png') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'image/png')
          response.setHeader('Cache-Control', 'no-store')
          response.end(icon512)
          return
        }

        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifestSource() })
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource() })
      this.emitFile({ type: 'asset', fileName: 'icon-192.png', source: icon192 })
      this.emitFile({ type: 'asset', fileName: 'icon-512.png', source: icon512 })
    },
  }
}

export default defineConfig({
  define: {
    __FILORA_CHANNEL__: JSON.stringify(channel),
  },
  plugins: [pwaAssetsPlugin()],
})
