export default function LoadingListings() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-8 w-36 bg-gray-200 rounded" />
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
