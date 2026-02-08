
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Cricketcore/', // Ensures assets load correctly relative to the repository name
  build: {
    outDir: 'dist',
  }
})
