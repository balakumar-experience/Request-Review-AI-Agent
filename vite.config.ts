import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    // fsevents misses edits for this project path, so poll for changes
    watch: { usePolling: true, interval: 300 },
  },
})
