# Configuration Vercel - Système de Recommandations

## 🔧 Configuration du Cron Job

### 1. Variables d'environnement Vercel

Ajouter dans les **Environment Variables** du projet Vercel:

```
CRON_SECRET=your-super-secret-key-here-change-this
```

**Important:** Générer un secret fort avec:
```bash
openssl rand -base64 32
```

### 2. Configuration du cron dans Vercel

Le fichier `vercel.json` est déjà configuré:

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

**Schedule:** Tous les jours à 2h00 UTC

### 3. Vérification après déploiement

1. **Aller dans** Vercel Dashboard > Votre projet > Cron Jobs
2. **Vérifier** que le cron job est listé
3. **Tester** manuellement:

```bash
curl -X POST https://your-domain.vercel.app/api/cron/recommendations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Monitoring et Logs

### Logs Vercel

1. **Aller dans** Vercel Dashboard > Logs
2. **Filtrer** par fonction: `/api/cron/recommendations`
3. **Vérifier** les exécutions quotidiennes

### Logs attendus

```
[Cron] Starting recommendations regeneration...
[Cron] Found 150 users to process
[Cron] Recommendations regeneration complete!
  - Success: 150
  - Errors: 0
  - Total: 150
```

## 🚨 Alertes et notifications

### Configurer les alertes Vercel

1. **Aller dans** Vercel Dashboard > Settings > Notifications
2. **Activer** les alertes pour:
   - Function errors
   - Function timeouts
   - Cron job failures

### Webhook pour Slack/Discord (optionnel)

Créer un endpoint pour recevoir les notifications:

```typescript
// apps/web/src/app/api/webhooks/cron-status/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Envoyer à Slack/Discord
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🤖 Cron Recommendations: ${body.successCount}/${body.processed} users processed`,
    }),
  });

  return NextResponse.json({ success: true });
}
```

## 🔒 Sécurité

### Protection du endpoint cron

Le endpoint est protégé par:
1. **Bearer token** (`CRON_SECRET`)
2. **Vérification** dans le code:

```typescript
const authHeader = req.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Bonnes pratiques

- ✅ Ne jamais commit `CRON_SECRET` dans le code
- ✅ Utiliser un secret différent par environnement
- ✅ Régénérer le secret régulièrement
- ✅ Limiter l'accès aux logs Vercel

## 📈 Optimisation des performances

### Timeout Vercel

Par défaut, les fonctions Vercel ont un timeout de:
- **Hobby plan:** 10 secondes
- **Pro plan:** 60 secondes
- **Enterprise:** 900 secondes

Pour le cron job, configurer dans `vercel.json`:

```json
{
  "functions": {
    "api/cron/recommendations/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### Batch processing

Le code traite déjà par batch de 10 utilisateurs:

```typescript
const batchSize = 10;
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  await Promise.allSettled(batch.map(user => regenerateRecommendations(user.id)));
  await new Promise(resolve => setTimeout(resolve, 100)); // Pause 100ms
}
```

## 🔄 Alternatives au cron Vercel

### Option 1: GitHub Actions

Créer `.github/workflows/recommendations-cron.yml`:

```yaml
name: Regenerate Recommendations

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h UTC
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  regenerate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Vercel API
        run: |
          curl -X POST ${{ secrets.VERCEL_URL }}/api/cron/recommendations \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 2: Upstash QStash

```typescript
// apps/web/src/app/api/cron/recommendations/route.ts
import { verifySignature } from "@upstash/qstash/nextjs";

async function handler(req: NextRequest) {
  // Votre code existant
}

export const POST = verifySignature(handler);
```

Configuration QStash:
```bash
# Créer un schedule sur https://console.upstash.com
curl -X POST https://qstash.upstash.io/v1/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/cron/recommendations",
    "cron": "0 2 * * *"
  }'
```

### Option 3: Cron-job.org

1. **Créer un compte** sur https://cron-job.org
2. **Ajouter un job**:
   - URL: `https://your-domain.com/api/cron/recommendations`
   - Schedule: `0 2 * * *`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

## 📊 Dashboard de monitoring (optionnel)

### Créer une page admin

```typescript
// apps/web/src/app/admin/recommendations/page.tsx
import { prisma } from "@/lib/db";

export default async function RecommendationsAdminPage() {
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT "userId") as users_with_recommendations,
      COUNT(*) as total_recommendations,
      AVG(score) as avg_score,
      MAX("createdAt") as last_generated
    FROM "UserRecommendation"
  `;

  const recentBehaviors = await prisma.userBehavior.groupBy({
    by: ['action'],
    _count: true,
    orderBy: { _count: { action: 'desc' } },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Recommendations Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Users with recommendations</p>
          <p className="text-3xl font-bold">{stats[0].users_with_recommendations}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Total recommendations</p>
          <p className="text-3xl font-bold">{stats[0].total_recommendations}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Average score</p>
          <p className="text-3xl font-bold">{stats[0].avg_score.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Last generated</p>
          <p className="text-sm">{new Date(stats[0].last_generated).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">User Behaviors</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Action</th>
              <th className="text-right py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {recentBehaviors.map(b => (
              <tr key={b.action} className="border-b">
                <td className="py-2">{b.action}</td>
                <td className="text-right">{b._count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## 🧪 Test du cron en local

### Simuler l'exécution du cron

```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Terminal 2: Appeler le cron
curl -X POST http://localhost:3000/api/cron/recommendations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Script de test

```bash
#!/bin/bash
# test-cron.sh

echo "🚀 Testing recommendations cron job..."

response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/cron/recommendations \
  -H "Authorization: Bearer ${CRON_SECRET}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ]; then
  echo "✅ Cron job successful!"
  echo "$body" | jq .
else
  echo "❌ Cron job failed with status $http_code"
  echo "$body"
  exit 1
fi
```

## 📝 Checklist de déploiement

### Avant le déploiement

- [ ] `CRON_SECRET` configuré dans Vercel
- [ ] `vercel.json` présent avec la config cron
- [ ] Tests locaux passés
- [ ] Migration DB appliquée en production

### Après le déploiement

- [ ] Vérifier que le cron job apparaît dans Vercel Dashboard
- [ ] Tester manuellement l'endpoint
- [ ] Vérifier les logs Vercel
- [ ] Attendre la première exécution automatique (2h UTC)
- [ ] Vérifier les données en DB après exécution

### Monitoring continu

- [ ] Configurer les alertes Vercel
- [ ] Vérifier les logs quotidiennement (première semaine)
- [ ] Monitorer les performances
- [ ] Vérifier la qualité des recommandations

## 🔧 Troubleshooting

### Le cron ne s'exécute pas

1. **Vérifier** que le cron est listé dans Vercel Dashboard
2. **Vérifier** le format du schedule dans `vercel.json`
3. **Redéployer** le projet
4. **Contacter** le support Vercel si le problème persiste

### Timeout du cron

1. **Augmenter** `maxDuration` dans `vercel.json`
2. **Optimiser** le batch size
3. **Limiter** le nombre d'utilisateurs traités
4. **Considérer** un service externe (QStash, etc.)

### Erreurs dans les logs

1. **Identifier** l'erreur exacte dans les logs
2. **Tester** localement avec les mêmes données
3. **Corriger** et redéployer
4. **Monitorer** la prochaine exécution

## 🎯 Résultat attendu

Après configuration complète:

- ✅ Cron job s'exécute tous les jours à 2h UTC
- ✅ Recommandations régénérées pour tous les utilisateurs actifs
- ✅ Logs disponibles dans Vercel Dashboard
- ✅ Alertes configurées en cas d'erreur
- ✅ Performance optimale (< 5 minutes pour 1000 utilisateurs)

Le système de recommandations est maintenant **100% opérationnel en production**!
