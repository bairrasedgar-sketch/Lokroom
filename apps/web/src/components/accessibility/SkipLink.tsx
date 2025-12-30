"use client";

/**
 * Skip to main content link for keyboard navigation
 * WCAG 2.1 Level A - 2.4.1 Bypass Blocks
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      Aller au contenu principal
    </a>
  );
}
