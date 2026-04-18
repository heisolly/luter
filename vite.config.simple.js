/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Simple workaround for esbuild regex parsing issue
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwind(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
        "pdfjs-dist": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src/lib/pdfjs-shim.js"),
      },
    },
    optimizeDeps: {
      exclude: ['pdfjs-dist']
    },
    worker: {
      format: 'es'
    },
    esbuild: {
      // Disable JSX transform to avoid regex parsing issues
      jsx: 'preserve'
    }
  }
})
