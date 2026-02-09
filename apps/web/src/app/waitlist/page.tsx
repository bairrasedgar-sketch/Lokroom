"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle, Smartphone, Bell, Zap, Shield } from "lucide-react";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.svg"
              alt="Lok'Room"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              L'application mobile arrive bientôt
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Rejoignez la liste d'attente et soyez parmi les premiers à découvrir l'expérience Lok'Room sur mobile.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Réservation instantanée</h3>
                  <p className="text-sm text-gray-600">
                    Réservez votre espace en quelques secondes, où que vous soyez.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Notifications en temps réel</h3>
                  <p className="text-sm text-gray-600">
                    Restez informé de vos réservations et messages instantanément.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Interface optimisée</h3>
                  <p className="text-sm text-gray-600">
                    Une expérience mobile fluide et intuitive, conçue pour vous.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-600">
                    Transactions protégées avec les meilleurs standards de sécurité.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Merci de votre intérêt !
                </h2>
                <p className="text-gray-600 mb-6">
                  Vous êtes maintenant sur la liste d'attente. Nous vous contacterons dès que l'application sera disponible.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Retour à l'accueil
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Rejoignez la liste d'attente
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  Soyez notifié dès le lancement de l'application mobile.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      "Rejoindre la liste d'attente"
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    En vous inscrivant, vous acceptez de recevoir des notifications concernant le lancement de l'application.
                    Vous pouvez vous désinscrire à tout moment.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Back Link */}
          {!success && (
            <div className="text-center mt-8">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Lok'Room. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
