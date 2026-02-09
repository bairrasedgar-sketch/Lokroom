/**
 * Script de backup automatique de la base de données PostgreSQL
 *
 * Fonctionnalités:
 * - Dump complet de la base PostgreSQL
 * - Compression gzip
 * - Upload sur S3/R2
 * - Rotation automatique des backups
 * - Vérification d'intégrité (checksum)
 * - Notifications en cas d'échec
 */

import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, createWriteStream, unlinkSync, statSync } from "fs";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface BackupConfig {
  databaseUrl: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Endpoint?: string; // Pour Cloudflare R2
  notificationEmail?: string;
}

/**
 * Récupère la configuration depuis les variables d'environnement
 */
function getConfig(): BackupConfig {
  const config: BackupConfig = {
    databaseUrl: process.env.DATABASE_URL || "",
    s3Bucket: process.env.AWS_BACKUP_BUCKET || process.env.AWS_S3_BUCKET || "",
    s3Region: process.env.AWS_REGION || "auto",
    s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Endpoint: process.env.AWS_S3_ENDPOINT,
    notificationEmail: process.env.BACKUP_NOTIFICATION_EMAIL,
  };

  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
    throw new Error("AWS S3 credentials are required (AWS_BACKUP_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
  }

  return config;
}

/**
 * Détermine le type de backup (daily, weekly, monthly)
 */
function getBackupType(): "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL" {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Premier jour du mois = backup mensuel
  if (dayOfMonth === 1) return "MONTHLY";

  // Dimanche = backup hebdomadaire
  if (dayOfWeek === 0) return "WEEKLY";

  // Sinon backup quotidien
  return "DAILY";
}

/**
 * Calcule le checksum SHA256 d'un fichier
 */
async function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Crée un dump de la base de données PostgreSQL
 */
async function createDatabaseDump(databaseUrl: string, outputPath: string): Promise<void> {
  console.log("📦 Creating database dump...");

  try {
    // Utiliser pg_dump avec l'URL de connexion
    await execAsync(`pg_dump "${databaseUrl}" > "${outputPath}"`);
    console.log(`✅ Database dump created: ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to create database dump:", error);
    throw error;
  }
}

/**
 * Compresse un fichier avec gzip
 */
async function compressFile(inputPath: string, outputPath: string): Promise<void> {
  console.log("🗜️  Compressing backup...");

  try {
    await pipeline(
      createReadStream(inputPath),
      createGzip({ level: 9 }), // Compression maximale
      createWriteStream(outputPath)
    );
    console.log(`✅ Backup compressed: ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to compress backup:", error);
    throw error;
  }
}

/**
 * Upload un fichier sur S3/R2
 */
async function uploadToS3(
  filePath: string,
  key: string,
  config: BackupConfig
): Promise<string> {
  console.log("☁️  Uploading to S3...");

  const s3Config: any = {
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    },
  };

  // Support pour Cloudflare R2
  if (config.s3Endpoint) {
    s3Config.endpoint = config.s3Endpoint;
  }

  const s3 = new S3Client(s3Config);

  try {
    const fileStream = createReadStream(filePath);
    const fileSize = statSync(filePath).size;

    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: fileStream,
        ContentType: "application/gzip",
        Metadata: {
          "backup-date": new Date().toISOString(),
          "backup-type": getBackupType(),
        },
      })
    );

    const fileUrl = config.s3Endpoint
      ? `${config.s3Endpoint}/${config.s3Bucket}/${key}`
      : `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${key}`;

    console.log(`✅ Backup uploaded: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("❌ Failed to upload to S3:", error);
    throw error;
  }
}

/**
 * Enregistre le backup dans la base de données
 */
async function recordBackup(
  filename: string,
  fileUrl: string,
  fileSize: number,
  checksum: string,
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL",
  startedAt: Date
): Promise<void> {
  try {
    await prisma.databaseBackup.create({
      data: {
        filename,
        fileUrl,
        fileSize,
        type,
        status: "COMPLETED",
        checksum,
        startedAt,
        completedAt: new Date(),
      },
    });
    console.log("✅ Backup recorded in database");
  } catch (error) {
    console.error("❌ Failed to record backup:", error);
    throw error;
  }
}

/**
 * Enregistre un échec de backup
 */
async function recordFailure(
  filename: string,
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL",
  startedAt: Date,
  error: string
): Promise<void> {
  try {
    await prisma.databaseBackup.create({
      data: {
        filename,
        fileUrl: "",
        fileSize: 0,
        type,
        status: "FAILED",
        startedAt,
        error,
      },
    });
    console.log("⚠️  Backup failure recorded in database");
  } catch (err) {
    console.error("❌ Failed to record backup failure:", err);
  }
}

/**
 * Rotation des backups (suppression des anciens)
 */
async function rotateBackups(config: BackupConfig): Promise<void> {
  console.log("🔄 Rotating old backups...");

  const now = new Date();
  const s3Config: any = {
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    },
  };

  if (config.s3Endpoint) {
    s3Config.endpoint = config.s3Endpoint;
  }

  const s3 = new S3Client(s3Config);

  try {
    // Supprimer les backups quotidiens > 7 jours
    const dailyBackups = await prisma.databaseBackup.findMany({
      where: {
        type: "DAILY",
        status: "COMPLETED",
        createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    for (const backup of dailyBackups) {
      await deleteBackup(backup, s3, config.s3Bucket);
    }

    // Supprimer les backups hebdomadaires > 4 semaines
    const weeklyBackups = await prisma.databaseBackup.findMany({
      where: {
        type: "WEEKLY",
        status: "COMPLETED",
        createdAt: { lt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
      },
    });

    for (const backup of weeklyBackups) {
      await deleteBackup(backup, s3, config.s3Bucket);
    }

    // Supprimer les backups mensuels > 12 mois
    const monthlyBackups = await prisma.databaseBackup.findMany({
      where: {
        type: "MONTHLY",
        status: "COMPLETED",
        createdAt: { lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
      },
    });

    for (const backup of monthlyBackups) {
      await deleteBackup(backup, s3, config.s3Bucket);
    }

    console.log(`✅ Rotation completed: ${dailyBackups.length + weeklyBackups.length + monthlyBackups.length} old backups deleted`);
  } catch (error) {
    console.error("❌ Failed to rotate backups:", error);
    // Ne pas throw, la rotation n'est pas critique
  }
}

/**
 * Supprime un backup (S3 + DB)
 */
async function deleteBackup(
  backup: any,
  s3: S3Client,
  bucket: string
): Promise<void> {
  try {
    // Extraire la clé S3 depuis l'URL
    const key = backup.filename;

    // Supprimer de S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `backups/${key}`,
      })
    );

    // Marquer comme supprimé dans la DB
    await prisma.databaseBackup.update({
      where: { id: backup.id },
      data: { status: "DELETED" },
    });

    console.log(`🗑️  Deleted backup: ${backup.filename}`);
  } catch (error) {
    console.error(`❌ Failed to delete backup ${backup.filename}:`, error);
  }
}

/**
 * Envoie une notification par email en cas d'échec
 */
async function sendFailureNotification(error: string, config: BackupConfig): Promise<void> {
  if (!config.notificationEmail) {
    console.log("⚠️  No notification email configured");
    return;
  }

  console.log(`📧 Sending failure notification to ${config.notificationEmail}...`);

  // TODO: Implémenter l'envoi d'email via Resend ou autre service
  // Pour l'instant, on log juste
  console.log(`Email notification would be sent to: ${config.notificationEmail}`);
  console.log(`Error: ${error}`);
}

/**
 * Fonction principale de backup
 */
async function backupDatabase(): Promise<void> {
  const startedAt = new Date();
  const timestamp = startedAt.toISOString().replace(/[:.]/g, "-").split("T")[0] + "-" + startedAt.getTime();
  const filename = `lokroom-backup-${timestamp}.sql`;
  const gzipFilename = `${filename}.gz`;
  const tempDir = process.platform === "win32" ? process.env.TEMP || "C:\\temp" : "/tmp";
  const sqlPath = `${tempDir}/${filename}`;
  const gzipPath = `${tempDir}/${gzipFilename}`;

  console.log("🚀 Starting database backup...");
  console.log(`📅 Backup type: ${getBackupType()}`);
  console.log(`📁 Filename: ${gzipFilename}`);

  let config: BackupConfig;

  try {
    config = getConfig();
  } catch (error) {
    console.error("❌ Configuration error:", error);
    process.exit(1);
  }

  try {
    // 1. Créer le dump PostgreSQL
    await createDatabaseDump(config.databaseUrl, sqlPath);

    // 2. Compresser avec gzip
    await compressFile(sqlPath, gzipPath);

    // 3. Calculer le checksum
    console.log("🔐 Calculating checksum...");
    const checksum = await calculateChecksum(gzipPath);
    console.log(`✅ Checksum: ${checksum}`);

    // 4. Upload sur S3
    const fileSize = statSync(gzipPath).size;
    const s3Key = `backups/${gzipFilename}`;
    const fileUrl = await uploadToS3(gzipPath, s3Key, config);

    // 5. Enregistrer dans la DB
    await recordBackup(
      gzipFilename,
      fileUrl,
      fileSize,
      checksum,
      getBackupType(),
      startedAt
    );

    // 6. Nettoyer les fichiers temporaires
    console.log("🧹 Cleaning up temporary files...");
    try {
      unlinkSync(sqlPath);
      unlinkSync(gzipPath);
    } catch (err) {
      console.warn("⚠️  Failed to clean up temporary files:", err);
    }

    // 7. Rotation des backups
    await rotateBackups(config);

    const duration = ((new Date().getTime() - startedAt.getTime()) / 1000).toFixed(2);
    console.log(`\n✅ Backup completed successfully in ${duration}s!`);
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔗 URL: ${fileUrl}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backup failed:", error);

    // Enregistrer l'échec
    await recordFailure(
      gzipFilename,
      getBackupType(),
      startedAt,
      String(error)
    );

    // Envoyer une notification
    await sendFailureNotification(String(error), config);

    // Nettoyer les fichiers temporaires
    try {
      unlinkSync(sqlPath);
      unlinkSync(gzipPath);
    } catch (err) {
      // Ignorer les erreurs de nettoyage
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

// Exécuter le backup
backupDatabase();
