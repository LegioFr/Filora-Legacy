import { SpoolsEmptyState } from '../domains/spools/SpoolsEmptyState'

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Filora</p>
        <h1>Stock de filament</h1>
        <p className="intro">
          Le socle de l’application est prêt. La gestion réelle des bobines sera ajoutée dans un périmètre dédié.
        </p>
      </header>

      <SpoolsEmptyState />
    </main>
  )
}
