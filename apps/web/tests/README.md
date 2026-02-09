# Guide de test E2E Playwright pour Lok'Room

## Installation

```bash
cd apps/web
npm install -D @playwright/test
npx playwright install --with-deps
```

## Configuration

Le fichier `playwright.config.ts` est configuré avec:
- 4 workers en parallèle (2 en CI)
- Tests sur Chromium, Firefox, WebKit
- Tests mobile (Chrome & Safari)
- Screenshots et vidéos en cas d'échec
- Retry automatique en CI

## Structure des tests

```
tests/
├── fixtures/
│   ├── users.ts          # Utilisateurs de test
│   ├── listings.ts       # Annonces de test
│   ├── bookings.ts       # Réservations de test
│   └── images/           # Images pour les tests
├── auth.spec.ts          # Tests d'authentification
├── listing-creation.spec.ts  # Tests création d'annonce
├── booking.spec.ts       # Tests de réservation
├── messaging.spec.ts     # Tests de messagerie
├── reviews.spec.ts       # Tests des avis
├── smoke.spec.ts         # Tests de santé
└── helpers.ts            # Helpers et fixtures
```

## Commandes

### Lancer tous les tests
```bash
npm run test:e2e
```

### Mode UI interactif
```bash
npm run test:e2e:ui
```

### Mode debug
```bash
npm run test:e2e:debug
```

### Lancer un fichier spécifique
```bash
npx playwright test tests/auth.spec.ts
```

### Lancer un test spécifique
```bash
npx playwright test tests/auth.spec.ts -g "devrait permettre de se connecter"
```

### Lancer sur un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Voir le rapport HTML
```bash
npx playwright show-report
```

## Variables d'environnement

Créer un fichier `.env.test` avec:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lokroom_test"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

## Fixtures

### Utilisateurs de test

```typescript
import { testUsers } from './fixtures/users';

// Utiliser un utilisateur guest
const guest = testUsers.guest;

// Utiliser un hôte
const host = testUsers.host;

// Utiliser un admin
const admin = testUsers.admin;
```

### Annonces de test

```typescript
import { testListings } from './fixtures/listings';

// Annonce appartement
const apartment = testListings.apartment;

// Annonce studio
const studio = testListings.studio;

// Annonce maison
const house = testListings.house;

// Annonce parking
const parking = testListings.parking;
```

### Réservations de test

```typescript
import { testBookings, createCustomBooking } from './fixtures/bookings';

// Réservation courte durée
const shortTerm = testBookings.shortTerm;

// Réservation longue durée
const longTerm = testBookings.longTerm;

// Créer une réservation personnalisée
const custom = createCustomBooking(7, 4, 2); // Dans 7 jours, 4h, 2 personnes
```

## Helpers

### Authentification rapide

```typescript
import { login, logout } from './helpers';

// Se connecter
await login(page, testUsers.guest);

// Se déconnecter
await logout(page);
```

### Remplir un formulaire

```typescript
import { fillForm } from './helpers';

await fillForm(page, {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
});
```

### Attendre une navigation

```typescript
import { waitForNavigation } from './helpers';

await waitForNavigation(page, /\/listings\/[a-z0-9]+/);
```

### Vérifier un toast

```typescript
import { expectToast } from './helpers';

await expectToast(page, 'Réservation confirmée');
```

### Upload de fichiers

```typescript
import { uploadFiles } from './helpers';

await uploadFiles(page, 'input[type="file"]', [
  'tests/fixtures/images/photo1.jpg',
  'tests/fixtures/images/photo2.jpg',
]);
```

## Fixtures personnalisées

Utiliser des pages pré-authentifiées:

```typescript
import { test } from './helpers';

test('mon test avec guest', async ({ guestPage }) => {
  // guestPage est déjà connecté en tant que guest
  await guestPage.goto('/bookings');
});

test('mon test avec hôte', async ({ hostPage }) => {
  // hostPage est déjà connecté en tant qu'hôte
  await hostPage.goto('/host/listings');
});

test('mon test avec admin', async ({ adminPage }) => {
  // adminPage est déjà connecté en tant qu'admin
  await adminPage.goto('/admin/dashboard');
});
```

## Bonnes pratiques

### 1. Utiliser des data-testid

```typescript
// ✅ Bon
await page.click('[data-testid="submit-button"]');

// ❌ Éviter
await page.click('button.btn-primary');
```

### 2. Attendre les éléments

```typescript
// ✅ Bon
await page.waitForSelector('[data-testid="listing-card"]');
await page.click('[data-testid="listing-card"]');

// ❌ Éviter
await page.click('[data-testid="listing-card"]'); // Peut échouer si pas encore chargé
```

### 3. Utiliser des assertions explicites

```typescript
// ✅ Bon
await expect(page.locator('[data-testid="price"]')).toHaveText('50€');

// ❌ Éviter
const text = await page.locator('[data-testid="price"]').textContent();
expect(text).toBe('50€');
```

### 4. Nettoyer après les tests

```typescript
test.afterEach(async ({ page }) => {
  await cleanupTestData(page);
});
```

### 5. Utiliser des timeouts appropriés

```typescript
// Pour les opérations longues
await page.waitForSelector('[data-testid="results"]', { timeout: 30000 });

// Pour les opérations rapides
await page.waitForSelector('[data-testid="button"]', { timeout: 5000 });
```

## Tests par catégorie

### Tests d'authentification (auth.spec.ts)
- ✅ Inscription
- ✅ Connexion/déconnexion
- ✅ Réinitialisation mot de passe
- ✅ Vérification email
- ✅ 2FA
- ✅ OAuth Google

### Tests de création d'annonce (listing-creation.spec.ts)
- ✅ Création APARTMENT
- ✅ Création STUDIO
- ✅ Création HOUSE
- ✅ Création PARKING
- ✅ Upload photos (min 5)
- ✅ Validation formulaire
- ✅ Brouillons

### Tests de réservation (booking.spec.ts)
- ✅ Recherche d'espace
- ✅ Filtres (type, prix, capacité, équipements)
- ✅ Détails annonce
- ✅ Création réservation
- ✅ Calcul prix avec réductions
- ✅ Paiement Stripe
- ✅ Confirmation

### Tests de messagerie (messaging.spec.ts)
- ✅ Liste conversations
- ✅ Envoyer message texte
- ✅ Envoyer image
- ✅ Indicateur de frappe
- ✅ Messages lus/non lus
- ✅ Notifications temps réel
- ✅ Recherche dans messages

### Tests des avis (reviews.spec.ts)
- ✅ Laisser un avis
- ✅ Upload photos dans avis
- ✅ Notes par catégorie
- ✅ Réponse de l'hôte
- ✅ Filtres et tri
- ✅ Signalement

### Tests de santé (smoke.spec.ts)
- ✅ Chargement pages principales
- ✅ Navigation
- ✅ Erreurs console
- ✅ Performance
- ✅ Sécurité
- ✅ Accessibilité

## Debugging

### Mode headed (voir le navigateur)

```bash
npx playwright test --headed
```

### Mode debug avec pause

```typescript
test('mon test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Ouvre l'inspecteur Playwright
});
```

### Traces

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Vidéos

Les vidéos sont automatiquement enregistrées en cas d'échec et sauvegardées dans `test-results/`.

## CI/CD

Le workflow `.github/workflows/e2e-tests.yml` lance automatiquement les tests sur:
- Push sur `main` et `develop`
- Pull requests vers `main`
- Quotidiennement à 4h du matin

Les rapports et vidéos sont uploadés comme artifacts GitHub Actions.

## Couverture

Objectif: **80%+ des parcours critiques**

### Parcours critiques couverts:
1. ✅ Inscription → Vérification email → Connexion
2. ✅ Recherche → Détails annonce → Réservation → Paiement
3. ✅ Création annonce complète (4 types)
4. ✅ Messagerie hôte-voyageur
5. ✅ Laisser un avis après réservation
6. ✅ Réponse de l'hôte à un avis

### Parcours à ajouter (optionnel):
- Gestion du profil utilisateur
- Système de favoris/wishlists
- Notifications push
- Disputes et résolution
- Panel admin

## Troubleshooting

### Les tests échouent localement

1. Vérifier que l'app tourne sur `http://localhost:3000`
2. Vérifier les variables d'environnement dans `.env.test`
3. Vérifier que la DB de test est accessible
4. Nettoyer les données de test: `npm run test:cleanup`

### Timeouts

Augmenter les timeouts dans `playwright.config.ts`:

```typescript
timeout: 120 * 1000, // 2 minutes
```

### Erreurs de sélecteurs

Vérifier que les `data-testid` existent dans le code:

```bash
grep -r "data-testid=\"listing-card\"" src/
```

### Tests flaky

Ajouter des `waitFor` explicites:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="element"]');
```

## Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
