import { PrismaClient } from "@prisma/client";
import { log } from "./logger/service";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

// Log des requêtes lentes (> 1s)
// @ts-ignore - Prisma event types
prisma.$on("query", (e: any) => {
  if (e.duration > 1000) {
    log.logSlowQuery(e.query, e.duration, e.params);
  }
});

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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
