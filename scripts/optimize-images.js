const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../apps/web/public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const BACKUP_DIR = path.join(PUBLIC_DIR, 'images-backup');
const MAX_SIZE_KB = 200;
const QUALITY = 85;

// Fichiers à exclure de l'optimisation
const EXCLUDE_FILES = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'icon.png',
  'og-image.png'
];

// Créer le dossier de backup s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / 1024; // KB
}

async function optimizeImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const fileName = path.basename(inputPath);

  // Skip si dans la liste d'exclusion
  if (EXCLUDE_FILES.includes(fileName)) {
    return { skipped: true, reason: 'excluded-file' };
  }

  // Skip si déjà en WebP
  if (ext === '.webp') {
    const size = await getFileSize(inputPath);
    return { skipped: true, size, reason: 'already-webp' };
  }

  // Skip si pas une image supportée
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return { skipped: true, reason: 'unsupported-format' };
  }

  const originalSize = await getFileSize(inputPath);

  // Backup de l'original
  const backupPath = path.join(BACKUP_DIR, path.basename(inputPath));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
  }

  // Conversion en WebP
  await sharp(inputPath)
    .webp({ quality: QUALITY })
    .toFile(outputPath);

  const newSize = await getFileSize(outputPath);
  const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2);

  return {
    skipped: false,
    originalSize,
    newSize,
    savings,
    format: ext
  };
}

async function main() {
  console.log('🚀 Optimisation des images Lok\'Room\n');
  console.log(`📁 Dossier public: ${PUBLIC_DIR}`);
  console.log(`📁 Dossier images: ${IMAGES_DIR}`);
  console.log(`💾 Backup: ${BACKUP_DIR}`);
  console.log(`🎯 Qualité: ${QUALITY}%`);
  console.log(`📦 Taille max: ${MAX_SIZE_KB}KB\n`);

  // Créer le dossier de backup s'il n'existe pas
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Scanner tous les fichiers dans public/ et public/images/
  const allFiles = [];

  // Fichiers dans public/
  const publicFiles = fs.readdirSync(PUBLIC_DIR);
  publicFiles.forEach(f => {
    const fullPath = path.join(PUBLIC_DIR, f);
    if (fs.statSync(fullPath).isFile()) {
      const ext = path.extname(f).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        allFiles.push({ path: fullPath, relativePath: f });
      }
    }
  });

  // Fichiers dans public/images/
  if (fs.existsSync(IMAGES_DIR)) {
    const imageFiles = fs.readdirSync(IMAGES_DIR);
    imageFiles.forEach(f => {
      const fullPath = path.join(IMAGES_DIR, f);
      if (fs.statSync(fullPath).isFile()) {
        const ext = path.extname(f).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          allFiles.push({ path: fullPath, relativePath: `images/${f}` });
        }
      }
    });
  }

  console.log(`📸 ${allFiles.length} images trouvées\n`);

  const results = {
    optimized: [],
    skipped: [],
    errors: [],
    totalOriginalSize: 0,
    totalNewSize: 0
  };

  for (const file of allFiles) {
    const inputPath = file.path;
    const baseName = path.basename(file.path, path.extname(file.path));
    const dirName = path.dirname(file.path);
    const outputPath = path.join(dirName, `${baseName}.webp`);

    try {
      console.log(`⚙️  Processing: ${file.relativePath}`);
      const result = await optimizeImage(inputPath, outputPath);

      if (result.skipped) {
        results.skipped.push({ file: file.relativePath, reason: result.reason, size: result.size });
        console.log(`   ⏭️  Skipped (${result.reason})`);
      } else {
        results.optimized.push({
          original: file.relativePath,
          output: path.relative(PUBLIC_DIR, outputPath),
          originalSize: result.originalSize,
          newSize: result.newSize,
          savings: result.savings
        });
        results.totalOriginalSize += result.originalSize;
        results.totalNewSize += result.newSize;
        console.log(`   ✅ ${result.originalSize.toFixed(2)}KB → ${result.newSize.toFixed(2)}KB (${result.savings}% saved)`);
      }
    } catch (error) {
      results.errors.push({ file: file.relativePath, error: error.message });
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT D\'OPTIMISATION');
  console.log('='.repeat(60));
  console.log(`\n✅ Images optimisées: ${results.optimized.length}`);
  console.log(`⏭️  Images ignorées: ${results.skipped.length}`);
  console.log(`❌ Erreurs: ${results.errors.length}`);

  if (results.optimized.length > 0) {
    const totalSavings = results.totalOriginalSize - results.totalNewSize;
    const totalSavingsPercent = ((totalSavings / results.totalOriginalSize) * 100).toFixed(2);

    console.log(`\n💾 Taille originale totale: ${results.totalOriginalSize.toFixed(2)}KB`);
    console.log(`📦 Taille optimisée totale: ${results.totalNewSize.toFixed(2)}KB`);
    console.log(`🎉 Gain total: ${totalSavings.toFixed(2)}KB (${totalSavingsPercent}%)`);

    console.log('\n📋 Détails:');
    results.optimized.forEach(r => {
      console.log(`   ${r.original} → ${r.output}`);
      console.log(`   ${r.originalSize.toFixed(2)}KB → ${r.newSize.toFixed(2)}KB (-${r.savings}%)`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  Images ignorées:');
    results.skipped.forEach(r => {
      const sizeInfo = r.size ? ` (${r.size.toFixed(2)}KB)` : '';
      console.log(`   ${r.file} - ${r.reason}${sizeInfo}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Erreurs:');
    results.errors.forEach(r => {
      console.log(`   ${r.file}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Optimisation terminée!');
  console.log('='.repeat(60));

  // Sauvegarder le rapport en JSON
  const reportPath = path.join(__dirname, 'optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
}

main().catch(console.error);
