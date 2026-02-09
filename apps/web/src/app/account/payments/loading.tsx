// apps/web/src/app/account/payments/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        {/* Payment Methods */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 flex items-center gap-4">
              <div className="h-12 w-16 bg-gray-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-8 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
