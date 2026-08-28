export function SpoolsEmptyState() {
  return (
    <section className="empty-state" aria-labelledby="spools-title">
      <div className="empty-state__mark" aria-hidden="true">F</div>
      <div>
        <p className="eyebrow">Bobines</p>
        <h2 id="spools-title">Aucune donnée de stock pour le moment</h2>
        <p>
          Ce premier socle n’enregistre encore aucune donnée. La persistance et les règles métier seront introduites avec leurs preuves dédiées.
        </p>
      </div>
    </section>
  )
}
