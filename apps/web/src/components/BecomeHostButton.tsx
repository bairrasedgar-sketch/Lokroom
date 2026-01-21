// apps/web/src/components/BecomeHostButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ---- util partagé : lance l'onboarding Stripe hôte ----
async function startHostOnboarding(setLoading?: (v: boolean) => void) {
  if (setLoading) setLoading(true);
  try {
    const res = await fetch("/api/host/onboard", { method: "POST" });

    // on lit d'abord le texte, puis on essaie du JSON
    const text = await res.text();
    let data: { error?: string; url?: string } | null = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // texte brut, pas grave
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
    if (setLoading) setLoading(false);
  }
}

// ---------------------------------------------------------
// 1) Bouton principal (comme avant) : Activer les paiements
// ---------------------------------------------------------
export function BecomeHostButton() {
  const [loading, setLoading] = useState(false);

  async function go() {
    if (loading) return;
    await startHostOnboarding(setLoading);
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

// ---------------------------------------------------------
// 2) Élément de topbar / menu : Créer une annonce
//    - Si hôte  → /listings/new
//    - Si pas hôte → propose de devenir hôte (Stripe)
// ---------------------------------------------------------
export function CreateListingMenuItem() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!session?.user;
  const sessionUser = session?.user as { isHost?: boolean; role?: string } | undefined;
  const isHost =
    sessionUser?.isHost === true ||
    sessionUser?.role === "HOST";

  async function handleClick() {
    if (status === "loading" || loading) return;

    // pas connecté → on envoie vers login avant de créer une annonce
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/listings/new");
      return;
    }

    // connecté mais pas hôte → proposer d'activer le compte hôte
    if (!isHost) {
      const ok = window.confirm(
        "Pour créer une annonce, vous devez d'abord devenir hôte Lok'Room et activer les paiements. Lancer l'activation maintenant ?",
      );
      if (!ok) return;
      await startHostOnboarding(setLoading);
      return;
    }

    // ✅ déjà hôte → on va sur /listings/new
    router.push("/listings/new");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
    >
      <span>Créer une annonce</span>
      {loading && <span className="text-xs text-gray-400">…</span>}
    </button>
  );
}

// ---------------------------------------------------------
// 3) Élément de topbar / menu : Devenir hôte (optionnel)
//    - S'affiche seulement si l'utilisateur n'est pas encore hôte
// ---------------------------------------------------------
export function BecomeHostMenuItem() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const sessionUser = session?.user as { isHost?: boolean; role?: string } | undefined;
  const isHost =
    sessionUser?.isHost === true ||
    sessionUser?.role === "HOST";

  // Si on ne sait pas encore ou si déjà hôte → ne rien afficher
  if (status === "loading" || isHost) {
    return null;
  }

  async function handleClick() {
    if (loading) return;
    await startHostOnboarding(setLoading);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
    >
      <span>Devenir hôte</span>
      {loading && <span className="text-xs text-gray-400">…</span>}
    </button>
  );
}
