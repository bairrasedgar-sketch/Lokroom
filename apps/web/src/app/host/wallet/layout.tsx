import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portefeuille - Espace Hote | Lok'Room",
  description: "Consultez votre solde et l'historique de vos transactions sur Lok'Room. Gerez vos virements bancaires.",
};

export default function HostWalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
