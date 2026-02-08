#!/usr/bin/env node

/**
 * Script de déploiement automatique - Lok'Room Mobile
 * Automatise tout le processus : migration API + build + sync
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function checkPrerequisites() {
  log('\n🔍 Vérification des prérequis...\n', 'blue');

  // Vérifier Node.js
  try {
    const nodeVersion = exec('node --version', { silent: true });
    log(`✅ Node.js: ${nodeVersion.trim()}`, 'green');
  } catch {
    log('❌ Node.js non trouvé. Installez Node.js d\'abord.', 'red');
    process.exit(1);
  }

  // Vérifier npm
  try {
    const npmVersion = exec('npm --version', { silent: true });
    log(`✅ npm: ${npmVersion.trim()}`, 'green');
  } catch {
    log('❌ npm non trouvé.', 'red');
    process.exit(1);
  }

  // Vérifier Capacitor
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.dependencies['@capacitor/core']) {
    log(`✅ Capacitor: ${packageJson.dependencies['@capacitor/core']}`, 'green');
  } else {
    log('❌ Capacitor non installé.', 'red');
    process.exit(1);
  }

  log('');
}

async function configureEnvironment() {
  log('⚙️  Configuration de l\'environnement mobile...\n', 'blue');

  // Vérifier si .env.local existe
  if (!fs.existsSync('.env.local')) {
    log('⚠️  Fichier .env.local non trouvé', 'yellow');
    const createEnv = await askQuestion('Voulez-vous le créer maintenant ? (o/n)');

    if (createEnv.toLowerCase() !== 'o') {
      log('❌ Configuration annulée', 'red');
      process.exit(1);
    }
  }

  // Demander l'URL du backend
  log('\n📝 Configuration des variables d\'environnement:\n', 'cyan');

  const backendUrl = await askQuestion('URL du backend Vercel (ex: https://lokroom.vercel.app):');

  if (!backendUrl) {
    log('❌ URL du backend requise', 'red');
    process.exit(1);
  }

  // Créer/mettre à jour .env.local
  let envContent = '';

  if (fs.existsSync('.env.local')) {
    envContent = fs.readFileSync('.env.local', 'utf8');
  }

  // Ajouter/mettre à jour les variables
  const envVars = {
    'NEXT_PUBLIC_API_URL': backendUrl,
    'CAPACITOR_BUILD': 'true',
  };

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync('.env.local', envContent.trim() + '\n');

  log('\n✅ Variables d\'environnement configurées', 'green');
  log(`   NEXT_PUBLIC_API_URL=${backendUrl}`, 'cyan');
  log(`   CAPACITOR_BUILD=true`, 'cyan');
}

async function migrateApiCalls() {
  log('\n🔄 Migration des appels API...\n', 'blue');

  try {
    exec('node scripts/migrate-api-calls.js');
    log('\n✅ Migration des appels API terminée', 'green');
  } catch (error) {
    log('\n⚠️  Erreur lors de la migration (peut être ignorée si déjà fait)', 'yellow');
  }
}

async function buildMobile() {
  log('\n🏗️  Build de l\'application mobile...\n', 'blue');

  try {
    log('📦 Génération de Prisma...', 'cyan');
    exec('npx prisma generate --schema=./prisma/schema.prisma');

    log('\n📦 Build Next.js en mode static...', 'cyan');
    exec('cross-env CAPACITOR_BUILD=true next build');

    log('\n✅ Build terminé avec succès', 'green');
  } catch (error) {
    log('\n❌ Erreur lors du build', 'red');
    log('Vérifiez les logs ci-dessus pour plus de détails', 'yellow');
    process.exit(1);
  }
}

async function syncCapacitor() {
  log('\n🔄 Synchronisation avec Capacitor...\n', 'blue');

  try {
    exec('npx cap sync');
    log('\n✅ Synchronisation terminée', 'green');
  } catch (error) {
    log('\n❌ Erreur lors de la synchronisation', 'red');
    process.exit(1);
  }
}

function showNextSteps() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 DÉPLOIEMENT MOBILE TERMINÉ AVEC SUCCÈS !', 'green');
  log('='.repeat(60) + '\n', 'cyan');

  log('📱 Prochaines étapes:\n', 'blue');

  log('1️⃣  Tester sur iOS (Mac uniquement):', 'cyan');
  log('   npm run cap:open:ios\n', 'yellow');

  log('2️⃣  Tester sur Android:', 'cyan');
  log('   npm run cap:open:android\n', 'yellow');

  log('3️⃣  Dans Xcode/Android Studio:', 'cyan');
  log('   - Sélectionner un simulateur/émulateur', 'yellow');
  log('   - Cliquer sur ▶️ (Run)', 'yellow');
  log('   - Voir ton animation splash screen ! 🎬\n', 'yellow');

  log('📚 Documentation:', 'blue');
  log('   - DEPLOYMENT_GUIDE.md - Guide complet', 'cyan');
  log('   - ARCHITECTURE_PRO.md - Architecture détaillée', 'cyan');
  log('   - FINAL_SUMMARY.md - Résumé complet\n', 'cyan');

  log('💡 Besoin d\'aide ?', 'blue');
  log('   - Vérifier les logs ci-dessus', 'cyan');
  log('   - Consulter la documentation', 'cyan');
  log('   - Vérifier que le backend Vercel fonctionne\n', 'cyan');

  log('🚀 Ton app mobile est prête !', 'green');
  log('='.repeat(60) + '\n', 'cyan');
}

async function main() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🚀 DÉPLOIEMENT AUTOMATIQUE - LOK\'ROOM MOBILE', 'magenta');
  log('='.repeat(60) + '\n', 'magenta');

  try {
    // Étape 1 : Vérifier les prérequis
    await checkPrerequisites();

    // Étape 2 : Configurer l'environnement
    await configureEnvironment();

    // Étape 3 : Migrer les appels API
    const skipMigration = process.argv.includes('--skip-migration');
    if (!skipMigration) {
      await migrateApiCalls();
    } else {
      log('\n⏭️  Migration API ignorée (--skip-migration)', 'yellow');
    }

    // Étape 4 : Build l'application
    await buildMobile();

    // Étape 5 : Synchroniser avec Capacitor
    await syncCapacitor();

    // Étape 6 : Afficher les prochaines étapes
    showNextSteps();

  } catch (error) {
    log('\n❌ Erreur fatale:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Lancer le script
main();
