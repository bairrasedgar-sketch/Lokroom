// apps/web/src/app/reviews/success/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center space-y-6 animate-pulse">
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />

        <div className="flex gap-4 justify-center pt-6">
          <div className="h-10 w-40 bg-gray-100 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
