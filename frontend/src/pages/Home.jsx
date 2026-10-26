import { useEffect, useState } from 'react'
import { fetchJson } from '../api'
import { LoadMessage, PageControls, PokemonCard, TypeBadges } from '../components/shared'

const typeGradients = {
  normal: ['#b8b6a4', '#8f8d75'], fire: ['#ff7043', '#e05a2b'], water: ['#4fc3f7', '#1565c0'],
  electric: ['#ffe066', '#f2a600'], grass: ['#7bc96f', '#2e7d32'], ice: ['#a7e8f5', '#4dd0e1'],
  fighting: ['#e0654f', '#a83218'], poison: ['#c86fdc', '#6a1b9a'], ground: ['#dcb27a', '#8d6e4a'],
  flying: ['#9fc9ff', '#5c6bc0'], psychic: ['#ff8fc7', '#c2185b'], bug: ['#b6d94c', '#689f38'],
  rock: ['#c2ac8e', '#6d4c41'], ghost: ['#9a7ad1', '#4527a0'], dragon: ['#8f7bff', '#3949ab'],
  dark: ['#6b6b76', '#2b2b33'], steel: ['#cfd8dc', '#78909c'], fairy: ['#ffc1e3', '#e91e8c'],
}

const typeSynergyMap = {
  fire: ['grass', 'steel', 'water', 'ice'], water: ['grass', 'electric', 'ground', 'fire'],
  grass: ['fire', 'water', 'poison', 'flying'], electric: ['water', 'ground', 'dragon'],
  ice: ['dragon', 'ground', 'steel', 'fire'], fighting: ['psychic', 'flying', 'dark', 'steel'],
  poison: ['dark', 'ground', 'grass'], ground: ['flying', 'electric', 'steel', 'fire'],
  flying: ['ground', 'rock', 'electric'], psychic: ['dark', 'ghost', 'fighting'],
  bug: ['fire', 'flying', 'rock'], rock: ['water', 'grass', 'fighting'],
  ghost: ['dark', 'normal', 'psychic'], dragon: ['fairy', 'steel', 'ice'],
  dark: ['psychic', 'ghost', 'fighting'], steel: ['fairy', 'dragon', 'fire'],
  fairy: ['steel', 'poison', 'dragon'], normal: ['fighting', 'ghost'],
}

const types = [
  ['all', 'ทุกธาตุ'], ['normal', 'Normal ⭐'], ['fire', 'Fire 🔥'], ['water', 'Water 💧'],
  ['grass', 'Grass 🌿'], ['electric', 'Electric ⚡'], ['ice', 'Ice ❄'], ['fighting', 'Fighting 🥊'],
  ['poison', 'Poison ☠️'], ['ground', 'Ground 🌍'], ['flying', 'Flying 🕊️'], ['psychic', 'Psychic 🔮'],
  ['bug', 'Bug 🐛'], ['rock', 'Rock 🪨'], ['ghost', 'Ghost 👻'], ['dragon', 'Dragon 🐉'],
  ['dark', 'Dark 🌑'], ['steel', 'Steel ⚙️'], ['fairy', 'Fairy ✨'],
]

const generations = [
  ['all', 'ทุก Gen (1-9)'], ['1', 'Gen 1 (Kanto #1 - 151)'], ['2', 'Gen 2 (Johto #152 - 251)'],
  ['3', 'Gen 3 (Hoenn #252 - 386)'], ['4', 'Gen 4 (Sinnoh #387 - 493)'],
  ['5', 'Gen 5 (Unova #494 - 649)'], ['6', 'Gen 6 (Kalos #650 - 721)'],
  ['7', 'Gen 7 (Alola #722 - 809)'], ['8', 'Gen 8 (Galar #810 - 905)'],
  ['9', 'Gen 9 (Paldea #906+)'],
]

const statOptions = [
  ['id', 'เรียงตาม ID'], ['hp', 'HP'], ['attack', 'Attack'], ['defense', 'Defense'],
  ['specialAttack', 'Sp. Attack'], ['specialDefense', 'Sp. Defense'], ['speed', 'Speed'],
]
const statTotals = [
  ['HP', 'hp', 'totalHp'], ['Attack', 'attack', 'totalAttack'], ['Defense', 'defense', 'totalDefense'],
  ['Sp. Attack', 'specialAttack', 'totalSpecialAttack'], ['Sp. Defense', 'specialDefense', 'totalSpecialDefense'],
  ['Speed', 'speed', 'totalSpeed'],
]
const slotCount = 4

function gradientForTypes(pokemonTypes) {
  const selected = pokemonTypes?.length ? pokemonTypes : ['normal']
  const first = typeGradients[selected[0]] || typeGradients.normal
  const second = selected[1] ? typeGradients[selected[1]] || typeGradients.normal : first
  return `linear-gradient(135deg, ${first[0]}, ${second[1]})`
}

function readTeamSlots() {
  try {
    const stored = JSON.parse(localStorage.getItem('pokemonTeamSlots') || '[]')
    const slots = Array.isArray(stored) ? stored : []
    return [...slots, ...Array(Math.max(0, slotCount - slots.length)).fill(null)].slice(0, slotCount)
  } catch (error) {
    console.error('อ่านช่องเก็บทีมไม่สำเร็จ:', error)
    return Array(slotCount).fill(null)
  }
}

function TeamSlots({ team, onLoad }) {
  const [slots, setSlots] = useState(readTeamSlots)

  function saveSlot(index) {
    if (team.length === 0) {
      window.alert('ยังไม่มี Pokémon ในทีมที่กำลังจัดอยู่')
      return
    }
    if (slots[index]?.length && !window.confirm(`ทีม ${index + 1} มีข้อมูลอยู่แล้ว ต้องการเขียนทับหรือไม่?`)) return
    const nextSlots = slots.map((slot, slotIndex) => slotIndex === index ? [...team] : slot)
    localStorage.setItem('pokemonTeamSlots', JSON.stringify(nextSlots))
    setSlots(nextSlots)
    window.alert(`บันทึกลงทีม ${index + 1} เรียบร้อยแล้ว 💾`)
  }

  function loadSlot(index) {
    const slot = slots[index]
    if (!Array.isArray(slot) || slot.length === 0) {
      window.alert(`ทีม ${index + 1} ยังว่างอยู่`)
      return
    }
    onLoad(slot, index)
  }

  return (
    <div id="teamSlots" className="team-slots">
      {slots.map((slot, index) => (
        <div className="team-slot-card" key={index}>
          <div className="team-slot-label">ทีม {index + 1}</div>
          <div className="team-slot-thumbs">
            {slot?.length
              ? slot.slice(0, 6).map((pokemon, pokemonIndex) => <img key={`${pokemon.id}-${pokemonIndex}`} src={pokemon.image} alt={pokemon.name} />)
              : <div className="team-slot-empty">ว่าง</div>}
          </div>
          <div className="team-slot-actions">
            <button className="save-button btn-sm" type="button" onClick={() => saveSlot(index)}>💾 บันทึกที่นี่</button>
            <button className="load-button btn-sm" type="button" onClick={() => loadSlot(index)} disabled={!slot?.length}>📂 เลือก</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function TeamPanel({ team, onRemove, onLoad }) {
  const totals = statTotals.map(([label, key]) => [
    label,
    team.reduce((sum, pokemon) => sum + (Number(pokemon[key]) || 0), 0),
  ])

  return (
    <section className="panel">
      <div className="team-header">
        <h2>ทีม Pokémon</h2>
        <div className="team-count"><span id="teamCount">{team.length}</span> / 6</div>
      </div>
      <div id="teamGrid" className="team-grid">
        {team.length === 0
          ? <div className="empty">ยังไม่มี Pokémon ในทีม</div>
          : team.map((pokemon, pokemonIndex) => (
            <div className="team-card" key={`${pokemon.id}-${pokemonIndex}`}>
              <div className="card-top" style={{ '--card-bg': gradientForTypes(pokemon.types), background: gradientForTypes(pokemon.types) }}>
                <img src={pokemon.image} alt={pokemon.name} />
              </div>
              <div className="card-info">
                <h4>{pokemon.name}</h4>
                <div className="pokemon-id">#{pokemon.id}</div>
                <button className="remove-button" type="button" onClick={() => onRemove(pokemon.id)}>ลบ</button>
              </div>
            </div>
          ))}
      </div>

      <h3>รวมค่าพลังของทีม</h3>
      <div className="total-stats">
        {totals.map(([label, value], index) => <div className="total-stat" key={label}><strong>{label}</strong><span id={statTotals[index][2]}>{value}</span></div>)}
      </div>
      <h3>ช่องเก็บทีม</h3>
      <TeamSlots team={team} onLoad={onLoad} />
    </section>
  )
}

function SelectedPokemonModal({ pokemon, onClose, onAdd }) {
  useEffect(() => {
    document.body.classList.toggle('modal-open', Boolean(pokemon))
    return () => document.body.classList.remove('modal-open')
  }, [pokemon])

  return (
    <div id="selectedModal" className={`selected-modal${pokemon ? ' show' : ''}`} onClick={onClose}>
      <div className="selected-modal-content" onClick={event => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="ปิด">×</button>
        <div id="selectedPokemon" className="selected-box" style={pokemon ? { '--card-bg': gradientForTypes(pokemon.types), background: gradientForTypes(pokemon.types) } : undefined}>
          {pokemon ? (
            <>
              <img src={pokemon.image} alt={pokemon.name} />
              <div className="selected-info">
                <h2>#{pokemon.id} {pokemon.name}</h2>
                <TypeBadges types={pokemon.types} />
                <div className="stats">
                  {statTotals.map(([label, key]) => <div className="stat" key={key}><strong>{label}</strong><span>{pokemon[key]}</span></div>)}
                </div>
                <button className="add-button" type="button" onClick={() => onAdd(pokemon)}>+ เพิ่มเข้าทีม</button>
              </div>
            </>
          ) : <div className="empty">กรุณากดเลือก Pokémon ด้านล่าง</div>}
        </div>
      </div>
    </div>
  )
}

export default function Home({ active }) {
  const [pokemons, setPokemons] = useState([])
  const [team, setTeam] = useState([])
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [generation, setGeneration] = useState('all')
  const [stat, setStat] = useState('id')
  const [order, setOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page: String(page), limit: '25', search: search.trim(), type, gen: generation, stat, order,
      })
      try {
        const data = await fetchJson(`/pokemons?${params}`, { signal: controller.signal })
        setPokemons(data.pokemons || [])
        setTotalPages(data.totalPages || 1)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error(fetchError)
          setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ server.js')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [active, page, search, type, generation, stat, order])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedPokemon(null)
    }
    function closeOnRouteChange() {
      const page = window.location.hash.replace(/^#/, '').split('/')[0]
      if (page && page !== 'home') setSelectedPokemon(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('hashchange', closeOnRouteChange)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('hashchange', closeOnRouteChange)
    }
  }, [])

  async function addToTeam(pokemon) {
    if (team.length >= 6) {
      window.alert('ทีมเต็มแล้ว สามารถมี Pokémon ได้สูงสุด 6 ตัว')
      return
    }
    if (team.some(member => member.id === pokemon.id)) {
      window.alert('Pokémon ตัวนี้อยู่ในทีมแล้ว')
      return
    }
    try {
      const data = await fetchJson('/team/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pokemon),
      })
      setTeam(data.team || [])
      setSelectedPokemon(null)
    } catch (requestError) {
      console.error(requestError)
      window.alert('เพิ่ม Pokémon เข้าทีมไม่สำเร็จ')
    }
  }

  async function removeFromTeam(id) {
    try {
      const data = await fetchJson('/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setTeam(data.team || [])
    } catch (requestError) {
      console.error(requestError)
      window.alert('ลบ Pokémon ออกจากทีมไม่สำเร็จ')
    }
  }

  async function loadTeamSlot(slot, index) {
    try {
      const data = await fetchJson('/team/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: slot }),
      })
      setTeam(data.team || [])
      window.alert(`โหลดทีม ${index + 1} เรียบร้อยแล้ว 📂`)
    } catch (requestError) {
      console.error(requestError)
      window.alert('โหลดทีมไม่สำเร็จ')
    }
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
    setPage(nextPage)
    document.getElementById('pokemonGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const teamTypes = team.flatMap(pokemon => pokemon.types || [])

  return (
    <div id="page-home" className={`page${active ? ' active' : ''}`}>
      <header>
        <h1>Pokémon Team Builder</h1>
        <p>ค้นหาเปรียบเทียบค่าพลังและจัดทีม Pokémon ในฝันของคุณ</p>
      </header>

      <main className="container">
        <SelectedPokemonModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} onAdd={addToTeam} />
        <TeamPanel team={team} onRemove={removeFromTeam} onLoad={loadTeamSlot} />

        <section className="panel">
          <h2>เลือก Pokémon</h2>
          <div className="controls">
            <input id="searchInput" className="search-box" type="text" value={search} placeholder="ค้นหาชื่อ Pokémon..." onChange={event => { setSearch(event.target.value); setPage(1) }} />
            <select id="typeSelect" value={type} onChange={event => { setType(event.target.value); setPage(1) }}>
              {types.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <select id="statSelect" value={stat} onChange={event => setStat(event.target.value)}>
              {statOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <select id="orderSelect" value={order} onChange={event => setOrder(event.target.value)}>
              <option value="asc">ค่าต่ำ → สูง</option><option value="desc">ค่าสูง → ต่ำ</option>
            </select>
            <select id="genSelect" value={generation} onChange={event => { setGeneration(event.target.value); setPage(1) }}>
              {generations.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
          <div id="pokemonGrid" className="pokemon-grid">
            <LoadMessage loading={loading} error={error} empty={!loading && !error && pokemons.length === 0} emptyMessage="ไม่พบ Pokémon" />
            {!loading && !error && pokemons.map(pokemon => {
              const synergy = (pokemon.types || []).some(currentType =>
                teamTypes.some(teamType => (typeSynergyMap[teamType] || []).includes(currentType)))
              return <PokemonCard key={pokemon.id} pokemon={{ ...pokemon, gradient: gradientForTypes(pokemon.types) }} synergy={synergy} onSelect={setSelectedPokemon} />
            })}
          </div>
          {!loading && !error && <PageControls id="pagination" page={page} totalPages={totalPages} onChange={changePage} />}
        </section>
      </main>
    </div>
  )
}
