/**
 * Script pour lister les backups disponibles
 *
 * Usage:
 *   npm run backup:list
 *   npm run backup:list -- --type=DAILY
 *   npm run backup:list -- --status=COMPLETED
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ListOptions {
  type?: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "DELETED";
  limit?: number;
}

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(): ListOptions {
  const args = process.argv.slice(2);
  const options: ListOptions = {
    limit: 20,
  };

  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      options.type = arg.split("=")[1] as any;
    } else if (arg.startsWith("--status=")) {
      options.status = arg.split("=")[1] as any;
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1]);
    }
  }

  return options;
}

/**
 * Formate la taille d'un fichier
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formate une date
 */
function formatDate(date: Date): string {
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Affiche un backup
 */
function displayBackup(backup: any, index: number): void {
  const duration = backup.completedAt
    ? Math.round(
        (new Date(backup.completedAt).getTime() -
          new Date(backup.startedAt).getTime()) /
          1000
      )
    : null;

  console.log(`\n${index + 1}. ${backup.filename}`);
  console.log(`   ID:       ${backup.id}`);
  console.log(`   Type:     ${backup.type}`);
  console.log(`   Status:   ${backup.status}`);
  console.log(`   Size:     ${formatFileSize(backup.fileSize)}`);
  console.log(`   Created:  ${formatDate(backup.createdAt)}`);
  console.log(`   Started:  ${formatDate(backup.startedAt)}`);

  if (backup.completedAt) {
    console.log(`   Completed: ${formatDate(backup.completedAt)}`);
    console.log(`   Duration:  ${duration}s`);
  }

  if (backup.checksum) {
    console.log(`   Checksum: ${backup.checksum.substring(0, 16)}...`);
  }

  if (backup.error) {
    console.log(`   Error:    ${backup.error}`);
  }
}

/**
 * Affiche les statistiques
 */
async function displayStats(): Promise<void> {
  const stats = await prisma.databaseBackup.groupBy({
    by: ["status"],
    _count: true,
  });

  const totalSize = await prisma.databaseBackup.aggregate({
    where: { status: "COMPLETED" },
    _sum: { fileSize: true },
  });

  const lastBackup = await prisma.databaseBackup.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n📊 Statistics:");
  console.log("─────────────────────────────────────────");

  stats.forEach((stat) => {
    console.log(`   ${stat.status.padEnd(15)} ${stat._count}`);
  });

  console.log(`\n   Total size:     ${formatFileSize(totalSize._sum.fileSize || 0)}`);

  if (lastBackup) {
    console.log(`   Last backup:    ${formatDate(lastBackup.createdAt)}`);
    console.log(`   Last type:      ${lastBackup.type}`);
  }
}

/**
 * Liste les backups
 */
async function listBackups(): Promise<void> {
  console.log("🗄️  Database Backups\n");

  const options = parseArgs();

  console.log("Filters:");
  if (options.type) console.log(`   Type:   ${options.type}`);
  if (options.status) console.log(`   Status: ${options.status}`);
  console.log(`   Limit:  ${options.limit}`);

  try {
    const where: any = {};
    if (options.type) where.type = options.type;
    if (options.status) where.status = options.status;

    const backups = await prisma.databaseBackup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit,
    });

    const total = await prisma.databaseBackup.count({ where });

    console.log("\n─────────────────────────────────────────");
    console.log(`Found ${total} backup(s) (showing ${backups.length})`);
    console.log("─────────────────────────────────────────");

    if (backups.length === 0) {
      console.log("\nNo backups found.");
    } else {
      backups.forEach((backup, index) => {
        displayBackup(backup, index);
      });
    }

    // Afficher les statistiques
    await displayStats();

    console.log("\n─────────────────────────────────────────");
    console.log("\nUsage:");
    console.log("  npm run backup:restore <backup-id>");
    console.log("  npm run backup:restore latest");
    console.log("\nExamples:");
    console.log(`  npm run backup:restore ${backups[0]?.id || "clxxx123456789"}`);
    console.log("  npm run backup:restore latest");

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error listing backups:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Exécuter
listBackups();
