/**
 * Accessibility utility hooks
 * WCAG 2.1 compliance helpers
 */

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Hook to handle reduced motion preference
 * WCAG 2.1 Level AAA - 2.3.3 Animation from Interactions
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for keyboard navigation on lists
 * WCAG 2.1 Level A - 2.1.1 Keyboard
 */
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void,
  options: {
    orientation?: "horizontal" | "vertical";
    loop?: boolean;
    initialIndex?: number;
  } = {}
) {
  const { orientation = "vertical", loop = true, initialIndex = -1 } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          setActiveIndex((current) => {
            const next = current + 1;
            if (next >= items.length) {
              return loop ? 0 : current;
            }
            return next;
          });
          break;

        case prevKey:
          e.preventDefault();
          setActiveIndex((current) => {
            const prev = current - 1;
            if (prev < 0) {
              return loop ? items.length - 1 : 0;
            }
            return prev;
          });
          break;

        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;

        case "End":
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < items.length) {
            onSelect(items[activeIndex], activeIndex);
          }
          break;
      }
    },
    [items, activeIndex, onSelect, orientation, loop]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: activeIndex === index ? 0 : -1,
      "aria-selected": activeIndex === index,
      onFocus: () => setActiveIndex(index),
    }),
  };
}

/**
 * Hook to announce messages to screen readers
 * WCAG 2.1 Level A - 4.1.3 Status Messages
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create the announcement element if it doesn't exist
    let element = document.getElementById("sr-announcer") as HTMLDivElement;

    if (!element) {
      element = document.createElement("div");
      element.id = "sr-announcer";
      element.setAttribute("role", "status");
      element.setAttribute("aria-live", "polite");
      element.setAttribute("aria-atomic", "true");
      element.className = "sr-only";
      document.body.appendChild(element);
    }

    announceRef.current = element;

    return () => {
      // Don't remove on unmount - other components might use it
    };
  }, []);

  const announce = useCallback((message: string, politeness: "polite" | "assertive" = "polite") => {
    if (announceRef.current) {
      announceRef.current.setAttribute("aria-live", politeness);
      // Clear and set message to ensure it's announced
      announceRef.current.textContent = "";
      requestAnimationFrame(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      });
    }
  }, []);

  return announce;
}

/**
 * Hook to manage focus return after modal/dialog closes
 * WCAG 2.1 Level A - 2.4.3 Focus Order
 */
export function useFocusReturn() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Hook to detect high contrast mode
 * WCAG 2.1 Level AAA - 1.4.6 Contrast (Enhanced)
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Check for Windows High Contrast Mode
    const mediaQuery = window.matchMedia("(forced-colors: active)");
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return highContrast;
}

/**
 * Hook to manage ID generation for accessible labels
 */
export function useAccessibleId(prefix: string = "a11y"): string {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}
