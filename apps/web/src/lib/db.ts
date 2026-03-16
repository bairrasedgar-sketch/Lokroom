import { PrismaClient } from "@prisma/client";
import { log } from "./logger/service";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
      ...(process.env.NODE_ENV !== "production"
        ? [{ emit: "event" as const, level: "query" as const }]
        : []),
    ],
  });

// Log des requêtes lentes (> 1s) — dev only
if (process.env.NODE_ENV !== "production") {
  // @ts-ignore - Prisma event types
  prisma.$on("query", (e: any) => {
    if (e.duration > 1000) {
      log.logSlowQuery(e.query, e.duration, e.params);
    }
  });
}

// Log des erreurs Prisma
// @ts-ignore - Prisma event types
prisma.$on("error", (e: any) => {
  log.error("Prisma Error", new Error(e.message));
});

// Log des warnings Prisma
// @ts-ignore - Prisma event types
prisma.$on("warn", (e: any) => {
  log.warn("Prisma Warning", { message: e.message });
});

// Cache le client en prod ET en dev pour éviter les connexions orphelines
globalForPrisma.prisma = prisma;
