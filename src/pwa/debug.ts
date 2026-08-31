const READY_TIMEOUT_MS = 5_000
const REFRESH_INTERVAL_MS = 1_000

type BeforeInstallPromptEventLike = Event & {
  platforms?: string[]
}

type RelatedApp = Record<string, unknown>

type NavigatorWithRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<RelatedApp[]>
}

type ReadyState =
  | { state: 'pending' }
  | { state: 'timeout'; afterMs: number }
  | { state: 'resolved'; scope: string; activeScriptURL: string | null; activeState: ServiceWorkerState | null }
  | { state: 'error'; message: string }

type ManifestState = {
  rawHref: string | null
  resolvedUrl: string | null
  requestedUrl: string | null
  status: number | null
  ok: boolean | null
  headers: {
    contentType: string | null
    cacheControl: string | null
  }
  json: unknown
  error: string | null
}

type RelatedAppsState = {
  supported: boolean
  result: RelatedApp[] | null
  error: string | null
}

function describeWorker(worker: ServiceWorker | null): { scriptURL: string; state: ServiceWorkerState } | null {
  if (!worker) return null
  return { scriptURL: worker.scriptURL, state: worker.state }
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatTime(date: Date): string {
  return date.toISOString()
}

export function mountPwaDebug() {
  if (document.getElementById('filora-pwa-debug')) return

  const startedAt = new Date()
  const beforeInstallPromptEvents: Array<{ at: string; platforms: string[] }> = []
  const appInstalledEvents: string[] = []
  let readyState: ReadyState = { state: 'pending' }
  let manifestState: ManifestState = {
    rawHref: null,
    resolvedUrl: null,
    requestedUrl: null,
    status: null,
    ok: null,
    headers: { contentType: null, cacheControl: null },
    json: null,
    error: null,
  }
  let relatedAppsState: RelatedAppsState = {
    supported: false,
    result: null,
    error: null,
  }
  let registrations: ServiceWorkerRegistration[] = []
  let refreshError: string | null = null
  let collapsed = false
  let actionStatus = ''

  const panel = document.createElement('section')
  panel.id = 'filora-pwa-debug'
  panel.setAttribute('aria-label', 'Diagnostic PWA Filora')
  panel.innerHTML = `
    <style>
      #filora-pwa-debug {
        position: fixed;
        z-index: 2147483647;
        left: 12px;
        right: 12px;
        bottom: 12px;
        max-height: 72vh;
        padding: 14px;
        border: 1px solid #475569;
        border-radius: 14px;
        background: #0f172a;
        color: #f8fafc;
        box-shadow: 0 20px 50px rgba(0,0,0,.45);
        font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      #filora-pwa-debug[data-collapsed="true"] { left: auto; max-width: 360px; }
      #filora-pwa-debug[data-collapsed="true"] .filora-pwa-debug-body { display: none; }
      #filora-pwa-debug h2 { margin: 0; font: 700 16px/1.2 system-ui, sans-serif; }
      #filora-pwa-debug p { margin: 8px 0; color: #cbd5e1; font-family: system-ui, sans-serif; }
      #filora-pwa-debug header { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
      #filora-pwa-debug .filora-pwa-debug-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
      #filora-pwa-debug button {
        border: 1px solid #64748b;
        border-radius: 8px;
        background: #1e293b;
        color: #f8fafc;
        padding: 8px 10px;
        font: 600 13px system-ui, sans-serif;
      }
      #filora-pwa-debug textarea {
        display: block;
        width: 100%;
        min-height: 38vh;
        resize: vertical;
        border: 1px solid #475569;
        border-radius: 8px;
        background: #020617;
        color: #e2e8f0;
        padding: 10px;
        white-space: pre;
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      #filora-pwa-debug .filora-pwa-debug-status { min-height: 20px; color: #7dd3fc; }
    </style>
    <header>
      <h2>Diagnostic PWA Filora</h2>
      <button type="button" data-action="collapse">Réduire</button>
    </header>
    <div class="filora-pwa-debug-body">
      <p>Laisse cet onglet ouvert au moins 60 s et interagis avec la page. Le signal <code>beforeinstallprompt</code> est écouté en continu.</p>
      <div class="filora-pwa-debug-actions">
        <button type="button" data-action="refresh">Actualiser</button>
        <button type="button" data-action="copy">Copier</button>
        <button type="button" data-action="share">Partager</button>
      </div>
      <div class="filora-pwa-debug-status" aria-live="polite"></div>
      <textarea readonly spellcheck="false" aria-label="Résultat du diagnostic PWA"></textarea>
    </div>
  `
  document.body.append(panel)

  const textarea = panel.querySelector('textarea')
  const status = panel.querySelector<HTMLElement>('.filora-pwa-debug-status')
  const collapseButton = panel.querySelector<HTMLButtonElement>('[data-action="collapse"]')

  if (!textarea || !status || !collapseButton) {
    panel.remove()
    return
  }

  const onBeforeInstallPrompt = (event: Event) => {
    const promptEvent = event as BeforeInstallPromptEventLike
    beforeInstallPromptEvents.push({
      at: formatTime(new Date()),
      platforms: Array.isArray(promptEvent.platforms) ? [...promptEvent.platforms] : [],
    })
    void refreshRuntime()
  }

  const onAppInstalled = () => {
    appInstalledEvents.push(formatTime(new Date()))
    void refreshRuntime()
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)

  async function fetchManifest() {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const rawHref = manifestLink?.getAttribute('href') ?? null
    const resolvedUrl = manifestLink?.href ?? null

    manifestState = {
      rawHref,
      resolvedUrl,
      requestedUrl: null,
      status: null,
      ok: null,
      headers: { contentType: null, cacheControl: null },
      json: null,
      error: null,
    }

    if (!resolvedUrl) {
      manifestState.error = 'Aucun <link rel="manifest"> trouvé dans le document.'
      return
    }

    try {
      const requestUrl = new URL(resolvedUrl)
      requestUrl.searchParams.set('__filora_pwa_debug', String(Date.now()))
      manifestState.requestedUrl = requestUrl.href

      const response = await fetch(requestUrl, { cache: 'no-store', credentials: 'same-origin' })
      const contentType = response.headers.get('content-type')
      const cacheControl = response.headers.get('cache-control')
      const text = await response.text()

      manifestState.status = response.status
      manifestState.ok = response.ok
      manifestState.headers = { contentType, cacheControl }

      try {
        manifestState.json = JSON.parse(text) as unknown
      } catch (error) {
        manifestState.error = `Réponse manifest non JSON: ${messageFrom(error)}`
        manifestState.json = text
      }
    } catch (error) {
      manifestState.error = messageFrom(error)
    }
  }

  async function readRelatedApps() {
    const relatedNavigator = navigator as NavigatorWithRelatedApps
    relatedAppsState = {
      supported: typeof relatedNavigator.getInstalledRelatedApps === 'function',
      result: null,
      error: null,
    }

    if (!relatedAppsState.supported || !relatedNavigator.getInstalledRelatedApps) return

    try {
      relatedAppsState.result = await relatedNavigator.getInstalledRelatedApps()
    } catch (error) {
      relatedAppsState.error = messageFrom(error)
    }
  }

  async function refreshRegistrations() {
    if (!('serviceWorker' in navigator)) {
      registrations = []
      return
    }

    try {
      registrations = await navigator.serviceWorker.getRegistrations()
      refreshError = null
    } catch (error) {
      registrations = []
      refreshError = messageFrom(error)
    }
  }

  function buildReport() {
    const now = new Date()
    const controller = 'serviceWorker' in navigator ? navigator.serviceWorker.controller : null
    const report = {
      collectedAt: formatTime(now),
      diagnostic: {
        startedAt: formatTime(startedAt),
        elapsedSeconds: Math.round((now.getTime() - startedAt.getTime()) / 1000),
        note: 'beforeinstallprompt = événements reçus depuis le chargement du module ?pwa-debug=1',
      },
      page: {
        href: window.location.href,
        origin: window.location.origin,
        secureContext: window.isSecureContext,
        visibilityState: document.visibilityState,
        userAgent: navigator.userAgent,
      },
      manifest: manifestState,
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        controller: describeWorker(controller),
        ready: readyState,
        registrations: registrations.map((registration) => ({
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
          installing: describeWorker(registration.installing),
          waiting: describeWorker(registration.waiting),
          active: describeWorker(registration.active),
        })),
        refreshError,
      },
      installation: {
        beforeinstallprompt: {
          received: beforeInstallPromptEvents.length > 0,
          events: beforeInstallPromptEvents,
        },
        appinstalled: {
          received: appInstalledEvents.length > 0,
          events: appInstalledEvents,
        },
        displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
        navigatorStandalone: Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
        installedRelatedApps: relatedAppsState,
      },
    }

    return JSON.stringify(report, null, 2)
  }

  function render() {
    textarea.value = buildReport()
    status.textContent = actionStatus
    panel.dataset.collapsed = String(collapsed)
    collapseButton.textContent = collapsed ? 'Ouvrir' : 'Réduire'
  }

  async function refreshRuntime() {
    await refreshRegistrations()
    render()
  }

  async function copyReport() {
    const text = buildReport()
    try {
      await navigator.clipboard.writeText(text)
      actionStatus = 'Diagnostic copié.'
    } catch {
      textarea.focus()
      textarea.select()
      const copied = document.execCommand('copy')
      actionStatus = copied ? 'Diagnostic copié.' : 'Copie automatique impossible : sélectionne le texte manuellement.'
    }
    render()
  }

  async function shareReport() {
    const text = buildReport()
    if (typeof navigator.share !== 'function') {
      await copyReport()
      return
    }

    try {
      await navigator.share({ title: 'Diagnostic PWA Filora', text })
      actionStatus = 'Diagnostic partagé.'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        actionStatus = 'Partage annulé.'
      } else {
        actionStatus = `Partage impossible : ${messageFrom(error)}`
      }
    }
    render()
  }

  panel.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]')
    if (!button) return

    switch (button.dataset.action) {
      case 'collapse':
        collapsed = !collapsed
        render()
        break
      case 'refresh':
        actionStatus = 'Actualisation…'
        void Promise.all([fetchManifest(), readRelatedApps(), refreshRuntime()]).then(() => {
          actionStatus = 'Diagnostic actualisé.'
          render()
        })
        break
      case 'copy':
        void copyReport()
        break
      case 'share':
        void shareReport()
        break
    }
  })

  if ('serviceWorker' in navigator) {
    void Promise.race([
      navigator.serviceWorker.ready.then((registration) => ({
        state: 'resolved' as const,
        scope: registration.scope,
        activeScriptURL: registration.active?.scriptURL ?? null,
        activeState: registration.active?.state ?? null,
      })),
      new Promise<ReadyState>((resolve) => {
        window.setTimeout(() => resolve({ state: 'timeout', afterMs: READY_TIMEOUT_MS }), READY_TIMEOUT_MS)
      }),
    ]).then((state) => {
      readyState = state
      render()
    }).catch((error) => {
      readyState = { state: 'error', message: messageFrom(error) }
      render()
    })

    void navigator.serviceWorker.ready.then((registration) => {
      readyState = {
        state: 'resolved',
        scope: registration.scope,
        activeScriptURL: registration.active?.scriptURL ?? null,
        activeState: registration.active?.state ?? null,
      }
      render()
    }).catch((error) => {
      readyState = { state: 'error', message: messageFrom(error) }
      render()
    })
  } else {
    readyState = { state: 'error', message: 'Service Worker API indisponible.' }
  }

  void Promise.all([fetchManifest(), readRelatedApps(), refreshRuntime()]).then(render)
  const intervalId = window.setInterval(() => { void refreshRuntime() }, REFRESH_INTERVAL_MS)

  window.addEventListener('pagehide', () => {
    window.clearInterval(intervalId)
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  }, { once: true })

  render()
}
