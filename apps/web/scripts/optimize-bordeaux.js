import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Optimize bordeaux.jpg more aggressively
async function optimizeBordeaux() {
  const inputPath = path.join(publicDir, 'images', 'bordeaux.jpg');
  const outputPath = path.join(publicDir, 'images', 'bordeaux-optimized.webp');

  console.log('🎯 Optimizing bordeaux.jpg more aggressively...\n');

  try {
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);

    // Resize and optimize aggressively
    await sharp(inputPath)
      .resize(1920, null, { // Max width 1920px for web
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
    const newSizeKB = (newStats.size / 1024).toFixed(0);
    const reduction = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`✅ Bordeaux optimized!`);
    console.log(`   ${originalSizeMB} MB → ${newSizeMB} MB (${newSizeKB} KB)`);
    console.log(`   ${reduction}% reduction`);
    console.log(`   Output: images/bordeaux-optimized.webp\n`);

    // Replace original webp with optimized version
    const webpPath = path.join(publicDir, 'images', 'bordeaux.webp');
    fs.copyFileSync(outputPath, webpPath);
    fs.unlinkSync(outputPath);

    console.log(`✅ Replaced bordeaux.webp with optimized version\n`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

optimizeBordeaux();
