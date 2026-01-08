import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
  title: "Tableau de bord | Admin Lok'Room",
  description: "Administration de la plateforme Lok'Room - Vue d'ensemble et gestion",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
