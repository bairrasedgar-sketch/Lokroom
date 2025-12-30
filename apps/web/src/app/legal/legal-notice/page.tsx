"use client";

import Link from "next/link";

export default function LegalNoticePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mentions Légales
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h2>
            <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Lok&apos;Room SAS</p>
              <p>Société par Actions Simplifiée au capital de 10 000 €</p>
              <p>Siège social : Paris, France</p>
              <p>RCS Paris : [En cours d&apos;immatriculation]</p>
              <p>SIRET : [En cours d&apos;immatriculation]</p>
              <p>N° TVA Intracommunautaire : [En cours d&apos;attribution]</p>
              <p className="mt-4">
                <strong>Directeur de la publication :</strong> [Nom du dirigeant]
              </p>
              <p>
                <strong>Email :</strong>{" "}
                <a href="mailto:contact@lokroom.com" className="text-gray-900 underline">
                  contact@lokroom.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hébergement</h2>
            <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Vercel Inc.</p>
              <p>340 S Lemon Ave #4133</p>
              <p>Walnut, CA 91789, États-Unis</p>
              <p>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">
                  www.vercel.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Activité</h2>
            <p className="text-gray-600 mb-4">
              Lok&apos;Room est une plateforme de mise en relation entre des propriétaires
              d&apos;espaces (« Hôtes ») et des personnes souhaitant louer ces espaces
              (« Voyageurs ») pour des séjours de courte durée.
            </p>
            <p className="text-gray-600">
              Lok&apos;Room agit en qualité d&apos;intermédiaire technique et n&apos;est pas
              partie aux contrats de location conclus entre les Hôtes et les Voyageurs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
            <p className="text-gray-600 mb-4">
              L&apos;ensemble du contenu du site Lok&apos;Room (structure, textes, logos,
              images, vidéos, sons, logiciels, icônes, mise en page, base de données, etc.)
              est la propriété exclusive de Lok&apos;Room ou de ses partenaires et est protégé
              par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="text-gray-600 mb-4">
              Toute reproduction, représentation, modification, publication, transmission,
              ou plus généralement toute exploitation non autorisée du site ou de son contenu,
              par quelque procédé que ce soit, est interdite et constitue une contrefaçon
              sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
            <p className="text-gray-600">
              Les marques et logos figurant sur le site sont des marques déposées.
              Toute reproduction ou représentation, totale ou partielle, de ces marques
              ou logos, sans l&apos;autorisation expresse de Lok&apos;Room, est interdite.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Données personnelles</h2>
            <p className="text-gray-600 mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à
              la loi Informatique et Libertés, vous disposez de droits sur vos données personnelles.
            </p>
            <p className="text-gray-600 mb-4">
              Pour en savoir plus sur la collecte et le traitement de vos données, consultez notre{" "}
              <Link href="/legal/privacy" className="text-gray-900 underline hover:no-underline">
                Politique de Confidentialité
              </Link>
              .
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p><strong>Délégué à la Protection des Données (DPO) :</strong></p>
              <p>
                Email :{" "}
                <a href="mailto:dpo@lokroom.com" className="text-gray-900 underline">
                  dpo@lokroom.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
            <p className="text-gray-600">
              Le site Lok&apos;Room utilise des cookies. Pour en savoir plus sur l&apos;utilisation
              des cookies et gérer vos préférences, consultez notre{" "}
              <Link href="/legal/cookies" className="text-gray-900 underline hover:no-underline">
                Politique de Cookies
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Liens hypertextes</h2>
            <p className="text-gray-600 mb-4">
              Le site Lok&apos;Room peut contenir des liens hypertextes vers d&apos;autres sites.
              Lok&apos;Room n&apos;exerce aucun contrôle sur ces sites et décline toute
              responsabilité quant à leur contenu.
            </p>
            <p className="text-gray-600">
              La création de liens hypertextes vers le site Lok&apos;Room est soumise à
              l&apos;accord préalable de l&apos;éditeur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Médiation</h2>
            <p className="text-gray-600 mb-4">
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, Lok&apos;Room
              propose un dispositif de médiation de la consommation. Vous pouvez recourir
              gratuitement au service de médiation en cas de litige.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p><strong>Médiateur de la consommation :</strong></p>
              <p>[Nom du médiateur à définir]</p>
              <p>Site : [URL du médiateur]</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Droit applicable</h2>
            <p className="text-gray-600">
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige et à défaut de résolution amiable, les tribunaux français
              seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant le site ou ces mentions légales :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p>
                Email :{" "}
                <a href="mailto:legal@lokroom.com" className="text-gray-900 underline">
                  legal@lokroom.com
                </a>
              </p>
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
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
