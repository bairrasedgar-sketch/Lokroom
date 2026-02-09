// apps/web/src/app/notifications/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-8 w-32 bg-gray-100 rounded" />
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
