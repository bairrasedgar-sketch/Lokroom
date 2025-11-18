// apps/web/src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BecomeHostButton } from "@/components/BecomeHostButton";

type Role = "HOST" | "GUEST" | "BOTH";

type UserDTO = {
  email: string | null;
  name: string | null;
  country: string | null;
  role: Role | null;
  profile?: { avatarUrl?: string | null } | null;
};

type LedgerItem = {
  id: string;
  deltaCents: number;
  reason: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [initial, setInitial] = useState<UserDTO | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<Role>("GUEST");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "presigning" | "uploading" | "saving" | "done" | "error"
  >("idle");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const { user } = await res.json();
      setInitial(user);
      setEmail(user?.email ?? "");
      setName(user?.name ?? "");
      setCountry(user?.country ?? "");
      setRole((user?.role as Role) ?? "GUEST");
      if (user?.profile?.avatarUrl) setAvatarPreview(user.profile.avatarUrl);
    })();
  }, []);

  const changed = useMemo(() => {
    if (!initial) return false;
    return (
      (initial.name ?? "") !== name ||
      (initial.country ?? "") !== country ||
      ((initial.role ?? "GUEST") as Role) !== role
    );
  }, [initial, name, country, role]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;

    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country, role }),
      });
      if (!res.ok) throw new Error("Save failed");

      setInitial((prev) =>
        prev ? { ...prev, name, country, role } : { email, name, country, role }
      );
      setStatus("saved");
      toast.success("Profil sauvegardé ✅");
    } catch {
      setStatus("error");
      toast.error("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Image uniquement");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 MB)");
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function onUploadAvatar() {
    if (!avatarFile) return;
    try {
      setAvatarStatus("presigning");
      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: avatarFile.name,
          contentType: avatarFile.type,
        }),
      }).then((r) => r.json());

      if (!presign?.uploadUrl) throw new Error("presign failed");

      setAvatarStatus("uploading");
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": avatarFile.type },
        body: avatarFile,
      });
      if (!put.ok) throw new Error("upload failed");

      setAvatarStatus("saving");
      const save = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: presign.publicUrl }),
      });
      if (!save.ok) throw new Error("save failed");

      setAvatarStatus("done");
      setAvatarPreview(presign.publicUrl);
      toast.success("Avatar mis à jour ✅");
    } catch (e) {
      console.error(e);
      setAvatarStatus("error");
      toast.error("Échec de l’upload de l’avatar");
    }
  }

  async function onDeleteAvatar() {
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarFile(null);
        setAvatarPreview(null);
        toast.success("Avatar supprimé ✅");
      } else {
        toast.error("Impossible de supprimer l’avatar");
      }
    } catch {
      toast.error("Impossible de supprimer l’avatar");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-12 pt-8">
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold sm:text-3xl">Mon profil</h2>
          <p className="mt-1 text-sm text-gray-600">
            Email : <span className="font-mono">{email}</span>
          </p>
        </header>

        {/* Onboarding Hôte */}
        <section className="space-y-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm sm:p-5">
          <h3 className="text-base font-semibold">Onboarding hôte</h3>
          <p className="text-sm text-gray-600">
            Active ton portefeuille Lok’Room. Tu pourras ensuite retirer vers
            ton IBAN (UE) ou ton compte bancaire CAD (CA).{" "}
            <b>*Interac e-Transfer par e-mail n’est pas supporté.</b>
          </p>
          <BecomeHostButton />
          <a
            href="/api/host/requirements"
            className="text-sm text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            Voir l’état KYC / payouts (JSON)
          </a>
        </section>

        {/* Portefeuille hôte */}
        <WalletCard />

        {/* Lien bancaire (dev simple) */}
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm sm:p-5">
          <h3 className="text-base font-semibold">Compte bancaire (retraits)</h3>
          <p className="text-sm text-gray-600">
            Dev simple pour tester : entre un IBAN (UE) <b>ou</b> des infos
            Canada. En prod, on utilisera Stripe Elements.
          </p>

          <IbanForm />
          <BankCaForm />
        </section>

        {/* Avatar */}
        <section className="space-y-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm sm:p-5">
          <label className="block text-sm font-medium">Avatar</label>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="h-16 w-16 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-sm">
                {email?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <input type="file" accept="image/*" onChange={onPickAvatar} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onUploadAvatar}
                  disabled={
                    !avatarFile ||
                    avatarStatus === "presigning" ||
                    avatarStatus === "uploading" ||
                    avatarStatus === "saving"
                  }
                  className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50 sm:text-sm"
                >
                  {avatarStatus === "presigning"
                    ? "Préparation…"
                    : avatarStatus === "uploading"
                    ? "Upload…"
                    : avatarStatus === "saving"
                    ? "Enregistrement…"
                    : "Uploader l’avatar"}
                </button>

                <button
                  type="button"
                  onClick={onDeleteAvatar}
                  className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium sm:text-sm"
                >
                  Supprimer l’avatar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire profil */}
        <section className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm sm:p-5">
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nom</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Pays</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                value={country}
                onChange={(e) => setCountry(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rôle</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.currentTarget.value as Role)}
              >
                <option value="GUEST">GUEST</option>
                <option value="HOST">HOST</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || !changed}
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>

              {status === "saved" && (
                <span className="text-sm text-green-700">
                  Sauvegardé ✓
                </span>
              )}
              {status === "error" && (
                <span className="text-sm text-red-600">
                  Erreur lors de l’enregistrement
                </span>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

/* ===========================
   Carte Portefeuille + Retrait
   =========================== */

function WalletCard() {
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [balanceCents, setBalanceCents] = useState(0);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/host/wallet", { cache: "no-store" });
      const j = await res.json();
      setBalanceCents(j?.balanceCents ?? 0);
      setLedger(j?.ledger ?? []);
    } catch {
      setMsg("Impossible de charger le portefeuille.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function withdraw() {
    setWithdrawing(true);
    setMsg(null);
    try {
      const isDev = process.env.NODE_ENV !== "production";
      const url = isDev ? "/api/host/release?dev=1" : "/api/host/release";
      const res = await fetch(url, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Échec du virement");

      const released = j?.released ?? 0;
      if (released > 0) {
        setMsg(
          `✅ Virement déclenché (${released} transfert${
            released > 1 ? "s" : ""
          }).`
        );
      } else {
        const reason =
          j?.skipped?.[0]?.reason ??
          (balanceCents <= 0
            ? "Aucun fonds disponible"
            : "Solde plateforme insuffisant");
        setMsg(`ℹ️ ${reason}`);
      }
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Erreur de retrait");
    } finally {
      setWithdrawing(false);
    }
  }

  const balance = (balanceCents / 100).toFixed(2);

  return (
    <section className="space-y-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm sm:p-5">
      <div className="text-sm text-gray-600">Mon portefeuille</div>
      <div className="text-2xl font-semibold">
        {loading ? "…" : `${balance} €`}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={withdraw}
          disabled={withdrawing}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {withdrawing ? "Traitement…" : "Retirer mes fonds"}
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium"
        >
          Rafraîchir
        </button>
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>

      <div className="pt-2">
        <div className="mb-1 text-xs text-gray-500">Derniers mouvements</div>
        <ul className="space-y-1 text-sm">
          {ledger.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span className="max-w-[60%] truncate">{l.reason}</span>
              <span
                className={
                  l.deltaCents >= 0 ? "text-green-700" : "text-red-700"
                }
              >
                {(l.deltaCents / 100).toFixed(2)} €
              </span>
            </li>
          ))}
          {(!ledger || ledger.length === 0) && (
            <li className="text-xs text-gray-500">Aucun mouvement</li>
          )}
        </ul>
      </div>
    </section>
  );
}

/* ===========================
   Sous-composants dev (banque)
   =========================== */

function IbanForm() {
  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");

  async function linkIban() {
    try {
      const res = await fetch("/api/host/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "FR",
          currency: "eur",
          accountHolderName: holder || undefined,
          iban,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "attach_bank_failed");
      alert("IBAN lié. Payouts activés : " + j.payoutsEnabled);
    } catch (e: any) {
      alert(e?.message || "Erreur liaison IBAN");
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">IBAN (UE)</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="FR76 3000 6000 0112 3456 7890 189"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          value={iban}
          onChange={(e) => setIban(e.currentTarget.value)}
        />
        <input
          placeholder="Titulaire (optionnel)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          value={holder}
          onChange={(e) => setHolder(e.currentTarget.value)}
        />
      </div>
      <button
        type="button"
        onClick={linkIban}
        className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Lier cet IBAN
      </button>
    </div>
  );
}

function BankCaForm() {
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");

  async function linkCa() {
    try {
      const res = await fetch("/api/host/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "CA",
          currency: "cad",
          accountHolderName: holder || undefined,
          routingNumber: routing,
          accountNumber: account,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "attach_bank_failed");
      alert("Compte CA lié. Payouts activés : " + j.payoutsEnabled);
    } catch (e: any) {
      alert(e?.message || "Erreur liaison compte CA");
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        Canada (routing + account)
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="Routing (ex test: 000000000)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          value={routing}
          onChange={(e) => setRouting(e.currentTarget.value)}
        />
        <input
          placeholder="Account (ex test: 000123456789)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          value={account}
          onChange={(e) => setAccount(e.currentTarget.value)}
        />
        <input
          placeholder="Titulaire (optionnel)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          value={holder}
          onChange={(e) => setHolder(e.currentTarget.value)}
        />
      </div>
      <button
        type="button"
        onClick={linkCa}
        className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Lier ce compte CA
      </button>
    </div>
  );
}
