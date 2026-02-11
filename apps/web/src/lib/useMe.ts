// apps/web/src/lib/useMe.ts
"use client";

import { useUser } from "@/hooks/useUser";

/**
 * @deprecated Use useUser from @/hooks/useUser instead
 * This is kept for backward compatibility
 */
export function useMe() {
  const { user, loading, error, mutate } = useUser();

  return {
    user,
    loading,
    error,
    refresh: mutate,
  };
}
