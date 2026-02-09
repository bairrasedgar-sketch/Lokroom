/**
 * Script de restauration de la base de données depuis un backup
 *
 * Usage:
 *   npm run backup:restore <backup-id>
 *   npm run backup:restore latest
 *
 * Fonctionnalités:
 * - Téléchargement depuis S3/R2
 * - Décompression
 * - Vérification d'intégrité (checksum)
 * - Restauration dans PostgreSQL
 * - Logs d'audit
 */

import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, createWriteStream, unlinkSync, statSync } from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import { createHash } from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Readable } from "stream";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface RestoreConfig {
  databaseUrl: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Endpoint?: string;
}

/**
 * Récupère la configuration depuis les variables d'environnement
 */
function getConfig(): RestoreConfig {
  const config: RestoreConfig = {
    databaseUrl: process.env.DATABASE_URL || "",
    s3Bucket: process.env.AWS_BACKUP_BUCKET || process.env.AWS_S3_BUCKET || "",
    s3Region: process.env.AWS_REGION || "auto",
    s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Endpoint: process.env.AWS_S3_ENDPOINT,
  };

  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
    throw new Error("AWS S3 credentials are required");
  }

  return config;
}

/**
 * Récupère un backup par ID ou le dernier backup
 */
async function getBackup(backupIdOrLatest: string): Promise<any> {
  if (backupIdOrLatest === "latest") {
    const backup = await prisma.databaseBackup.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    });

    if (!backup) {
      throw new Error("No completed backup found");
    }

    return backup;
  }

  const backup = await prisma.databaseBackup.findUnique({
    where: { id: backupIdOrLatest },
  });

  if (!backup) {
    throw new Error(`Backup not found: ${backupIdOrLatest}`);
  }

  if (backup.status !== "COMPLETED") {
    throw new Error(`Backup is not completed: ${backup.status}`);
  }

  return backup;
}

/**
 * Télécharge un backup depuis S3
 */
async function downloadFromS3(
  key: string,
  outputPath: string,
  config: RestoreConfig
): Promise<void> {
  console.log("☁️  Downloading backup from S3...");

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
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error("Empty response from S3");
    }

    // Convertir le stream S3 en Node.js Readable stream
    const body = response.Body as Readable;
    const fileStream = createWriteStream(outputPath);

    await pipeline(body, fileStream);

    console.log(`✅ Backup downloaded: ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to download from S3:", error);
    throw error;
  }
}

/**
 * Décompresse un fichier gzip
 */
async function decompressFile(inputPath: string, outputPath: string): Promise<void> {
  console.log("📦 Decompressing backup...");

  try {
    await pipeline(
      createReadStream(inputPath),
      createGunzip(),
      createWriteStream(outputPath)
    );
    console.log(`✅ Backup decompressed: ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to decompress backup:", error);
    throw error;
  }
}

/**
 * Vérifie le checksum d'un fichier
 */
async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  console.log("🔐 Verifying checksum...");

  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => {
      const actualChecksum = hash.digest("hex");
      const isValid = actualChecksum === expectedChecksum;

      if (isValid) {
        console.log("✅ Checksum verified");
      } else {
        console.error("❌ Checksum mismatch!");
        console.error(`Expected: ${expectedChecksum}`);
        console.error(`Actual:   ${actualChecksum}`);
      }

      resolve(isValid);
    });
    stream.on("error", reject);
  });
}

/**
 * Restaure la base de données depuis un dump SQL
 */
async function restoreDatabase(databaseUrl: string, sqlPath: string): Promise<void> {
  console.log("🔄 Restoring database...");
  console.log("⚠️  WARNING: This will overwrite the current database!");

  try {
    // Utiliser psql pour restaurer le dump
    await execAsync(`psql "${databaseUrl}" < "${sqlPath}"`);
    console.log("✅ Database restored successfully");
  } catch (error) {
    console.error("❌ Failed to restore database:", error);
    throw error;
  }
}

/**
 * Crée un log d'audit pour la restauration
 */
async function createAuditLog(backupId: string, adminId: string): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: "USER_UPDATED",
        entityType: "DatabaseBackup",
        entityId: backupId,
        details: {
          timestamp: new Date().toISOString(),
          backupId,
          operation: "DATABASE_RESTORED",
        },
      },
    });
    console.log("✅ Audit log created");
  } catch (error) {
    console.error("⚠️  Failed to create audit log:", error);
    // Ne pas throw, le log d'audit n'est pas critique
  }
}

/**
 * Fonction principale de restauration
 */
async function restoreBackup(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ Usage: npm run backup:restore <backup-id|latest>");
    console.error("\nExamples:");
    console.error("  npm run backup:restore latest");
    console.error("  npm run backup:restore clxxx123456789");
    process.exit(1);
  }

  const backupIdOrLatest = args[0];
  const adminId = args[1] || "system"; // ID de l'admin qui effectue la restauration

  console.log("🚀 Starting database restore...");
  console.log(`🔍 Looking for backup: ${backupIdOrLatest}`);

  let config: RestoreConfig;

  try {
    config = getConfig();
  } catch (error) {
    console.error("❌ Configuration error:", error);
    process.exit(1);
  }

  const tempDir = process.platform === "win32" ? process.env.TEMP || "C:\\temp" : "/tmp";
  let gzipPath = "";
  let sqlPath = "";

  try {
    // 1. Récupérer les infos du backup
    const backup = await getBackup(backupIdOrLatest);
    console.log(`\n📋 Backup details:`);
    console.log(`   ID: ${backup.id}`);
    console.log(`   Filename: ${backup.filename}`);
    console.log(`   Type: ${backup.type}`);
    console.log(`   Size: ${(backup.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Created: ${backup.createdAt.toISOString()}`);
    console.log(`   Checksum: ${backup.checksum}`);

    // 2. Demander confirmation
    console.log("\n⚠️  WARNING: This will OVERWRITE the current database!");
    console.log("⚠️  Make sure you have a recent backup before proceeding.");
    console.log("\nPress Ctrl+C to cancel, or wait 10 seconds to continue...");

    await new Promise((resolve) => setTimeout(resolve, 10000));

    // 3. Télécharger depuis S3
    gzipPath = `${tempDir}/${backup.filename}`;
    const s3Key = `backups/${backup.filename}`;
    await downloadFromS3(s3Key, gzipPath, config);

    // 4. Vérifier le checksum
    if (backup.checksum) {
      const isValid = await verifyChecksum(gzipPath, backup.checksum);
      if (!isValid) {
        throw new Error("Checksum verification failed! Backup may be corrupted.");
      }
    } else {
      console.log("⚠️  No checksum available, skipping verification");
    }

    // 5. Décompresser
    sqlPath = gzipPath.replace(".gz", "");
    await decompressFile(gzipPath, sqlPath);

    // 6. Restaurer la base de données
    await restoreDatabase(config.databaseUrl, sqlPath);

    // 7. Créer un log d'audit
    await createAuditLog(backup.id, adminId);

    // 8. Nettoyer les fichiers temporaires
    console.log("🧹 Cleaning up temporary files...");
    try {
      unlinkSync(gzipPath);
      unlinkSync(sqlPath);
    } catch (err) {
      console.warn("⚠️  Failed to clean up temporary files:", err);
    }

    console.log("\n✅ Database restore completed successfully!");

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Restore failed:", error);

    // Nettoyer les fichiers temporaires
    try {
      if (gzipPath) unlinkSync(gzipPath);
      if (sqlPath) unlinkSync(sqlPath);
    } catch (err) {
      // Ignorer les erreurs de nettoyage
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

// Exécuter la restauration
restoreBackup();
