import { useEffect, useRef, useState } from 'react'
import { FILORA_APP_NAME, FILORA_CHANNEL } from './channel'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaRuntime() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [installing, setInstalling] = useState(false)
  const [applyingUpdate, setApplyingUpdate] = useState(false)
  const reloadAfterActivation = useRef(false)

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
    let installingWorker: ServiceWorker | null = null
    let intervalId: number | undefined

    const exposeWaitingWorker = (worker: ServiceWorker | null) => {
      if (disposed || !worker || !navigator.serviceWorker.controller) return
      setWaitingWorker(worker)
      setUpdateAvailable(true)
    }

    const onInstallingStateChange = () => {
      if (installingWorker?.state === 'installed') {
        exposeWaitingWorker(installingWorker)
      }
    }

    const onUpdateFound = () => {
      installingWorker?.removeEventListener('statechange', onInstallingStateChange)
      installingWorker = registration?.installing ?? null
      installingWorker?.addEventListener('statechange', onInstallingStateChange)
    }

    const checkForUpdate = () => {
      if (registration) void registration.update().catch(() => undefined)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }

    const onControllerChange = () => {
      if (disposed) return
      setWaitingWorker(null)
      setUpdateAvailable(false)
      if (reloadAfterActivation.current) {
        reloadAfterActivation.current = false
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    void navigator.serviceWorker.ready.then((nextRegistration) => {
      if (disposed) return

      registration = nextRegistration
      registration.addEventListener('updatefound', onUpdateFound)
      exposeWaitingWorker(registration.waiting)
      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', onVisibilityChange)
      intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
    }).catch(() => {
      // L'application reste utilisable si l'installation PWA n'est pas disponible.
    })

    return () => {
      disposed = true
      installingWorker?.removeEventListener('statechange', onInstallingStateChange)
      registration?.removeEventListener('updatefound', onUpdateFound)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      window.removeEventListener('focus', checkForUpdate)
      document.removeEventListener('visibilitychange', onVisibilityChange)
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
    if (!waitingWorker || applyingUpdate) return
    setApplyingUpdate(true)
    reloadAfterActivation.current = true
    try {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } catch {
      reloadAfterActivation.current = false
      setApplyingUpdate(false)
    }
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
      {updateAvailable ? (
        <aside className="pwa-update-prompt" role="status" aria-live="polite">
          <span>
            <strong>Mise à jour disponible</strong>
            <small>Recharge Filora pour utiliser la nouvelle version.</small>
          </span>
          <button type="button" onClick={applyUpdate} disabled={applyingUpdate}>
            {applyingUpdate ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </aside>
      ) : null}
    </>
  )
}
