// apps/web/src/components/listings/ListingViewTracker.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTracking } from "@/hooks/useTracking";

interface ListingViewTrackerProps {
  listingId: string;
}

/**
 * Component to track listing views for recommendations
 * Should be placed in the listing detail page
 */
export function ListingViewTracker({ listingId }: ListingViewTrackerProps) {
  const { data: session } = useSession();
  const { trackListingView } = useTracking();

  useEffect(() => {
    // Only track if user is logged in
    if (session?.user) {
      trackListingView(listingId);
    }
  }, [listingId, session, trackListingView]);

  return null; // This component doesn't render anything
}
