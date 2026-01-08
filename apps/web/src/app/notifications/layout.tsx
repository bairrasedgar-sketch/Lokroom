import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | Lok'Room",
  description: "Consultez vos notifications sur Lok'Room. Restez informe des nouvelles reservations, messages et mises a jour.",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
