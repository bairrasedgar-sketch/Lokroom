import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mon Compte | Lok'Room",
  description: "Gerez votre compte Lok'Room. Modifiez vos informations personnelles, parametres de securite et preferences.",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  // On ne rajoute PAS de sidebar ici.
  // C'est ton AccountSettingsPage (account/page.tsx) qui gère
  // tout l'affichage : menu à gauche, contenu, mobile, etc.
  return <>{children}</>;
}
