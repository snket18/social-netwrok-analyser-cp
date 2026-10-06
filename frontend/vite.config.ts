import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Proxy relative /api requests to the FastAPI backend for the
  // same-origin setup (when VITE_API_URL is not configured).
  const apiUrl = env.VITE_API_URL ?? 'http://localhost:8000/api'
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
