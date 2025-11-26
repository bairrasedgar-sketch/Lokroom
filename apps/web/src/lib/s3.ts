// apps/web/src/lib/s3.ts
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * ⚙️ Config S3 / R2
 * Adapte les noms d'ENV si besoin, mais garde bien les exports :
 * - s3
 * - S3_BUCKET
 * - S3_PUBLIC_BASE
 */
const S3_ENDPOINT = process.env.S3_ENDPOINT; // ex: "https://<account>.r2.cloudflarestorage.com"
const S3_REGION = process.env.S3_REGION ?? "auto";

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID!;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY!;

export const S3_BUCKET = process.env.S3_BUCKET!; // nom du bucket R2
export const S3_PUBLIC_BASE = process.env.S3_PUBLIC_BASE ?? ""; // ex: "https://cdn.lokroom.com"

if (!S3_BUCKET) {
  throw new Error("S3_BUCKET manquant dans les variables d'environnement");
}

export const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

/**
 * ✅ Types d'images autorisés côté backend
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * ✅ Taille max autorisée côté backend (8 Mo ici, aligné sur le frontend)
 */
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * 🗑️ Helper pour supprimer un objet à partir de sa key
 * (optionnel pour l'instant, mais prêt pour plus tard)
 */
export async function deleteObject(key: string | null | undefined) {
  if (!key) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    console.error("[s3.deleteObject] Erreur suppression S3/R2:", err);
  }
}
