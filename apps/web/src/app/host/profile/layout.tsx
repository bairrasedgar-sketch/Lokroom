import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Hote - Espace Hote | Lok'Room",
  description: "Gerez votre profil d'hote sur Lok'Room. Personnalisez votre bio, langues parlees et informations de contact.",
};

export default function HostProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
