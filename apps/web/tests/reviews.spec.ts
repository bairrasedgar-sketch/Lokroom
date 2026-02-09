import { test, expect, Page } from '@playwright/test';
import { testUsers } from './fixtures/users';

/**
 * Tests des avis (reviews) E2E pour Lok'Room
 */

test.describe('Avis et évaluations', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Se connecter en tant que guest
    const guest = testUsers.guest;
    await page.goto('/login');
    await page.fill('input[name="email"]', guest.email);
    await page.fill('input[name="password"]', guest.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Laisser un avis', () => {
    test('devrait permettre de laisser un avis après une réservation', async () => {
      // Aller sur une réservation terminée
      await page.goto('/trips');
      await page.click('text=Passées');

      // Cliquer sur "Laisser un avis"
      const reviewButton = page.locator('button:has-text("Laisser un avis")').first();
      await reviewButton.click();

      // Vérifier la page d'avis
      await expect(page).toHaveURL(/.*review/);
      await expect(page.locator('text=Partagez votre expérience')).toBeVisible();

      // Donner une note globale
      await page.click('[data-testid="rating-star-5"]');

      // Notes par catégorie
      await page.click('[data-testid="cleanliness-star-5"]');
      await page.click('[data-testid="accuracy-star-5"]');
      await page.click('[data-testid="communication-star-5"]');
      await page.click('[data-testid="location-star-4"]');
      await page.click('[data-testid="value-star-5"]');

      // Écrire un commentaire
      const reviewText = 'Excellent espace, très bien équipé et l\'hôte était très réactif. Je recommande vivement !';
      await page.fill('textarea[name="comment"]', reviewText);

      // Soumettre
      await page.click('button:has-text("Publier l\'avis")');

      // Vérifier la confirmation
      await expect(page.locator('text=/.*avis.*publié.*/i')).toBeVisible();
    });

    test('devrait valider qu\'un avis contient au minimum 50 caractères', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Donner une note
      await page.click('[data-testid="rating-star-4"]');

      // Écrire un commentaire trop court
      await page.fill('textarea[name="comment"]', 'Bien');

      // Essayer de soumettre
      await page.click('button:has-text("Publier l\'avis")');

      // Vérifier le message d'erreur
      await expect(page.locator('text=/.*minimum.*50.*caractères.*/i')).toBeVisible();
    });

    test('devrait permettre d\'uploader des photos dans l\'avis', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Donner une note
      await page.click('[data-testid="rating-star-5"]');

      // Uploader des photos
      const photoInput = page.locator('input[type="file"][accept*="image"]');
      await photoInput.setInputFiles([
        'tests/fixtures/images/test-photo-1.jpg',
        'tests/fixtures/images/test-photo-2.jpg',
        'tests/fixtures/images/test-photo-3.jpg',
      ]);

      // Vérifier l'aperçu des photos
      const uploadedPhotos = page.locator('[data-testid="review-photo-preview"]');
      await expect(uploadedPhotos).toHaveCount(3);

      // Écrire un commentaire
      await page.fill('textarea[name="comment"]', 'Superbe espace ! Voici quelques photos de notre expérience.');

      // Soumettre
      await page.click('button:has-text("Publier l\'avis")');

      // Vérifier la confirmation
      await expect(page.locator('text=/.*avis.*publié.*/i')).toBeVisible();
    });

    test('devrait limiter le nombre de photos à 10', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Essayer d'uploader 11 photos
      const photoInput = page.locator('input[type="file"][accept*="image"]');

      for (let i = 1; i <= 11; i++) {
        await photoInput.setInputFiles(`tests/fixtures/images/test-photo-${i % 5 + 1}.jpg`);
        await page.waitForTimeout(200);
      }

      // Vérifier qu'il n'y a que 10 photos
      const uploadedPhotos = page.locator('[data-testid="review-photo-preview"]');
      await expect(uploadedPhotos).toHaveCount(10);

      // Vérifier le message d'avertissement
      await expect(page.locator('text=/.*maximum.*10.*photos.*/i')).toBeVisible();
    });

    test('devrait permettre de supprimer une photo uploadée', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Uploader des photos
      const photoInput = page.locator('input[type="file"][accept*="image"]');
      await photoInput.setInputFiles([
        'tests/fixtures/images/test-photo-1.jpg',
        'tests/fixtures/images/test-photo-2.jpg',
      ]);

      // Vérifier qu'il y a 2 photos
      let uploadedPhotos = page.locator('[data-testid="review-photo-preview"]');
      await expect(uploadedPhotos).toHaveCount(2);

      // Supprimer la première photo
      await page.click('[data-testid="remove-photo-0"]');

      // Vérifier qu'il ne reste qu'une photo
      uploadedPhotos = page.locator('[data-testid="review-photo-preview"]');
      await expect(uploadedPhotos).toHaveCount(1);
    });

    test('devrait afficher un aperçu du calcul de la note moyenne', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Donner des notes différentes
      await page.click('[data-testid="cleanliness-star-5"]');
      await page.click('[data-testid="accuracy-star-4"]');
      await page.click('[data-testid="communication-star-5"]');
      await page.click('[data-testid="location-star-3"]');
      await page.click('[data-testid="value-star-4"]');

      // Vérifier le calcul de la moyenne (5+4+5+3+4)/5 = 4.2
      const averageRating = page.locator('[data-testid="average-rating-preview"]');
      await expect(averageRating).toHaveText(/4\.2/);
    });

    test('devrait empêcher de laisser plusieurs avis pour la même réservation', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');

      // Chercher une réservation déjà évaluée
      const reviewedBooking = page.locator('[data-testid="booking-card"]:has([data-testid="review-submitted"])').first();

      if (await reviewedBooking.count() > 0) {
        // Le bouton "Laisser un avis" ne devrait pas être présent
        await expect(reviewedBooking.locator('button:has-text("Laisser un avis")')).not.toBeVisible();

        // Un bouton "Voir l'avis" devrait être présent
        await expect(reviewedBooking.locator('button:has-text("Voir l\'avis")')).toBeVisible();
      }
    });

    test('devrait permettre de sauvegarder un brouillon d\'avis', async () => {
      await page.goto('/trips');
      await page.click('text=Passées');
      await page.locator('button:has-text("Laisser un avis")').first().click();

      // Commencer à remplir
      await page.click('[data-testid="rating-star-4"]');
      await page.fill('textarea[name="comment"]', 'Début de mon avis...');

      // Sauvegarder comme brouillon
      await page.click('button:has-text("Sauvegarder le brouillon")');

      // Vérifier la confirmation
      await expect(page.locator('text=/.*brouillon.*sauvegardé.*/i')).toBeVisible();

      // Revenir plus tard
      await page.goto('/trips');
      await page.click('text=Passées');

      // Le bouton devrait indiquer "Continuer l'avis"
      await expect(page.locator('button:has-text("Continuer l\'avis")')).toBeVisible();
    });
  });

  test.describe('Affichage des avis', () => {
    test('devrait afficher tous les avis d\'une annonce', async () => {
      // Aller sur une annonce
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Scroller vers les avis
      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier les éléments
      await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="review-count"]')).toBeVisible();

      // Vérifier les cartes d'avis
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      if (count > 0) {
        await expect(reviews.first()).toBeVisible();
        await expect(reviews.first().locator('[data-testid="reviewer-name"]')).toBeVisible();
        await expect(reviews.first().locator('[data-testid="review-rating"]')).toBeVisible();
        await expect(reviews.first().locator('[data-testid="review-date"]')).toBeVisible();
        await expect(reviews.first().locator('[data-testid="review-comment"]')).toBeVisible();
      }
    });

    test('devrait afficher les photos des avis', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Chercher un avis avec photos
      const reviewWithPhotos = page.locator('[data-testid="review-card"]:has([data-testid="review-photos"])').first();

      if (await reviewWithPhotos.count() > 0) {
        await expect(reviewWithPhotos.locator('[data-testid="review-photos"]')).toBeVisible();

        // Cliquer sur une photo pour l'agrandir
        await reviewWithPhotos.locator('[data-testid="review-photo"]').first().click();

        // Vérifier la lightbox
        await expect(page.locator('[data-testid="photo-lightbox"]')).toBeVisible();

        // Fermer
        await page.click('[data-testid="close-lightbox"]');
      }
    });

    test('devrait filtrer les avis par note', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Filtrer par 5 étoiles
      await page.click('[data-testid="filter-5-stars"]');

      // Vérifier que seuls les avis 5 étoiles sont affichés
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      for (let i = 0; i < count; i++) {
        const rating = await reviews.nth(i).locator('[data-testid="review-rating"]').getAttribute('data-rating');
        expect(rating).toBe('5');
      }
    });

    test('devrait trier les avis', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Trier par plus récents
      await page.selectOption('select[name="sortReviews"]', 'recent');

      // Vérifier l'ordre des dates
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      if (count > 1) {
        const dates: Date[] = [];

        for (let i = 0; i < count; i++) {
          const dateText = await reviews.nth(i).locator('[data-testid="review-date"]').getAttribute('data-date');
          if (dateText) {
            dates.push(new Date(dateText));
          }
        }

        // Vérifier que les dates sont en ordre décroissant
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i - 1].getTime());
        }
      }
    });

    test('devrait afficher la répartition des notes', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier le graphique de répartition
      await expect(page.locator('[data-testid="rating-distribution"]')).toBeVisible();

      // Vérifier chaque barre
      for (let i = 5; i >= 1; i--) {
        await expect(page.locator(`[data-testid="rating-bar-${i}"]`)).toBeVisible();
      }
    });

    test('devrait paginer les avis', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier le nombre d'avis affichés (par défaut 10)
      const reviews = page.locator('[data-testid="review-card"]');
      const initialCount = await reviews.count();

      if (initialCount >= 10) {
        // Cliquer sur "Voir plus"
        await page.click('button:has-text("Voir plus d\'avis")');

        // Vérifier qu'il y a plus d'avis
        const newCount = await reviews.count();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });

    test('devrait afficher les notes par catégorie', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier les moyennes par catégorie
      await expect(page.locator('[data-testid="category-cleanliness"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-accuracy"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-communication"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-location"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-value"]')).toBeVisible();
    });

    test('devrait rechercher dans les avis', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Rechercher un mot-clé
      await page.fill('input[name="searchReviews"]', 'propre');

      // Vérifier que les résultats contiennent le mot-clé
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      for (let i = 0; i < count; i++) {
        const commentText = await reviews.nth(i).locator('[data-testid="review-comment"]').textContent();
        expect(commentText?.toLowerCase()).toContain('propre');
      }
    });
  });

  test.describe('Réponse de l\'hôte', () => {
    test.beforeEach(async () => {
      // Se déconnecter et se connecter en tant qu'hôte
      await page.goto('/');
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Déconnexion');

      const host = testUsers.host;
      await page.goto('/login');
      await page.fill('input[name="email"]', host.email);
      await page.fill('input[name="password"]', host.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('devrait permettre à l\'hôte de répondre à un avis', async () => {
      // Aller sur une de ses annonces
      await page.goto('/host/listings');
      await page.click('[data-testid="listing-card"]');

      // Scroller vers les avis
      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Trouver un avis sans réponse
      const reviewWithoutResponse = page.locator('[data-testid="review-card"]:not(:has([data-testid="host-response"]))').first();

      if (await reviewWithoutResponse.count() > 0) {
        // Cliquer sur "Répondre"
        await reviewWithoutResponse.locator('button:has-text("Répondre")').click();

        // Écrire une réponse
        const responseText = 'Merci beaucoup pour votre avis ! Nous sommes ravis que vous ayez apprécié votre séjour.';
        await page.fill('textarea[name="response"]', responseText);

        // Soumettre
        await page.click('button:has-text("Publier la réponse")');

        // Vérifier la confirmation
        await expect(page.locator('text=/.*réponse.*publiée.*/i')).toBeVisible();

        // Vérifier que la réponse apparaît
        await expect(page.locator(`text=${responseText}`)).toBeVisible();
      }
    });

    test('devrait permettre de modifier une réponse', async () => {
      await page.goto('/host/listings');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Trouver un avis avec réponse
      const reviewWithResponse = page.locator('[data-testid="review-card"]:has([data-testid="host-response"])').first();

      if (await reviewWithResponse.count() > 0) {
        // Cliquer sur "Modifier"
        await reviewWithResponse.locator('[data-testid="edit-response"]').click();

        // Modifier la réponse
        await page.fill('textarea[name="response"]', 'Réponse modifiée pour être plus complète.');

        // Sauvegarder
        await page.click('button:has-text("Sauvegarder")');

        // Vérifier la confirmation
        await expect(page.locator('text=/.*réponse.*modifiée.*/i')).toBeVisible();
      }
    });

    test('devrait permettre de supprimer une réponse', async () => {
      await page.goto('/host/listings');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Trouver un avis avec réponse
      const reviewWithResponse = page.locator('[data-testid="review-card"]:has([data-testid="host-response"])').first();

      if (await reviewWithResponse.count() > 0) {
        // Cliquer sur "Supprimer"
        await reviewWithResponse.locator('[data-testid="delete-response"]').click();

        // Confirmer
        await page.click('button:has-text("Confirmer la suppression")');

        // Vérifier que la réponse a disparu
        await expect(reviewWithResponse.locator('[data-testid="host-response"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Signalement d\'avis', () => {
    test('devrait permettre de signaler un avis inapproprié', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Cliquer sur le menu d'un avis
      await page.locator('[data-testid="review-menu"]').first().click();

      // Signaler
      await page.click('button:has-text("Signaler")');

      // Remplir le formulaire
      await page.selectOption('select[name="reason"]', 'inappropriate');
      await page.fill('textarea[name="details"]', 'Contenu offensant');

      // Soumettre
      await page.click('button:has-text("Envoyer le signalement")');

      // Vérifier la confirmation
      await expect(page.locator('text=/.*signalement.*envoyé.*/i')).toBeVisible();
    });
  });

  test.describe('Statistiques des avis', () => {
    test.beforeEach(async () => {
      // Se connecter en tant qu'hôte
      await page.goto('/');
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Déconnexion');

      const host = testUsers.host;
      await page.goto('/login');
      await page.fill('input[name="email"]', host.email);
      await page.fill('input[name="password"]', host.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('devrait afficher les statistiques globales des avis', async () => {
      await page.goto('/host/reviews');

      // Vérifier les métriques
      await expect(page.locator('[data-testid="total-reviews"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="response-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    });

    test('devrait afficher l\'évolution des notes dans le temps', async () => {
      await page.goto('/host/reviews');

      // Vérifier le graphique
      await expect(page.locator('[data-testid="rating-chart"]')).toBeVisible();
    });

    test('devrait afficher les avis en attente de réponse', async () => {
      await page.goto('/host/reviews');

      // Filtrer par "En attente de réponse"
      await page.click('button:has-text("En attente de réponse")');

      // Vérifier que seuls les avis sans réponse sont affichés
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      for (let i = 0; i < count; i++) {
        await expect(reviews.nth(i).locator('[data-testid="host-response"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Badges et récompenses', () => {
    test('devrait afficher les badges de l\'hôte', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Vérifier les badges de l'hôte
      const hostSection = page.locator('[data-testid="host-section"]');
      await hostSection.scrollIntoViewIfNeeded();

      // Badges possibles
      const badges = [
        'Superhôte',
        'Réponse rapide',
        'Excellent accueil',
        'Très propre',
      ];

      for (const badge of badges) {
        const badgeElement = hostSection.locator(`[data-testid="badge-${badge}"]`);
        if (await badgeElement.count() > 0) {
          await expect(badgeElement).toBeVisible();
        }
      }
    });

    test('devrait expliquer les critères du badge Superhôte', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      const hostSection = page.locator('[data-testid="host-section"]');
      await hostSection.scrollIntoViewIfNeeded();

      // Cliquer sur le badge Superhôte
      const superhostBadge = hostSection.locator('[data-testid="badge-Superhôte"]');

      if (await superhostBadge.count() > 0) {
        await superhostBadge.click();

        // Vérifier la modal d'explication
        await expect(page.locator('[data-testid="superhost-modal"]')).toBeVisible();
        await expect(page.locator('text=/.*note.*4\.8.*/i')).toBeVisible();
        await expect(page.locator('text=/.*taux.*réponse.*90%.*/i')).toBeVisible();
      }
    });
  });

  test.describe('Notifications d\'avis', () => {
    test('devrait notifier l\'hôte d\'un nouvel avis', async () => {
      // Se connecter en tant qu'hôte
      const host = testUsers.host;
      await page.goto('/login');
      await page.fill('input[name="email"]', host.email);
      await page.fill('input[name="password"]', host.password);
      await page.click('button[type="submit"]');

      // Aller sur les notifications
      await page.goto('/notifications');

      // Chercher une notification d'avis
      const reviewNotification = page.locator('[data-testid="notification"]:has-text("avis")').first();

      if (await reviewNotification.count() > 0) {
        await expect(reviewNotification).toBeVisible();

        // Cliquer pour voir l'avis
        await reviewNotification.click();

        // Vérifier la redirection
        await expect(page).toHaveURL(/.*reviews/);
      }
    });
  });

  test.describe('Responsive', () => {
    test('devrait afficher correctement les avis sur mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier que les cartes d'avis sont empilées
      const reviews = page.locator('[data-testid="review-card"]');
      const count = await reviews.count();

      if (count > 0) {
        await expect(reviews.first()).toBeVisible();

        // Vérifier que les photos sont en carrousel sur mobile
        const reviewPhotos = reviews.first().locator('[data-testid="review-photos"]');
        if (await reviewPhotos.count() > 0) {
          await expect(reviewPhotos).toBeVisible();
        }
      }
    });
  });
});
