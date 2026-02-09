export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Simulate an error
  throw new Error("Test error from API route - This is intentional for Sentry testing");
}
