import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vitest runs outside Quasar CLI. `src/*` imports in the module code are
 * redirected to lightweight stubs so units can be exercised in a plain
 * Node environment (mirrors ContactsMobileWebclient/vue-mobile).
 */
export default defineConfig({
  resolve: {
    alias: {
      'src/utils/types': path.resolve(root, 'test/unit/stubs/types.js'),
      'src/boot/i18n': path.resolve(root, 'test/unit/stubs/i18n.js'),
      'src/api/web-api': path.resolve(root, 'test/unit/stubs/web-api.js'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['test/unit/**/*.{spec,test}.{js,mjs}'],
  },
})
