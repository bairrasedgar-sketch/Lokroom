# Guide d'Utilisation - Système d'Emails Transactionnels

## 🚀 Démarrage Rapide

### 1. Configuration (5 minutes)

#### Étape 1 : Créer un compte Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit (3000 emails/mois)
3. Vérifier votre email

#### Étape 2 : Obtenir une API Key

1. Dans le dashboard Resend, aller dans **API Keys**
2. Cliquer sur **Create API Key**
3. Copier la clé (commence par `re_`)

#### Étape 3 : Configurer .env

Ajouter dans `apps/web/.env` :

```bash
RESEND_API_KEY=re_votre_cle_ici
EMAIL_FROM="Lok'Room <noreply@lokroom.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Étape 4 : Tester

```bash
cd apps/web
npm run dev
```

Ouvrir : `http://localhost:3000/test-emails`

---

## 📧 Utilisation dans le Code

### Méthode 1 : Via la Queue (Recommandé)

**Avantages** : Asynchrone, ne bloque pas la requête, retry automatique

```typescript
import { queueEmail } from "@/lib/email/queue";

// Dans votre API route
queueEmail({
  type: "booking-confirmation",
  to: "user@example.com",
  data: {
    guestName: "Jean Dupont",
    listingTitle: "Appartement Paris",
    hostName: "Marie",
    checkIn: new Date("2026-03-15"),
    checkOut: new Date("2026-03-18"),
    totalPrice: 450,
    currency: "EUR",
    bookingId: "booking-123",
  },
});
```

### Méthode 2 : Via le Service (Direct)

**Avantages** : Contrôle total, gestion des erreurs

```typescript
import { emailService } from "@/lib/email/service";

// Dans votre API route
const result = await emailService.sendBookingConfirmation(
  "user@example.com",
  {
    guestName: "Jean Dupont",
    listingTitle: "Appartement Paris",
    hostName: "Marie",
    checkIn: new Date("2026-03-15"),
    checkOut: new Date("2026-03-18"),
    totalPrice: 450,
    currency: "EUR",
    bookingId: "booking-123",
  }
);

if (!result.success) {
  console.error("Erreur envoi email:", result.error);
}
```

---

## 📝 Exemples par Type d'Email

### 1. Confirmation de Réservation (Voyageur)

```typescript
import { queueEmail } from "@/lib/email/queue";

queueEmail({
  type: "booking-confirmation",
  to: guest.email,
  data: {
    guestName: guest.name,
    listingTitle: listing.title,
    hostName: host.name,
    checkIn: booking.startDate,
    checkOut: booking.endDate,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    bookingId: booking.id,
  },
});
```

### 2. Nouvelle Réservation (Hôte)

```typescript
queueEmail({
  type: "booking-request",
  to: host.email,
  data: {
    hostName: host.name,
    guestName: guest.name,
    listingTitle: listing.title,
    checkIn: booking.startDate,
    checkOut: booking.endDate,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    message: "Message optionnel du voyageur",
    bookingId: booking.id,
  },
});
```

### 3. Annulation de Réservation

```typescript
queueEmail({
  type: "booking-cancelled",
  to: user.email,
  data: {
    recipientName: user.name,
    listingTitle: listing.title,
    checkIn: booking.startDate,
    checkOut: booking.endDate,
    refundAmount: 450, // Optionnel
    currency: "EUR",   // Optionnel
    cancelledBy: "guest", // ou "host"
    bookingId: booking.id,
  },
});
```

### 4. Reçu de Paiement

```typescript
queueEmail({
  type: "payment-receipt",
  to: user.email,
  data: {
    userName: user.name,
    listingTitle: listing.title,
    amount: payment.amount,
    currency: payment.currency,
    paymentDate: new Date(),
    paymentId: payment.stripePaymentId,
    bookingId: booking.id,
  },
});
```

### 5. Notification de Message

```typescript
queueEmail({
  type: "message-notification",
  to: recipient.email,
  data: {
    recipientName: recipient.name,
    senderName: sender.name,
    messagePreview: message.content.substring(0, 100),
    conversationId: conversation.id,
  },
});
```

### 6. Demande d'Avis

```typescript
queueEmail({
  type: "review-request",
  to: guest.email,
  data: {
    guestName: guest.name,
    listingTitle: listing.title,
    hostName: host.name,
    bookingId: booking.id,
  },
});
```

### 7. Email de Bienvenue

```typescript
queueEmail({
  type: "welcome-email",
  to: newUser.email,
  data: {
    userName: newUser.name,
  },
});
```

### 8. Réinitialisation de Mot de Passe

```typescript
queueEmail({
  type: "password-reset",
  to: user.email,
  data: {
    userName: user.name,
    resetToken: "token-securise-123",
  },
});
```

### 9. Annonce Approuvée

```typescript
queueEmail({
  type: "listing-approved",
  to: host.email,
  data: {
    hostName: host.name,
    listingTitle: listing.title,
    listingId: listing.id,
  },
});
```

### 10. Notification de Paiement (Hôte)

```typescript
queueEmail({
  type: "payout-notification",
  to: host.email,
  data: {
    hostName: host.name,
    amount: payout.amount,
    currency: payout.currency,
    payoutDate: new Date(),
    bookingId: booking.id,
    listingTitle: listing.title,
  },
});
```

---

## 🎯 Intégration dans les APIs Existantes

### Exemple : API de Création de Réservation

```typescript
// apps/web/src/app/api/bookings/create/route.ts

export async function POST(req: NextRequest) {
  // ... logique de création de réservation ...

  const booking = await prisma.booking.create({ ... });

  // 🔔 Envoyer les emails (asynchrone)
  const [guest, host] = await Promise.all([
    prisma.user.findUnique({ where: { id: guestId } }),
    prisma.user.findUnique({ where: { id: hostId } }),
  ]);

  if (guest?.email && host?.email) {
    import("@/lib/email/queue").then(({ queueEmail }) => {
      // Email au voyageur
      queueEmail({
        type: "booking-confirmation",
        to: guest.email,
        data: { ... },
      });

      // Email à l'hôte
      queueEmail({
        type: "booking-request",
        to: host.email,
        data: { ... },
      });
    });
  }

  return NextResponse.json({ booking });
}
```

### Exemple : API d'Envoi de Message

```typescript
// apps/web/src/app/api/messages/send/route.ts

export async function POST(req: NextRequest) {
  // ... logique d'envoi de message ...

  const message = await prisma.message.create({ ... });

  // 🔔 Notifier le destinataire par email
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, name: true, notificationPreferences: true },
  });

  if (recipient?.email && recipient.notificationPreferences?.emailNotifications !== false) {
    import("@/lib/email/queue").then(({ queueEmail }) => {
      queueEmail({
        type: "message-notification",
        to: recipient.email,
        data: {
          recipientName: recipient.name,
          senderName: sender.name,
          messagePreview: message.content.substring(0, 100),
          conversationId: conversation.id,
        },
      });
    });
  }

  return NextResponse.json({ message });
}
```

---

## 🔧 Configuration Avancée

### Personnaliser l'Expéditeur

```typescript
// Dans .env
EMAIL_FROM="Lok'Room <noreply@lokroom.com>"

// Ou dans le code
const customService = new EmailService("Custom Name <custom@domain.com>");
```

### Ajouter un Domaine Personnalisé

1. Dans Resend Dashboard, aller dans **Domains**
2. Cliquer sur **Add Domain**
3. Entrer votre domaine (ex: `lokroom.com`)
4. Configurer les DNS records (DKIM, SPF, DMARC)
5. Attendre la vérification (quelques minutes)

### Gérer les Préférences Utilisateur

```typescript
// Vérifier avant d'envoyer
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { notificationPreferences: true },
});

if (user.notificationPreferences?.emailNotifications !== false) {
  queueEmail({ ... });
}
```

---

## 🐛 Résolution de Problèmes

### Problème : Email non reçu

**Solutions** :
1. Vérifier les spams
2. Vérifier que `RESEND_API_KEY` est configurée
3. Vérifier les logs : `console.log` dans `queue.ts`
4. Tester avec `/test-emails`

### Problème : Erreur "RESEND_API_KEY non configurée"

**Solution** :
```bash
# Vérifier .env
cat apps/web/.env | grep RESEND

# Ajouter si manquant
echo 'RESEND_API_KEY=re_votre_cle' >> apps/web/.env

# Redémarrer le serveur
npm run dev
```

### Problème : Template cassé

**Solution** :
1. Vérifier les données passées au template
2. Tester avec `/test-emails` pour voir le rendu
3. Vérifier les logs d'erreur

### Problème : Emails en spam

**Solutions** :
1. Configurer SPF/DKIM/DMARC sur Resend
2. Utiliser un domaine vérifié
3. Éviter les mots spam ("gratuit", "urgent", etc.)
4. Ajouter un lien de désinscription

---

## 📊 Monitoring

### Logs de la Queue

```typescript
// Dans queue.ts
console.log(`[EmailQueue] Email envoyé: ${job.type} to ${job.to}`);
console.error(`[EmailQueue] Erreur:`, error);
console.log(`[EmailQueue] Retry ${job.retries}/${MAX_RETRIES}`);
```

### Tracker les Emails Envoyés

```typescript
// Créer un modèle EmailLog dans Prisma
model EmailLog {
  id        String   @id @default(cuid())
  type      String
  to        String
  status    String   // "sent", "failed", "retry"
  messageId String?
  error     String?
  createdAt DateTime @default(now())
}

// Logger après envoi
await prisma.emailLog.create({
  data: {
    type: job.type,
    to: job.to,
    status: result.success ? "sent" : "failed",
    messageId: result.messageId,
    error: result.error,
  },
});
```

---

## 🚀 Déploiement en Production

### 1. Variables d'Environnement

Sur Vercel/Netlify/Railway :

```bash
RESEND_API_KEY=re_production_key
EMAIL_FROM="Lok'Room <noreply@lokroom.com>"
NEXT_PUBLIC_APP_URL=https://lokroom.com
```

### 2. Limites Resend

- **Gratuit** : 3000 emails/mois
- **Pro** : 50 000 emails/mois ($20/mois)
- **Business** : Illimité

### 3. Queue Redis (Recommandé)

Pour la production, utiliser Redis au lieu de la queue en mémoire :

```bash
npm install bullmq ioredis
```

```typescript
// queue.ts (version Redis)
import { Queue } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export async function queueEmail(job: EmailJob) {
  await emailQueue.add('send-email', job);
}
```

---

## ✅ Checklist de Production

- [ ] `RESEND_API_KEY` configurée
- [ ] Domaine vérifié sur Resend
- [ ] DNS configurés (SPF/DKIM/DMARC)
- [ ] Tous les emails testés
- [ ] Préférences utilisateur respectées
- [ ] Logs de monitoring en place
- [ ] Rate limiting configuré
- [ ] Queue Redis (optionnel)
- [ ] Backup des emails envoyés
- [ ] Alertes en cas d'erreur

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Templates HTML Email](https://www.goodemailcode.com/)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)
- [SPF/DKIM/DMARC Guide](https://www.cloudflare.com/learning/email-security/)

---

**Système prêt à l'emploi !** 🎉
