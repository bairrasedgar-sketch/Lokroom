"use client";

import { ReactNode } from "react";

/**
 * Visually hidden component for screen readers
 * WCAG 2.1 Level A - 1.1.1 Non-text Content
 */
interface VisuallyHiddenProps {
  children: ReactNode;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export default function VisuallyHidden({
  children,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}
