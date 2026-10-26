import { useEffect, useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import Moves from './pages/Moves'
import Item from './pages/Item'
import pageGraph, { pageLabels } from './graph'

function readLocation() {
  const route = window.location.hash.replace(/^#/, '') || window.location.pathname.replace(/^\/+/, '')
  const [page, sub] = route.split('/')
  if (page === 'pokedex') return { page: 'pokedex', sub: '' }
  if (page === 'moves') return { page: 'moves', sub: sub === 'abilities' ? sub : 'attacks' }
  if (page === 'profile' || page === 'item') return { page: 'item', sub: '' }
  return { page: 'home', sub: '' }
}

export default function App() {
  const [route, setRoute] = useState(readLocation)
  const [movesMenuOpen, setMovesMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    function syncLocation() {
      setRoute(readLocation())
      setMovesMenuOpen(false)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', syncLocation)
    window.addEventListener('popstate', syncLocation)
    return () => {
      window.removeEventListener('hashchange', syncLocation)
      window.removeEventListener('popstate', syncLocation)
    }
  }, [])

  useEffect(() => {
    function updateScrollButton() {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', updateScrollButton, { passive: true })
    updateScrollButton()
    return () => window.removeEventListener('scroll', updateScrollButton)
  }, [])

  useEffect(() => {
    function closeMovesMenu(event) {
      if (!event.target.closest('#movesNavItem')) setMovesMenuOpen(false)
    }
    document.addEventListener('click', closeMovesMenu)
    return () => document.removeEventListener('click', closeMovesMenu)
  }, [])

  function handleMovesNav(event) {
    if (window.matchMedia('(hover: none)').matches && !movesMenuOpen) {
      event.preventDefault()
      setMovesMenuOpen(true)
    }
  }

  const mainPages = ['home', ...pageGraph.home]
  const moveSubPages = pageGraph.moves.filter(page => page !== 'home')

  return (
    <>
      <div className="brand-bar">
        <a className="brand-logo" href="#home" aria-label="หน้าแรก Pokémon">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg" alt="Pokémon" />
        </a>
      </div>

      <nav className="topnav" aria-label="เมนูหลัก" onClick={event => {
        if (!event.target.closest('.nav-item')) setMovesMenuOpen(false)
      }}>
        {mainPages.map(page => page === 'moves' ? (
          <div key={page} id="movesNavItem" className={`nav-item${movesMenuOpen ? ' open' : ''}`} onMouseLeave={() => setMovesMenuOpen(false)}>
            <a className={`nav-tab${route.page === page ? ' active' : ''}`} href="#moves/attacks" onClick={handleMovesNav}>
              <span className="pokeball" />{pageLabels[page]}
            </a>
            <div className="nav-menu">
              <div className="nav-menu-panel">
                {moveSubPages.map(subPage => {
                  const sub = subPage.split('/')[1]
                  return (
                    <a key={subPage} className={`menu-item${route.page === 'moves' && route.sub === sub ? ' active' : ''}`} href={`#${subPage}`} onClick={() => setMovesMenuOpen(false)}>
                      <span className="pokeball" />{pageLabels[subPage]}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <a key={page} className={`nav-tab${route.page === page ? ' active' : ''}`} href={`#${page}`}>
            <span className="pokeball" />{pageLabels[page]}
          </a>
        ))}
      </nav>

      <Home active={route.page === 'home'} />
      <Pokedex active={route.page === 'pokedex'} />
      <Moves active={route.page === 'moves'} sub={route.sub} />
      <Item active={route.page === 'item'} />

      <button className={`scroll-top-btn${showScrollTop ? ' show' : ''}`} type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="เลื่อนขึ้นด้านบน">↑</button>
    </>
  )
}
