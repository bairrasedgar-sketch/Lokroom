// apps/web/src/app/offline/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6 animate-pulse">
        <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto" />
        <div className="h-10 w-80 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
      </div>
    </main>
  );
}
