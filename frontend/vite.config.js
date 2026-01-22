import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  }
})
