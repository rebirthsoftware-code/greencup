import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GreenCup Müşteri Takip uygulaması — siteden bağımsız Vite projesi.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { port: 5174 },
})
