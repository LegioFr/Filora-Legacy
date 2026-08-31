import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  createFiloraBackupJson,
  parseFiloraBackupJson,
  restoreFiloraBackup,
} from '../domains/spools/backupMeasuredSpools'
import type { FiloraBackupV1 } from '../domains/spools/backupMeasuredSpools'
import { listMeasuredSpools } from '../domains/spools/listMeasuredSpools'
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

function backupFileName() {
  return `filora-backup-${new Date().toISOString().slice(0, 10)}.json`
}

export function App() {
  const store = useMemo(() => new IndexedDbSpoolIdentityStore(), [])
  const [spoolId, setSpoolId] = useState('')
  const [grossWeight, setGrossWeight] = useState('')
  const [tareWeight, setTareWeight] = useState('')
  const [tareSource, setTareSource] = useState<TareSource>('measured_empty_support')
  const [status, setStatus] = useState<string>('')
  const [savedSpool, setSavedSpool] = useState<PersistedSpoolIdentity | null>(null)
  const [stockSpools, setStockSpools] = useState<PersistedSpoolIdentity[]>([])
  const [stockLoaded, setStockLoaded] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)
  const [backupStatus, setBackupStatus] = useState('')
  const [pendingBackup, setPendingBackup] = useState<FiloraBackupV1 | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)

  const refreshStock = useCallback(async () => {
    try {
      const spools = await listMeasuredSpools(store)
      setStockSpools(spools)
      setStockError(null)
    } catch (error) {
      setStockSpools([])
      setStockError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setStockLoaded(true)
    }
  }, [store])

  useEffect(() => {
    void refreshStock()
  }, [refreshStock])

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
      await refreshStock()
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

  async function handleBackupDownload() {
    setBackupBusy(true)
    setBackupStatus('')

    try {
      const json = await createFiloraBackupJson(store)
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backupFileName()
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setBackupStatus(`Sauvegarde téléchargée — ${stockSpools.length} bobine${stockSpools.length > 1 ? 's' : ''}.`)
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Impossible de créer la sauvegarde.')
    } finally {
      setBackupBusy(false)
    }
  }

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    setPendingBackup(null)
    setBackupStatus('')

    if (!file) {
      return
    }

    setBackupBusy(true)
    try {
      const text = await file.text()
      const backup = parseFiloraBackupJson(text)
      setPendingBackup(backup)
      setBackupStatus(
        `Sauvegarde valide — ${backup.spools.length} bobine${backup.spools.length > 1 ? 's' : ''}. Aucune donnée n'a encore été modifiée.`,
      )
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Impossible de lire la sauvegarde sélectionnée.')
    } finally {
      setBackupBusy(false)
    }
  }

  async function handleRestore() {
    if (!pendingBackup) {
      return
    }

    const confirmed = window.confirm(
      `Cette restauration remplacera entièrement le stock local actuel par ${pendingBackup.spools.length} bobine${pendingBackup.spools.length > 1 ? 's' : ''}. Continuer ?`,
    )
    if (!confirmed) {
      setBackupStatus('Restauration annulée. Le stock local est inchangé.')
      return
    }

    setBackupBusy(true)
    setBackupStatus('')
    try {
      const restored = await restoreFiloraBackup(store, pendingBackup)
      await refreshStock()
      setPendingBackup(null)
      setSavedSpool(null)
      setBackupStatus(
        `Restauration terminée — ${restored.spools.length} bobine${restored.spools.length > 1 ? 's' : ''} restaurée${restored.spools.length > 1 ? 's' : ''}.`,
      )
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'La restauration a échoué.')
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Filora</p>
        <h1>Stock mesuré</h1>
        <p className="intro">
          Enregistre une bobine pesée puis retrouve toutes les bobines déjà conservées dans le stockage local.
        </p>
      </header>

      <div className="content-grid">
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

        <section className="stock-card" aria-labelledby="stock-title">
          <div className="stock-heading">
            <div>
              <p className="eyebrow">Stock local</p>
              <h2 id="stock-title">Bobines enregistrées</h2>
            </div>
            {!stockError && stockLoaded ? <strong>{stockSpools.length}</strong> : null}
          </div>

          {stockError ? (
            <p className="stock-error" role="alert">
              Impossible de lire le stock : {stockError}
            </p>
          ) : !stockLoaded ? (
            <p className="stock-empty">Chargement du stock…</p>
          ) : stockSpools.length === 0 ? (
            <p className="stock-empty">Aucune bobine enregistrée.</p>
          ) : (
            <div className="stock-list">
              {stockSpools.map((spool) => (
                <article className="stock-item" key={spool.id}>
                  <div className="stock-item-title">
                    <span>ID</span>
                    <strong>{spool.id}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Poids brut</dt>
                      <dd>{spool.grossMeasuredWeightGrams.toLocaleString('fr-FR')} g</dd>
                    </div>
                    <div>
                      <dt>Tare</dt>
                      <dd>{spool.tareWeightGrams.toLocaleString('fr-FR')} g</dd>
                    </div>
                    <div>
                      <dt>Origine</dt>
                      <dd>{tareSourceLabel(spool.tareSource)}</dd>
                    </div>
                    <div>
                      <dt>Disponible</dt>
                      <dd>{calculateAvailableFilamentGrams(spool).toLocaleString('fr-FR')} g</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="stock-card" aria-labelledby="backup-title">
          <div className="stock-heading">
            <div>
              <p className="eyebrow">Sécurité des données</p>
              <h2 id="backup-title">Sauvegarde et restauration</h2>
            </div>
          </div>

          <p>
            Télécharge une copie complète du stock local actuel ou sélectionne une sauvegarde Filora à restaurer.
          </p>

          <div className="spool-actions">
            <button type="button" onClick={handleBackupDownload} disabled={backupBusy}>
              Télécharger la sauvegarde
            </button>
            <label>
              Sélectionner une sauvegarde
              <input type="file" accept="application/json,.json" onChange={handleBackupFile} disabled={backupBusy} />
            </label>
          </div>

          {backupStatus ? <p className="status-message" role="status">{backupStatus}</p> : null}

          {pendingBackup ? (
            <div className="saved-result">
              <span>Sauvegarde prête</span>
              <strong>
                {pendingBackup.spools.length} bobine{pendingBackup.spools.length > 1 ? 's' : ''}
              </strong>
              <span>Effet de la restauration</span>
              <strong>Remplacement complet du stock local</strong>
              <button type="button" onClick={handleRestore} disabled={backupBusy}>
                Restaurer et remplacer le stock actuel
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
