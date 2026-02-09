// apps/web/src/app/legal/cookies/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        {/* Header */}
        <div className="space-y-4">
          <div className="h-10 w-96 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>

        {/* Content Sections */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        ))}

        {/* Cookie Types Table */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b pb-4 space-y-2">
              <div className="h-5 w-32 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
