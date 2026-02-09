#!/usr/bin/env node

/**
 * Script de compression Brotli pour les assets statiques
 * Génère des fichiers .br et .gz pour tous les assets JS, CSS, HTML
 * Exécuté automatiquement après le build Next.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { glob } = require('glob');
const brotliCompress = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

// Configuration Brotli (niveau maximum pour meilleure compression)
const BROTLI_OPTIONS = {
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
  },
};

// Configuration Gzip (niveau maximum)
const GZIP_OPTIONS = {
  level: zlib.constants.Z_BEST_COMPRESSION,
};

// Extensions à compresser
const EXTENSIONS = ['js', 'css', 'html', 'json', 'svg', 'xml', 'txt'];

// Taille minimum pour compression (1KB)
const MIN_SIZE = 1024;

// Statistiques
const stats = {
  totalFiles: 0,
  compressedFiles: 0,
  skippedFiles: 0,
  originalSize: 0,
  brotliSize: 0,
  gzipSize: 0,
  errors: [],
};

/**
 * Formate la taille en octets
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calcule le pourcentage de réduction
 */
function calculateReduction(original, compressed) {
  return ((1 - compressed / original) * 100).toFixed(2);
}

/**
 * Compresse un fichier avec Brotli et Gzip
 */
async function compressFile(filePath) {
  try {
    // Lire le fichier
    const content = await fs.promises.readFile(filePath);
    const originalSize = content.length;

    // Ignorer les petits fichiers
    if (originalSize < MIN_SIZE) {
      stats.skippedFiles++;
      return;
    }

    // Compression Brotli
    const brotliContent = await brotliCompress(content, BROTLI_OPTIONS);
    await fs.promises.writeFile(`${filePath}.br`, brotliContent);

    // Compression Gzip
    const gzipContent = await gzip(content, GZIP_OPTIONS);
    await fs.promises.writeFile(`${filePath}.gz`, gzipContent);

    // Mise à jour des statistiques
    stats.compressedFiles++;
    stats.originalSize += originalSize;
    stats.brotliSize += brotliContent.length;
    stats.gzipSize += gzipContent.length;

    // Log détaillé pour les gros fichiers
    if (originalSize > 100 * 1024) {
      const brotliReduction = calculateReduction(originalSize, brotliContent.length);
      const gzipReduction = calculateReduction(originalSize, gzipContent.length);
      console.log(`  ${path.basename(filePath)}`);
      console.log(`    Original: ${formatBytes(originalSize)}`);
      console.log(`    Brotli: ${formatBytes(brotliContent.length)} (-${brotliReduction}%)`);
      console.log(`    Gzip: ${formatBytes(gzipContent.length)} (-${gzipReduction}%)`);
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`  Error compressing ${filePath}: ${error.message}`);
  }
}

/**
 * Trouve tous les fichiers à compresser
 */
async function findFiles(baseDir) {
  const patterns = EXTENSIONS.map(ext => `${baseDir}/**/*.${ext}`);
  const allFiles = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/*.br',
        '**/*.gz',
        '**/cache/**',
      ],
      nodir: true,
      windowsPathsNoEscape: true,
    });
    allFiles.push(...files);
  }

  return allFiles;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🗜️  Compression Brotli - Lok\'Room Assets\n');
  console.log('━'.repeat(60));

  const buildDir = path.join(process.cwd(), '.next');
  const publicDir = path.join(process.cwd(), 'public');

  // Vérifier que le dossier .next existe
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log(`📁 Scanning directories:`);
  console.log(`   - ${buildDir}`);
  console.log(`   - ${publicDir}`);
  console.log('');

  // Trouver tous les fichiers
  const buildFiles = await findFiles(buildDir);
  const publicFiles = fs.existsSync(publicDir) ? await findFiles(publicDir) : [];
  const allFiles = [...buildFiles, ...publicFiles];

  stats.totalFiles = allFiles.length;

  console.log(`📊 Found ${stats.totalFiles} files to process\n`);
  console.log('🔄 Compressing large files (>100KB):\n');

  // Compresser tous les fichiers en parallèle (par lots de 10)
  const BATCH_SIZE = 10;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(file => compressFile(file)));
  }

  // Afficher le rapport final
  console.log('\n' + '━'.repeat(60));
  console.log('📈 Compression Report\n');
  console.log(`Total files scanned:     ${stats.totalFiles}`);
  console.log(`Files compressed:        ${stats.compressedFiles}`);
  console.log(`Files skipped (<1KB):    ${stats.skippedFiles}`);
  console.log('');
  console.log(`Original size:           ${formatBytes(stats.originalSize)}`);
  console.log(`Brotli size:             ${formatBytes(stats.brotliSize)} (-${calculateReduction(stats.originalSize, stats.brotliSize)}%)`);
  console.log(`Gzip size:               ${formatBytes(stats.gzipSize)} (-${calculateReduction(stats.originalSize, stats.gzipSize)}%)`);
  console.log('');

  // Comparaison Brotli vs Gzip
  const brotliVsGzip = calculateReduction(stats.gzipSize, stats.brotliSize);
  console.log(`Brotli vs Gzip:          ${formatBytes(stats.brotliSize)} vs ${formatBytes(stats.gzipSize)} (-${brotliVsGzip}% better)`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${path.basename(file)}: ${error}`);
    });
  }

  console.log('\n✅ Compression complete!\n');
  console.log('━'.repeat(60));

  // Sauvegarder le rapport
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    brotliVsGzipImprovement: `${brotliVsGzip}%`,
  };

  await fs.promises.writeFile(
    path.join(process.cwd(), 'compression-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('📄 Report saved to compression-report.json\n');
}

// Exécuter
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
