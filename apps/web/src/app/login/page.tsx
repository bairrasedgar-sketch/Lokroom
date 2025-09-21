"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn("email", { email, redirect: false });
      if (res?.error) {
        setErrorMsg(res.error || "Unable to send the magic link. Please try again.");
        return;
      }
      setSent(true);
    } catch (err) {
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl shadow p-6 border bg-white">
        <h1 className="text-2xl font-semibold mb-2">Sign in to Lokroom</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email and we’ll send you a magic link.
        </p>

        {sent ? (
          <div className="text-sm space-y-2">
            <p className="text-green-700">
              Magic link sent! Please check your inbox.
            </p>
            <p className="text-gray-600">
              In development with Mailtrap, open your <em>Sandbox Inbox</em> to view the email
              and click the link to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {errorMsg && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              disabled={loading || !email}
              className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
              type="submit"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
