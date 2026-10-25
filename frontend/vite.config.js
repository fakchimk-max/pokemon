import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/pokemons': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/team': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/moves': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/abilities': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})