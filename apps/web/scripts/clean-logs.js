const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours

console.log("Starting log cleanup...");
console.log(`Logs directory: ${logsDir}`);

if (!fs.existsSync(logsDir)) {
  console.log("Logs directory does not exist. Nothing to clean.");
  process.exit(0);
}

fs.readdir(logsDir, (err, files) => {
  if (err) {
    console.error("Error reading logs directory:", err);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("No log files found.");
    process.exit(0);
  }

  let deletedCount = 0;
  let keptCount = 0;

  files.forEach(file => {
    const filePath = path.join(logsDir, file);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error(`Error reading file stats for ${file}:`, err);
        return;
      }

      const age = Date.now() - stats.mtime.getTime();
      const ageInDays = Math.floor(age / (24 * 60 * 60 * 1000));

      if (age > maxAge) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting ${file}:`, err);
          } else {
            deletedCount++;
            console.log(`Deleted: ${file} (${ageInDays} days old)`);
          }
        });
      } else {
        keptCount++;
        console.log(`Kept: ${file} (${ageInDays} days old)`);
      }
    });
  });

  setTimeout(() => {
    console.log(`\nCleanup complete: ${deletedCount} files deleted, ${keptCount} files kept.`);
  }, 1000);
});
