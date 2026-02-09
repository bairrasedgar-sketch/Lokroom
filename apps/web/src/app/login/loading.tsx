// apps/web/src/app/login/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

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
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-64 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Form */}
        <div className="border rounded-lg p-8">
          <FormSkeleton />
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
          <div className="h-4 w-56 bg-gray-100 rounded mx-auto" />
        </div>
      </div>
    </main>
  );
}
