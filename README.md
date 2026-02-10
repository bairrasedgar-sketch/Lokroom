# Lok'Room - Location d'Espaces à l'Heure

[![CI/CD Pipeline](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/ci.yml/badge.svg)](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/e2e-tests.yml)
[![Deploy Preview](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/deploy-preview.yml)
[![Security Scan](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/security.yml/badge.svg)](https://github.com/bairrasedgar-sketch/Lokroom/actions/workflows/security.yml)

Plateforme de location d'espaces à l'heure (appartements, studios, parkings, etc.) avec réservation instantanée et paiement sécurisé.

## 🚀 Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Base de données**: PostgreSQL + Prisma ORM
- **Authentification**: NextAuth.js
- **Paiements**: Stripe
- **Stockage**: AWS S3
- **Cache**: Redis (Upstash)
- **Tests E2E**: Playwright
- **CI/CD**: GitHub Actions + Vercel
- **Monitoring**: Sentry

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/bairrasedgar-sketch/Lokroom.git
cd Lokroom

# Installer les dépendances
cd apps/web
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Générer le client Prisma
npm run prisma:generate

# Lancer les migrations
npm run prisma:migrate

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests E2E avec Playwright
npm run test:e2e

# Tests E2E en mode UI
npm run test:e2e:ui

# Tests E2E avec navigateur visible
npm run test:e2e:headed

# Générer le rapport de tests
npm run test:e2e:report
```

## 🔧 Scripts Disponibles

```bash
npm run dev              # Démarrer en mode développement
npm run build            # Build de production
npm start                # Démarrer le serveur de production
npm run lint             # Linter le code
npm run lint:fix         # Corriger automatiquement les erreurs de lint
npm run format           # Formater le code avec Prettier
npm run prisma:studio    # Ouvrir Prisma Studio
npm run prisma:migrate   # Créer une nouvelle migration
```

## 🏗️ Architecture

```
apps/web/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React réutilisables
│   ├── lib/              # Utilitaires et configurations
│   ├── types/            # Types TypeScript
│   └── middleware.ts     # Middleware Next.js
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── seed.ts           # Données de seed
├── tests/                # Tests E2E Playwright
└── public/               # Assets statiques
```

## 🔐 Variables d'Environnement

Créer un fichier `.env.local` avec les variables suivantes:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-west-3"
AWS_S3_BUCKET_NAME="..."

# Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_AUTH_TOKEN="..."
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement à chaque push sur `main`

### Manuel

```bash
# Build de production
npm run build

# Démarrer le serveur
npm start
```

## 🔄 CI/CD

Le projet utilise GitHub Actions pour l'intégration et le déploiement continus:

- **CI Pipeline** (`ci.yml`): Lint, tests, build sur chaque push/PR
- **E2E Tests** (`e2e-tests.yml`): Tests Playwright quotidiens et sur PR
- **Deploy Preview** (`deploy-preview.yml`): Déploiement preview sur chaque PR
- **Security Scan** (`security.yml`): Scan de sécurité hebdomadaire

### Workflows Disponibles

- ✅ Lint & Type Check
- ✅ Tests unitaires avec couverture
- ✅ Tests E2E Playwright (multi-navigateurs)
- ✅ Build Next.js
- ✅ Déploiement Vercel (production + preview)
- ✅ Scan de sécurité CodeQL
- ✅ Lighthouse CI (performance)
- ✅ Backup automatique de la base de données

## 📊 Monitoring & Observabilité

- **Sentry**: Tracking des erreurs et performance
- **Vercel Analytics**: Métriques de performance
- **Lighthouse CI**: Audits de performance automatiques
- **Uptime Monitoring**: Surveillance de disponibilité

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Conventions de Commit

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgules manquants, etc.
- `refactor:` Refactoring de code
- `perf:` Amélioration de performance
- `test:` Ajout de tests
- `chore:` Maintenance

## 📝 Licence

Ce projet est sous licence MIT.

## 🔗 Liens Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Playwright](https://playwright.dev)
- [Documentation Stripe](https://stripe.com/docs)
- [Guide de déploiement Vercel](https://vercel.com/docs)

## 📧 Support

Pour toute question ou problème, ouvrir une issue sur GitHub ou contacter l'équipe de développement.

---

Développé avec ❤️ par l'équipe Lok'Room
