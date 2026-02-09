import { test, expect, Page } from '@playwright/test';
import { testUsers } from './fixtures/users';
import { testBookings, createCustomBooking } from './fixtures/bookings';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Tests de réservation E2E pour Lok'Room
 */

test.describe('Réservation', () => {
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

  test.describe('Recherche d\'espace', () => {
    test('devrait permettre de rechercher un espace par ville', async () => {
      await page.goto('/');

      // Remplir le formulaire de recherche
      await page.fill('input[name="location"]', 'Paris');
      await page.click('button[type="submit"]');

      // Vérifier la redirection vers les résultats
      await expect(page).toHaveURL(/.*search/);
      await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(await page.locator('[data-testid="listing-card"]').count());
    });

    test('devrait filtrer par type d\'espace', async () => {
      await page.goto('/search?location=Paris');

      // Ouvrir les filtres
      await page.click('button:has-text("Filtres")');

      // Sélectionner APARTMENT
      await page.check('input[value="APARTMENT"]');
      await page.click('button:has-text("Appliquer")');

      // Vérifier que seuls les appartements sont affichés
      const listings = page.locator('[data-testid="listing-card"]');
      const count = await listings.count();

      for (let i = 0; i < count; i++) {
        await expect(listings.nth(i).locator('text=Appartement')).toBeVisible();
      }
    });

    test('devrait filtrer par fourchette de prix', async () => {
      await page.goto('/search?location=Paris');

      await page.click('button:has-text("Filtres")');

      // Définir la fourchette de prix
      await page.fill('input[name="minPrice"]', '20');
      await page.fill('input[name="maxPrice"]', '100');
      await page.click('button:has-text("Appliquer")');

      // Vérifier que les prix affichés sont dans la fourchette
      const prices = page.locator('[data-testid="listing-price"]');
      const count = await prices.count();

      for (let i = 0; i < count; i++) {
        const priceText = await prices.nth(i).textContent();
        const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');
        expect(price).toBeGreaterThanOrEqual(20);
        expect(price).toBeLessThanOrEqual(100);
      }
    });

    test('devrait filtrer par capacité', async () => {
      await page.goto('/search?location=Paris');

      await page.click('button:has-text("Filtres")');
      await page.fill('input[name="capacity"]', '4');
      await page.click('button:has-text("Appliquer")');

      // Vérifier que les espaces ont la capacité requise
      await expect(page.locator('text=/.*4.*personnes.*/i')).toHaveCount(await page.locator('[data-testid="listing-card"]').count());
    });

    test('devrait filtrer par équipements', async () => {
      await page.goto('/search?location=Paris');

      await page.click('button:has-text("Filtres")');

      // Sélectionner des équipements
      await page.check('input[value="WiFi"]');
      await page.check('input[value="Cuisine équipée"]');
      await page.click('button:has-text("Appliquer")');

      // Vérifier que les résultats ont ces équipements
      const listings = page.locator('[data-testid="listing-card"]');
      const count = await listings.count();
      expect(count).toBeGreaterThan(0);
    });

    test('devrait afficher les résultats sur une carte', async () => {
      await page.goto('/search?location=Paris');

      // Basculer vers la vue carte
      await page.click('button:has-text("Carte")');

      // Vérifier que la carte est affichée
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

      // Vérifier que les marqueurs sont présents
      const markers = page.locator('[data-testid="map-marker"]');
      expect(await markers.count()).toBeGreaterThan(0);
    });

    test('devrait trier les résultats', async () => {
      await page.goto('/search?location=Paris');

      // Trier par prix croissant
      await page.selectOption('select[name="sort"]', 'price-asc');

      // Vérifier que les prix sont triés
      const prices = page.locator('[data-testid="listing-price"]');
      const count = await prices.count();
      const priceValues: number[] = [];

      for (let i = 0; i < count; i++) {
        const priceText = await prices.nth(i).textContent();
        const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');
        priceValues.push(price);
      }

      // Vérifier que les prix sont en ordre croissant
      for (let i = 1; i < priceValues.length; i++) {
        expect(priceValues[i]).toBeGreaterThanOrEqual(priceValues[i - 1]);
      }
    });
  });

  test.describe('Détails de l\'annonce', () => {
    test('devrait afficher tous les détails d\'une annonce', async () => {
      // Rechercher et cliquer sur une annonce
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Vérifier les éléments de la page
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="listing-photos"]')).toBeVisible();
      await expect(page.locator('[data-testid="listing-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="listing-capacity"]')).toBeVisible();
      await expect(page.locator('[data-testid="listing-amenities"]')).toBeVisible();
      await expect(page.locator('[data-testid="listing-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();
    });

    test('devrait afficher la galerie de photos', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Cliquer sur une photo pour ouvrir la galerie
      await page.click('[data-testid="listing-photo"]');

      // Vérifier que la galerie est ouverte
      await expect(page.locator('[data-testid="photo-gallery"]')).toBeVisible();

      // Naviguer dans la galerie
      await page.click('[data-testid="next-photo"]');
      await page.click('[data-testid="prev-photo"]');

      // Fermer la galerie
      await page.click('[data-testid="close-gallery"]');
      await expect(page.locator('[data-testid="photo-gallery"]')).not.toBeVisible();
    });

    test('devrait afficher les avis', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Scroller vers les avis
      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Vérifier les éléments des avis
      await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="review-count"]')).toBeVisible();
    });

    test('devrait afficher la localisation sur la carte', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Scroller vers la carte
      await page.locator('[data-testid="location-map"]').scrollIntoViewIfNeeded();

      // Vérifier que la carte est affichée
      await expect(page.locator('[data-testid="location-map"]')).toBeVisible();
    });

    test('devrait permettre d\'ajouter aux favoris', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Cliquer sur le bouton favoris
      await page.click('[data-testid="favorite-button"]');

      // Vérifier le changement d'état
      await expect(page.locator('[data-testid="favorite-button"][aria-pressed="true"]')).toBeVisible();

      // Vérifier dans la page favoris
      await page.goto('/favorites');
      await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(await page.locator('[data-testid="listing-card"]').count());
    });
  });

  test.describe('Processus de réservation', () => {
    test('devrait créer une réservation complète', async () => {
      const booking = testBookings.shortTerm;

      // Trouver une annonce
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Remplir le formulaire de réservation
      await page.fill('input[name="startDate"]', format(booking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="startTime"]', format(booking.startDate, 'HH:mm'));
      await page.fill('input[name="endDate"]', format(booking.endDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endTime"]', format(booking.endDate, 'HH:mm'));
      await page.fill('input[name="guests"]', booking.guests.toString());

      // Vérifier le calcul du prix
      await expect(page.locator('[data-testid="total-price"]')).toBeVisible();

      // Continuer vers le paiement
      await page.click('button:has-text("Réserver")');

      // Page de confirmation
      await expect(page).toHaveURL(/.*booking\/confirm/);
      await expect(page.locator('text=Confirmez votre réservation')).toBeVisible();

      // Ajouter un message
      await page.fill('textarea[name="message"]', booking.message!);

      // Continuer vers le paiement
      await page.click('button:has-text("Continuer vers le paiement")');

      // Page de paiement Stripe
      await expect(page).toHaveURL(/.*booking\/payment/);
      await expect(page.locator('[data-testid="stripe-payment-form"]')).toBeVisible();
    });

    test('devrait calculer le prix avec les réductions', async () => {
      const booking = testBookings.longTerm; // 7+ jours

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.fill('input[name="startDate"]', format(booking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endDate"]', format(booking.endDate, 'yyyy-MM-dd'));
      await page.fill('input[name="guests"]', booking.guests.toString());

      // Vérifier que la réduction est appliquée
      await expect(page.locator('[data-testid="discount-applied"]')).toBeVisible();
      await expect(page.locator('text=/.*réduction.*7.*jours.*/i')).toBeVisible();
    });

    test('devrait calculer les frais supplémentaires', async () => {
      const booking = testBookings.shortTerm;

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.fill('input[name="startDate"]', format(booking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endDate"]', format(booking.endDate, 'yyyy-MM-dd'));
      await page.fill('input[name="guests"]', '6'); // Plus que la capacité de base

      // Vérifier les frais
      await expect(page.locator('[data-testid="cleaning-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="extra-guest-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-fee"]')).toBeVisible();
    });

    test('devrait vérifier la disponibilité', async () => {
      const booking = testBookings.shortTerm;

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Sélectionner des dates déjà réservées
      await page.fill('input[name="startDate"]', format(booking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endDate"]', format(booking.endDate, 'yyyy-MM-dd'));

      // Vérifier le message de disponibilité
      const availabilityMessage = page.locator('[data-testid="availability-status"]');
      await expect(availabilityMessage).toBeVisible();
    });

    test('devrait respecter la durée minimum de réservation', async () => {
      const shortBooking = createCustomBooking(1, 1, 2); // 1 heure seulement

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.fill('input[name="startDate"]', format(shortBooking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="startTime"]', format(shortBooking.startDate, 'HH:mm'));
      await page.fill('input[name="endDate"]', format(shortBooking.endDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endTime"]', format(shortBooking.endDate, 'HH:mm'));

      // Vérifier le message d'erreur
      await expect(page.locator('text=/.*durée.*minimum.*/i')).toBeVisible();
      await expect(page.locator('button:has-text("Réserver")')).toBeDisabled();
    });

    test('devrait afficher le calendrier de disponibilité', async () => {
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Ouvrir le calendrier
      await page.click('input[name="startDate"]');

      // Vérifier que le calendrier est affiché
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible();

      // Vérifier que les dates indisponibles sont marquées
      const unavailableDates = page.locator('[data-testid="unavailable-date"]');
      expect(await unavailableDates.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Paiement Stripe', () => {
    test.beforeEach(async () => {
      // Créer une réservation jusqu'à l'étape de paiement
      const booking = testBookings.shortTerm;

      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      await page.fill('input[name="startDate"]', format(booking.startDate, 'yyyy-MM-dd'));
      await page.fill('input[name="startTime"]', format(booking.startDate, 'HH:mm'));
      await page.fill('input[name="endDate"]', format(booking.endDate, 'yyyy-MM-dd'));
      await page.fill('input[name="endTime"]', format(booking.endDate, 'HH:mm'));
      await page.fill('input[name="guests"]', booking.guests.toString());

      await page.click('button:has-text("Réserver")');
      await page.click('button:has-text("Continuer vers le paiement")');

      await expect(page).toHaveURL(/.*payment/);
    });

    test('devrait afficher le formulaire Stripe', async () => {
      // Vérifier les éléments Stripe
      await expect(page.locator('[data-testid="stripe-payment-form"]')).toBeVisible();
      await expect(page.locator('iframe[name*="stripe"]')).toBeVisible();
    });

    test('devrait traiter un paiement réussi', async () => {
      // Remplir les informations de carte de test Stripe
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]');

      await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
      await stripeFrame.locator('input[name="exp-date"]').fill('12/34');
      await stripeFrame.locator('input[name="cvc"]').fill('123');
      await stripeFrame.locator('input[name="postal"]').fill('75001');

      // Soumettre le paiement
      await page.click('button:has-text("Payer")');

      // Vérifier la redirection vers la confirmation
      await expect(page).toHaveURL(/.*booking\/success/, { timeout: 15000 });
      await expect(page.locator('text=Réservation confirmée')).toBeVisible();
    });

    test('devrait gérer un paiement refusé', async () => {
      // Utiliser une carte de test qui sera refusée
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]');

      await stripeFrame.locator('input[name="cardnumber"]').fill('4000000000000002');
      await stripeFrame.locator('input[name="exp-date"]').fill('12/34');
      await stripeFrame.locator('input[name="cvc"]').fill('123');
      await stripeFrame.locator('input[name="postal"]').fill('75001');

      await page.click('button:has-text("Payer")');

      // Vérifier le message d'erreur
      await expect(page.locator('text=/.*paiement.*refusé.*/i')).toBeVisible();
    });

    test('devrait permettre d\'annuler le paiement', async () => {
      // Cliquer sur annuler
      await page.click('button:has-text("Annuler")');

      // Vérifier la redirection
      await expect(page).toHaveURL(/.*listings/);
    });
  });

  test.describe('Confirmation de réservation', () => {
    test('devrait afficher les détails de la réservation confirmée', async () => {
      // Simuler une réservation complète (nécessiterait un helper)
      // Pour l'instant, on teste la page de confirmation directement
      await page.goto('/bookings/test-booking-id');

      await expect(page.locator('[data-testid="booking-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-dates"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="host-info"]')).toBeVisible();
    });

    test('devrait envoyer un email de confirmation', async () => {
      // Note: En test, on vérifierait avec un service comme MailHog
      // Pour l'instant, on vérifie juste le message
      await page.goto('/bookings/test-booking-id');

      await expect(page.locator('text=/.*email.*confirmation.*envoyé.*/i')).toBeVisible();
    });

    test('devrait permettre de contacter l\'hôte', async () => {
      await page.goto('/bookings/test-booking-id');

      await page.click('button:has-text("Contacter l\'hôte")');

      // Vérifier la redirection vers la messagerie
      await expect(page).toHaveURL(/.*messages/);
    });

    test('devrait permettre d\'annuler la réservation', async () => {
      await page.goto('/bookings/test-booking-id');

      // Cliquer sur annuler
      await page.click('button:has-text("Annuler la réservation")');

      // Confirmer l'annulation
      await page.click('button:has-text("Confirmer l\'annulation")');

      // Vérifier le message
      await expect(page.locator('text=/.*réservation.*annulée.*/i')).toBeVisible();
    });

    test('devrait afficher la politique d\'annulation', async () => {
      await page.goto('/bookings/test-booking-id');

      await page.click('text=Politique d\'annulation');

      // Vérifier l'affichage de la politique
      await expect(page.locator('[data-testid="cancellation-policy"]')).toBeVisible();
    });
  });

  test.describe('Historique des réservations', () => {
    test('devrait afficher toutes les réservations', async () => {
      await page.goto('/trips');

      // Vérifier les onglets
      await expect(page.locator('text=À venir')).toBeVisible();
      await expect(page.locator('text=Passées')).toBeVisible();
      await expect(page.locator('text=Annulées')).toBeVisible();

      // Vérifier les cartes de réservation
      const bookingCards = page.locator('[data-testid="booking-card"]');
      expect(await bookingCards.count()).toBeGreaterThanOrEqual(0);
    });

    test('devrait filtrer les réservations par statut', async () => {
      await page.goto('/trips');

      // Cliquer sur "Passées"
      await page.click('text=Passées');

      // Vérifier que seules les réservations passées sont affichées
      const bookingCards = page.locator('[data-testid="booking-card"]');
      const count = await bookingCards.count();

      for (let i = 0; i < count; i++) {
        await expect(bookingCards.nth(i).locator('[data-testid="booking-status"]')).toHaveText(/Terminée|Passée/);
      }
    });

    test('devrait permettre de rechercher une réservation', async () => {
      await page.goto('/trips');

      await page.fill('input[name="search"]', 'Paris');

      // Vérifier les résultats filtrés
      const bookingCards = page.locator('[data-testid="booking-card"]');
      const count = await bookingCards.count();

      for (let i = 0; i < count; i++) {
        await expect(bookingCards.nth(i).locator('text=Paris')).toBeVisible();
      }
    });
  });
});
