import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GreenCup Müşteri Takip uygulaması — siteden bağımsız Vite projesi.
// `--mode embedded`: sitenin derlemesine /app/ altına gömülür (Vercel'de tek proje).
export default defineConfig(({ mode }) => {
  const embedded = mode === 'embedded'
  return {
    base: embedded ? '/app/' : (process.env.VITE_BASE || '/'),
    plugins: [react()],
    server: { port: 5174 },
    build: embedded ? { outDir: '../dist/app', emptyOutDir: true } : {},
  }
})
