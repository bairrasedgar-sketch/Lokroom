import Link from "next/link";

export default function ListingNotFound() {
  return (
    <section className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Annonce introuvable</h1>
      <p className="text-sm text-gray-600">
        L’annonce demandée n’existe pas ou a été supprimée.
      </p>
      <Link className="text-sm text-blue-600 hover:underline" href="/listings">
        ← Retour aux annonces
      </Link>
    </section>
  );
}
