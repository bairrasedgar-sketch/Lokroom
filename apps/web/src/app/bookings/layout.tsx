import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Reservations | Lok'Room",
  description: "Gerez vos reservations sur Lok'Room. Consultez vos reservations en cours, passees et a venir.",
};

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
