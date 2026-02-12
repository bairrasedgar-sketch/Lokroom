// apps/web/src/lib/2fa.ts
// Utilitaires pour l'authentification a deux facteurs (2FA/MFA)

import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "@/lib/logger";


// Configuration TOTP
authenticator.options = {
  digits: 6,
  step: 30, // 30 secondes par code
  window: 1, // Accepte le code precedent/suivant (tolerance)
};

// Nom de l'application pour l'affichage dans les apps d'authentification
const APP_NAME = "Lok'Room";

// Cle de chiffrement pour les secrets (32 bytes pour AES-256)
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "";

// Derive une cle de 32 bytes a partir de la cle d'environnement
function getDerivedKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY ou NEXTAUTH_SECRET doit etre defini");
  }
  // Utilise SHA-256 pour deriver une cle de 32 bytes
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/**
 * Chiffre un secret TOTP avec AES-256-GCM
 * Format: enc2:{iv}:{authTag}:{ciphertext} (tout en base64)
 */
export function encryptSecret(secret: string): string {
  try {
    const key = getDerivedKey();
    const iv = crypto.randomBytes(12); // 96 bits pour GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(secret, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Format: enc2:{iv}:{authTag}:{ciphertext}
    return `enc2:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    logger.error("[2FA] Erreur chiffrement:", error);
    throw new Error("Impossible de chiffrer le secret");
  }
}

/**
 * Dechiffre un secret TOTP
 * Supporte l'ancien format (enc:) et le nouveau (enc2:)
 */
export function decryptSecret(encryptedSecret: string): string {
  // Nouveau format AES-256-GCM
  if (encryptedSecret.startsWith("enc2:")) {
    try {
      const parts = encryptedSecret.slice(5).split(":");
      if (parts.length !== 3) {
        throw new Error("Format de secret invalide");
      }

      const [ivBase64, authTagBase64, ciphertext] = parts;
      const key = getDerivedKey();
      const iv = Buffer.from(ivBase64, "base64");
      const authTag = Buffer.from(authTagBase64, "base64");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("[2FA] Erreur dechiffrement:", error);
      throw new Error("Impossible de dechiffrer le secret");
    }
  }

  // Ancien format base64 simple (migration)
  if (encryptedSecret.startsWith("enc:")) {
    const encoded = encryptedSecret.slice(4);
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const parts = decoded.split(":");

    if (parts.length < 2) {
      throw new Error("Format de secret invalide");
    }

    // Retourne le secret sans le prefixe de verification
    return parts.slice(1).join(":");
  }

  // Secret non chiffre (tres ancien format)
  return encryptedSecret;
}

/**
 * Genere un nouveau secret TOTP
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Genere l'URI otpauth pour les apps d'authentification
 */
export function generateOtpauthUri(secret: string, email: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

/**
 * Genere un QR code en base64 pour le secret TOTP
 */
export async function generateQRCode(secret: string, email: string): Promise<string> {
  const otpauthUri = generateOtpauthUri(secret, email);

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    logger.error("[2FA] Erreur generation QR code:", error);
    throw new Error("Impossible de generer le QR code");
  }
}

/**
 * Verifie un code TOTP
 */
export function verifyToken(secret: string, token: string): boolean {
  try {
    // Nettoyer le token (enlever espaces)
    const cleanToken = token.replace(/\s/g, "");

    // Verifier que le token est un nombre a 6 chiffres
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    return authenticator.verify({ token: cleanToken, secret });
  } catch (error) {
    logger.error("[2FA] Erreur verification token:", error);
    return false;
  }
}

/**
 * Genere 10 codes de secours uniques
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
    // Format: XXXX-XXXX (8 caracteres alphanumeriques)
    const part1 = generateRandomCode(4);
    const part2 = generateRandomCode(4);
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Genere un code aleatoire de la longueur specifiee
 */
function generateRandomCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sans I, O, 0, 1 pour eviter confusion
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((byte) => chars[byte % chars.length])
    .join("");
}

/**
 * Hash un code de secours avec bcrypt
 */
export async function hashBackupCode(code: string): Promise<string> {
  // Normaliser le code (majuscules, sans tirets)
  const normalizedCode = code.toUpperCase().replace(/-/g, "");
  return bcrypt.hash(normalizedCode, 10);
}

/**
 * Hash tous les codes de secours
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(hashBackupCode));
}

/**
 * Verifie un code de secours contre une liste de codes hashes
 * Retourne l'index du code utilise ou -1 si non trouve
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number }> {
  // Normaliser le code (majuscules, sans tirets)
  const normalizedCode = code.toUpperCase().replace(/-/g, "");

  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(normalizedCode, hashedCodes[i]);
    if (isValid) {
      return { valid: true, usedIndex: i };
    }
  }

  return { valid: false, usedIndex: -1 };
}

/**
 * Genere un token temporaire pour la verification 2FA lors de la connexion
 * Ce token est utilise pour identifier la session en attente de 2FA
 */
export function generateTwoFactorToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Type pour le resultat de verification 2FA
 */
export type TwoFactorVerifyResult = {
  success: boolean;
  method?: "TOTP" | "BACKUP_CODE";
  usedBackupCodeIndex?: number;
  error?: string;
};

/**
 * Verifie un code 2FA (TOTP ou code de secours)
 */
export async function verifyTwoFactorCode(
  code: string,
  secret: string,
  hashedBackupCodes: string[]
): Promise<TwoFactorVerifyResult> {
  // Nettoyer le code
  const cleanCode = code.trim();

  // Essayer d'abord comme code TOTP (6 chiffres)
  if (/^\d{6}$/.test(cleanCode)) {
    const isValidTotp = verifyToken(secret, cleanCode);
    if (isValidTotp) {
      return { success: true, method: "TOTP" };
    }
  }

  // Essayer comme code de secours (format XXXX-XXXX ou XXXXXXXX)
  const backupResult = await verifyBackupCode(cleanCode, hashedBackupCodes);
  if (backupResult.valid) {
    return {
      success: true,
      method: "BACKUP_CODE",
      usedBackupCodeIndex: backupResult.usedIndex,
    };
  }

  return { success: false, error: "Code invalide" };
}

/**
 * Formate un secret pour l'affichage manuel (groupes de 4 caracteres)
 */
export function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}
