# Guide de démarrage rapide - Tests E2E Playwright

## Installation rapide

```bash
cd apps/web

# Installer Playwright
npm install

# Installer les navigateurs
npx playwright install --with-deps

# Créer les images de test
node scripts/create-test-images.js
```

## Vérification de l'installation

```bash
# Lancer le test de vérification
npx playwright test tests/setup.spec.ts --headed

# Si ça fonctionne, vous verrez:
# ✅ Playwright fonctionne correctement!
# ✅ Header trouvé!
# ✅ Pas d'erreurs console critiques!
```

## Lancer les tests

### 1. Démarrer l'application

Dans un terminal:
```bash
cd apps/web
npm run dev
```

Attendre que l'application soit disponible sur `http://localhost:3000`

### 2. Lancer les tests

Dans un autre terminal:

```bash
cd apps/web

# Tous les tests
npm run test:e2e

# Mode UI (recommandé pour débuter)
npm run test:e2e:ui

# Mode debug
npm run test:e2e:debug

# Un fichier spécifique
npx playwright test tests/smoke.spec.ts

# Voir le rapport
npm run test:e2e:report
```

## Tests disponibles

### Tests de santé (smoke.spec.ts)
Tests rapides pour vérifier que l'application fonctionne:
```bash
npx playwright test tests/smoke.spec.ts
```

### Tests d'authentification (auth.spec.ts)
```bash
npx playwright test tests/auth.spec.ts
```

### Tests de création d'annonce (listing-creation.spec.ts)
```bash
npx playwright test tests/listing-creation.spec.ts
```

### Tests de réservation (booking.spec.ts)
```bash
npx playwright test tests/booking.spec.ts
```

### Tests de messagerie (messaging.spec.ts)
```bash
npx playwright test tests/messaging.spec.ts
```

### Tests des avis (reviews.spec.ts)
```bash
npx playwright test tests/reviews.spec.ts
```

## Mode UI (Recommandé)

Le mode UI est le plus pratique pour développer et débugger:

```bash
npm run test:e2e:ui
```

Avantages:
- Interface graphique
- Voir les tests en temps réel
- Inspecter les éléments
- Voir les traces
- Relancer facilement

## Troubleshooting

### L'application ne démarre pas

Vérifier que le port 3000 est libre:
```bash
# Windows
netstat -ano | findstr :3000

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### Les tests échouent avec "Timeout"

1. Vérifier que l'app tourne sur `http://localhost:3000`
2. Augmenter les timeouts dans `playwright.config.ts`
3. Utiliser `--headed` pour voir ce qui se passe

### Erreurs de sélecteurs

Les tests utilisent des `data-testid`. Si un test échoue, vérifier que l'élément existe:

```bash
# Rechercher dans le code
grep -r "data-testid=\"listing-card\"" src/
```

### Base de données

Pour les tests complets, vous aurez besoin d'une DB de test:

1. Créer une DB de test:
```sql
CREATE DATABASE lokroom_test;
```

2. Configurer `.env.test`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lokroom_test"
```

3. Migrer:
```bash
npx prisma migrate deploy
npx prisma db seed
```

## Prochaines étapes

1. ✅ Vérifier que le test de setup passe
2. ✅ Lancer les smoke tests
3. ✅ Essayer le mode UI
4. ✅ Ajouter des `data-testid` dans votre code
5. ✅ Lancer les tests complets
6. ✅ Intégrer dans votre workflow

## Commandes utiles

```bash
# Lister tous les tests
npx playwright test --list

# Lancer un test spécifique
npx playwright test -g "devrait permettre de se connecter"

# Lancer sur un navigateur spécifique
npx playwright test --project=chromium

# Mode debug avec pause
npx playwright test --debug

# Générer un rapport
npx playwright show-report

# Mettre à jour les snapshots
npx playwright test --update-snapshots
```

## Documentation complète

Voir `tests/README.md` pour la documentation complète avec:
- Exemples de code
- Bonnes pratiques
- Helpers disponibles
- Fixtures
- Troubleshooting avancé

## Support

En cas de problème:
1. Vérifier `tests/README.md`
2. Consulter la [documentation Playwright](https://playwright.dev)
3. Vérifier les logs dans `test-results/`
4. Utiliser le mode debug: `npm run test:e2e:debug`
