import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { FILORA_APP_NAME, FILORA_ICON_192 } from './pwa/channel'
import { PwaRuntime } from './pwa/PwaRuntime'
import './styles.css'
import './responsive.css'
import './batch6-refinements.css'
import './batch6-final-responsive.css'
import './pwa/pwa.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Filora root element is missing')
}

if (new URLSearchParams(window.location.search).get('pwa-debug') === '1') {
  void import('./pwa/debug')
    .then(({ mountPwaDebug }) => mountPwaDebug())
    .catch((error) => console.error('Filora PWA diagnostic failed to load', error))
}

document.title = FILORA_APP_NAME
document.documentElement.dataset.filoraApp = FILORA_APP_NAME

const icon = document.createElement('link')
icon.rel = 'icon'
icon.href = FILORA_ICON_192
document.head.append(icon)

const touchIcon = document.createElement('link')
touchIcon.rel = 'apple-touch-icon'
touchIcon.href = FILORA_ICON_192
document.head.append(touchIcon)

createRoot(root).render(
  <StrictMode>
    <PwaRuntime />
    <App />
  </StrictMode>,
)
