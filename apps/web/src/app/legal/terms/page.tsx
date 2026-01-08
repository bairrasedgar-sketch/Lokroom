"use client";

import Link from "next/link";

export default function TermsPage() {
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
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-600 mb-4">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir
              les modalités et conditions d&apos;utilisation de la plateforme Lok&apos;Room, ainsi que
              de définir les droits et obligations des parties dans ce cadre.
            </p>
            <p className="text-gray-600">
              Lok&apos;Room est une plateforme de mise en relation entre des propriétaires d&apos;espaces
              (« Hôtes ») et des personnes souhaitant louer ces espaces (« Voyageurs » ou « Guests »).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Acceptation des CGU</h2>
            <p className="text-gray-600 mb-4">
              L&apos;utilisation de la plateforme Lok&apos;Room implique l&apos;acceptation pleine et entière
              des présentes CGU. En créant un compte ou en utilisant nos services, vous reconnaissez
              avoir lu, compris et accepté l&apos;ensemble de ces conditions.
            </p>
            <p className="text-gray-600">
              Lok&apos;Room se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
              seront informés de toute modification par email ou notification sur la plateforme.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Inscription et compte utilisateur</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Création de compte</h3>
            <p className="text-gray-600 mb-4">
              Pour utiliser certaines fonctionnalités de Lok&apos;Room, vous devez créer un compte.
              Vous vous engagez à fournir des informations exactes, à jour et complètes.
            </p>
            <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Sécurité du compte</h3>
            <p className="text-gray-600 mb-4">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion et de
              toutes les activités effectuées sous votre compte. En cas de soupçon d&apos;utilisation
              non autorisée, vous devez nous en informer immédiatement.
            </p>
            <h3 className="text-lg font-medium text-gray-800 mb-2">3.3 Vérification d&apos;identité</h3>
            <p className="text-gray-600">
              Lok&apos;Room peut vous demander de vérifier votre identité pour certaines fonctionnalités.
              Cette vérification est effectuée via notre partenaire Stripe Identity dans le respect
              de la réglementation en vigueur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Services proposés</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 Pour les Hôtes</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Publication d&apos;annonces d&apos;espaces à louer</li>
              <li>Gestion du calendrier et des disponibilités</li>
              <li>Réception et gestion des demandes de réservation</li>
              <li>Encaissement des paiements via Stripe Connect</li>
              <li>Communication avec les voyageurs</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 Pour les Voyageurs</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Recherche et consultation d&apos;espaces disponibles</li>
              <li>Réservation d&apos;espaces</li>
              <li>Paiement sécurisé en ligne</li>
              <li>Communication avec les hôtes</li>
              <li>Publication d&apos;avis après séjour</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Réservations et paiements</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Processus de réservation</h3>
            <p className="text-gray-600 mb-4">
              Les réservations peuvent être instantanées ou soumises à l&apos;approbation de l&apos;hôte,
              selon les paramètres de l&apos;annonce. Une réservation n&apos;est confirmée qu&apos;après
              acceptation par l&apos;hôte (si applicable) et validation du paiement.
            </p>
            <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 Frais de service</h3>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room prélève des frais de service sur chaque transaction :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Frais voyageur : un pourcentage du montant de la réservation</li>
              <li>Frais hôte : un pourcentage prélevé sur le versement à l&apos;hôte</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">5.3 Annulations et remboursements</h3>
            <p className="text-gray-600">
              Les conditions d&apos;annulation sont définies par chaque hôte pour son annonce.
              En cas d&apos;annulation, les remboursements sont effectués selon la politique
              d&apos;annulation applicable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Obligations des utilisateurs</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 Obligations générales</h3>
            <p className="text-gray-600 mb-4">Les utilisateurs s&apos;engagent à :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Respecter les présentes CGU et la législation en vigueur</li>
              <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Respecter les droits des autres utilisateurs</li>
              <li>Ne pas publier de contenus illicites, diffamatoires ou inappropriés</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 Obligations spécifiques des Hôtes</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Publier des annonces conformes à la réalité</li>
              <li>Maintenir leurs espaces en bon état</li>
              <li>Respecter les réglementations locales (fiscalité, assurances, etc.)</li>
              <li>Honorer les réservations confirmées</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">6.3 Obligations spécifiques des Voyageurs</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Respecter les espaces loués et leur règlement intérieur</li>
              <li>Quitter les lieux dans l&apos;état où ils les ont trouvés</li>
              <li>Signaler tout problème à l&apos;hôte et à Lok&apos;Room</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Responsabilité</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room agit en tant qu&apos;intermédiaire technique et n&apos;est pas partie aux
              contrats conclus entre Hôtes et Voyageurs. Nous ne pouvons être tenus responsables :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Des informations publiées par les utilisateurs</li>
              <li>De l&apos;état des espaces proposés à la location</li>
              <li>Des litiges entre Hôtes et Voyageurs</li>
              <li>Des dommages indirects résultant de l&apos;utilisation de la plateforme</li>
            </ul>
            <p className="text-gray-600">
              Néanmoins, nous mettons tout en œuvre pour faciliter la résolution des litiges
              via notre système de médiation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Propriété intellectuelle</h2>
            <p className="text-gray-600 mb-4">
              L&apos;ensemble des éléments de la plateforme Lok&apos;Room (logo, design, code, textes,
              images) sont protégés par le droit de la propriété intellectuelle.
            </p>
            <p className="text-gray-600">
              En publiant du contenu sur Lok&apos;Room, vous accordez une licence non exclusive,
              mondiale et gratuite pour utiliser ce contenu dans le cadre de nos services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Protection des données personnelles</h2>
            <p className="text-gray-600 mb-4">
              Le traitement de vos données personnelles est régi par notre{" "}
              <Link href="/legal/privacy" className="text-gray-900 underline hover:no-underline">
                Politique de Confidentialité
              </Link>
              , conforme au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Suspension et résiliation</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room se réserve le droit de suspendre ou supprimer tout compte en cas de :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Violation des présentes CGU</li>
              <li>Comportement frauduleux ou abusif</li>
              <li>Publication de contenus illicites</li>
              <li>Plaintes répétées d&apos;autres utilisateurs</li>
            </ul>
            <p className="text-gray-600">
              Vous pouvez également supprimer votre compte à tout moment depuis les paramètres
              de votre profil.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Droit applicable et litiges</h2>
            <p className="text-gray-600 mb-4">
              Les présentes CGU sont régies par le droit français. En cas de litige, les parties
              s&apos;engagent à rechercher une solution amiable avant toute action judiciaire.
            </p>
            <p className="text-gray-600">
              À défaut d&apos;accord amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact</h2>
            <p className="text-gray-600">
              Pour toute question concernant ces CGU, vous pouvez nous contacter à :{" "}
              <a href="mailto:legal@lokroom.com" className="text-gray-900 underline hover:no-underline">
                legal@lokroom.com
              </a>
            </p>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
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
