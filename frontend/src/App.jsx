import { useEffect, useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import Moves from './pages/Moves'
import Item from './pages/Item'
import Course from './pages/Course'

function readLocation() {
  const route = window.location.hash.replace(/^#/, '') || window.location.pathname.replace(/^\/+/, '')
  const [page, sub] = route.split('/')
  if (page === 'course') return { page: 'course', sub: '' }
  if (page === 'pokedex') return { page: 'pokedex', sub: '' }
  if (page === 'moves') return { page: 'moves', sub: sub === 'abilities' ? sub : 'attacks' }
  if (page === 'profile' || page === 'item') return { page: 'profile', sub: '' }
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
        <a className={`nav-tab${route.page === 'home' ? ' active' : ''}`} href="#home"><span className="pokeball" />จัดทีม</a>
        <a className={`nav-tab${route.page === 'pokedex' ? ' active' : ''}`} href="#pokedex"><span className="pokeball" />ข้อมูลโปเกมอน</a>
        <div id="movesNavItem" className={`nav-item${movesMenuOpen ? ' open' : ''}`} onMouseLeave={() => setMovesMenuOpen(false)}>
          <a className={`nav-tab${route.page === 'moves' ? ' active' : ''}`} href="#moves/attacks" onClick={handleMovesNav}>
            <span className="pokeball" />ท่าโจมตี &amp; ความสามารถพิเศษ
          </a>
          <div className="nav-menu">
            <div className="nav-menu-panel">
              <a className={`menu-item${route.page === 'moves' && route.sub === 'attacks' ? ' active' : ''}`} href="#moves/attacks" onClick={() => setMovesMenuOpen(false)}>
                <span className="pokeball" />ท่าโจมตี
              </a>
              <a className={`menu-item${route.page === 'moves' && route.sub === 'abilities' ? ' active' : ''}`} href="#moves/abilities" onClick={() => setMovesMenuOpen(false)}>
                <span className="pokeball" />ความสามารถพิเศษ
              </a>
            </div>
          </div>
        </div>
        <a className={`nav-tab${route.page === 'profile' ? ' active' : ''}`} href="#profile"><span className="pokeball" />ไอเทม</a>
      </nav>

      <Home active={route.page === 'home'} />
      <Pokedex active={route.page === 'pokedex'} />
      <Moves active={route.page === 'moves'} sub={route.sub} />
      <Item active={route.page === 'profile'} />
      {route.page === 'course' && <Course />}

      <button className={`scroll-top-btn${showScrollTop ? ' show' : ''}`} type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="เลื่อนขึ้นด้านบน">↑</button>
    </>
  )
}
