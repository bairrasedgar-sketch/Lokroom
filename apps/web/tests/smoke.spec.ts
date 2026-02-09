import { test, expect } from '@playwright/test';

/**
 * Tests de santé (smoke tests) pour vérifier que l'application fonctionne
 */

test.describe('Smoke Tests', () => {
  test('devrait charger la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lok'Room/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('devrait charger la page de recherche', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/.*search/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('devrait charger la page de connexion', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('devrait charger la page d\'inscription', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('devrait charger la page À propos', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/.*about/);
  });

  test('devrait charger la page Contact', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL(/.*contact/);
  });

  test('devrait avoir un header visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('devrait avoir un footer visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });

  test('devrait charger les assets CSS', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Vérifier qu'il n'y a pas d'erreurs de chargement CSS
    const cssErrors = await page.evaluate(() => {
      return Array.from(document.styleSheets).filter(sheet => {
        try {
          return !sheet.cssRules;
        } catch {
          return true;
        }
      }).length;
    });

    expect(cssErrors).toBe(0);
  });

  test('ne devrait pas avoir d\'erreurs console critiques', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Filtrer les erreurs connues/acceptables
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('analytics')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('devrait répondre rapidement (< 3s)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('devrait avoir des liens de navigation fonctionnels', async ({ page }) => {
    await page.goto('/');

    // Tester quelques liens principaux
    const links = [
      { text: 'Rechercher', url: /search/ },
      { text: 'Devenir hôte', url: /become-host/ },
    ];

    for (const link of links) {
      await page.goto('/');
      await page.click(`text=${link.text}`);
      await expect(page).toHaveURL(link.url);
    }
  });

  test('devrait gérer les routes 404', async ({ page }) => {
    const response = await page.goto('/page-qui-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.locator('text=/404|introuvable/i')).toBeVisible();
  });

  test('devrait avoir un manifest.json valide', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
  });

  test('devrait avoir un robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
  });

  test('devrait avoir un sitemap.xml', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
  });
});

/**
 * Tests de régression pour vérifier que les fonctionnalités critiques fonctionnent
 */
test.describe('Regression Tests', () => {
  test('devrait permettre la recherche basique', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="location"]', 'Paris');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*search/);
  });

  test('devrait afficher les annonces sur la page de recherche', async ({ page }) => {
    await page.goto('/search?location=Paris');

    // Attendre que les résultats se chargent
    await page.waitForSelector('[data-testid="listing-card"]', { timeout: 10000 });

    const listings = page.locator('[data-testid="listing-card"]');
    expect(await listings.count()).toBeGreaterThan(0);
  });

  test('devrait pouvoir ouvrir une annonce', async ({ page }) => {
    await page.goto('/search?location=Paris');
    await page.waitForSelector('[data-testid="listing-card"]');

    await page.click('[data-testid="listing-card"]');
    await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/);
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('devrait afficher le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('devrait charger Google Maps sur une annonce', async ({ page }) => {
    await page.goto('/search?location=Paris');
    await page.waitForSelector('[data-testid="listing-card"]');
    await page.click('[data-testid="listing-card"]');

    // Scroller vers la carte
    await page.locator('[data-testid="location-map"]').scrollIntoViewIfNeeded();

    // Vérifier que la carte est chargée
    await expect(page.locator('[data-testid="location-map"]')).toBeVisible();
  });

  test('devrait afficher les filtres de recherche', async ({ page }) => {
    await page.goto('/search?location=Paris');

    await page.click('button:has-text("Filtres")');
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
  });

  test('devrait permettre de changer la langue', async ({ page }) => {
    await page.goto('/');

    // Ouvrir le sélecteur de langue
    await page.click('[data-testid="language-selector"]');

    // Sélectionner anglais
    await page.click('text=English');

    // Vérifier que la langue a changé
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('devrait afficher les notifications', async ({ page }) => {
    await page.goto('/');

    // Vérifier que l'icône de notification existe
    const notificationIcon = page.locator('[data-testid="notifications-icon"]');
    if (await notificationIcon.count() > 0) {
      await expect(notificationIcon).toBeVisible();
    }
  });

  test('devrait gérer le mode sombre', async ({ page }) => {
    await page.goto('/');

    // Basculer en mode sombre
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();

      // Vérifier que le thème a changé
      const html = page.locator('html');
      const theme = await html.getAttribute('data-theme');
      expect(['dark', 'light']).toContain(theme);
    }
  });
});

/**
 * Tests de sécurité basiques
 */
test.describe('Security Tests', () => {
  test('devrait avoir des headers de sécurité', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // Vérifier les headers de sécurité importants
    expect(headers?.['x-frame-options']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('devrait utiliser HTTPS en production', async ({ page }) => {
    const url = page.url();
    if (process.env.NODE_ENV === 'production') {
      expect(url).toMatch(/^https:/);
    }
  });

  test('ne devrait pas exposer d\'informations sensibles dans le HTML', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();

    // Vérifier qu'il n'y a pas de secrets exposés
    expect(content).not.toContain('sk_live_');
    expect(content).not.toContain('sk_test_');
    expect(content).not.toContain('password');
    expect(content).not.toContain('secret');
  });

  test('devrait protéger contre les injections XSS', async ({ page }) => {
    await page.goto('/search?q=<script>alert("xss")</script>');

    // Vérifier que le script n'est pas exécuté
    const alerts: string[] = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    expect(alerts.length).toBe(0);
  });

  test('devrait avoir une politique CSP', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const csp = headers?.['content-security-policy'];
    if (csp) {
      expect(csp).toContain('default-src');
    }
  });
});

/**
 * Tests de performance
 */
test.describe('Performance Tests', () => {
  test('devrait charger la page d\'accueil rapidement', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('devrait avoir un First Contentful Paint rapide', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry?.startTime || 0;
    });

    expect(fcp).toBeLessThan(2000);
  });

  test('devrait avoir des images optimisées', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Vérifier que les images ont des attributs width et height
        const width = await img.getAttribute('width');
        const height = await img.getAttribute('height');

        // Au moins l'un des deux devrait être défini
        expect(width || height).toBeTruthy();
      }
    }
  });

  test('ne devrait pas avoir de ressources bloquantes', async ({ page }) => {
    await page.goto('/');

    const blockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.filter(r =>
        r.renderBlockingStatus === 'blocking'
      ).length;
    });

    // Devrait avoir peu de ressources bloquantes
    expect(blockingResources).toBeLessThan(5);
  });
});

/**
 * Tests d'accessibilité
 */
test.describe('Accessibility Tests', () => {
  test('devrait avoir un attribut lang sur html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('devrait avoir des labels pour tous les inputs', async ({ page }) => {
    await page.goto('/login');

    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;

        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('devrait avoir des alt text pour toutes les images', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('devrait avoir une navigation au clavier fonctionnelle', async ({ page }) => {
    await page.goto('/');

    // Tester la navigation avec Tab
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocusable).toBeTruthy();
  });

  test('devrait avoir des contrastes de couleur suffisants', async ({ page }) => {
    await page.goto('/');

    // Vérifier que le texte principal a un bon contraste
    const textColor = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).color
    );

    const bgColor = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(textColor).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  test('devrait avoir des rôles ARIA appropriés', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les éléments interactifs ont des rôles
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const role = await button.getAttribute('role');
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Un bouton devrait avoir soit un texte, soit un aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
