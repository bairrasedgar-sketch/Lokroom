"use client";

import Link from "next/link";

export default function CancellationPage() {
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
          Politique d&apos;Annulation et de Remboursement
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-600">
              Cette politique explique les conditions d&apos;annulation et de remboursement
              applicables aux réservations effectuées sur Lok&apos;Room. Les conditions
              spécifiques dépendent de la politique choisie par l&apos;Hôte pour son annonce.
            </p>
          </section>

          {/* Politiques d'annulation */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Politiques d&apos;annulation pour les Voyageurs</h2>
            <p className="text-gray-600 mb-4">
              Chaque annonce sur Lok&apos;Room est associée à l&apos;une des politiques d&apos;annulation
              suivantes, définie par l&apos;Hôte :
            </p>

            {/* Flexible */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-medium text-gray-900">Flexible</h3>
              </div>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Annulation jusqu&apos;à 24h avant l&apos;arrivée :</strong> Remboursement intégral
                  (hors frais de service)
                </li>
                <li>
                  <strong>Annulation moins de 24h avant :</strong> Première nuit non remboursée,
                  reste du séjour remboursé
                </li>
                <li>
                  <strong>Après le début du séjour :</strong> Nuits restantes remboursées à 100%
                </li>
              </ul>
            </div>

            {/* Modérée */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="text-lg font-medium text-gray-900">Modérée</h3>
              </div>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Annulation jusqu&apos;à 5 jours avant l&apos;arrivée :</strong> Remboursement intégral
                  (hors frais de service)
                </li>
                <li>
                  <strong>Annulation moins de 5 jours avant :</strong> Remboursement de 50%
                  du montant total
                </li>
                <li>
                  <strong>Après le début du séjour :</strong> Nuits restantes remboursées à 50%
                </li>
              </ul>
            </div>

            {/* Stricte */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-medium text-gray-900">Stricte</h3>
              </div>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Annulation jusqu&apos;à 7 jours avant l&apos;arrivée :</strong> Remboursement de 50%
                  (hors frais de service)
                </li>
                <li>
                  <strong>Annulation moins de 7 jours avant :</strong> Aucun remboursement
                </li>
                <li>
                  <strong>Après le début du séjour :</strong> Aucun remboursement
                </li>
              </ul>
            </div>

            {/* Non remboursable */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="text-lg font-medium text-gray-900">Non remboursable</h3>
              </div>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Tarif réduit</strong> en échange de l&apos;absence de remboursement
                </li>
                <li>
                  <strong>Aucun remboursement</strong> quelle que soit la date d&apos;annulation
                </li>
                <li>
                  <strong>Exception :</strong> Remboursement possible en cas de circonstances
                  exceptionnelles (voir section 5)
                </li>
              </ul>
            </div>
          </section>

          {/* Tableau récapitulatif */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Tableau récapitulatif</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium border-b">Politique</th>
                    <th className="text-left py-3 px-4 font-medium border-b">Délai d&apos;annulation</th>
                    <th className="text-left py-3 px-4 font-medium border-b">Remboursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4 font-medium text-green-700">Flexible</td>
                    <td className="py-3 px-4">24h avant</td>
                    <td className="py-3 px-4">100%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-yellow-700">Modérée</td>
                    <td className="py-3 px-4">5 jours avant</td>
                    <td className="py-3 px-4">100%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-orange-700">Stricte</td>
                    <td className="py-3 px-4">7 jours avant</td>
                    <td className="py-3 px-4">50%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-red-700">Non remboursable</td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4">0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Annulation par l'hôte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Annulation par l&apos;Hôte</h2>
            <p className="text-gray-600 mb-4">
              Si un Hôte annule une réservation confirmée :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Le Voyageur reçoit un <strong>remboursement intégral</strong> (y compris les frais de service)</li>
              <li>Lok&apos;Room aide le Voyageur à trouver un <strong>logement alternatif</strong> si possible</li>
              <li>L&apos;Hôte peut être soumis à des <strong>pénalités</strong> (frais, blocage de calendrier, avertissement)</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Pénalités pour les Hôtes :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Première annulation : Avertissement</li>
                <li>Annulations répétées : Frais jusqu&apos;à 100€ par annulation</li>
                <li>Annulations fréquentes : Suspension temporaire ou définitive du compte</li>
              </ul>
            </div>
          </section>

          {/* Frais de service */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Frais de service</h2>
            <p className="text-gray-600 mb-4">
              Concernant les frais de service Lok&apos;Room :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Annulation dans les délais :</strong> Frais de service intégralement remboursés
              </li>
              <li>
                <strong>Annulation hors délais :</strong> Frais de service non remboursables,
                sauf circonstances exceptionnelles
              </li>
              <li>
                <strong>Annulation par l&apos;Hôte :</strong> Frais de service toujours remboursés au Voyageur
              </li>
            </ul>
          </section>

          {/* Circonstances exceptionnelles */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Circonstances exceptionnelles</h2>
            <p className="text-gray-600 mb-4">
              Un remboursement intégral peut être accordé, quelle que soit la politique
              d&apos;annulation, dans les situations suivantes :
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Événements majeurs</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Catastrophes naturelles (séisme, inondation, ouragan)</li>
                  <li>Épidémies ou pandémies avec restrictions de voyage</li>
                  <li>Conflits armés ou actes terroristes</li>
                  <li>Restrictions gouvernementales de déplacement</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Situations personnelles graves</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Décès d&apos;un proche (conjoint, parent, enfant)</li>
                  <li>Maladie grave nécessitant une hospitalisation</li>
                  <li>Blessure grave documentée par un certificat médical</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Problèmes liés au logement</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Logement non conforme à l&apos;annonce (problèmes majeurs)</li>
                  <li>Logement insalubre ou dangereux</li>
                  <li>Impossibilité d&apos;accéder au logement</li>
                  <li>Équipements essentiels non fonctionnels</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              <strong>Note :</strong> Des justificatifs peuvent être demandés pour valider
              ces circonstances exceptionnelles.
            </p>
          </section>

          {/* Procédure de remboursement */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Procédure de remboursement</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Annuler la réservation</h4>
                  <p className="text-gray-600">
                    Rendez-vous dans « Mes voyages » et cliquez sur « Annuler la réservation ».
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Calcul automatique</h4>
                  <p className="text-gray-600">
                    Le montant du remboursement est calculé selon la politique de l&apos;annonce.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Traitement du remboursement</h4>
                  <p className="text-gray-600">
                    Le remboursement est initié sous 24-48h vers le moyen de paiement d&apos;origine.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Réception des fonds</h4>
                  <p className="text-gray-600">
                    Comptez 5 à 10 jours ouvrés selon votre banque pour voir le remboursement sur votre compte.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Modifications de réservation */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Modifications de réservation</h2>
            <p className="text-gray-600 mb-4">
              Si vous souhaitez modifier votre réservation (dates, nombre de voyageurs) :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Contactez l&apos;Hôte pour demander une modification</li>
              <li>Si l&apos;Hôte accepte, la réservation est mise à jour</li>
              <li>Un ajustement de prix peut être appliqué selon les nouvelles dates</li>
              <li>Si l&apos;Hôte refuse, vous pouvez annuler selon la politique en vigueur</li>
            </ul>
          </section>

          {/* Litiges */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Résolution des litiges</h2>
            <p className="text-gray-600 mb-4">
              En cas de désaccord sur une annulation ou un remboursement :
            </p>
            <ol className="list-decimal pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Contactez l&apos;Hôte/Voyageur</strong> via la messagerie Lok&apos;Room
                pour tenter une résolution amiable
              </li>
              <li>
                <strong>Contactez le support Lok&apos;Room</strong> si aucun accord n&apos;est trouvé
              </li>
              <li>
                <strong>Médiation</strong> : Notre équipe analysera la situation et prendra
                une décision équitable
              </li>
            </ol>
            <p className="text-gray-600 mt-4">
              Délai pour signaler un problème : <strong>24 heures</strong> après l&apos;arrivée
              pour les problèmes liés au logement.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-600">
              Pour toute question concernant les annulations et remboursements :{" "}
              <a href="mailto:support@lokroom.com" className="text-gray-900 underline hover:no-underline">
                support@lokroom.com
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
