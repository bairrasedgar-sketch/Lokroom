import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics - Espace Hote | Lok'Room",
  description: "Analysez les performances de vos annonces sur Lok'Room. Statistiques de revenus, taux d'occupation et avis clients.",
};

export default function HostAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
