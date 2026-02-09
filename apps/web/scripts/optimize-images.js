import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const backupDir = path.join(publicDir, 'images-backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Images to optimize
const imagesToOptimize = [
  'images/bordeaux.jpg',
  'images/marseille_new.jpg',
  'images/lyon_new.jpg',
  'images/lyon.jpg',
  'images/marseille.jpg',
  'Logo LokRoom application.png',
  'map-marker-lokroom.png',
  'location-pin.png',
  'illustration final 2.png',
  'illustration final.png',
  'interface admin support utilsateurs.png',
  'exemple airbnb style.jpeg',
  'exemple taille et emplacement point blanc.png',
  'map-marker-lokroom interieur-2.png',
  'map-marker-lokroom-2.png',
  'map-marker-lokroom-creation.png',
  'icon.png'
];

async function optimizeImage(relativePath) {
  const inputPath = path.join(publicDir, relativePath);
  const parsedPath = path.parse(relativePath);
  const backupPath = path.join(backupDir, path.basename(relativePath));
  const outputPath = path.join(publicDir, parsedPath.dir, `${parsedPath.name}.webp`);

  try {
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${relativePath}`);
      return;
    }

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);

    // Backup original
    fs.copyFileSync(inputPath, backupPath);
    console.log(`📦 Backed up: ${relativePath} (${originalSizeMB} MB)`);

    // Optimize and convert to WebP
    await sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);

    // Get new file size
    const newStats = fs.statSync(outputPath);
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`✅ Optimized: ${relativePath}`);
    console.log(`   ${originalSizeMB} MB → ${newSizeMB} MB (${reduction}% reduction)`);
    console.log(`   Output: ${parsedPath.dir}/${parsedPath.name}.webp\n`);

  } catch (error) {
    console.error(`❌ Error optimizing ${relativePath}:`, error.message);
  }
}

async function optimizeAllImages() {
  console.log('🚀 Starting image optimization...\n');

  for (const imagePath of imagesToOptimize) {
    await optimizeImage(imagePath);
  }

  console.log('✨ Image optimization complete!');
  console.log(`📦 Original images backed up to: ${backupDir}`);
}

optimizeAllImages();
