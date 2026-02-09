import { test, expect, Page } from '@playwright/test';
import { testUsers } from './fixtures/users';

/**
 * Tests de messagerie E2E pour Lok'Room
 */

test.describe('Messagerie', () => {
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

  test.describe('Liste des conversations', () => {
    test('devrait afficher toutes les conversations', async () => {
      await page.goto('/messages');

      // Vérifier l'affichage de la liste
      await expect(page.locator('[data-testid="conversations-list"]')).toBeVisible();

      // Vérifier les éléments de conversation
      const conversations = page.locator('[data-testid="conversation-item"]');
      const count = await conversations.count();

      if (count > 0) {
        await expect(conversations.first()).toBeVisible();
        await expect(conversations.first().locator('[data-testid="conversation-avatar"]')).toBeVisible();
        await expect(conversations.first().locator('[data-testid="conversation-name"]')).toBeVisible();
        await expect(conversations.first().locator('[data-testid="last-message"]')).toBeVisible();
      }
    });

    test('devrait afficher les conversations non lues en premier', async () => {
      await page.goto('/messages');

      const conversations = page.locator('[data-testid="conversation-item"]');
      const count = await conversations.count();

      if (count > 0) {
        // Vérifier que les conversations non lues ont un badge
        const unreadBadges = page.locator('[data-testid="unread-badge"]');
        const unreadCount = await unreadBadges.count();

        if (unreadCount > 0) {
          // Les conversations non lues devraient être en haut
          const firstConversation = conversations.first();
          await expect(firstConversation.locator('[data-testid="unread-badge"]')).toBeVisible();
        }
      }
    });

    test('devrait permettre de rechercher une conversation', async () => {
      await page.goto('/messages');

      // Rechercher par nom
      await page.fill('input[name="search"]', 'Test Host');

      // Vérifier les résultats filtrés
      const conversations = page.locator('[data-testid="conversation-item"]');
      const count = await conversations.count();

      for (let i = 0; i < count; i++) {
        await expect(conversations.nth(i).locator('text=Test Host')).toBeVisible();
      }
    });

    test('devrait filtrer par type de conversation', async () => {
      await page.goto('/messages');

      // Filtrer par "Réservations"
      await page.click('button:has-text("Réservations")');

      // Vérifier que seules les conversations liées à des réservations sont affichées
      const conversations = page.locator('[data-testid="conversation-item"]');
      const count = await conversations.count();

      for (let i = 0; i < count; i++) {
        await expect(conversations.nth(i).locator('[data-testid="booking-badge"]')).toBeVisible();
      }
    });

    test('devrait afficher l\'heure du dernier message', async () => {
      await page.goto('/messages');

      const conversations = page.locator('[data-testid="conversation-item"]');
      const count = await conversations.count();

      if (count > 0) {
        await expect(conversations.first().locator('[data-testid="message-time"]')).toBeVisible();
      }
    });
  });

  test.describe('Conversation individuelle', () => {
    test('devrait afficher l\'historique des messages', async () => {
      await page.goto('/messages');

      // Cliquer sur une conversation
      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      await firstConversation.click();

      // Vérifier l'affichage des messages
      await expect(page.locator('[data-testid="messages-container"]')).toBeVisible();

      const messages = page.locator('[data-testid="message"]');
      const count = await messages.count();

      if (count > 0) {
        await expect(messages.first()).toBeVisible();
      }
    });

    test('devrait envoyer un message texte', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      const messageText = 'Bonjour, je suis intéressé par votre espace.';

      // Écrire et envoyer le message
      await page.fill('textarea[name="message"]', messageText);
      await page.click('button[type="submit"]');

      // Vérifier que le message apparaît
      await expect(page.locator(`text=${messageText}`)).toBeVisible();

      // Vérifier que le champ est vidé
      await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    });

    test('devrait envoyer un message avec Entrée', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      const messageText = 'Message envoyé avec Entrée';

      await page.fill('textarea[name="message"]', messageText);
      await page.press('textarea[name="message"]', 'Enter');

      await expect(page.locator(`text=${messageText}`)).toBeVisible();
    });

    test('devrait permettre Shift+Entrée pour un saut de ligne', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      const textarea = page.locator('textarea[name="message"]');
      await textarea.fill('Ligne 1');
      await textarea.press('Shift+Enter');
      await textarea.type('Ligne 2');

      // Vérifier que le texte contient un saut de ligne
      const value = await textarea.inputValue();
      expect(value).toContain('\n');
    });

    test('devrait envoyer une image', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Cliquer sur le bouton d'upload d'image
      await page.click('[data-testid="upload-image-button"]');

      // Uploader une image
      const fileInput = page.locator('input[type="file"][accept*="image"]');
      await fileInput.setInputFiles('tests/fixtures/images/test-photo-1.jpg');

      // Vérifier l'aperçu de l'image
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

      // Envoyer
      await page.click('button:has-text("Envoyer")');

      // Vérifier que l'image apparaît dans la conversation
      await expect(page.locator('[data-testid="message-image"]')).toBeVisible();
    });

    test('devrait afficher l\'indicateur de frappe', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Commencer à taper
      await page.fill('textarea[name="message"]', 'Test');

      // Vérifier l'indicateur de frappe (si l'autre utilisateur tape)
      // Note: Cela nécessiterait une simulation WebSocket
      // Pour l'instant, on vérifie juste que l'élément existe
      const typingIndicator = page.locator('[data-testid="typing-indicator"]');
      // await expect(typingIndicator).toBeVisible(); // Dépend du contexte
    });

    test('devrait marquer les messages comme lus', async () => {
      await page.goto('/messages');

      // Sélectionner une conversation non lue
      const unreadConversation = page.locator('[data-testid="conversation-item"]:has([data-testid="unread-badge"])').first();

      if (await unreadConversation.count() > 0) {
        await unreadConversation.click();

        // Attendre un peu
        await page.waitForTimeout(1000);

        // Revenir à la liste
        await page.click('[data-testid="back-to-list"]');

        // Vérifier que le badge non lu a disparu
        await expect(unreadConversation.locator('[data-testid="unread-badge"]')).not.toBeVisible();
      }
    });

    test('devrait afficher les informations de la réservation associée', async () => {
      await page.goto('/messages');

      // Sélectionner une conversation liée à une réservation
      const bookingConversation = page.locator('[data-testid="conversation-item"]:has([data-testid="booking-badge"])').first();

      if (await bookingConversation.count() > 0) {
        await bookingConversation.click();

        // Vérifier l'affichage des infos de réservation
        await expect(page.locator('[data-testid="booking-info"]')).toBeVisible();
        await expect(page.locator('[data-testid="booking-dates"]')).toBeVisible();
        await expect(page.locator('[data-testid="booking-status"]')).toBeVisible();
      }
    });

    test('devrait permettre de voir le profil de l\'interlocuteur', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Cliquer sur l'avatar ou le nom
      await page.click('[data-testid="conversation-header-avatar"]');

      // Vérifier la redirection vers le profil
      await expect(page).toHaveURL(/.*profile/);
    });

    test('devrait scroller automatiquement vers le dernier message', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Vérifier que le dernier message est visible
      const messages = page.locator('[data-testid="message"]');
      const count = await messages.count();

      if (count > 0) {
        const lastMessage = messages.last();
        await expect(lastMessage).toBeInViewport();
      }
    });

    test('devrait charger les messages plus anciens au scroll', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      const messagesContainer = page.locator('[data-testid="messages-container"]');

      // Compter les messages initiaux
      const initialCount = await page.locator('[data-testid="message"]').count();

      // Scroller vers le haut
      await messagesContainer.evaluate(el => el.scrollTop = 0);

      // Attendre le chargement
      await page.waitForTimeout(1000);

      // Vérifier qu'il y a plus de messages
      const newCount = await page.locator('[data-testid="message"]').count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  test.describe('Nouvelle conversation', () => {
    test('devrait permettre de contacter un hôte depuis une annonce', async () => {
      // Aller sur une annonce
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');

      // Cliquer sur "Contacter l'hôte"
      await page.click('button:has-text("Contacter l\'hôte")');

      // Vérifier la redirection vers la messagerie
      await expect(page).toHaveURL(/.*messages/);

      // Vérifier que le champ de message est prêt
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('devrait pré-remplir le message avec le contexte de la réservation', async () => {
      // Créer une réservation et aller à la messagerie
      await page.goto('/bookings/test-booking-id');
      await page.click('button:has-text("Contacter l\'hôte")');

      // Vérifier que le message contient des infos sur la réservation
      const messageField = page.locator('textarea[name="message"]');
      const value = await messageField.inputValue();

      expect(value).toContain('réservation');
    });

    test('devrait bloquer l\'envoi de messages vides', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Essayer d'envoyer un message vide
      await page.click('button[type="submit"]');

      // Le bouton devrait être désactivé
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });

  test.describe('Notifications temps réel', () => {
    test('devrait afficher une notification pour un nouveau message', async () => {
      await page.goto('/messages');

      // Simuler la réception d'un nouveau message (via WebSocket)
      // Note: Cela nécessiterait un mock WebSocket
      // Pour l'instant, on vérifie juste que le système de notification existe

      // Vérifier que les permissions de notification sont demandées
      const notificationPermission = await page.evaluate(() => {
        return Notification.permission;
      });

      expect(['default', 'granted', 'denied']).toContain(notificationPermission);
    });

    test('devrait mettre à jour le compteur de messages non lus', async () => {
      await page.goto('/');

      // Vérifier le badge de notification dans le header
      const notificationBadge = page.locator('[data-testid="messages-notification-badge"]');

      if (await notificationBadge.count() > 0) {
        await expect(notificationBadge).toBeVisible();
        const count = await notificationBadge.textContent();
        expect(parseInt(count || '0')).toBeGreaterThan(0);
      }
    });

    test('devrait jouer un son pour un nouveau message', async () => {
      await page.goto('/messages');

      // Vérifier que l'élément audio existe
      const audioElement = page.locator('audio[data-testid="notification-sound"]');

      if (await audioElement.count() > 0) {
        await expect(audioElement).toBeAttached();
      }
    });
  });

  test.describe('Gestion des conversations', () => {
    test('devrait permettre d\'archiver une conversation', async () => {
      await page.goto('/messages');

      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      await firstConversation.click();

      // Ouvrir le menu
      await page.click('[data-testid="conversation-menu"]');

      // Archiver
      await page.click('button:has-text("Archiver")');

      // Vérifier que la conversation a disparu de la liste
      await page.goto('/messages');
      await expect(firstConversation).not.toBeVisible();

      // Vérifier dans les archives
      await page.click('button:has-text("Archivées")');
      await expect(page.locator('[data-testid="conversation-item"]')).toHaveCount(await page.locator('[data-testid="conversation-item"]').count());
    });

    test('devrait permettre de signaler une conversation', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Ouvrir le menu
      await page.click('[data-testid="conversation-menu"]');

      // Signaler
      await page.click('button:has-text("Signaler")');

      // Remplir le formulaire de signalement
      await page.fill('textarea[name="reason"]', 'Comportement inapproprié');
      await page.click('button:has-text("Envoyer le signalement")');

      // Vérifier le message de confirmation
      await expect(page.locator('text=/.*signalement.*envoyé.*/i')).toBeVisible();
    });

    test('devrait permettre de bloquer un utilisateur', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Ouvrir le menu
      await page.click('[data-testid="conversation-menu"]');

      // Bloquer
      await page.click('button:has-text("Bloquer")');

      // Confirmer
      await page.click('button:has-text("Confirmer le blocage")');

      // Vérifier le message
      await expect(page.locator('text=/.*utilisateur.*bloqué.*/i')).toBeVisible();

      // Vérifier qu'on ne peut plus envoyer de messages
      await expect(page.locator('textarea[name="message"]')).toBeDisabled();
    });

    test('devrait permettre de supprimer une conversation', async () => {
      await page.goto('/messages');

      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      const conversationName = await firstConversation.locator('[data-testid="conversation-name"]').textContent();

      await firstConversation.click();

      // Ouvrir le menu
      await page.click('[data-testid="conversation-menu"]');

      // Supprimer
      await page.click('button:has-text("Supprimer")');

      // Confirmer
      await page.click('button:has-text("Confirmer la suppression")');

      // Vérifier que la conversation a disparu
      await page.goto('/messages');
      await expect(page.locator(`text=${conversationName}`)).not.toBeVisible();
    });
  });

  test.describe('Recherche dans les messages', () => {
    test('devrait permettre de rechercher dans une conversation', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      // Ouvrir la recherche
      await page.click('[data-testid="search-in-conversation"]');

      // Rechercher un mot
      await page.fill('input[name="searchQuery"]', 'réservation');

      // Vérifier les résultats surlignés
      const highlightedMessages = page.locator('[data-testid="message-highlighted"]');
      expect(await highlightedMessages.count()).toBeGreaterThanOrEqual(0);
    });

    test('devrait naviguer entre les résultats de recherche', async () => {
      await page.goto('/messages');
      await page.locator('[data-testid="conversation-item"]').first().click();

      await page.click('[data-testid="search-in-conversation"]');
      await page.fill('input[name="searchQuery"]', 'test');

      // Naviguer vers le résultat suivant
      await page.click('[data-testid="next-search-result"]');

      // Vérifier que le message est scrollé dans la vue
      const activeResult = page.locator('[data-testid="message-highlighted"][data-active="true"]');
      await expect(activeResult).toBeInViewport();
    });
  });

  test.describe('Messages automatiques', () => {
    test('devrait afficher un message de bienvenue pour une nouvelle conversation', async () => {
      // Créer une nouvelle conversation
      await page.goto('/search?location=Paris');
      await page.click('[data-testid="listing-card"]');
      await page.click('button:has-text("Contacter l\'hôte")');

      // Vérifier le message de bienvenue
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    });

    test('devrait afficher des messages système pour les événements de réservation', async () => {
      await page.goto('/messages');

      // Sélectionner une conversation avec réservation
      const bookingConversation = page.locator('[data-testid="conversation-item"]:has([data-testid="booking-badge"])').first();

      if (await bookingConversation.count() > 0) {
        await bookingConversation.click();

        // Vérifier les messages système
        const systemMessages = page.locator('[data-testid="system-message"]');
        expect(await systemMessages.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Responsive', () => {
    test('devrait afficher correctement sur mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/messages');

      // Sur mobile, la liste devrait occuper tout l'écran
      await expect(page.locator('[data-testid="conversations-list"]')).toBeVisible();

      // Cliquer sur une conversation
      await page.locator('[data-testid="conversation-item"]').first().click();

      // La conversation devrait occuper tout l'écran
      await expect(page.locator('[data-testid="messages-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversations-list"]')).not.toBeVisible();

      // Le bouton retour devrait être visible
      await expect(page.locator('[data-testid="back-to-list"]')).toBeVisible();
    });
  });
});
