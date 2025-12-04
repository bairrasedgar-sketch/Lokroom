// apps/web/src/app/onboarding/OnboardingForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";

type Props = {
  email: string;
};

// Étapes du formulaire style Airbnb
type Step = "identity" | "role" | "birthdate" | "address" | "verification";
type UserRole = "guest" | "host" | null;

export default function OnboardingForm({ email }: Props) {
  const { dict } = useTranslation();
  const t = dict.onboarding;
  const router = useRouter();

  // État du formulaire multi-étapes
  const [step, setStep] = useState<Step>("identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les vérifications Stripe (hôte uniquement)
  const [identityLoading, setIdentityLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [identityDone, setIdentityDone] = useState(false);
  const [connectDone, setConnectDone] = useState(false);

  // Données du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  // Calcul de l'âge pour vérification
  function calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Navigation entre les étapes
  function handleNext() {
    setError(null);

    if (step === "identity") {
      if (!firstName.trim() || !lastName.trim()) {
        setError(t.errorRequired);
        return;
      }
      setStep("role");
    } else if (step === "role") {
      if (!role) {
        setError(t.errorRoleRequired || "Merci de choisir comment tu souhaites utiliser Lok'Room.");
        return;
      }
      setStep("birthdate");
    } else if (step === "birthdate") {
      if (!birthDate) {
        setError(t.errorBirthDateRequired);
        return;
      }
      const age = calculateAge(birthDate);
      if (age < 18) {
        setError(t.errorMinAge);
        return;
      }
      setStep("address");
    }
  }

  function handleBack() {
    if (step === "role") setStep("identity");
    else if (step === "birthdate") setStep("role");
    else if (step === "address") setStep("birthdate");
    else if (step === "verification") setStep("address");
  }

  // Sélection du rôle et passage à l'étape suivante
  function handleRoleSelect(selectedRole: UserRole) {
    setRole(selectedRole);
    setError(null);
    // Passe automatiquement à l'étape suivante après sélection
    setTimeout(() => setStep("birthdate"), 150);
  }

  // Passer à l'étape vérification (pour tous les rôles maintenant)
  function handleAddressNext() {
    setStep("verification");
  }

  // Lancer la vérification d'identité Stripe
  async function handleIdentityVerification() {
    setIdentityLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/identity/create-session", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.errorGeneric);
        return;
      }
      const { url } = await res.json();
      if (url) {
        // Ouvre dans un nouvel onglet pour ne pas perdre le formulaire
        window.open(url, "_blank");
        setIdentityDone(true);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setIdentityLoading(false);
    }
  }

  // Lancer l'onboarding Stripe Connect (compte bancaire)
  async function handleConnectOnboarding() {
    setConnectLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.errorGeneric);
        return;
      }
      const { url } = await res.json();
      if (url) {
        // Ouvre dans un nouvel onglet pour ne pas perdre le formulaire
        window.open(url, "_blank");
        setConnectDone(true);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setConnectLoading(false);
    }
  }

  // Soumission manuelle (pas de <form>)
  async function handleFinish() {
    // Empêche les doubles soumissions
    if (saving) return;

    setError(null);

    // Validation finale
    if (!firstName.trim() || !lastName.trim()) {
      setError(t.errorRequired);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role,
          birthDate: birthDate || null,
          phone: phone.trim() || null,
          addressLine1: addressLine1.trim() || null,
          city: city.trim() || null,
          postalCode: postalCode.trim() || null,
          country: country.trim() || null,
        }),
      });

      if (!res.ok) {
        setError(t.errorSave);
        return;
      }

      // Redirection vers l'accueil
      router.push("/");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  // Indicateur de progression - dynamique selon le rôle (tous ont verification maintenant)
  const steps: Step[] = ["identity", "role", "birthdate", "address", "verification"];
  const currentStepIndex = steps.indexOf(step);

  // Gère la touche Entrée pour passer à l'étape suivante (sauf sur l'adresse)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step !== "address") {
        handleNext();
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStepIndex ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        {t.stepIndicator?.replace("{current}", String(currentStepIndex + 1)).replace("{total}", String(steps.length)) ||
          `Étape ${currentStepIndex + 1} sur ${steps.length}`}
      </p>

      {/* PAS DE <form> - juste des divs pour éviter les soumissions automatiques */}
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* ========== ÉTAPE 1: IDENTITÉ ========== */}
        {step === "identity" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.emailLabel}
              </label>
              <input
                value={email}
                readOnly
                tabIndex={-1}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.firstNameLabel}
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={t.firstNamePlaceholder}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.lastNameLabel}
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={t.lastNamePlaceholder}
                autoComplete="off"
              />
            </div>

            <p className="text-[11px] text-gray-500">
              {t.identityHint}
            </p>
          </div>
        )}

        {/* ========== ÉTAPE 2: CHOIX DU RÔLE ========== */}
        {step === "role" && (
          <div className="space-y-4">
            <p className="text-center text-base font-medium text-gray-900">
              {(t.roleQuestion || "{firstName}, tu veux utiliser Lok'Room comme...").replace("{firstName}", firstName)}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Option Voyageur */}
              <button
                type="button"
                onClick={() => handleRoleSelect("guest")}
                className={`group relative flex flex-col items-center rounded-2xl border-2 p-5 transition-all hover:border-gray-900 hover:shadow-md ${
                  role === "guest"
                    ? "border-gray-900 bg-gray-50 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Illustration Voyageur */}
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100">
                  <svg
                    className="h-12 w-12 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {t.roleGuest || "Voyageur"}
                </span>
                <span className="mt-1 text-center text-[11px] text-gray-500">
                  {t.roleGuestDesc || "Je cherche un espace à louer"}
                </span>
                {role === "guest" && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* Option Hôte */}
              <button
                type="button"
                onClick={() => handleRoleSelect("host")}
                className={`group relative flex flex-col items-center rounded-2xl border-2 p-5 transition-all hover:border-gray-900 hover:shadow-md ${
                  role === "host"
                    ? "border-gray-900 bg-gray-50 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Illustration Hôte */}
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100">
                  <svg
                    className="h-12 w-12 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {t.roleHost || "Hôte"}
                </span>
                <span className="mt-1 text-center text-[11px] text-gray-500">
                  {t.roleHostDesc || "Je veux proposer un espace"}
                </span>
                {role === "host" && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-500">
              {t.roleHint || "Tu pourras changer à tout moment dans les paramètres."}
            </p>
          </div>
        )}

        {/* ========== ÉTAPE 3: DATE DE NAISSANCE ========== */}
        {step === "birthdate" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.birthDateLabel}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                autoComplete="off"
                autoFocus
              />
              <p className="text-[11px] text-gray-500">
                {t.birthDateHint}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={t.phonePlaceholder}
                autoComplete="off"
              />
              <p className="text-[11px] text-gray-500">
                {t.phoneHint}
              </p>
            </div>
          </div>
        )}

        {/* ========== ÉTAPE 3: ADRESSE ========== */}
        {step === "address" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.addressLabel}
              </label>
              <input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={t.addressPlaceholder}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  {t.cityLabel}
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder={t.cityPlaceholder}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  {t.postalCodeLabel}
                </label>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder={t.postalCodePlaceholder}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {t.countryLabel}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                autoComplete="off"
              >
                <option value="">{t.countryPlaceholder}</option>
                <option value="FR">France</option>
                <option value="CA">Canada</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="MC">Monaco</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="PT">Portugal</option>
                <option value="GB">Royaume-Uni</option>
                <option value="US">États-Unis</option>
                <option value="CN">Chine</option>
              </select>
            </div>

            <p className="text-[11px] text-gray-500">
              {t.addressHint}
            </p>
          </div>
        )}

        {/* ========== ÉTAPE 5: VÉRIFICATION STRIPE ========== */}
        {step === "verification" && (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-base font-semibold text-gray-900">
                {role === "host"
                  ? (t.verificationTitle || "Vérifie ton compte pour commencer")
                  : (t.verificationTitleGuest || "Une dernière étape pour ta sécurité")
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {role === "host"
                  ? (t.verificationSubtitle || "Pour créer des annonces et recevoir des paiements, tu dois vérifier ton identité et configurer ton compte bancaire.")
                  : (t.verificationSubtitleGuest || "Vérifie ton identité pour pouvoir réserver en toute sécurité. Ça prend 2 minutes.")
                }
              </p>
            </div>

            {/* Carte Vérification d'identité (pour tous) */}
            <div className={`rounded-xl border-2 p-4 transition-all ${identityDone ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${identityDone ? "bg-green-100" : "bg-purple-100"}`}>
                  {identityDone ? (
                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {t.identityVerificationLabel || "Vérification d'identité"}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t.identityVerificationDesc || "Confirme ton identité avec une pièce d'identité et un selfie."}
                  </p>
                  {!identityDone && (
                    <button
                      type="button"
                      onClick={handleIdentityVerification}
                      disabled={identityLoading}
                      className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      {identityLoading ? (t.verifying || "Vérification...") : (t.verifyIdentity || "Vérifier mon identité")}
                    </button>
                  )}
                  {identityDone && (
                    <p className="mt-2 text-xs font-medium text-green-600">
                      {t.identityStarted || "Vérification lancée dans un nouvel onglet"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Carte Compte bancaire / Stripe Connect (HÔTE UNIQUEMENT) */}
            {role === "host" && (
              <div className={`rounded-xl border-2 p-4 transition-all ${connectDone ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${connectDone ? "bg-green-100" : "bg-blue-100"}`}>
                    {connectDone ? (
                      <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {t.bankAccountLabel || "Compte bancaire"}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t.bankAccountDesc || "Configure ton RIB pour recevoir tes revenus sur ton portefeuille Lok'Room."}
                    </p>
                    {!connectDone && (
                      <button
                        type="button"
                        onClick={handleConnectOnboarding}
                        disabled={connectLoading}
                        className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {connectLoading ? (t.configuring || "Configuration...") : (t.configureBankAccount || "Configurer mon compte")}
                      </button>
                    )}
                    {connectDone && (
                      <p className="mt-2 text-xs font-medium text-green-600">
                        {t.connectStarted || "Configuration lancée dans un nouvel onglet"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Note importante - différente selon le rôle */}
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">{t.importantNote || "Important :"}</span>{" "}
                {role === "host"
                  ? (t.verificationNote || "Sans ces vérifications, tu pourras naviguer sur Lok'Room et ajouter des favoris, mais tu ne pourras pas créer d'annonces ni effectuer de réservations.")
                  : (t.verificationNoteGuest || "Sans la vérification d'identité, tu pourras naviguer et ajouter des favoris, mais tu ne pourras pas effectuer de réservations.")
                }
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        {/* Boutons de navigation */}
        <div className="flex gap-3 pt-2">
          {step !== "identity" && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t.back || "Retour"}
            </button>
          )}

          {/* Bouton Continuer - pas sur l'adresse (hôte va à verification) ni sur verification */}
          {step !== "address" && step !== "verification" && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              {t.next || "Continuer"}
            </button>
          )}

          {/* Bouton sur l'étape adresse */}
          {step === "address" && (
            <button
              type="button"
              disabled={saving}
              onClick={handleAddressNext}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {t.next || "Continuer"}
            </button>
          )}

          {/* Bouton Terminer sur l'étape verification (hôte) */}
          {step === "verification" && (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? t.submitting : t.submit}
            </button>
          )}
        </div>

        {/* Skip optionnel pour l'adresse */}
        {step === "address" && (
          <button
            type="button"
            onClick={handleAddressNext}
            className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
          >
            {t.skipAddress || "Passer cette étape"}
          </button>
        )}

        {/* Skip optionnel pour la vérification (hôte) */}
        {step === "verification" && (
          <button
            type="button"
            disabled={saving}
            onClick={handleFinish}
            className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
          >
            {t.skipVerification || "Je ferai ça plus tard"}
          </button>
        )}
      </div>
    </div>
  );
}
