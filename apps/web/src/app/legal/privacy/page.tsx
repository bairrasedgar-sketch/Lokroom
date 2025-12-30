"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room s&apos;engage à protéger la vie privée de ses utilisateurs. La présente
              Politique de Confidentialité explique comment nous collectons, utilisons, stockons
              et protégeons vos données personnelles conformément au Règlement Général sur la
              Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
            <p className="text-gray-600">
              En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Responsable du traitement</h2>
            <p className="text-gray-600 mb-4">
              Le responsable du traitement des données personnelles est :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p className="font-medium">Lok&apos;Room SAS</p>
              <p>Email : privacy@lokroom.com</p>
              <p>DPO (Délégué à la Protection des Données) : dpo@lokroom.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Données collectées</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Données que vous nous fournissez</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Données de profil :</strong> photo de profil, biographie, ville, pays</li>
              <li><strong>Données de paiement :</strong> informations de carte bancaire (traitées par Stripe)</li>
              <li><strong>Données de vérification d&apos;identité :</strong> pièce d&apos;identité (via Stripe Identity)</li>
              <li><strong>Communications :</strong> messages échangés avec d&apos;autres utilisateurs</li>
              <li><strong>Avis et commentaires :</strong> évaluations laissées après un séjour</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Données collectées automatiquement</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d&apos;exploitation</li>
              <li><strong>Données d&apos;utilisation :</strong> pages visitées, fonctionnalités utilisées, recherches effectuées</li>
              <li><strong>Données de localisation :</strong> localisation approximative basée sur l&apos;IP</li>
              <li><strong>Cookies :</strong> voir notre <Link href="/legal/cookies" className="text-gray-900 underline">Politique de Cookies</Link></li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">3.3 Données provenant de tiers</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Données d&apos;authentification via Google, Facebook, Apple (si connexion via ces services)</li>
              <li>Données de vérification d&apos;identité via Stripe</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Finalités du traitement</h2>
            <p className="text-gray-600 mb-4">Nous utilisons vos données pour :</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Finalité</th>
                    <th className="text-left py-2 font-medium">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 pr-4">Gestion de votre compte</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Traitement des réservations et paiements</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Communication entre utilisateurs</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Vérification d&apos;identité</td>
                    <td className="py-2">Intérêt légitime / Obligation légale</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Prévention de la fraude</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Amélioration de nos services</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Envoi de communications marketing</td>
                    <td className="py-2">Consentement</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Respect des obligations légales</td>
                    <td className="py-2">Obligation légale</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Partage des données</h2>
            <p className="text-gray-600 mb-4">Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Autres utilisateurs :</strong> profil public, avis, communications</li>
              <li><strong>Prestataires de services :</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Stripe (paiements et vérification d&apos;identité)</li>
                  <li>Google Cloud / AWS (hébergement)</li>
                  <li>Services d&apos;emailing</li>
                </ul>
              </li>
              <li><strong>Autorités :</strong> sur demande légale ou en cas de fraude</li>
            </ul>
            <p className="text-gray-600">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Transferts internationaux</h2>
            <p className="text-gray-600 mb-4">
              Certaines données peuvent être transférées vers des pays hors Union Européenne,
              notamment vers les États-Unis (services cloud, Stripe). Ces transferts sont encadrés par :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Le Data Privacy Framework (DPF) pour les États-Unis</li>
              <li>Les Clauses Contractuelles Types de la Commission Européenne</li>
              <li>Des garanties appropriées conformément au RGPD</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Conservation des données</h2>
            <p className="text-gray-600 mb-4">
              Nous conservons vos données pendant la durée nécessaire aux finalités pour lesquelles
              elles ont été collectées :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Données de compte :</strong> durée du compte + 3 ans après suppression</li>
              <li><strong>Données de transaction :</strong> 10 ans (obligation légale comptable)</li>
              <li><strong>Messages :</strong> 3 ans après la dernière interaction</li>
              <li><strong>Données de navigation :</strong> 13 mois maximum</li>
              <li><strong>Documents d&apos;identité :</strong> supprimés après vérification</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Vos droits (RGPD)</h2>
            <p className="text-gray-600 mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>

            <div className="space-y-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit d&apos;accès</h4>
                <p className="text-gray-600 text-sm">Obtenir une copie de toutes vos données personnelles</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit de rectification</h4>
                <p className="text-gray-600 text-sm">Corriger des données inexactes ou incomplètes</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit à l&apos;effacement (« droit à l&apos;oubli »)</h4>
                <p className="text-gray-600 text-sm">Demander la suppression de vos données</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit à la limitation</h4>
                <p className="text-gray-600 text-sm">Limiter le traitement de vos données dans certains cas</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit à la portabilité</h4>
                <p className="text-gray-600 text-sm">Recevoir vos données dans un format structuré et réutilisable</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800">Droit d&apos;opposition</h4>
                <p className="text-gray-600 text-sm">Vous opposer au traitement de vos données à des fins marketing</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Pour exercer ces droits, rendez-vous dans{" "}
              <Link href="/account/privacy" className="text-gray-900 underline hover:no-underline">
                Paramètres &gt; Confidentialité
              </Link>{" "}
              ou contactez-nous à privacy@lokroom.com.
            </p>

            <p className="text-gray-600">
              Vous pouvez également déposer une réclamation auprès de la CNIL :{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:no-underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Sécurité des données</h2>
            <p className="text-gray-600 mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger
              vos données :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des données sensibles au repos</li>
              <li>Authentification à deux facteurs disponible</li>
              <li>Accès restreint aux données (principe du moindre privilège)</li>
              <li>Audits de sécurité réguliers</li>
              <li>Formation du personnel</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Mineurs</h2>
            <p className="text-gray-600">
              Lok&apos;Room n&apos;est pas destiné aux personnes de moins de 18 ans. Nous ne collectons
              pas sciemment de données personnelles de mineurs. Si vous avez connaissance qu&apos;un
              mineur nous a fourni des données, contactez-nous immédiatement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Modifications</h2>
            <p className="text-gray-600">
              Nous pouvons mettre à jour cette Politique de Confidentialité. En cas de modification
              substantielle, nous vous en informerons par email ou via une notification sur la plateforme.
              Nous vous encourageons à consulter régulièrement cette page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact</h2>
            <p className="text-gray-600">
              Pour toute question concernant cette politique ou vos données personnelles :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4 text-gray-600">
              <p>Email : <a href="mailto:privacy@lokroom.com" className="text-gray-900 underline">privacy@lokroom.com</a></p>
              <p>DPO : <a href="mailto:dpo@lokroom.com" className="text-gray-900 underline">dpo@lokroom.com</a></p>
            </div>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
              CGU
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
