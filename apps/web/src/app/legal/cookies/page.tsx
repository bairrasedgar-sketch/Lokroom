"use client";

import Link from "next/link";

export default function CookiesPage() {
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
          Politique de Cookies
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p className="text-gray-600 mb-4">
              Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone,
              tablette) lorsque vous visitez un site web. Les cookies permettent au site de mémoriser
              vos actions et préférences (connexion, langue, taille de police, etc.) pendant une
              période donnée.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Types de cookies utilisés</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Cookies strictement nécessaires</h3>
            <p className="text-gray-600 mb-3">
              Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas être désactivés.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">Cookie</th>
                    <th className="text-left py-2 px-3 font-medium">Finalité</th>
                    <th className="text-left py-2 px-3 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">session_token</td>
                    <td className="py-2 px-3">Maintenir votre session de connexion</td>
                    <td className="py-2 px-3">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">csrf_token</td>
                    <td className="py-2 px-3">Sécurité (protection CSRF)</td>
                    <td className="py-2 px-3">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">cookie_consent</td>
                    <td className="py-2 px-3">Mémoriser vos préférences de cookies</td>
                    <td className="py-2 px-3">1 an</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Cookies de performance/analytiques</h3>
            <p className="text-gray-600 mb-3">
              Ces cookies nous permettent de mesurer l&apos;audience et d&apos;améliorer notre site.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">Cookie</th>
                    <th className="text-left py-2 px-3 font-medium">Finalité</th>
                    <th className="text-left py-2 px-3 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">_ga</td>
                    <td className="py-2 px-3">Google Analytics - identification du visiteur</td>
                    <td className="py-2 px-3">2 ans</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">_gid</td>
                    <td className="py-2 px-3">Google Analytics - identification du visiteur</td>
                    <td className="py-2 px-3">24h</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">_gat</td>
                    <td className="py-2 px-3">Google Analytics - limiter le taux de requêtes</td>
                    <td className="py-2 px-3">1 min</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Cookies de fonctionnalité</h3>
            <p className="text-gray-600 mb-3">
              Ces cookies permettent des fonctionnalités améliorées et personnalisées.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">Cookie</th>
                    <th className="text-left py-2 px-3 font-medium">Finalité</th>
                    <th className="text-left py-2 px-3 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">locale</td>
                    <td className="py-2 px-3">Mémoriser votre langue préférée</td>
                    <td className="py-2 px-3">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">currency</td>
                    <td className="py-2 px-3">Mémoriser votre devise préférée</td>
                    <td className="py-2 px-3">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">recent_searches</td>
                    <td className="py-2 px-3">Historique de recherches récentes</td>
                    <td className="py-2 px-3">30 jours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.4 Cookies de ciblage/marketing</h3>
            <p className="text-gray-600 mb-3">
              Ces cookies sont utilisés pour afficher des publicités pertinentes. Ils ne sont déposés
              qu&apos;avec votre consentement.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">Cookie</th>
                    <th className="text-left py-2 px-3 font-medium">Finalité</th>
                    <th className="text-left py-2 px-3 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">_fbp</td>
                    <td className="py-2 px-3">Facebook Pixel - suivi des conversions</td>
                    <td className="py-2 px-3">3 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Cookies tiers</h2>
            <p className="text-gray-600 mb-4">
              Certains services tiers intégrés à notre site peuvent déposer leurs propres cookies :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Google Maps</strong> - pour afficher les cartes et localisations</li>
              <li><strong>Stripe</strong> - pour le traitement sécurisé des paiements</li>
              <li><strong>Google Analytics</strong> - pour l&apos;analyse d&apos;audience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Gérer vos préférences</h2>
            <p className="text-gray-600 mb-4">
              Vous pouvez à tout moment modifier vos préférences de cookies :
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Sur notre site</h4>
              <p className="text-gray-600 mb-4">
                Cliquez sur le bouton ci-dessous pour ouvrir les paramètres de cookies :
              </p>
              <button
                onClick={() => {
                  // Trigger cookie banner
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("openCookieSettings"));
                  }
                }}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Paramètres de cookies
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-800 mb-3">Via votre navigateur</h4>
              <p className="text-gray-600 mb-4">
                Vous pouvez également configurer votre navigateur pour accepter ou refuser les cookies :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:no-underline">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a href="https://support.mozilla.org/fr/kb/cookies" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:no-underline">
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:no-underline">
                    Safari
                  </a>
                </li>
                <li>
                  <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:no-underline">
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Conséquences du refus</h2>
            <p className="text-gray-600 mb-4">
              Si vous refusez certains cookies :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Cookies strictement nécessaires :</strong> Le site peut ne pas fonctionner correctement</li>
              <li><strong>Cookies analytiques :</strong> Nous ne pourrons pas améliorer nos services</li>
              <li><strong>Cookies de fonctionnalité :</strong> Vos préférences ne seront pas mémorisées</li>
              <li><strong>Cookies marketing :</strong> Vous verrez des publicités moins pertinentes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Durée de conservation</h2>
            <p className="text-gray-600 mb-4">
              Les cookies de session sont supprimés à la fermeture de votre navigateur.
              Les cookies persistants ont une durée de vie variable selon leur finalité
              (voir les tableaux ci-dessus), mais jamais supérieure à 13 mois conformément
              aux recommandations de la CNIL.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Modifications</h2>
            <p className="text-gray-600">
              Nous pouvons mettre à jour cette Politique de Cookies. En cas de modification
              substantielle, nous vous demanderons de renouveler votre consentement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact</h2>
            <p className="text-gray-600">
              Pour toute question concernant notre utilisation des cookies :{" "}
              <a href="mailto:privacy@lokroom.com" className="text-gray-900 underline hover:no-underline">
                privacy@lokroom.com
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
