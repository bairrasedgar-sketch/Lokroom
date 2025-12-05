// apps/web/src/lib/password.ts
// Utilitaires pour la gestion sécurisée des mots de passe

import bcrypt from "bcryptjs";

// Règles de validation du mot de passe (niveau entreprise)
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  // Caractères spéciaux autorisés
  specialChars: "!@#$%^&*()_+-=[]{}|;:',.<>?/`~",
};

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong" | "very_strong";
};

/**
 * Valide un mot de passe selon les règles de sécurité
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Longueur minimale
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_RULES.minLength} caractères`);
  }

  // Longueur maximale
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Le mot de passe ne doit pas dépasser ${PASSWORD_RULES.maxLength} caractères`);
  }

  // Majuscule requise
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  // Minuscule requise
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  // Chiffre requis
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  // Caractère spécial requis
  if (PASSWORD_RULES.requireSpecial) {
    const specialRegex = new RegExp(`[${PASSWORD_RULES.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialRegex.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)");
    }
  }

  // Vérifier les mots de passe courants à éviter
  const commonPasswords = [
    "password", "123456", "12345678", "qwerty", "azerty",
    "abc123", "monkey", "master", "dragon", "111111",
    "baseball", "iloveyou", "trustno1", "sunshine", "princess"
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Ce mot de passe est trop courant, veuillez en choisir un autre");
  }

  // Calcul de la force du mot de passe
  let strength: PasswordValidationResult["strength"] = "weak";
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 20) score++;

  if (score >= 7) strength = "very_strong";
  else if (score >= 5) strength = "strong";
  else if (score >= 3) strength = "medium";

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Hash un mot de passe avec bcrypt (coût de 12 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  // 12 rounds offre un bon équilibre sécurité/performance
  return bcrypt.hash(password, 12);
}

/**
 * Vérifie si un mot de passe correspond au hash stocké
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Génère un token de réinitialisation sécurisé (32 bytes en hex)
 */
export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère un code de vérification à 6 chiffres
 */
export function generateVerificationCode(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const num = (array[0] << 24 | array[1] << 16 | array[2] << 8 | array[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
}
