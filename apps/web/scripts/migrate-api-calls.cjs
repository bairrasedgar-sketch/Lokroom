#!/usr/bin/env node

/**
 * Script de migration des appels API
 * Remplace tous les fetch() par api.get/post/put/delete()
 * Architecture professionnelle style Airbnb
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Patterns à rechercher et remplacer
const patterns = [
  // fetch GET
  {
    regex: /fetch\(['"`](\/(api\/[^'"`]+))['"`]\)/g,
    replacement: "api.get('$1')",
    method: 'GET',
  },
  // fetch POST
  {
    regex: /fetch\(['"`](\/(api\/[^'"`]+))['"`],\s*\{[^}]*method:\s*['"`]POST['"`][^}]*body:\s*JSON\.stringify\(([^)]+)\)[^}]*\}\)/g,
    replacement: "api.post('$1', $2)",
    method: 'POST',
  },
  // fetch PUT
  {
    regex: /fetch\(['"`](\/(api\/[^'"`]+))['"`],\s*\{[^}]*method:\s*['"`]PUT['"`][^}]*body:\s*JSON\.stringify\(([^)]+)\)[^}]*\}\)/g,
    replacement: "api.put('$1', $2)",
    method: 'PUT',
  },
  // fetch PATCH
  {
    regex: /fetch\(['"`](\/(api\/[^'"`]+))['"`],\s*\{[^}]*method:\s*['"`]PATCH['"`][^}]*body:\s*JSON\.stringify\(([^)]+)\)[^}]*\}\)/g,
    replacement: "api.patch('$1', $2)",
    method: 'PATCH',
  },
  // fetch DELETE
  {
    regex: /fetch\(['"`](\/(api\/[^'"`]+))['"`],\s*\{[^}]*method:\s*['"`]DELETE['"`][^}]*\}\)/g,
    replacement: "api.delete('$1')",
    method: 'DELETE',
  },
];

// Vérifier si le fichier a déjà l'import
function hasApiImport(content) {
  return content.includes("from '@/lib/api-client'") ||
         content.includes('from "@/lib/api-client"');
}

// Ajouter l'import si nécessaire
function addApiImport(content) {
  if (hasApiImport(content)) {
    return content;
  }

  // Trouver la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  // Ajouter l'import après la dernière ligne d'import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import { api } from '@/lib/api-client';");
  } else {
    // Pas d'import trouvé, ajouter au début
    lines.unshift("import { api } from '@/lib/api-client';");
  }

  return lines.join('\n');
}

// Migrer un fichier
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  // Appliquer chaque pattern
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches) {
      content = content.replace(pattern.regex, pattern.replacement);
      modified = true;
      changes.push(`${matches.length} ${pattern.method} call(s)`);
    }
  }

  if (modified) {
    // Ajouter l'import
    content = addApiImport(content);

    // Écrire le fichier
    fs.writeFileSync(filePath, content, 'utf8');

    return { modified: true, changes };
  }

  return { modified: false, changes: [] };
}

// Main
async function main() {
  log('\n🚀 Migration des appels API vers api-client\n', 'blue');

  // Trouver tous les fichiers TypeScript/JavaScript
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  });

  log(`📁 ${files.length} fichiers trouvés\n`, 'yellow');

  let totalModified = 0;
  let totalChanges = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const result = migrateFile(filePath);

    if (result.modified) {
      totalModified++;
      totalChanges += result.changes.length;
      log(`✅ ${file}`, 'green');
      result.changes.forEach(change => {
        log(`   → ${change}`, 'yellow');
      });
    }
  }

  log(`\n📊 Résumé:`, 'blue');
  log(`   ${totalModified} fichier(s) modifié(s)`, 'green');
  log(`   ${totalChanges} appel(s) API migré(s)`, 'green');

  if (totalModified === 0) {
    log('\n✨ Aucune migration nécessaire - tous les appels API sont déjà migrés!', 'green');
  } else {
    log('\n✨ Migration terminée avec succès!', 'green');
    log('\n⚠️  Vérifiez les fichiers modifiés et testez l\'application', 'yellow');
  }
}

main().catch(error => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  process.exit(1);
});
