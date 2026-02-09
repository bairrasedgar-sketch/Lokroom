// apps/web/src/app/help/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="text-center space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-96 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Search Bar */}
        <div className="h-14 bg-gray-100 rounded-full" />

        {/* Categories */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="h-12 w-12 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="h-4 w-64 bg-gray-100 rounded" />
                <div className="h-4 w-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
