import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      buffer: 'buffer/'
    }
  },
  plugins: [react(), tailwindcss()],
})
