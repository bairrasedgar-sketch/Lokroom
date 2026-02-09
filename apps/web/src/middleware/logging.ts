import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger/service";

export async function loggingMiddleware(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const start = Date.now();

  try {
    const response = await handler();
    const duration = Date.now() - start;

    log.logRequest(req, duration, response.status);

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    log.error("Request failed", error as Error, {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
    });
    throw error;
  }
}
