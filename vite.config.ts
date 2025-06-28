import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          sigma: ['sigma', 'graphology', 'graphology-layout', 'graphology-layout-forceatlas2'],
          utils: ['zustand', 'd3-color', 'd3-scale']
        }
      }
    }
  },
  server: {
    port: 5174,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'sigma', 'graphology']
  }
})