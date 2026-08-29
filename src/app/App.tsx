import { FormEvent, useMemo, useState } from 'react'
import { loadMeasuredSpool } from '../domains/spools/loadMeasuredSpool'
import { registerMeasuredSpool } from '../domains/spools/registerMeasuredSpool'
import { IndexedDbSpoolIdentityStore } from '../domains/spools/persistence/IndexedDbSpoolIdentityStore'

export function App() {
  const store = useMemo(() => new IndexedDbSpoolIdentityStore(), [])
  const [spoolId, setSpoolId] = useState('')
  const [weight, setWeight] = useState('')
  const [status, setStatus] = useState<string>('')
  const [savedWeight, setSavedWeight] = useState<number | null>(null)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setSavedWeight(null)

    try {
      const normalizedWeight = Number(weight.replace(',', '.'))
      await registerMeasuredSpool(store, {
        id: spoolId,
        measuredWeightGrams: normalizedWeight,
      })

      const reloaded = await loadMeasuredSpool(store, spoolId)
      if (!reloaded) {
        throw new Error('Bobine introuvable après enregistrement')
      }

      setSavedWeight(reloaded.measuredWeightGrams)
      setStatus('Bobine enregistrée et relue depuis le stockage local.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  async function handleReload() {
    setStatus('')
    setSavedWeight(null)

    try {
      const reloaded = await loadMeasuredSpool(store, spoolId)
      if (!reloaded) {
        setStatus('Aucune bobine trouvée avec cet ID.')
        return
      }

      setSavedWeight(reloaded.measuredWeightGrams)
      setStatus('Bobine relue depuis le stockage local.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Filora</p>
        <h1>Test de bobine réelle</h1>
        <p className="intro">
          Enregistre une bobine avec un poids mesuré, puis vérifie qu’elle reste disponible dans le stockage local.
        </p>
      </header>

      <section className="spool-test-card" aria-labelledby="spool-test-title">
        <div>
          <p className="eyebrow">Premier flux métier</p>
          <h2 id="spool-test-title">Enregistrer une bobine</h2>
        </div>

        <form className="spool-form" onSubmit={handleSave}>
          <label>
            ID de la bobine
            <input
              value={spoolId}
              onChange={(event) => setSpoolId(event.target.value)}
              placeholder="ex. bobine-001"
              autoComplete="off"
            />
          </label>

          <label>
            Poids réel mesuré (g)
            <input
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="ex. 842,6"
              inputMode="decimal"
              autoComplete="off"
            />
          </label>

          <div className="spool-actions">
            <button type="submit">Enregistrer</button>
            <button type="button" className="secondary-button" onClick={handleReload}>
              Relire cet ID
            </button>
          </div>
        </form>

        {status ? <p className="status-message">{status}</p> : null}

        {savedWeight !== null ? (
          <div className="saved-result">
            <span>Poids relu</span>
            <strong>{savedWeight.toLocaleString('fr-FR')} g</strong>
          </div>
        ) : null}
      </section>
    </main>
  )
}
