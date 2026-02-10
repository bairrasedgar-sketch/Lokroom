"use client";

import Link from "next/link";

export default function HouseRulesPage() {
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
          Règles d&apos;Usage des Espaces
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              Ces règles s&apos;appliquent à tous les espaces disponibles sur Lok&apos;Room. Les hôtes peuvent définir
              des règles supplémentaires spécifiques à leur espace, qui seront affichées dans l&apos;annonce.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium">
                💡 En réservant un espace, vous acceptez automatiquement ces règles ainsi que les règles
                spécifiques de l&apos;hôte.
              </p>
            </div>
          </section>

          {/* 1. Capacité et Voyageurs */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Capacité et Voyageurs</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.1 Respect de la Capacité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Nombre maximum :</strong> Ne jamais dépasser le nombre de voyageurs indiqué dans la réservation
              </li>
              <li>
                <strong>Invités supplémentaires :</strong> Interdits sans accord préalable de l&apos;hôte
              </li>
              <li>
                <strong>Modification :</strong> Contactez l&apos;hôte AVANT d&apos;amener des personnes supplémentaires
              </li>
            </ul>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                ⚠️ Conséquences du dépassement de capacité :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li>L&apos;hôte peut refuser l&apos;accès ou demander le départ immédiat</li>
                <li>Aucun remboursement en cas d&apos;expulsion</li>
                <li>Frais supplémentaires possibles</li>
                <li>Impact négatif sur votre réputation</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">1.2 Mineurs</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Les mineurs (moins de 18 ans) doivent être accompagnés d&apos;un adulte</li>
              <li>L&apos;adulte responsable doit être présent pendant toute la durée du séjour</li>
              <li>Certains espaces peuvent interdire les mineurs (indiqué dans l&apos;annonce)</li>
            </ul>
          </section>

          {/* 2. Horaires */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Horaires</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Check-in et Check-out</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">Check-in</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Respecter l&apos;heure convenue</li>
                  <li>• Prévenir si retard &gt; 30 min</li>
                  <li>• Instructions envoyées 24h avant</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">Check-out</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Quitter à l&apos;heure exacte</li>
                  <li>• Laisser l&apos;espace propre</li>
                  <li>• Verrouiller et rendre les clés</li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Dépassement d&apos;Horaires</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Check-out tardif :</strong> Frais supplémentaires possibles (tarif horaire de l&apos;espace)
              </li>
              <li>
                <strong>Sans accord préalable :</strong> L&apos;hôte peut facturer jusqu&apos;à 2x le tarif horaire
              </li>
              <li>
                <strong>Prolongation :</strong> Contactez l&apos;hôte AVANT l&apos;heure de check-out
              </li>
            </ul>
          </section>

          {/* 3. Bruit et Nuisances */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Bruit et Nuisances</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Niveaux Sonores</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-900 text-sm">Niveau acceptable</p>
                  <p className="text-xs text-green-800">Conversation normale, musique d&apos;ambiance faible, activités calmes</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-900 text-sm">Niveau modéré (accord requis)</p>
                  <p className="text-xs text-amber-800">Musique forte, activités bruyantes, événements - Vérifier avec l&apos;hôte</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium text-red-900 text-sm">Niveau inacceptable</p>
                  <p className="text-xs text-red-800">Bruit excessif après 22h, nuisances répétées, plaintes du voisinage</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Horaires de Tranquillité</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>22h - 8h :</strong> Niveau sonore réduit obligatoire (sauf autorisation spéciale)
              </li>
              <li>
                <strong>Voisinage :</strong> Respecter les règles de copropriété et les lois locales
              </li>
              <li>
                <strong>Plaintes :</strong> En cas de plainte du voisinage, réduire immédiatement le bruit
              </li>
            </ul>
          </section>

          {/* 4. Fêtes et Événements */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Fêtes et Événements</h2>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-2">
                ⚠️ Règle générale : Les fêtes sont INTERDITES sauf autorisation explicite de l&apos;hôte
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.1 Définition d&apos;une Fête</h3>
            <p className="text-gray-600 mb-2">Est considéré comme une fête :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Rassemblement de plus de personnes que la capacité réservée</li>
              <li>Musique forte ou système de sonorisation</li>
              <li>Consommation excessive d&apos;alcool</li>
              <li>Événement organisé (anniversaire, soirée à thème, etc.)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.2 Événements Autorisés</h3>
            <p className="text-gray-600 mb-2">
              Si l&apos;hôte autorise les événements, vous devez :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Déclarer le type d&apos;événement lors de la réservation</li>
              <li>Respecter le nombre maximum de participants</li>
              <li>Souscrire une assurance événementielle si requis</li>
              <li>Nettoyer l&apos;espace après l&apos;événement</li>
            </ul>
          </section>

          {/* 5. Tabac et Substances */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Tabac et Substances</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Tabac</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Règle par défaut :</p>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li><strong>Intérieur :</strong> Interdit (sauf mention "Fumeurs acceptés" dans l&apos;annonce)</li>
                <li><strong>Extérieur :</strong> Autorisé si espace extérieur privé disponible</li>
                <li><strong>Cigarette électronique :</strong> Même règle que le tabac classique</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Substances Illégales</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                ❌ Strictement interdit :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li>Consommation, possession ou vente de drogues illégales</li>
                <li>Expulsion immédiate sans remboursement</li>
                <li>Signalement aux autorités si nécessaire</li>
                <li>Suspension définitive du compte</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.3 Alcool</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Consommation modérée autorisée (sauf indication contraire)</li>
              <li>Interdiction de consommation excessive causant des nuisances</li>
              <li>Certains espaces peuvent interdire l&apos;alcool (indiqué dans l&apos;annonce)</li>
            </ul>
          </section>

          {/* 6. Animaux */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Animaux</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.1 Règle Générale</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ Les animaux sont INTERDITS sauf mention "Animaux acceptés" dans l&apos;annonce
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.2 Animaux d&apos;Assistance</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Les chiens d&apos;assistance sont toujours autorisés (obligation légale)</li>
              <li>Certificat officiel requis</li>
              <li>Informer l&apos;hôte lors de la réservation</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.3 Si Animaux Autorisés</h3>
            <p className="text-gray-600 mb-2">Vous devez :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Déclarer l&apos;animal lors de la réservation</li>
              <li>Respecter le nombre et type d&apos;animaux autorisés</li>
              <li>Nettoyer les poils et dégâts causés</li>
              <li>Ne pas laisser l&apos;animal seul si interdit</li>
              <li>Payer les frais supplémentaires si applicables</li>
            </ul>
          </section>

          {/* 7. Propreté et Entretien */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Propreté et Entretien</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.1 Pendant le Séjour</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Maintenir l&apos;espace propre et rangé</li>
              <li>Jeter les déchets dans les poubelles appropriées</li>
              <li>Respecter le tri sélectif si en place</li>
              <li>Signaler immédiatement tout dégât ou dysfonctionnement</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.2 Au Check-out</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                ✓ État attendu au départ :
              </p>
              <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                <li>Vaisselle lavée et rangée (si cuisine utilisée)</li>
                <li>Poubelles vidées</li>
                <li>Surfaces essuyées</li>
                <li>Mobilier remis en place</li>
                <li>Fenêtres fermées, lumières éteintes</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.3 Frais de Ménage</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Les frais de ménage couvrent le nettoyage standard</li>
              <li>Frais supplémentaires si l&apos;espace est laissé très sale</li>
              <li>Montant maximum : 100€ (au-delà = litige)</li>
            </ul>
          </section>

          {/* 8. Sécurité */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Sécurité</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.1 Équipements de Sécurité</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Détecteurs de fumée :</strong> Ne jamais désactiver ou retirer
              </li>
              <li>
                <strong>Extincteurs :</strong> Savoir où ils se trouvent
              </li>
              <li>
                <strong>Issues de secours :</strong> Ne jamais bloquer
              </li>
              <li>
                <strong>Alarmes :</strong> Ne pas désactiver sans accord de l&apos;hôte
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.2 Activités Dangereuses</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                ❌ Strictement interdit :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li>Utiliser des bougies, encens ou flammes nues (sauf autorisation)</li>
                <li>Cuisiner avec des équipements non fournis</li>
                <li>Surcharger les prises électriques</li>
                <li>Modifier les installations (électricité, plomberie)</li>
                <li>Activités dangereuses ou illégales</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.3 Urgences</h3>
            <p className="text-gray-600 mb-2">En cas d&apos;urgence :</p>
            <ol className="list-decimal pl-6 text-gray-600 space-y-1">
              <li>Appeler les secours (15, 17, 18, 112)</li>
              <li>Évacuer si nécessaire</li>
              <li>Contacter l&apos;hôte immédiatement</li>
              <li>Contacter support@lokroom.com avec "URGENT" dans l&apos;objet</li>
            </ol>
          </section>

          {/* 9. Vie Privée et Enregistrements */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Vie Privée et Enregistrements</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.1 Caméras de Surveillance</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Espaces intérieurs :</strong> Caméras interdites (sauf espaces communs déclarés)
              </li>
              <li>
                <strong>Espaces extérieurs :</strong> Caméras autorisées si déclarées dans l&apos;annonce
              </li>
              <li>
                <strong>Obligation :</strong> L&apos;hôte doit indiquer tous les dispositifs d&apos;enregistrement
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.2 Vos Enregistrements</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium mb-2">
                ⚠️ Vous ne pouvez PAS :
              </p>
              <ul className="list-disc pl-6 text-sm text-amber-800 space-y-1">
                <li>Installer vos propres caméras ou dispositifs d&apos;enregistrement</li>
                <li>Filmer ou photographier l&apos;espace à des fins commerciales sans accord</li>
                <li>Partager l&apos;adresse ou les codes d&apos;accès publiquement</li>
              </ul>
            </div>
          </section>

          {/* 10. Sanctions */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Sanctions en Cas de Non-Respect</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">10.1 Violations Mineures</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Avertissement de l&apos;hôte</li>
              <li>Impact négatif sur votre note</li>
              <li>Frais supplémentaires (ménage, dépassement horaire)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">10.2 Violations Graves</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                Conséquences possibles :
              </p>
              <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                <li>Expulsion immédiate sans remboursement</li>
                <li>Facturation des dommages</li>
                <li>Suspension ou fermeture du compte</li>
                <li>Signalement aux autorités si activité illégale</li>
                <li>Interdiction définitive de la plateforme</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">10.3 Exemples de Violations Graves</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Fête non autorisée</li>
              <li>Dépassement important de capacité</li>
              <li>Dommages intentionnels</li>
              <li>Activités illégales</li>
              <li>Nuisances répétées malgré avertissements</li>
              <li>Menaces ou violence envers l&apos;hôte ou le voisinage</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Questions et Support</h2>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Besoin de clarifications ?</h3>
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
                  Pour signaler une violation des règles pendant un séjour, contactez immédiatement l&apos;hôte
                  et notre support avec "URGENT" dans l&apos;objet.
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
              <Link href="/legal/guest-terms" className="text-blue-600 underline text-sm">
                → Conditions pour les Voyageurs
              </Link>
              <Link href="/legal/disputes" className="text-blue-600 underline text-sm">
                → Politique de Gestion des Litiges
              </Link>
              <Link href="/legal/community-standards" className="text-blue-600 underline text-sm">
                → Standards de la Communauté
              </Link>
              <Link href="/legal/cancellation" className="text-blue-600 underline text-sm">
                → Politique d&apos;Annulation
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
