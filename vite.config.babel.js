/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

// Use Babel instead of esbuild for JSX to avoid regex parsing issues
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clientId = env.VITE_GOOGLE_CLIENT_ID;

  return {
    plugins: [
      react({
        // Use Babel for JSX transformation instead of esbuild
        babel: {
          configFile: true,
          loaderOptions: {
            presets: ['@babel/preset-react'],
            plugins: ['@babel/plugin-transform-react-jsx']
          }
        }
      }),
      tailwind(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Luter',
          short_name: 'Luter',
          description: 'Study notes, flashcards, and mock exams.',
          theme_color: '#9718fb',
          background_color: '#111116',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/favicon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
            { src: '/favicon.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
            { src: '/favicon.png', type: 'image/png', sizes: '512x512', purpose: 'any' }
          ],
          prefer_related_applications: false,
          categories: ['education', 'productivity']
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          maximumFileSizeToCacheInBytes: 4194304, // 4MiB
        },
        devOptions: { enabled: false },
      }),
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
    }
  }
})
