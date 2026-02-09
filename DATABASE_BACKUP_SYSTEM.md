# Système de Backup Automatique de Base de Données - Lok'Room

## 📋 Vue d'ensemble

Système complet de sauvegarde automatique de la base de données PostgreSQL avec rotation, restauration et interface d'administration.

## ✅ Fonctionnalités implémentées

### 1. Modèle de données Prisma
- ✅ Modèle `DatabaseBackup` avec tous les champs nécessaires
- ✅ Enums `BackupType` (DAILY, WEEKLY, MONTHLY, MANUAL)
- ✅ Enums `BackupStatus` (PENDING, IN_PROGRESS, COMPLETED, FAILED, DELETED)
- ✅ Checksum SHA256 pour vérification d'intégrité
- ✅ Migration appliquée avec `prisma db push`

### 2. Scripts de backup et restauration

#### `scripts/backup-database.ts`
- ✅ Dump complet PostgreSQL avec `pg_dump`
- ✅ Compression gzip (niveau 9)
- ✅ Calcul du checksum SHA256
- ✅ Upload sur S3/R2 (compatible Cloudflare R2)
- ✅ Enregistrement dans la base de données
- ✅ Rotation automatique des backups:
  - Quotidiens: 7 jours
  - Hebdomadaires: 4 semaines
  - Mensuels: 12 mois
- ✅ Gestion des erreurs et notifications
- ✅ Nettoyage des fichiers temporaires

#### `scripts/restore-database.ts`
- ✅ Téléchargement depuis S3/R2
- ✅ Vérification du checksum
- ✅ Décompression gzip
- ✅ Restauration avec `psql`
- ✅ Logs d'audit
- ✅ Confirmation de sécurité (10 secondes)
- ✅ Support pour `latest` ou ID spécifique

#### `scripts/list-backups.ts`
- ✅ Liste des backups avec filtres
- ✅ Statistiques (taille totale, dernier backup, etc.)
- ✅ Formatage lisible (taille, dates)
- ✅ Instructions d'utilisation

### 3. API Routes Admin

#### `GET /api/admin/backups`
- ✅ Liste paginée des backups
- ✅ Filtres par type et statut
- ✅ Statistiques globales
- ✅ Permissions admin requises

#### `POST /api/admin/backups`
- ✅ Déclenchement manuel d'un backup
- ✅ Vérification qu'aucun backup n'est en cours
- ✅ Exécution en arrière-plan

#### `DELETE /api/admin/backups/[id]`
- ✅ Suppression d'un backup (S3 + DB)
- ✅ Log d'audit
- ✅ Permissions admin requises

#### `GET /api/admin/backups/[id]/download`
- ✅ Génération d'URL signée S3 (valide 1h)
- ✅ Log d'audit du téléchargement
- ✅ Permissions admin requises

#### `POST /api/admin/backups/[id]/restore`
- ✅ Déclenchement de la restauration
- ✅ Vérification du statut du backup
- ✅ Log d'audit
- ✅ Exécution en arrière-plan

### 4. Interface Admin (`/admin/backups`)
- ✅ Dashboard avec statistiques:
  - Espace total utilisé
  - Nombre de backups complétés
  - Nombre d'échecs
  - Dernier backup
- ✅ Liste des backups avec:
  - Nom du fichier
  - Type (DAILY, WEEKLY, MONTHLY, MANUAL)
  - Statut avec icônes
  - Taille
  - Date de création
  - Durée
  - Checksum (tronqué)
- ✅ Filtres par type et statut
- ✅ Pagination
- ✅ Actions:
  - Créer un backup manuel
  - Télécharger un backup
  - Restaurer un backup (avec double confirmation)
  - Supprimer un backup
- ✅ Design moderne avec Tailwind CSS et Lucide icons
- ✅ États de chargement
- ✅ Gestion des erreurs

### 5. GitHub Actions Workflow

#### `.github/workflows/database-backup.yml`
- ✅ Exécution quotidienne à 3h du matin UTC
- ✅ Déclenchement manuel possible
- ✅ Installation de PostgreSQL client
- ✅ Installation des dépendances Node.js
- ✅ Génération du Prisma Client
- ✅ Exécution du script de backup
- ✅ Notification par email en cas d'échec
- ✅ Timeout de 30 minutes

### 6. Scripts NPM

```json
{
  "backup:database": "tsx scripts/backup-database.ts",
  "backup:restore": "tsx scripts/restore-database.ts",
  "backup:list": "tsx scripts/list-backups.ts"
}
```

## 🔧 Configuration requise

### Variables d'environnement

```bash
# Base de données
DATABASE_URL=postgresql://user:password@host:port/database

# AWS S3 / Cloudflare R2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BACKUP_BUCKET=lokroom-backups
AWS_REGION=auto  # ou us-east-1, eu-west-1, etc.
AWS_S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com  # Optionnel pour R2

# Notifications (optionnel)
BACKUP_NOTIFICATION_EMAIL=admin@lokroom.com
```

### GitHub Secrets

Ajouter dans les secrets du repository:
- `DATABASE_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BACKUP_BUCKET`
- `AWS_REGION`
- `AWS_S3_ENDPOINT` (si Cloudflare R2)
- `BACKUP_NOTIFICATION_EMAIL` (optionnel)
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` (pour notifications email)

## 📖 Utilisation

### Backup manuel

```bash
# Via script
cd apps/web
npm run backup:database

# Via API (nécessite authentification admin)
curl -X POST https://lokroom.com/api/admin/backups \
  -H "Authorization: Bearer YOUR_TOKEN"

# Via interface admin
https://lokroom.com/admin/backups
```

### Lister les backups

```bash
# Tous les backups
npm run backup:list

# Filtrer par type
npm run backup:list -- --type=DAILY

# Filtrer par statut
npm run backup:list -- --status=COMPLETED

# Limiter le nombre de résultats
npm run backup:list -- --limit=10
```

### Restaurer un backup

```bash
# Restaurer le dernier backup
npm run backup:restore latest

# Restaurer un backup spécifique
npm run backup:restore clxxx123456789

# Via interface admin (avec double confirmation)
https://lokroom.com/admin/backups
```

### Télécharger un backup

```bash
# Via interface admin
https://lokroom.com/admin/backups

# Via API
curl https://lokroom.com/api/admin/backups/clxxx123456789/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Rotation automatique

Le système supprime automatiquement les anciens backups selon ces règles:

- **Backups quotidiens**: Conservés 7 jours
- **Backups hebdomadaires**: Conservés 4 semaines (28 jours)
- **Backups mensuels**: Conservés 12 mois (365 jours)
- **Backups manuels**: Jamais supprimés automatiquement

La rotation s'exécute après chaque backup réussi.

## 🔐 Sécurité

### Vérification d'intégrité
- Checksum SHA256 calculé lors du backup
- Vérification automatique lors de la restauration
- Alerte si le checksum ne correspond pas

### Permissions
- Toutes les routes API nécessitent le rôle `ADMIN`
- Logs d'audit pour toutes les actions sensibles:
  - Création de backup manuel
  - Téléchargement de backup
  - Restauration de backup
  - Suppression de backup

### Restauration
- Double confirmation requise dans l'interface
- Délai de 10 secondes avant exécution
- Message d'avertissement clair

## 📊 Monitoring

### Statistiques disponibles
- Nombre total de backups par statut
- Espace total utilisé
- Dernier backup (date, type, taille)
- Taux de succès/échec

### Notifications
- Email automatique en cas d'échec du backup quotidien
- Logs détaillés dans GitHub Actions
- Enregistrement des erreurs dans la base de données

## 🧪 Tests

### Test du backup manuel

```bash
cd apps/web
npm run backup:database
```

Vérifier:
- ✅ Fichier créé dans S3/R2
- ✅ Enregistrement dans la base de données
- ✅ Checksum calculé
- ✅ Taille correcte

### Test de la restauration

```bash
# Créer un backup de test
npm run backup:database

# Lister les backups
npm run backup:list

# Restaurer le dernier backup
npm run backup:restore latest
```

⚠️ **ATTENTION**: La restauration écrase la base de données actuelle!

### Test de la rotation

```bash
# Créer plusieurs backups de test
for i in {1..10}; do
  npm run backup:database
  sleep 5
done

# Vérifier que les anciens sont supprimés
npm run backup:list
```

## 📁 Structure des fichiers

```
apps/web/
├── prisma/
│   └── schema.prisma                    # Modèle DatabaseBackup
├── scripts/
│   ├── backup-database.ts               # Script de backup
│   ├── restore-database.ts              # Script de restauration
│   └── list-backups.ts                  # Liste des backups
├── src/
│   └── app/
│       ├── admin/
│       │   └── backups/
│       │       └── page.tsx             # Interface admin
│       └── api/
│           └── admin/
│               └── backups/
│                   ├── route.ts         # GET, POST
│                   └── [id]/
│                       ├── route.ts     # DELETE
│                       ├── download/
│                       │   └── route.ts # GET
│                       └── restore/
│                           └── route.ts # POST
└── package.json                         # Scripts NPM

.github/
└── workflows/
    └── database-backup.yml              # Workflow GitHub Actions
```

## 🚀 Prochaines étapes (optionnelles)

### Améliorations possibles

1. **Notifications avancées**
   - Intégration Slack
   - Webhooks personnalisés
   - Dashboard de monitoring (Grafana, Datadog)

2. **Backups incrémentaux**
   - Réduire la taille des backups
   - Backup différentiel
   - Point-in-time recovery

3. **Chiffrement**
   - Chiffrement des backups avec GPG
   - Clés de chiffrement gérées par AWS KMS

4. **Tests automatisés**
   - Test de restauration automatique
   - Validation de l'intégrité des données
   - Tests de performance

5. **Multi-région**
   - Réplication des backups dans plusieurs régions
   - Disaster recovery automatique

6. **Compression avancée**
   - Algorithmes de compression plus efficaces (zstd, lz4)
   - Déduplication

## 📝 Notes importantes

### Compatibilité
- ✅ PostgreSQL 12+
- ✅ Node.js 18+
- ✅ AWS S3
- ✅ Cloudflare R2
- ✅ Compatible Windows, Linux, macOS

### Limitations
- Les backups manuels via l'interface admin sont exécutés en arrière-plan
- La restauration nécessite un accès direct à la base de données
- Les très grandes bases de données (>100GB) peuvent nécessiter des ajustements

### Bonnes pratiques
- Tester la restauration régulièrement
- Vérifier l'espace disponible sur S3/R2
- Monitorer les logs d'erreur
- Conserver au moins un backup hors ligne
- Documenter la procédure de restauration d'urgence

## 🆘 Dépannage

### Le backup échoue

1. Vérifier les credentials AWS/R2
2. Vérifier que `pg_dump` est installé
3. Vérifier la connexion à la base de données
4. Vérifier l'espace disque disponible
5. Consulter les logs: `npm run backup:database`

### La restauration échoue

1. Vérifier que le backup existe et est complet
2. Vérifier le checksum
3. Vérifier que `psql` est installé
4. Vérifier la connexion à la base de données
5. Consulter les logs: `npm run backup:restore <id>`

### L'interface admin ne charge pas

1. Vérifier les permissions admin
2. Vérifier que l'API répond: `/api/admin/backups`
3. Consulter la console du navigateur
4. Vérifier les logs serveur

## 📞 Support

Pour toute question ou problème:
1. Consulter cette documentation
2. Vérifier les logs GitHub Actions
3. Consulter les logs de l'application
4. Contacter l'équipe DevOps

---

**Système de backup implémenté avec succès! 🎉**

Tous les composants sont en place et prêts à être utilisés.
