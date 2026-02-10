"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Message envoyé !
          </h2>
          <p className="text-gray-600 mb-6">
            Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.
          </p>
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contactez-nous
            </h1>
            <p className="mt-4 text-xl text-gray-300">
              Une question ? Notre équipe est là pour vous aider
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informations de contact
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <a
                        href="mailto:support@lokroom.com"
                        className="text-gray-600 hover:text-gray-900 transition"
                      >
                        support@lokroom.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <PhoneIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Téléphone</h3>
                      <a
                        href="tel:+33123456789"
                        className="text-gray-600 hover:text-gray-900 transition"
                      >
                        +33 1 23 45 67 89
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Support humain : 9h-17h (tous les jours)
                      </p>
                      <p className="text-sm text-blue-600 mt-1 font-medium">
                        Support IA : 24h/24 7j/7
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <MapPinIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Adresse</h3>
                      <p className="text-gray-600">
                        123 Avenue des Champs-Élysées
                        <br />
                        75008 Paris, France
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Besoin d'aide rapidement ?
                  </h3>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-gray-900 transition underline"
                  >
                    Consultez notre centre d'aide
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Envoyez-nous un message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      minLength={2}
                      maxLength={100}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      maxLength={255}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      placeholder="jean.dupont@example.com"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="Question générale">Question générale</option>
                      <option value="Problème de réservation">Problème de réservation</option>
                      <option value="Problème de paiement">Problème de paiement</option>
                      <option value="Devenir hôte">Devenir hôte</option>
                      <option value="Signaler un problème">Signaler un problème</option>
                      <option value="Partenariat">Partenariat</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
                      placeholder="Décrivez votre demande en détail..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {formData.message.length} / 2000 caractères
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Envoi en cours..." : "Envoyer le message"}
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    En envoyant ce formulaire, vous acceptez nos{" "}
                    <Link href="/legal/privacy" className="underline hover:text-gray-900">
                      conditions d'utilisation
                    </Link>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Délais de Réponse Garantis
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Nous nous engageons à vous répondre dans les meilleurs délais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Support Standard */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Support Standard
              </h3>
              <p className="text-3xl font-bold text-blue-600 text-center mb-3">
                24h
              </p>
              <p className="text-sm text-gray-600 text-center mb-4">
                Questions générales, informations, assistance non urgente
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Réponse sous 24h ouvrées</li>
                <li>• Email : support@lokroom.com</li>
                <li>• Formulaire de contact</li>
              </ul>
            </div>

            {/* Support Urgent */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  PRIORITAIRE
                </span>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 text-orange-600 mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Support Urgent
              </h3>
              <p className="text-3xl font-bold text-orange-600 text-center mb-3">
                2h
              </p>
              <p className="text-sm text-gray-600 text-center mb-4">
                Problème pendant une réservation en cours
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Réponse sous 2h (7j/7)</li>
                <li>• Mentionnez "URGENT" dans l'objet</li>
                <li>• Téléphone : +33 1 23 45 67 89</li>
              </ul>
            </div>

            {/* Support IA */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-green-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Support IA
              </h3>
              <p className="text-3xl font-bold text-green-600 text-center mb-3">
                Instantané
              </p>
              <p className="text-sm text-gray-600 text-center mb-4">
                Réponses automatiques 24h/24 7j/7
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Disponible 24h/24 7j/7</li>
                <li>• Réponse immédiate</li>
                <li>• Questions fréquentes</li>
              </ul>
            </div>
          </div>

          {/* Escalade Urgence */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Urgence pendant une réservation ?
                  </h3>
                  <p className="text-sm text-red-800 mb-3">
                    Si vous rencontrez un problème urgent pendant une réservation en cours (accès impossible,
                    problème de sécurité, litige avec l'hôte/voyageur), suivez cette procédure :
                  </p>
                  <ol className="text-sm text-red-800 space-y-2 list-decimal pl-5">
                    <li>
                      <strong>Contactez l'hôte/voyageur</strong> via la messagerie Lok'Room
                    </li>
                    <li>
                      <strong>Si pas de réponse sous 2h</strong>, envoyez un email à support@lokroom.com avec <strong>"URGENT"</strong> dans l'objet
                    </li>
                    <li>
                      <strong>Pour les urgences critiques</strong> (sécurité, accès bloqué), appelez le +33 1 23 45 67 89
                    </li>
                  </ol>
                  <p className="text-xs text-red-700 mt-3">
                    💡 Astuce : Prenez des photos datées pour documenter tout problème
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trouvez rapidement des réponses à vos questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Que faire si je n'ai pas de réponse ?
              </h3>
              <p className="text-gray-600">
                Si vous n'avez pas reçu de réponse dans les délais indiqués, vérifiez vos spams
                ou renvoyez votre message en mentionnant votre demande précédente.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment annuler une réservation ?
              </h3>
              <p className="text-gray-600">
                Consultez notre{" "}
                <Link href="/legal/cancellation" className="underline">
                  politique d'annulation
                </Link>{" "}
                ou contactez-nous directement.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment devenir hôte ?
              </h3>
              <p className="text-gray-600">
                Visitez notre page{" "}
                <Link href="/listings/new" className="underline">
                  Devenir hôte
                </Link>{" "}
                pour commencer à proposer votre espace.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Problème de paiement ?
              </h3>
              <p className="text-gray-600">
                Vérifiez vos informations bancaires dans votre compte ou contactez-nous
                pour une assistance personnalisée.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
