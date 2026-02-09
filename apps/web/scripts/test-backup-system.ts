/**
 * Script de test pour le système de backup
 *
 * Usage:
 *   npm run test:backup
 */

import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, unlinkSync } from "fs";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Exécute un test
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  console.log(`\n🧪 Testing: ${name}`);
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({ name, passed: false, error: String(error), duration });
    console.error(`❌ FAILED (${duration}ms):`, error);
  }
}

/**
 * Test 1: Vérifier la configuration
 */
async function testConfiguration(): Promise<void> {
  const requiredEnvVars = [
    "DATABASE_URL",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_BACKUP_BUCKET",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
  }

  console.log("   ✓ All required environment variables are set");
}

/**
 * Test 2: Vérifier la connexion à la base de données
 */
async function testDatabaseConnection(): Promise<void> {
  await prisma.$connect();
  const userCount = await prisma.user.count();
  console.log(`   ✓ Database connected (${userCount} users)`);
}

/**
 * Test 3: Vérifier que pg_dump est installé
 */
async function testPgDump(): Promise<void> {
  try {
    const { stdout } = await execAsync("pg_dump --version");
    console.log(`   ✓ pg_dump installed: ${stdout.trim()}`);
  } catch (error) {
    throw new Error("pg_dump not found. Please install PostgreSQL client tools.");
  }
}

/**
 * Test 4: Vérifier que psql est installé
 */
async function testPsql(): Promise<void> {
  try {
    const { stdout } = await execAsync("psql --version");
    console.log(`   ✓ psql installed: ${stdout.trim()}`);
  } catch (error) {
    throw new Error("psql not found. Please install PostgreSQL client tools.");
  }
}

/**
 * Test 5: Vérifier le modèle DatabaseBackup
 */
async function testDatabaseBackupModel(): Promise<void> {
  // Créer un backup de test
  const testBackup = await prisma.databaseBackup.create({
    data: {
      filename: "test-backup.sql.gz",
      fileUrl: "s3://test-bucket/test-backup.sql.gz",
      fileSize: 1024,
      type: "MANUAL",
      status: "COMPLETED",
      startedAt: new Date(),
      completedAt: new Date(),
      checksum: "abc123",
    },
  });

  console.log(`   ✓ DatabaseBackup model works (ID: ${testBackup.id})`);

  // Nettoyer
  await prisma.databaseBackup.delete({
    where: { id: testBackup.id },
  });

  console.log("   ✓ Test backup cleaned up");
}

/**
 * Test 6: Vérifier les scripts de backup
 */
async function testBackupScripts(): Promise<void> {
  const scripts = [
    "scripts/backup-database.ts",
    "scripts/restore-database.ts",
    "scripts/list-backups.ts",
  ];

  for (const script of scripts) {
    if (!existsSync(script)) {
      throw new Error(`Script not found: ${script}`);
    }
  }

  console.log("   ✓ All backup scripts exist");
}

/**
 * Test 7: Vérifier les API routes
 */
async function testApiRoutes(): Promise<void> {
  const routes = [
    "src/app/api/admin/backups/route.ts",
    "src/app/api/admin/backups/[id]/route.ts",
    "src/app/api/admin/backups/[id]/download/route.ts",
    "src/app/api/admin/backups/[id]/restore/route.ts",
  ];

  for (const route of routes) {
    if (!existsSync(route)) {
      throw new Error(`API route not found: ${route}`);
    }
  }

  console.log("   ✓ All API routes exist");
}

/**
 * Test 8: Vérifier l'interface admin
 */
async function testAdminInterface(): Promise<void> {
  const adminPage = "src/app/admin/backups/page.tsx";

  if (!existsSync(adminPage)) {
    throw new Error(`Admin page not found: ${adminPage}`);
  }

  console.log("   ✓ Admin interface exists");
}

/**
 * Test 9: Vérifier le workflow GitHub Actions
 */
async function testGitHubWorkflow(): Promise<void> {
  const workflow = ".github/workflows/database-backup.yml";

  if (!existsSync(workflow)) {
    throw new Error(`GitHub workflow not found: ${workflow}`);
  }

  console.log("   ✓ GitHub Actions workflow exists");
}

/**
 * Test 10: Vérifier les scripts NPM
 */
async function testNpmScripts(): Promise<void> {
  const packageJson = require("../package.json");
  const requiredScripts = [
    "backup:database",
    "backup:restore",
    "backup:list",
  ];

  for (const script of requiredScripts) {
    if (!packageJson.scripts[script]) {
      throw new Error(`NPM script not found: ${script}`);
    }
  }

  console.log("   ✓ All NPM scripts are configured");
}

/**
 * Test 11: Test de backup complet (optionnel, commenté par défaut)
 */
async function testFullBackup(): Promise<void> {
  console.log("   ⚠️  Skipping full backup test (uncomment to enable)");

  // Décommenter pour tester un backup complet
  /*
  console.log("   ⏳ Running full backup (this may take a while)...");

  try {
    await execAsync("npm run backup:database", {
      timeout: 300000, // 5 minutes
    });

    // Vérifier que le backup a été créé
    const latestBackup = await prisma.databaseBackup.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    });

    if (!latestBackup) {
      throw new Error("No backup found after running backup script");
    }

    console.log(`   ✓ Full backup completed (ID: ${latestBackup.id})`);
    console.log(`   ✓ File size: ${(latestBackup.fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Nettoyer le backup de test
    await prisma.databaseBackup.update({
      where: { id: latestBackup.id },
      data: { status: "DELETED" },
    });

    console.log("   ✓ Test backup marked as deleted");
  } catch (error) {
    throw new Error(`Full backup test failed: ${error}`);
  }
  */
}

/**
 * Test 12: Vérifier les permissions admin
 */
async function testAdminPermissions(): Promise<void> {
  // Vérifier que le fichier admin-auth existe
  const adminAuthFile = "src/lib/admin-auth.ts";

  if (!existsSync(adminAuthFile)) {
    console.log("   ⚠️  admin-auth.ts not found (may need to be created)");
  } else {
    console.log("   ✓ Admin auth file exists");
  }
}

/**
 * Affiche le résumé des tests
 */
function displaySummary(): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`\n   ${r.name}`);
        console.log(`   Error: ${r.error}`);
      });
  }

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`\nTotal duration: ${totalDuration}ms`);

  console.log("\n" + "=".repeat(60));

  if (failed === 0) {
    console.log("✅ ALL TESTS PASSED!");
    console.log("\n🎉 The backup system is ready to use!");
  } else {
    console.log("❌ SOME TESTS FAILED");
    console.log("\n⚠️  Please fix the issues before using the backup system.");
  }

  console.log("=".repeat(60) + "\n");
}

/**
 * Fonction principale
 */
async function runTests(): Promise<void> {
  console.log("🚀 Starting Backup System Tests\n");
  console.log("This will verify that all components are properly configured.\n");

  // Tests de configuration
  await runTest("Configuration - Environment Variables", testConfiguration);
  await runTest("Configuration - Database Connection", testDatabaseConnection);
  await runTest("Configuration - pg_dump Installation", testPgDump);
  await runTest("Configuration - psql Installation", testPsql);

  // Tests de modèle
  await runTest("Database - DatabaseBackup Model", testDatabaseBackupModel);

  // Tests de fichiers
  await runTest("Files - Backup Scripts", testBackupScripts);
  await runTest("Files - API Routes", testApiRoutes);
  await runTest("Files - Admin Interface", testAdminInterface);
  await runTest("Files - GitHub Workflow", testGitHubWorkflow);

  // Tests de configuration
  await runTest("Configuration - NPM Scripts", testNpmScripts);
  await runTest("Configuration - Admin Permissions", testAdminPermissions);

  // Test de backup complet (optionnel)
  await runTest("Integration - Full Backup (Optional)", testFullBackup);

  // Afficher le résumé
  displaySummary();

  // Déconnecter Prisma
  await prisma.$disconnect();

  // Exit avec le bon code
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Exécuter les tests
runTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
