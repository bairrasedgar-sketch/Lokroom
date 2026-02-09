import { test as base } from '@playwright/test';
import { testUsers, TestUser } from './fixtures/users';

/**
 * Helpers et fixtures personnalisés pour les tests E2E
 */

// Étendre le test avec des fixtures personnalisées
export const test = base.extend<{
  authenticatedPage: any;
  guestPage: any;
  hostPage: any;
  adminPage: any;
}>({
  // Page authentifiée avec un utilisateur quelconque
  authenticatedPage: async ({ page }: any, use: any, testInfo: any) => {
    const user = testUsers.guest;
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },

  // Page authentifiée en tant que guest
  guestPage: async ({ page }: any, use: any) => {
    const user = testUsers.guest;
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },

  // Page authentifiée en tant qu'hôte
  hostPage: async ({ page }: any, use: any) => {
    const user = testUsers.host;
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },

  // Page authentifiée en tant qu'admin
  adminPage: async ({ page }: any, use: any) => {
    const user = testUsers.admin;
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper pour attendre qu'un élément soit visible et cliquable
 */
export async function waitAndClick(page: any, selector: string, timeout = 10000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.click();
}

/**
 * Helper pour remplir un formulaire
 */
export async function fillForm(page: any, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
  }
}

/**
 * Helper pour uploader plusieurs fichiers
 */
export async function uploadFiles(page: any, selector: string, files: string[]) {
  const input = page.locator(selector);
  for (const file of files) {
    await input.setInputFiles(file);
    await page.waitForTimeout(300);
  }
}

/**
 * Helper pour attendre une navigation
 */
export async function waitForNavigation(page: any, urlPattern: RegExp, timeout = 10000) {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Helper pour scroller vers un élément
 */
export async function scrollToElement(page: any, selector: string) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Helper pour vérifier qu'un toast/notification apparaît
 */
export async function expectToast(page: any, message: string | RegExp) {
  const toast = page.locator('[data-testid="toast"], [role="alert"]');
  await toast.waitFor({ state: 'visible', timeout: 5000 });

  if (typeof message === 'string') {
    await expect(toast).toContainText(message);
  } else {
    await expect(toast).toContainText(message);
  }
}

/**
 * Helper pour attendre le chargement complet de la page
 */
export async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Helper pour prendre une capture d'écran avec un nom personnalisé
 */
export async function takeScreenshot(page: any, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Helper pour nettoyer les données de test
 */
export async function cleanupTestData(page: any) {
  // Supprimer les cookies
  await page.context().clearCookies();

  // Nettoyer le localStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Helper pour simuler un délai réseau
 */
export async function simulateSlowNetwork(page: any) {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.continue();
  });
}

/**
 * Helper pour intercepter les requêtes API
 */
export async function mockApiResponse(page: any, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper pour attendre qu'une requête API soit terminée
 */
export async function waitForApiCall(page: any, urlPattern: string | RegExp) {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

/**
 * Helper pour vérifier l'accessibilité d'une page
 */
export async function checkAccessibility(page: any) {
  // Vérifier les attributs ARIA
  const elementsWithoutAria = await page.locator('button:not([aria-label]):not([aria-labelledby])').count();
  expect(elementsWithoutAria).toBe(0);

  // Vérifier les images sans alt
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  expect(imagesWithoutAlt).toBe(0);
}

/**
 * Helper pour tester la navigation au clavier
 */
export async function testKeyboardNavigation(page: any, selectors: string[]) {
  for (const selector of selectors) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe(selector);
  }
}

/**
 * Helper pour créer un utilisateur de test
 */
export async function createTestUser(page: any, user: TestUser) {
  await page.goto('/signup');
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  await page.check('input[type="checkbox"][name="terms"]');
  await page.click('button[type="submit"]');
}

/**
 * Helper pour se connecter rapidement
 */
export async function login(page: any, user: TestUser) {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

/**
 * Helper pour se déconnecter
 */
export async function logout(page: any) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Déconnexion');
  await page.waitForURL('/');
}

/**
 * Helper pour vérifier qu'un élément est dans le viewport
 */
export async function isInViewport(page: any, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return await element.isVisible();
}

/**
 * Helper pour attendre qu'un loader disparaisse
 */
export async function waitForLoader(page: any) {
  const loader = page.locator('[data-testid="loader"], [data-testid="spinner"]');
  await loader.waitFor({ state: 'hidden', timeout: 10000 });
}

/**
 * Helper pour générer des données de test aléatoires
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@lokroom.com`,
    name: `Test User ${timestamp}`,
    title: `Test Listing ${timestamp}`,
    description: `Description de test générée le ${new Date().toISOString()}`,
  };
}

/**
 * Helper pour vérifier les méta-tags SEO
 */
export async function checkSeoMetaTags(page: any) {
  // Vérifier le titre
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(10);
  expect(title.length).toBeLessThan(60);

  // Vérifier la description
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();
  expect(description!.length).toBeGreaterThan(50);
  expect(description!.length).toBeLessThan(160);

  // Vérifier les Open Graph tags
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  expect(ogTitle).toBeTruthy();

  const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
  expect(ogDescription).toBeTruthy();

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toBeTruthy();
}

/**
 * Helper pour tester le responsive
 */
export async function testResponsive(page: any, callback: (viewport: string) => Promise<void>) {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await callback(viewport.name);
  }
}

/**
 * Helper pour vérifier les performances
 */
export async function checkPerformance(page: any) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
    };
  });

  // Vérifier que le DOMContentLoaded est rapide (< 2s)
  expect(metrics.domContentLoaded).toBeLessThan(2000);

  // Vérifier que le chargement complet est raisonnable (< 5s)
  expect(metrics.loadComplete).toBeLessThan(5000);

  return metrics;
}
