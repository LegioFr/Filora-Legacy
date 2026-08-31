import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { FILORA_APP_NAME } from './pwa/channel'
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

document.title = FILORA_APP_NAME
document.documentElement.dataset.filoraApp = FILORA_APP_NAME

createRoot(root).render(
  <StrictMode>
    <PwaRuntime />
    <App />
  </StrictMode>,
)
