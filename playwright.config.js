// Playwright runs the end-to-end tests against tools/serve.mjs, under the path GitHub Pages
// publishes the site at, in Chromium and WebKit.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}/OmniKnowledge/` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `node tools/serve.mjs --port=${PORT} --prefix=/OmniKnowledge/`,
    url: `http://127.0.0.1:${PORT}/OmniKnowledge/`,
    reuseExistingServer: !process.env.CI,
  },
});
