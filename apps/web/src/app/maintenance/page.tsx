/**
 * Page de maintenance publique
 * Affichée quand le mode maintenance est activé
 */
import { prisma } from "@/lib/db";
import Link from "next/link";

async function getMaintenanceMessage() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "maintenanceMessage" },
    });
    return (config?.value as string) || null;
  } catch {
    return null;
  }
}

export default async function MaintenancePage() {
  const customMessage = await getMaintenanceMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Header simple */}
      <header className="p-6">
        <div className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Lok&apos;Room</span>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Illustration */}
          <div className="mb-10 relative">
            {/* Maison avec outils */}
            <div className="w-72 h-72 mx-auto relative">
              {/* Cercle de fond */}
              <div className="absolute inset-0 bg-gray-100 rounded-full" />

              {/* Maison */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Toit */}
                  <div className="w-0 h-0 border-l-[80px] border-r-[80px] border-b-[50px] border-l-transparent border-r-transparent border-b-gray-900 mx-auto" />

                  {/* Corps de la maison */}
                  <div className="w-40 h-28 bg-white border-4 border-gray-900 mx-auto -mt-1 relative">
                    {/* Porte */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-gray-900 rounded-t-lg">
                      <div className="absolute right-2 top-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                    </div>

                    {/* Fenêtre gauche */}
                    <div className="absolute top-3 left-3 w-10 h-10 bg-blue-100 border-2 border-gray-900 rounded">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-900" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-full bg-gray-900" />
                      </div>
                    </div>

                    {/* Fenêtre droite */}
                    <div className="absolute top-3 right-3 w-10 h-10 bg-blue-100 border-2 border-gray-900 rounded">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-900" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-full bg-gray-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engrenage animé */}
              <div className="absolute top-8 right-8 w-16 h-16 animate-[spin_8s_linear_infinite]">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-500">
                  <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Clé à molette */}
              <div className="absolute bottom-12 left-6 w-14 h-14 -rotate-45">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gray-600">
                  <path
                    d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Points décoratifs */}
              <div className="absolute top-16 left-16 w-3 h-3 bg-amber-400 rounded-full" />
              <div className="absolute bottom-20 right-12 w-2 h-2 bg-blue-400 rounded-full" />
              <div className="absolute top-24 right-20 w-2 h-2 bg-purple-400 rounded-full" />
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Nous revenons bientôt
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
            {customMessage || "Notre équipe travaille dur pour améliorer votre expérience. Lok'Room sera de retour très rapidement !"}
          </p>

          {/* Barre de progression animée */}
          <div className="max-w-sm mx-auto mb-10">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gray-900 rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 mt-3">Maintenance en cours...</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réessayer
            </Link>
            <a
              href="mailto:support@lokroom.com"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Nous contacter
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Lok&apos;Room. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
