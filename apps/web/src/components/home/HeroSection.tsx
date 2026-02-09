export function HeroSection() {
  return (
    <section className="relative bg-white pt-8 overflow-hidden">
      {/* Subtle Lok'Room themed background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating house icons - very subtle */}
        <svg className="absolute top-10 left-[10%] w-16 h-16 text-gray-200/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
        </svg>
        <svg className="absolute top-32 right-[15%] w-12 h-12 text-gray-200/30 rotate-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
        </svg>
        <svg className="absolute bottom-20 left-[20%] w-10 h-10 text-gray-200/25 -rotate-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
        </svg>

        {/* Key icons */}
        <svg className="absolute top-20 right-[8%] w-10 h-10 text-gray-200/30 rotate-45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
        <svg className="absolute bottom-32 right-[25%] w-8 h-8 text-gray-200/25 -rotate-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>

        {/* Building icons */}
        <svg className="absolute top-40 left-[5%] w-14 h-14 text-gray-200/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
        </svg>
        <svg className="absolute bottom-10 right-[10%] w-12 h-12 text-gray-200/25 rotate-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
        </svg>

        {/* Location pin */}
        <svg className="absolute top-16 left-[40%] w-8 h-8 text-gray-200/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1800px] 3xl:max-w-[2200px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Hero Content */}
        <div className="mx-auto max-w-3xl lg:max-w-4xl text-center transition-all duration-700 translate-y-0 opacity-100">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-gray-900">
            Trouvez l&apos;espace parfait
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-500">
            Appartements, bureaux, studios, espaces événementiels...
            <br className="hidden sm:block" />
            Réservez pour une heure ou plusieurs jours.
          </p>
        </div>
      </div>
    </section>
  );
}
