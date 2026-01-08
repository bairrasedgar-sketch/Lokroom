// apps/web/src/components/ListingImagesManager.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

type Props = {
  listingId: string;
  initialImages: { id: string; url: string }[];
};

export default function ListingImagesManager({
  listingId,
  initialImages,
}: Props) {
  const [images, setImages] = useState(initialImages);
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(e.currentTarget.files || null);
  }

  async function uploadAll() {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) {
          toast.error(`"${f.name}" n'est pas une image`);
          continue;
        }
        if (f.size > 8 * 1024 * 1024) {
          toast.error(`"${f.name}" dépasse 8MB`);
          continue;
        }

        const presign = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            contentType: f.type,
            prefix: `listings/${listingId}`,
          }),
        }).then((r) => r.json());

        if (!presign?.uploadUrl || !presign?.publicUrl) {
          toast.error("Presign échoué");
          continue;
        }

        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": f.type },
          body: f,
        });
        if (!put.ok) {
          toast.error(`Upload échoué pour "${f.name}"`);
          continue;
        }

        const save = await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: presign.publicUrl }),
        }).then((r) => r.json());

        if (!save?.image?.id) {
          toast.error(`Enregistrement image échoué pour "${f.name}"`);
          continue;
        }

        setImages((prev) => [...prev, save.image]);
      }

      setFiles(null);
      toast.success("Images ajoutées ✅");
    } catch (e) {
      toast.error("Erreur pendant l'upload");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/listings/${listingId}/images?imageId=${encodeURIComponent(
          imageId
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("delete failed");
      setImages((prev) => prev.filter((i) => i.id !== imageId));
      toast.success("Image supprimée ✅");
    } catch {
      toast.error("Suppression impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" multiple onChange={onPick} />
        <button
          type="button"
          disabled={!files || busy}
          onClick={uploadAll}
          className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "En cours…" : "Ajouter les images"}
        </button>
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <li
              key={img.id}
              className="relative rounded border overflow-hidden"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={img.url}
                  alt={`Image de l'annonce`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="p-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  className="text-xs rounded border px-2 py-1"
                  disabled={busy}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
