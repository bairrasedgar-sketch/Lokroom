"use client";
import { useState } from "react";

export function BecomeHostButton() {
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/host/onboard", { method: "POST" });

      // read text, then try JSON
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* keep text */ }

      if (!res.ok) {
        const msg = data?.error || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const acct = data?.stripeAccountId || "(unknown)";
      alert("Compte hôte prêt ✅\nID: " + acct);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue");
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
      {loading ? "Création…" : "Devenir hôte"}
    </button>
  );
}
