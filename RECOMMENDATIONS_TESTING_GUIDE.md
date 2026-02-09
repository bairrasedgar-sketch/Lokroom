# Guide de Test - Système de Recommandations Lok'Room

## 🧪 Tests à effectuer

### 1. Migration de la base de données

```bash
cd apps/web
npx prisma db push
```

**Vérifications:**
- ✅ Tables `UserRecommendation` et `UserBehavior` créées
- ✅ Relations avec `User` et `Listing` fonctionnelles
- ✅ Index créés correctement

### 2. Test du moteur de recommandations

#### Test manuel via script

```bash
# Régénérer les recommandations pour tous les utilisateurs
npx tsx scripts/regenerate-recommendations.ts
```

**Résultat attendu:**
```
[Recommendations] Starting regeneration for all users...
[Recommendations] Found X users to process
[Recommendations] Processing user test@example.com...
[Recommendations] ✓ Success for test@example.com
...
[Recommendations] Regeneration complete!
  - Success: X
  - Errors: 0
  - Total: X
```

#### Test via API

```bash
# Régénérer pour l'utilisateur connecté
curl -X POST http://localhost:3000/api/recommendations/regenerate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Recommendations regenerated"
}
```

### 3. Test de l'affichage des recommandations

#### Sur la homepage

1. **Se connecter** avec un compte utilisateur
2. **Naviguer** vers la homepage (`/`)
3. **Scroller** après la grille de listings

**Résultat attendu:**
- Section "Recommandé pour vous" visible avec gradient purple
- 4 listings affichés (ou moins si peu de recommandations)
- Badges de raison affichés (❤️ Similaire à vos favoris, etc.)
- Design responsive mobile/desktop

#### Test sans connexion

1. **Se déconnecter**
2. **Naviguer** vers la homepage

**Résultat attendu:**
- Section "Recommandé pour vous" **non visible**

### 4. Test du tracking

#### Test tracking vue d'annonce

1. **Se connecter**
2. **Visiter** une page d'annonce (`/listings/[id]`)
3. **Vérifier** en DB:

```sql
SELECT * FROM "UserBehavior"
WHERE action = 'view'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Résultat attendu:**
- Nouvelle entrée avec `action = 'view'`
- `listingId` correspond à l'annonce visitée
- `userId` correspond à l'utilisateur connecté

#### Test tracking favori

1. **Se connecter**
2. **Ajouter** une annonce aux favoris
3. **Vérifier** en DB:

```sql
SELECT * FROM "UserBehavior"
WHERE action = 'favorite'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Résultat attendu:**
- Nouvelle entrée avec `action = 'favorite'`
- Régénération des recommandations déclenchée en background

#### Test tracking réservation

1. **Se connecter**
2. **Créer** une réservation
3. **Vérifier** en DB:

```sql
SELECT * FROM "UserBehavior"
WHERE action = 'book'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Résultat attendu:**
- Nouvelle entrée avec `action = 'book'`
- `metadata` contient `bookingId`
- Régénération des recommandations déclenchée

### 5. Test de l'algorithme de scoring

#### Créer un scénario de test

```typescript
// Test avec un utilisateur ayant des favoris
const user = await prisma.user.findFirst({
  where: {
    favorites: { some: {} }
  },
  include: {
    favorites: {
      include: { listing: true }
    }
  }
});

// Générer les recommandations
const recommendations = await generateRecommendations(user.id);

// Vérifier les scores
console.log(recommendations.map(r => ({
  title: r.listing.title,
  score: r.score,
  reason: r.reason
})));
```

**Résultat attendu:**
- Scores entre 0 et 1
- Listings similaires aux favoris ont des scores élevés
- Raisons pertinentes assignées

### 6. Test du cron job

#### Configuration

1. **Ajouter** `CRON_SECRET` dans `.env`:
```env
CRON_SECRET=test-secret-key-123
```

2. **Tester** l'endpoint:

```bash
curl -X POST http://localhost:3000/api/cron/recommendations \
  -H "Authorization: Bearer test-secret-key-123"
```

**Réponse attendue:**
```json
{
  "success": true,
  "processed": 10,
  "successCount": 10,
  "errorCount": 0
}
```

#### Test sans autorisation

```bash
curl -X POST http://localhost:3000/api/cron/recommendations
```

**Réponse attendue:**
```json
{
  "error": "Unauthorized"
}
```

### 7. Test de performance

#### Mesurer le temps de génération

```typescript
console.time('generateRecommendations');
const recommendations = await generateRecommendations(userId);
console.timeEnd('generateRecommendations');
```

**Résultat attendu:**
- < 500ms pour un utilisateur avec historique normal
- < 2s pour un utilisateur avec beaucoup d'historique

#### Mesurer le temps de chargement

1. **Ouvrir** DevTools > Network
2. **Naviguer** vers la homepage
3. **Observer** la requête `/api/recommendations`

**Résultat attendu:**
- Temps de réponse < 1s
- Pas de blocage du rendu de la page

### 8. Test des hooks

#### Test `useRecommendations()`

```typescript
function TestComponent() {
  const { recommendations, isLoading, error, regenerate } = useRecommendations();

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <p>Recommendations: {recommendations.length}</p>
      <button onClick={regenerate}>Regenerate</button>
    </div>
  );
}
```

**Résultat attendu:**
- `isLoading` true pendant le chargement
- `recommendations` contient les données
- `regenerate()` déclenche une nouvelle génération

#### Test `useTracking()`

```typescript
function TestComponent() {
  const { trackListingView } = useTracking();

  useEffect(() => {
    trackListingView('listing_123');
  }, []);

  return <div>Tracking test</div>;
}
```

**Résultat attendu:**
- Nouvelle entrée en DB avec `action = 'view'`
- Pas d'erreur console

### 9. Test des cas limites

#### Utilisateur sans historique

1. **Créer** un nouveau compte
2. **Naviguer** vers la homepage

**Résultat attendu:**
- Section recommandations non visible (ou vide)
- Pas d'erreur

#### Utilisateur avec beaucoup d'historique

1. **Créer** 50+ favoris
2. **Créer** 20+ réservations
3. **Régénérer** les recommandations

**Résultat attendu:**
- Génération réussie
- Top 20 recommandations retournées
- Performance acceptable (< 2s)

#### Listing sans images

1. **Créer** un listing sans images
2. **Vérifier** l'affichage dans les recommandations

**Résultat attendu:**
- Placeholder image affiché
- Pas d'erreur

### 10. Test de régression

#### Vérifier que les fonctionnalités existantes fonctionnent

- ✅ Ajout aux favoris
- ✅ Création de réservation
- ✅ Affichage des listings
- ✅ Recherche
- ✅ Filtres

**Résultat attendu:**
- Toutes les fonctionnalités existantes fonctionnent normalement
- Le tracking n'interfère pas avec l'UX

## 🔍 Vérifications en base de données

### Vérifier les recommandations

```sql
-- Voir les recommandations d'un utilisateur
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

### Vérifier le comportement

```sql
-- Voir l'historique de comportement
SELECT
  action,
  "listingId",
  metadata,
  "createdAt"
FROM "UserBehavior"
WHERE "userId" = 'USER_ID'
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Statistiques

```sql
-- Nombre de recommandations par utilisateur
SELECT
  u.email,
  COUNT(ur.id) as recommendations_count
FROM "User" u
LEFT JOIN "UserRecommendation" ur ON ur."userId" = u.id
GROUP BY u.id, u.email
ORDER BY recommendations_count DESC;

-- Actions les plus fréquentes
SELECT
  action,
  COUNT(*) as count
FROM "UserBehavior"
GROUP BY action
ORDER BY count DESC;
```

## 📊 Métriques à surveiller

### Performance

- Temps de génération des recommandations
- Temps de réponse de l'API
- Taille des données retournées

### Qualité

- Score moyen des recommandations
- Taux de clics sur les recommandations
- Taux de conversion depuis les recommandations

### Utilisation

- Nombre d'utilisateurs avec recommandations
- Nombre de comportements trackés par jour
- Fréquence de régénération

## 🐛 Problèmes courants et solutions

### Problème: Pas de recommandations affichées

**Solutions:**
1. Vérifier que l'utilisateur est connecté
2. Vérifier qu'il y a des listings actifs en DB
3. Régénérer manuellement: `POST /api/recommendations/regenerate`
4. Vérifier les logs serveur

### Problème: Erreur lors de la génération

**Solutions:**
1. Vérifier les relations Prisma
2. Vérifier que les index sont créés
3. Vérifier les logs pour l'erreur exacte
4. Tester avec un utilisateur simple (peu d'historique)

### Problème: Tracking ne fonctionne pas

**Solutions:**
1. Vérifier que l'utilisateur est connecté
2. Vérifier les logs réseau (DevTools)
3. Vérifier que l'API `/api/tracking/behavior` répond
4. Vérifier les permissions DB

### Problème: Cron job ne s'exécute pas

**Solutions:**
1. Vérifier `CRON_SECRET` dans les variables d'environnement
2. Vérifier la configuration Vercel
3. Tester manuellement l'endpoint
4. Vérifier les logs Vercel

## ✅ Checklist de validation

### Avant déploiement

- [ ] Migration DB appliquée
- [ ] Variables d'environnement configurées
- [ ] Tests unitaires passent
- [ ] Tests manuels effectués
- [ ] Performance vérifiée
- [ ] Pas de régression sur fonctionnalités existantes

### Après déploiement

- [ ] Cron job configuré sur Vercel
- [ ] Première génération manuelle effectuée
- [ ] Monitoring activé
- [ ] Logs vérifiés
- [ ] Test en production effectué

## 📝 Rapport de test

### Template

```markdown
# Test du système de recommandations

**Date:** [DATE]
**Testeur:** [NOM]
**Environnement:** [dev/staging/prod]

## Tests effectués

### 1. Migration DB
- [ ] Tables créées
- [ ] Relations fonctionnelles
- [ ] Index créés

### 2. Génération de recommandations
- [ ] Script manuel fonctionne
- [ ] API fonctionne
- [ ] Scores corrects

### 3. Affichage
- [ ] Homepage affiche les recommandations
- [ ] Design correct
- [ ] Responsive

### 4. Tracking
- [ ] Vues trackées
- [ ] Favoris trackés
- [ ] Réservations trackées

### 5. Performance
- [ ] Temps de génération < 500ms
- [ ] Temps de réponse API < 1s
- [ ] Pas de blocage UI

### 6. Cron job
- [ ] Configuration OK
- [ ] Endpoint fonctionne
- [ ] Sécurité OK

## Problèmes rencontrés

[Liste des problèmes]

## Recommandations

[Recommandations d'amélioration]

## Conclusion

[ ] ✅ Système prêt pour la production
[ ] ⚠️ Corrections mineures nécessaires
[ ] ❌ Corrections majeures nécessaires
```

## 🎯 Scénarios de test utilisateur

### Scénario 1: Nouvel utilisateur

1. Créer un compte
2. Ajouter 3 favoris (appartements à Paris)
3. Attendre la régénération (ou déclencher manuellement)
4. Vérifier les recommandations

**Résultat attendu:**
- Recommandations d'appartements à Paris
- Raison: "similar_to_favorites"

### Scénario 2: Utilisateur actif

1. Utilisateur avec 10+ réservations passées
2. Ajouter un nouveau favori
3. Vérifier les recommandations

**Résultat attendu:**
- Mix de recommandations basées sur favoris et réservations
- Scores élevés pour listings similaires

### Scénario 3: Utilisateur voyageur

1. Utilisateur ayant réservé dans plusieurs villes
2. Vérifier les recommandations

**Résultat attendu:**
- Recommandations dans les villes visitées
- Raison: "near_you" ou "similar_to_bookings"

## 🚀 Prêt pour la production

Une fois tous les tests validés, le système est prêt pour la production!
