import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@rotom/engine': new URL('./src/index.ts', import.meta.url).pathname,
    },
  },
})
