"use client";

import Link from "next/link";

export default function CommunityStandardsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl 2xl:max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Lok&apos;Room
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl 2xl:max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Standards de la Communauté
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-lg text-gray-600">
              Lok&apos;Room est une communauté fondée sur la confiance, le respect mutuel et
              l&apos;hospitalité. Ces standards s&apos;appliquent à tous les membres — Hôtes et
              Voyageurs — et définissent les comportements attendus sur notre plateforme.
            </p>
          </section>

          {/* Valeurs fondamentales */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Nos valeurs fondamentales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="text-2xl mb-2">🤝</div>
                <h3 className="font-medium text-gray-900 mb-1">Confiance</h3>
                <p className="text-sm text-gray-600">
                  Être honnête dans vos annonces, profils et communications.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-medium text-gray-900 mb-1">Respect</h3>
                <p className="text-sm text-gray-600">
                  Traiter chaque membre avec courtoisie et considération.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="text-2xl mb-2">🏠</div>
                <h3 className="font-medium text-gray-900 mb-1">Responsabilité</h3>
                <p className="text-sm text-gray-600">
                  Prendre soin des espaces et honorer vos engagements.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-medium text-gray-900 mb-1">Inclusion</h3>
                <p className="text-sm text-gray-600">
                  Accueillir tout le monde sans discrimination.
                </p>
              </div>
            </div>
          </section>

          {/* Standards pour les Hôtes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Standards pour les Hôtes</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Annonces exactes et honnêtes</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Les photos doivent refléter fidèlement l&apos;état actuel du logement</li>
              <li>La description doit être précise (superficie, équipements, localisation)</li>
              <li>Les règles de la maison doivent être clairement indiquées</li>
              <li>Tout problème connu doit être mentionné (travaux à proximité, bruit, etc.)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Propreté et sécurité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Le logement doit être propre et hygiénique à l&apos;arrivée</li>
              <li>Les équipements de sécurité doivent être fonctionnels (détecteurs de fumée, extincteur)</li>
              <li>Les informations d&apos;urgence doivent être accessibles</li>
              <li>Le logement doit être conforme aux normes locales</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Communication et disponibilité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Répondre aux messages dans un délai raisonnable (24h maximum)</li>
              <li>Être joignable pendant le séjour pour les urgences</li>
              <li>Fournir des instructions claires pour l&apos;arrivée</li>
              <li>Informer les voyageurs de tout changement</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.4 Respect des réservations</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Honorer toutes les réservations confirmées</li>
              <li>Ne pas annuler sauf cas de force majeure</li>
              <li>Maintenir un calendrier à jour</li>
              <li>Ne pas demander de paiement en dehors de la plateforme</li>
            </ul>
          </section>

          {/* Standards pour les Voyageurs */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Standards pour les Voyageurs</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Respect du logement</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Traiter le logement comme si c&apos;était le vôtre</li>
              <li>Respecter les équipements et le mobilier</li>
              <li>Signaler immédiatement tout dommage accidentel</li>
              <li>Laisser le logement dans un état correct au départ</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Respect des règles</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Respecter le règlement intérieur de l&apos;Hôte</li>
              <li>Ne pas dépasser le nombre de voyageurs autorisé</li>
              <li>Respecter les horaires d&apos;arrivée et de départ</li>
              <li>Demander l&apos;autorisation pour toute modification</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.3 Respect du voisinage</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Éviter les nuisances sonores, surtout la nuit</li>
              <li>Respecter les parties communes</li>
              <li>Ne pas organiser de fêtes sans autorisation explicite</li>
              <li>Stationner aux emplacements désignés</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.4 Communication</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Communiquer via la plateforme Lok&apos;Room</li>
              <li>Informer l&apos;Hôte de votre heure d&apos;arrivée prévue</li>
              <li>Signaler tout problème rapidement</li>
              <li>Laisser un avis honnête après le séjour</li>
            </ul>
          </section>

          {/* Comportements interdits */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Comportements interdits</h2>
            <p className="text-gray-600 mb-4">
              Les comportements suivants sont strictement interdits et peuvent entraîner
              la suspension ou la suppression définitive de votre compte :
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-medium text-red-900 mb-3">Tolérance zéro</h3>
              <ul className="list-disc pl-6 text-red-800 space-y-2">
                <li>
                  <strong>Discrimination</strong> — Refuser ou traiter différemment quelqu&apos;un
                  en raison de sa race, origine, religion, genre, orientation sexuelle, handicap ou âge
                </li>
                <li>
                  <strong>Harcèlement</strong> — Tout comportement intimidant, menaçant ou abusif
                </li>
                <li>
                  <strong>Violence</strong> — Menaces ou actes de violence physique
                </li>
                <li>
                  <strong>Activités illégales</strong> — Utilisation du logement pour des
                  activités contraires à la loi
                </li>
                <li>
                  <strong>Fraude</strong> — Fausses annonces, faux profils, tentatives d&apos;arnaque
                </li>
                <li>
                  <strong>Contournement</strong> — Paiements ou communications en dehors de la plateforme
                  pour éviter les frais ou protections
                </li>
              </ul>
            </div>
          </section>

          {/* Avis et commentaires */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Avis et commentaires</h2>
            <p className="text-gray-600 mb-4">
              Les avis sont essentiels pour maintenir la confiance dans notre communauté.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Rédiger un avis</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Soyez honnête et objectif</li>
              <li>Basez-vous sur votre expérience réelle</li>
              <li>Restez respectueux même en cas de désaccord</li>
              <li>Évitez les informations personnelles ou confidentielles</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Avis interdits</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Avis faux ou manipulés</li>
              <li>Avis en échange d&apos;une compensation</li>
              <li>Contenu diffamatoire, discriminatoire ou obscène</li>
              <li>Avis de représailles sans fondement</li>
            </ul>
          </section>

          {/* Signalement */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Signaler un problème</h2>
            <p className="text-gray-600 mb-4">
              Si vous êtes témoin ou victime d&apos;un comportement contraire à ces standards :
            </p>
            <ol className="list-decimal pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Pendant le séjour :</strong> Contactez notre support IA (disponible 24h/24) ou notre support humain (9h-17h tous les jours)
              </li>
              <li>
                <strong>Après le séjour :</strong> Utilisez le formulaire de signalement dans l&apos;application
              </li>
              <li>
                <strong>En cas d&apos;urgence :</strong> Contactez d&apos;abord les services d&apos;urgence locaux (police, pompiers)
              </li>
            </ol>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p>
                <strong>Email :</strong>{" "}
                <a href="mailto:safety@lokroom.com" className="text-gray-900 underline">
                  safety@lokroom.com
                </a>
              </p>
              <p className="text-sm mt-2">
                Tous les signalements sont traités de manière confidentielle.
              </p>
            </div>
          </section>

          {/* Conséquences */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Conséquences des violations</h2>
            <p className="text-gray-600 mb-4">
              En cas de non-respect de ces standards, Lok&apos;Room peut prendre les mesures suivantes :
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <span className="text-yellow-600 font-medium">1.</span>
                <div>
                  <p className="font-medium text-gray-900">Avertissement</p>
                  <p className="text-sm text-gray-600">Rappel des règles par email</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <span className="text-orange-600 font-medium">2.</span>
                <div>
                  <p className="font-medium text-gray-900">Suspension temporaire</p>
                  <p className="text-sm text-gray-600">Compte désactivé pendant une période définie</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <span className="text-red-600 font-medium">3.</span>
                <div>
                  <p className="font-medium text-gray-900">Suppression définitive</p>
                  <p className="text-sm text-gray-600">Fermeture du compte sans possibilité de réinscription</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              Les violations graves (discrimination, violence, fraude) peuvent entraîner
              une suppression immédiate sans avertissement préalable.
            </p>
          </section>

          {/* Engagement */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Notre engagement</h2>
            <p className="text-gray-600">
              Lok&apos;Room s&apos;engage à faire respecter ces standards de manière équitable
              et cohérente. Nous croyons en une communauté où chacun peut voyager et
              accueillir en toute sérénité. En utilisant notre plateforme, vous acceptez
              de respecter ces standards et de contribuer à une expérience positive pour tous.
            </p>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
              CGU
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
              Confidentialité
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/legal/cookies" className="text-gray-600 hover:text-gray-900">
              Cookies
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/legal/cancellation" className="text-gray-600 hover:text-gray-900">
              Annulation
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/legal/non-discrimination" className="text-gray-600 hover:text-gray-900">
              Non-discrimination
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/legal/legal-notice" className="text-gray-600 hover:text-gray-900">
              Mentions légales
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
