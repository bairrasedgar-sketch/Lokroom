"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";

const schema = z.object({
title: z.string().min(3).max(120),
description: z.string().min(10).max(2000),
price: z.coerce
.number()
.min(2, "Prix minimum 2 (EUR ou CAD)")
.refine(Number.isFinite, "Prix requis"),
currency: z.enum(["EUR", "CAD"]),
// ⬇️ Pays limité à France / Canada
country: z.enum(["France", "Canada"]),
// ⬇️ Ville obligatoire
city: z.string().min(1, "Ville requise"),
// ⬇️ Rue / adresse exacte obligatoire
addressFull: z.string().min(5, "Adresse exacte requise"),
});

type FormValues = z.infer<typeof schema>;

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
| string
| undefined;

// ---------- Autocomplete des villes FR/CA ----------
type CityAutocompleteProps = {
value: string;
onChange: (value: string) => void;
mapsReady: boolean;
};

function CityAutocomplete({
value,
onChange,
mapsReady,
}: CityAutocompleteProps) {
const [input, setInput] = useState(value || "");
const [suggestions, setSuggestions] = useState<string[]>([]);
const [loading, setLoading] = useState(false);

// sync externe → interne
useEffect(() => {
setInput(value || "");
}, [value]);

useEffect(() => {
if (!mapsReady) return;
if (!input.trim()) {
setSuggestions([]);
return;
}

type GoogleMaps = {
  maps?: {
    places?: {
      AutocompleteService?: new () => {
        getPlacePredictions: (
          request: { input: string; types: string[]; componentRestrictions: { country: string[] } },
          callback: (predictions: { description: string }[] | null, status: string) => void
        ) => void;
      };
      PlacesServiceStatus?: { OK: string };
    };
  };
};
const g = (window as { google?: GoogleMaps }).google;
const svc = g?.maps?.places?.AutocompleteService
? new g.maps.places.AutocompleteService()
: null;
if (!svc) return;

let active = true;
setLoading(true);

svc.getPlacePredictions(
{
input,
types: ["(cities)"],
// On limite aux villes France + Canada
componentRestrictions: { country: ["fr", "ca"] },
},
(preds: { description: string }[] | null, status: string) => {
if (!active) return;
setLoading(false);

if (
!preds ||
status !== g?.maps?.places?.PlacesServiceStatus?.OK
) {
setSuggestions([]);
return;
}

setSuggestions(preds.slice(0, 6).map((p) => p.description));
}
);

return () => {
active = false;
};
}, [input, mapsReady]);

return (
<div className="relative">
<input
className="w-full rounded-md border px-3 py-2"
placeholder="Ville (France ou Canada)"
value={input}
onChange={(e) => {
setInput(e.target.value);
onChange(e.target.value);
}}
/>

{loading && (
<div className="pointer-events-none absolute right-3 top-2 text-xs text-gray-400">
…
</div>
)}

{suggestions.length > 0 && (
<ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-white text-sm shadow-lg">
{suggestions.map((s) => (
<li
key={s}
className="cursor-pointer px-3 py-1 hover:bg-gray-100"
onMouseDown={(e) => {
e.preventDefault(); // évite la perte de focus avant le click
onChange(s);
setInput(s);
setSuggestions([]);
}}
>
{s}
</li>
))}
</ul>
)}
</div>
);
}

export default function EditListingForm({
listing,
}: {
listing: {
id: string;
title: string;
description: string;
price: number; // float
currency: "EUR" | "CAD";
country: string;
city?: string | null;
addressFull?: string | null;
};
}) {
const router = useRouter();
const [mapsReady, setMapsReady] = useState(false);

// Si le script Google Maps est déjà chargé
useEffect(() => {
if (typeof window === "undefined") return;
const g = (window as { google?: { maps?: { places?: unknown } } }).google;
if (g?.maps?.places) {
setMapsReady(true);
}
}, []);

const {
register,
handleSubmit,
formState: { errors, isSubmitting },
reset,
setValue,
control,
} = useForm<FormValues>({
resolver: zodResolver(schema),
defaultValues: {
title: listing.title,
description: listing.description,
price: listing.price,
currency: listing.currency,
country:
listing.country === "France" || listing.country === "Canada"
? (listing.country as "France" | "Canada")
: "France",
city: listing.city ?? "",
addressFull: listing.addressFull ?? "",
},
});

// Auto-devise depuis le cookie si l’annonce a une devise vide (sécurité)
useEffect(() => {
if (!listing.currency) {
const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
const cookieCurrency =
(m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
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
price: values.price, // float
currency: values.currency, // EUR/CAD
country: values.country,
city: values.city.trim(),
addressFull: values.addressFull.trim(),
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
country:
listing.country === "France" || listing.country === "Canada"
? (listing.country as "France" | "Canada")
: "France",
city: listing.city ?? "",
addressFull: listing.addressFull ?? "",
});
}, [listing, reset]);

return (
<>
{/* Script Google Maps pour l'autocomplete (villes) */}
{apiKey && (
<Script
src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
strategy="afterInteractive"
onLoad={() => setMapsReady(true)}
onError={(e) => {
console.error(
"Erreur chargement Google Maps (edit listing)",
e
);
toast.error(
"Google Maps n'a pas pu se charger (autocomplete)."
);
}}
/>
)}

<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
<div>
<label className="mb-1 block text-sm">Titre</label>
<input
className="w-full rounded border px-3 py-2"
{...register("title")}
/>
{errors.title && (
<p className="text-sm text-red-600">
{errors.title.message}
</p>
)}
</div>

<div>
<label className="mb-1 block text-sm">Description</label>
<textarea
rows={5}
className="w-full rounded border px-3 py-2"
{...register("description")}
/>
{errors.description && (
<p className="text-sm text-red-600">
{errors.description.message}
</p>
)}
</div>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
<div className="sm:col-span-2">
<label className="mb-1 block text-sm">Prix</label>
<input
type="number"
step="0.01"
className="w-full rounded border px-3 py-2"
{...register("price", { valueAsNumber: true })}
/>
{errors.price && (
<p className="text-sm text-red-600">
{errors.price.message}
</p>
)}
</div>
<div>
<label className="mb-1 block text-sm">Devise</label>
<select
className="w-full rounded border px-3 py-2"
{...register("currency")}
>
<option value="EUR">EUR €</option>
<option value="CAD">CAD $</option>
</select>
</div>
</div>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<div>
<label className="mb-1 block text-sm">Pays</label>
{/* ⬇️ select bloqué France / Canada */}
<select
className="w-full rounded border px-3 py-2"
{...register("country")}
>
<option value="France">France</option>
<option value="Canada">Canada</option>
</select>
{errors.country && (
<p className="text-sm text-red-600">
{errors.country.message}
</p>
)}
</div>
<div>
<label className="mb-1 block text-sm">Ville *</label>
{/* ⬇️ Autocomplete villes FR/CA */}
<Controller
name="city"
control={control}
render={({ field }) => (
<CityAutocomplete
value={field.value || ""}
onChange={field.onChange}
mapsReady={mapsReady}
/>
)}
/>
{errors.city && (
<p className="text-sm text-red-600">
{errors.city.message}
</p>
)}
</div>
</div>

{/* Adresse exacte (rue) */}
<div>
<label className="mb-1 block text-sm">
Adresse exacte de l’espace *
</label>
<input
className="w-full rounded border px-3 py-2"
placeholder="Numéro + rue, code postal..."
{...register("addressFull")}
/>
{errors.addressFull && (
<p className="text-sm text-red-600">
{errors.addressFull.message}
</p>
)}
<p className="mt-1 text-xs text-gray-500">
Cette adresse sert à positionner le logement mais ne sera pas
affichée telle quelle aux voyageurs.
</p>
</div>

<button
type="submit"
disabled={isSubmitting}
className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
>
{isSubmitting ? "Mise à jour…" : "Enregistrer les modifications"}
</button>
</form>
</>
);
}