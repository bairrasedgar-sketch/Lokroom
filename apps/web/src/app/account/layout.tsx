"use client";

import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  // On ne rajoute PAS de sidebar ici.
  // C'est ton AccountSettingsPage (account/page.tsx) qui gère
  // tout l'affichage : menu à gauche, contenu, mobile, etc.
  return <>{children}</>;
}
