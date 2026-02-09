'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, trackPageView } from '@/lib/analytics/ga4';

/**
 * Composant Analytics pour initialiser et tracker les page views
 * À placer dans le layout principal
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialiser GA4 au montage du composant
  useEffect(() => {
    initGA();
  }, []);

  // Tracker les changements de page
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}
