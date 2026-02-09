# Quick Start - Système de Recommandations Lok'Room

## 🚀 Démarrage rapide (5 minutes)

### 1. Migration de la base de données

```bash
cd apps/web
npx prisma db push
```

### 2. Ajouter la variable d'environnement

Dans `.env`:
```env
CRON_SECRET=your-secret-key-here
```

Générer un secret fort:
```bash
openssl rand -base64 32
```

### 3. Première génération des recommandations

```bash
npx tsx scripts/regenerate-recommendations.ts
```

### 4. Démarrer le serveur

```bash
npm run dev
```

### 5. Tester

1. **Se connecter** avec un compte utilisateur
2. **Ajouter** quelques favoris
3. **Régénérer** les recommandations:
   ```bash
   curl -X POST http://localhost:3000/api/recommendations/regenerate \
     -H "Cookie: next-auth.session-token=YOUR_SESSION"
   ```
4. **Visiter** la homepage: http://localhost:3000
5. **Scroller** après les listings pour voir les recommandations

## ✅ C'est tout!

Le système est maintenant opérationnel. Les recommandations s'affichent automatiquement pour les utilisateurs connectés.

## 📚 Documentation complète

- **Guide complet**: `RECOMMENDATIONS_SYSTEM_COMPLETE.md`
- **Guide de test**: `RECOMMENDATIONS_TESTING_GUIDE.md`
- **Configuration Vercel**: `VERCEL_CRON_SETUP.md`

## 🎯 Fonctionnalités principales

### Pour les utilisateurs

- ✅ Recommandations personnalisées sur la homepage
- ✅ Basées sur favoris, réservations et comportement
- ✅ Badges explicatifs (similaire à vos favoris, populaire, etc.)
- ✅ Design professionnel style Airbnb

### Pour les développeurs

- ✅ Algorithme multi-critères sophistiqué
- ✅ Tracking automatique du comportement
- ✅ Cache en base de données
- ✅ Régénération automatique quotidienne
- ✅ APIs RESTful complètes
- ✅ Hooks React personnalisés
- ✅ Tests unitaires

## 🔧 APIs disponibles

### GET `/api/recommendations`
Récupère les recommandations de l'utilisateur connecté.

### POST `/api/recommendations/regenerate`
Régénère les recommandations de l'utilisateur connecté.

### POST `/api/tracking/behavior`
Track le comportement utilisateur (view, click, search, favorite, book).

### POST `/api/cron/recommendations`
Cron job pour régénération quotidienne (protégé par `CRON_SECRET`).

## 🎨 Composants React

### `<RecommendedListings />`
Affiche les recommandations sur la homepage.

```tsx
import { RecommendedListings } from "@/components/recommendations/RecommendedListings";

// Dans votre page
{isLoggedIn && <RecommendedListings />}
```

### `<ListingViewTracker />`
Track les vues d'annonces (invisible).

```tsx
import { ListingViewTracker } from "@/components/listings/ListingViewTracker";

// Dans la page d'annonce
<ListingViewTracker listingId={listing.id} />
```

## 🪝 Hooks personnalisés

### `useRecommendations()`

```tsx
import { useRecommendations } from "@/hooks/useRecommendations";

function MyComponent() {
  const { recommendations, isLoading, error, regenerate } = useRecommendations();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Recommendations: {recommendations.length}</h2>
      <button onClick={regenerate}>Refresh</button>
    </div>
  );
}
```

### `useTracking()`

```tsx
import { useTracking } from "@/hooks/useTracking";

function MyComponent() {
  const { trackListingView, trackListingClick, trackFavorite } = useTracking();

  const handleClick = (listingId: string) => {
    trackListingClick(listingId);
    // ... votre logique
  };

  return <button onClick={() => handleClick('listing_123')}>View Listing</button>;
}
```

## 📊 Algorithme de scoring

Le score final pour chaque listing est calculé comme suit:

```
Score = (similarité_favoris × 0.30) +
        (similarité_réservations × 0.25) +
        (popularité × 0.15) +
        (localisation × 0.15) +
        (prix × 0.10) +
        (avis × 0.05)
```

Seuls les listings avec un score > 0.3 sont recommandés.

## 🔄 Régénération automatique

### Quotidienne (Vercel Cron)

Le cron job s'exécute automatiquement tous les jours à 2h UTC.

Configuration dans `vercel.json`:
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

### Manuelle

Via script:
```bash
npx tsx scripts/regenerate-recommendations.ts
```

Via API:
```bash
curl -X POST http://localhost:3000/api/cron/recommendations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Automatique après actions importantes

Les recommandations sont régénérées automatiquement en background après:
- Ajout aux favoris
- Création de réservation

## 🎯 Raisons de recommandation

Les badges affichés aux utilisateurs:

| Raison | Badge | Description |
|--------|-------|-------------|
| `similar_to_favorites` | ❤️ Similaire à vos favoris | Listing similaire aux favoris de l'utilisateur |
| `similar_to_bookings` | 🔄 Basé sur vos réservations | Listing similaire aux réservations passées |
| `popular` | 🔥 Populaire | Listing très populaire (beaucoup de réservations/avis) |
| `near_you` | 📍 Près de chez vous | Listing dans la ville de l'utilisateur |
| `good_value` | 💰 Bon rapport qualité-prix | Prix similaire aux préférences de l'utilisateur |
| `highly_rated` | ⭐ Très bien noté | Listing avec excellents avis |
| `recommended_for_you` | ✨ Recommandé pour vous | Recommandation générale |

## 🔍 Debugging

### Vérifier les recommandations en DB

```sql
SELECT
  ur.score,
  ur.reason,
  l.title,
  l.price,
  l.city
FROM "UserRecommendation" ur
JOIN "Listing" l ON l.id = ur."listingId"
WHERE ur."userId" = 'USER_ID'
ORDER BY ur.score DESC;
```

### Vérifier le tracking

```sql
SELECT
  action,
  "listingId",
  metadata,
  "createdAt"
FROM "UserBehavior"
WHERE "userId" = 'USER_ID'
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Logs serveur

Les logs importants sont préfixés par `[Recommendations]` ou `[Tracking]`:

```
[Recommendations] Starting regeneration for all users...
[Recommendations] Found 150 users to process
[Recommendations] ✓ Success for user@example.com
[Tracking] Failed to track behavior for user user_123: Error...
```

## 🐛 Problèmes courants

### Pas de recommandations affichées

1. Vérifier que l'utilisateur est connecté
2. Vérifier qu'il y a des listings actifs
3. Régénérer: `POST /api/recommendations/regenerate`
4. Vérifier les logs

### Erreur lors de la génération

1. Vérifier la migration DB
2. Vérifier les relations Prisma
3. Tester avec un utilisateur simple
4. Vérifier les logs pour l'erreur exacte

### Tracking ne fonctionne pas

1. Vérifier que l'utilisateur est connecté
2. Vérifier l'API `/api/tracking/behavior`
3. Vérifier les logs réseau (DevTools)
4. Vérifier les permissions DB

## 📈 Métriques de succès

### Performance

- ✅ Temps de génération < 500ms par utilisateur
- ✅ Temps de réponse API < 1s
- ✅ Pas de blocage de l'UI

### Qualité

- ✅ Score moyen des recommandations > 0.5
- ✅ Taux de clics sur recommandations > 5%
- ✅ Taux de conversion depuis recommandations > 2%

### Utilisation

- ✅ 80%+ des utilisateurs actifs ont des recommandations
- ✅ 1000+ comportements trackés par jour
- ✅ Régénération quotidienne réussie

## 🚀 Déploiement en production

### Checklist

1. **Migration DB**
   ```bash
   npx prisma db push
   ```

2. **Variables d'environnement Vercel**
   - Ajouter `CRON_SECRET`

3. **Première génération**
   ```bash
   curl -X POST https://your-domain.com/api/cron/recommendations \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Vérifier le cron job**
   - Aller dans Vercel Dashboard > Cron Jobs
   - Vérifier que le job est listé

5. **Monitoring**
   - Configurer les alertes Vercel
   - Vérifier les logs quotidiennement (première semaine)

## 🎉 Félicitations!

Le système de recommandations personnalisées est maintenant opérationnel!

Les utilisateurs verront des recommandations pertinentes basées sur:
- Leurs favoris
- Leurs réservations passées
- Leur comportement de navigation
- Leur localisation
- Leurs préférences de prix

Le système s'améliore automatiquement au fil du temps grâce au tracking continu et à la régénération quotidienne.

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation complète
2. Vérifier les logs serveur
3. Tester en local
4. Vérifier la base de données

## 🔗 Liens utiles

- **Documentation complète**: `RECOMMENDATIONS_SYSTEM_COMPLETE.md`
- **Guide de test**: `RECOMMENDATIONS_TESTING_GUIDE.md`
- **Configuration Vercel**: `VERCEL_CRON_SETUP.md`
- **Code source**: `src/lib/recommendations/`
- **Composants**: `src/components/recommendations/`
- **APIs**: `src/app/api/recommendations/`
