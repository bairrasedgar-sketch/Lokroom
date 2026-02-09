/**
 * Script pour créer des images de test pour Playwright
 * Génère des images PNG simples pour les tests d'upload
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le répertoire si nécessaire
const imagesDir = path.join(__dirname, '../tests/fixtures/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Créer 10 images de test simples (1x1 pixel PNG)
// En production, vous utiliseriez de vraies images
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

for (let i = 1; i <= 10; i++) {
  const filePath = path.join(imagesDir, `test-photo-${i}.jpg`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Created: test-photo-${i}.jpg`);
}

console.log('\n✅ Test images created successfully!');
console.log(`📁 Location: ${imagesDir}`);
