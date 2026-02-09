// apps/web/src/app/about/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-12 animate-pulse">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="h-12 w-96 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-full bg-gray-100 rounded" />
          <div className="h-6 w-5/6 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Image */}
        <div className="aspect-video bg-gray-100 rounded-lg" />

        {/* Content Sections */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        ))}

        {/* Team */}
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto" />
                <div className="h-5 w-32 bg-gray-100 rounded mx-auto" />
                <div className="h-4 w-24 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
