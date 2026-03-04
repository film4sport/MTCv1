import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['unit-tests/**/*.test.js'],
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 1,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['app/dashboard/lib/**'],
      reporter: ['text', 'text-summary'],
    },
  },
});
