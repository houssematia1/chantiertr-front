import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// `vitest/config` et non `vite` : c'est lui qui connait la clef `test`.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Le port est fixe et non negociable : il est declare cote API dans
    // `SANCTUM_STATEFUL_DOMAINS` et `CORS_ALLOWED_ORIGINS`. Un port de repli
    // silencieux ferait echouer la session sans qu'on comprenne pourquoi.
    port: 5174,
    strictPort: true,
    host: 'localhost',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    restoreMocks: true,
    setupFiles: ['./src/test/miseEnPlace.ts'],
  },
})
