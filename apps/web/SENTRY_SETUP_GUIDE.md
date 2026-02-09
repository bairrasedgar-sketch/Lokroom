# Sentry Error Monitoring - Configuration Guide

## Overview

Sentry has been successfully integrated into the Lok'Room application for comprehensive error monitoring and performance tracking.

## Files Created

### Configuration Files
- `sentry.client.config.ts` - Client-side Sentry configuration with Session Replay
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Next.js instrumentation hook for automatic error capture

### Utility Files
- `src/lib/sentry/utils.ts` - Helper functions for error tracking
- `src/lib/sentry/api-wrapper.ts` - API route error handling wrapper
- `src/components/SentryErrorBoundary.tsx` - React Error Boundary with Sentry integration

### Modified Files
- `next.config.mjs` - Added Sentry webpack plugin configuration
- `src/app/layout.tsx` - Added SentryErrorBoundary wrapper

## Environment Variables

Add these to your `.env` file (already in `.env.example`):

```bash
# Sentry DSN (get from sentry.io)
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Sentry Organization & Project
SENTRY_ORG="lokroom"
SENTRY_PROJECT="lokroom-web"

# Sentry Auth Token (for uploading source maps)
SENTRY_AUTH_TOKEN="sntrys_..."
```

## Getting Your Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account (or sign in)
2. Create a new project:
   - Choose "Next.js" as the platform
   - Name it "lokroom-web"
3. Copy the DSN from the project settings
4. Generate an Auth Token:
   - Go to Settings > Auth Tokens
   - Create a new token with `project:releases` and `org:read` scopes
   - Copy the token

## Features Implemented

### 1. Error Tracking
- Automatic capture of all unhandled errors
- Client-side and server-side error tracking
- API route error tracking
- React Error Boundary integration

### 2. Performance Monitoring
- Transaction tracking for API routes
- Performance metrics collection
- Automatic instrumentation

### 3. Session Replay
- Record user sessions when errors occur
- Privacy-focused (masks sensitive data)
- 10% sample rate for normal sessions
- 100% capture on errors

### 4. Context & Breadcrumbs
- User context tracking
- Custom tags and context
- Breadcrumb trail for debugging

### 5. Source Maps
- Automatic upload to Sentry
- Hidden from production bundles
- Better stack traces

## Usage Examples

### 1. Manual Error Capture

```typescript
import { captureException, captureMessage } from "@/lib/sentry/utils";

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    userId: user.id,
    action: "create_listing",
  });
}

// Or capture a message
captureMessage("User completed onboarding", "info", {
  userId: user.id,
});
```

### 2. Set User Context

```typescript
import { setUser, clearUser } from "@/lib/sentry/utils";

// After login
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// After logout
clearUser();
```

### 3. Add Breadcrumbs

```typescript
import { addBreadcrumb } from "@/lib/sentry/utils";

addBreadcrumb("User clicked create listing", "user-action", {
  listingType: "APARTMENT",
});
```

### 4. Wrap API Routes

```typescript
import { withSentryAPI } from "@/lib/sentry/api-wrapper";

export const GET = withSentryAPI(async (req: Request) => {
  // Your API logic
  const data = await fetchData();
  return Response.json(data);
});
```

### 5. Track Performance

```typescript
import { trackAPIPerformance } from "@/lib/sentry/api-wrapper";

const result = await trackAPIPerformance("fetch-listings", async () => {
  return await prisma.listing.findMany();
});
```

### 6. Custom Tags

```typescript
import { setTag, setContext } from "@/lib/sentry/utils";

setTag("feature", "booking");
setContext("booking", {
  listingId: listing.id,
  checkIn: checkIn.toISOString(),
  checkOut: checkOut.toISOString(),
});
```

## Configuration Options

### Client Configuration (`sentry.client.config.ts`)

- **Session Replay**: Enabled with privacy settings
- **Sample Rates**: 10% for sessions, 100% for errors
- **Ignored Errors**: Browser extensions, network errors, etc.
- **Environment Filtering**: No events sent in development

### Server Configuration (`sentry.server.config.ts`)

- **Trace Sample Rate**: 100% (adjust in production)
- **Ignored Errors**: Database connection errors, Prisma errors
- **Environment Filtering**: No events sent in development

### Next.js Configuration (`next.config.mjs`)

- **Source Maps**: Uploaded and hidden from production
- **Tunnel Route**: `/monitoring` to bypass ad-blockers
- **React Component Annotation**: Better component names in traces
- **Vercel Cron Monitors**: Automatic monitoring of cron jobs

## Testing Sentry

### 1. Create a Test Error Page

Create `src/app/sentry-test/page.tsx`:

```typescript
"use client";

export default function SentryTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>

      <button
        onClick={() => {
          throw new Error("Test error from client");
        }}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Trigger Client Error
      </button>
    </div>
  );
}
```

### 2. Test API Error

Create `src/app/api/sentry-test/route.ts`:

```typescript
import { withSentryAPI } from "@/lib/sentry/api-wrapper";

export const GET = withSentryAPI(async () => {
  throw new Error("Test error from API");
});
```

### 3. Visit the Test Pages

- Client error: `http://localhost:3000/sentry-test`
- API error: `http://localhost:3000/api/sentry-test`

**Note**: Errors won't be sent to Sentry in development mode. Set `NODE_ENV=production` to test.

## Dashboard & Alerts

### Sentry Dashboard Features

1. **Issues**: View all errors with stack traces
2. **Performance**: Monitor transaction performance
3. **Releases**: Track errors by deployment
4. **Session Replay**: Watch user sessions
5. **Alerts**: Configure notifications for critical errors

### Recommended Alerts

1. **High Error Rate**: Alert when error rate > 1%
2. **New Issues**: Notify on first occurrence
3. **Regression**: Alert when resolved issues reappear
4. **Performance**: Alert on slow transactions (> 3s)

## Best Practices

1. **Don't Log Sensitive Data**: Sentry automatically masks some data, but be careful
2. **Use Breadcrumbs**: Add context before errors occur
3. **Set User Context**: Helps identify affected users
4. **Tag Errors**: Use tags for filtering (feature, severity, etc.)
5. **Monitor Performance**: Track slow API routes
6. **Review Regularly**: Check Sentry dashboard weekly

## Production Checklist

- [ ] Set `SENTRY_DSN` in production environment
- [ ] Set `SENTRY_AUTH_TOKEN` for source map uploads
- [ ] Configure alert rules in Sentry dashboard
- [ ] Test error tracking in staging environment
- [ ] Set up Slack/email notifications
- [ ] Review and adjust sample rates
- [ ] Configure release tracking with Git commits

## Troubleshooting

### Source Maps Not Uploading

- Check `SENTRY_AUTH_TOKEN` is set
- Verify `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry project
- Check build logs for upload errors

### Errors Not Appearing

- Verify `NEXT_PUBLIC_SENTRY_DSN` is set (client-side)
- Check `NODE_ENV` is not "development"
- Look for console errors in browser

### Too Many Events

- Adjust sample rates in config files
- Add more ignored errors
- Use `beforeSend` to filter events

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Summary

Sentry is now fully configured and ready to capture errors in production. The integration includes:

- Automatic error tracking (client & server)
- Performance monitoring
- Session replay
- Source map uploads
- Custom error boundaries
- API route wrappers
- Utility functions for manual tracking

All errors will be automatically sent to Sentry in production, with detailed context and stack traces.
