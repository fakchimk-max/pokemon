import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import pageGraph from './graph.js'

// import หน้าต่างๆ จากโฟลเดอร์ pages
import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import Moves from './pages/Moves'
import ProfilePage from './pages/ProfilePage'
import Course from './pages/Course'

function Navbar() {
  const location = useLocation()
  const current = location.pathname.replace('/', '') || 'home'
  const neighbors = pageGraph[current] || []

  return (
    <nav style={{ padding: '10px', background: '#222', display: 'flex', gap: '10px' }}>
      {neighbors.map((node) => (
        <Link key={node} to={`/${node}`} style={{ color: '#fff', textDecoration: 'none' }}>
          {node}
        </Link>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/moves" element={<Moves />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </BrowserRouter>
  )
}