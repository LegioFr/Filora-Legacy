import { FormEvent, useMemo, useState } from 'react'
import { loadMeasuredSpool } from '../domains/spools/loadMeasuredSpool'
import {
  calculateAvailableFilamentGrams,
  registerMeasuredSpool,
} from '../domains/spools/registerMeasuredSpool'
import { IndexedDbSpoolIdentityStore } from '../domains/spools/persistence/IndexedDbSpoolIdentityStore'
import type {
  PersistedSpoolIdentity,
  TareSource,
} from '../domains/spools/persistence/SpoolIdentityStore'

function tareSourceLabel(source: TareSource) {
  return source === 'measured_empty_support' ? 'Support vide pesé' : 'Valeur fabricant'
}

export function App() {
  const store = useMemo(() => new IndexedDbSpoolIdentityStore(), [])
  const [spoolId, setSpoolId] = useState('')
  const [grossWeight, setGrossWeight] = useState('')
  const [tareWeight, setTareWeight] = useState('')
  const [tareSource, setTareSource] = useState<TareSource>('measured_empty_support')
  const [status, setStatus] = useState<string>('')
  const [savedSpool, setSavedSpool] = useState<PersistedSpoolIdentity | null>(null)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setSavedSpool(null)

    try {
      const normalizedGrossWeight = Number(grossWeight.replace(',', '.'))
      const normalizedTareWeight = Number(tareWeight.replace(',', '.'))
      await registerMeasuredSpool(store, {
        id: spoolId,
        grossMeasuredWeightGrams: normalizedGrossWeight,
        tareWeightGrams: normalizedTareWeight,
        tareSource,
      })

      const reloaded = await loadMeasuredSpool(store, spoolId)
      if (!reloaded) {
        throw new Error('Bobine introuvable après enregistrement')
      }

      setSavedSpool(reloaded)
      setStatus('Bobine enregistrée et relue depuis le stockage local.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  async function handleReload() {
    setStatus('')
    setSavedSpool(null)

    try {
      const reloaded = await loadMeasuredSpool(store, spoolId)
      if (!reloaded) {
        setStatus('Aucune bobine trouvée avec cet ID.')
        return
      }

      setSavedSpool(reloaded)
      setGrossWeight(String(reloaded.grossMeasuredWeightGrams).replace('.', ','))
      setTareWeight(String(reloaded.tareWeightGrams).replace('.', ','))
      setTareSource(reloaded.tareSource)
      setStatus('Bobine relue depuis le stockage local.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Filora</p>
        <h1>Premier stock mesuré</h1>
        <p className="intro">
          Enregistre le poids brut d’une bobine et la tare de son support pour calculer la quantité physique de filament disponible.
        </p>
      </header>

      <section className="spool-test-card" aria-labelledby="spool-test-title">
        <div>
          <p className="eyebrow">Premier flux métier</p>
          <h2 id="spool-test-title">Enregistrer une bobine pesée</h2>
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
            Poids brut mesuré (g)
            <input
              value={grossWeight}
              onChange={(event) => setGrossWeight(event.target.value)}
              placeholder="ex. 842,6"
              inputMode="decimal"
              autoComplete="off"
            />
          </label>

          <label>
            Tare du support (g)
            <input
              value={tareWeight}
              onChange={(event) => setTareWeight(event.target.value)}
              placeholder="ex. 210"
              inputMode="decimal"
              autoComplete="off"
            />
          </label>

          <label>
            Origine de la tare
            <select
              value={tareSource}
              onChange={(event) => setTareSource(event.target.value as TareSource)}
            >
              <option value="measured_empty_support">Support vide pesé</option>
              <option value="manufacturer">Valeur fabricant</option>
            </select>
          </label>

          <div className="spool-actions">
            <button type="submit">Enregistrer</button>
            <button type="button" className="secondary-button" onClick={handleReload}>
              Relire cet ID
            </button>
          </div>
        </form>

        {status ? <p className="status-message">{status}</p> : null}

        {savedSpool ? (
          <div className="saved-result">
            <span>Poids brut mesuré</span>
            <strong>{savedSpool.grossMeasuredWeightGrams.toLocaleString('fr-FR')} g</strong>
            <span>Tare</span>
            <strong>{savedSpool.tareWeightGrams.toLocaleString('fr-FR')} g</strong>
            <span>Origine</span>
            <strong>{tareSourceLabel(savedSpool.tareSource)}</strong>
            <span>Filament disponible</span>
            <strong>{calculateAvailableFilamentGrams(savedSpool).toLocaleString('fr-FR')} g</strong>
          </div>
        ) : null}
      </section>
    </main>
  )
}
