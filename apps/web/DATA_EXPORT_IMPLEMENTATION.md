# Système d'Export de Données Personnelles - RGPD

## Vue d'ensemble

Système complet d'export de données personnelles conforme au RGPD (Article 20 - Droit à la portabilité des données) pour Lok'Room.

## Fonctionnalités

### 1. Formats d'export supportés

- **JSON**: Format structuré, machine-readable (~100-500 KB)
- **CSV**: Compatible Excel/Google Sheets, plusieurs fichiers dans un ZIP (~50-200 KB)
- **PDF**: Rapport lisible avec mise en page professionnelle (~200-800 KB)
- **ZIP**: Export complet avec JSON, CSV et toutes les photos (~5-50 MB)
- **ZIP (sans photos)**: Export complet sans les images (~500 KB-2 MB)

### 2. Données exportées

L'export contient **toutes** les données personnelles de l'utilisateur:

- **Compte**: ID, email, nom, rôle, pays, dates, statut d'identité, 2FA
- **Profil**: Informations personnelles, adresse, contact d'urgence, préférences
- **Profil Hôte**: Bio, langues, badges, KYC, paiements
- **Annonces**: Toutes les annonces avec photos, équipements, tarifs
- **Réservations**: En tant que voyageur et hôte
- **Avis**: Donnés et reçus avec notes détaillées
- **Messages**: Toutes les conversations
- **Favoris**: Annonces favorites et listes de souhaits
- **Notifications**: Historique complet (500 dernières)
- **Recherches**: Historique de recherche (100 dernières)
- **Paiements**: Transactions PayPal et Stripe
- **Litiges**: Litiges ouverts avec résolutions
- **Consentements**: Tous les consentements RGPD
- **Logs d'audit**: Actions importantes (100 derniers)
- **Portefeuille**: Solde et transactions

### 3. Sécurité et conformité

- **Rate limiting**: 1 export par heure par utilisateur
- **Expiration**: Les exports expirent après 7 jours
- **Logs d'audit**: Toutes les actions sont loggées (création, téléchargement)
- **Authentification**: Seul le propriétaire peut télécharger ses exports
- **Nettoyage automatique**: Cron job quotidien pour supprimer les exports expirés

## Architecture

### Fichiers créés

```
apps/web/
├── prisma/
│   └── schema.prisma (modifié - DataExportRequest enrichi)
├── src/
│   ├── app/
│   │   ├── account/
│   │   │   └── data-export/
│   │   │       └── page.tsx (interface utilisateur)
│   │   └── api/
│   │       ├── users/
│   │       │   └── me/
│   │       │       └── export/
│   │       │           ├── route.ts (POST/GET)
│   │       │           └── [id]/
│   │       │               └── download/
│   │       │                   └── route.ts (téléchargement)
│   │       └── cron/
│   │           └── cleanup-exports/
│   │               └── route.ts (nettoyage)
│   └── lib/
│       ├── export/
│       │   ├── user-data.ts (collecte des données)
│       │   ├── email.ts (notifications)
│       │   ├── export.test.ts (tests)
│       │   └── formats/
│       │       ├── json.ts
│       │       ├── csv.ts
│       │       ├── pdf.ts
│       │       └── zip.ts
│       └── validations/
│           └── data-export.ts
```

### Modèle de données

```prisma
model DataExportRequest {
  id           String    @id @default(cuid())
  userId       String
  format       String    @default("json") // "json", "csv", "pdf", "zip", "zip-no-photos"
  status       String    @default("pending") // "pending", "processing", "completed", "failed"
  fileUrl      String?
  fileSize     Int?      // Taille en bytes
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  completedAt  DateTime?
  errorMessage String?
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
}
```

## API Routes

### POST /api/users/me/export

Créer une demande d'export.

**Body**:
```json
{
  "format": "json" | "csv" | "pdf" | "zip" | "zip-no-photos"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Export généré avec succès",
  "export": {
    "id": "clx...",
    "format": "json",
    "fileSize": 123456,
    "expiresAt": "2026-02-16T10:00:00Z",
    "downloadUrl": "/api/users/me/export/clx.../download"
  }
}
```

**Response (429 - Rate limit)**:
```json
{
  "error": "Limite de fréquence atteinte",
  "message": "Vous pouvez demander un nouvel export dans 1 heure(s)",
  "lastExport": "2026-02-09T09:00:00Z",
  "nextAllowedAt": "2026-02-09T10:00:00Z"
}
```

### GET /api/users/me/export

Récupérer l'historique des exports (10 derniers).

**Response (200)**:
```json
{
  "exports": [
    {
      "id": "clx...",
      "format": "json",
      "status": "completed",
      "fileSize": 123456,
      "createdAt": "2026-02-09T09:00:00Z",
      "completedAt": "2026-02-09T09:00:30Z",
      "expiresAt": "2026-02-16T09:00:00Z",
      "errorMessage": null,
      "downloadUrl": "/api/users/me/export/clx.../download",
      "isExpired": false
    }
  ]
}
```

### GET /api/users/me/export/[id]/download

Télécharger un export.

**Response (200)**:
- Headers: `Content-Type`, `Content-Disposition`, `Content-Length`
- Body: Fichier binaire (JSON, PDF, ZIP)

**Response (401)**: Non authentifié
**Response (403)**: Accès non autorisé
**Response (404)**: Export introuvable
**Response (410)**: Export expiré

## Interface utilisateur

### Page /account/data-export

Interface complète avec:

1. **Sélection du format**:
   - Cartes visuelles pour chaque format
   - Description et taille estimée
   - Sélection interactive

2. **Création d'export**:
   - Bouton "Créer l'export"
   - Indicateur de chargement
   - Messages de succès/erreur

3. **Historique**:
   - Liste des 10 derniers exports
   - Statut (terminé, en cours, échoué)
   - Taille du fichier
   - Date de création et d'expiration
   - Bouton de téléchargement

4. **Informations RGPD**:
   - Explication de la conformité
   - Liste des données incluses
   - Droits de l'utilisateur

## Tests

### Tests unitaires

```bash
npm test -- export.test.ts
```

Tests couverts:
- ✅ Collecte des données utilisateur
- ✅ Génération JSON
- ✅ Génération CSV
- ✅ Génération PDF
- ✅ Génération ZIP
- ✅ Création de demande d'export
- ✅ Mise à jour du statut
- ✅ Rate limiting
- ✅ Expiration

### Tests manuels

1. **Créer un export JSON**:
   - Aller sur `/account/data-export`
   - Sélectionner "JSON"
   - Cliquer sur "Créer l'export"
   - Vérifier le téléchargement

2. **Tester le rate limiting**:
   - Créer un export
   - Essayer d'en créer un autre immédiatement
   - Vérifier l'erreur 429

3. **Tester l'expiration**:
   - Créer un export
   - Modifier manuellement `expiresAt` en DB (date passée)
   - Essayer de télécharger
   - Vérifier l'erreur 410

4. **Tester tous les formats**:
   - JSON: Vérifier la structure
   - CSV: Ouvrir dans Excel
   - PDF: Vérifier la mise en page
   - ZIP: Extraire et vérifier le contenu

## Cron Job

### Nettoyage automatique

**Endpoint**: `POST /api/cron/cleanup-exports`

**Authentification**: Bearer token (`CRON_SECRET`)

**Fréquence recommandée**: Tous les jours à 2h du matin

**Configuration Vercel** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-exports",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Configuration alternative** (GitHub Actions):
```yaml
name: Cleanup Exports
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X POST https://lokroom.com/api/cron/cleanup-exports \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Email de notification

Lorsqu'un export est prêt, un email est envoyé à l'utilisateur avec:

- Format de l'export
- Taille du fichier
- Date d'expiration
- Lien de téléchargement
- Informations RGPD

**Note**: L'envoi d'email est optionnel et peut être activé en décommentant le code dans `route.ts`.

## Production

### Recommandations

1. **Stockage S3/R2**:
   - Uploader les exports sur S3/Cloudflare R2
   - Générer des URLs signées (expiration 7 jours)
   - Supprimer les fichiers après expiration

2. **Job asynchrone**:
   - Pour les exports > 10 MB, utiliser un job background
   - Utiliser BullMQ ou Inngest
   - Notifier par email quand prêt

3. **Monitoring**:
   - Logger toutes les créations/téléchargements
   - Alertes si taux d'échec > 5%
   - Métriques: temps de génération, taille moyenne

4. **Optimisations**:
   - Limiter le nombre de photos dans le ZIP (max 100)
   - Compresser les images avant d'ajouter au ZIP
   - Utiliser des streams pour les gros fichiers

### Variables d'environnement

```env
# Cron job secret
CRON_SECRET=your-secret-key

# S3/R2 (optionnel, pour production)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET=lokroom-exports
```

## Conformité RGPD

### Article 20 - Droit à la portabilité

✅ **Format structuré**: JSON (machine-readable)
✅ **Format couramment utilisé**: CSV, PDF
✅ **Données complètes**: Toutes les données personnelles
✅ **Délai**: < 1 heure (vs 1 mois max RGPD)
✅ **Gratuit**: Aucun frais
✅ **Logs d'audit**: Traçabilité complète

### Autres articles

- **Article 15** (Droit d'accès): ✅ Couvert par l'export
- **Article 17** (Droit à l'effacement): Voir `/api/account/delete`
- **Article 21** (Droit d'opposition): Voir consentements

## Dépendances

Packages installés:
```json
{
  "dependencies": {
    "jspdf": "^2.5.2",
    "jszip": "^3.10.1",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

## Maintenance

### Tâches régulières

- [ ] Vérifier les logs d'erreur (exports échoués)
- [ ] Monitorer la taille moyenne des exports
- [ ] Vérifier que le cron job s'exécute correctement
- [ ] Tester l'export après chaque mise à jour majeure du schéma

### Évolutions futures

- [ ] Support de formats additionnels (XML, YAML)
- [ ] Export incrémental (seulement les nouvelles données)
- [ ] Planification d'exports automatiques (mensuel)
- [ ] Chiffrement des exports sensibles
- [ ] Signature numérique des exports

## Support

Pour toute question ou problème:
- Email: support@lokroom.com
- Documentation RGPD: https://lokroom.com/rgpd
- Code source: `/src/lib/export/`

---

**Statut**: ✅ Implémentation complète
**Version**: 2.0
**Date**: 2026-02-09
