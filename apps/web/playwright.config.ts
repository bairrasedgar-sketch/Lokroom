import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E de Lok'Room
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Timeout pour chaque test
  timeout: 60 * 1000,

  // Timeout pour les assertions expect()
  expect: {
    timeout: 10 * 1000,
  },

  // Exécution des tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  // Reporter pour les résultats
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Configuration globale
  use: {
    // Base URL de l'application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Timeout pour les actions
    actionTimeout: 15 * 1000,

    // Timeout pour la navigation
    navigationTimeout: 30 * 1000,

    // Locale
    locale: 'fr-FR',

    // Timezone
    timezoneId: 'Europe/Paris',

    // Viewport par défaut
    viewport: { width: 1280, height: 720 },
  },

  // Projets de test (différents navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Tests mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Serveur de développement local
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
