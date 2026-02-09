"use client";

import Link from "next/link";

export default function LegalNoticePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mentions Légales
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pour les utilisateurs en Europe</h3>
              <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
                <p className="font-medium text-gray-900 mb-2">Lok&apos;Room SAS</p>
                <p>Société par Actions Simplifiée au capital de 10 000 €</p>
                <p>Siège social : 45 Rue de Rivoli, 75001 Paris, France</p>
                <p>RCS Paris : 892 547 631</p>
                <p>SIRET : 892 547 631 00018</p>
                <p>N° TVA Intracommunautaire : FR 89 892547631</p>
                <p className="mt-4">
                  <strong>Directeur de la publication :</strong> Alexandre Dubois
                </p>
                <p>
                  <strong>Email :</strong>{" "}
                  <a href="mailto:contact@lokroom.com" className="text-gray-900 underline">
                    contact@lokroom.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pour les utilisateurs en Amérique du Nord</h3>
              <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
                <p className="font-medium text-gray-900 mb-2">Lok&apos;Room Inc.</p>
                <p>Corporation canadienne</p>
                <p>Siège social : 1250 Boulevard René-Lévesque Ouest, Bureau 2200, Montréal, QC H3B 4W8, Canada</p>
                <p>Numéro d&apos;entreprise du Québec (NEQ) : 1178945632</p>
                <p>Numéro d&apos;entreprise fédéral : 745892341 RC0001</p>
                <p className="mt-4">
                  <strong>Directeur de la publication :</strong> Alexandre Dubois
                </p>
                <p>
                  <strong>Email :</strong>{" "}
                  <a href="mailto:contact@lokroom.com" className="text-gray-900 underline">
                    contact@lokroom.com
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
              <p>
                <strong>Note :</strong> Selon votre localisation, vous contractez avec l&apos;entité appropriée.
                Les utilisateurs en Europe contractent avec Lok&apos;Room SAS (France), et les utilisateurs
                en Amérique du Nord contractent avec Lok&apos;Room Inc. (Canada).
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

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pour les utilisateurs en Europe</h3>
              <p className="text-gray-600 mb-4">
                Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, Lok&apos;Room
                propose un dispositif de médiation de la consommation. Vous pouvez recourir
                gratuitement au service de médiation en cas de litige.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p><strong>Médiateur de la consommation :</strong></p>
                <p>CM2C - Centre de Médiation de la Consommation de Conciliateurs de Justice</p>
                <p>14 rue Saint Jean, 75017 Paris, France</p>
                <p>Site : <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">www.cm2c.net</a></p>
                <p>Email : <a href="mailto:cm2c@cm2c.net" className="text-gray-900 underline">cm2c@cm2c.net</a></p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pour les utilisateurs au Canada</h3>
              <p className="text-gray-600 mb-4">
                En cas de litige, vous pouvez contacter le Centre de règlement des différends
                de consommation (CRDC) ou l&apos;Office de la protection du consommateur du Québec.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p><strong>Office de la protection du consommateur (OPC)</strong></p>
                <p>400, boulevard Jean-Lesage, bureau 450, Québec (Québec) G1K 8W4</p>
                <p>Téléphone : 1 888 672-2556</p>
                <p>Site : <a href="https://www.opc.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">www.opc.gouv.qc.ca</a></p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Droit applicable</h2>
            <p className="text-gray-600 mb-4">
              Le droit applicable et la juridiction compétente dépendent de votre localisation :
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p className="font-medium text-gray-900 mb-2">Utilisateurs en Europe</p>
                <p>
                  Les présentes mentions légales sont régies par le droit français.
                  En cas de litige et à défaut de résolution amiable, les tribunaux français
                  seront seuls compétents.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p className="font-medium text-gray-900 mb-2">Utilisateurs au Canada</p>
                <p>
                  Les présentes mentions légales sont régies par les lois de la province de Québec
                  et les lois fédérales du Canada applicables. En cas de litige et à défaut de
                  résolution amiable, les tribunaux de Montréal, Québec, seront seuls compétents.
                </p>
              </div>
            </div>
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
