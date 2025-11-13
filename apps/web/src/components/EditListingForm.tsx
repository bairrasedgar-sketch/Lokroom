"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.coerce.number().nonnegative().refine(Number.isFinite, "Prix requis"),
  currency: z.enum(["EUR", "CAD"]),
  country: z.string().min(2),
  city: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditListingForm({
  listing,
}: {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;            // float
    currency: "EUR" | "CAD";
    country: string;
    city?: string;
  };
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency,
      country: listing.country,
      city: listing.city ?? "",
    },
  });

  // Auto-devise depuis le cookie si l’annonce a une devise vide (sécurité)
  useEffect(() => {
    if (!listing.currency) {
      const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
      const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
      setValue("currency", cookieCurrency, { shouldValidate: true });
    }
  }, [listing.currency, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          price: values.price,        // float
          currency: values.currency,  // EUR/CAD
          country: values.country,
          city: values.city?.trim() || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Erreur de mise à jour");
      }

      toast.success("Annonce mise à jour ✅");
      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

  useEffect(() => {
    // si les props changent (rare ici), on remet à jour le form
    reset({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency,
      country: listing.country,
      city: listing.city ?? "",
    });
  }, [listing, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Titre</label>
        <input className="w-full rounded border px-3 py-2" {...register("title")} />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea
          rows={5}
          className="w-full rounded border px-3 py-2"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Prix</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded border px-3 py-2"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Devise</label>
          <select className="w-full rounded border px-3 py-2" {...register("currency")}>
            <option value="EUR">EUR €</option>
            <option value="CAD">CAD $</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Pays</label>
          <input className="w-full rounded border px-3 py-2" {...register("country")} />
          {errors.country && <p className="text-sm text-red-600">{errors.country.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Ville (optionnel)</label>
          <input className="w-full rounded border px-3 py-2" {...register("city")} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {isSubmitting ? "Mise à jour…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
