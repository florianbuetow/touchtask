import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Conditional base path: / for Tauri, /touchtask/ for web (GitHub Pages)
  base: process.env.TAURI_ENV_PLATFORM ? '/' : '/touchtask/',
  build: {
    outDir: '../dist',
    emptyDirFirst: true
  },
  server: {
    port: 8000,
    host: true
  },
  preview: {
    port: 8000
  },
  // Tauri-specific settings
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_']
})
