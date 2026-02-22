import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['unit-tests/**/*.test.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['app/dashboard/lib/**'],
      reporter: ['text', 'text-summary'],
    },
  },
});
