import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    'process.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || '/api'
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'firebase-admin': ['firebase-admin'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // PDF processing
          'pdf-worker': ['pdfjs-dist'],
          // Document processing
          'document-processor': ['mammoth'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB for now
  },
})
