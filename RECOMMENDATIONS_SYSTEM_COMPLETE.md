# Système de Recommandations Personnalisées - Lok'Room

## 📋 Vue d'ensemble

Système de recommandations basé sur l'IA qui suggère des espaces pertinents à chaque utilisateur selon son historique, ses préférences et son comportement.

## ✅ Implémentation complète

### 1. Modèle de données (Prisma)

**Nouveaux modèles ajoutés:**

```prisma
model UserRecommendation {
  id          String   @id @default(cuid())
  userId      String
  listingId   String
  score       Float    // Score de pertinence (0-1)
  reason      String   // Raison de la recommandation
  createdAt   DateTime @default(now())

  @@unique([userId, listingId])
  @@index([userId, score])
}

model UserBehavior {
  id          String   @id @default(cuid())
  userId      String
  action      String   // view, click, search, favorite, book
  listingId   String?
  metadata    Json?    // Données additionnelles
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([listingId])
}
```

### 2. Moteur de recommandations

**Fichier:** `src/lib/recommendations/engine.ts`

**Algorithme multi-critères:**
- ✅ Similarité avec favoris (30%)
- ✅ Similarité avec réservations (25%)
- ✅ Popularité (15%)
- ✅ Localisation (15%)
- ✅ Prix (10%)
- ✅ Avis (5%)

**Fonctions principales:**
- `generateRecommendations(userId)` - Génère les recommandations
- `regenerateRecommendations(userId)` - Régénère et sauvegarde en DB
- `calculateSimilarityToFavorites()` - Calcule similarité avec favoris
- `calculateSimilarityToBookings()` - Calcule similarité avec réservations
- `calculatePopularity()` - Score de popularité
- `calculateLocationScore()` - Score de localisation
- `calculatePriceScore()` - Score de prix
- `calculateReviewScore()` - Score basé sur avis

### 3. Système de tracking

**Fichier:** `src/lib/recommendations/tracking.ts`

**Actions trackées:**
- ✅ `view` - Vue d'une annonce
- ✅ `click` - Clic sur une annonce
- ✅ `search` - Recherche effectuée
- ✅ `favorite` - Ajout aux favoris
- ✅ `book` - Réservation effectuée

**Fonctions:**
- `trackUserBehavior()` - Track générique
- `trackListingView()` - Track vue
- `trackListingClick()` - Track clic
- `trackSearch()` - Track recherche
- `trackFavorite()` - Track favori
- `trackBooking()` - Track réservation

### 4. API Routes

#### GET `/api/recommendations`
Récupère les recommandations personnalisées pour l'utilisateur connecté.

**Réponse:**
```json
{
  "recommendations": [
    {
      "id": "rec_123",
      "userId": "user_123",
      "listingId": "listing_456",
      "score": 0.85,
      "reason": "similar_to_favorites",
      "listing": {
        "id": "listing_456",
        "title": "Appartement Paris",
        "price": 100,
        "images": [...],
        ...
      }
    }
  ]
}
```

#### POST `/api/recommendations/regenerate`
Régénère les recommandations pour l'utilisateur connecté.

#### POST `/api/tracking/behavior`
Track le comportement utilisateur.

**Body:**
```json
{
  "action": "view",
  "listingId": "listing_123",
  "metadata": { "query": "Paris" }
}
```

#### POST `/api/cron/recommendations`
Cron job pour régénération quotidienne (tous les jours à 2h).

### 5. Composants React

#### `RecommendedListings.tsx`
Affiche les recommandations sur la homepage (uniquement pour utilisateurs connectés).

**Features:**
- ✅ Chargement avec skeleton
- ✅ Badges de raison (similaire à favoris, populaire, etc.)
- ✅ Design style Airbnb avec gradient purple
- ✅ Responsive mobile/desktop
- ✅ Intégration avec `ListingCard`

**Raisons affichées:**
- ❤️ Similaire à vos favoris
- 🔄 Basé sur vos réservations
- 🔥 Populaire
- 📍 Près de chez vous
- 💰 Bon rapport qualité-prix
- ⭐ Très bien noté
- ✨ Recommandé pour vous

#### `ListingViewTracker.tsx`
Composant invisible qui track les vues d'annonces.

### 6. Hooks personnalisés

#### `useRecommendations()`
Hook pour récupérer et gérer les recommandations.

```typescript
const { recommendations, isLoading, error, regenerate } = useRecommendations();
```

#### `useTracking()`
Hook pour tracker le comportement utilisateur.

```typescript
const { trackListingView, trackListingClick, trackSearch, trackFavorite, trackBooking } = useTracking();
```

### 7. Intégrations

#### Homepage (`HomeClient.tsx`)
- ✅ Affichage des recommandations après les listings
- ✅ Lazy loading du composant
- ✅ Uniquement pour utilisateurs connectés

#### Bouton Favori (`FavoriteButton.tsx`)
- ✅ Track automatique lors de l'ajout aux favoris
- ✅ Régénération des recommandations en background

#### Formulaire de réservation (`BookingForm.tsx`)
- ✅ Track automatique lors d'une réservation
- ✅ Régénération des recommandations en background

#### Page d'annonce (`listings/[id]/page.tsx`)
- ✅ Track automatique des vues avec `ListingViewTracker`

### 8. Scripts et Cron

#### `scripts/regenerate-recommendations.ts`
Script manuel pour régénérer toutes les recommandations.

**Usage:**
```bash
npx tsx scripts/regenerate-recommendations.ts
```

#### Vercel Cron (`vercel.json`)
Configuration pour régénération quotidienne automatique.

```json
{
  "crons": [
    {
      "path": "/api/cron/recommendations",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 9. Tests

**Fichier:** `src/lib/recommendations/__tests__/engine.test.ts`

Tests unitaires pour:
- ✅ Génération de recommandations
- ✅ Sauvegarde en DB
- ✅ Calcul des scores de similarité

## 🚀 Déploiement

### 1. Migration de la base de données

```bash
cd apps/web
npx prisma db push
```

### 2. Variables d'environnement

Ajouter dans `.env`:
```env
CRON_SECRET=your-secret-key-here
```

### 3. Configuration Vercel

Le fichier `vercel.json` est déjà configuré pour le cron job quotidien.

### 4. Première génération

Après déploiement, exécuter manuellement:
```bash
npx tsx scripts/regenerate-recommendations.ts
```

Ou appeler l'API:
```bash
curl -X POST https://your-domain.com/api/cron/recommendations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Fonctionnement

### Algorithme de scoring

Pour chaque listing, le score final est calculé comme suit:

```
Score = (similarité_favoris × 0.30) +
        (similarité_réservations × 0.25) +
        (popularité × 0.15) +
        (localisation × 0.15) +
        (prix × 0.10) +
        (avis × 0.05)
```

### Similarité avec favoris/réservations

```
Similarité = (même_catégorie × 0.30) +
             (prix_similaire × 0.20) +
             (même_ville × 0.20) +
             (amenities_communs × 0.30)
```

### Popularité

```
Popularité = (réservations_normalisées × 0.40) +
             (avis_normalisés × 0.30) +
             (note_moyenne × 0.30)
```

### Seuil de recommandation

Seuls les listings avec un score > 0.3 sont recommandés.

## 🎯 Optimisations

### Cache et performance

1. **Cache en DB**: Les recommandations sont pré-calculées et stockées
2. **Lazy loading**: Le composant est chargé uniquement si nécessaire
3. **Batch processing**: Traitement par lots de 10 utilisateurs
4. **Limite de listings**: Maximum 200 listings analysés par utilisateur
5. **SWR**: Cache côté client avec revalidation intelligente

### Régénération intelligente

- **Automatique**: Après ajout aux favoris ou réservation
- **Quotidienne**: Cron job à 2h du matin
- **Manuelle**: Via API ou script

### Tracking non-bloquant

Le tracking est asynchrone et ne bloque jamais l'expérience utilisateur.

## 📈 Métriques et monitoring

### Données trackées

- Nombre de vues par listing
- Taux de clics sur recommandations
- Conversions depuis recommandations
- Score moyen des recommandations
- Temps de génération

### Logs

Tous les événements importants sont loggés:
- Génération de recommandations
- Erreurs de tracking
- Performances du cron job

## 🔒 Sécurité

- ✅ Authentification requise pour toutes les routes
- ✅ Validation Zod des données
- ✅ Protection CRON_SECRET pour le cron job
- ✅ Pas d'exposition des données sensibles
- ✅ Rate limiting sur les APIs

## 🎨 Design

- Style Airbnb avec gradient purple
- Badges de raison avec icônes Lucide
- Animations smooth
- Responsive mobile/desktop
- Skeleton loading states

## 📝 Prochaines étapes (optionnel)

### Améliorations possibles

1. **Machine Learning avancé**
   - Utiliser TensorFlow.js pour des prédictions plus précises
   - Collaborative filtering avec similarité utilisateur-utilisateur

2. **A/B Testing**
   - Tester différents algorithmes de scoring
   - Optimiser les poids des critères

3. **Personnalisation avancée**
   - Préférences explicites de l'utilisateur
   - Filtres personnalisés

4. **Analytics détaillées**
   - Dashboard admin pour les recommandations
   - Métriques de performance en temps réel

5. **Cache Redis**
   - Cache distribué pour les recommandations
   - TTL de 24h

6. **Notifications**
   - Email avec nouvelles recommandations
   - Push notifications

## 🐛 Troubleshooting

### Les recommandations ne s'affichent pas

1. Vérifier que l'utilisateur est connecté
2. Vérifier que des recommandations existent en DB
3. Régénérer manuellement: `POST /api/recommendations/regenerate`

### Le cron job ne fonctionne pas

1. Vérifier `CRON_SECRET` dans les variables d'environnement
2. Vérifier les logs Vercel
3. Tester manuellement l'endpoint

### Performances lentes

1. Vérifier les index DB (déjà configurés)
2. Réduire la limite de listings analysés
3. Augmenter la taille des batches

## 📚 Fichiers créés

```
apps/web/
├── prisma/
│   └── schema.prisma (modifié)
├── src/
│   ├── lib/
│   │   └── recommendations/
│   │       ├── engine.ts
│   │       ├── tracking.ts
│   │       └── __tests__/
│   │           └── engine.test.ts
│   ├── hooks/
│   │   ├── useRecommendations.ts
│   │   └── useTracking.ts
│   ├── components/
│   │   ├── recommendations/
│   │   │   └── RecommendedListings.tsx
│   │   ├── listings/
│   │   │   └── ListingViewTracker.tsx
│   │   ├── HomeClient.tsx (modifié)
│   │   ├── FavoriteButton.tsx (modifié)
│   │   └── BookingForm.tsx (modifié)
│   └── app/
│       ├── api/
│       │   ├── recommendations/
│       │   │   ├── route.ts
│       │   │   └── regenerate/
│       │   │       └── route.ts
│       │   ├── tracking/
│       │   │   └── behavior/
│       │   │       └── route.ts
│       │   └── cron/
│       │       └── recommendations/
│       │           └── route.ts
│       └── listings/
│           └── [id]/
│               └── page.tsx (modifié)
├── scripts/
│   └── regenerate-recommendations.ts
└── vercel.json
```

## ✨ Résultat final

Le système de recommandations personnalisées est maintenant **100% opérationnel** avec:

- ✅ Algorithme multi-critères sophistiqué
- ✅ Tracking complet du comportement utilisateur
- ✅ Cache en base de données
- ✅ Régénération automatique quotidienne
- ✅ Intégration complète dans l'application
- ✅ Design professionnel style Airbnb
- ✅ Tests unitaires
- ✅ Performance optimisée
- ✅ Sécurité renforcée

Les utilisateurs voient maintenant des recommandations personnalisées basées sur leurs favoris, réservations, recherches et comportement de navigation.
