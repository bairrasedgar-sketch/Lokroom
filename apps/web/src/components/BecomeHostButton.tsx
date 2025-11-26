// apps/web/src/components/BecomeHostButton.tsx
"use client";

import { useState } from "react";

export function BecomeHostButton() {
  const [loading, setLoading] = useState(false);

  async function go() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/host/onboard", { method: "POST" });

      // read text, then try JSON
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // keep raw text
      }

      if (!res.ok) {
        const msg = data?.error || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const url: string | undefined = data?.url;
      if (!url) {
        throw new Error("Stripe onboarding URL manquante dans la réponse.");
      }

      // 🔁 Redirection vers Stripe
      window.location.href = url;
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Erreur inconnue lors de l'onboarding hôte",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
    >
      {loading ? "Redirection vers Stripe…" : "Activer les paiements Lok’Room"}
    </button>
  );
}
