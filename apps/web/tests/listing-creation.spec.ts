import { test, expect, Page } from '@playwright/test';
import { testUsers } from './fixtures/users';
import { testListings } from './fixtures/listings';

/**
 * Tests de création d'annonce E2E pour Lok'Room
 */

test.describe('Création d\'annonce', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Se connecter en tant qu'hôte
    const host = testUsers.host;
    await page.goto('/login');
    await page.fill('input[name="email"]', host.email);
    await page.fill('input[name="password"]', host.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Aller sur la page de création d'annonce
    await page.goto('/listings/new');
    await expect(page).toHaveURL('/listings/new');
  });

  test.describe('Création annonce APARTMENT', () => {
    test('devrait créer une annonce appartement complète', async () => {
      const listing = testListings.apartment;

      // Étape 1: Type d'espace
      await page.click(`[data-testid="space-type-${listing.spaceType}"]`);
      await page.click('button:has-text("Suivant")');

      // Étape 2: Localisation
      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);
      await page.fill('input[name="postalCode"]', listing.postalCode);
      await page.fill('input[name="country"]', listing.country);
      await page.click('button:has-text("Suivant")');

      // Étape 3: Capacité
      await page.fill('input[name="capacity"]', listing.capacity.toString());
      await page.click('button:has-text("Suivant")');

      // Étape 4: Photos (minimum 5)
      const photoInput = page.locator('input[type="file"]');

      // Simuler l'upload de 5 photos
      for (let i = 1; i <= 5; i++) {
        await photoInput.setInputFiles(`tests/fixtures/images/test-photo-${i}.jpg`);
        await page.waitForTimeout(500);
      }

      // Vérifier que 5 photos sont uploadées
      const uploadedPhotos = page.locator('[data-testid="uploaded-photo"]');
      await expect(uploadedPhotos).toHaveCount(5);
      await page.click('button:has-text("Suivant")');

      // Étape 5: Détails (spécifique APARTMENT)
      await page.fill('input[name="bedrooms"]', listing.bedrooms!.toString());
      await page.fill('input[name="bathrooms"]', listing.bathrooms!.toString());

      // Configuration des lits
      await page.click('button:has-text("Ajouter une chambre")');
      await page.selectOption('select[name="bedroom-0-bedType"]', 'DOUBLE');
      await page.fill('input[name="bedroom-0-count"]', '1');

      await page.click('button:has-text("Suivant")');

      // Étape 6: Équipements (Amenities)
      for (const amenity of listing.amenities) {
        await page.click(`[data-testid="amenity-${amenity}"]`);
      }
      await page.click('button:has-text("Suivant")');

      // Étape 7: Points forts
      for (const highlight of listing.highlights) {
        await page.fill('input[name="highlight"]', highlight);
        await page.click('button:has-text("Ajouter")');
      }
      await page.click('button:has-text("Suivant")');

      // Étape 8: Description
      await page.fill('input[name="title"]', listing.title);
      await page.fill('textarea[name="spaceDescription"]', listing.spaceDescription);
      await page.fill('textarea[name="guestAccessDescription"]', listing.guestAccessDescription);
      await page.fill('textarea[name="neighborhoodDescription"]', listing.neighborhoodDescription);
      await page.click('button:has-text("Suivant")');

      // Étape 9: Tarification
      await page.fill('input[name="price"]', listing.price.toString());
      await page.selectOption('select[name="hourlyIncrement"]', '60');
      await page.fill('input[name="minimumDuration"]', '2');
      await page.fill('input[name="cleaningFee"]', '20');
      await page.fill('input[name="extraGuestFee"]', '10');
      await page.click('button:has-text("Suivant")');

      // Étape 10: Réductions
      await page.fill('input[name="discount2Hours"]', '5');
      await page.fill('input[name="discount4Hours"]', '10');
      await page.fill('input[name="discount1Day"]', '15');
      await page.fill('input[name="discount7Days"]', '20');
      await page.fill('input[name="discount28Days"]', '30');
      await page.click('button:has-text("Suivant")');

      // Étape 11: Vérification et publication
      await expect(page.locator('text=Vérifiez votre annonce')).toBeVisible();
      await expect(page.locator(`text=${listing.title}`)).toBeVisible();
      await expect(page.locator(`text=${listing.price}`)).toBeVisible();

      // Publier
      await page.click('button:has-text("Publier")');

      // Vérifier la redirection vers l'annonce créée
      await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/, { timeout: 10000 });
      await expect(page.locator(`text=${listing.title}`)).toBeVisible();
    });

    test('devrait valider les champs obligatoires', async () => {
      // Essayer de passer à l'étape suivante sans remplir
      const nextButton = page.locator('button:has-text("Suivant")');

      // Le bouton devrait être désactivé
      await expect(nextButton).toBeDisabled();
    });

    test('devrait permettre de sauvegarder un brouillon', async () => {
      const listing = testListings.apartment;

      // Remplir partiellement
      await page.click(`[data-testid="space-type-${listing.spaceType}"]`);
      await page.click('button:has-text("Suivant")');

      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);

      // Sauvegarder comme brouillon
      await page.click('button:has-text("Sauvegarder le brouillon")');

      // Vérifier le message de confirmation
      await expect(page.locator('text=/.*brouillon.*sauvegardé.*/i')).toBeVisible();

      // Vérifier qu'on peut reprendre le brouillon
      await page.goto('/host/listings');
      await expect(page.locator('text=Brouillons')).toBeVisible();
      await expect(page.locator(`text=${listing.address}`)).toBeVisible();
    });
  });

  test.describe('Création annonce STUDIO', () => {
    test('devrait créer une annonce studio avec équipements spécifiques', async () => {
      const listing = testListings.studio;

      // Type d'espace
      await page.click('[data-testid="space-type-STUDIO"]');
      await page.click('button:has-text("Suivant")');

      // Localisation
      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);
      await page.fill('input[name="postalCode"]', listing.postalCode);
      await page.fill('input[name="country"]', listing.country);
      await page.click('button:has-text("Suivant")');

      // Capacité
      await page.fill('input[name="capacity"]', listing.capacity.toString());
      await page.click('button:has-text("Suivant")');

      // Photos (skip pour ce test)
      await page.click('button:has-text("Passer")');

      // Détails spécifiques STUDIO
      await page.selectOption('select[name="studioType"]', listing.studioType!);
      await page.fill('input[name="height"]', listing.height!.toString());
      await page.check('input[name="greenScreen"]');
      await page.check('input[name="soundproofing"]');
      await page.click('button:has-text("Suivant")');

      // Équipements
      for (const amenity of listing.amenities) {
        await page.click(`[data-testid="amenity-${amenity}"]`);
      }
      await page.click('button:has-text("Suivant")');

      // Points forts
      for (const highlight of listing.highlights) {
        await page.fill('input[name="highlight"]', highlight);
        await page.click('button:has-text("Ajouter")');
      }
      await page.click('button:has-text("Suivant")');

      // Description
      await page.fill('input[name="title"]', listing.title);
      await page.fill('textarea[name="spaceDescription"]', listing.spaceDescription);
      await page.click('button:has-text("Suivant")');

      // Tarification
      await page.fill('input[name="price"]', listing.price.toString());
      await page.click('button:has-text("Suivant")');

      // Réductions (skip)
      await page.click('button:has-text("Suivant")');

      // Publier
      await page.click('button:has-text("Publier")');

      // Vérifier la création
      await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/);
      await expect(page.locator(`text=${listing.title}`)).toBeVisible();
      await expect(page.locator('text=Studio photo')).toBeVisible();
    });
  });

  test.describe('Création annonce HOUSE', () => {
    test('devrait créer une annonce maison avec jardin et piscine', async () => {
      const listing = testListings.house;

      // Type d'espace
      await page.click('[data-testid="space-type-HOUSE"]');
      await page.click('button:has-text("Suivant")');

      // Localisation
      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);
      await page.fill('input[name="postalCode"]', listing.postalCode);
      await page.fill('input[name="country"]', listing.country);
      await page.click('button:has-text("Suivant")');

      // Capacité
      await page.fill('input[name="capacity"]', listing.capacity.toString());
      await page.click('button:has-text("Suivant")');

      // Photos (skip)
      await page.click('button:has-text("Passer")');

      // Détails spécifiques HOUSE
      await page.fill('input[name="bedrooms"]', listing.bedrooms!.toString());
      await page.fill('input[name="bathrooms"]', listing.bathrooms!.toString());
      await page.fill('input[name="floors"]', listing.floors!.toString());
      await page.check('input[name="garden"]');
      await page.check('input[name="pool"]');
      await page.check('input[name="poolHeated"]');
      await page.check('input[name="terrace"]');
      await page.click('button:has-text("Suivant")');

      // Équipements
      for (const amenity of listing.amenities) {
        await page.click(`[data-testid="amenity-${amenity}"]`);
      }
      await page.click('button:has-text("Suivant")');

      // Points forts
      for (const highlight of listing.highlights) {
        await page.fill('input[name="highlight"]', highlight);
        await page.click('button:has-text("Ajouter")');
      }
      await page.click('button:has-text("Suivant")');

      // Description
      await page.fill('input[name="title"]', listing.title);
      await page.fill('textarea[name="spaceDescription"]', listing.spaceDescription);
      await page.click('button:has-text("Suivant")');

      // Tarification
      await page.fill('input[name="price"]', listing.price.toString());
      await page.click('button:has-text("Suivant")');

      // Réductions
      await page.fill('input[name="discount7Days"]', '15');
      await page.click('button:has-text("Suivant")');

      // Publier
      await page.click('button:has-text("Publier")');

      // Vérifier
      await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/);
      await expect(page.locator('text=Piscine chauffée')).toBeVisible();
      await expect(page.locator('text=Jardin')).toBeVisible();
    });
  });

  test.describe('Création annonce PARKING', () => {
    test('devrait créer une annonce parking avec borne électrique', async () => {
      const listing = testListings.parking;

      // Type d'espace
      await page.click('[data-testid="space-type-PARKING"]');
      await page.click('button:has-text("Suivant")');

      // Localisation
      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);
      await page.fill('input[name="postalCode"]', listing.postalCode);
      await page.fill('input[name="country"]', listing.country);
      await page.click('button:has-text("Suivant")');

      // Capacité
      await page.fill('input[name="capacity"]', listing.capacity.toString());
      await page.click('button:has-text("Suivant")');

      // Photos (skip)
      await page.click('button:has-text("Passer")');

      // Détails spécifiques PARKING
      await page.selectOption('select[name="parkingType"]', listing.parkingType!);
      await page.check('input[name="covered"]');
      await page.check('input[name="secured"]');
      await page.check('input[name="evCharger"]');
      await page.fill('input[name="dimensions"]', listing.dimensions!);
      await page.click('button:has-text("Suivant")');

      // Équipements
      for (const amenity of listing.amenities) {
        await page.click(`[data-testid="amenity-${amenity}"]`);
      }
      await page.click('button:has-text("Suivant")');

      // Points forts
      for (const highlight of listing.highlights) {
        await page.fill('input[name="highlight"]', highlight);
        await page.click('button:has-text("Ajouter")');
      }
      await page.click('button:has-text("Suivant")');

      // Description
      await page.fill('input[name="title"]', listing.title);
      await page.fill('textarea[name="spaceDescription"]', listing.spaceDescription);
      await page.click('button:has-text("Suivant")');

      // Tarification
      await page.fill('input[name="price"]', listing.price.toString());
      await page.click('button:has-text("Suivant")');

      // Réductions (skip)
      await page.click('button:has-text("Suivant")');

      // Publier
      await page.click('button:has-text("Publier")');

      // Vérifier
      await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/);
      await expect(page.locator('text=Borne électrique')).toBeVisible();
      await expect(page.locator('text=Sécurisé')).toBeVisible();
    });
  });

  test.describe('Validation formulaire', () => {
    test('devrait valider le nombre minimum de photos (5)', async () => {
      await page.click('[data-testid="space-type-APARTMENT"]');
      await page.click('button:has-text("Suivant")');

      // Remplir localisation
      await page.fill('input[name="address"]', '123 Test St');
      await page.fill('input[name="city"]', 'Paris');
      await page.fill('input[name="postalCode"]', '75001');
      await page.fill('input[name="country"]', 'France');
      await page.click('button:has-text("Suivant")');

      // Capacité
      await page.fill('input[name="capacity"]', '4');
      await page.click('button:has-text("Suivant")');

      // Essayer de passer sans photos
      const nextButton = page.locator('button:has-text("Suivant")');
      await expect(nextButton).toBeDisabled();

      // Upload seulement 3 photos
      const photoInput = page.locator('input[type="file"]');
      for (let i = 1; i <= 3; i++) {
        await photoInput.setInputFiles(`tests/fixtures/images/test-photo-${i}.jpg`);
        await page.waitForTimeout(300);
      }

      // Le bouton devrait toujours être désactivé
      await expect(nextButton).toBeDisabled();

      // Message d'erreur
      await expect(page.locator('text=/.*minimum.*5.*photos.*/i')).toBeVisible();
    });

    test('devrait valider le prix minimum', async () => {
      await page.click('[data-testid="space-type-APARTMENT"]');

      // Aller directement à l'étape tarification (si possible)
      // Sinon, remplir les étapes précédentes rapidement

      await page.fill('input[name="price"]', '0');
      await page.click('button:has-text("Suivant")');

      // Vérifier le message d'erreur
      await expect(page.locator('text=/.*prix.*minimum.*/i')).toBeVisible();
    });

    test('devrait valider la capacité maximale', async () => {
      await page.click('[data-testid="space-type-APARTMENT"]');
      await page.click('button:has-text("Suivant")');

      await page.fill('input[name="address"]', '123 Test');
      await page.fill('input[name="city"]', 'Paris');
      await page.fill('input[name="postalCode"]', '75001');
      await page.fill('input[name="country"]', 'France');
      await page.click('button:has-text("Suivant")');

      // Capacité trop élevée
      await page.fill('input[name="capacity"]', '1000');
      await page.click('button:has-text("Suivant")');

      await expect(page.locator('text=/.*capacité.*maximale.*/i')).toBeVisible();
    });
  });

  test.describe('Navigation formulaire', () => {
    test('devrait permettre de revenir en arrière', async () => {
      await page.click('[data-testid="space-type-APARTMENT"]');
      await page.click('button:has-text("Suivant")');

      await page.fill('input[name="address"]', '123 Test');
      await page.click('button:has-text("Suivant")');

      // Revenir en arrière
      await page.click('button:has-text("Précédent")');

      // Vérifier qu'on est revenu à l'étape localisation
      await expect(page.locator('input[name="address"]')).toHaveValue('123 Test');
    });

    test('devrait conserver les données lors de la navigation', async () => {
      const listing = testListings.apartment;

      await page.click('[data-testid="space-type-APARTMENT"]');
      await page.click('button:has-text("Suivant")');

      await page.fill('input[name="address"]', listing.address);
      await page.fill('input[name="city"]', listing.city);
      await page.click('button:has-text("Suivant")');

      await page.fill('input[name="capacity"]', listing.capacity.toString());
      await page.click('button:has-text("Suivant")');

      // Revenir deux fois en arrière
      await page.click('button:has-text("Précédent")');
      await page.click('button:has-text("Précédent")');

      // Vérifier que les données sont conservées
      await expect(page.locator('input[name="address"]')).toHaveValue(listing.address);
      await expect(page.locator('input[name="city"]')).toHaveValue(listing.city);
    });

    test('devrait afficher la progression', async () => {
      // Vérifier l'indicateur de progression
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toBeVisible();

      // Étape 1
      await expect(progressBar).toHaveAttribute('aria-valuenow', '1');

      await page.click('[data-testid="space-type-APARTMENT"]');
      await page.click('button:has-text("Suivant")');

      // Étape 2
      await expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    });
  });
});
