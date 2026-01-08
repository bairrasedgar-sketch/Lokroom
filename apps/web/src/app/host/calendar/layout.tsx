import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendrier - Espace Hote | Lok'Room",
  description: "Gerez le calendrier de vos annonces sur Lok'Room. Definissez vos disponibilites, prix et synchronisations.",
};

export default function HostCalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
