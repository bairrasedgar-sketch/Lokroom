"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );

  const valid = /\S+@\S+\.\S+/.test(email);
  const disabled = !valid || status === "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    try {
      setStatus("loading");
      const res = await signIn("email", {
        email,
        // 👇 IMPORTANT : le lien envoyé par mail redirigera ici après clic
        callbackUrl: "/profile",
        // on reste sur la page pour afficher "lien envoyé"
        redirect: false,
      });
      setStatus(res?.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <label className="block text-sm">Email</label>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        autoComplete="email"
        className="w-full rounded-md border px-3 py-2"
        placeholder="you@example.com"
      />

      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {status === "loading"
          ? "Envoi…"
          : status === "sent"
            ? "Lien envoyé ✓"
            : "Send magic link"}
      </button>

      {/* Message de confirmation propre */}
      {status === "sent" && (
        <p className="mt-2 text-sm rounded-md bg-green-100 text-green-800 px-3 py-2">
          Magic link envoyé à <span className="font-mono">{email}</span>.
          Vérifiez votre boîte mail (et vos spams) ✉️
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm rounded-md bg-red-100 text-red-800 px-3 py-2">
          Oups, échec de l'envoi. Réessayez.
        </p>
      )}
    </form>
  );
}
