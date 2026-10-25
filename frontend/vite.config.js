import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/pokemons': 'http://localhost:3000',
      '/pokemon-options': 'http://localhost:3000',
      '/pokemon-recommendations': 'http://localhost:3000',
      '/moves': 'http://localhost:3000',
      '/abilities': 'http://localhost:3000',
      '/items': 'http://localhost:3000', // เพิ่มส่วนนี้เพื่อให้ยิง API เข้า backend ได้
      '/team': 'http://localhost:3000'
    }
  }
})