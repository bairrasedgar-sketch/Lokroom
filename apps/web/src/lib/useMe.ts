// apps/web/src/lib/useMe.ts
"use client";

import { useEffect, useState, useCallback } from "react";

type Role = "HOST" | "GUEST" | "BOTH" | "ADMIN";

type MeUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  hostProfile?: {
    payoutsEnabled: boolean;
    kycStatus: string;
  } | null;
  wallet?: {
    balanceCents: number;
  } | null;
};

type MeResponse = {
  user: MeUser | null;
};

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erreur lors de la récupération de /api/me");
      }

      const data: MeResponse = await res.json();
      setUser(data.user ?? null);
    } catch (e: unknown) {
      console.error(e);
      const error = e as { message?: string };
      setError(error?.message || "Erreur inconnue");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, error, refresh };
}
