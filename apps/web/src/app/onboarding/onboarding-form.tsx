// apps/web/src/app/onboarding/OnboardingForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";

type Props = {
  email: string;
};

// Étapes du formulaire style Airbnb
type Step = "identity" | "birthdate" | "address";

export default function OnboardingForm({ email }: Props) {
  const { dict } = useTranslation();
  const t = dict.onboarding;
  const router = useRouter();

  // État du formulaire multi-étapes
  const [step, setStep] = useState<Step>("identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    if (step === "birthdate") setStep("identity");
    else if (step === "address") setStep("birthdate");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

  // Indicateur de progression
  const steps: Step[] = ["identity", "birthdate", "address"];
  const currentStepIndex = steps.indexOf(step);

  // Empêche la soumission par Entrée sauf sur la dernière étape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && step !== "address") {
      e.preventDefault();
      handleNext();
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

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
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
              />
            </div>

            <p className="text-[11px] text-gray-500">
              {t.identityHint}
            </p>
          </div>
        )}

        {/* ========== ÉTAPE 2: DATE DE NAISSANCE ========== */}
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

          {step !== "address" ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              {t.next || "Continuer"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
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
            disabled={saving}
            onClick={handleSubmit as any}
            className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
          >
            {t.skipAddress || "Passer cette étape"}
          </button>
        )}
      </form>
    </div>
  );
}
