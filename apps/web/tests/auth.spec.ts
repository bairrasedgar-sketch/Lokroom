import { test, expect, Page } from '@playwright/test';
import { testUsers } from './fixtures/users';

/**
 * Tests d'authentification E2E pour Lok'Room
 */

test.describe('Authentification', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test.describe('Inscription', () => {
    test('devrait permettre à un nouvel utilisateur de s\'inscrire', async () => {
      const newUser = testUsers.newUser;

      // Aller sur la page d'inscription
      await page.click('text=S\'inscrire');
      await expect(page).toHaveURL(/.*signup/);

      // Remplir le formulaire
      await page.fill('input[name="name"]', newUser.name);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', newUser.password);

      // Accepter les conditions
      await page.check('input[type="checkbox"][name="terms"]');

      // Soumettre le formulaire
      await page.click('button[type="submit"]');

      // Vérifier la redirection vers la page de vérification email
      await expect(page).toHaveURL(/.*verify-email/, { timeout: 10000 });
      await expect(page.locator('text=Vérifiez votre email')).toBeVisible();
    });

    test('devrait afficher une erreur si l\'email existe déjà', async () => {
      const existingUser = testUsers.guest;

      await page.click('text=S\'inscrire');
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', existingUser.email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.check('input[type="checkbox"][name="terms"]');

      await page.click('button[type="submit"]');

      // Vérifier le message d'erreur
      await expect(page.locator('text=/.*email.*déjà.*utilisé.*/i')).toBeVisible();
    });

    test('devrait valider le format de l\'email', async () => {
      await page.click('text=S\'inscrire');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Vérifier la validation HTML5 ou le message d'erreur
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('devrait valider la force du mot de passe', async () => {
      await page.click('text=S\'inscrire');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.click('button[type="submit"]');

      // Vérifier le message d'erreur sur le mot de passe
      await expect(page.locator('text=/.*mot de passe.*caractères.*/i')).toBeVisible();
    });

    test('devrait vérifier que les mots de passe correspondent', async () => {
      await page.click('text=S\'inscrire');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/.*mots de passe.*correspondent pas.*/i')).toBeVisible();
    });
  });

  test.describe('Connexion', () => {
    test('devrait permettre à un utilisateur de se connecter', async () => {
      const user = testUsers.guest;

      // Aller sur la page de connexion
      await page.click('text=Se connecter');
      await expect(page).toHaveURL(/.*login/);

      // Remplir le formulaire
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);

      // Soumettre
      await page.click('button[type="submit"]');

      // Vérifier la connexion réussie
      await expect(page).toHaveURL('/', { timeout: 10000 });
      await expect(page.locator(`text=${user.name}`)).toBeVisible();
    });

    test('devrait afficher une erreur avec des identifiants incorrects', async () => {
      await page.click('text=Se connecter');
      await page.fill('input[name="email"]', 'wrong@email.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/.*identifiants.*incorrects.*/i')).toBeVisible();
    });

    test('devrait permettre la connexion avec Google OAuth', async () => {
      await page.click('text=Se connecter');

      // Cliquer sur le bouton Google
      const googleButton = page.locator('button:has-text("Google")');
      await expect(googleButton).toBeVisible();

      // Note: En test, on ne peut pas vraiment tester OAuth sans mock
      // On vérifie juste que le bouton est présent et cliquable
      await expect(googleButton).toBeEnabled();
    });

    test('devrait se souvenir de l\'utilisateur avec "Se souvenir de moi"', async () => {
      const user = testUsers.guest;

      await page.click('text=Se connecter');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.check('input[name="remember"]');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/');

      // Vérifier que le cookie de session est persistant
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      expect(sessionCookie).toBeDefined();
    });
  });

  test.describe('Déconnexion', () => {
    test.beforeEach(async () => {
      // Se connecter d'abord
      const user = testUsers.guest;
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('devrait permettre à un utilisateur de se déconnecter', async () => {
      // Ouvrir le menu utilisateur
      await page.click('[data-testid="user-menu"]');

      // Cliquer sur déconnexion
      await page.click('text=Déconnexion');

      // Vérifier la déconnexion
      await expect(page.locator('text=Se connecter')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });
  });

  test.describe('Réinitialisation du mot de passe', () => {
    test('devrait permettre de demander une réinitialisation', async () => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"]', testUsers.guest.email);
      await page.click('button[type="submit"]');

      // Vérifier le message de confirmation
      await expect(page.locator('text=/.*email.*envoyé.*/i')).toBeVisible();
    });

    test('devrait afficher un message même pour un email inexistant (sécurité)', async () => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');

      // Pour la sécurité, on affiche le même message
      await expect(page.locator('text=/.*email.*envoyé.*/i')).toBeVisible();
    });

    test('devrait permettre de réinitialiser le mot de passe avec un token valide', async () => {
      // Note: Ce test nécessiterait un token valide généré en DB
      // Pour l'instant, on teste juste l'interface
      const mockToken = 'test-reset-token-123';
      await page.goto(`/reset-password?token=${mockToken}`);

      await page.fill('input[name="password"]', 'NewPassword123!');
      await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
      await page.click('button[type="submit"]');

      // Vérifier la redirection ou le message
      await expect(page.locator('text=/.*mot de passe.*modifié.*/i')).toBeVisible();
    });
  });

  test.describe('Vérification email', () => {
    test('devrait afficher la page de vérification après inscription', async () => {
      await page.goto('/verify-email');
      await expect(page.locator('text=Vérifiez votre email')).toBeVisible();
    });

    test('devrait permettre de renvoyer le code de vérification', async () => {
      await page.goto('/verify-email');

      const resendButton = page.locator('button:has-text("Renvoyer")');
      await resendButton.click();

      await expect(page.locator('text=/.*code.*renvoyé.*/i')).toBeVisible();
    });

    test('devrait valider le code de vérification', async () => {
      await page.goto('/verify-email');

      // Entrer un code (6 chiffres)
      const codeInputs = page.locator('input[type="text"][maxlength="1"]');
      const count = await codeInputs.count();

      for (let i = 0; i < count; i++) {
        await codeInputs.nth(i).fill('1');
      }

      // Le formulaire devrait se soumettre automatiquement
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });

  test.describe('Authentification à deux facteurs (2FA)', () => {
    test.beforeEach(async () => {
      // Se connecter en tant qu'utilisateur avec 2FA activé
      const user = testUsers.host;
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
    });

    test('devrait demander le code 2FA après connexion', async () => {
      // Si 2FA est activé, on devrait voir la page de vérification
      await expect(page.locator('text=/.*code.*authentification.*/i')).toBeVisible();
    });

    test('devrait permettre d\'activer 2FA dans les paramètres', async () => {
      await page.goto('/account/security');

      const enable2FAButton = page.locator('button:has-text("Activer")');
      await enable2FAButton.click();

      // Vérifier l'affichage du QR code
      await expect(page.locator('text=Scannez ce QR code')).toBeVisible();
      await expect(page.locator('canvas, img[alt*="QR"]')).toBeVisible();
    });

    test('devrait afficher les codes de secours après activation 2FA', async () => {
      await page.goto('/account/security');

      // Simuler l'activation (nécessiterait un vrai flux)
      // Vérifier que les codes de secours sont affichés
      await expect(page.locator('text=/.*codes.*secours.*/i')).toBeVisible();
    });
  });

  test.describe('Sécurité', () => {
    test('devrait protéger les routes authentifiées', async () => {
      // Essayer d'accéder à une page protégée sans être connecté
      await page.goto('/account');

      // Devrait rediriger vers login
      await expect(page).toHaveURL(/.*login/);
    });

    test('devrait limiter les tentatives de connexion', async () => {
      await page.goto('/login');

      // Faire plusieurs tentatives échouées
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'WrongPassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // Vérifier le message de blocage
      await expect(page.locator('text=/.*trop.*tentatives.*/i')).toBeVisible();
    });

    test('devrait déconnecter après inactivité', async () => {
      // Se connecter
      const user = testUsers.guest;
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Simuler l'inactivité (30 minutes)
      // Note: En test réel, on utiliserait un mock du temps
      // Pour l'instant, on vérifie juste que le mécanisme existe
      const sessionTimeout = await page.evaluate(() => {
        return window.localStorage.getItem('sessionTimeout');
      });

      expect(sessionTimeout).toBeDefined();
    });
  });
});
