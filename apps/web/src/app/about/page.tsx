import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Qui sommes-nous - Lok'Room",
  description: "Découvrez l'histoire de Lok'Room, notre mission et les valeurs qui nous animent pour créer la meilleure plateforme de location d'espaces entre particuliers.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920')] bg-cover bg-center opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Réinventer la location d'espaces
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300">
              Lok'Room connecte des millions de personnes qui souhaitent louer ou proposer
              des espaces uniques partout dans le monde.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/listings/new"
                className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 transition"
              >
                Devenir hôte
              </Link>
              <Link
                href="/listings"
                className="rounded-lg border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-white hover:text-gray-900 transition"
              >
                Réserver un espace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Notre histoire
              </h2>
              <div className="mt-6 space-y-4 text-lg text-gray-600">
                <p>
                  Lok'Room est né d'une idée simple : et si chaque espace inutilisé pouvait
                  devenir une opportunité ? Un bureau vide le week-end, un parking libre en journée,
                  un studio photo disponible quelques heures...
                </p>
                <p>
                  Fondée en 2024, notre plateforme a été créée pour répondre à un besoin réel :
                  faciliter l'accès à des espaces diversifiés tout en permettant aux propriétaires
                  de générer des revenus complémentaires.
                </p>
                <p>
                  Aujourd'hui, Lok'Room compte des milliers d'espaces disponibles en France et au
                  Canada, allant de l'appartement au studio d'enregistrement, en passant par les
                  salles de réunion et les parkings.
                </p>
              </div>
            </div>
            <div className="relative h-96 lg:h-full min-h-[400px]">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"
                alt="Équipe Lok'Room"
                fill
                className="rounded-2xl object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Nos valeurs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Les principes qui guident chacune de nos décisions
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Confiance */}
            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Confiance
              </h3>
              <p className="mt-3 text-gray-600">
                Vérification d'identité, paiements sécurisés et système d'avis transparent
                pour garantir la sécurité de tous.
              </p>
            </div>

            {/* Communauté */}
            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Communauté
              </h3>
              <p className="mt-3 text-gray-600">
                Nous créons des liens entre hôtes et voyageurs, favorisant les échanges
                et le partage d'expériences.
              </p>
            </div>

            {/* Innovation */}
            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <SparklesIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Innovation
              </h3>
              <p className="mt-3 text-gray-600">
                Nous développons constamment de nouvelles fonctionnalités pour améliorer
                l'expérience de location.
              </p>
            </div>

            {/* Simplicité */}
            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
                <HeartIcon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Simplicité
              </h3>
              <p className="mt-3 text-gray-600">
                Une plateforme intuitive et des processus clairs pour que chacun puisse
                louer ou proposer un espace facilement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Notre équipe
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des passionnés dédiés à votre expérience
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Membre 1 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                  alt="Membre de l'équipe"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Alexandre Martin
              </h3>
              <p className="text-sm text-gray-600">Co-fondateur & CEO</p>
              <p className="mt-2 text-sm text-gray-500">
                Expert en marketplace et économie collaborative
              </p>
            </div>

            {/* Membre 2 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
                  alt="Membre de l'équipe"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Sophie Dubois
              </h3>
              <p className="text-sm text-gray-600">Co-fondatrice & CTO</p>
              <p className="mt-2 text-sm text-gray-500">
                Ingénieure passionnée par l'innovation tech
              </p>
            </div>

            {/* Membre 3 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
                  alt="Membre de l'équipe"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Thomas Lefebvre
              </h3>
              <p className="text-sm text-gray-600">Head of Product</p>
              <p className="mt-2 text-sm text-gray-500">
                Designer UX/UI avec 10 ans d'expérience
              </p>
            </div>

            {/* Membre 4 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"
                  alt="Membre de l'équipe"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Marie Rousseau
              </h3>
              <p className="text-sm text-gray-600">Head of Community</p>
              <p className="mt-2 text-sm text-gray-500">
                Spécialiste de la relation client et support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pourquoi choisir Lok'Room ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Les avantages qui font la différence
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Paiements 100% sécurisés",
                description: "Transactions protégées par Stripe, leader mondial du paiement en ligne"
              },
              {
                title: "Vérification d'identité",
                description: "Tous les utilisateurs sont vérifiés pour garantir votre sécurité"
              },
              {
                title: "Support 7j/7",
                description: "Une équipe disponible pour répondre à toutes vos questions"
              },
              {
                title: "Assurance incluse",
                description: "Protection en cas de dommages ou d'annulation"
              },
              {
                title: "Flexibilité maximale",
                description: "Location à l'heure, à la journée ou au mois selon vos besoins"
              },
              {
                title: "Zéro commission cachée",
                description: "Tarification transparente, vous savez exactement ce que vous payez"
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 rounded-xl bg-white p-6 shadow-sm">
                <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Prêt à rejoindre la communauté Lok'Room ?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Que vous cherchiez un espace ou souhaitiez en proposer un,
            commencez votre aventure dès aujourd'hui.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/listings/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-lg hover:bg-gray-100 transition"
            >
              Devenir hôte
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 text-base font-semibold text-white hover:bg-white hover:text-gray-900 transition"
            >
              Explorer les espaces
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
