"use client";

import { useState } from "react";

export default function WithdrawButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function withdraw() {
    setLoading(true);
    setMsg(null);
    try {
      // En dev: émulation (?dev=1). En prod: vrai transfer (pas de param)
      const isDev = process.env.NODE_ENV !== "production";
      const url = isDev ? "/api/host/release?dev=1" : "/api/host/release";

      const res = await fetch(url, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Échec du virement");

      const released = j?.released ?? 0;
      if (released > 0) {
        setMsg(`✅ Virement déclenché (${released} transfert${released > 1 ? "s" : ""}).`);
      } else {
        const reason = j?.skipped?.[0]?.reason ?? "Aucun fonds disponible";
        setMsg(`ℹ️ ${reason}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={withdraw}
        disabled={loading}
        className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "Traitement…" : "Retirer mes fonds"}
      </button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
