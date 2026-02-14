import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/touchtask/',
  build: {
    outDir: '../dist',
    emptyDirFirst: true
  },
  server: {
    strictPort: true,
    host: true
  },
  preview: {
    strictPort: true
  }
})
