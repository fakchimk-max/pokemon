import { useEffect, useMemo, useState } from 'react'
import { fetchJson } from '../api'
import { LoadMessage, PageControls, TypeBadges } from '../components/shared'

const gradients = {
  normal: ['#b8b6a4', '#8f8d75'], fire: ['#ff7043', '#e05a2b'], water: ['#4fc3f7', '#1565c0'],
  electric: ['#ffe066', '#f2a600'], grass: ['#7bc96f', '#2e7d32'], ice: ['#a7e8f5', '#4dd0e1'],
  fighting: ['#e0654f', '#a83218'], poison: ['#c86fdc', '#6a1b9a'], ground: ['#dcb27a', '#8d6e4a'],
  flying: ['#9fc9ff', '#5c6bc0'], psychic: ['#ff8fc7', '#c2185b'], bug: ['#b6d94c', '#689f38'],
  rock: ['#c2ac8e', '#6d4c41'], ghost: ['#9a7ad1', '#4527a0'], dragon: ['#8f7bff', '#3949ab'],
  dark: ['#6b6b76', '#2b2b33'], steel: ['#cfd8dc', '#78909c'], fairy: ['#ffc1e3', '#e91e8c'],
}

function typeGradient(type) {
  const colors = gradients[type] || gradients.normal
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
}

function MoveCard({ move }) {
  return (
    <article className="pokemon-card" style={{ padding: 16, cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, textTransform: 'capitalize', color: 'white' }}>{move.name}</h3>
        <span className="pokemon-type" style={{ background: typeGradient(move.type), margin: 0 }}>{move.type}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>
        <span>Power: <strong>{move.power}</strong></span> | <span>PP: <strong>{move.pp}</strong></span> | <span>Acc: <strong>{move.accuracy}</strong></span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>{move.description || 'No description available'}</p>
    </article>
  )
}

function AbilityCard({ ability }) {
  return (
    <article className="pokemon-card" style={{ padding: 16, cursor: 'default' }}>
      <h3 style={{ margin: '0 0 8px', textTransform: 'capitalize', color: 'white' }}>{ability.name}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>{ability.description || 'No description available'}</p>
    </article>
  )
}

function RecommendationCard({ move }) {
  return (
    <article className="pokemon-card move-recommendation-card" style={{ padding: 16, cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0, textTransform: 'capitalize', color: 'white' }}>{move.name}</h3>
        <span className="move-recommendation-star" aria-label="ท่าแนะนำ">★ แนะนำ</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>
        <span className="pokemon-type" style={{ background: typeGradient(move.type), margin: '0 6px 0 0' }}>{move.type}</span>
        <span>Power: <strong>{move.power}</strong></span> | <span>{move.damageClass}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>{move.description || 'No description available'}</p>
    </article>
  )
}

function Recommendations({ active }) {
  const [options, setOptions] = useState([])
  const [search, setSearch] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [pokemon, setPokemon] = useState(null)
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [recommendationError, setRecommendationError] = useState('')
  const [loadedOptions, setLoadedOptions] = useState(false)

  useEffect(() => {
    if (!active || loadedOptions) return undefined
    const controller = new AbortController()
    async function loadOptions() {
      try {
        const data = await fetchJson('/pokemon-options', { signal: controller.signal })
        setOptions(data.pokemons || [])
      } catch (backendError) {
        if (backendError.name === 'AbortError') return
        try {
          const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025', { signal: controller.signal })
          if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`)
          const data = await response.json()
          setOptions(data.results.map((item, index) => ({ id: index + 1, name: item.name })))
        } catch (fallbackError) {
          if (fallbackError.name !== 'AbortError') {
            console.error('โหลดรายชื่อ Pokémon ไม่สำเร็จ:', fallbackError)
            setOptionsError('โหลดรายชื่อ Pokémon ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoadedOptions(true)
      }
    }
    loadOptions()
    return () => controller.abort()
  }, [active, loadedOptions])

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query || selectedName === query) return []
    return options.filter(item => item.name.includes(query) || String(item.id) === query).slice(0, 8)
  }, [options, search, selectedName])

  useEffect(() => {
    if (!active || !selectedName) return undefined
    const controller = new AbortController()
    async function loadRecommendations() {
      setLoading(true)
      setRecommendationError('')
      setPokemon(null)
      setMoves([])
      try {
        const data = await fetchJson(`/pokemon-recommendations/${encodeURIComponent(selectedName)}`, { signal: controller.signal })
        setPokemon(data.pokemon)
        setMoves(data.moves || [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          console.error(requestError)
          setRecommendationError('โหลดท่าแนะนำไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadRecommendations()
    return () => controller.abort()
  }, [active, selectedName])

  function choosePokemon(option) {
    setSearch(option.name)
    setSelectedName(option.name)
  }

  const status = optionsError || (loading
    ? 'กำลังวิเคราะห์ท่าที่เหมาะกับ Pokémon ตัวนี้...'
    : recommendationError || (pokemon && moves.length
      ? `ท่าแนะนำสำหรับ ${pokemon.name} — คัดจากท่าที่เรียนรู้ได้ ประเภท และพลังโจมตี`
      : pokemon ? 'ไม่พบข้อมูลท่าโจมตีที่แนะนำสำหรับ Pokémon ตัวนี้'
        : suggestions.length ? 'เลือก Pokémon จากรายการที่แสดง' : 'เลือก Pokémon เพื่อดูท่าที่เหมาะกับตัวนั้น'))

  return (
    <section className="panel">
      <h2>ท่าโจมตีที่แนะนำ</h2>
      <div className="move-recommendation-controls">
        <label htmlFor="movePokemonSearch">เลือก Pokémon</label>
        <input id="movePokemonSearch" type="search" placeholder="พิมพ์ชื่อ Pokémon เช่น pikachu" autoComplete="off" value={search}
          onChange={event => { setSearch(event.target.value); setSelectedName(''); setPokemon(null); setMoves([]) }} />
      </div>
      <div id="movePokemonSuggestions" className="move-pokemon-suggestions">
        {optionsError && <p className="move-recommendation-status">{optionsError}</p>}
        {suggestions.map(option => (
          <button className="move-pokemon-suggestion" type="button" key={option.id} onClick={() => choosePokemon(option)}>
            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${option.id}.png`} alt="" loading="lazy" />
            <div><strong>#{option.id} {option.name}</strong><span>เลือก Pokémon ตัวนี้</span></div>
          </button>
        ))}
        {!optionsError && search.trim() && !suggestions.length && !selectedName && loadedOptions && (
          <p className="move-recommendation-status">ไม่พบ Pokémon ที่ตรงกับ “{search.trim()}”</p>
        )}
      </div>
      {pokemon && (
        <div id="moveRecommendationPokemon" className="move-recommendation-pokemon">
          <img src={pokemon.image} alt={pokemon.name} />
          <div><strong>#{pokemon.id} {pokemon.name}</strong><br /><TypeBadges types={pokemon.types} /></div>
        </div>
      )}
      <p id="moveRecommendationStatus" className="move-recommendation-status">{status}</p>
      <div id="moveRecommendations" className="pokemon-grid">
        {moves.map(move => <RecommendationCard key={move.id} move={move} />)}
      </div>
    </section>
  )
}

function MoveList({ active }) {
  const [moves, setMoves] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    async function loadMoves() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJson(`/moves?page=${page}`, { signal: controller.signal })
        setMoves(data.moves || [])
        setPage(data.page || page)
        setTotalPages(data.totalPages || 1)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          console.error(requestError)
          setError('โหลดข้อมูลท่าโจมตีไม่สำเร็จ')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadMoves()
    return () => controller.abort()
  }, [active, page])

  return (
    <section className="panel">
      <h2>รายการท่าโจมตี (Moves)</h2>
      <div id="movesGrid" className="pokemon-grid">
        <LoadMessage loading={loading} error={error} empty={!loading && !error && moves.length === 0} emptyMessage="ไม่พบข้อมูลท่าโจมตี" />
        {!loading && !error && moves.map(move => <MoveCard key={move.id} move={move} />)}
      </div>
      {!loading && !error && <PageControls id="movesPagination" page={page} totalPages={totalPages} onChange={setPage} />}
    </section>
  )
}

function AbilityList({ active }) {
  const [abilities, setAbilities] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    async function loadAbilities() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJson(`/abilities?page=${page}`, { signal: controller.signal })
        setAbilities(data.abilities || [])
        setPage(data.page || page)
        setTotalPages(data.totalPages || 1)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          console.error(requestError)
          setError('โหลดข้อมูลความสามารถพิเศษไม่สำเร็จ')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadAbilities()
    return () => controller.abort()
  }, [active, page])

  return (
    <section className="panel">
      <h2>รายการความสามารถพิเศษ (Abilities)</h2>
      <div id="abilitiesGrid" className="pokemon-grid">
        <LoadMessage loading={loading} error={error} empty={!loading && !error && abilities.length === 0} emptyMessage="ไม่พบข้อมูลความสามารถพิเศษ" />
        {!loading && !error && abilities.map(ability => <AbilityCard key={ability.id} ability={ability} />)}
      </div>
      {!loading && !error && <PageControls id="abilitiesPagination" page={page} totalPages={totalPages} onChange={setPage} />}
    </section>
  )
}

export default function Moves({ active, sub = 'attacks' }) {
  const attacksActive = active && sub === 'attacks'
  const abilitiesActive = active && sub === 'abilities'
  return (
    <main id="page-moves" className={`page page-blank${active ? ' active' : ''}`}>
      <div className="container" style={{ paddingTop: 20 }}>
        <div id="sub-attacks" className={`subpage${sub === 'attacks' ? ' active' : ''}`}>
          <Recommendations active={attacksActive} />
          <MoveList active={attacksActive} />
        </div>
        <div id="sub-abilities" className={`subpage${sub === 'abilities' ? ' active' : ''}`}>
          <AbilityList active={abilitiesActive} />
        </div>
      </div>
    </main>
  )
}
