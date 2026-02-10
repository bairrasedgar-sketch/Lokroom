"use client";

import Link from "next/link";

export default function DisputesPage() {
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
          Politique de Gestion des Litiges et Dommages
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              Lok&apos;Room s&apos;engage à fournir un environnement sûr et équitable pour tous les utilisateurs.
              Cette politique définit le processus de gestion des litiges et des dommages entre hôtes et voyageurs.
            </p>
          </section>

          {/* 1. Délais de Déclaration */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Délais de Déclaration</h2>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ Important : Les délais de déclaration sont stricts et ne peuvent pas être prolongés.
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.1 Pour les Voyageurs</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Problème pendant le séjour :</strong> Signalement immédiat via la messagerie + support@lokroom.com
              </li>
              <li>
                <strong>Problème découvert après check-in :</strong> Maximum 24h après l&apos;arrivée
              </li>
              <li>
                <strong>Demande de remboursement :</strong> Maximum 48h après le check-out
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.2 Pour les Hôtes</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Dommages matériels :</strong> Maximum 48h après le check-out
              </li>
              <li>
                <strong>Frais supplémentaires :</strong> Maximum 48h après le check-out
              </li>
              <li>
                <strong>Violation des règles :</strong> Signalement immédiat pendant le séjour
              </li>
            </ul>
          </section>

          {/* 2. Preuves Requises */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Preuves Requises</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Pour les Dommages Matériels</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Documents obligatoires :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Photos datées des dommages (minimum 3 angles différents)</li>
                <li>Photos de l&apos;état initial (si disponibles)</li>
                <li>Description détaillée du dommage</li>
                <li>Devis de réparation ou facture (pour montants &gt; 50€)</li>
                <li>Facture d&apos;achat de l&apos;objet endommagé (si remplacement nécessaire)</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Pour les Problèmes de Propreté</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Documents obligatoires :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Photos datées (horodatage visible)</li>
                <li>Description précise du problème</li>
                <li>Échanges avec l&apos;hôte (tentative de résolution)</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Pour les Annulations de Dernière Minute</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Documents obligatoires :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Captures d&apos;écran de la conversation</li>
                <li>Preuve de l&apos;annulation (email, notification)</li>
                <li>Justificatifs de frais supplémentaires engagés</li>
              </ul>
            </div>
          </section>

          {/* 3. Process de Résolution */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Processus de Résolution</h2>

            <div className="space-y-4">
              {/* Étape 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Déclaration du Litige</h3>
                  <p className="text-gray-600 mb-2">
                    Envoyez un email à <a href="mailto:support@lokroom.com" className="text-blue-600 underline">support@lokroom.com</a> avec :
                  </p>
                  <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                    <li>Numéro de réservation</li>
                    <li>Description du problème</li>
                    <li>Toutes les preuves (photos, factures, captures d&apos;écran)</li>
                    <li>Montant réclamé (si applicable)</li>
                  </ul>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Accusé de Réception</h3>
                  <p className="text-gray-600">
                    <strong>Délai :</strong> 24h ouvrées maximum
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Vous recevrez un email de confirmation avec un numéro de dossier.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Investigation</h3>
                  <p className="text-gray-600">
                    <strong>Délai :</strong> 72h ouvrées maximum
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Notre équipe examine les preuves, contacte les deux parties et vérifie l&apos;historique.
                  </p>
                </div>
              </div>

              {/* Étape 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Décision</h3>
                  <p className="text-gray-600">
                    <strong>Délai :</strong> 5 jours ouvrés maximum après réception de toutes les preuves
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Décision finale communiquée par email avec justification détaillée.
                  </p>
                </div>
              </div>

              {/* Étape 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Résolution</h3>
                  <p className="text-gray-600">
                    <strong>Délai :</strong> 7 jours ouvrés maximum après la décision
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Remboursement ou compensation effectué selon la décision.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Critères de Décision */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Critères de Décision</h2>

            <p className="text-gray-600 mb-4">
              Lok&apos;Room prend ses décisions en se basant sur :
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Qualité des Preuves</p>
                  <p className="text-sm text-gray-600">Photos datées, factures originales, captures d&apos;écran horodatées</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Historique de Communication</p>
                  <p className="text-sm text-gray-600">Échanges entre hôte et voyageur, tentatives de résolution amiable</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Historique des Utilisateurs</p>
                  <p className="text-sm text-gray-600">Avis précédents, nombre de réservations, comportement passé</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Règles de la Plateforme</p>
                  <p className="text-sm text-gray-600">CGU, politique d&apos;annulation, standards de la communauté</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Montants et Compensations */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Montants et Compensations</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Dommages Matériels</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Montant maximum :</strong> 2 000€ par incident (au-delà, procédure judiciaire)
              </li>
              <li>
                <strong>Vétusté appliquée :</strong> Dépréciation selon l&apos;âge de l&apos;objet
              </li>
              <li>
                <strong>Franchise :</strong> 25€ (dommages inférieurs non remboursés)
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Remboursements Voyageurs</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Annulation hôte :</strong> Remboursement intégral + 50€ de compensation
              </li>
              <li>
                <strong>Problème majeur :</strong> Remboursement partiel ou total selon gravité
              </li>
              <li>
                <strong>Problème mineur :</strong> Compensation de 10% à 30% du montant
              </li>
            </ul>
          </section>

          {/* 6. Recours */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Recours et Médiation</h2>

            <p className="text-gray-600 mb-4">
              Si vous n&apos;êtes pas satisfait de la décision de Lok&apos;Room :
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Recours Interne</h3>
              <p className="text-sm text-blue-800">
                Vous pouvez demander un réexamen de votre dossier dans les <strong>7 jours</strong> suivant la décision.
                Envoyez un email à <a href="mailto:recours@lokroom.com" className="underline">recours@lokroom.com</a> avec
                des éléments nouveaux ou des arguments supplémentaires.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Médiation Externe</h3>
              <p className="text-sm text-gray-700 mb-2">
                En cas de désaccord persistant, vous pouvez saisir un médiateur de la consommation :
              </p>
              <p className="text-sm text-gray-600">
                <strong>Médiateur de la consommation :</strong> [À définir]<br />
                <strong>Site web :</strong> [À définir]<br />
                <strong>Gratuit</strong> pour les consommateurs
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact</h2>

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
        </div>
      </main>
    </div>
  );
}
