"use client";

import Link from "next/link";

export default function GuestTermsPage() {
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
          Conditions Générales pour les Voyageurs
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              En tant que voyageur sur Lok&apos;Room, vous vous engagez à respecter les espaces réservés et les règles
              de la communauté. Ces conditions complètent les <Link href="/legal/terms" className="text-blue-600 underline">Conditions Générales d&apos;Utilisation</Link>.
            </p>
          </section>

          {/* 1. Éligibilité et Compte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éligibilité et Compte</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.1 Conditions d&apos;Éligibilité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Être majeur (18 ans minimum)</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Vérifier votre identité (pièce d&apos;identité requise)</li>
              <li>Ajouter un moyen de paiement valide</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.2 Vérification d&apos;Identité</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🔒 Pour votre sécurité et celle des hôtes :
              </p>
              <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                <li>Pièce d&apos;identité officielle requise (CNI, passeport, permis)</li>
                <li>Vérification email et téléphone obligatoire</li>
                <li>Photo de profil recommandée</li>
              </ul>
            </div>
          </section>

          {/* 2. Réservations */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Réservations</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Processus de Réservation</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Sélection de l&apos;espace</p>
                  <p className="text-xs text-gray-600">Choisissez dates, horaires et nombre de voyageurs</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Vérification du prix</p>
                  <p className="text-xs text-gray-600">Prix total incluant frais de service et taxes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Paiement sécurisé</p>
                  <p className="text-xs text-gray-600">Via Stripe - Paiement immédiat</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Confirmation</p>
                  <p className="text-xs text-gray-600">Email avec instructions d&apos;accès</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3 mt-6">2.2 Types de Réservation</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Réservation instantanée :</strong> Confirmation immédiate sans validation de l&apos;hôte
              </li>
              <li>
                <strong>Demande de réservation :</strong> L&apos;hôte a 24h pour accepter ou refuser
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Paiement</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Composition du prix total :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Prix de l&apos;espace (horaire ou journalier)</li>
                <li>Frais de ménage (si applicable)</li>
                <li>Frais par voyageur supplémentaire (si applicable)</li>
                <li>Frais de service Lok&apos;Room (environ 12-15%)</li>
                <li>Taxes locales (si applicable)</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Le paiement est débité immédiatement. L&apos;hôte reçoit le paiement 24h après votre check-in.
            </p>
          </section>

          {/* 3. Annulations et Modifications */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Annulations et Modifications</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Politique d&apos;Annulation Standard</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-900 text-sm">Plus de 72h avant l&apos;arrivée</p>
                  <p className="text-xs text-green-800">Remboursement intégral (100%)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-900 text-sm">24h à 72h avant l&apos;arrivée</p>
                  <p className="text-xs text-amber-800">Remboursement partiel (50%)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium text-red-900 text-sm">Moins de 24h avant l&apos;arrivée</p>
                  <p className="text-xs text-red-800">Aucun remboursement (0%)</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Voir la <Link href="/legal/cancellation" className="text-blue-600 underline">Politique d&apos;Annulation complète</Link> pour plus de détails.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Modifications de Réservation</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Les modifications de dates/horaires sont soumises à l&apos;accord de l&apos;hôte</li>
              <li>Changement de dates = annulation + nouvelle réservation (politique d&apos;annulation applicable)</li>
              <li>Réduction du nombre de voyageurs : pas de remboursement des frais supplémentaires</li>
            </ul>
          </section>

          {/* 4. Utilisation de l'Espace */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Utilisation de l&apos;Espace</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.1 Règles Générales</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Respecter les horaires de check-in et check-out</li>
              <li>Ne pas dépasser le nombre de voyageurs indiqué</li>
              <li>Respecter les règles spécifiques de l&apos;espace (voir <Link href="/legal/house-rules" className="text-blue-600 underline">Règles d&apos;Usage</Link>)</li>
              <li>Laisser l&apos;espace propre et en bon état</li>
              <li>Signaler immédiatement tout problème ou dommage</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.2 Interdictions</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                ❌ Strictement interdit :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li>Fumer à l&apos;intérieur (sauf si autorisé)</li>
                <li>Organiser des fêtes ou événements non autorisés</li>
                <li>Amener des animaux (sauf si autorisé)</li>
                <li>Sous-louer ou céder la réservation</li>
                <li>Utiliser l&apos;espace à des fins illégales</li>
                <li>Installer des caméras ou dispositifs d&apos;enregistrement</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.3 Accès et Sécurité</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Les instructions d&apos;accès sont envoyées 24h avant le check-in</li>
              <li>Ne pas partager les codes d&apos;accès avec des tiers</li>
              <li>Verrouiller l&apos;espace en partant</li>
              <li>Signaler toute intrusion ou problème de sécurité</li>
            </ul>
          </section>

          {/* 5. Responsabilités et Dommages */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Responsabilités et Dommages</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Responsabilité du Voyageur</h3>
            <p className="text-gray-600 mb-2">Vous êtes responsable de :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Tous les dommages causés à l&apos;espace ou aux équipements</li>
              <li>Les dommages causés par vos invités (même non déclarés)</li>
              <li>Le vol ou la perte d&apos;objets appartenant à l&apos;hôte</li>
              <li>Les nuisances causées au voisinage</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Déclaration de Dommages</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-2">
                ⚠️ Délai de déclaration par l&apos;hôte :
              </p>
              <ul className="list-disc pl-6 text-sm text-amber-800 space-y-1">
                <li>Maximum 48h après le check-out</li>
                <li>Preuves requises : photos, factures, devis</li>
                <li>Montant maximum : 2 000€ (au-delà = procédure judiciaire)</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Voir la <Link href="/legal/disputes" className="text-blue-600 underline">Politique de Gestion des Litiges</Link> pour le processus complet.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.3 Assurance</h3>
            <p className="text-gray-600">
              Lok&apos;Room ne fournit pas d&apos;assurance. Nous vous recommandons de souscrire une assurance voyage
              couvrant les dommages matériels et la responsabilité civile.
            </p>
          </section>

          {/* 6. Problèmes et Litiges */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Problèmes et Litiges</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.1 Signalement de Problèmes</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📞 En cas de problème pendant le séjour :
              </p>
              <ol className="list-decimal pl-6 text-sm text-blue-800 space-y-1">
                <li>Contactez l&apos;hôte immédiatement via la messagerie</li>
                <li>Prenez des photos datées du problème</li>
                <li>Si pas de réponse sous 2h, contactez support@lokroom.com</li>
                <li>Mentionnez "URGENT" dans l&apos;objet pour les urgences</li>
              </ol>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.2 Délais de Réclamation</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Problème pendant le séjour :</strong> Signalement immédiat
              </li>
              <li>
                <strong>Problème découvert au check-in :</strong> Maximum 24h après l&apos;arrivée
              </li>
              <li>
                <strong>Demande de remboursement :</strong> Maximum 48h après le check-out
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.3 Remboursements</h3>
            <p className="text-gray-600 mb-2">En cas de problème majeur non résolu :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Remboursement partiel ou total selon la gravité</li>
              <li>Décision prise par Lok&apos;Room sous 5 jours ouvrés</li>
              <li>Preuves requises (photos, échanges avec l&apos;hôte)</li>
            </ul>
          </section>

          {/* 7. Avis et Évaluations */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Avis et Évaluations</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.1 Laisser un Avis</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Vous avez 14 jours après le check-out pour laisser un avis</li>
              <li>Les avis doivent être honnêtes et basés sur votre expérience</li>
              <li>Interdiction d&apos;avis diffamatoires ou mensongers</li>
              <li>Les avis sont publiés simultanément (hôte et voyageur)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.2 Votre Réputation</h3>
            <p className="text-gray-600 mb-2">
              Les hôtes peuvent vous évaluer sur :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Respect des règles</li>
              <li>Communication</li>
              <li>Propreté</li>
              <li>Note globale</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Une note moyenne inférieure à 3/5 peut entraîner des restrictions sur votre compte.
            </p>
          </section>

          {/* 8. Suspension et Résiliation */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Suspension et Résiliation</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.1 Motifs de Suspension</h3>
            <p className="text-gray-600 mb-2">Votre compte peut être suspendu en cas de :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Violation des règles de l&apos;espace</li>
              <li>Dommages répétés</li>
              <li>Plaintes répétées des hôtes</li>
              <li>Note moyenne inférieure à 3/5</li>
              <li>Fraude ou tentative de fraude</li>
              <li>Comportement inapproprié ou dangereux</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.2 Résiliation par le Voyageur</h3>
            <p className="text-gray-600">
              Vous pouvez fermer votre compte à tout moment. Les réservations en cours restent valides
              et doivent être honorées ou annulées selon la politique d&apos;annulation.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact et Support</h2>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Besoin d&apos;aide ?</h3>
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
                <p className="mt-4 text-gray-300">
                  Pour les urgences pendant une réservation, mentionnez "URGENT" dans l&apos;objet de votre email.
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
              <Link href="/legal/host-terms" className="text-blue-600 underline text-sm">
                → Conditions pour les Hôtes
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
              <Link href="/legal/community-standards" className="text-blue-600 underline text-sm">
                → Standards de la Communauté
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
