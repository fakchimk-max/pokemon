export function TypeBadges({ types = [], style }) {
  return (
    <div style={style}>
      {types.map(type => <span className="pokemon-type" key={type}>{type}</span>)}
    </div>
  )
}

export function PokemonCard({ pokemon, onSelect, synergy = false, typesStyle, children }) {
  const card = (
    <>
      <div className="card-top" style={{ '--card-bg': pokemon.gradient, background: pokemon.gradient }}>
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <div className="card-info">
        {pokemon.id !== undefined && <div className="pokemon-id">#{pokemon.id}</div>}
        <h3>
          {pokemon.name}
          {synergy && <span style={{ color: 'var(--gold)', fontSize: 14, marginLeft: 4 }} title="เล่นเข้าขาได้ดีกับคนในทีม!">⭐</span>}
        </h3>
        {pokemon.types && <TypeBadges types={pokemon.types} style={typesStyle} />}
        {children}
      </div>
    </>
  )

  return (
    <article
      className="pokemon-card"
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect ? () => onSelect(pokemon) : undefined}
      onKeyDown={onSelect ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(pokemon)
        }
      } : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {card}
    </article>
  )
}

export function PageControls({ id, page, totalPages, onChange }) {
  if (totalPages <= 1) return <div id={id} className="pagination" />
  return (
    <div id={id} className="pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="หน้าก่อนหน้า">←</button>
      <span className="page-info">หน้า {page} / {totalPages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="หน้าถัดไป">→</button>
    </div>
  )
}

export function LoadMessage({ loading, loadingMessage = 'กำลังโหลดข้อมูล...', error, empty, emptyMessage, success = false, successMessage }) {
  if (loading) return <div className="empty load-message" role="status" aria-live="polite">{loadingMessage}</div>
  if (error) return <div className="empty load-message load-message-error" role="alert">{error}</div>
  if (empty) return <div className="empty load-message" role="status" aria-live="polite">{emptyMessage}</div>
  if (success && successMessage) {
    return <div className="empty load-message load-message-success" role="status" aria-live="polite">{successMessage}</div>
  }
  return null
}
