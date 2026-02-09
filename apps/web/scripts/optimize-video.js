import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

async function optimizeVideo() {
  const inputPath = path.join(publicDir, 'Animation Logo LokRoom.mp4');
  const outputPath = path.join(publicDir, 'Animation Logo LokRoom-optimized.mp4');
  const backupPath = path.join(publicDir, 'images-backup', 'Animation Logo LokRoom.mp4');

  console.log('🎬 Optimizing video file...\n');

  try {
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.log('⚠️  Video file not found');
      return;
    }

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);
    const originalSizeKB = (originalStats.size / 1024).toFixed(0);

    console.log(`📦 Original video size: ${originalSizeMB} MB (${originalSizeKB} KB)`);

    // Check if ffmpeg is available
    try {
      await execAsync('ffmpeg -version');
    } catch (error) {
      console.log('\n⚠️  FFmpeg not found. Skipping video optimization.');
      console.log('   To optimize video, install FFmpeg: https://ffmpeg.org/download.html');
      console.log('   Or manually compress the video using online tools like:');
      console.log('   - https://www.freeconvert.com/video-compressor');
      console.log('   - https://www.videosmaller.com/');
      return;
    }

    // Backup original
    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }
    fs.copyFileSync(inputPath, backupPath);
    console.log(`📦 Backed up original video\n`);

    // Optimize video with ffmpeg
    console.log('🔄 Compressing video (this may take a minute)...');
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vcodec libx264 -crf 28 -preset fast -vf "scale=iw*min(1\\,min(1280/iw\\,720/ih)):-2" -movflags +faststart -y "${outputPath}"`;

    await execAsync(ffmpegCommand);

    // Get new file size
    const newStats = fs.statSync(outputPath);
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
    const newSizeKB = (newStats.size / 1024).toFixed(0);
    const reduction = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`\n✅ Video optimized!`);
    console.log(`   ${originalSizeMB} MB → ${newSizeMB} MB (${newSizeKB} KB)`);
    console.log(`   ${reduction}% reduction`);

    // Replace original with optimized
    fs.copyFileSync(outputPath, inputPath);
    fs.unlinkSync(outputPath);

    console.log(`✅ Replaced original video with optimized version\n`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

optimizeVideo();
