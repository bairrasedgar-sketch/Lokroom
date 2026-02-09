# Tests E2E Playwright - Guide de contribution

## Ajouter un nouveau test

### 1. Créer un nouveau fichier de test

```typescript
import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/users';

test.describe('Ma nouvelle fonctionnalité', () => {
  test.beforeEach(async ({ page }) => {
    // Setup commun
    await page.goto('/');
  });

  test('devrait faire quelque chose', async ({ page }) => {
    // Votre test ici
    await page.click('[data-testid="mon-bouton"]');
    await expect(page.locator('[data-testid="resultat"]')).toBeVisible();
  });
});
```

### 2. Utiliser les fixtures existantes

```typescript
import { test } from './helpers';

test('mon test avec utilisateur connecté', async ({ guestPage }) => {
  // guestPage est déjà connecté
  await guestPage.goto('/ma-page');
});
```

### 3. Ajouter des data-testid dans le code

```tsx
// Dans votre composant React
<button data-testid="submit-button" onClick={handleSubmit}>
  Soumettre
</button>

<div data-testid="listing-card">
  {/* Contenu */}
</div>
```

### 4. Utiliser les helpers

```typescript
import { fillForm, expectToast, waitForNavigation } from './helpers';

test('mon test', async ({ page }) => {
  // Remplir un formulaire
  await fillForm(page, {
    name: 'John Doe',
    email: 'john@example.com',
  });

  // Vérifier un toast
  await expectToast(page, 'Succès!');

  // Attendre une navigation
  await waitForNavigation(page, /\/success/);
});
```

## Bonnes pratiques

### 1. Nommage des tests

```typescript
// ✅ Bon - Descriptif et clair
test('devrait permettre de créer une annonce avec 5 photos', async ({ page }) => {});

// ❌ Éviter - Trop vague
test('test création', async ({ page }) => {});
```

### 2. Sélecteurs

```typescript
// ✅ Bon - Utiliser data-testid
await page.click('[data-testid="submit-button"]');

// ❌ Éviter - Sélecteurs CSS fragiles
await page.click('button.btn-primary.submit');
```

### 3. Attentes explicites

```typescript
// ✅ Bon - Attendre explicitement
await page.waitForSelector('[data-testid="results"]');
await page.click('[data-testid="first-result"]');

// ❌ Éviter - Cliquer sans attendre
await page.click('[data-testid="first-result"]'); // Peut échouer
```

### 4. Assertions

```typescript
// ✅ Bon - Assertions Playwright
await expect(page.locator('[data-testid="price"]')).toHaveText('50€');

// ❌ Éviter - Assertions manuelles
const text = await page.locator('[data-testid="price"]').textContent();
expect(text).toBe('50€');
```

### 5. Organisation

```typescript
test.describe('Ma fonctionnalité', () => {
  test.beforeEach(async ({ page }) => {
    // Setup commun
  });

  test.describe('Cas nominal', () => {
    test('devrait fonctionner normalement', async ({ page }) => {});
  });

  test.describe('Cas d\'erreur', () => {
    test('devrait afficher une erreur', async ({ page }) => {});
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
  });
});
```

## Ajouter une nouvelle fixture

### 1. Créer la fixture

```typescript
// tests/fixtures/mon-entite.ts
export interface MonEntite {
  id: string;
  name: string;
  // ...
}

export const testMonEntites = {
  entite1: {
    id: 'test-1',
    name: 'Test Entity 1',
  },
  entite2: {
    id: 'test-2',
    name: 'Test Entity 2',
  },
};

export const getTestMonEntite = (key: keyof typeof testMonEntites) => {
  return testMonEntites[key];
};
```

### 2. Utiliser la fixture

```typescript
import { testMonEntites } from './fixtures/mon-entite';

test('mon test', async ({ page }) => {
  const entite = testMonEntites.entite1;
  // Utiliser l'entité
});
```

## Ajouter un nouveau helper

### 1. Créer le helper

```typescript
// tests/helpers.ts
export async function monNouveauHelper(page: Page, param: string) {
  // Logique du helper
  await page.click(`[data-testid="${param}"]`);
  await page.waitForSelector('[data-testid="result"]');
}
```

### 2. Utiliser le helper

```typescript
import { monNouveauHelper } from './helpers';

test('mon test', async ({ page }) => {
  await monNouveauHelper(page, 'mon-element');
});
```

## Débugger un test

### 1. Mode headed

```bash
npx playwright test mon-test.spec.ts --headed
```

### 2. Mode debug

```bash
npx playwright test mon-test.spec.ts --debug
```

### 3. Pause dans le test

```typescript
test('mon test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Ouvre l'inspecteur
  await page.click('[data-testid="button"]');
});
```

### 4. Screenshots

```typescript
test('mon test', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'debug.png' });
});
```

### 5. Console logs

```typescript
test('mon test', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('/');
});
```

## Tester en local

### 1. Démarrer l'application

```bash
cd apps/web
npm run dev
```

### 2. Lancer les tests

```bash
# Dans un autre terminal
npm run test:e2e:ui
```

### 3. Sélectionner un test

Dans l'interface UI, cliquer sur le test à lancer.

## Tester en CI

Les tests sont automatiquement lancés sur:
- Push sur `main` et `develop`
- Pull requests vers `main`
- Quotidiennement à 4h

Voir les résultats dans l'onglet "Actions" de GitHub.

## Résoudre les problèmes courants

### Test flaky (instable)

```typescript
// Ajouter des attentes explicites
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="element"]');

// Augmenter le timeout si nécessaire
await page.waitForSelector('[data-testid="element"]', { timeout: 30000 });
```

### Sélecteur introuvable

```typescript
// Vérifier que l'élément existe
const element = page.locator('[data-testid="element"]');
console.log('Count:', await element.count());

// Attendre que l'élément apparaisse
await element.waitFor({ state: 'visible' });
```

### Timeout

```typescript
// Augmenter le timeout pour ce test
test('mon test lent', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ...
});
```

### Erreur de navigation

```typescript
// Attendre la navigation complète
await page.goto('/', { waitUntil: 'networkidle' });

// Ou attendre un élément spécifique
await page.goto('/');
await page.waitForSelector('[data-testid="header"]');
```

## Conventions de code

### Nommage

- Fichiers de test: `*.spec.ts`
- Fixtures: `tests/fixtures/*.ts`
- Helpers: `tests/helpers.ts`
- data-testid: kebab-case (`listing-card`, `submit-button`)

### Structure

```
tests/
├── fixtures/          # Données de test
│   ├── users.ts
│   ├── listings.ts
│   └── ...
├── helpers.ts         # Helpers réutilisables
├── auth.spec.ts       # Tests d'authentification
├── booking.spec.ts    # Tests de réservation
└── ...
```

### Commentaires

```typescript
/**
 * Test de la fonctionnalité X
 *
 * Vérifie que:
 * - L'utilisateur peut faire Y
 * - Le système affiche Z
 */
test('devrait faire X', async ({ page }) => {
  // Arrange
  await page.goto('/');

  // Act
  await page.click('[data-testid="button"]');

  // Assert
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Checklist avant de commiter

- [ ] Les tests passent en local
- [ ] Les data-testid sont ajoutés dans le code
- [ ] Les sélecteurs sont robustes (data-testid)
- [ ] Les attentes sont explicites (waitFor)
- [ ] Les tests sont bien nommés
- [ ] Les tests sont documentés
- [ ] Pas de code dupliqué (utiliser les helpers)
- [ ] Les fixtures sont réutilisées
- [ ] Les timeouts sont appropriés
- [ ] Le code est formaté (prettier)

## Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Fixtures](https://playwright.dev/docs/test-fixtures)

## Support

En cas de question:
1. Consulter `tests/README.md`
2. Consulter `QUICK_START_E2E.md`
3. Vérifier les tests existants pour des exemples
4. Consulter la documentation Playwright
5. Demander de l'aide à l'équipe
