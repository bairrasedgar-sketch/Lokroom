// apps/web/src/app/listings/loading.tsx
export default function LoadingListings() {
  const cards = Array.from({ length: 6 });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 lg:flex-row">
      {/* Colonne gauche : skeleton liste */}
      <section className="flex-1 space-y-4 lg:max-w-[55%]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-full bg-gray-200 animate-pulse" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-40 rounded bg-gray-100 animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-gray-100 animate-pulse" />
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((_, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-gray-100 animate-pulse" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Colonne droite : skeleton map */}
      <aside className="sticky top-24 hidden h-[600px] flex-1 lg:block">
        <div className="h-full w-full overflow-hidden rounded-3xl border bg-gray-100 animate-pulse" />
      </aside>
    </main>
  );
}
