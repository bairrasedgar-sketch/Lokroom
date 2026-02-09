// apps/web/src/app/login/2fa/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-48 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
        </div>

        {/* 2FA Input */}
        <div className="border rounded-lg p-8 space-y-6">
          <div className="flex justify-center gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 w-12 bg-gray-100 rounded" />
            ))}
          </div>

          <div className="h-10 bg-gray-200 rounded" />
        </div>

        {/* Links */}
        <div className="text-center">
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
        </div>
      </div>
    </main>
  );
}
