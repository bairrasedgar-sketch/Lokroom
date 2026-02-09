import { logger, httpLogger, businessLogger } from "./config";

export class LoggerService {
  // Logs généraux
  info(message: string, meta?: any) {
    logger.info(message, meta);
  }

  warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    logger.error(message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
    });
  }

  debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  // Logs HTTP
  logRequest(req: Request, duration: number, statusCode: number) {
    httpLogger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });
  }

  // Logs métier
  logBookingCreated(bookingId: string, userId: string, listingId: string, amount: number) {
    businessLogger.info("Booking Created", {
      event: "booking.created",
      bookingId,
      userId,
      listingId,
      amount,
    });
  }

  logPaymentSucceeded(paymentId: string, amount: number, userId: string) {
    businessLogger.info("Payment Succeeded", {
      event: "payment.succeeded",
      paymentId,
      amount,
      userId,
    });
  }

  logUserRegistered(userId: string, email: string, method: string) {
    businessLogger.info("User Registered", {
      event: "user.registered",
      userId,
      email,
      method,
    });
  }

  logListingCreated(listingId: string, ownerId: string, category: string) {
    businessLogger.info("Listing Created", {
      event: "listing.created",
      listingId,
      ownerId,
      category,
    });
  }

  // Logs de sécurité
  logSecurityEvent(event: string, userId?: string, ip?: string, details?: any) {
    logger.warn("Security Event", {
      event,
      userId,
      ip,
      ...details,
    });
  }

  // Logs de performance
  logSlowQuery(query: string, duration: number, params?: any) {
    logger.warn("Slow Query", {
      query,
      duration: `${duration}ms`,
      params,
    });
  }
}

export const log = new LoggerService();
