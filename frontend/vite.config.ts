import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  envDir: '../',
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Suppress >500kb chunk warnings
  }
})
