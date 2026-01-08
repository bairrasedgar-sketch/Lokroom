import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservations - Espace Hote | Lok'Room",
  description: "Gerez vos reservations recues en tant qu'hote sur Lok'Room. Consultez les demandes, confirmez ou annulez les reservations.",
};

export default function HostBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
