export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 🔒 SÉCURITÉ : Whitelist stricte des types de logs autorisés
const ALLOWED_LOG_TYPES = ["all", "error", "http", "business"] as const;
type LogType = typeof ALLOWED_LOG_TYPES[number];

export async function GET(req: NextRequest) {
  try {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est admin avec authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 SÉCURITÉ : Validation stricte du paramètre filter (protection path traversal)
    const filterParam = req.nextUrl.searchParams.get("filter") || "all";

    // Vérifier que le paramètre est dans la whitelist
    if (!ALLOWED_LOG_TYPES.includes(filterParam as LogType)) {
      return NextResponse.json(
        { error: "Invalid filter parameter" },
        { status: 400 }
      );
    }

    const filter = filterParam as LogType;
    const date = new Date().toISOString().split("T")[0];

    // Mapping sécurisé des types de logs
    const logTypeMap: Record<LogType, string> = {
      all: "app",
      error: "error",
      http: "http",
      business: "business",
    };

    const filename = logTypeMap[filter];
    const logPath = join(process.cwd(), "logs", `${filename}-${date}.log`);

    try {
      const content = await readFile(logPath, "utf-8");
      const lines = content.split("\n").filter(line => line.trim()).slice(-100); // 100 dernières lignes

      return NextResponse.json(lines);
    } catch (error) {
      // Si le fichier n'existe pas, retourner un tableau vide
      return NextResponse.json([]);
    }
  } catch (error) {
    // Note: Utiliser un logger approprié en production (Sentry, Winston, etc.)
    if (process.env.NODE_ENV === "development") {
      console.error("Error reading logs:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
