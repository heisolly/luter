/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import {
  resolveUniversitySlugParam,
  resolveDepartmentSlugParam,
  normalizeSemesterParam,
} from './src/lib/curriculumSlugs.js'
import { runSyllabusWebLayer } from './api/lib/syllabusWeb.js'
import { readJsonBody } from './api/lib/readJsonBody.js'
import { runMapboxSchoolSearch } from './api/lib/mapboxSchools.js'
import { handleLiveKitTokenRequest } from './api/lib/livekitToken.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clientId = env.VITE_GOOGLE_CLIENT_ID;

  return {
    plugins: [
      react(),
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
          navigateFallbackAllowlist: [/.*/],
          maximumFileSizeToCacheInBytes: 10485760, // 10MiB
          runtimeCaching: [
            {
              urlPattern: /^\/assets\/.+\.js$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'js-chunks',
                expiration: { maxEntries: 60, maxAgeSeconds: 3600 }
              }
            }
          ]
        },
        devOptions: { enabled: true },
      }),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const rawPath = req.url?.split('?')[0] || ''
            if (req.method === 'GET' && rawPath === '/api/v1/mapbox/schools') {
              try {
                const url = new URL(req.url || '/', 'http://vite.local')
                const out = await runMapboxSchoolSearch({
                  query: url.searchParams.get('q') || '',
                  latitude: url.searchParams.get('lat'),
                  longitude: url.searchParams.get('lng'),
                  radiusKm: url.searchParams.get('radiusKm'),
                }, env)
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(out))
              } catch (e) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: String(e?.message || e), schools: [] }))
              }
              return
            }
            if (req.method === 'GET' && rawPath === '/api/v1/curriculum') {
              const url = new URL(req.url || '/', 'http://vite.local')
              const uni = url.searchParams.get('uni') || ''
              const dept = url.searchParams.get('dept') || ''
              const level = url.searchParams.get('level') || '100'
              const semester = normalizeSemesterParam(url.searchParams.get('sem'))
              const supabaseUrl = env.VITE_SUPABASE_URL
              const supabaseKey = env.VITE_SUPABASE_ANON_KEY
              if (!supabaseUrl || !supabaseKey) {
                res.statusCode = 503
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set' }))
                return
              }
              const supabase = createClient(supabaseUrl, supabaseKey)
              const university_slug = resolveUniversitySlugParam(uni)
              const department_slug = resolveDepartmentSlugParam(dept)
              const { data, error } = await supabase
                .from('curriculum_offers')
                .select('*')
                .eq('university_slug', university_slug)
                .eq('department_slug', department_slug)
                .eq('level', level)
                .eq('semester', semester)
                .eq('status', 'live')
                .maybeSingle()
              res.setHeader('Content-Type', 'application/json')
              if (error) {
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: error.message }))
                return
              }
              res.end(JSON.stringify({ ok: true, data }))
              return
            }
            if (req.method === 'POST' && rawPath === '/api/v1/syllabus/web') {
              try {
                const parsed = await readJsonBody(req)
                const out = await runSyllabusWebLayer(
                  {
                    university: parsed.university,
                    department: parsed.department,
                    level: parsed.level,
                    semester: parsed.semester,
                    scrapeUrl: parsed.scrapeUrl,
                    searchFocus: parsed.searchFocus,
                    includeSnippet: Boolean(parsed.includeSnippet),
                  },
                  env,
                )
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(out))
              } catch (e) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: true, courses: [], error: String(e.message) }))
              }
              return
            }
            if (req.url === '/api/verify-google' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { token } = JSON.parse(body);
                  const client = new OAuth2Client(clientId);
                  const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                  });
                  const payload = ticket.getPayload();
                  
                  console.log('✅ [Dev Server] User Verified:', payload.name, payload.email);
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ 
                    message: 'Success', 
                    user: { 
                      id: payload.sub, 
                      email: payload.email, 
                      name: payload.name,
                      picture: payload.picture
                    } 
                  }));
                } catch (e) {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
              return;
            }
            if (rawPath === '/api/livekit/token' && req.method === 'POST') {
              req.body = await readJsonBody(req)
              await handleLiveKitTokenRequest(req, res, env)
              return;
            }
            if (rawPath === '/api/liveblocks-auth' && req.method === 'POST') {
              const liveblocksAuth = await import('./api/liveblocks-auth.js')
              // mock process.env for the handler if it uses it directly instead of env variable
              process.env.VITE_LIVEBLOCKS_SECRET_KEY = env.VITE_LIVEBLOCKS_SECRET_KEY
              process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL
              process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
              await liveblocksAuth.default(req, res)
              return;
            }
            next();
          });
        }
      }
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing', '@react-three/postprocessing'],
            'vendor-pdf': ['pdfjs-dist', 'react-pdf'],
            'vendor-excel': ['xlsx'],
            'vendor-langchain': ['langchain', '@langchain/core', '@langchain/community', '@langchain/google-genai'],
            'vendor-utils': ['jspdf', 'mammoth', 'jszip', 'docx-preview'],
            'vendor-ui': ['framer-motion', 'gsap', '@phosphor-icons/react'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
        "@liveblocks/core": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./node_modules/@liveblocks/core"),
        "@liveblocks/client": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./node_modules/@liveblocks/client"),
      },
      dedupe: ['@liveblocks/core', '@liveblocks/client', '@liveblocks/react'],
    },
    optimizeDeps: {
      include: [
        '@excalidraw/excalidraw',
        'docx-preview',
        'react-player',
        'react-quick-pinch-zoom',
        '@phosphor-icons/react'
      ]
    },
    worker: {
      format: 'es'
    }
  }
})
