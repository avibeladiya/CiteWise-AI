import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    // Proxy API calls to backend in local dev (optional — only if not using mock mode)
    // proxy: {
    //   '/upload':     'http://localhost:8000',
    //   '/documents':  'http://localhost:8000',
    //   '/ask':        'http://localhost:8000',
    // },
  },

  build: {
    // Vercel requires the output in 'dist' (default)
    outDir: 'dist',
    // Warn if any chunk exceeds 600KB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libs into a separate chunk for better caching
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react'
          if (id.includes('node_modules/react-markdown')) return 'markdown'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/zustand')) return 'state'
        },
      },
    },
  },
})
