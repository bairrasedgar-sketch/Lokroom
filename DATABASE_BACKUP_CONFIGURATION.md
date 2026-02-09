# Guide de Configuration - Système de Backup

## 🔧 Configuration AWS S3

### 1. Créer un bucket S3

```bash
# Via AWS CLI
aws s3 mb s3://lokroom-backups --region eu-west-1

# Ou via la console AWS
# https://console.aws.amazon.com/s3/
```

### 2. Configurer les permissions IAM

Créer une politique IAM pour les backups:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lokroom-backups",
        "arn:aws:s3:::lokroom-backups/*"
      ]
    }
  ]
}
```

### 3. Créer un utilisateur IAM

```bash
# Créer l'utilisateur
aws iam create-user --user-name lokroom-backup-user

# Attacher la politique
aws iam attach-user-policy \
  --user-name lokroom-backup-user \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/LokroomBackupPolicy

# Créer les clés d'accès
aws iam create-access-key --user-name lokroom-backup-user
```

### 4. Configurer le cycle de vie S3 (optionnel)

Pour archiver automatiquement les anciens backups vers Glacier:

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldBackups",
      "Status": "Enabled",
      "Prefix": "backups/",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ]
    }
  ]
}
```

## 🌐 Configuration Cloudflare R2

### 1. Créer un bucket R2

1. Aller sur https://dash.cloudflare.com/
2. Sélectionner votre compte
3. Aller dans "R2" dans le menu latéral
4. Cliquer sur "Create bucket"
5. Nom: `lokroom-backups`

### 2. Créer un token API

1. Dans R2, aller dans "Manage R2 API Tokens"
2. Cliquer sur "Create API Token"
3. Permissions: "Object Read & Write"
4. Bucket: `lokroom-backups`
5. Copier l'Access Key ID et le Secret Access Key

### 3. Variables d'environnement pour R2

```bash
AWS_ACCESS_KEY_ID=your_r2_access_key_id
AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
AWS_BACKUP_BUCKET=lokroom-backups
AWS_REGION=auto
AWS_S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

## 📧 Configuration des notifications email

### Option 1: Resend (recommandé)

```bash
# Installer Resend (déjà installé dans le projet)
npm install resend

# Variables d'environnement
RESEND_API_KEY=re_xxxxxxxxxxxxx
BACKUP_NOTIFICATION_EMAIL=admin@lokroom.com
```

Ajouter dans `scripts/backup-database.ts`:

```typescript
import { Resend } from 'resend';

async function sendFailureNotification(error: string, config: BackupConfig): Promise<void> {
  if (!config.notificationEmail) return;

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Lok\'Room Backups <backups@lokroom.com>',
      to: config.notificationEmail,
      subject: '❌ Database Backup Failed',
      html: `
        <h2>Database Backup Failed</h2>
        <p>The automated database backup has failed.</p>
        <h3>Error Details:</h3>
        <pre>${error}</pre>
        <h3>Action Required:</h3>
        <ul>
          <li>Check the backup logs</li>
          <li>Verify database connectivity</li>
          <li>Verify S3/R2 credentials</li>
          <li>Run a manual backup if needed</li>
        </ul>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });
    console.log('📧 Failure notification sent');
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}
```

### Option 2: SMTP (GitHub Actions)

Variables d'environnement pour GitHub Actions:

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
BACKUP_NOTIFICATION_EMAIL=admin@lokroom.com
```

## 🔐 Configuration PostgreSQL

### 1. Installer pg_dump et psql

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

#### macOS
```bash
brew install postgresql
```

#### Windows
Télécharger depuis https://www.postgresql.org/download/windows/

### 2. Tester la connexion

```bash
# Tester pg_dump
pg_dump "$DATABASE_URL" --version

# Tester la connexion
psql "$DATABASE_URL" -c "SELECT version();"
```

### 3. Configuration pour les grandes bases de données

Pour les bases de données volumineuses, ajuster les paramètres:

```typescript
// Dans backup-database.ts
await execAsync(
  `pg_dump "${databaseUrl}" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-acl \
    > "${outputPath}"`
);
```

## 🚀 Déploiement

### 1. Variables d'environnement en production

Ajouter dans Vercel/Railway/autre:

```bash
# Base de données
DATABASE_URL=postgresql://...

# S3/R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BACKUP_BUCKET=lokroom-backups
AWS_REGION=auto
AWS_S3_ENDPOINT=https://...r2.cloudflarestorage.com

# Notifications
BACKUP_NOTIFICATION_EMAIL=admin@lokroom.com
RESEND_API_KEY=re_...
```

### 2. GitHub Secrets

Ajouter dans Settings > Secrets and variables > Actions:

```bash
DATABASE_URL
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_BACKUP_BUCKET
AWS_REGION
AWS_S3_ENDPOINT
BACKUP_NOTIFICATION_EMAIL
SMTP_SERVER
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
```

### 3. Tester le workflow GitHub Actions

```bash
# Déclencher manuellement
gh workflow run database-backup.yml

# Vérifier le statut
gh run list --workflow=database-backup.yml

# Voir les logs
gh run view --log
```

## 🧪 Tests de validation

### Test 1: Backup manuel

```bash
cd apps/web

# Configurer les variables d'environnement
export DATABASE_URL="postgresql://..."
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_BACKUP_BUCKET="lokroom-backups"
export AWS_REGION="auto"

# Exécuter le backup
npm run backup:database

# Vérifier le résultat
npm run backup:list
```

### Test 2: Restauration

```bash
# Créer un backup de test
npm run backup:database

# Noter l'ID du backup
npm run backup:list

# Restaurer (ATTENTION: écrase la DB!)
npm run backup:restore latest
```

### Test 3: Interface admin

1. Aller sur https://lokroom.com/admin/backups
2. Vérifier que les backups s'affichent
3. Créer un backup manuel
4. Télécharger un backup
5. Vérifier les statistiques

### Test 4: Rotation automatique

```bash
# Créer plusieurs backups de test avec des dates différentes
# (nécessite de modifier temporairement les dates dans la DB)

# Exécuter la rotation
npm run backup:database

# Vérifier que les anciens sont supprimés
npm run backup:list
```

## 📊 Monitoring et alertes

### 1. Configurer les alertes Sentry (optionnel)

```typescript
// Dans backup-database.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

try {
  await backupDatabase();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### 2. Configurer les métriques CloudWatch (AWS)

```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'eu-west-1' });

await cloudwatch.putMetricData({
  Namespace: 'LokRoom/Backups',
  MetricData: [
    {
      MetricName: 'BackupSuccess',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
    },
    {
      MetricName: 'BackupSize',
      Value: fileSize,
      Unit: 'Bytes',
      Timestamp: new Date(),
    },
  ],
});
```

### 3. Dashboard Grafana (optionnel)

Créer un dashboard pour visualiser:
- Nombre de backups par jour
- Taille totale des backups
- Taux de succès/échec
- Durée moyenne des backups
- Espace utilisé sur S3/R2

## 🔄 Procédure de restauration d'urgence

### Scénario 1: Perte de données récente

```bash
# 1. Identifier le dernier backup valide
npm run backup:list

# 2. Restaurer
npm run backup:restore latest

# 3. Vérifier l'intégrité
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
```

### Scénario 2: Corruption de la base de données

```bash
# 1. Créer un backup de la DB corrompue (pour analyse)
npm run backup:database

# 2. Identifier le dernier backup sain
npm run backup:list -- --status=COMPLETED

# 3. Restaurer le backup sain
npm run backup:restore <backup-id>

# 4. Vérifier l'intégrité
npm run prisma:studio
```

### Scénario 3: Restauration sur un nouveau serveur

```bash
# 1. Installer PostgreSQL
sudo apt-get install postgresql

# 2. Créer la base de données
createdb lokroom

# 3. Configurer DATABASE_URL
export DATABASE_URL="postgresql://localhost/lokroom"

# 4. Télécharger le backup depuis S3
aws s3 cp s3://lokroom-backups/backups/lokroom-backup-xxx.sql.gz .

# 5. Décompresser
gunzip lokroom-backup-xxx.sql.gz

# 6. Restaurer
psql "$DATABASE_URL" < lokroom-backup-xxx.sql

# 7. Vérifier
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
```

## 📝 Checklist de mise en production

- [ ] Bucket S3/R2 créé
- [ ] Credentials AWS/R2 configurés
- [ ] Variables d'environnement définies
- [ ] GitHub Secrets configurés
- [ ] Workflow GitHub Actions testé
- [ ] Backup manuel testé
- [ ] Restauration testée (sur DB de test!)
- [ ] Interface admin accessible
- [ ] Notifications email configurées
- [ ] Rotation automatique testée
- [ ] Documentation à jour
- [ ] Procédure de restauration d'urgence documentée
- [ ] Équipe formée sur la procédure

## 🎯 Bonnes pratiques

### Sécurité
- ✅ Ne jamais commiter les credentials AWS/R2
- ✅ Utiliser des tokens IAM avec permissions minimales
- ✅ Activer le chiffrement S3 au repos
- ✅ Activer le versioning S3
- ✅ Restreindre l'accès aux backups (IAM policies)
- ✅ Auditer les accès aux backups

### Performance
- ✅ Exécuter les backups pendant les heures creuses
- ✅ Utiliser la compression maximale
- ✅ Monitorer la durée des backups
- ✅ Optimiser la taille de la base de données

### Fiabilité
- ✅ Tester la restauration régulièrement (1x/mois)
- ✅ Vérifier les checksums
- ✅ Conserver plusieurs générations de backups
- ✅ Répliquer les backups dans plusieurs régions
- ✅ Documenter les procédures

### Coûts
- ✅ Monitorer l'espace utilisé sur S3/R2
- ✅ Configurer le cycle de vie S3 (archivage vers Glacier)
- ✅ Supprimer les backups obsolètes
- ✅ Utiliser Cloudflare R2 (pas de frais de sortie)

## 🆘 FAQ

### Q: Combien de temps prend un backup?
**R:** Dépend de la taille de la base de données:
- Petite DB (<1GB): 1-2 minutes
- Moyenne DB (1-10GB): 5-15 minutes
- Grande DB (>10GB): 30+ minutes

### Q: Combien d'espace S3/R2 est nécessaire?
**R:** Environ 3-5x la taille de la base de données (avec compression et rotation).

### Q: Peut-on restaurer sur une version différente de PostgreSQL?
**R:** Oui, mais il est recommandé d'utiliser la même version majeure.

### Q: Les backups sont-ils chiffrés?
**R:** Oui, si le chiffrement S3 est activé. Pour un chiffrement supplémentaire, utiliser GPG.

### Q: Que faire si un backup échoue?
**R:**
1. Vérifier les logs
2. Vérifier les credentials
3. Vérifier la connectivité
4. Relancer manuellement
5. Contacter le support si le problème persiste

### Q: Comment restaurer une table spécifique?
**R:** Utiliser `pg_restore` avec l'option `--table`:
```bash
pg_restore -d "$DATABASE_URL" --table=User backup.sql
```

---

**Configuration terminée! Le système de backup est prêt à être utilisé en production. 🚀**
