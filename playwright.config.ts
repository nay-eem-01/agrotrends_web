import { defineConfig } from '@playwright/test'

/**
 * Smoke tests against a running backend: `npm run e2e`.
 * - API_TARGET: the backend (default http://localhost:8080), passed to the dev server's proxy.
 * - E2E_EMAIL / E2E_PASSWORD: an author account for the signed-in tests (skipped without them).
 * - PW_CHANNEL=chrome: use the installed Chrome instead of Playwright's Chromium (`npx playwright install chromium`).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    channel: process.env.PW_CHANNEL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    env: { API_TARGET: process.env.API_TARGET ?? 'http://localhost:8080' },
  },
})
