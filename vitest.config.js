import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Separate from vite.config.js so Vitest's own settings (test include/
// exclude) don't leak into the app build config. `tests/` holds Playwright
// specs only — unit tests live under src/**/*.test.js.
export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    exclude: ['tests/**', 'node_modules/**'],
  },
})
