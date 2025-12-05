// apps/web/src/app/listings/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";
import EditListingClient from "./EditListingClient";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const origin = getOrigin();
  const res = await fetch(`${origin}/api/listings/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) return notFound();
  const { listing } = await res.json();

  const session = await getServerSession(authOptions);
  const isOwner =
    !!session?.user?.email && listing?.owner?.email === session.user.email;

  if (!isOwner) return notFound();

  return <EditListingClient listing={listing} />;
}
