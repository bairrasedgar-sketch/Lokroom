// apps/web/src/app/host/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HostPage() {
  const session = await getServerSession(authOptions);

  // Pas connecté → on renvoie vers /login
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Connecté mais pas hôte → on renvoie vers /profile (ou /become-host)
  if (!user.isHost) {
    redirect("/profile");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* En-tête */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Tableau de bord hôte
        </h1>
        <p className="text-sm text-gray-600">
          Bienvenue sur ton espace Lok&apos;Room.
          {" "}
          <span className="font-medium text-gray-800">
            {user.email}
          </span>
        </p>
      </header>

      {/* Bandeau résumé */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            Statut hôte
          </p>
          <p className="mt-2 text-sm">
            ✅ Compte hôte actif
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tu peux créer des annonces et recevoir des réservations.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            Annonces
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">
            On affichera ici le nombre d&apos;annonces actives.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            Revenus estimés
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">
            Plus tard : résumé de ton wallet et des paiements.
          </p>
        </div>
      </section>

      {/* Actions principales */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Gérer mes annonces</h2>
          <p className="text-sm text-gray-600">
            Crée une nouvelle annonce ou modifie tes espaces existants
            (logement, bureau, parking…).
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/listings/new"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Créer une annonce
            </a>
            <a
              href="/listings?mine=1"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Voir mes annonces
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Réservations & revenus</h2>
          <p className="text-sm text-gray-600">
            Accède à tes réservations, suis les paiements et déclenche
            les virements vers ton compte bancaire.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/reservations?mine=1"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Voir mes réservations
            </a>
            <a
              href="/profile"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Gérer mon compte hôte
            </a>
          </div>
        </div>
      </section>

      {/* Placeholder futur */}
      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
        Ici on pourra afficher plus tard :
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>La liste de tes prochaines arrivées / départs</li>
          <li>Les notifications importantes (KYC, compte Stripe, etc.)</li>
          <li>Un résumé détaillé de ton wallet Lok&apos;Room</li>
        </ul>
      </section>
    </div>
  );
}
