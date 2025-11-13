import { spawn } from "child_process";
import portfinder from "portfinder";

async function start() {
  try {
    const port = await portfinder.getPortPromise({ port: 3000 });

    process.env.PORT = String(port);
    if (!process.env.NEXTAUTH_URL) {
      process.env.NEXTAUTH_URL = `http://localhost:${port}`;
    }

    console.log(`🚀 Starting Next.js on ${process.env.NEXTAUTH_URL}`);

    const child = spawn("npx", ["next", "dev", "-p", String(port)], {
      stdio: "inherit", // affiche directement les logs de Next
      shell: true, // nécessaire sous Windows
      env: process.env,
    });

    // Propage bien Ctrl+C
    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));

    child.on("close", (code) => process.exit(code ?? 0));
  } catch (err) {
    console.error("❌ Could not find a free port:", err);
    process.exit(1);
  }
}

start();
