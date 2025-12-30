"use client";

import { useEffect, useRef, ReactNode, KeyboardEvent } from "react";

/**
 * Focus trap component for modals and dialogs
 * WCAG 2.1 Level A - 2.1.2 No Keyboard Trap
 */
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: string; // CSS selector for initial focus
}

export default function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the initial element or first focusable
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = getFocusableElements(container);

    if (initialFocus) {
      const initialElement = container.querySelector(initialFocus) as HTMLElement;
      if (initialElement) {
        initialElement.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      // Return focus when unmounting
      if (returnFocusOnDeactivate && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, initialFocus, returnFocusOnDeactivate]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!active || e.key !== "Tab") return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null // Element is visible
  );
}
