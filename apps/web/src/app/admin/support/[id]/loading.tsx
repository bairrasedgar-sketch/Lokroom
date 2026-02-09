// apps/web/src/app/admin/support/[id]/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Ticket Details */}
        <div className="border rounded-lg p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-100 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-100 rounded" />
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
