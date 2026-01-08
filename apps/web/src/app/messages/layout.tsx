import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | Lok'Room",
  description: "Consultez et gerez vos conversations avec les hotes et voyageurs sur Lok'Room.",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
