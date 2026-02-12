#!/usr/bin/env node

/**
 * Script pour remplacer tous les console.log/error/warn/info par le logger centralisé
 * Usage: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns à remplacer
const patterns = [
  {
    // console.error("message", error) -> logger.error("message", error)
    regex: /console\.error\(/g,
    replacement: 'logger.error(',
  },
  {
    // console.warn("message") -> logger.warn("message")
    regex: /console\.warn\(/g,
    replacement: 'logger.warn(',
  },
  {
    // console.info("message") -> logger.info("message")
    regex: /console\.info\(/g,
    replacement: 'logger.info(',
  },
  {
    // console.log("message") -> logger.debug("message")
    regex: /console\.log\(/g,
    replacement: 'logger.debug(',
  },
  {
    // console.debug("message") -> logger.debug("message")
    regex: /console\.debug\(/g,
    replacement: 'logger.debug(',
  },
];

// Fichiers à exclure
const excludePatterns = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  'scripts/replace-console-logs.js',
  'lib/logger.ts', // Ne pas modifier le logger lui-même
];

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function needsLoggerImport(content) {
  // Vérifier si le fichier utilise déjà logger
  return /logger\.(error|warn|info|debug)/.test(content);
}

function hasLoggerImport(content) {
  // Vérifier si le fichier importe déjà logger
  return /import.*logger.*from.*@\/lib\/logger/.test(content) ||
         /import.*\{.*logger.*\}.*from.*@\/lib\/logger/.test(content);
}

function addLoggerImport(content, filePath) {
  // Déterminer le chemin relatif vers lib/logger
  const isApiRoute = filePath.includes('/api/');
  const isComponent = filePath.includes('/components/');
  const isApp = filePath.includes('/app/');

  // Ajouter l'import après les autres imports
  const importStatement = 'import { logger } from "@/lib/logger";\n';

  // Trouver la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Insérer après le dernier import
    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join('\n');
  } else {
    // Pas d'imports trouvés, ajouter au début
    return importStatement + content;
  }
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Appliquer les remplacements
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        content = content.replace(pattern.regex, pattern.replacement);
        modified = true;
      }
    }

    // Si modifié et besoin d'import logger
    if (modified && needsLoggerImport(content) && !hasLoggerImport(content)) {
      content = addLoggerImport(content, filePath);
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath}`);
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (shouldExclude(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main
console.log('🔍 Recherche des fichiers TypeScript...\n');

const srcDir = path.join(__dirname, '..', 'apps', 'web', 'src');
const files = findFiles(srcDir);

console.log(`📁 ${files.length} fichiers trouvés\n`);
console.log('🔄 Remplacement des console.* par logger.*...\n');

let modifiedCount = 0;

files.forEach(file => {
  modifiedCount += processFile(file);
});

console.log(`\n✅ ${modifiedCount} fichiers modifiés`);
console.log(`📊 ${files.length - modifiedCount} fichiers inchangés`);

// Vérifier s'il reste des console.*
console.log('\n🔍 Vérification des console.* restants...');

try {
  const result = execSync(
    'grep -r "console\\." apps/web/src --include="*.ts" --include="*.tsx" | wc -l',
    { encoding: 'utf8', cwd: path.join(__dirname, '..') }
  );

  const remaining = parseInt(result.trim());

  if (remaining > 0) {
    console.log(`⚠️  ${remaining} occurrences de console.* restantes`);
    console.log('   (probablement dans des commentaires ou strings)');
  } else {
    console.log('✅ Aucun console.* restant !');
  }
} catch (error) {
  console.log('⚠️  Impossible de vérifier les console.* restants');
}

console.log('\n✨ Terminé !');
