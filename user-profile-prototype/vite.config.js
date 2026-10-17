import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone prototype — runs on its own port, unrelated to the main app.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, open: true },
})
