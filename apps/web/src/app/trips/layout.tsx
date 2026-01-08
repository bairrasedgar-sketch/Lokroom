import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Voyages | Lok'Room",
  description: "Consultez vos voyages passes et a venir sur Lok'Room. Gerez vos reservations et planifiez vos prochaines aventures.",
};

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
