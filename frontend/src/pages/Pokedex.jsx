import { useEffect, useState } from 'react'
import { LoadMessage, PageControls, PokemonCard } from '../components/shared'

const typeOptions = [
  ['all', 'ทุกธาตุ'], ['normal', 'Normal ⭐'], ['fire', 'Fire 🔥'], ['water', 'Water 💧'],
  ['grass', 'Grass 🌿'], ['electric', 'Electric ⚡'], ['ice', 'Ice ❄'], ['fighting', 'Fighting 🥊'],
  ['poison', 'Poison ☠️'], ['ground', 'Ground 🌍'], ['flying', 'Flying 🕊️'], ['psychic', 'Psychic 🔮'],
  ['bug', 'Bug 🐛'], ['rock', 'Rock 🪨'], ['ghost', 'Ghost 👻'], ['dragon', 'Dragon 🐉'],
  ['dark', 'Dark 🌑'], ['steel', 'Steel ⚙️'], ['fairy', 'Fairy ✨'],
]

const generationOptions = [
  ['all', 'ทุก Gen (1-9)'], ['1', 'Gen 1 (Kanto #1 - 151)'], ['2', 'Gen 2 (Johto #152 - 251)'],
  ['3', 'Gen 3 (Hoenn #252 - 386)'], ['4', 'Gen 4 (Sinnoh #387 - 493)'],
  ['5', 'Gen 5 (Unova #494 - 649)'], ['6', 'Gen 6 (Kalos #650 - 721)'],
  ['7', 'Gen 7 (Alola #722 - 809)'], ['8', 'Gen 8 (Galar #810 - 905)'],
  ['9', 'Gen 9 (Paldea #906+)'],
]

const gradientColors = {
  normal: ['#b8b6a4', '#8f8d75'], fire: ['#ff7043', '#e05a2b'], water: ['#4fc3f7', '#1565c0'],
  electric: ['#ffe066', '#f2a600'], grass: ['#7bc96f', '#2e7d32'], ice: ['#a7e8f5', '#4dd0e1'],
  fighting: ['#e0654f', '#a83218'], poison: ['#c86fdc', '#6a1b9a'], ground: ['#dcb27a', '#8d6e4a'],
  flying: ['#9fc9ff', '#5c6bc0'], psychic: ['#ff8fc7', '#c2185b'], bug: ['#b6d94c', '#689f38'],
  rock: ['#c2ac8e', '#6d4c41'], ghost: ['#9a7ad1', '#4527a0'], dragon: ['#8f7bff', '#3949ab'],
  dark: ['#6b6b76', '#2b2b33'], steel: ['#cfd8dc', '#78909c'], fairy: ['#ffc1e3', '#e91e8c'],
}

function gradientFor(types) {
  const first = gradientColors[types?.[0]] || gradientColors.normal
  const second = gradientColors[types?.[1]] || first
  return `linear-gradient(135deg, ${first[0]}, ${second[1]})`
}

export default function Pokedex({ active }) {
  const [pokemons, setPokemons] = useState([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [generation, setGeneration] = useState('all')
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
      try {
        const offset = (page - 1) * 20
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`)
        const data = await response.json()
        setTotalPages(Math.ceil((data.count || 151) / 20))
        const details = await Promise.all(data.results.map(async pokemon => {
          try {
            const detailResponse = await fetch(pokemon.url, { signal: controller.signal })
            if (!detailResponse.ok) throw new Error(`PokéAPI returned ${detailResponse.status}`)
            const detail = await detailResponse.json()
            let description = 'ไม่มีข้อมูลคำอธิบาย'
            let habitat = 'Kanto / Forest'
            try {
              const speciesResponse = await fetch(detail.species.url, { signal: controller.signal })
              if (!speciesResponse.ok) throw new Error(`PokéAPI returned ${speciesResponse.status}`)
              const species = await speciesResponse.json()
              if (species.habitat) habitat = species.habitat.name
              const entry = species.flavor_text_entries.find(item => item.language.name === 'en')
              if (entry) description = entry.flavor_text.replace(/[\f\n\r]/g, ' ')
            } catch (speciesError) {
              if (speciesError.name === 'AbortError') throw speciesError
              console.error(`โหลดข้อมูลสายพันธุ์ ${detail.name} ไม่สำเร็จ:`, speciesError)
            }
            return {
              id: detail.id,
              name: detail.name,
              image: detail.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || detail.sprites.front_default || '',
              types: detail.types?.map(item => item.type.name) || ['normal'],
              height: detail.height || 10,
              weight: detail.weight || 100,
              habitat,
              description,
            }
          } catch (detailError) {
            if (detailError.name === 'AbortError') throw detailError
            console.error(`โหลดรายละเอียด Pokémon ${pokemon.name} ไม่สำเร็จ:`, detailError)
            return null
          }
        }))
        if (controller.signal.aborted) return
        const filtered = details.filter(pokemon => pokemon
          && (!search.trim() || pokemon.name.toLowerCase().includes(search.trim().toLowerCase()))
          && (type === 'all' || pokemon.types.includes(type)))
        setPokemons(filtered)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error(fetchError)
          setError('ไม่สามารถเชื่อมต่อข้อมูลได้ กรุณาลองใหม่อีกครั้ง')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [active, page, search, type, generation])

  function changePage(nextPage) {
    setPage(nextPage)
    document.getElementById('dexGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main id="page-pokedex" className={`page page-blank${active ? ' active' : ''}`}>
      <div className="container" style={{ paddingTop: 20 }}>
        <section className="panel">
          <h2>เลือก Pokémon (Pokédex)</h2>
          <div className="controls">
            <input id="dexSearchInput" className="search-box" type="text" value={search} placeholder="ค้นหาชื่อ Pokémon..." onChange={event => { setSearch(event.target.value); setPage(1) }} />
            <select id="dexTypeSelect" value={type} onChange={event => { setType(event.target.value); setPage(1) }}>
              {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select id="dexGenSelect" value={generation} onChange={event => { setGeneration(event.target.value); setPage(1) }}>
              {generationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div id="dexGrid" className="pokemon-grid">
            <LoadMessage loading={loading} error={error} empty={!loading && !error && pokemons.length === 0} emptyMessage="ไม่พบข้อมูล Pokémon" />
            {!loading && !error && pokemons.map(pokemon => (
              <PokemonCard key={pokemon.id} pokemon={{ ...pokemon, gradient: gradientFor(pokemon.types) }} typesStyle={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 6, marginBottom: 6, lineHeight: 1.5 }}>
                  <div>📏 ส่วนสูง : <strong style={{ color: '#fff' }}>{(pokemon.height / 10).toFixed(1)} m</strong></div>
                  <div>⚖️ น้ำหนัก : <strong style={{ color: '#fff' }}>{(pokemon.weight / 10).toFixed(1)} kg</strong></div>
                  <div>🏞️ ถิ่นอาศัย : <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{pokemon.habitat}</strong></div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {pokemon.description}
                </p>
              </PokemonCard>
            ))}
          </div>
          {!loading && !error && <PageControls id="dexPagination" page={page} totalPages={totalPages} onChange={changePage} />}
        </section>
      </div>
    </main>
  )
}
