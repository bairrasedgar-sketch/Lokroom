import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Paiements et Portefeuille | Lok'Room",
  description: "Gerez votre portefeuille, vos paiements et vos versements sur Lok'Room. Configurez vos methodes de paiement et suivez vos transactions.",
};

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
