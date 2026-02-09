# Push Notifications Implementation Guide

## Overview
This guide explains how to use the push notifications system implemented in Lok'Room.

## Architecture

### Components
1. **Service Worker** (`/public/sw.js`) - Handles push events and displays notifications
2. **API Routes**:
   - `/api/notifications/subscribe` - Register/unregister push subscriptions
   - `/api/notifications/send` - Send push notifications (admin/internal only)
   - `/api/notifications/preferences` - Manage notification preferences
3. **React Components**:
   - `NotificationPermission` - Banner to request notification permission
   - `NotificationSettings` - Full settings page for notification preferences
   - `ServiceWorkerRegistration` - Auto-registers the service worker

### Database Models
- `PushSubscription` - Stores user push subscriptions (endpoint, keys)
- `NotificationPreference` - Stores user notification preferences
- `Notification` - Stores notification history

## Setup

### 1. Environment Variables
Add these to your `.env` file:

```bash
# VAPID Keys (already generated)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIM3kGDbdlbZ16ps-9sDK1zDJV7RpGze3acxGbtOLXXD_8rarCxns4gvdxLQ7dFJZLJuUbLhyiKwHcF3_2TT5ac
VAPID_PRIVATE_KEY=SIYR8kNeeZOUZoRiXVwb371Oo-RbJ38tUt7FmaZ2VAc
VAPID_SUBJECT=mailto:support@lokroom.com

# Internal API key for server-side notifications
INTERNAL_API_KEY=your-secure-random-key-here
```

### 2. User Flow

#### First Visit
1. User visits the site
2. After 3 seconds, `NotificationPermission` banner appears
3. User clicks "Activer" → Browser shows permission prompt
4. If granted:
   - Service Worker registers
   - Push subscription created
   - Subscription sent to `/api/notifications/subscribe`
   - Banner disappears

#### Settings Page
Users can manage notifications at `/account/notifications` (or wherever you integrate `NotificationSettings`):
- Toggle push/email/SMS channels
- Configure notification types (bookings, messages, reviews, etc.)
- View active subscriptions

## Usage

### Sending Notifications from Code

#### Example 1: New Booking Request
```typescript
// In your booking creation code
import { sendPushNotificationToMultiple, createNotificationPayload } from '@/lib/notifications/push';

// After creating a booking
const hostSubscriptions = await prisma.pushSubscription.findMany({
  where: { userId: listing.ownerId },
});

if (hostSubscriptions.length > 0) {
  const payload = createNotificationPayload('BOOKING_REQUEST', {
    guestName: guest.name,
    bookingId: booking.id,
  });

  await sendPushNotificationToMultiple(
    hostSubscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    })),
    payload
  );
}
```

#### Example 2: Using the API Route
```typescript
// From server-side code (API route, webhook, etc.)
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-key': process.env.INTERNAL_API_KEY!,
  },
  body: JSON.stringify({
    userId: 'user_123',
    type: 'MESSAGE_NEW',
    data: {
      senderName: 'John Doe',
      messagePreview: 'Hello, is the space available?',
      conversationId: 'conv_456',
    },
  }),
});
```

### Supported Notification Types

The system supports these notification types (defined in `createNotificationPayload`):

1. **BOOKING_REQUEST** - New booking request received
2. **BOOKING_CONFIRMED** - Booking confirmed
3. **INSTANT_BOOK_CONFIRMED** - Instant booking made
4. **BOOKING_CANCELLED** - Booking cancelled
5. **BOOKING_REMINDER** - Upcoming booking reminder
6. **MESSAGE_NEW** - New message received
7. **REVIEW_RECEIVED** - New review received
8. **PAYOUT_SENT** - Payment received
9. **LISTING_APPROVED** - Listing approved by admin
10. **LISTING_REJECTED** - Listing rejected
11. **DISPUTE_OPENED** - Dispute opened
12. **IDENTITY_VERIFIED** - Identity verification successful
13. **SUPERHOST_EARNED** - Superhost status earned

Each type has:
- Custom title and body
- Appropriate icon
- Deep link URL
- Optional `requireInteraction` flag

### Adding New Notification Types

1. Add the type to the Prisma enum `NotificationType` (already exists)
2. Add a case in `createNotificationPayload()` in `/lib/notifications/push.ts`:

```typescript
case 'YOUR_NEW_TYPE':
  return {
    ...basePayload,
    title: 'Your Title',
    body: `${data.userName} did something`,
    data: { url: `/your-page/${data.id}` },
    tag: 'your-tag',
    requireInteraction: false,
  };
```

3. Add the preference toggle in `NotificationSettings.tsx` if needed

## Testing

### Test Push Notifications

1. **Local Testing**:
```bash
# Start the dev server
npm run dev

# Visit http://localhost:3000
# Click "Activer" on the notification banner
# Grant permission in browser
```

2. **Send Test Notification**:
```typescript
// Create a test API route or use the browser console
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-key': 'your-key',
  },
  body: JSON.stringify({
    userId: 'your-user-id',
    type: 'MESSAGE_NEW',
    data: {
      senderName: 'Test User',
      messagePreview: 'This is a test notification',
      conversationId: 'test',
    },
  }),
});
```

3. **Browser DevTools**:
   - Open DevTools → Application → Service Workers
   - Check if `sw.js` is registered
   - Application → Push Messaging → Check subscription

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Firefox | ✅ Full | Full support |
| Safari | ⚠️ Partial | iOS 16.4+, macOS 13+ only |
| Edge | ✅ Full | Chromium-based |
| Opera | ✅ Full | Chromium-based |

**Safari Notes**:
- Requires HTTPS (even on localhost)
- User must add site to Home Screen on iOS
- Limited notification actions support

## Integration Points

### Where to Send Notifications

1. **Booking Created** → Notify host
2. **Booking Confirmed** → Notify guest
3. **Booking Cancelled** → Notify both parties
4. **Message Sent** → Notify recipient
5. **Review Received** → Notify listing owner
6. **Payout Processed** → Notify host
7. **Listing Status Changed** → Notify owner
8. **Dispute Opened** → Notify both parties

### Example Integration in Booking Flow

```typescript
// apps/web/src/app/api/bookings/route.ts
import { sendPushNotificationToMultiple, createNotificationPayload } from '@/lib/notifications/push';

export async function POST(request: Request) {
  // ... create booking logic ...

  // Send notification to host
  const hostSubscriptions = await prisma.pushSubscription.findMany({
    where: { userId: listing.ownerId },
  });

  if (hostSubscriptions.length > 0) {
    const payload = createNotificationPayload('BOOKING_REQUEST', {
      guestName: session.user.name,
      bookingId: booking.id,
    });

    await sendPushNotificationToMultiple(
      hostSubscriptions.map(sub => ({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      })),
      payload
    );
  }

  // Also create in-app notification
  await prisma.notification.create({
    data: {
      id: `notif_${Date.now()}`,
      userId: listing.ownerId,
      type: 'BOOKING_REQUEST',
      title: 'Nouvelle demande de réservation',
      message: `${session.user.name} souhaite réserver votre espace`,
      actionUrl: `/host/bookings/${booking.id}`,
    },
  });

  return NextResponse.json({ success: true, booking });
}
```

## Security

1. **VAPID Keys**: Private key is server-side only, never exposed to client
2. **API Authentication**: `/api/notifications/send` requires admin role or internal API key
3. **User Verification**: All subscription endpoints verify user session
4. **Subscription Cleanup**: Invalid subscriptions are automatically removed
5. **Preference Checks**: Notifications respect user preferences before sending

## Performance

- **Batch Sending**: `sendPushNotificationToMultiple()` sends to multiple users efficiently
- **Invalid Subscription Cleanup**: Automatically removes expired/invalid subscriptions
- **Preference Caching**: User preferences are checked before sending
- **Service Worker Caching**: SW caches static assets for offline support

## Troubleshooting

### Notifications Not Appearing

1. **Check Permission**: DevTools → Console → `Notification.permission`
2. **Check Subscription**: DevTools → Application → Push Messaging
3. **Check Service Worker**: DevTools → Application → Service Workers
4. **Check Browser Support**: Some browsers require HTTPS
5. **Check User Preferences**: User may have disabled push notifications

### Service Worker Not Registering

1. **HTTPS Required**: Service Workers require HTTPS (except localhost)
2. **Check Console**: Look for registration errors
3. **Clear Cache**: DevTools → Application → Clear Storage
4. **Check Path**: SW must be at root (`/sw.js`)

### Push Not Received

1. **Check VAPID Keys**: Ensure keys are correctly configured
2. **Check Subscription**: Verify subscription exists in database
3. **Check Logs**: Server logs will show send errors
4. **Test with curl**: Send test notification via API

## Next Steps

1. **Add to Settings Page**: Integrate `NotificationSettings` component
2. **Integrate with Booking Flow**: Add notification sends to booking creation/updates
3. **Integrate with Messages**: Send notifications for new messages
4. **Add Email Fallback**: Send email if push fails
5. **Add Analytics**: Track notification open rates
6. **Add Rich Notifications**: Add action buttons (Accept/Decline booking)

## Files Created

- `/src/app/api/notifications/send/route.ts` - Send notifications API
- `/src/app/api/notifications/subscribe/route.ts` - Subscription management API
- `/src/app/api/notifications/preferences/route.ts` - Preferences management API
- `/src/lib/notifications/push.ts` - Push notification utilities
- `/src/components/notifications/NotificationPermission.tsx` - Permission banner
- `/src/components/notifications/NotificationSettings.tsx` - Settings page
- `/src/components/ServiceWorkerRegistration.tsx` - SW registration
- `/.env.push-notifications.example` - Environment variables example

## Files Modified

- `/src/app/layout.tsx` - Added ServiceWorkerRegistration and NotificationPermission
- `/public/sw.js` - Enhanced push notification handling
- `/next.config.mjs` - Added Service Worker headers
