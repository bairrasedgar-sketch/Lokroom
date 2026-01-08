// apps/web/src/components/PasswordInput.tsx
"use client";

import { useState, useMemo } from "react";

// Règles de validation côté client (doivent matcher lib/password.ts)
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

type PasswordStrength = "weak" | "medium" | "strong" | "very_strong";

type PasswordValidation = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  strength: PasswordStrength;
};

function validatePassword(password: string): PasswordValidation {
  const minLength = password.length >= PASSWORD_RULES.minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~]/.test(password);

  const isValid =
    minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  // Calcul de la force
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (password.length >= 20) score++;

  let strength: PasswordStrength = "weak";
  if (score >= 7) strength = "very_strong";
  else if (score >= 5) strength = "strong";
  else if (score >= 3) strength = "medium";

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid,
    strength,
  };
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showValidation?: boolean;
  confirmValue?: string;
  confirmLabel?: string;
  onConfirmChange?: (value: string) => void;
  error?: string | null;
  autoFocus?: boolean;
};

export default function PasswordInput({
  value,
  onChange,
  label = "Mot de passe",
  placeholder = "Crée ton mot de passe",
  showValidation = true,
  confirmValue,
  confirmLabel = "Confirmer le mot de passe",
  onConfirmChange,
  error,
  autoFocus = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);

  const validation = useMemo(() => validatePassword(value), [value]);

  const strengthColors: Record<PasswordStrength, string> = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
    very_strong: "bg-emerald-600",
  };

  const strengthLabels: Record<PasswordStrength, string> = {
    weak: "Faible",
    medium: "Moyen",
    strong: "Fort",
    very_strong: "Très fort",
  };

  const strengthWidth: Record<PasswordStrength, string> = {
    weak: "w-1/4",
    medium: "w-2/4",
    strong: "w-3/4",
    very_strong: "w-full",
  };

  const passwordsMatch = confirmValue !== undefined && value === confirmValue;
  const showMismatch =
    confirmValue !== undefined &&
    confirmValue.length > 0 &&
    !passwordsMatch;

  return (
    <div className="space-y-3">
      {/* Champ mot de passe */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-1 ${
              error || (touched && !validation.isValid)
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
            }`}
            placeholder={placeholder}
            autoComplete="new-password"
            autoFocus={autoFocus}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Barre de force du mot de passe */}
      {showValidation && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-300 ${strengthColors[validation.strength]} ${strengthWidth[validation.strength]}`}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                validation.strength === "weak"
                  ? "text-red-600"
                  : validation.strength === "medium"
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {strengthLabels[validation.strength]}
            </span>
          </div>

          {/* Règles de validation */}
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <div
              className={`flex items-center gap-1 ${validation.minLength ? "text-green-600" : "text-gray-400"}`}
            >
              {validation.minLength ? "✓" : "○"} 8 caractères minimum
            </div>
            <div
              className={`flex items-center gap-1 ${validation.hasUppercase ? "text-green-600" : "text-gray-400"}`}
            >
              {validation.hasUppercase ? "✓" : "○"} Une majuscule
            </div>
            <div
              className={`flex items-center gap-1 ${validation.hasLowercase ? "text-green-600" : "text-gray-400"}`}
            >
              {validation.hasLowercase ? "✓" : "○"} Une minuscule
            </div>
            <div
              className={`flex items-center gap-1 ${validation.hasNumber ? "text-green-600" : "text-gray-400"}`}
            >
              {validation.hasNumber ? "✓" : "○"} Un chiffre
            </div>
            <div
              className={`flex items-center gap-1 ${validation.hasSpecial ? "text-green-600" : "text-gray-400"}`}
            >
              {validation.hasSpecial ? "✓" : "○"} Un caractère spécial
            </div>
          </div>
        </div>
      )}

      {/* Confirmation du mot de passe */}
      {onConfirmChange !== undefined && confirmValue !== undefined && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            {confirmLabel}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmValue}
              onChange={(e) => onConfirmChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-1 ${
                showMismatch
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              }`}
              placeholder="Confirme ton mot de passe"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          {showMismatch && (
            <p className="text-xs text-red-600">
              Les mots de passe ne correspondent pas
            </p>
          )}
          {passwordsMatch && confirmValue.length > 0 && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Les mots de passe correspondent
            </p>
          )}
        </div>
      )}

      {/* Erreur externe */}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Export de la fonction de validation pour utilisation externe
export { validatePassword };
export type { PasswordValidation, PasswordStrength };
