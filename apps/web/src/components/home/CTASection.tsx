import Link from "next/link";

type CTASectionProps = {
  isLoggedIn: boolean;
};

export function CTASection({ isLoggedIn }: CTASectionProps) {
  return (
    <section className="bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-[1800px] 3xl:max-w-[2200px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="rounded-2xl bg-gray-900 px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
            Vous avez un espace à louer ?
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-400 max-w-md mx-auto">
            Rejoignez notre communauté d&apos;hôtes et commencez à générer des revenus.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={isLoggedIn ? "/host/listings/new" : "/become-host"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-gray-900 transition-all hover:bg-gray-100"
            >
              {isLoggedIn ? "Créer une annonce" : "Devenir hôte"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/listings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 font-medium text-white transition-all hover:bg-gray-800"
            >
              Explorer les espaces
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
