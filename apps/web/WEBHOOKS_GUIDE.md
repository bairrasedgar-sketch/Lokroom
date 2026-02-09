# Lok'Room Webhooks - Guide d'intégration

## Vue d'ensemble

Les webhooks Lok'Room permettent aux développeurs tiers de recevoir des notifications en temps réel sur les événements de la plateforme. Lorsqu'un événement se produit (nouvelle réservation, paiement, etc.), Lok'Room envoie une requête HTTP POST à l'URL que vous avez configurée.

## Événements disponibles

### Réservations
- `booking.created` - Une nouvelle réservation a été créée
- `booking.confirmed` - Une réservation a été confirmée
- `booking.cancelled` - Une réservation a été annulée
- `booking.completed` - Une réservation est terminée

### Annonces
- `listing.created` - Une nouvelle annonce a été créée
- `listing.updated` - Une annonce a été mise à jour
- `listing.deleted` - Une annonce a été supprimée

### Avis
- `review.created` - Un nouvel avis a été publié

### Messages
- `message.received` - Un nouveau message a été reçu

### Paiements
- `payment.succeeded` - Un paiement a réussi
- `payment.failed` - Un paiement a échoué

## Configuration

### 1. Créer un webhook

```bash
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "url": "https://votre-domaine.com/webhooks/lokroom",
  "events": [
    "booking.created",
    "booking.confirmed",
    "payment.succeeded"
  ]
}
```

**Réponse:**
```json
{
  "id": "webhook_abc123",
  "url": "https://votre-domaine.com/webhooks/lokroom",
  "events": ["booking.created", "booking.confirmed", "payment.succeeded"],
  "secret": "whsec_1234567890abcdef...",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Important:** Conservez le `secret` en lieu sûr. Il est utilisé pour vérifier l'authenticité des webhooks.

### 2. Limites

- Maximum **100 webhooks** par utilisateur
- Maximum **20 événements** par webhook
- Timeout de **10 secondes** par requête
- **3 tentatives** de livraison (immédiate, +1min, +5min)

## Format du payload

Tous les webhooks suivent le même format:

```json
{
  "event": "booking.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "booking_123",
    "listingId": "listing_456",
    "guestId": "user_789",
    "startDate": "2024-02-01T14:00:00Z",
    "endDate": "2024-02-03T11:00:00Z",
    "totalPrice": 250.00,
    "currency": "EUR",
    "status": "PENDING",
    "pricingMode": "DAILY",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Vérification de la signature

Chaque webhook inclut un header `X-Lok-Signature` contenant une signature HMAC-SHA256 du payload. **Vous devez toujours vérifier cette signature** pour vous assurer que le webhook provient bien de Lok'Room.

### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Dans votre endpoint
app.post('/webhooks/lokroom', (req, res) => {
  const signature = req.headers['x-lok-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.LOKROOM_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Traiter le webhook
  const { event, data } = req.body;

  switch (event) {
    case 'booking.created':
      handleBookingCreated(data);
      break;
    case 'payment.succeeded':
      handlePaymentSucceeded(data);
      break;
    // ...
  }

  res.status(200).send('OK');
});
```

### Python

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# Dans votre endpoint Flask
@app.route('/webhooks/lokroom', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Lok-Signature')
    payload = request.get_data(as_text=True)

    if not verify_webhook_signature(payload, signature, os.environ['LOKROOM_WEBHOOK_SECRET']):
        return 'Invalid signature', 401

    data = request.json
    event = data['event']

    if event == 'booking.created':
        handle_booking_created(data['data'])
    elif event == 'payment.succeeded':
        handle_payment_succeeded(data['data'])

    return 'OK', 200
```

### PHP

```php
<?php

function verifyWebhookSignature($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', $payload, $secret);
    return hash_equals($signature, $expectedSignature);
}

// Dans votre endpoint
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_LOK_SIGNATURE'];
$secret = getenv('LOKROOM_WEBHOOK_SECRET');

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    die('Invalid signature');
}

$data = json_decode($payload, true);
$event = $data['event'];

switch ($event) {
    case 'booking.created':
        handleBookingCreated($data['data']);
        break;
    case 'payment.succeeded':
        handlePaymentSucceeded($data['data']);
        break;
}

http_response_code(200);
echo 'OK';
```

## Headers des webhooks

Chaque requête webhook inclut les headers suivants:

```
Content-Type: application/json
X-Lok-Signature: abc123def456...
X-Lok-Event: booking.created
X-Lok-Timestamp: 2024-01-15T10:30:00Z
X-Lok-Attempt: 1
User-Agent: Lokroom-Webhooks/1.0
```

## Bonnes pratiques

### 1. Répondre rapidement

Votre endpoint doit répondre avec un status `200` dans les **10 secondes**. Si le traitement est long, utilisez une queue:

```javascript
app.post('/webhooks/lokroom', async (req, res) => {
  // Vérifier la signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Ajouter à une queue pour traitement asynchrone
  await queue.add('webhook', req.body);

  // Répondre immédiatement
  res.status(200).send('OK');
});
```

### 2. Idempotence

Les webhooks peuvent être envoyés plusieurs fois (retry). Utilisez l'ID de l'événement pour éviter les doublons:

```javascript
async function handleBookingCreated(data) {
  const exists = await db.webhookEvents.findOne({ id: data.id });
  if (exists) {
    console.log('Event already processed');
    return;
  }

  // Traiter l'événement
  await processBooking(data);

  // Marquer comme traité
  await db.webhookEvents.create({ id: data.id, processedAt: new Date() });
}
```

### 3. Gestion des erreurs

Retournez un status `200` uniquement si le webhook a été traité avec succès. En cas d'erreur, retournez `500` pour déclencher un retry:

```javascript
app.post('/webhooks/lokroom', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).send('Internal error');
  }
});
```

### 4. Sécurité

- **Toujours vérifier la signature** HMAC
- Utiliser **HTTPS** en production
- Ne jamais exposer votre `secret`
- Valider le format du payload
- Rate limiting sur votre endpoint

## Gestion des webhooks

### Lister vos webhooks

```bash
GET /api/webhooks
```

### Voir un webhook

```bash
GET /api/webhooks/{id}
```

### Modifier un webhook

```bash
PUT /api/webhooks/{id}
Content-Type: application/json

{
  "events": ["booking.created", "booking.cancelled"],
  "active": true
}
```

### Supprimer un webhook

```bash
DELETE /api/webhooks/{id}
```

### Régénérer le secret

```bash
POST /api/webhooks/{id}/regenerate-secret
```

### Historique des livraisons

```bash
GET /api/webhooks/{id}/deliveries?page=1&pageSize=20&status=failed
```

**Réponse:**
```json
{
  "deliveries": [
    {
      "id": "delivery_123",
      "event": "booking.created",
      "status": "success",
      "attempts": 1,
      "lastAttempt": "2024-01-15T10:30:05Z",
      "response": { "status": "ok" },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "statistics": {
    "total": 150,
    "success": 145,
    "failed": 3,
    "pending": 2
  },
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "pageCount": 8
}
```

### Tester un webhook

```bash
POST /api/webhooks/{id}/test
Content-Type: application/json

{
  "event": "booking.created"
}
```

## Exemples de payloads

### booking.created

```json
{
  "event": "booking.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "booking_abc123",
    "listingId": "listing_def456",
    "guestId": "user_ghi789",
    "startDate": "2024-02-01T14:00:00Z",
    "endDate": "2024-02-03T11:00:00Z",
    "totalPrice": 250.00,
    "currency": "EUR",
    "status": "PENDING",
    "pricingMode": "DAILY",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### payment.succeeded

```json
{
  "event": "payment.succeeded",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "bookingId": "booking_abc123",
    "amount": 25000,
    "currency": "EUR",
    "paymentIntentId": "pi_1234567890",
    "status": "succeeded",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### listing.created

```json
{
  "event": "listing.created",
  "timestamp": "2024-01-15T09:00:00Z",
  "data": {
    "id": "listing_xyz789",
    "title": "Appartement cosy à Paris",
    "description": "Bel appartement...",
    "price": 80.00,
    "currency": "EUR",
    "country": "FR",
    "city": "Paris",
    "type": "APARTMENT",
    "ownerId": "user_abc123",
    "createdAt": "2024-01-15T09:00:00Z"
  }
}
```

### review.created

```json
{
  "event": "review.created",
  "timestamp": "2024-01-15T16:00:00Z",
  "data": {
    "id": "review_123",
    "bookingId": "booking_abc123",
    "listingId": "listing_def456",
    "authorId": "user_ghi789",
    "targetUserId": "user_abc123",
    "rating": 5,
    "comment": "Excellent séjour !",
    "type": "GUEST_TO_HOST",
    "createdAt": "2024-01-15T16:00:00Z"
  }
}
```

## Dépannage

### Le webhook n'est pas reçu

1. Vérifiez que votre URL est accessible publiquement
2. Vérifiez que votre serveur répond en moins de 10 secondes
3. Consultez l'historique des livraisons pour voir les erreurs
4. Testez avec l'endpoint `/api/webhooks/{id}/test`

### Erreur de signature

1. Vérifiez que vous utilisez le bon `secret`
2. Vérifiez que vous signez le payload brut (avant parsing JSON)
3. Utilisez `crypto.timingSafeEqual()` pour comparer les signatures

### Webhooks en double

C'est normal en cas de retry. Implémentez l'idempotence avec l'ID de l'événement.

## Support

Pour toute question sur les webhooks:
- Documentation: https://docs.lokroom.com/webhooks
- Support: support@lokroom.com
- Status: https://status.lokroom.com
