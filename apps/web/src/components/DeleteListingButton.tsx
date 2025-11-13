"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteListingButton({ id }: { id: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Supprimer cette annonce ?")) return;

    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Suppression impossible");
      }

      toast.success("Annonce supprimée ✅");
      router.push("/listings");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Suppression impossible";
      toast.error(msg);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="rounded border px-3 py-2 text-sm"
    >
      Supprimer
    </button>
  );
}
