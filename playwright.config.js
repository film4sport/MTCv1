const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: 2,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm start' : 'npm run dev',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
