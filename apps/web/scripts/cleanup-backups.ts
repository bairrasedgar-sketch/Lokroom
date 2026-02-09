/**
 * Script de nettoyage des backups obsolètes
 *
 * Usage:
 *   npm run backup:cleanup
 *   npm run backup:cleanup -- --dry-run
 *   npm run backup:cleanup -- --force
 */

import { PrismaClient } from "@prisma/client";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

interface CleanupOptions {
  dryRun: boolean;
  force: boolean;
}

interface CleanupStats {
  dailyDeleted: number;
  weeklyDeleted: number;
  monthlyDeleted: number;
  failedDeleted: number;
  totalSpaceFreed: number;
}

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  };
}

/**
 * Récupère la configuration S3
 */
function getS3Config() {
  const config: any = {
    region: process.env.AWS_REGION || "auto",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  };

  if (process.env.AWS_S3_ENDPOINT) {
    config.endpoint = process.env.AWS_S3_ENDPOINT;
  }

  return config;
}

/**
 * Supprime un backup (S3 + DB)
 */
async function deleteBackup(
  backup: any,
  s3: S3Client,
  bucket: string,
  dryRun: boolean
): Promise<number> {
  console.log(`   ${dryRun ? "[DRY RUN] " : ""}Deleting: ${backup.filename}`);
  console.log(`      Size: ${(backup.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`      Created: ${backup.createdAt.toISOString()}`);

  if (dryRun) {
    return backup.fileSize;
  }

  try {
    // Supprimer de S3
    const key = `backups/${backup.filename}`;
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    // Marquer comme supprimé dans la DB
    await prisma.databaseBackup.update({
      where: { id: backup.id },
      data: { status: "DELETED" },
    });

    return backup.fileSize;
  } catch (error) {
    console.error(`      ❌ Error deleting backup: ${error}`);
    return 0;
  }
}

/**
 * Nettoie les backups quotidiens > 7 jours
 */
async function cleanupDailyBackups(
  s3: S3Client,
  bucket: string,
  options: CleanupOptions
): Promise<{ count: number; spaceFreed: number }> {
  console.log("\n🗑️  Cleaning up daily backups (> 7 days)...");

  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const backups = await prisma.databaseBackup.findMany({
    where: {
      type: "DAILY",
      status: "COMPLETED",
      createdAt: { lt: cutoffDate },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Found ${backups.length} daily backup(s) to delete`);

  let spaceFreed = 0;
  for (const backup of backups) {
    spaceFreed += await deleteBackup(backup, s3, bucket, options.dryRun);
  }

  return { count: backups.length, spaceFreed };
}

/**
 * Nettoie les backups hebdomadaires > 4 semaines
 */
async function cleanupWeeklyBackups(
  s3: S3Client,
  bucket: string,
  options: CleanupOptions
): Promise<{ count: number; spaceFreed: number }> {
  console.log("\n🗑️  Cleaning up weekly backups (> 4 weeks)...");

  const cutoffDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const backups = await prisma.databaseBackup.findMany({
    where: {
      type: "WEEKLY",
      status: "COMPLETED",
      createdAt: { lt: cutoffDate },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Found ${backups.length} weekly backup(s) to delete`);

  let spaceFreed = 0;
  for (const backup of backups) {
    spaceFreed += await deleteBackup(backup, s3, bucket, options.dryRun);
  }

  return { count: backups.length, spaceFreed };
}

/**
 * Nettoie les backups mensuels > 12 mois
 */
async function cleanupMonthlyBackups(
  s3: S3Client,
  bucket: string,
  options: CleanupOptions
): Promise<{ count: number; spaceFreed: number }> {
  console.log("\n🗑️  Cleaning up monthly backups (> 12 months)...");

  const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const backups = await prisma.databaseBackup.findMany({
    where: {
      type: "MONTHLY",
      status: "COMPLETED",
      createdAt: { lt: cutoffDate },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Found ${backups.length} monthly backup(s) to delete`);

  let spaceFreed = 0;
  for (const backup of backups) {
    spaceFreed += await deleteBackup(backup, s3, bucket, options.dryRun);
  }

  return { count: backups.length, spaceFreed };
}

/**
 * Nettoie les backups échoués > 30 jours
 */
async function cleanupFailedBackups(
  s3: S3Client,
  bucket: string,
  options: CleanupOptions
): Promise<{ count: number; spaceFreed: number }> {
  console.log("\n🗑️  Cleaning up failed backups (> 30 days)...");

  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const backups = await prisma.databaseBackup.findMany({
    where: {
      status: "FAILED",
      createdAt: { lt: cutoffDate },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Found ${backups.length} failed backup(s) to delete`);

  let count = 0;
  for (const backup of backups) {
    if (!options.dryRun) {
      await prisma.databaseBackup.delete({
        where: { id: backup.id },
      });
      count++;
    }
  }

  return { count: options.dryRun ? backups.length : count, spaceFreed: 0 };
}

/**
 * Affiche les statistiques avant nettoyage
 */
async function displayPreCleanupStats(): Promise<void> {
  console.log("\n📊 Current Backup Statistics:");
  console.log("─────────────────────────────────────────");

  const stats = await prisma.databaseBackup.groupBy({
    by: ["type", "status"],
    _count: true,
    _sum: { fileSize: true },
  });

  const byType: Record<string, any> = {};

  stats.forEach((stat) => {
    if (!byType[stat.type]) {
      byType[stat.type] = { count: 0, size: 0 };
    }
    if (stat.status === "COMPLETED") {
      byType[stat.type].count += stat._count;
      byType[stat.type].size += stat._sum.fileSize || 0;
    }
  });

  Object.entries(byType).forEach(([type, data]) => {
    console.log(
      `   ${type.padEnd(10)} ${data.count} backup(s), ${(data.size / 1024 / 1024).toFixed(2)} MB`
    );
  });

  const totalSize = Object.values(byType).reduce(
    (sum: number, data: any) => sum + data.size,
    0
  );
  console.log(`\n   Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Affiche le résumé du nettoyage
 */
function displayCleanupSummary(stats: CleanupStats, dryRun: boolean): void {
  console.log("\n" + "=".repeat(60));
  console.log(`📊 CLEANUP SUMMARY ${dryRun ? "(DRY RUN)" : ""}`);
  console.log("=".repeat(60));

  console.log(`\n   Daily backups deleted:   ${stats.dailyDeleted}`);
  console.log(`   Weekly backups deleted:  ${stats.weeklyDeleted}`);
  console.log(`   Monthly backups deleted: ${stats.monthlyDeleted}`);
  console.log(`   Failed backups deleted:  ${stats.failedDeleted}`);

  const totalDeleted =
    stats.dailyDeleted +
    stats.weeklyDeleted +
    stats.monthlyDeleted +
    stats.failedDeleted;

  console.log(`\n   Total backups deleted:   ${totalDeleted}`);
  console.log(
    `   Space freed:             ${(stats.totalSpaceFreed / 1024 / 1024).toFixed(2)} MB`
  );

  console.log("\n" + "=".repeat(60));

  if (dryRun) {
    console.log("\n⚠️  This was a DRY RUN. No backups were actually deleted.");
    console.log("   Run without --dry-run to perform the cleanup.");
  } else {
    console.log("\n✅ Cleanup completed successfully!");
  }

  console.log("=".repeat(60) + "\n");
}

/**
 * Fonction principale
 */
async function cleanupBackups(): Promise<void> {
  const options = parseArgs();

  console.log("🧹 Database Backup Cleanup\n");

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - No backups will be deleted\n");
  }

  if (!options.force && !options.dryRun) {
    console.log("⚠️  WARNING: This will permanently delete old backups!");
    console.log("   Use --dry-run to preview what will be deleted.");
    console.log("   Use --force to skip this warning.\n");

    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    // Afficher les stats avant nettoyage
    await displayPreCleanupStats();

    // Configuration S3
    const s3 = new S3Client(getS3Config());
    const bucket =
      process.env.AWS_BACKUP_BUCKET || process.env.AWS_S3_BUCKET || "";

    if (!bucket) {
      throw new Error("AWS_BACKUP_BUCKET is not configured");
    }

    // Nettoyer les différents types de backups
    const stats: CleanupStats = {
      dailyDeleted: 0,
      weeklyDeleted: 0,
      monthlyDeleted: 0,
      failedDeleted: 0,
      totalSpaceFreed: 0,
    };

    const dailyResult = await cleanupDailyBackups(s3, bucket, options);
    stats.dailyDeleted = dailyResult.count;
    stats.totalSpaceFreed += dailyResult.spaceFreed;

    const weeklyResult = await cleanupWeeklyBackups(s3, bucket, options);
    stats.weeklyDeleted = weeklyResult.count;
    stats.totalSpaceFreed += weeklyResult.spaceFreed;

    const monthlyResult = await cleanupMonthlyBackups(s3, bucket, options);
    stats.monthlyDeleted = monthlyResult.count;
    stats.totalSpaceFreed += monthlyResult.spaceFreed;

    const failedResult = await cleanupFailedBackups(s3, bucket, options);
    stats.failedDeleted = failedResult.count;

    // Afficher le résumé
    displayCleanupSummary(stats, options.dryRun);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Exécuter le nettoyage
cleanupBackups();
