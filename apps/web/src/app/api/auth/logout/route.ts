import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    // Supprime le cookie de session
    cookies().delete("session");

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to logout", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "LOGOUT_FAILED",
        message: "Failed to logout. Please try again."
      },
      { status: 500 }
    );
  }
}
