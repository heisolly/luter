import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { OAuth2Client } from 'google-auth-library'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clientId = env.VITE_GOOGLE_CLIENT_ID;

  return {
    plugins: [
      react(), 
      tailwind(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
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
            next();
          });
        }
      }
    ],
  }
})
