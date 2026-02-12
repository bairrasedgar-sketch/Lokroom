// apps/web/src/lib/env.ts

/**
 * Validation des variables d'environnement au démarrage.
 * Évite les erreurs silencieuses en production.
 */

import { z } from "zod";
import { logger } from "@/lib/logger";


// Schéma pour la production (strict)
const productionEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET doit faire au moins 32 caractères"),
  NEXTAUTH_URL: z.string().url(),

  // Stripe (requis en production)
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1),

  // 2FA
  TWO_FACTOR_ENCRYPTION_KEY: z.string().min(32, "TWO_FACTOR_ENCRYPTION_KEY doit faire au moins 32 caractères"),

  // Redis (Upstash) - requis en prod
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Storage (optionnel)
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  // PayPal (optionnel)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Google OAuth (optionnel)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Monitoring (optionnel)
  SENTRY_DSN: z.string().url().optional(),

  // Node env
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Schéma pour le développement (plus souple)
const developmentEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),

  // Stripe (optionnel en dev)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email (optionnel en dev)
  RESEND_API_KEY: z.string().optional(),

  // 2FA (optionnel en dev)
  TWO_FACTOR_ENCRYPTION_KEY: z.string().optional(),

  // Redis (optionnel en dev)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Storage (optionnel)
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // PayPal (optionnel)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Google OAuth (optionnel)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Monitoring (optionnel)
  SENTRY_DSN: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof productionEnvSchema>;

/**
 * Valide les variables d'environnement au démarrage.
 * Lance une erreur si une variable requise manque.
 */
export function validateEnv(): void {
  // En test, on skip la validation
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const schema = isProduction ? productionEnvSchema : developmentEnvSchema;

  try {
    const parsed = schema.parse(process.env);

    // Avertissements pour la production
    if (isProduction) {
      logger.debug("✅ Variables d'environnement validées (PRODUCTION)\n");
    } else {
      logger.debug("✅ Variables d'environnement validées (DÉVELOPPEMENT)\n");

      // Avertir si des variables importantes manquent en dev
      if (!parsed.UPSTASH_REDIS_REST_URL || !parsed.UPSTASH_REDIS_REST_TOKEN) {
        logger.warn(
          "⚠️  Redis non configuré - Le rate limiting utilisera la mémoire (moins sécurisé)\n"
        );
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`❌ Erreur de validation des variables d'environnement (${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}):\n`);

      error.errors.forEach((err) => {
        logger.error(`   - ${err.path.join(".")}: ${err.message}`);
      });

      logger.error("\n💡 Vérifiez votre fichier .env et comparez avec .env.example\n");

      // En production, on arrête le serveur
      if (isProduction) {
        logger.error("🚨 Le serveur ne peut pas démarrer en production avec des variables manquantes.\n");
        process.exit(1);
      }
    } else {
      throw error;
    }
  }
}

// Exécuter la validation immédiatement à l'import
validateEnv();
