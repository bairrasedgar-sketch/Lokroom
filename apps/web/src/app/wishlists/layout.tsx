import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Listes | Lok'Room",
  description: "Gerez vos listes de favoris sur Lok'Room. Organisez vos annonces preferees en categories personnalisees.",
};

export default function WishlistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
