import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'https://legalsuite-team-b-hackaton-2026-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        // Subida de PDFs puede tardar más que el default; evita 502 por timeout.
        timeout: 120_000,
        proxyTimeout: 120_000,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[vite-proxy] ERROR', req.method, req.url, '→', err.message)
          })
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[vite-proxy] →', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[vite-proxy] ←', proxyRes.statusCode, req.method, req.url)
          })
        },
      },
    },
  },
})
