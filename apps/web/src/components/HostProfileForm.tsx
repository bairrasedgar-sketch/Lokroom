// apps/web/src/components/HostProfileForm.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";


const RESPONSE_TIME_LABELS: Record<string, string> = {
  moins_une_heure: "Moins d’une heure",
  quelques_heures: "Quelques heures",
  un_jour: "Environ un jour",
};

const RESPONSE_TIME_VALUES = Object.keys(
  RESPONSE_TIME_LABELS,
) as (keyof typeof RESPONSE_TIME_LABELS)[];

type HostProfileFormProps = {
  initialProfile: {
    bio: string | null;
    avatarUrl: string | null;
    languages: string[];
    responseTimeCategory: string | null;
    instagram: string | null;
    website: string | null;
    experienceYears: number | null;
  } | null;
};

export default function HostProfileForm({ initialProfile }: HostProfileFormProps) {
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? "");
  const [languagesText, setLanguagesText] = useState(
    (initialProfile?.languages ?? []).join(", "),
  );
  const [responseTimeCategory, setResponseTimeCategory] = useState<string | "">(
    initialProfile?.responseTimeCategory ?? "",
  );
  const [instagram, setInstagram] = useState(initialProfile?.instagram ?? "");
  const [website, setWebsite] = useState(initialProfile?.website ?? "");
  const [experienceYears, setExperienceYears] = useState<number | undefined>(
    initialProfile?.experienceYears ?? undefined,
  );

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const languages = languagesText
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      const res = await fetch("/api/host/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          languages,
          responseTimeCategory: responseTimeCategory || null,
          instagram: instagram || null,
          website: website || null,
          experienceYears:
            typeof experienceYears === "number" ? experienceYears : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error ?? "Impossible de mettre à jour le profil pour le moment.";
        toast.error(msg);
        return;
      }

      const data = await res.json();
      const profile = data.profile as HostProfileFormProps["initialProfile"];

      // Resync avec ce que renvoie l'API
      if (profile) {
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");
        setLanguagesText((profile.languages ?? []).join(", "));
        setResponseTimeCategory(profile.responseTimeCategory ?? "");
        setInstagram(profile.instagram ?? "");
        setWebsite(profile.website ?? "");
        setExperienceYears(profile.experienceYears ?? undefined);
      }

      toast.success("Profil hôte mis à jour avec succès ✨");
    } catch (err) {
      logger.error(err);
      toast.error("Erreur inattendue lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-gray-800">
      <h2 className="text-base font-semibold">Paramètres du profil hôte</h2>
      <p className="text-xs text-gray-500">
        Ces informations sont visibles par tes invités sur tes annonces.
      </p>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          Bio / description
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Présente-toi, parle de ton expérience, de l’espace que tu proposes, de ta manière d’accueillir…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <p className="text-[11px] text-gray-400">
          {bio.length}/2000 caractères
        </p>
      </div>

      {/* Avatar URL */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          Photo de profil (URL)
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="URL d’une image (Cloudflare R2, CDN, etc.)"
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <p className="text-[11px] text-gray-400">
          Plus tard on pourra brancher un upload direct vers Cloudflare R2.
        </p>
      </div>

      {/* Langues */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          Langues parlées
        </label>
        <input
          type="text"
          value={languagesText}
          onChange={(e) => setLanguagesText(e.target.value)}
          placeholder="Ex : Français, Anglais, Espagnol"
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <p className="text-[11px] text-gray-400">
          Sépare les langues par des virgules. Exemple :{" "}
          <span className="font-mono">Français, Anglais, Espagnol</span>
        </p>
      </div>

      {/* Temps de réponse */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          Temps de réponse moyen
        </label>
        <select
          value={responseTimeCategory}
          onChange={(e) => setResponseTimeCategory(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        >
          <option value="">Non précisé</option>
          {RESPONSE_TIME_VALUES.map((val) => (
            <option key={val} value={val}>
              {RESPONSE_TIME_LABELS[val]}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-400">
          Cette info aide les invités à savoir à quelle vitesse tu réponds.
        </p>
      </div>

      {/* Liens externes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Instagram
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@toncompte ou URL"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Site web
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://ton-site.com"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Expérience */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          Années d&apos;expérience comme hôte
        </label>
        <input
          type="number"
          min={0}
          max={60}
          value={experienceYears ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setExperienceYears(v === "" ? undefined : Number.parseInt(v, 10));
          }}
          placeholder="Ex : 2"
          className="h-9 w-32 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <p className="text-[11px] text-gray-400">
          Cette info peut être utilisée plus tard pour afficher des badges (hôte
          expérimenté, etc.).
        </p>
      </div>

      {/* Bouton */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enregistrement..." : "Enregistrer le profil"}
        </button>
      </div>
    </form>
  );
}
