import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import Moves from './pages/Moves'
import ProfilePage from './pages/ProfilePage'
import Course from './pages/Course'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/moves" element={<Moves />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/course" element={<Course />} />
      </Routes>
    </BrowserRouter>
  )
}