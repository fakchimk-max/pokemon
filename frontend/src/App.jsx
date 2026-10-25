import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import Moves from './pages/Moves'
import Item from './pages/Item'
import Course from './pages/Course'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/moves" element={<Moves />} />
        <Route path="/item" element={<Item />} />
        <Route path="/course" element={<Course />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}