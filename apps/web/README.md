# Lok’Room — Starter (Semaine 1)

## Prérequis

- Node.js LTS (>= 20)
- Git
- Compte Neon (Postgres), Vercel (déploiement)

## Démarrer en local

1. Copier ce dossier `apps/web` en local.
2. `cd apps/web`
3. `cp .env.example .env.local` puis renseigner `DATABASE_URL` (depuis Neon).
4. `npm install`
5. `npx prisma migrate dev --name init_users`
6. `npm run dev`
7. Ouvrir http://localhost:3000 et http://localhost:3000/api/health

## Déployer sur Vercel

- Créer un projet → importer ce dossier `apps/web`
- Ajouter vos variables d’environnement (DATABASE_URL, NEXT_PUBLIC_APP_URL)
- Déployer la branche par défaut

## Prochaines étapes

- Auth magic link (Semaine 2)
