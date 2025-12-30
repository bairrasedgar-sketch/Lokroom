"use client";

import Link from "next/link";

export default function NonDiscriminationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Lok&apos;Room
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Politique de Non-Discrimination
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Engagement principal */}
          <section className="mb-8">
            <div className="bg-gray-900 text-white rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">Notre engagement</h2>
              <p className="text-lg text-gray-200">
                Lok&apos;Room est une communauté ouverte et inclusive. Nous croyons que
                le voyage et l&apos;hospitalité doivent être accessibles à tous, sans exception.
                La discrimination n&apos;a pas sa place sur notre plateforme.
              </p>
            </div>
          </section>

          {/* Principe fondamental */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Principe fondamental</h2>
            <p className="text-gray-600 mb-4">
              Tous les membres de la communauté Lok&apos;Room — Hôtes et Voyageurs —
              s&apos;engagent à traiter chaque personne avec respect et dignité,
              indépendamment de :
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Race ou couleur de peau",
                "Origine ethnique ou nationale",
                "Religion ou croyances",
                "Genre ou identité de genre",
                "Orientation sexuelle",
                "Âge",
                "Handicap",
                "État de santé",
                "Situation familiale",
                "Grossesse",
                "Opinions politiques",
                "Situation économique",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3"
                >
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Obligations des Hôtes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Obligations des Hôtes</h2>
            <p className="text-gray-600 mb-4">
              En tant qu&apos;Hôte sur Lok&apos;Room, vous vous engagez à :
            </p>

            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Accepter</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Évaluer les demandes uniquement sur des critères objectifs (dates, nombre de voyageurs, règles de la maison)</li>
                  <li>Appliquer les mêmes conditions à tous les voyageurs</li>
                  <li>Répondre à toutes les demandes de réservation</li>
                  <li>Accueillir tous les voyageurs avec la même qualité de service</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Ne jamais</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Refuser une réservation en raison de l&apos;identité du voyageur</li>
                  <li>Poser des questions sur la race, la religion ou l&apos;orientation sexuelle</li>
                  <li>Appliquer des conditions différentes selon le profil du voyageur</li>
                  <li>Utiliser un langage discriminatoire dans les annonces ou messages</li>
                  <li>Annuler une réservation après avoir découvert l&apos;identité du voyageur</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Critères légitimes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Critères de sélection légitimes</h2>
            <p className="text-gray-600 mb-4">
              Les Hôtes peuvent refuser ou accepter des réservations selon des critères
              objectifs et non discriminatoires :
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-green-700 border-b">Critères autorisés</th>
                    <th className="text-left py-3 px-4 font-medium text-red-700 border-b">Critères interdits</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Dates de disponibilité</td>
                    <td className="py-3 px-4 text-gray-600">Photo de profil / apparence</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Nombre maximum de voyageurs</td>
                    <td className="py-3 px-4 text-gray-600">Nom à consonance étrangère</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Politique sur les animaux</td>
                    <td className="py-3 px-4 text-gray-600">Pays d&apos;origine</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Évaluations et avis précédents</td>
                    <td className="py-3 px-4 text-gray-600">Statut matrimonial / enfants</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Respect du règlement intérieur</td>
                    <td className="py-3 px-4 text-gray-600">Handicap ou état de santé</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Vérification d&apos;identité complète</td>
                    <td className="py-3 px-4 text-gray-600">Religion présumée</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Accessibilité */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Accessibilité</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room encourage les Hôtes à rendre leurs logements accessibles
              aux personnes en situation de handicap :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Indiquer clairement les caractéristiques d&apos;accessibilité dans l&apos;annonce</li>
              <li>Mentionner les éventuelles limitations (escaliers, portes étroites, etc.)</li>
              <li>Répondre aux questions des voyageurs sur l&apos;accessibilité</li>
              <li>Envisager des aménagements raisonnables quand c&apos;est possible</li>
            </ul>
            <div className="bg-blue-50 rounded-lg p-4 text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Filtres d&apos;accessibilité</p>
              <p className="text-sm">
                Les voyageurs peuvent filtrer les annonces selon leurs besoins d&apos;accessibilité :
                accès sans marche, largeur des portes, douche accessible, etc.
              </p>
            </div>
          </section>

          {/* Obligations des Voyageurs */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Obligations des Voyageurs</h2>
            <p className="text-gray-600 mb-4">
              Les Voyageurs s&apos;engagent également à respecter cette politique :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Traiter tous les Hôtes avec respect et dignité</li>
              <li>Ne pas exiger de conditions discriminatoires</li>
              <li>Respecter la diversité culturelle des Hôtes et de leur communauté</li>
              <li>Signaler tout comportement discriminatoire rencontré</li>
            </ul>
          </section>

          {/* Signalement */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Signaler une discrimination</h2>
            <p className="text-gray-600 mb-4">
              Si vous êtes victime ou témoin d&apos;une discrimination sur Lok&apos;Room,
              nous vous encourageons à le signaler immédiatement :
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Comment signaler ?</h3>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Dans l&apos;application :</strong> Utilisez le bouton « Signaler »
                  sur le profil ou l&apos;annonce concernée
                </li>
                <li>
                  <strong>Par email :</strong>{" "}
                  <a href="mailto:discrimination@lokroom.com" className="text-gray-900 underline">
                    discrimination@lokroom.com
                  </a>
                </li>
                <li>
                  <strong>En cas d&apos;urgence :</strong> Contactez notre support 24h/24
                </li>
              </ol>
            </div>

            <p className="text-gray-600">
              Tous les signalements sont traités de manière <strong>confidentielle</strong>.
              Nous enquêtons sur chaque cas et prenons les mesures appropriées.
            </p>
          </section>

          {/* Conséquences */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Conséquences des violations</h2>
            <p className="text-gray-600 mb-4">
              Tout comportement discriminatoire avéré entraînera des mesures immédiates :
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">!</span>
                <div>
                  <p className="font-medium text-gray-900">Avertissement formel</p>
                  <p className="text-sm text-gray-600">Pour les infractions mineures ou premières occurrences</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">⏸</span>
                <div>
                  <p className="font-medium text-gray-900">Suspension du compte</p>
                  <p className="text-sm text-gray-600">Désactivation temporaire en attendant l&apos;enquête</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">✕</span>
                <div>
                  <p className="font-medium text-gray-900">Suppression définitive</p>
                  <p className="text-sm text-gray-600">Bannissement permanent de la plateforme</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              Les cas de discrimination caractérisée sont <strong>signalés aux autorités
              compétentes</strong> conformément à la législation en vigueur.
            </p>
          </section>

          {/* Cadre légal */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cadre légal</h2>
            <p className="text-gray-600 mb-4">
              Cette politique s&apos;inscrit dans le respect des lois anti-discrimination françaises et européennes :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Loi n° 2008-496</strong> du 27 mai 2008 relative à la lutte contre les discriminations
              </li>
              <li>
                <strong>Article 225-1 du Code pénal</strong> définissant les critères de discrimination
              </li>
              <li>
                <strong>Directive européenne 2000/43/CE</strong> relative à l&apos;égalité de traitement
              </li>
              <li>
                <strong>Loi n° 2017-256</strong> relative à l&apos;égalité et la citoyenneté
              </li>
            </ul>
            <div className="bg-yellow-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700">
                <strong>Rappel :</strong> La discrimination est un délit puni par la loi française
                de 3 ans d&apos;emprisonnement et 45 000€ d&apos;amende (article 225-2 du Code pénal).
              </p>
            </div>
          </section>

          {/* Engagement communautaire */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Notre engagement communautaire</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room s&apos;engage activement pour promouvoir l&apos;inclusion :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Formation et sensibilisation des Hôtes à la non-discrimination</li>
              <li>Outils technologiques pour détecter les comportements discriminatoires</li>
              <li>Équipe dédiée au traitement des signalements</li>
              <li>Partenariats avec des associations de lutte contre les discriminations</li>
              <li>Transparence sur les actions entreprises</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-600">
              Pour toute question relative à cette politique :{" "}
              <a href="mailto:inclusion@lokroom.com" className="text-gray-900 underline hover:no-underline">
                inclusion@lokroom.com
              </a>
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
            <Link href="/legal/community-standards" className="text-gray-600 hover:text-gray-900">
              Standards
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
