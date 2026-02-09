import { test, expect } from '@playwright/test';

/**
 * Test simple pour vérifier que Playwright fonctionne
 */

test.describe('Vérification Playwright', () => {
  test('devrait charger la page d\'accueil', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Lok'Room|Lokroom/i);

    console.log('✅ Playwright fonctionne correctement!');
  });

  test('devrait avoir un header', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const header = page.locator('header, nav');
    await expect(header.first()).toBeVisible();

    console.log('✅ Header trouvé!');
  });

  test('devrait charger sans erreurs console critiques', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');

    // Filtrer les erreurs connues
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('analytics')
    );

    expect(criticalErrors.length).toBe(0);
    console.log('✅ Pas d\'erreurs console critiques!');
  });
});
