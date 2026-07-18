import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Local dev: run `vercel dev` (defaults to :3000) alongside `npm run dev`
    // so /api/token resolves without a CORS dance.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
