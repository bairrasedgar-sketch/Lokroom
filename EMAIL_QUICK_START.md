# Quick Start - Système d'Emails Transactionnels

## ⚡ Démarrage en 5 Minutes

### 1. Configuration Resend (2 minutes)

1. **Créer un compte** : [resend.com](https://resend.com) (gratuit)
2. **Obtenir une API Key** : Dashboard → API Keys → Create
3. **Ajouter dans .env** :

```bash
RESEND_API_KEY=re_votre_cle_ici
```

### 2. Tester (3 minutes)

```bash
# Démarrer le serveur
cd apps/web
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000/test-emails
```

**Sélectionner un type d'email → Entrer votre email → Envoyer**

---

## 📧 10 Types d'Emails Disponibles

| Type | Quand l'envoyer | Destinataire |
|------|-----------------|--------------|
| **booking-confirmation** | Après création de réservation | Voyageur |
| **booking-request** | Après création de réservation | Hôte |
| **booking-cancelled** | Après annulation | Voyageur/Hôte |
| **payment-receipt** | Après paiement réussi | Voyageur |
| **message-notification** | Après envoi de message | Destinataire |
| **review-request** | 24h après fin de séjour | Voyageur |
| **welcome-email** | Après inscription | Nouvel utilisateur |
| **password-reset** | Demande de reset | Utilisateur |
| **listing-approved** | Après approbation | Hôte |
| **payout-notification** | Après transfert | Hôte |

---

## 🚀 Utilisation dans le Code

### Méthode Simple (Recommandée)

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

### Exemple Complet

```typescript
// apps/web/src/app/api/bookings/create/route.ts

export async function POST(req: NextRequest) {
  // ... créer la réservation ...

  const booking = await prisma.booking.create({ ... });

  // 🔔 Envoyer les emails (asynchrone)
  import("@/lib/email/queue").then(({ queueEmail }) => {
    // Email au voyageur
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

    // Email à l'hôte
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
        bookingId: booking.id,
      },
    });
  });

  return NextResponse.json({ booking });
}
```

---

## 📁 Structure des Fichiers

```
apps/web/src/
├── lib/email/
│   ├── service.ts              # Service principal
│   ├── queue.ts                # Queue asynchrone
│   └── templates/
│       ├── base.ts             # Layout + helpers
│       ├── booking-confirmation.ts
│       ├── booking-request.ts
│       ├── booking-cancelled.ts
│       ├── payment-receipt.ts
│       ├── message-notification.ts
│       ├── review-request.ts
│       ├── welcome-email.ts
│       ├── password-reset.ts
│       ├── listing-approved.ts
│       ├── payout-notification.ts
│       └── index.ts
├── app/
│   ├── api/test-emails/route.ts    # API de test
│   └── test-emails/page.tsx        # Page de test
```

---

## 🎨 Templates Professionnels

Tous les templates incluent :
- ✅ Design responsive (mobile + desktop)
- ✅ Icônes visuelles (✓, ⚠️, 📅, 💬, ⭐)
- ✅ Sections colorées
- ✅ Boutons CTA stylés
- ✅ Footer avec liens légaux
- ✅ Version HTML + texte

---

## 🔧 Configuration Avancée

### Domaine Personnalisé

1. Resend Dashboard → Domains → Add Domain
2. Entrer votre domaine (ex: `lokroom.com`)
3. Configurer les DNS (DKIM, SPF, DMARC)
4. Attendre la vérification

### Préférences Utilisateur

```typescript
// Vérifier avant d'envoyer
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { notificationPreferences: true },
});

if (user.notificationPreferences?.emailEnabled !== false) {
  queueEmail({ ... });
}
```

---

## 🐛 Dépannage

### Email non reçu ?

1. ✅ Vérifier les spams
2. ✅ Vérifier `RESEND_API_KEY` dans .env
3. ✅ Tester avec `/test-emails`
4. ✅ Vérifier les logs console

### Erreur "RESEND_API_KEY non configurée" ?

```bash
# Vérifier .env
cat apps/web/.env | grep RESEND

# Ajouter si manquant
echo 'RESEND_API_KEY=re_votre_cle' >> apps/web/.env

# Redémarrer
npm run dev
```

---

## 📊 Limites Resend

| Plan | Emails/mois | Prix |
|------|-------------|------|
| **Gratuit** | 3 000 | $0 |
| **Pro** | 50 000 | $20/mois |
| **Business** | Illimité | Sur devis |

---

## 📚 Documentation Complète

- **EMAIL_NOTIFICATIONS_COMPLETE.md** - Guide d'implémentation complet
- **EMAIL_USAGE_GUIDE.md** - Exemples d'utilisation détaillés
- [Documentation Resend](https://resend.com/docs)

---

## ✅ Checklist

- [ ] `RESEND_API_KEY` configurée
- [ ] Testé avec `/test-emails`
- [ ] Email reçu dans la boîte de réception
- [ ] Intégré dans les APIs nécessaires
- [ ] Préférences utilisateur respectées

---

**Système prêt à l'emploi !** 🎉

Pour plus de détails, consultez `EMAIL_USAGE_GUIDE.md`
