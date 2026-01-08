import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Favoris | Lok'Room",
  description: "Retrouvez vos annonces favorites sur Lok'Room. Sauvegardez et organisez les logements qui vous interessent.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
