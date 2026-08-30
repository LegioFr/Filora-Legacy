import { useEffect, useState } from 'react'
import { FILORA_APP_NAME, FILORA_BUILD_ID, FILORA_CHANNEL } from './channel'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaRuntime() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent
      promptEvent.preventDefault()
      setInstallPrompt(promptEvent)
    }
    const onAppInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined

    let disposed = false
    let registration: ServiceWorkerRegistration | null = null
    let intervalId: number | undefined
    const cleanup: Array<() => void> = []

    const offerUpdate = (worker: ServiceWorker) => {
      if (!disposed && navigator.serviceWorker.controller) {
        setWaitingWorker(worker)
      }
    }

    const trackInstallingWorker = (worker: ServiceWorker) => {
      const onStateChange = () => {
        if (worker.state === 'installed') offerUpdate(worker)
      }
      worker.addEventListener('statechange', onStateChange)
      cleanup.push(() => worker.removeEventListener('statechange', onStateChange))
    }

    const onUpdateFound = () => {
      if (registration?.installing) trackInstallingWorker(registration.installing)
    }

    const checkForUpdate = () => {
      if (registration) void registration.update().catch(() => undefined)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }

    void navigator.serviceWorker.register(
      `/sw.js?build=${encodeURIComponent(FILORA_BUILD_ID)}`,
      { scope: '/', updateViaCache: 'none' },
    ).then((nextRegistration) => {
      if (disposed) return

      registration = nextRegistration
      if (registration.waiting) offerUpdate(registration.waiting)

      registration.addEventListener('updatefound', onUpdateFound)
      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', onVisibilityChange)
      intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)

      cleanup.push(() => registration?.removeEventListener('updatefound', onUpdateFound))
      cleanup.push(() => window.removeEventListener('focus', checkForUpdate))
      cleanup.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))
    }).catch(() => {
      // L'application reste utilisable si l'installation PWA n'est pas disponible.
    })

    return () => {
      disposed = true
      cleanup.forEach((dispose) => dispose())
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])

  async function requestInstall() {
    if (!installPrompt || installing) return
    setInstalling(true)
    try {
      await installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
    } finally {
      setInstalling(false)
    }
  }

  function applyUpdate() {
    if (!waitingWorker) return

    let reloaded = false
    const onControllerChange = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true })
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <>
      {FILORA_CHANNEL === 'test' ? (
        <div className="pwa-channel-badge" aria-label="Version de test">TEST</div>
      ) : null}
      {installPrompt && !installed ? (
        <button
          className="pwa-install-button"
          type="button"
          onClick={() => { void requestInstall() }}
          disabled={installing}
        >
          {installing ? 'Installation…' : `Installer ${FILORA_APP_NAME}`}
        </button>
      ) : null}
      {waitingWorker ? (
        <aside className="pwa-update-prompt" role="status" aria-live="polite">
          <span>
            <strong>Mise à jour disponible</strong>
            <small>La nouvelle version sera appliquée après ton accord.</small>
          </span>
          <button type="button" onClick={applyUpdate}>Mettre à jour</button>
        </aside>
      ) : null}
    </>
  )
}
