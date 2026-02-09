// apps/web/src/app/legal/community-standards/loading.tsx
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
        {[...Array(7)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
            {/* Bullet Points */}
            <div className="pl-6 space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded w-4/6" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
