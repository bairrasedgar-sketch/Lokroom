import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Annonces - Espace Hote | Lok'Room",
  description: "Gerez vos annonces sur Lok'Room. Creez, modifiez et suivez les performances de vos espaces a louer.",
};

export default function HostListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
