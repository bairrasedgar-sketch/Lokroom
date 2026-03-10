# 🚨 Guide Configuration Alertes Sentry - Lok'Room

## 📊 Statut Actuel

✅ **Sentry installé et configuré**
- Package: `@sentry/nextjs` v10.38.0
- DSN configuré dans `.env.local`
- Configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Intégration Next.js active via `next.config.mjs`

❌ **Alertes non configurées**
- Pas d'alertes automatiques pour erreurs critiques
- Pas de notifications configurées
- Pas de seuils définis

---

## 🎯 Configuration Recommandée

### 1. Alertes Critiques (Issue Alerts)

#### A. Erreurs Serveur 500+
**Quand:** Une erreur serveur critique survient
**Action:** Notification immédiate

```
Conditions:
- Event type: error
- Level: error ou fatal
- Tags: status_code >= 500
- Environment: production

Actions:
- Send notification to: #alerts-critical (Slack)
- Send email to: dev-team@lokroom.com
- Frequency: Immediately
```

#### B. Erreurs de Paiement
**Quand:** Échec transaction Stripe/PayPal
**Action:** Notification immédiate

```
Conditions:
- Event type: error
- Tags: component = "payment"
- Message contains: "stripe" OR "paypal"
- Environment: production

Actions:
- Send notification to: #alerts-payments (Slack)
- Send email to: finance@lokroom.com
- Frequency: Immediately
```

#### C. Erreurs d'Authentification
**Quand:** Échecs auth répétés (possible attaque)
**Action:** Notification si > 10 erreurs/min

```
Conditions:
- Event type: error
- Tags: component = "auth"
- Count: > 10 events in 1 minute
- Environment: production

Actions:
- Send notification to: #alerts-security (Slack)
- Send email to: security@lokroom.com
- Frequency: At most once every 5 minutes
```

#### D. Erreurs Base de Données
**Quand:** Connexion DB échoue
**Action:** Notification immédiate

```
Conditions:
- Event type: error
- Message contains: "ECONNREFUSED" OR "database" OR "prisma"
- Environment: production

Actions:
- Send notification to: #alerts-critical (Slack)
- Send PagerDuty alert
- Frequency: Immediately
```

---

### 2. Alertes Performance (Metric Alerts)

#### A. Taux d'Erreur Élevé
**Quand:** > 5% des requêtes échouent
**Action:** Notification

```
Metric: failure_rate()
Threshold: > 5%
Time window: 5 minutes
Environment: production

Actions:
- Send notification to: #alerts-performance (Slack)
- Frequency: At most once every 10 minutes
```

#### B. Latence API Élevée
**Quand:** P95 > 2 secondes
**Action:** Notification

```
Metric: p95(transaction.duration)
Threshold: > 2000ms
Time window: 10 minutes
Filter: transaction.op = "http.server"
Environment: production

Actions:
- Send notification to: #alerts-performance (Slack)
- Frequency: At most once every 15 minutes
```

#### C. Crash Rate Mobile
**Quand:** > 1% des sessions crashent
**Action:** Notification

```
Metric: crash_free_rate()
Threshold: < 99%
Time window: 1 hour
Environment: production
Platform: mobile

Actions:
- Send notification to: #alerts-mobile (Slack)
- Frequency: At most once every 30 minutes
```

---

### 3. Alertes Uptime

#### A. API Down
**Quand:** Endpoint critique inaccessible
**Action:** Notification immédiate

```
URLs à monitorer:
- https://lokroom.com/api/health
- https://lokroom.com/api/listings
- https://lokroom.com/api/bookings/checkout

Check interval: 1 minute
Timeout: 10 seconds

Actions:
- Send notification to: #alerts-critical (Slack)
- Send PagerDuty alert
- Frequency: Immediately
```

---

## 🔧 Étapes de Configuration

### Via Interface Sentry (Recommandé)

1. **Accéder à Sentry**
   - Aller sur https://sentry.io
   - Projet: `lokroom-web`
   - Organisation: `lokroom`

2. **Créer Issue Alert**
   - Alerts → Create Alert Rule
   - Choose "Issues"
   - Configurer conditions (voir ci-dessus)
   - Ajouter actions (Slack, Email, PagerDuty)
   - Sauvegarder

3. **Créer Metric Alert**
   - Alerts → Create Alert Rule
   - Choose "Metrics"
   - Sélectionner métrique
   - Définir seuil
   - Ajouter actions
   - Sauvegarder

4. **Configurer Uptime Monitoring**
   - Uptime → Add Check
   - Entrer URL
   - Définir intervalle
   - Configurer alertes
   - Sauvegarder

### Via API Sentry (Automatisation)

```bash
# Créer une alerte via API
curl -X POST https://sentry.io/api/0/projects/lokroom/lokroom-web/rules/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critical Server Errors",
    "conditions": [
      {
        "id": "sentry.rules.conditions.event_attribute.EventAttributeCondition",
        "attribute": "level",
        "match": "eq",
        "value": "error"
      }
    ],
    "actions": [
      {
        "id": "sentry.rules.actions.notify_event.NotifyEventAction"
      }
    ],
    "actionMatch": "all",
    "frequency": 30
  }'
```

---

## 📱 Intégrations Recommandées

### Slack
- Canal `#alerts-critical` → Erreurs bloquantes
- Canal `#alerts-payments` → Problèmes paiements
- Canal `#alerts-security` → Incidents sécurité
- Canal `#alerts-performance` → Dégradations perf

### Email
- `dev-team@lokroom.com` → Toutes alertes critiques
- `finance@lokroom.com` → Alertes paiements
- `security@lokroom.com` → Alertes sécurité

### PagerDuty (Optionnel)
- Pour alertes critiques nécessitant intervention immédiate
- Rotation on-call

---

## 🎯 Priorités

### Priorité 1 (À faire maintenant)
1. ✅ Alerte: Erreurs serveur 500+
2. ✅ Alerte: Erreurs de paiement
3. ✅ Uptime: API health check

### Priorité 2 (Cette semaine)
4. ⏳ Alerte: Erreurs d'authentification
5. ⏳ Alerte: Erreurs base de données
6. ⏳ Metric: Taux d'erreur élevé

### Priorité 3 (Ce mois)
7. ⏳ Metric: Latence API
8. ⏳ Metric: Crash rate mobile
9. ⏳ Dashboard: Vue d'ensemble temps réel

---

## 📝 Checklist Configuration

- [ ] Créer compte Slack workspace (si pas déjà fait)
- [ ] Créer canaux Slack (#alerts-*)
- [ ] Intégrer Sentry → Slack
- [ ] Configurer 3 alertes priorité 1
- [ ] Tester chaque alerte (déclencher manuellement)
- [ ] Documenter procédures d'intervention
- [ ] Former l'équipe sur les alertes
- [ ] Configurer rotation on-call (si PagerDuty)

---

## 🧪 Test des Alertes

### Test Erreur Serveur
```typescript
// apps/web/src/app/api/test-sentry/route.ts
export async function GET() {
  throw new Error("Test Sentry Alert - Server Error 500");
}
```

### Test Erreur Paiement
```typescript
// Simuler échec Stripe
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(new Error("Stripe payment failed"), {
  tags: { component: "payment" },
  contexts: {
    payment: {
      amount: 10000,
      currency: "EUR",
      method: "stripe"
    }
  }
});
```

---

## 📚 Ressources

- [Sentry Alerts Guide](https://drdroid.io/engineering-tools/guide-for-sentry-alerting)
- [Alert Types Documentation](https://docs.sentry.io/product/alerts/alert-types/)
- [Metric Alert Config](https://docs.sentry.io/product/alerts/create-alerts/metric-alert-config/)
- [Uptime Monitoring](https://docs.sentry.io/product/uptime-monitoring/)
- [Best Practices](https://swiftmade.co/blog/2026-01-05-sentry-error-reporting-best-practices)

---

**Dernière mise à jour:** 2026-03-09
**Statut:** Configuration en attente (nécessite accès interface Sentry)
