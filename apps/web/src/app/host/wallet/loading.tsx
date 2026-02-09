// apps/web/src/app/host/wallet/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />

        {/* Balance Card */}
        <div className="border rounded-lg p-8 text-center space-y-4">
          <div className="h-4 w-32 bg-gray-100 rounded mx-auto" />
          <div className="h-12 w-48 bg-gray-200 rounded mx-auto" />
          <div className="flex gap-4 justify-center">
            <div className="h-10 w-32 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-8 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
