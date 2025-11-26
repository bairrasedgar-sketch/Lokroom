// apps/web/src/app/host/profile/page.tsx
import Image from "next/image";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import HostProfileForm from "@/components/HostProfileForm";

export const dynamic = "force-dynamic";

type HostProfile = {
  id: string;
  userId: string;
  bio: string | null;
  avatarUrl: string | null;
  languages: string[];
  responseTimeCategory: string | null;
  verifiedPhone: boolean;
  verifiedEmail: boolean;
  superhost: boolean;
  instagram: string | null;
  website: string | null;
  experienceYears: number | null;
  createdAt: string;
  updatedAt: string;
};

type HostStats = {
  ratingAvg: number;
  ratingCount: number;
  totalHosted: number;
  cancelRate: number;
  verifiedEmail: boolean;
  superhost: boolean;
};

type ApiResponse = {
  profile: HostProfile | null;
  stats: HostStats | null;
};

// Comme pour bookings, on construit une URL absolue
function makeAbsUrl(path: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ??
    "localhost:3000";

  return `${proto}://${host}${path}`;
}

async function loadHostProfile(): Promise<ApiResponse | null> {
  try {
    const url = makeAbsUrl("/api/host/profile");
    const cookie = cookies().toString();

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        cookie,
      },
    });

    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse;
    return json;
  } catch {
    return null;
  }
}

export default async function HostProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const data = await loadHostProfile();
  const profile = data?.profile ?? null;
  const stats = data?.stats ?? null;

  const initialLetter = (
    session.user?.name?.[0] ?? session.user?.email?.[0] ?? "?"
  ).toUpperCase();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Profil hôte Lok&apos;Room
          </h1>
          <p className="text-sm text-gray-600">
            Personnalise ton profil public et suis tes stats d’hébergement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col text-right text-xs text-gray-500 sm:flex">
            <span className="font-medium text-gray-800">
              {session.user?.name ?? session.user?.email}
            </span>
            <span>Compte hôte</span>
          </div>

          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt="Avatar hôte"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-600">
                {initialLetter}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Layout 2 colonnes : résumé + stats / form */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Colonne gauche : résumé + stats */}
        <div className="flex-1 space-y-4">
          {/* Carte résumé / badges */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {profile?.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt="Avatar hôte"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600">
                      {initialLetter}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {session.user?.name ?? "Hôte Lok&apos;Room"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Profil hôte professionnel
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {(profile?.superhost || stats?.superhost) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                    ⭐ Superhost
                  </span>
                )}

                {(profile?.verifiedEmail || stats?.verifiedEmail) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    ✅ Email vérifié
                  </span>
                )}

                {profile?.verifiedPhone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                    ☎ Téléphone vérifié
                  </span>
                )}
              </div>
            </div>

            {profile?.bio ? (
              <p className="mt-3 line-clamp-3 text-xs text-gray-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                Ajoute une bio pour inspirer confiance à tes futurs invités.
              </p>
            )}

            {profile?.languages && profile.languages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Carte stats */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Statistiques d&apos;hôte
            </h2>

            {stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-0.5">
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.ratingCount > 0 ? stats.ratingAvg.toFixed(1) : "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">Note moyenne</p>
                  <p className="text-[11px] text-gray-400">
                    {stats.ratingCount} avis
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.totalHosted}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Réservations hébergées
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-semibold text-gray-900">
                    {Math.round((stats.cancelRate ?? 0) * 100)}%
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Taux d&apos;annulation
                  </p>
                  <p className="text-[11px] text-gray-400">
                    (plus c&apos;est bas, mieux c&apos;est)
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-semibold text-gray-900">
                    {profile?.experienceYears ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Années d&apos;expérience
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Tes stats apparaîtront dès que tu auras reçu tes premières
                réservations et avis.
              </p>
            )}
          </div>

          {/* Carte liens & visibilité */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Visibilité & liens externes
            </h2>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li>
                {profile?.instagram ? (
                  <>
                    Instagram connecté :{" "}
                    <span className="font-medium text-gray-900">
                      {profile.instagram}
                    </span>
                  </>
                ) : (
                  "Ajoute ton Instagram pour renforcer la confiance."
                )}
              </li>
              <li>
                {profile?.website ? (
                  <>
                    Site web :{" "}
                    <span className="font-medium text-gray-900">
                      {profile.website}
                    </span>
                  </>
                ) : (
                  "Ton site web (portfolio, agence, etc.) peut aussi être ajouté."
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Colonne droite : formulaire d’édition */}
        <aside className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
          <HostProfileForm initialProfile={profile} />
        </aside>
      </section>
    </main>
  );
}
