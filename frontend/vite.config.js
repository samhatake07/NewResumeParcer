import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In production the Vercel rewrite sends /api/* to the backend service. In
    // dev there is no such router, so the dev server forwards the same paths to
    // the Express app on port 5000 — same URLs, same-origin, no base URL needed.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
