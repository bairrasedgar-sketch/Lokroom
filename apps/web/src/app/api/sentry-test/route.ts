export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 🔒 SÉCURITÉ : Désactiver en production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  // Simulate an error
  throw new Error("Test error from API route - This is intentional for Sentry testing");
}
