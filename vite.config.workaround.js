/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Workaround for esbuild regex parsing issue
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // Try to work around esbuild JSX parsing issues
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@babel/plugin-transform-react-jsx']
        }
      }),
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
      // Try to work around the regex parsing issue
      loader: 'jsx',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    }
  }
})
