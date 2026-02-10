"use client";

import Link from "next/link";

export default function HostTermsPage() {
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
          Conditions Générales pour les Hôtes
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              En tant qu&apos;hôte sur Lok&apos;Room, vous vous engagez à fournir un espace de qualité et à respecter
              les standards de la plateforme. Ces conditions complètent les <Link href="/legal/terms" className="text-blue-600 underline">Conditions Générales d&apos;Utilisation</Link>.
            </p>
          </section>

          {/* 1. Éligibilité et Obligations */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éligibilité et Obligations</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.1 Conditions d&apos;Éligibilité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Être majeur (18 ans minimum)</li>
              <li>Avoir le droit légal de louer l&apos;espace proposé</li>
              <li>Respecter les lois locales sur la location courte durée</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Vérifier votre identité et vos coordonnées</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.2 Obligations Légales</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-2">
                ⚠️ Important : Vous êtes responsable de :
              </p>
              <ul className="list-disc pl-6 text-sm text-amber-800 space-y-1">
                <li>Obtenir les autorisations nécessaires (copropriété, propriétaire)</li>
                <li>Déclarer vos revenus aux autorités fiscales</li>
                <li>Respecter les règlements locaux sur la location courte durée</li>
                <li>Souscrire une assurance responsabilité civile adaptée</li>
              </ul>
            </div>
          </section>

          {/* 2. Création et Gestion de l'Annonce */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Création et Gestion de l&apos;Annonce</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Informations Requises</h3>
            <p className="text-gray-600 mb-2">Votre annonce doit contenir :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Description précise :</strong> Type d&apos;espace, superficie, équipements</li>
              <li><strong>Photos de qualité :</strong> Minimum 5 photos récentes et représentatives</li>
              <li><strong>Adresse exacte :</strong> Visible après réservation confirmée</li>
              <li><strong>Règles de l&apos;espace :</strong> Capacité, horaires, restrictions</li>
              <li><strong>Tarification claire :</strong> Prix horaire/journalier, frais supplémentaires</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Standards de Qualité</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📸 Photos obligatoires :
              </p>
              <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                <li>Vue d&apos;ensemble de l&apos;espace</li>
                <li>Zones de travail/repos</li>
                <li>Équipements (cuisine, salle de bain, matériel)</li>
                <li>Extérieur (si applicable)</li>
                <li>Photos récentes (moins de 6 mois)</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Interdictions</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>❌ Photos trompeuses ou retouchées excessivement</li>
              <li>❌ Descriptions mensongères</li>
              <li>❌ Prix différents de ceux affichés</li>
              <li>❌ Demander un paiement hors plateforme</li>
              <li>❌ Annonces en double</li>
            </ul>
          </section>

          {/* 3. Tarification et Paiements */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Tarification et Paiements</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Frais de Service</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Commission Lok&apos;Room :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li><strong>15% du montant de la réservation</strong> (hors frais de ménage)</li>
                <li>Prélevée automatiquement avant le versement</li>
                <li>Inclut la protection des paiements et le support</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Versements</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Délai de versement :</strong> 24h après le check-in du voyageur
              </li>
              <li>
                <strong>Méthode :</strong> Virement bancaire sur votre compte vérifié
              </li>
              <li>
                <strong>Devise :</strong> EUR (conversion automatique si nécessaire)
              </li>
              <li>
                <strong>Retenue :</strong> Possible en cas de litige (voir <Link href="/legal/disputes" className="text-blue-600 underline">Politique de litiges</Link>)
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.3 Frais Supplémentaires</h3>
            <p className="text-gray-600 mb-2">Vous pouvez facturer :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Frais de ménage (montant fixe, affiché dans l&apos;annonce)</li>
              <li>Frais par voyageur supplémentaire (au-delà de la capacité de base)</li>
              <li>Ces frais doivent être clairement indiqués AVANT la réservation</li>
            </ul>
          </section>

          {/* 4. Réservations et Annulations */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Réservations et Annulations</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.1 Acceptation des Réservations</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Réservation instantanée :</strong> Acceptation automatique (recommandé)
              </li>
              <li>
                <strong>Demande de réservation :</strong> Réponse obligatoire sous 24h
              </li>
              <li>
                <strong>Taux d&apos;acceptation :</strong> Minimum 88% pour rester actif
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.2 Annulations par l&apos;Hôte</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                ⚠️ Pénalités en cas d&apos;annulation :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li><strong>Moins de 7 jours avant :</strong> Pénalité de 100€ + remboursement intégral voyageur + 50€ compensation</li>
                <li><strong>7-30 jours avant :</strong> Pénalité de 50€ + remboursement intégral voyageur</li>
                <li><strong>Plus de 30 jours avant :</strong> Remboursement intégral voyageur</li>
                <li><strong>Annulations répétées :</strong> Suspension du compte</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.3 Cas de Force Majeure</h3>
            <p className="text-gray-600">
              Pas de pénalité en cas de : catastrophe naturelle, urgence médicale grave, décès dans la famille proche.
              Preuves requises (certificat médical, acte de décès, etc.).
            </p>
          </section>

          {/* 5. Responsabilités et Assurances */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Responsabilités et Assurances</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Responsabilité de l&apos;Hôte</h3>
            <p className="text-gray-600 mb-2">Vous êtes responsable de :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>La sécurité de l&apos;espace (normes électriques, détecteurs de fumée)</li>
              <li>La conformité des équipements annoncés</li>
              <li>La propreté de l&apos;espace au check-in</li>
              <li>L&apos;accès à l&apos;espace aux horaires convenus</li>
              <li>Les dommages causés par des défauts de l&apos;espace</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Assurance Obligatoire</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📋 Assurance responsabilité civile requise :
              </p>
              <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                <li>Couvrant la location courte durée</li>
                <li>Montant minimum : 1 000 000€</li>
                <li>Preuve à fournir sur demande</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.3 Limitation de Responsabilité de Lok&apos;Room</h3>
            <p className="text-gray-600">
              Lok&apos;Room est un intermédiaire. Nous ne sommes pas responsables des dommages, accidents ou litiges
              entre hôtes et voyageurs. Notre rôle se limite à la médiation (voir <Link href="/legal/disputes" className="text-blue-600 underline">Politique de litiges</Link>).
            </p>
          </section>

          {/* 6. Standards de la Communauté */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Standards de la Communauté</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.1 Communication</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Répondre aux messages sous 24h</li>
              <li>Fournir les instructions d&apos;accès 24h avant le check-in</li>
              <li>Être disponible pendant le séjour pour les urgences</li>
              <li>Rester courtois et professionnel</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.2 Discrimination Interdite</h3>
            <p className="text-gray-600 mb-2">
              Il est strictement interdit de refuser une réservation pour des raisons de :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Race, origine ethnique, nationalité</li>
              <li>Religion</li>
              <li>Orientation sexuelle, identité de genre</li>
              <li>Handicap</li>
              <li>Âge (sauf mineurs non accompagnés)</li>
            </ul>
            <p className="text-sm text-gray-600">
              Voir <Link href="/legal/non-discrimination" className="text-blue-600 underline">Politique de non-discrimination</Link>
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.3 Avis et Évaluations</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Vous pouvez évaluer les voyageurs après chaque séjour</li>
              <li>Les avis doivent être honnêtes et constructifs</li>
              <li>Interdiction de demander la suppression d&apos;avis négatifs</li>
              <li>Les avis frauduleux entraînent la suspension du compte</li>
            </ul>
          </section>

          {/* 7. Suspension et Résiliation */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Suspension et Résiliation</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.1 Motifs de Suspension</h3>
            <p className="text-gray-600 mb-2">Votre compte peut être suspendu en cas de :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Annulations répétées (plus de 3 par an)</li>
              <li>Note moyenne inférieure à 3/5</li>
              <li>Plaintes répétées des voyageurs</li>
              <li>Non-respect des standards de qualité</li>
              <li>Fraude ou tentative de fraude</li>
              <li>Discrimination</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.2 Résiliation par l&apos;Hôte</h3>
            <p className="text-gray-600 mb-2">
              Vous pouvez fermer votre compte à tout moment en :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Désactivant toutes vos annonces</li>
              <li>Honorant les réservations en cours</li>
              <li>Contactant le support pour la fermeture définitive</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.3 Résiliation par Lok&apos;Room</h3>
            <p className="text-gray-600">
              Nous pouvons résilier votre compte immédiatement en cas de violation grave des conditions
              (fraude, discrimination, mise en danger). Les réservations en cours seront annulées et remboursées.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact et Support</h2>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Questions sur ces conditions ?</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email :</strong>{" "}
                  <a href="mailto:support@lokroom.com" className="underline">
                    support@lokroom.com
                  </a>
                </p>
                <p>
                  <strong>Support humain :</strong> 9h-17h (tous les jours)
                </p>
                <p>
                  <strong>Support IA :</strong> 24h/24 7j/7
                </p>
              </div>
            </div>
          </section>

          {/* Liens utiles */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Liens Utiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/legal/terms" className="text-blue-600 underline text-sm">
                → Conditions Générales d&apos;Utilisation
              </Link>
              <Link href="/legal/guest-terms" className="text-blue-600 underline text-sm">
                → Conditions pour les Voyageurs
              </Link>
              <Link href="/legal/disputes" className="text-blue-600 underline text-sm">
                → Politique de Gestion des Litiges
              </Link>
              <Link href="/legal/house-rules" className="text-blue-600 underline text-sm">
                → Règles d&apos;Usage des Espaces
              </Link>
              <Link href="/legal/cancellation" className="text-blue-600 underline text-sm">
                → Politique d&apos;Annulation
              </Link>
              <Link href="/legal/non-discrimination" className="text-blue-600 underline text-sm">
                → Politique de Non-Discrimination
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
