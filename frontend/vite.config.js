import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      // Para poder probar "Instalar" y el ícono sin tener que hacer un build
      // cada vez — en producción esto no cambia nada, el SW real se genera igual.
      devOptions: { enabled: true },
      manifest: {
        name: 'Hannkat & Xio',
        short_name: 'Hannkat & Xio',
        description: 'Bolsas, ropa y artículos varios de distintas marcas',
        start_url: '/',
        display: 'standalone',
        background_color: '#faf7f4',
        theme_color: '#c39790',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // No cachear las llamadas a la API (carrito, sesión, órdenes) — eso
        // siempre debe ir a la red. Solo se cachea el "cascarón" de la app
        // (HTML/JS/CSS/imágenes) para que cargue rápido y offline.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
